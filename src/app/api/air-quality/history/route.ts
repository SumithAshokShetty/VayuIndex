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
  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    hourly: "pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide,ozone,carbon_monoxide,us_aqi",
    past_days: String(targetDays),
    forecast_days: "0",
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
    return NextResponse.json(
      {
        ...payload,
        provenance: "modeled-historical",
        source: "Open-Meteo Air Quality · CAMS model archive",
      },
      {
        headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800" },
      }
    );
  } catch {
    return error("Could not connect to the Open-Meteo historical air quality service.", 502);
  }
}
