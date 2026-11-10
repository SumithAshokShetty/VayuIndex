import { NextResponse } from "next/server";
import { getAirQuality } from "@/lib/api-orchestrator";

export const runtime = "nodejs";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store, max-age=0" } });
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  // lat/lng are the public API parameters. Keep latitude/longitude as aliases
  // while the current dashboard is migrated to the shorter names.
  const rawLatitude = params.get("lat") ?? params.get("latitude");
  const rawLongitude = params.get("lng") ?? params.get("longitude");
  const latitude = rawLatitude === null ? NaN : Number(rawLatitude);
  const longitude = rawLongitude === null ? NaN : Number(rawLongitude);

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return json({ error: "Provide valid lat and lng query parameters." }, 400);
  }

  try {
    const data = await getAirQuality({ latitude, longitude });
    return json(data);
  } catch {
    return json({ error: "No air quality source is responding right now." }, 502);
  }
}
