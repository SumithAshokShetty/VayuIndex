import { NextResponse } from "next/server";

export const runtime = "edge";

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  suburb?: string;
  neighbourhood?: string;
  borough?: string;
  municipality?: string;
  county?: string;
  state?: string;
  province?: string;
  region?: string;
  state_district?: string;
  country?: string;
}

interface BigDataCloudResponse {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  countryName?: string;
}

async function reverseGeocode(lat: number, lng: number) {
  // 1. Primary: OpenStreetMap Nominatim Reverse Geocoding (Enforcing English)
  try {
    const upstream = new URL("https://nominatim.openstreetmap.org/reverse");
    upstream.search = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: "json",
      zoom: "14",
      addressdetails: "1",
      namedetails: "1",
      "accept-language": "en",
    }).toString();

    const res = await fetch(upstream, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "en,en-US;q=0.9",
        "User-Agent": "VayuIndex/1.0 (https://vayuindex.app)",
      },
      signal: AbortSignal.timeout(3500),
    });

    if (res.ok) {
      const data = (await res.json()) as {
        address?: NominatimAddress;
        name?: string;
        namedetails?: Record<string, string>;
        display_name?: string;
      };
      const addr = data.address || {};
      const englishName =
        data.namedetails?.["name:en"] ||
        data.namedetails?.["int_name"] ||
        addr.city ||
        addr.town ||
        addr.village ||
        addr.suburb ||
        addr.borough ||
        addr.municipality ||
        addr.county ||
        data.name;
      const admin = addr.state || addr.province || addr.region || addr.state_district || "";
      const country = addr.country || "";

      if (englishName) {
        return {
          name: englishName,
          admin,
          country,
          latitude: lat,
          longitude: lng,
          displayName: [englishName, admin, country].filter(Boolean).join(", "),
        };
      }
    }
  } catch {}

  // 2. Fallback: BigDataCloud Reverse Geocode Client API
  try {
    const upstream = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
    upstream.search = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lng),
      localityLanguage: "en",
    }).toString();

    const res = await fetch(upstream, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(3500),
    });

    if (res.ok) {
      const data = (await res.json()) as BigDataCloudResponse;
      const name = data.locality || data.city || data.principalSubdivision;
      const admin = data.principalSubdivision || "";
      const country = data.countryName || "";

      if (name) {
        return {
          name,
          admin,
          country,
          latitude: lat,
          longitude: lng,
          displayName: [name, admin, country].filter(Boolean).join(", "),
        };
      }
    }
  } catch {}

  // 3. Fallback: Clean formatted coordinates if remote or unlisted
  const latDir = lat >= 0 ? "N" : "S";
  const lngDir = lng >= 0 ? "E" : "W";
  const formattedCoords = `${Math.abs(lat).toFixed(2)}° ${latDir}, ${Math.abs(lng).toFixed(2)}° ${lngDir}`;
  return {
    name: formattedCoords,
    admin: "Coordinates",
    country: "",
    latitude: lat,
    longitude: lng,
    displayName: formattedCoords,
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const latStr = url.searchParams.get("lat") ?? url.searchParams.get("latitude");
  const lngStr = url.searchParams.get("lng") ?? url.searchParams.get("longitude") ?? url.searchParams.get("lon");

  // Handle Reverse Geocoding
  if (latStr !== null && lngStr !== null) {
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (!Number.isNaN(lat) && !Number.isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      const place = await reverseGeocode(lat, lng);
      return NextResponse.json(place, {
        headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
      });
    }
  }

  // Handle Forward Search Geocoding
  const query = url.searchParams.get("q")?.trim();
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
