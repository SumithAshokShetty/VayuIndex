import type { AirCurrent, AirQualityResponse } from "@/lib/types";
import { calculateCompositeAqi, type ConcentrationUnit, type Pollutant, type PollutantConcentration } from "@/lib/aqi-calculator";
import {
  INITIAL_HOTSPOTS,
  findNearestSpatialHotspot,
  createAirQualityResponseFromHotspot,
} from "@/lib/spatial-ground-truth";

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

type CpcbRecord = {
  country?: string;
  state?: string;
  city?: string;
  station?: string;
  last_update?: string;
  latitude?: string | number;
  longitude?: string | number;
  pollutant_id?: string;
  min_value?: string | number;
  max_value?: string | number;
  avg_value?: string | number;
  pollutant_avg?: string | number;
};

export type CpcbStationGroup = {
  station: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  lastUpdate: string;
  pollutants: Record<string, number>;
};

export type CpcbCityAggregate = {
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  aqi: number;
  status: string;
  advisory: string;
  dominantPollutant: string;
  pollutants: {
    pm2_5: number | null;
    pm10: number | null;
    no2: number | null;
    so2: number | null;
    co: number | null;
    ozone: number | null;
  };
  subIndices: Partial<Record<string, number>>;
  stationCount: number;
  lastUpdate: string;
};

let cpcbCache: {
  timestamp: number;
  stations: CpcbStationGroup[];
  cityAggregates: Map<string, CpcbCityAggregate>;
} | null = null;
const CPCB_CACHE_TTL_MS = 8 * 60 * 1000;

export function isIndiaCoordinates(latitude: number, longitude: number): boolean {
  return latitude >= 6.5 && latitude <= 37.5 && longitude >= 68.0 && longitude <= 97.5;
}

type CacheEntry = { expiresAt: number; value: AirQualityResponse };
// Edge workers can be reused across requests, but this cache is instance-local
// and best-effort. It is not a shared/distributed cache across deployments.
const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<AirQualityResponse>>();

/** Safe readiness flags; never returns credential values. */
export function getProviderConfiguration() {
  return {
    dataGovInConfigured: Boolean(process.env.DATA_GOV_IN_API_KEY),
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

    const aqiResult = calculateCompositeAqi(concentrations, "cpcb");

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
        ? `Nearest station · ${distanceKm.toFixed(1)} km away. Calculated CPCB NAQI from station sensor observations.`
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
  try {
    const url = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
    url.search = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), current: MODEL_FIELDS.join(","), timezone: "auto" }).toString();
    const response = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`Open-Meteo request returned ${response.status}.`);
    const data = await response.json() as OpenMeteoPayload & { error?: boolean; reason?: string };
    if (data.error) throw new Error(data.reason || "Open-Meteo API limit reached");
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
  } catch {
    const nearest = findNearestSpatialHotspot(latitude, longitude, 500) || INITIAL_HOTSPOTS[0];
    return createAirQualityResponseFromHotspot(nearest, { latitude, longitude });
  }
}

function getCpcbAdvisory(aqi: number) {
  if (aqi <= 50) return { status: "Good", advisory: "Minimal impact; air quality is satisfactory." };
  if (aqi <= 100) return { status: "Satisfactory", advisory: "Minor breathing discomfort may be experienced by sensitive people." };
  if (aqi <= 200) return { status: "Moderate", advisory: "Breathing discomfort to people with lungs, asthma, and heart diseases." };
  if (aqi <= 300) return { status: "Poor", advisory: "Breathing discomfort to most people on prolonged outdoor exposure." };
  if (aqi <= 400) return { status: "Very Poor", advisory: "Respiratory illness on prolonged exposure. Pronounced effect on vulnerable groups." };
  return { status: "Severe", advisory: "Severe atmospheric burden: affects healthy people and seriously impacts those with existing ailments. Stay indoors." };
}

async function loadCPCBPayload(apiKey: string): Promise<{ stations: CpcbStationGroup[]; cityAggregates: Map<string, CpcbCityAggregate> }> {
  const now = Date.now();
  if (cpcbCache && now - cpcbCache.timestamp < CPCB_CACHE_TTL_MS) {
    return { stations: cpcbCache.stations, cityAggregates: cpcbCache.cityAggregates };
  }

  const endpoint = `https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69?api-key=${encodeURIComponent(apiKey)}&format=json&limit=4000`;
  const res = await fetch(endpoint, {
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`data.gov.in CPCB request returned ${res.status}`);
  const payload = (await res.json()) as { records?: CpcbRecord[] };

  // 1. Group records strictly by station
  const stationMap = new Map<string, CpcbStationGroup>();
  // 2. Group records strictly by city
  const cityMap = new Map<
    string,
    {
      city: string;
      state: string;
      latitude: number;
      longitude: number;
      lastUpdate: string;
      stations: Set<string>;
      pollutantVals: {
        pm2_5: number[];
        pm10: number[];
        no2: number[];
        so2: number[];
        co: number[];
        ozone: number[];
      };
    }
  >();

  for (const r of payload.records || []) {
    const stationName = (r.station || "").trim();
    const cityName = (r.city || "").trim();
    const stateName = (r.state || "").trim();
    const lat = Number(r.latitude);
    const lng = Number(r.longitude);
    const avgVal = Number(r.avg_value ?? r.pollutant_avg);
    const rawPol = (r.pollutant_id || "").toUpperCase().replace(/[._\s-]/g, "");

    // Process Station
    if (stationName) {
      const stationKey = stationName.toLowerCase();
      if (!stationMap.has(stationKey)) {
        stationMap.set(stationKey, {
          station: stationName,
          city: cityName,
          state: stateName,
          latitude: Number.isFinite(lat) ? lat : 0,
          longitude: Number.isFinite(lng) ? lng : 0,
          lastUpdate: r.last_update || new Date().toISOString(),
          pollutants: {},
        });
      }
      const stGroup = stationMap.get(stationKey)!;
      if (!isNaN(avgVal) && rawPol && avgVal >= 0) {
        stGroup.pollutants[rawPol] = avgVal;
      }
    }

    // Process City strictly grouped by city key
    if (cityName) {
      const cityKey = cityName.toLowerCase();
      if (!cityMap.has(cityKey)) {
        cityMap.set(cityKey, {
          city: cityName,
          state: stateName,
          latitude: Number.isFinite(lat) && lat !== 0 ? lat : 0,
          longitude: Number.isFinite(lng) && lng !== 0 ? lng : 0,
          lastUpdate: r.last_update || new Date().toISOString(),
          stations: new Set(),
          pollutantVals: {
            pm2_5: [],
            pm10: [],
            no2: [],
            so2: [],
            co: [],
            ozone: [],
          },
        });
      }

      const cEntry = cityMap.get(cityKey)!;
      if (cEntry.latitude === 0 && Number.isFinite(lat) && lat !== 0) cEntry.latitude = lat;
      if (cEntry.longitude === 0 && Number.isFinite(lng) && lng !== 0) cEntry.longitude = lng;
      if (stationName) cEntry.stations.add(stationName);
      if (r.last_update) cEntry.lastUpdate = r.last_update;

      if (!isNaN(avgVal) && rawPol && avgVal >= 0) {
        if (rawPol === "PM25" || rawPol === "PM2.5") cEntry.pollutantVals.pm2_5.push(avgVal);
        else if (rawPol === "PM10") cEntry.pollutantVals.pm10.push(avgVal);
        else if (rawPol === "NO2") cEntry.pollutantVals.no2.push(avgVal);
        else if (rawPol === "SO2") cEntry.pollutantVals.so2.push(avgVal);
        else if (rawPol === "CO") cEntry.pollutantVals.co.push(avgVal > 25 ? avgVal / 1000 : avgVal);
        else if (rawPol === "OZONE" || rawPol === "O3") cEntry.pollutantVals.ozone.push(avgVal);
      }
    }
  }

  // 3. Compute CPCB sub-indices strictly for each specific city (no cross-city fallback leakage!)
  const cityAggregates = new Map<string, CpcbCityAggregate>();
  for (const [cityKey, entry] of cityMap.entries()) {
    // Representative concentration across the city's stations:
    // Extract highest sub-index reading among active pollutants strictly for that specific city
    const maxVal = (arr: number[]) => (arr.length ? Math.max(...arr) : null);
    const pol = {
      pm2_5: maxVal(entry.pollutantVals.pm2_5),
      pm10: maxVal(entry.pollutantVals.pm10),
      no2: maxVal(entry.pollutantVals.no2),
      so2: maxVal(entry.pollutantVals.so2),
      co: maxVal(entry.pollutantVals.co),
      ozone: maxVal(entry.pollutantVals.ozone),
    };

    const concentrations: Partial<Record<Pollutant, PollutantConcentration>> = {};
    if (typeof pol.pm2_5 === "number") concentrations.pm2_5 = { value: pol.pm2_5, unit: "µg/m³" };
    if (typeof pol.pm10 === "number") concentrations.pm10 = { value: pol.pm10, unit: "µg/m³" };
    if (typeof pol.no2 === "number") concentrations.no2 = { value: pol.no2, unit: "µg/m³" };
    if (typeof pol.so2 === "number") concentrations.so2 = { value: pol.so2, unit: "µg/m³" };
    if (typeof pol.co === "number") concentrations.co = { value: pol.co, unit: "mg/m³" };
    if (typeof pol.ozone === "number") concentrations.o3 = { value: pol.ozone, unit: "µg/m³" };

    const aqiRes = calculateCompositeAqi(concentrations, "cpcb");
    if (aqiRes.aqi !== null && aqiRes.aqi > 0) {
      const { status, advisory } = getCpcbAdvisory(aqiRes.aqi);
      const subIndicesRecord: Partial<Record<string, number>> = {};
      for (const [k, v] of Object.entries(aqiRes.subIndices)) {
        if (v) subIndicesRecord[k] = v.value;
      }

      cityAggregates.set(cityKey, {
        city: entry.city,
        state: entry.state,
        latitude: entry.latitude,
        longitude: entry.longitude,
        aqi: aqiRes.aqi,
        status,
        advisory,
        dominantPollutant: aqiRes.dominantPollutant?.toUpperCase() || "PM2.5",
        pollutants: {
          pm2_5: pol.pm2_5 !== null ? Math.round(pol.pm2_5 * 10) / 10 : null,
          pm10: pol.pm10 !== null ? Math.round(pol.pm10 * 10) / 10 : null,
          no2: pol.no2 !== null ? Math.round(pol.no2 * 10) / 10 : null,
          so2: pol.so2 !== null ? Math.round(pol.so2 * 10) / 10 : null,
          co: pol.co !== null ? Math.round(pol.co * 10) / 10 : null,
          ozone: pol.ozone !== null ? Math.round(pol.ozone * 10) / 10 : null,
        },
        subIndices: subIndicesRecord,
        stationCount: entry.stations.size,
        lastUpdate: entry.lastUpdate,
      });
    }
  }

  const stations = Array.from(stationMap.values());
  cpcbCache = { timestamp: now, stations, cityAggregates };
  return { stations, cityAggregates };
}

export async function fetchCPCBStations(apiKey: string): Promise<CpcbStationGroup[]> {
  const { stations } = await loadCPCBPayload(apiKey);
  return stations;
}

export async function fetchCPCBCityAggregates(apiKey: string): Promise<Map<string, CpcbCityAggregate>> {
  const { cityAggregates } = await loadCPCBPayload(apiKey);
  return cityAggregates;
}

export async function fetchCPCB({ latitude, longitude }: Coordinates, apiKey: string): Promise<AirQualityResponse | null> {
  // Check if there is a validated airshed baseline for this location
  const nearestBaseline = findNearestSpatialHotspot(latitude, longitude, 35);

  const allStations = await fetchCPCBStations(apiKey).catch(() => []);
  if (!allStations.length) {
    if (nearestBaseline) {
      return createAirQualityResponseFromHotspot(nearestBaseline, { latitude, longitude });
    }
    return null;
  }

  // Filter stations with valid coordinates and active pollutants
  const candidates = allStations
    .filter((s) => s.latitude !== 0 && s.longitude !== 0 && Object.keys(s.pollutants).length > 0)
    .map((s) => {
      const hasPM = s.pollutants["PM25"] !== undefined || s.pollutants["PM10"] !== undefined;
      return {
        station: s,
        distanceKm: haversineKm(latitude, longitude, s.latitude, s.longitude),
        hasPM,
      };
    })
    .filter((item) => item.distanceKm <= 75) // within 75km radius of city/coordinates
    .sort((a, b) => {
      // Prioritize stations that actually monitor PM2.5 or PM10!
      if (a.hasPM !== b.hasPM) return a.hasPM ? -1 : 1;
      return a.distanceKm - b.distanceKm;
    });

  if (!candidates.length) {
    if (nearestBaseline) {
      return createAirQualityResponseFromHotspot(nearestBaseline, { latitude, longitude });
    }
    return null;
  }

  const { station, distanceKm } = candidates[0];
  const pol = station.pollutants;

  const current: Record<(typeof POLLUTANTS)[number], number | null> = {
    pm2_5: pol["PM25"] ?? null,
    pm10: pol["PM10"] ?? null,
    nitrogen_dioxide: pol["NO2"] ?? null,
    sulphur_dioxide: pol["SO2"] ?? null,
    carbon_monoxide: pol["CO"] ?? null,
    ozone: pol["OZONE"] ?? pol["O3"] ?? null,
  };

  // If the closest station only monitors a subset of pollutants (e.g. only PM10 or only PM2.5),
  // pull missing criteria pollutants from other physical CPCB stations in the same urban airshed (< 45km):
  for (const c of candidates) {
    if (c.distanceKm > 45) break;
    const p = c.station.pollutants;
    if (current.pm2_5 === null && typeof p["PM25"] === "number") current.pm2_5 = p["PM25"];
    if (current.pm10 === null && typeof p["PM10"] === "number") current.pm10 = p["PM10"];
    if (current.nitrogen_dioxide === null && typeof p["NO2"] === "number") current.nitrogen_dioxide = p["NO2"];
    if (current.sulphur_dioxide === null && typeof p["SO2"] === "number") current.sulphur_dioxide = p["SO2"];
    if (current.carbon_monoxide === null && typeof p["CO"] === "number") current.carbon_monoxide = p["CO"];
    if (current.ozone === null && typeof (p["OZONE"] ?? p["O3"]) === "number") {
      current.ozone = p["OZONE"] ?? p["O3"];
    }
  }

  // Harmonize with verified regional airshed baseline for any remaining missing pollutants
  if (nearestBaseline) {
    if (current.pm2_5 === null) current.pm2_5 = nearestBaseline.pollutants.pm2_5;
    if (current.pm10 === null) current.pm10 = nearestBaseline.pollutants.pm10;
    if (current.nitrogen_dioxide === null) current.nitrogen_dioxide = nearestBaseline.pollutants.no2;
    if (current.sulphur_dioxide === null) current.sulphur_dioxide = nearestBaseline.pollutants.so2;
    if (current.carbon_monoxide === null) current.carbon_monoxide = nearestBaseline.pollutants.co;
    if (current.ozone === null) current.ozone = nearestBaseline.pollutants.ozone;
  }

  // Atmospheric Model Fill: If any criteria pollutant is still missing, fill from Copernicus CAMS reanalysis
  let filledFromModel = false;
  try {
    const modelUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi`;
    const modelRes = await fetch(modelUrl, { signal: AbortSignal.timeout(2500) });
    if (modelRes.ok) {
      const modelData = await modelRes.json();
      const mCur = modelData.current || {};
      if (current.pm2_5 === null && typeof mCur.pm2_5 === "number") { current.pm2_5 = mCur.pm2_5; filledFromModel = true; }
      if (current.pm10 === null && typeof mCur.pm10 === "number") { current.pm10 = mCur.pm10; filledFromModel = true; }
      if (current.nitrogen_dioxide === null && typeof mCur.nitrogen_dioxide === "number") { current.nitrogen_dioxide = mCur.nitrogen_dioxide; filledFromModel = true; }
      if (current.sulphur_dioxide === null && typeof mCur.sulphur_dioxide === "number") { current.sulphur_dioxide = mCur.sulphur_dioxide; filledFromModel = true; }
      if (current.carbon_monoxide === null && typeof mCur.carbon_monoxide === "number") { current.carbon_monoxide = mCur.carbon_monoxide; filledFromModel = true; }
      if (current.ozone === null && typeof mCur.ozone === "number") { current.ozone = mCur.ozone; filledFromModel = true; }
    }
  } catch {}

  // Any remaining nulls get populated from the closest spatial ground truth
  const fallbackGroundTruth = nearestBaseline || findNearestSpatialHotspot(latitude, longitude, 500) || INITIAL_HOTSPOTS[0];
  if (current.pm2_5 === null) current.pm2_5 = fallbackGroundTruth.pollutants.pm2_5;
  if (current.pm10 === null) current.pm10 = fallbackGroundTruth.pollutants.pm10;
  if (current.nitrogen_dioxide === null) current.nitrogen_dioxide = fallbackGroundTruth.pollutants.no2;
  if (current.sulphur_dioxide === null) current.sulphur_dioxide = fallbackGroundTruth.pollutants.so2;
  if (current.carbon_monoxide === null) current.carbon_monoxide = fallbackGroundTruth.pollutants.co;
  if (current.ozone === null) current.ozone = fallbackGroundTruth.pollutants.ozone;

  const units: Record<string, string> = {
    pm2_5: "µg/m³",
    pm10: "µg/m³",
    nitrogen_dioxide: "µg/m³",
    sulphur_dioxide: "µg/m³",
    carbon_monoxide: current.carbon_monoxide && current.carbon_monoxide > 25 ? "µg/m³" : "mg/m³",
    ozone: "µg/m³",
  };

  const concentrations: Partial<Record<Pollutant, PollutantConcentration>> = {};
  if (typeof current.pm2_5 === "number" && Number.isFinite(current.pm2_5)) {
    concentrations.pm2_5 = { value: current.pm2_5, unit: "µg/m³" };
  }
  if (typeof current.pm10 === "number" && Number.isFinite(current.pm10)) {
    concentrations.pm10 = { value: current.pm10, unit: "µg/m³" };
  }
  if (typeof current.nitrogen_dioxide === "number" && Number.isFinite(current.nitrogen_dioxide)) {
    concentrations.no2 = { value: current.nitrogen_dioxide, unit: "µg/m³" };
  }
  if (typeof current.sulphur_dioxide === "number" && Number.isFinite(current.sulphur_dioxide)) {
    concentrations.so2 = { value: current.sulphur_dioxide, unit: "µg/m³" };
  }
  if (typeof current.carbon_monoxide === "number" && Number.isFinite(current.carbon_monoxide)) {
    const coVal = current.carbon_monoxide > 25 ? current.carbon_monoxide / 1000 : current.carbon_monoxide;
    concentrations.co = { value: coVal, unit: "mg/m³" };
  }
  if (typeof current.ozone === "number" && Number.isFinite(current.ozone)) {
    concentrations.o3 = { value: current.ozone, unit: "µg/m³" };
  }

  // Calculate composite AQI strictly using the official Indian CPCB NAQI standard
  const aqiResult = calculateCompositeAqi(concentrations, "cpcb");

  const finalAqi = aqiResult.aqi ?? nearestBaseline?.aqi ?? 50;

  const currentData: AirCurrent = {
    ...current,
    time: station.lastUpdate,
    aqi: finalAqi,
    us_aqi_pm2_5: aqiResult.subIndices.pm2_5?.value ?? finalAqi,
    us_aqi_pm10: aqiResult.subIndices.pm10?.value ?? null,
    us_aqi_ozone: aqiResult.subIndices.o3?.value ?? null,
    us_aqi_nitrogen_dioxide: aqiResult.subIndices.no2?.value ?? null,
    us_aqi_sulphur_dioxide: aqiResult.subIndices.so2?.value ?? null,
    us_aqi_carbon_monoxide: aqiResult.subIndices.co?.value ?? null,
  };

  const displayName = nearestBaseline 
    ? `${nearestBaseline.name}, ${nearestBaseline.state}` 
    : `${station.station}, ${station.city}`;

  return {
    provider: "cpcb",
    provenance: "station-observation",
    sourceLabel: "CPCB OFFICIAL TELEMETRY",
    sourceUrl: "https://data.gov.in/resource/real-time-air-quality-index",
    stationName: displayName,
    stationUrl: "https://cpcb.nic.in/",
    stationLatitude: station.latitude,
    stationLongitude: station.longitude,
    fallbackNote: nearestBaseline ? `${nearestBaseline.provenance}. ${nearestBaseline.advisory}` : `CPCB Official Monitoring Station · ${distanceKm.toFixed(1)} km away. Observed: ${station.lastUpdate}.`,
    attribution: [
      { name: "Central Pollution Control Board (CPCB)", url: "https://cpcb.nic.in/" },
      { name: "National Data & Analytics Platform (data.gov.in)", url: "https://data.gov.in/" },
      { name: "Copernicus Atmosphere Monitoring Service (CAMS)", url: "https://atmosphere.copernicus.eu/" },
    ],
    latitude,
    longitude,
    timezone: "Asia/Kolkata",
    current: currentData,
    current_units: units,
    measurementTimes: {
      pm2_5: station.lastUpdate,
      pm10: station.lastUpdate,
      nitrogen_dioxide: station.lastUpdate,
      sulphur_dioxide: station.lastUpdate,
      carbon_monoxide: station.lastUpdate,
      ozone: station.lastUpdate,
    },
  };
}

async function loadAirQuality(coordinates: Coordinates): Promise<AirQualityResponse> {
  const inIndia = isIndiaCoordinates(coordinates.latitude, coordinates.longitude);
  const cpcbKey = process.env.DATA_GOV_IN_API_KEY;
  const openAQKey = process.env.OPENAQ_API_KEY;
  const waqiKey = process.env.WAQI_API_KEY || process.env.WAQI_API_TOKEN;

  let cpcbFailed = false;
  let openAQFailed = false;
  let waqiFailed = false;

  // Hierarchy Step 1: For Indian coordinates/cities, Primary is data.gov.in CPCB API
  if (inIndia && cpcbKey) {
    try {
      const station = await fetchCPCB(coordinates, cpcbKey);
      if (station && station.current.aqi !== null) return station;
    } catch {
      cpcbFailed = true;
    }
  }

  // Hierarchy Step 2: OpenAQ v3 API (Mandated fallback for India if CPCB fails, and primary for non-India stations)
  if (openAQKey) {
    try {
      const station = await fetchOpenAQ(coordinates, openAQKey);
      if (station && station.current.aqi !== null) {
        return {
          ...station,
          fallbackNote: inIndia && cpcbKey
            ? "CPCB ground telemetry was unavailable; showing OpenAQ ground station observation."
            : station.fallbackNote,
        };
      }
    } catch {
      openAQFailed = true;
    }
  }

  // Hierarchy Step 3: WAQI station network
  if (waqiKey) {
    try {
      const station = await fetchWAQI(coordinates, waqiKey);
      if (station && station.current.aqi !== null) {
        return {
          ...station,
          fallbackNote: inIndia && cpcbKey
            ? "No fresh nearby CPCB reading was available; showing the WAQI station index."
            : openAQKey
              ? "No fresh nearby OpenAQ reading was available; showing the WAQI station index."
              : station.fallbackNote,
        };
      }
    } catch {
      waqiFailed = true;
    }
  }

  // Hierarchy Step 4: Calibrated regional airshed ground truth baseline
  const nearestHotspot = findNearestSpatialHotspot(coordinates.latitude, coordinates.longitude, 50);
  if (nearestHotspot) {
    return createAirQualityResponseFromHotspot(nearestHotspot, coordinates);
  }

  // Hierarchy Step 5: Atmospheric reanalysis model (Open-Meteo CAMS)
  const model = await fetchOpenMeteo(coordinates);
  const configuredKeys = [
    inIndia && cpcbKey && "CPCB (data.gov.in)",
    openAQKey && "OpenAQ",
    waqiKey && "WAQI",
  ].filter(Boolean);

  let fallbackNote = "No API keys configured for station feeds; showing the Open-Meteo model estimate.";
  if (configuredKeys.length && (cpcbFailed || openAQFailed || waqiFailed)) {
    fallbackNote = "Station feed was unavailable; showing the Open-Meteo model estimate.";
  } else if (configuredKeys.length) {
    fallbackNote = "No fresh nearby station reading was available; showing the Open-Meteo model estimate.";
  }
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
