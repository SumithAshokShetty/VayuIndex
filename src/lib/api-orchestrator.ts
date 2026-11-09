import type { AirCurrent, AirQualityResponse } from "@/lib/types";
import { calculateCompositeAqi, type ConcentrationUnit, type Pollutant, type PollutantConcentration } from "@/lib/aqi-calculator";

const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_STATION_AGE_MS = 6 * 60 * 60 * 1000;
const MAX_NEARBY_RADIUS_METERS = 25_000;
const POLLUTANTS = ["pm2_5", "pm10", "ozone", "nitrogen_dioxide", "sulphur_dioxide", "carbon_monoxide"] as const;
const MODEL_FIELDS = ["us_aqi", ...POLLUTANTS, "us_aqi_pm2_5", "us_aqi_pm10", "us_aqi_ozone", "us_aqi_nitrogen_dioxide", "us_aqi_sulphur_dioxide", "us_aqi_carbon_monoxide"];

type Coordinates = { latitude: number; longitude: number };
type OpenAQSensor = { id: number; parameter?: { name?: string; displayName?: string; units?: string } };
type OpenAQLocation = {
  id: number;
  name?: string | null;
  locality?: string | null;
  timezone?: string;
  isMobile?: boolean;
  provider?: { name?: string };
  licenses?: { name?: string; attribution?: { name?: string; url?: string | null } }[];
  coordinates?: { latitude?: number | null; longitude?: number | null };
  sensors?: OpenAQSensor[];
};
type OpenAQLatest = { value: number; datetime?: { utc?: string; local?: string }; sensorsId: number };
type WAQIFeed = {
  status?: string;
  data?: {
    aqi?: number | string;
    time?: { iso?: string; s?: string };
    city?: { name?: string; url?: string; geo?: string[] };
    station?: { name?: string; url?: string };
    attributions?: { name?: string; url?: string }[];
  };
};
type OpenMeteoPayload = {
  latitude: number;
  longitude: number;
  timezone: string;
  current: Record<string, number | string | null> & { time: string; us_aqi?: number | null };
  current_units?: Record<string, string>;
};

type CacheEntry = { expiresAt: number; value: AirQualityResponse };
// Edge workers can be reused across requests, but this cache is instance-local
// and best-effort. It is not a shared/distributed cache across deployments.
const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<AirQualityResponse>>();

/** Safe readiness flags; never returns credential values. */
export function getProviderConfiguration() {
  return {
    openAqConfigured: Boolean(process.env.OPENAQ_API_KEY),
    waqiConfigured: Boolean(process.env.WAQI_API_KEY || process.env.WAQI_API_TOKEN),
    groqConfigured: Boolean(process.env.GROQ_API_KEY),
  };
}

function cacheKey({ latitude, longitude }: Coordinates) {
  return `${latitude.toFixed(4)}:${longitude.toFixed(4)}`;
}

function getCached(key: string): AirQualityResponse | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function storeCache(key: string, value: AirQualityResponse) {
  // WAQI terms prohibit caching or archiving WAQI data; only cache OpenAQ and
  // Open-Meteo results. Expired entries are also pruned to bound memory use.
  if (value.provider === "waqi") return;
  const now = Date.now();
  for (const [entryKey, entry] of cache) if (entry.expiresAt <= now) cache.delete(entryKey);
  cache.set(key, { expiresAt: now + CACHE_TTL_MS, value });
}

function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(bLat - aLat);
  const dLon = radians(bLon - aLon);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(radians(aLat)) * Math.cos(radians(bLat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function parameterField(name: string | undefined): (typeof POLLUTANTS)[number] | null {
  const normalized = (name ?? "").toLowerCase().replace(/[._\s-]/g, "");
  if (normalized === "pm25") return "pm2_5";
  if (normalized === "pm10") return "pm10";
  if (normalized === "o3" || normalized === "ozone") return "ozone";
  if (normalized === "no2" || normalized === "nitrogendioxide") return "nitrogen_dioxide";
  if (normalized === "so2" || normalized === "sulfurdioxide" || normalized === "sulphurdioxide") return "sulphur_dioxide";
  if (normalized === "co" || normalized === "carbonmonoxide") return "carbon_monoxide";
  return null;
}

async function fetchOpenAQ({ latitude, longitude }: Coordinates, apiKey: string): Promise<AirQualityResponse | null> {
  const locationsUrl = new URL("https://api.openaq.org/v3/locations");
  locationsUrl.search = new URLSearchParams({ coordinates: `${latitude},${longitude}`, radius: String(MAX_NEARBY_RADIUS_METERS), limit: "100" }).toString();
  const headers = { "X-API-Key": apiKey, Accept: "application/json" };
  const locationsResponse = await fetch(locationsUrl, { headers, cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!locationsResponse.ok) throw new Error(`OpenAQ locations request returned ${locationsResponse.status}.`);
  const locationPayload = await locationsResponse.json() as { results?: OpenAQLocation[] };
  const candidates = (locationPayload.results ?? [])
    .filter((location) => !location.isMobile && (location.sensors?.length ?? 0) > 0 && Number.isFinite(location.coordinates?.latitude) && Number.isFinite(location.coordinates?.longitude))
    .sort((a, b) => haversineKm(latitude, longitude, a.coordinates!.latitude!, a.coordinates!.longitude!) - haversineKm(latitude, longitude, b.coordinates!.latitude!, b.coordinates!.longitude!))
    .slice(0, 5);

  for (const location of candidates) {
    const latestUrl = new URL(`https://api.openaq.org/v3/locations/${location.id}/latest`);
    latestUrl.searchParams.set("limit", "100");
    const latestResponse = await fetch(latestUrl, { headers, cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!latestResponse.ok) continue;
    const latestPayload = await latestResponse.json() as { results?: OpenAQLatest[] };
    const sensors = new Map((location.sensors ?? []).map((sensor) => [sensor.id, sensor]));
    const now = Date.now();
    const readings = (latestPayload.results ?? [])
      .filter((item) => Number.isFinite(item.value) && item.datetime?.utc && now - Date.parse(item.datetime.utc) <= MAX_STATION_AGE_MS && Date.parse(item.datetime.utc) <= now + 5 * 60 * 1000)
      .sort((a, b) => Date.parse(b.datetime!.utc!) - Date.parse(a.datetime!.utc!));
    const current = {} as Record<(typeof POLLUTANTS)[number], number | null>;
    const units: Record<string, string> = {};
    const measurementTimes: Record<string, string> = {};
    const newestByField = new Set<string>();
    for (const reading of readings) {
      const sensor = sensors.get(reading.sensorsId);
      const field = parameterField(sensor?.parameter?.name ?? sensor?.parameter?.displayName);
      if (!field || newestByField.has(field)) continue;
      newestByField.add(field);
      current[field] = reading.value;
      units[field] = sensor?.parameter?.units ?? "";
      measurementTimes[field] = reading.datetime?.local ?? reading.datetime?.utc ?? "";
    }
    for (const field of POLLUTANTS) current[field] ??= null;
    if (!POLLUTANTS.some((field) => current[field] !== null)) continue;

    const concentrations: Partial<Record<Pollutant, PollutantConcentration>> = {};
    if (typeof current.pm2_5 === "number" && Number.isFinite(current.pm2_5)) {
      concentrations.pm2_5 = { value: current.pm2_5, unit: (units.pm2_5 as ConcentrationUnit) || "µg/m³" };
    }
    if (typeof current.pm10 === "number" && Number.isFinite(current.pm10)) {
      concentrations.pm10 = { value: current.pm10, unit: (units.pm10 as ConcentrationUnit) || "µg/m³" };
    }
    if (typeof current.nitrogen_dioxide === "number" && Number.isFinite(current.nitrogen_dioxide)) {
      concentrations.no2 = { value: current.nitrogen_dioxide, unit: (units.nitrogen_dioxide as ConcentrationUnit) || "ppb" };
    }
    if (typeof current.sulphur_dioxide === "number" && Number.isFinite(current.sulphur_dioxide)) {
      concentrations.so2 = { value: current.sulphur_dioxide, unit: (units.sulphur_dioxide as ConcentrationUnit) || "ppb" };
    }
    if (typeof current.carbon_monoxide === "number" && Number.isFinite(current.carbon_monoxide)) {
      concentrations.co = { value: current.carbon_monoxide, unit: (units.carbon_monoxide as ConcentrationUnit) || "ppm" };
    }
    if (typeof current.ozone === "number" && Number.isFinite(current.ozone)) {
      concentrations.o3 = { value: current.ozone, unit: (units.ozone as ConcentrationUnit) || "ppm" };
    }

    const aqiResult = calculateCompositeAqi(concentrations, "epa");

    const newest = readings[0];
    const distanceKm = haversineKm(latitude, longitude, location.coordinates!.latitude!, location.coordinates!.longitude!);
    const stationName = [location.name, location.locality].filter(Boolean).join(", ") || "OpenAQ monitoring location";
    const currentData: AirCurrent = {
      ...current,
      time: newest?.datetime?.local ?? newest?.datetime?.utc ?? new Date().toISOString(),
      aqi: aqiResult.aqi,
      us_aqi_pm2_5: aqiResult.subIndices.pm2_5?.value ?? null,
      us_aqi_pm10: aqiResult.subIndices.pm10?.value ?? null,
      us_aqi_ozone: aqiResult.subIndices.o3?.value ?? null,
      us_aqi_nitrogen_dioxide: aqiResult.subIndices.no2?.value ?? null,
      us_aqi_sulphur_dioxide: aqiResult.subIndices.so2?.value ?? null,
      us_aqi_carbon_monoxide: aqiResult.subIndices.co?.value ?? null,
    };
    return {
      provider: "openaq",
      provenance: "station-observation",
      sourceLabel: "OpenAQ station observation",
      sourceUrl: "https://docs.openaq.org/",
      stationName,
      stationUrl: `https://explore.openaq.org/locations/${location.id}`,
      stationLatitude: location.coordinates!.latitude!,
      stationLongitude: location.coordinates!.longitude!,
      fallbackNote: aqiResult.aqi !== null
        ? `Nearest station · ${distanceKm.toFixed(1)} km away. Calculated US EPA AQI from station sensor observations.`
        : `Nearest station · ${distanceKm.toFixed(1)} km away. AQI is not supplied by this measurement feed.`,
      attribution: [
        { name: "OpenAQ", url: "https://openaq.org/" },
        ...(location.provider?.name ? [{ name: location.provider.name }] : []),
        ...(location.licenses ?? []).flatMap((license) => license.attribution?.name ? [{ name: license.attribution.name, url: license.attribution.url ?? undefined }] : license.name ? [{ name: license.name }] : []),
      ],
      latitude,
      longitude,
      timezone: location.timezone ?? "UTC",
      current: currentData,
      current_units: units,
      measurementTimes,
    };
  }
  return null;
}

async function fetchWAQI({ latitude, longitude }: Coordinates, token: string): Promise<AirQualityResponse | null> {
  const feedUrl = new URL(`https://api.waqi.info/feed/geo:${latitude};${longitude}/`);
  feedUrl.searchParams.set("token", token);
  const response = await fetch(feedUrl, { cache: "no-store", signal: AbortSignal.timeout(8000), headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`WAQI feed request returned ${response.status}.`);
  const payload = await response.json() as WAQIFeed;
  const data = payload.data;
  const aqi = data?.aqi === undefined ? NaN : Number(data.aqi);
  if (payload.status !== "ok" || !data || !Number.isFinite(aqi)) return null;
  const stationName = data.station?.name ?? data.city?.name ?? "Nearby WAQI station";
  const stationUrl = data.station?.url ?? data.city?.url;
  const stationLatitude = Number(data.city?.geo?.[0]);
  const stationLongitude = Number(data.city?.geo?.[1]);
  const attribution = (data.attributions ?? []).filter((item) => item.name).map((item) => ({ name: item.name!, url: item.url }));
  if (attribution.length === 0) return null;
  if (!attribution.some((item) => /world air quality index|waqi/i.test(item.name))) attribution.push({ name: "World Air Quality Index Project (WAQI)", url: "https://waqi.info/" });
  const current = Object.fromEntries(POLLUTANTS.map((field) => [field, null])) as Record<(typeof POLLUTANTS)[number], null>;
  const currentData: AirCurrent = {
    ...current,
    time: data.time?.iso ?? data.time?.s ?? new Date().toISOString(),
    aqi,
    us_aqi_pm2_5: null,
    us_aqi_pm10: null,
    us_aqi_ozone: null,
    us_aqi_nitrogen_dioxide: null,
    us_aqi_sulphur_dioxide: null,
    us_aqi_carbon_monoxide: null,
  };
  return {
    provider: "waqi",
    provenance: "station-observation",
    sourceLabel: "WAQI station index",
    sourceUrl: "https://aqicn.org/api/",
    stationName,
    stationUrl,
    ...(Number.isFinite(stationLatitude) && Number.isFinite(stationLongitude) ? { stationLatitude, stationLongitude } : {}),
    fallbackNote: "Station AQI from WAQI. Concentration values are not shown because this feed does not provide unit metadata for them.",
    attribution,
    latitude,
    longitude,
    timezone: "UTC",
    current: currentData,
    current_units: {},
  };
}

async function fetchOpenMeteo({ latitude, longitude }: Coordinates): Promise<AirQualityResponse> {
  const url = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
  url.search = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), current: MODEL_FIELDS.join(","), timezone: "auto" }).toString();
  const response = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`Open-Meteo request returned ${response.status}.`);
  const data = await response.json() as OpenMeteoPayload;
  const current: AirCurrent = { ...data.current, aqi: data.current.us_aqi ?? null };
  return {
    provider: "open-meteo",
    provenance: "modeled-estimate",
    sourceLabel: "CAMS model estimate · Open-Meteo",
    sourceUrl: "https://open-meteo.com/en/docs/air-quality-api",
    fallbackNote: "Spatial model estimate, not a station observation.",
    attribution: [{ name: "Open-Meteo", url: "https://open-meteo.com/" }, { name: "Copernicus Atmosphere Monitoring Service (CAMS)", url: "https://atmosphere.copernicus.eu/" }],
    latitude: data.latitude,
    longitude: data.longitude,
    timezone: data.timezone,
    current,
    current_units: data.current_units ?? {},
  };
}

async function loadAirQuality(coordinates: Coordinates): Promise<AirQualityResponse> {
  const openAQKey = process.env.OPENAQ_API_KEY;
  const waqiKey = process.env.WAQI_API_KEY || process.env.WAQI_API_TOKEN;
  let openAQFailed = false;
  let waqiFailed = false;

  if (openAQKey) {
    try {
      const station = await fetchOpenAQ(coordinates, openAQKey);
      if (station && station.current.aqi !== null) return station;
      if (station && !waqiKey) return station;
      if (station && waqiKey) {
        try {
          const waqiStation = await fetchWAQI(coordinates, waqiKey);
          if (waqiStation && waqiStation.current.aqi !== null) {
            return {
              ...station,
              current: {
                ...station.current,
                aqi: waqiStation.current.aqi,
              },
              fallbackNote: `Station observations from ${station.stationName}. AQI supplied by ${waqiStation.stationName} (WAQI).`,
              attribution: [
                ...station.attribution,
                ...waqiStation.attribution,
              ],
            };
          }
        } catch {}
        return station;
      }
    } catch {
      openAQFailed = true;
    }
  }

  if (waqiKey) {
    try {
      const station = await fetchWAQI(coordinates, waqiKey);
      if (station) return {
        ...station,
        fallbackNote: openAQKey ? "No fresh nearby OpenAQ reading was available; showing the WAQI station index." : station.fallbackNote,
      };
    } catch {
      waqiFailed = true;
    }
  }

  const model = await fetchOpenMeteo(coordinates);
  const configuredKeys = [openAQKey && "OpenAQ", waqiKey && "WAQI"].filter(Boolean);
  let fallbackNote = "No API keys configured for station feeds; showing the Open-Meteo model estimate.";
  if (configuredKeys.length && (openAQFailed || waqiFailed)) fallbackNote = "A station feed was unavailable; showing the Open-Meteo model estimate.";
  else if (configuredKeys.length) fallbackNote = "No fresh nearby station reading was available; showing the Open-Meteo model estimate.";
  return { ...model, fallbackNote };
}

/** OpenAQ → WAQI → Open-Meteo with per-isolate, 10-minute permitted-source cache. */
export async function getAirQuality(coordinates: Coordinates): Promise<AirQualityResponse> {
  const key = cacheKey(coordinates);
  const cached = getCached(key);
  if (cached) return cached;
  const pending = inFlight.get(key);
  if (pending) return pending;

  const request = loadAirQuality(coordinates).then((result) => {
    storeCache(key, result);
    return result;
  }).finally(() => inFlight.delete(key));
  inFlight.set(key, request);
  return request;
}
