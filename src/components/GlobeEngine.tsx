"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Wind } from "lucide-react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import * as THREE from "three";
import type { AirQualityResponse, Location } from "@/lib/types";
import { AQI_COLORS } from "@/lib/aqi-calculator";
import type { MapLayer } from "@/components/MapLayersPanel";
import { Continent, getContinentForCoordinates } from "@/lib/continents";

type Weather = { temperature_2m?: number; wind_speed_10m?: number; wind_direction_10m?: number; time?: string };
type Point = { lat: number; lng: number; aqi: number | null; label: string; value?: number | null };
type Props = {
  location: Location;
  air: AirQualityResponse | null;
  layer: MapLayer;
  weather: Weather | null;
  wind: boolean;
  temperature: boolean;
  heatmap?: boolean;
  zoom: number;
  continent?: Continent;
  metric?: "aqi" | "pm2_5";
  onLocationSelect: (location: Location) => void;
};

function colorForAqi(value: number | null) {
  if (value === null) return "#4f8e78";
  if (value <= 50) return AQI_COLORS[0];
  if (value <= 100) return AQI_COLORS[1];
  if (value <= 150) return AQI_COLORS[2];
  if (value <= 200) return AQI_COLORS[3];
  if (value <= 300) return AQI_COLORS[4];
  return AQI_COLORS[5];
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

const FIELD_BY_LAYER: Record<MapLayer, string> = { aqi: "aqi", pm2_5: "pm2_5", pm10: "pm10", o3: "ozone", no2: "nitrogen_dioxide", so2: "sulphur_dioxide", co: "carbon_monoxide" };
const AQI_FIELD_BY_LAYER: Partial<Record<MapLayer, string>> = { pm2_5: "us_aqi_pm2_5", pm10: "us_aqi_pm10", o3: "us_aqi_ozone", no2: "us_aqi_nitrogen_dioxide", so2: "us_aqi_sulphur_dioxide", co: "us_aqi_carbon_monoxide" };

// Global Atmospheric Heatmap Seed Points spanning all continents and regional airsheds
const BASE_HEATMAP_POINTS: Array<{ lat: number; lng: number; weight: number }> = [
  // --- South Asia (Indo-Gangetic Basin, Indus Valley, Deccan & Coastal) ---
  { lat: 28.61, lng: 77.21, weight: 0.95 }, // Delhi
  { lat: 28.45, lng: 77.02, weight: 0.90 }, // Gurgaon
  { lat: 28.53, lng: 77.39, weight: 0.91 }, // Noida
  { lat: 26.85, lng: 80.95, weight: 0.88 }, // Lucknow
  { lat: 26.45, lng: 80.33, weight: 0.89 }, // Kanpur
  { lat: 25.59, lng: 85.14, weight: 0.87 }, // Patna
  { lat: 25.32, lng: 82.97, weight: 0.85 }, // Varanasi
  { lat: 31.52, lng: 74.36, weight: 0.96 }, // Lahore
  { lat: 31.42, lng: 73.08, weight: 0.90 }, // Faisalabad
  { lat: 24.86, lng: 67.01, weight: 0.84 }, // Karachi
  { lat: 30.73, lng: 76.78, weight: 0.82 }, // Chandigarh
  { lat: 23.81, lng: 90.41, weight: 0.86 }, // Dhaka
  { lat: 22.57, lng: 88.36, weight: 0.78 }, // Kolkata
  { lat: 26.91, lng: 75.79, weight: 0.74 }, // Jaipur
  { lat: 23.02, lng: 72.57, weight: 0.72 }, // Ahmedabad
  { lat: 21.17, lng: 72.83, weight: 0.68 }, // Surat
  { lat: 19.08, lng: 72.88, weight: 0.66 }, // Mumbai
  { lat: 19.22, lng: 73.15, weight: 0.65 }, // Kalyan-Dombivli
  { lat: 18.52, lng: 73.86, weight: 0.60 }, // Pune
  { lat: 21.15, lng: 79.08, weight: 0.62 }, // Nagpur
  { lat: 17.38, lng: 78.49, weight: 0.55 }, // Hyderabad
  { lat: 12.97, lng: 77.59, weight: 0.42 }, // Bengaluru
  { lat: 13.08, lng: 80.27, weight: 0.45 }, // Chennai
  { lat: 9.93,  lng: 76.27, weight: 0.35 }, // Kochi
  { lat: 26.14, lng: 91.74, weight: 0.58 }, // Guwahati
  { lat: 27.72, lng: 85.32, weight: 0.68 }, // Kathmandu
  { lat: 6.93,  lng: 79.86, weight: 0.38 }, // Colombo

  // --- East Asia (China Industrial Corridors, Japan, Korean Peninsula) ---
  { lat: 39.90, lng: 116.41, weight: 0.88 }, // Beijing
  { lat: 39.13, lng: 117.20, weight: 0.86 }, // Tianjin
  { lat: 38.04, lng: 114.51, weight: 0.90 }, // Shijiazhuang
  { lat: 36.65, lng: 117.12, weight: 0.84 }, // Jinan
  { lat: 34.75, lng: 113.63, weight: 0.88 }, // Zhengzhou
  { lat: 34.34, lng: 108.94, weight: 0.82 }, // Xi'an
  { lat: 30.57, lng: 104.07, weight: 0.80 }, // Chengdu
  { lat: 29.56, lng: 106.55, weight: 0.78 }, // Chongqing
  { lat: 30.59, lng: 114.31, weight: 0.74 }, // Wuhan
  { lat: 31.23, lng: 121.47, weight: 0.64 }, // Shanghai
  { lat: 23.13, lng: 113.26, weight: 0.58 }, // Guangzhou
  { lat: 22.54, lng: 114.06, weight: 0.55 }, // Shenzhen
  { lat: 37.57, lng: 126.98, weight: 0.58 }, // Seoul
  { lat: 35.18, lng: 129.08, weight: 0.48 }, // Busan
  { lat: 35.68, lng: 139.65, weight: 0.35 }, // Tokyo
  { lat: 34.69, lng: 135.50, weight: 0.38 }, // Osaka
  { lat: 43.06, lng: 141.35, weight: 0.28 }, // Sapporo
  { lat: 25.03, lng: 121.56, weight: 0.42 }, // Taipei
  { lat: 47.92, lng: 106.92, weight: 0.82 }, // Ulaanbaatar (winter coal basin)

  // --- Southeast Asia (Indochina, Malay Peninsula, Indonesian Archipelago) ---
  { lat: 13.76, lng: 100.50, weight: 0.72 }, // Bangkok
  { lat: 18.79, lng: 98.98,  weight: 0.78 }, // Chiang Mai (seasonal biomass)
  { lat: 21.03, lng: 105.85, weight: 0.82 }, // Hanoi
  { lat: 10.82, lng: 106.63, weight: 0.64 }, // Ho Chi Minh City
  { lat: 16.84, lng: 96.17,  weight: 0.72 }, // Yangon
  { lat: 11.56, lng: 104.92, weight: 0.62 }, // Phnom Penh
  { lat: 3.14,  lng: 101.69, weight: 0.48 }, // Kuala Lumpur
  { lat: 1.35,  lng: 103.82, weight: 0.36 }, // Singapore
  { lat: -6.21, lng: 106.85, weight: 0.78 }, // Jakarta
  { lat: -6.91, lng: 107.61, weight: 0.70 }, // Bandung
  { lat: -7.25, lng: 112.75, weight: 0.68 }, // Surabaya
  { lat: 14.60, lng: 120.98, weight: 0.58 }, // Manila

  // --- Europe (Western, Central, Mediterranean, Eastern & Nordic) ---
  { lat: 51.51, lng: -0.13,  weight: 0.38 }, // London
  { lat: 53.48, lng: -2.24,  weight: 0.36 }, // Manchester
  { lat: 48.86, lng: 2.35,   weight: 0.42 }, // Paris
  { lat: 45.76, lng: 4.84,   weight: 0.38 }, // Lyon
  { lat: 50.85, lng: 4.35,   weight: 0.40 }, // Brussels
  { lat: 52.37, lng: 4.90,   weight: 0.38 }, // Amsterdam
  { lat: 51.22, lng: 6.78,   weight: 0.48 }, // Rhine-Ruhr industrial belt
  { lat: 52.52, lng: 13.41,  weight: 0.42 }, // Berlin
  { lat: 50.11, lng: 8.68,   weight: 0.40 }, // Frankfurt
  { lat: 48.14, lng: 11.58,  weight: 0.36 }, // Munich
  { lat: 45.46, lng: 9.19,   weight: 0.68 }, // Milan / Po Valley (European smog hotspot)
  { lat: 45.07, lng: 7.68,   weight: 0.64 }, // Turin
  { lat: 41.90, lng: 12.50,  weight: 0.46 }, // Rome
  { lat: 40.85, lng: 14.27,  weight: 0.48 }, // Naples
  { lat: 40.42, lng: -3.70,  weight: 0.40 }, // Madrid
  { lat: 41.39, lng: 2.17,   weight: 0.44 }, // Barcelona
  { lat: 38.72, lng: -9.14,  weight: 0.34 }, // Lisbon
  { lat: 48.21, lng: 16.37,  weight: 0.38 }, // Vienna
  { lat: 50.08, lng: 14.44,  weight: 0.44 }, // Prague
  { lat: 52.23, lng: 21.01,  weight: 0.68 }, // Warsaw (coal corridor)
  { lat: 50.06, lng: 19.94,  weight: 0.72 }, // Krakow / Silesia
  { lat: 47.50, lng: 19.04,  weight: 0.52 }, // Budapest
  { lat: 44.82, lng: 20.46,  weight: 0.66 }, // Belgrade
  { lat: 44.43, lng: 26.10,  weight: 0.58 }, // Bucharest
  { lat: 42.70, lng: 23.32,  weight: 0.62 }, // Sofia
  { lat: 37.98, lng: 23.73,  weight: 0.56 }, // Athens
  { lat: 41.01, lng: 28.98,  weight: 0.68 }, // Istanbul
  { lat: 55.75, lng: 37.62,  weight: 0.48 }, // Moscow
  { lat: 59.93, lng: 30.33,  weight: 0.42 }, // Saint Petersburg
  { lat: 50.45, lng: 30.52,  weight: 0.52 }, // Kyiv
  { lat: 59.33, lng: 18.07,  weight: 0.25 }, // Stockholm
  { lat: 59.91, lng: 10.75,  weight: 0.24 }, // Oslo
  { lat: 55.68, lng: 12.57,  weight: 0.28 }, // Copenhagen
  { lat: 60.17, lng: 24.94,  weight: 0.24 }, // Helsinki

  // --- North America (US, Canada, Mexico) ---
  { lat: 40.71, lng: -74.01, weight: 0.48 }, // New York Metro
  { lat: 42.36, lng: -71.06, weight: 0.38 }, // Boston
  { lat: 39.95, lng: -75.17, weight: 0.46 }, // Philadelphia
  { lat: 38.91, lng: -77.04, weight: 0.42 }, // Washington DC
  { lat: 41.88, lng: -87.63, weight: 0.52 }, // Chicago / Great Lakes
  { lat: 42.33, lng: -83.05, weight: 0.50 }, // Detroit
  { lat: 39.77, lng: -86.16, weight: 0.48 }, // Indianapolis
  { lat: 38.63, lng: -90.20, weight: 0.48 }, // St. Louis
  { lat: 29.76, lng: -95.37, weight: 0.62 }, // Houston (petrochemical belt)
  { lat: 32.78, lng: -96.80, weight: 0.56 }, // Dallas
  { lat: 33.45, lng: -112.07,weight: 0.64 }, // Phoenix (dust & ozone)
  { lat: 39.74, lng: -104.99,weight: 0.48 }, // Denver (Front Range inversion)
  { lat: 34.05, lng: -118.24,weight: 0.75 }, // Los Angeles (South Coast Basin)
  { lat: 35.37, lng: -119.02,weight: 0.78 }, // Central Valley / Bakersfield
  { lat: 37.77, lng: -122.42,weight: 0.42 }, // San Francisco
  { lat: 45.52, lng: -122.68,weight: 0.36 }, // Portland
  { lat: 47.61, lng: -122.33,weight: 0.34 }, // Seattle
  { lat: 43.65, lng: -79.38, weight: 0.38 }, // Toronto
  { lat: 45.50, lng: -73.57, weight: 0.36 }, // Montreal
  { lat: 49.28, lng: -123.12,weight: 0.30 }, // Vancouver
  { lat: 19.43, lng: -99.13, weight: 0.84 }, // Mexico City (high-altitude valley smog)
  { lat: 25.69, lng: -100.32,weight: 0.76 }, // Monterrey
  { lat: 20.66, lng: -103.35,weight: 0.72 }, // Guadalajara

  // --- South America (Andean Valley Belts, Atlantic Coast, Pampas) ---
  { lat: 4.71,  lng: -74.07, weight: 0.55 }, // Bogotá
  { lat: 6.25,  lng: -75.56, weight: 0.62 }, // Medellín (valley inversion)
  { lat: -0.18, lng: -78.47, weight: 0.48 }, // Quito
  { lat: -12.05,lng: -77.04, weight: 0.76 }, // Lima (coastal fog & high PM)
  { lat: -16.50,lng: -68.12, weight: 0.52 }, // La Paz
  { lat: -33.45,lng: -70.67, weight: 0.82 }, // Santiago (basin particulate hotspot)
  { lat: -34.60,lng: -58.38, weight: 0.42 }, // Buenos Aires
  { lat: -34.90,lng: -56.16, weight: 0.36 }, // Montevideo
  { lat: -23.55,lng: -46.63, weight: 0.65 }, // São Paulo (massive urban basin)
  { lat: -22.91,lng: -43.17, weight: 0.52 }, // Rio de Janeiro
  { lat: -19.92,lng: -43.94, weight: 0.54 }, // Belo Horizonte
  { lat: -15.79,lng: -47.88, weight: 0.36 }, // Brasilia
  { lat: 10.48, lng: -66.90, weight: 0.52 }, // Caracas

  // --- Middle East & Central Asia (Desert Dust Belts & Industrial Centers) ---
  { lat: 24.71, lng: 46.68, weight: 0.78 }, // Riyadh (desert dust & urban)
  { lat: 21.54, lng: 39.17, weight: 0.64 }, // Jeddah
  { lat: 26.42, lng: 50.10, weight: 0.74 }, // Dammam / Khobar
  { lat: 25.20, lng: 55.27, weight: 0.70 }, // Dubai
  { lat: 24.45, lng: 54.38, weight: 0.66 }, // Abu Dhabi
  { lat: 25.29, lng: 51.53, weight: 0.68 }, // Doha
  { lat: 29.38, lng: 47.98, weight: 0.76 }, // Kuwait City
  { lat: 26.22, lng: 50.59, weight: 0.68 }, // Manama
  { lat: 23.59, lng: 58.38, weight: 0.58 }, // Muscat
  { lat: 31.95, lng: 35.93, weight: 0.60 }, // Amman
  { lat: 33.31, lng: 44.36, weight: 0.82 }, // Baghdad
  { lat: 30.51, lng: 47.81, weight: 0.78 }, // Basra
  { lat: 35.69, lng: 51.39, weight: 0.86 }, // Tehran (Alborz basin inversion)
  { lat: 32.65, lng: 51.67, weight: 0.74 }, // Isfahan
  { lat: 39.93, lng: 32.86, weight: 0.58 }, // Ankara
  { lat: 41.30, lng: 69.24, weight: 0.72 }, // Tashkent
  { lat: 43.24, lng: 76.91, weight: 0.74 }, // Almaty
  { lat: 51.17, lng: 71.45, weight: 0.58 }, // Astana
  { lat: 42.87, lng: 74.59, weight: 0.76 }, // Bishkek
  { lat: 40.41, lng: 49.87, weight: 0.62 }, // Baku

  // --- Africa (North Sahara Dust Corridor, West Africa Gulf of Guinea, East & Southern) ---
  { lat: 30.04, lng: 31.24, weight: 0.86 }, // Cairo (Nile Delta heavy PM)
  { lat: 31.20, lng: 29.92, weight: 0.72 }, // Alexandria
  { lat: 32.89, lng: 13.19, weight: 0.58 }, // Tripoli
  { lat: 36.80, lng: 10.18, weight: 0.52 }, // Tunis
  { lat: 36.75, lng: 3.06,  weight: 0.54 }, // Algiers
  { lat: 33.57, lng: -7.59, weight: 0.52 }, // Casablanca
  { lat: 6.52,  lng: 3.38,  weight: 0.84 }, // Lagos
  { lat: 7.38,  lng: 3.95,  weight: 0.76 }, // Ibadan
  { lat: 12.00, lng: 8.52,  weight: 0.86 }, // Kano (Harmattan dust corridor)
  { lat: 9.06,  lng: 7.49,  weight: 0.72 }, // Abuja
  { lat: 5.60,  lng: -0.19, weight: 0.68 }, // Accra
  { lat: 5.36,  lng: -4.01, weight: 0.64 }, // Abidjan
  { lat: 14.69, lng: -17.44,weight: 0.70 }, // Dakar
  { lat: -4.32, lng: 15.32, weight: 0.72 }, // Kinshasa
  { lat: -1.29, lng: 36.82, weight: 0.44 }, // Nairobi
  { lat: -4.04, lng: 39.67, weight: 0.38 }, // Mombasa
  { lat: 9.03,  lng: 38.74, weight: 0.54 }, // Addis Ababa
  { lat: 0.35,  lng: 32.58, weight: 0.62 }, // Kampala
  { lat: -26.20,lng: 28.05, weight: 0.68 }, // Johannesburg (Highveld industrial)
  { lat: -25.75,lng: 28.19, weight: 0.64 }, // Pretoria
  { lat: -29.86,lng: 31.02, weight: 0.48 }, // Durban
  { lat: -33.92,lng: 18.42, weight: 0.30 }, // Cape Town

  // --- Oceania (Australia & New Zealand) ---
  { lat: -33.87,lng: 151.21, weight: 0.28 }, // Sydney
  { lat: -37.81,lng: 144.96, weight: 0.26 }, // Melbourne
  { lat: -27.47,lng: 153.03, weight: 0.25 }, // Brisbane
  { lat: -31.95,lng: 115.86, weight: 0.24 }, // Perth
  { lat: -34.93,lng: 138.60, weight: 0.24 }, // Adelaide
  { lat: -35.28,lng: 149.13, weight: 0.22 }, // Canberra
  { lat: -36.85,lng: 174.76, weight: 0.20 }, // Auckland
  { lat: -41.29,lng: 174.78, weight: 0.18 }, // Wellington
  { lat: -43.53,lng: 172.64, weight: 0.18 }, // Christchurch
];

// Atmospheric Wind Streamlines matching planetary circulation
const WIND_STREAMLINES: Array<{ coords: Array<[number, number]> }> = [
  // Indian Ocean & Arabian Sea monsoon flow into South Asia
  { coords: [[-10, 55], [-2, 60], [6, 65], [14, 70], [18, 72.8], [22, 75], [26, 80], [28, 85]] },
  { coords: [[-5, 62], [2, 68], [10, 72], [16, 74], [20, 78], [24, 84]] },
  { coords: [[5, 80], [10, 85], [15, 89], [20, 92], [23, 91], [25, 94]] },
  { coords: [[-12, 75], [-4, 82], [3, 88], [9, 93], [14, 98], [19, 103]] },
  // East Asia & NW Pacific circulation
  { coords: [[12, 115], [18, 120], [25, 125], [32, 132], [38, 142], [43, 155]] },
  { coords: [[20, 110], [27, 118], [34, 128], [40, 138], [45, 150]] },
  { coords: [[30, 105], [35, 115], [38, 125], [41, 135], [44, 145]] },
  // Middle East & Persian Gulf
  { coords: [[15, 45], [20, 50], [25, 55], [29, 58], [32, 62]] },
  { coords: [[22, 38], [26, 44], [30, 48], [33, 53], [35, 60]] },
  // North Atlantic & Europe Westerlies
  { coords: [[35, -60], [40, -45], [46, -30], [50, -15], [52, 2], [53, 18], [54, 35]] },
  { coords: [[42, -55], [47, -40], [52, -22], [54, -5], [55, 12], [56, 28]] },
  { coords: [[28, -75], [33, -65], [38, -50], [43, -35], [47, -20], [48, -5]] },
  // North America
  { coords: [[32, -120], [35, -108], [38, -95], [41, -82], [44, -70]] },
  { coords: [[40, -125], [44, -112], [47, -98], [48, -85], [49, -72]] },
  // Equatorial Pacific Trade Winds
  { coords: [[8, -100], [7, -120], [6, -140], [5, -160], [4, -180]] },
  { coords: [[-5, -95], [-6, -115], [-7, -135], [-8, -155], [-9, -175]] },
  { coords: [[15, -110], [14, -130], [13, -150], [12, -170], [11, 170]] },
  // Southern Oceans Westerlies
  { coords: [[-35, 20], [-38, 45], [-40, 70], [-42, 95], [-44, 120], [-45, 145]] },
  { coords: [[-38, 110], [-41, 130], [-43, 150], [-44, 170], [-45, -170]] },
  { coords: [[-32, -60], [-36, -40], [-39, -20], [-40, 0], [-41, 20]] },
];

export function GlobeEngine({
  location,
  air,
  layer,
  weather,
  wind,
  temperature,
  heatmap = true,
  zoom,
  continent = "All",
  metric = "aqi",
  onLocationSelect,
}: Props) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [size, setSize] = useState({ width: 300, height: 300 });
  const [countries, setCountries] = useState<object[]>([]);
  const [livePoints, setLivePoints] = useState(BASE_HEATMAP_POINTS);

  const selectedValue = layer === "aqi" ? air?.current.aqi : air?.current[FIELD_BY_LAYER[layer]];
  const selectedAqi = layer === "aqi" ? air?.current.aqi : AQI_FIELD_BY_LAYER[layer] ? air?.current[AQI_FIELD_BY_LAYER[layer]!] : null;
  const point = useMemo<Point>(
    () => ({
      lat: air?.stationLatitude ?? location.latitude,
      lng: air?.stationLongitude ?? location.longitude,
      aqi: typeof selectedAqi === "number" ? selectedAqi : null,
      value: typeof selectedValue === "number" ? selectedValue : null,
      label: `${air?.stationName ?? location.name} · ${air?.sourceLabel ?? "Selected location"}`,
    }),
    [air, location, selectedAqi, selectedValue],
  );

  // Generate continent-filtered markers
  const displayPoints = useMemo<Point[]>(() => {
    const list: Point[] = [point];
    if (continent && continent !== "All") {
      const filtered = BASE_HEATMAP_POINTS
        .filter((p) => getContinentForCoordinates(p.lat, p.lng) === continent)
        .slice(0, 16)
        .map((p, idx) => ({
          lat: p.lat,
          lng: p.lng,
          aqi: metric === "pm2_5" ? Math.round(p.weight * 110) : Math.round(p.weight * 320),
          label: `${continent} Airshed Sensor #${idx + 1}`,
        }));
      list.push(...filtered);
    }
    return list;
  }, [point, continent, metric]);

  // Load world country border polygons
  useEffect(() => {
    let active = true;
    fetch("https://unpkg.com/three-globe/example/country-polygons/ne_110m_admin_0_countries.geojson")
      .then((res) => res.json())
      .then((data) => {
        if (active && data?.features) {
          setCountries(data.features);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  // Hydrate global heatmap with live telemetry from /api/hotspots
  useEffect(() => {
    let active = true;
    fetch("/api/hotspots")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data?.hotspots || !Array.isArray(data.hotspots)) return;
        const mapped = data.hotspots.map((h: { lat: number; lng: number; aqi: number }) => ({
          lat: h.lat,
          lng: h.lng,
          weight: Math.min(1, Math.max(0.1, h.aqi / 350)),
        }));
        // Merge with base points
        setLivePoints((prev) => [...prev, ...mapped]);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  // Update heatmap points with current selected location reading and continent filter
  const heatmapDataset = useMemo(() => {
    let points = [...livePoints];
    if (continent && continent !== "All") {
      points = points.filter((p) => getContinentForCoordinates(p.lat, p.lng) === continent);
    }
    if (air?.current.aqi) {
      const airContinent = getContinentForCoordinates(air.stationLatitude ?? location.latitude, air.stationLongitude ?? location.longitude);
      if (!continent || continent === "All" || airContinent === continent) {
        const factor = metric === "pm2_5" ? 60 : 350;
        const aqiNum: number = typeof air.current.aqi === "number" ? air.current.aqi : 0;
        const pm25Num: number = typeof air.current.pm2_5 === "number" ? air.current.pm2_5 : aqiNum * 0.4;
        const val: number = metric === "pm2_5" ? pm25Num : aqiNum;
        points.push({
          lat: air.stationLatitude ?? location.latitude,
          lng: air.stationLongitude ?? location.longitude,
          weight: Math.min(1, Math.max(0.1, val / factor)),
        });
      }
    }
    return { id: "global-aqi-plumes", points };
  }, [livePoints, air, location.latitude, location.longitude, continent, metric]);

  const CONTINENT_CENTERS: Record<Continent, { lat: number; lng: number; altitude: number }> = {
    All: { lat: location.latitude, lng: location.longitude, altitude: 2.25 / zoom },
    Asia: { lat: 28, lng: 85, altitude: 2.1 },
    Europe: { lat: 48, lng: 16, altitude: 1.95 },
    Africa: { lat: 2, lng: 22, altitude: 2.2 },
    "North America": { lat: 38, lng: -98, altitude: 2.2 },
    "South America": { lat: -18, lng: -60, altitude: 2.2 },
    Oceania: { lat: -25, lng: 135, altitude: 2.2 },
  };

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !ready) return;
    if (continent && continent !== "All") {
      const target = CONTINENT_CENTERS[continent];
      if (target) {
        globe.pointOfView({ lat: target.lat, lng: target.lng, altitude: target.altitude }, 1200);
      }
    } else {
      globe.pointOfView({ lat: location.latitude, lng: location.longitude, altitude: 2.25 / zoom }, 1100);
    }
  }, [continent, location.latitude, location.longitude, zoom, ready]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({
        width: Math.max(1, Math.round(entry.contentRect.width)),
        height: Math.max(1, Math.round(entry.contentRect.height)),
      }),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        try {
          const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
          if (res.ok) {
            const place = (await res.json()) as { name?: string; admin?: string; country?: string };
            if (place.name) {
              onLocationSelect({
                name: place.name,
                admin: place.admin || "Detected location",
                country: place.country || "",
                latitude: lat,
                longitude: lng,
              });
              return;
            }
          }
        } catch {}

        onLocationSelect({
          name: "Detected location",
          admin: "Browser coordinates",
          latitude: lat,
          longitude: lng,
        });
      },
      () => undefined,
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
    );
    // Run once on initial mount; location changes are driven by search and globe clicks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addAtmosphere = useCallback(() => {
    const globe = globeRef.current;
    if (!globe) return;
    const scene = globe.scene();
    const radius = globe.getGlobeRadius();
    const geometry = new THREE.SphereGeometry(radius * 1.035, 48, 48);
    const material = new THREE.ShaderMaterial({
      vertexShader: `varying vec3 vNormal; varying vec3 vWorldPosition; void main(){ vNormal=normalize(normalMatrix*normal); vec4 worldPosition=modelMatrix*vec4(position,1.0); vWorldPosition=worldPosition.xyz; gl_Position=projectionMatrix*viewMatrix*worldPosition; }`,
      fragmentShader: `varying vec3 vNormal; varying vec3 vWorldPosition; void main(){ vec3 viewDirection=normalize(cameraPosition-vWorldPosition); float fresnel=pow(1.0-max(dot(normalize(vNormal),viewDirection),0.0),3.0); gl_FragColor=vec4(0.26,0.73,0.52,fresnel*0.42); }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    const halo = new THREE.Mesh(geometry, material);
    halo.name = "vayu-atmosphere-halo";
    scene.add(halo);
    return () => {
      scene.remove(halo);
      geometry.dispose();
      material.dispose();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    return addAtmosphere();
  }, [addAtmosphere, ready]);

  const selectCoordinates = useCallback(
    async (coords: { lat: number; lng: number }) => {
      const lat = Number(coords.lat.toFixed(4));
      const lng = Number(coords.lng.toFixed(4));

      // Smoothly rotate globe camera to face the clicked position
      globeRef.current?.pointOfView({ lat, lng, altitude: 2.15 }, 800);

      // Instant optimistic update so sidebar immediately indicates activity
      onLocationSelect({
        name: "Inspecting location…",
        admin: `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"}, ${Math.abs(lng).toFixed(2)}°${lng >= 0 ? "E" : "W"}`,
        country: "Planetary Observation",
        latitude: lat,
        longitude: lng,
      });

      try {
        const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
        if (res.ok) {
          const place = (await res.json()) as { name?: string; admin?: string; country?: string };
          if (place.name) {
            onLocationSelect({
              name: place.name,
              admin: place.admin || "Selected region",
              country: place.country || "",
              latitude: lat,
              longitude: lng,
            });
            return;
          }
        }
      } catch {}

      onLocationSelect({
        name: `Location (${Math.abs(lat).toFixed(1)}°${lat >= 0 ? "N" : "S"}, ${Math.abs(lng).toFixed(1)}°${lng >= 0 ? "E" : "W"})`,
        admin: "Atmospheric Coordinates",
        country: "Planetary Observation",
        latitude: lat,
        longitude: lng,
      });
    },
    [onLocationSelect],
  );

  const windAngle = weather?.wind_direction_10m ?? 0;

  return (
    <>
      <div className="globe-webgl" ref={containerRef} aria-label={`Interactive 3D globe centered on ${location.name}`}>
        <Globe
          ref={globeRef}
          width={size.width}
          height={size.height}
          backgroundColor="rgba(0,0,0,0)"
          showAtmosphere
          atmosphereColor="#78c9a2"
          atmosphereAltitude={0.14}
          showGraticules
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          /* 1. Global Air Quality Atmospheric Heatmap Plumes (Translucent veil across all continents) */
          heatmapsData={heatmap ? [heatmapDataset] : []}
          heatmapPoints={(d: object) => (d as { points: Array<{ lat: number; lng: number; weight: number }> }).points}
          heatmapPointLat={(p: object) => (p as { lat: number }).lat}
          heatmapPointLng={(p: object) => (p as { lng: number }).lng}
          heatmapPointWeight={(p: object) => (p as { weight: number }).weight}
          heatmapBandwidth={4.2}
          heatmapColorSaturation={1.5}
          heatmapBaseAltitude={0.005}
          heatmapTopAltitude={0.018}
          heatmapColorFn={() => (t: number) => {
            // Power curve s = t^0.40 lifts lower/moderate atmospheric loads across all continents into visibility
            const s = Math.pow(t, 0.40);
            if (s < 0.08) return "rgba(0, 0, 0, 0)";
            if (s < 0.32) return "rgba(34, 197, 94, 0.28)";   // #22c55e Emerald green (Good air, gentle veil)
            if (s < 0.52) return "rgba(234, 179, 8, 0.38)";   // #eab308 Warm amber/yellow (Moderate)
            if (s < 0.70) return "rgba(249, 115, 22, 0.48)";  // #f97316 Deep orange (Sensitive)
            if (s < 0.86) return "rgba(220, 38, 38, 0.58)";   // #dc2626 Crimson red (Unhealthy)
            return "rgba(147, 51, 234, 0.68)";                // #9333ea Deep purple/magenta (Hazardous)
          }}
          /* 2. Country Boundary Lines (High-contrast geographical outlines) */
          polygonsData={countries}
          polygonCapColor={() => "rgba(0, 0, 0, 0)"}
          polygonSideColor={() => "rgba(0, 0, 0, 0)"}
          polygonStrokeColor={() => "rgba(130, 245, 175, 0.58)"}
          polygonAltitude={0.006}
          onPolygonClick={(_, event, coords) => {
            event?.stopPropagation();
            selectCoordinates(coords);
          }}
          /* 3. Atmospheric Wind Streamlines */
          pathsData={wind ? WIND_STREAMLINES : []}
          pathPoints={(d: object) => (d as { coords: Array<[number, number]> }).coords}
          pathPointLat={(p: [number, number]) => p[0]}
          pathPointLng={(p: [number, number]) => p[1]}
          pathPointAlt={() => 0.012}
          pathColor={() => "rgba(235, 255, 248, 0.55)"}
          pathDashLength={0.16}
          pathDashGap={0.05}
          pathDashAnimateTime={6500}
          onPathClick={(_, event, coords) => {
            event?.stopPropagation();
            selectCoordinates(coords);
          }}
          /* 4. Active Station Telemetry & Continent Hotspot Pins */
          pointsData={displayPoints}
          pointLat="lat"
          pointLng="lng"
          pointColor={(item) => colorForAqi((item as Point).aqi)}
          pointRadius={0.34}
          pointAltitude={0.024}
          pointResolution={16}
          pointLabel={(item) => {
            const p = item as Point;
            return `${escapeHtml(p.label)}<br/>${p.aqi === null ? "AQI unavailable" : `AQI ${Math.round(p.aqi)}`}`;
          }}
          onPointClick={(_, event, coords) => {
            event?.stopPropagation();
            selectCoordinates(coords);
          }}
          onGlobeClick={(coords) => selectCoordinates(coords)}
          onGlobeReady={() => setReady(true)}
          enablePointerInteraction
          animateIn
        />
        {ready && wind && weather?.wind_speed_10m !== undefined && (
          <div className="globe-weather-chip wind-chip">
            <Wind size={13} style={{ transform: `rotate(${windAngle}deg)` }} /> {weather.wind_speed_10m} km/h{" "}
            <small>MODEL WIND · SELECTED POINT</small>
          </div>
        )}
        {ready && temperature && weather?.temperature_2m !== undefined && (
          <div className={`globe-weather-chip temperature-chip ${wind ? "with-wind" : ""}`}>
            <span className="temperature-dot" />
            {weather.temperature_2m}°C <small>MODEL TEMP · SELECTED POINT</small>
          </div>
        )}
        <span className="globe-data-caption">
          {air?.provenance === "station-observation"
            ? "GROUND STATION OBSERVATION"
            : air?.provenance === "modeled-estimate"
              ? "MODELED AIR QUALITY ESTIMATE"
              : "SELECT A POINT TO EXPLORE"}
        </span>
      </div>
    </>
  );
}
