import { NextResponse } from "next/server";

export const runtime = "edge";

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const latitude = Number(params.get("lat"));
  const longitude = Number(params.get("lng"));
  const days = Number(params.get("days") ?? "7");

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return error("Provide valid lat and lng query parameters.", 400);
  }

  // Allow 1, 7, 14, 30 days
  const validDays = [1, 7, 14, 30];
  const targetDays = validDays.includes(days) ? days : 7;

  const url = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
  // For 1 day (24-hour rolling window), fetch 2 past days + 1 forecast day so we can slice
  // exactly the 24 or 25 hours ending at the current local hour.
  const pastDaysParam = targetDays === 1 ? "2" : String(targetDays);
  const forecastDaysParam = targetDays === 1 ? "1" : "0";

  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    hourly: "pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide,ozone,carbon_monoxide,us_aqi",
    past_days: pastDaysParam,
    forecast_days: forecastDaysParam,
    timezone: "auto",
  }).toString();

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(12_000),
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return error("Open-Meteo historical air quality data is unavailable.", 502);
    }

    const payload = await response.json();

    // Slicing for Rolling 24-Hour window ending at current time
    if (targetDays === 1 && payload?.hourly?.time?.length) {
      const times: string[] = payload.hourly.time;
      const now = new Date();
      // Find the index of the hour closest to or immediately preceding the current time
      let currentHourIndex = times.findIndex((t) => new Date(t).getTime() > now.getTime()) - 1;
      if (currentHourIndex < 0) {
        currentHourIndex = times.length - 1;
      }
      // Exact rolling 24-hour window (25 hourly points from [now - 24h] to [now])
      const startIndex = Math.max(0, currentHourIndex - 24);
      const endIndex = currentHourIndex + 1;

      const slicedHourly: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(payload.hourly)) {
        if (Array.isArray(val)) {
          slicedHourly[key] = val.slice(startIndex, endIndex);
        } else {
          slicedHourly[key] = val;
        }
      }
      payload.hourly = slicedHourly;
    }

    return NextResponse.json(
      {
        ...payload,
        provenance: "modeled-historical",
        source: "Open-Meteo Air Quality · CAMS model archive",
      },
      {
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" },
      }
    );
  } catch {
    return error("Could not connect to the Open-Meteo historical air quality service.", 502);
  }
}
