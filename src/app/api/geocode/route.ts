import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query || query.length < 2 || query.length > 100) {
    return NextResponse.json({ error: "Search for a place using at least two characters." }, { status: 400 });
  }

  const upstream = new URL("https://geocoding-api.open-meteo.com/v1/search");
  upstream.search = new URLSearchParams({ name: query, count: "7", language: "en", format: "json" }).toString();

  try {
    const response = await fetch(upstream, { headers: { Accept: "application/json" } });
    if (!response.ok) {
      return NextResponse.json({ error: "The location provider could not complete this search." }, { status: response.status });
    }
    const data: unknown = await response.json();
    return NextResponse.json(data, { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" } });
  } catch {
    return NextResponse.json({ error: "Could not connect to the location provider." }, { status: 502 });
  }
}
