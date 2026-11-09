import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const latitude = Number(params.get("lat"));
  const longitude = Number(params.get("lng"));
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return NextResponse.json({ error: "Provide valid lat and lng query parameters." }, { status: 400 });
  }
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.search = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), current: "temperature_2m,wind_speed_10m,wind_direction_10m", wind_speed_unit: "kmh", timezone: "auto" }).toString();
    const response = await fetch(url, { signal: AbortSignal.timeout(7000), headers: { Accept: "application/json" } });
    if (!response.ok) return NextResponse.json({ error: "Open-Meteo weather data is unavailable." }, { status: 502 });
    const data = await response.json() as { current?: unknown; current_units?: unknown; timezone?: unknown };
    return NextResponse.json(data, { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200" } });
  } catch {
    return NextResponse.json({ error: "Open-Meteo weather data is unavailable." }, { status: 502 });
  }
}
