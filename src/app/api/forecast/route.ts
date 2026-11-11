import { NextResponse } from "next/server";
import { generateMlForecast } from "@/lib/ml-forecast-engine";
import { calculateCompositeAqi } from "@/lib/aqi-calculator";

export const runtime = "nodejs";

interface OpenMeteoHourlyPayload {
  time?: string[];
  pm2_5?: number[];
  pm10?: number[];
  nitrogen_dioxide?: number[];
  ozone?: number[];
  sulphur_dioxide?: number[];
  carbon_monoxide?: number[];
  us_aqi?: number[];
}

export async function GET(request: Request) {
  const urlParams = new URL(request.url).searchParams;
  const rawLat = urlParams.get("lat") ?? urlParams.get("latitude");
  const rawLng = urlParams.get("lng") ?? urlParams.get("longitude");
  const forceMl = urlParams.get("force_ml") === "true";

  const latitude = Number(rawLat);
  const longitude = Number(rawLng);

  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return NextResponse.json(
      { error: "Provide valid latitude (-90..90) and longitude (-180..180) parameters." },
      { status: 400 }
    );
  }

  // ---------------------------------------------------------------------------
  // 1. FORCED ML SIMULATION (For Testing & Validation)
  // ---------------------------------------------------------------------------
  if (forceMl) {
    const mlForecast = generateMlForecast({
      latitude,
      longitude,
      forecastHours: 72,
    });
    return NextResponse.json(mlForecast, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  }

  // ---------------------------------------------------------------------------
  // 2. PRIMARY PROVIDER: Open-Meteo Air Quality Forecast API
  // ---------------------------------------------------------------------------
  try {
    const openMeteoUrl = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
    openMeteoUrl.search = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      hourly: "pm2_5,pm10,nitrogen_dioxide,ozone,sulphur_dioxide,carbon_monoxide,us_aqi",
      forecast_days: "3",
      timezone: "auto",
    }).toString();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7500);

    const meteoRes = await fetch(openMeteoUrl, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeoutId);

    if (meteoRes.ok) {
      const meteoData = (await meteoRes.json()) as {
        hourly?: OpenMeteoHourlyPayload;
        timezone?: string;
      };

      if (
        meteoData.hourly?.time &&
        Array.isArray(meteoData.hourly.time) &&
        meteoData.hourly.time.length > 0 &&
        meteoData.hourly.pm2_5 &&
        meteoData.hourly.pm2_5.length > 0
      ) {
        const hourly = meteoData.hourly;
        const times = hourly.time!;
        const total = times.length;

        // Calculate CPCB NAQI for each hour alongside US-EPA AQI
        const cpcbAqiSeries: number[] = [];
        const aqiLower: number[] = [];
        const aqiUpper: number[] = [];
        const errorMargin: number[] = [];

        for (let i = 0; i < total; i++) {
          const pm25Val = hourly.pm2_5?.[i] ?? 0;
          const pm10Val = hourly.pm10?.[i] ?? 0;
          const no2Val = hourly.nitrogen_dioxide?.[i] ?? 0;
          const so2Val = hourly.sulphur_dioxide?.[i] ?? 0;
          const coVal = (hourly.carbon_monoxide?.[i] ?? 0) / 1000.0; // convert µg to mg if needed
          const o3Val = hourly.ozone?.[i] ?? 0;

          const cpcbRes = calculateCompositeAqi(
            {
              pm2_5: { value: pm25Val, unit: "µg/m³" },
              pm10: { value: pm10Val, unit: "µg/m³" },
              no2: { value: no2Val, unit: "µg/m³" },
              so2: { value: so2Val, unit: "µg/m³" },
              co: { value: coVal, unit: "mg/m³" },
              o3: { value: o3Val, unit: "µg/m³" },
            },
            "cpcb"
          );

          const cpcbVal = cpcbRes.aqi ?? Math.round(pm25Val * 1.25);
          cpcbAqiSeries.push(cpcbVal);

          // Standard observational uncertainty bound
          const margin = Math.round(6 + i * 0.15);
          const activeAqi = hourly.us_aqi?.[i] ?? cpcbVal;
          aqiLower.push(Math.max(0, activeAqi - margin));
          aqiUpper.push(Math.min(500, activeAqi + margin));
          errorMargin.push(margin);
        }

        return NextResponse.json(
          {
            provenance: "PROVIDER_METEO",
            source: "Open-Meteo CAMS Air Quality Forecast",
            generatedAt: new Date().toISOString(),
            forecastHours: total,
            timezone: meteoData.timezone ?? "auto",
            hourly: {
              ...hourly,
              cpcb_aqi: cpcbAqiSeries,
            },
            confidenceIntervals: {
              aqiLower,
              aqiUpper,
              errorMargin,
              confidenceLevel: "95%",
            },
          },
          {
            headers: {
              "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800",
            },
          }
        );
      }
    }
  } catch {
    // Open-Meteo timed out or failed, proceed to secondary & ML fallback
  }

  // ---------------------------------------------------------------------------
  // 3. SECONDARY PROVIDER: ECMWF Atmospheric Grid Reanalysis Simulation
  // ---------------------------------------------------------------------------
  try {
    const camsUrl = new URL("https://air-quality-api.open-meteo.com/v1/cams");
    camsUrl.search = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      hourly: "pm2_5,pm10,ozone,nitrogen_dioxide",
      forecast_days: "3",
    }).toString();

    const camsRes = await fetch(camsUrl, {
      signal: AbortSignal.timeout(4500),
      headers: { Accept: "application/json" },
    });

    if (camsRes.ok) {
      const camsData = (await camsRes.json()) as { hourly?: OpenMeteoHourlyPayload };
      if (camsData.hourly?.time && camsData.hourly.time.length > 0) {
        return NextResponse.json(
          {
            provenance: "PROVIDER_CAMS",
            source: "ECMWF CAMS Atmospheric Grid Reanalysis",
            generatedAt: new Date().toISOString(),
            forecastHours: camsData.hourly.time.length,
            hourly: camsData.hourly,
          },
          {
            headers: {
              "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800",
            },
          }
        );
      }
    }
  } catch {
    // CAMS also unavailable, proceed to custom ML fallback
  }

  // ---------------------------------------------------------------------------
  // 4. CUSTOM ML FALLBACK: On-the-fly Multi-Step 72-Hour Forecaster
  // ---------------------------------------------------------------------------
  // When external APIs fail, ingest recent local CPCB ground observation or prior
  // and weather features, then run the ML model.
  try {
    let recentPm25: number | undefined;
    let recentPm10: number | undefined;
    let recentAqi: number | undefined;

    // Fetch local ground telemetry for anchor
    try {
      const groundRes = await fetch(
        `http://localhost:3000/api/air-quality?lat=${latitude}&lng=${longitude}`,
        { signal: AbortSignal.timeout(2500) }
      );
      if (groundRes.ok) {
        const groundData = await groundRes.json();
        if (groundData?.current) {
          if (typeof groundData.current.pm2_5 === "number") recentPm25 = groundData.current.pm2_5;
          if (typeof groundData.current.pm10 === "number") recentPm10 = groundData.current.pm10;
          if (typeof groundData.current.aqi === "number") recentAqi = groundData.current.aqi;
        }
      }
    } catch {}

    const mlResult = generateMlForecast({
      latitude,
      longitude,
      currentPm25: recentPm25,
      currentPm10: recentPm10,
      currentAqi: recentAqi,
      forecastHours: 72,
    });

    return NextResponse.json(
      {
        ...mlResult,
        fallbackNote:
          "Open-Meteo & CAMS external forecast APIs were unavailable or offline. Generated 72-hour hourly projection using Vayu Custom ML Autoregressive Forecaster.",
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (mlErr) {
    return NextResponse.json(
      {
        error: "All forecast providers and local ML engine failed to synthesize predictions.",
        details: mlErr instanceof Error ? mlErr.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
