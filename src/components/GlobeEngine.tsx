"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Wind } from "lucide-react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import * as THREE from "three";
import type { AirQualityResponse, Location } from "@/lib/types";
import { AQI_COLORS } from "@/lib/aqi-calculator";
import type { MapLayer } from "@/components/MapLayersPanel";

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

// Global Atmospheric Heatmap Seed Points across all continents and pollution belts
const BASE_HEATMAP_POINTS: Array<{ lat: number; lng: number; weight: number }> = [
  // Indo-Gangetic Plain & Northern South Asia (Severe / Maroon & Crimson)
  { lat: 28.61, lng: 77.21, weight: 0.98 }, // Delhi
  { lat: 28.45, lng: 77.02, weight: 0.96 }, // Gurgaon
  { lat: 28.53, lng: 77.39, weight: 0.97 }, // Noida
  { lat: 28.67, lng: 77.45, weight: 0.96 }, // Ghaziabad
  { lat: 28.98, lng: 77.70, weight: 0.92 }, // Meerut
  { lat: 30.73, lng: 76.78, weight: 0.88 }, // Chandigarh
  { lat: 30.90, lng: 75.85, weight: 0.93 }, // Ludhiana
  { lat: 31.63, lng: 74.87, weight: 0.94 }, // Amritsar
  { lat: 31.52, lng: 74.36, weight: 0.99 }, // Lahore (Hazardous)
  { lat: 31.42, lng: 73.08, weight: 0.95 }, // Faisalabad
  { lat: 33.68, lng: 73.04, weight: 0.86 }, // Islamabad
  { lat: 27.18, lng: 78.01, weight: 0.89 }, // Agra
  { lat: 26.85, lng: 80.95, weight: 0.91 }, // Lucknow
  { lat: 26.45, lng: 80.33, weight: 0.93 }, // Kanpur
  { lat: 25.32, lng: 82.97, weight: 0.87 }, // Varanasi
  { lat: 25.59, lng: 85.14, weight: 0.92 }, // Patna
  { lat: 26.14, lng: 85.36, weight: 0.88 }, // Muzaffarpur
  { lat: 24.80, lng: 85.00, weight: 0.84 }, // Gaya
  { lat: 23.81, lng: 90.41, weight: 0.88 }, // Dhaka (Crimson)
  { lat: 22.57, lng: 88.36, weight: 0.76 }, // Kolkata
  { lat: 26.14, lng: 91.74, weight: 0.65 }, // Guwahati

  // Western & Central India (Orange / Red)
  { lat: 26.91, lng: 75.79, weight: 0.78 }, // Jaipur
  { lat: 26.24, lng: 73.02, weight: 0.72 }, // Jodhpur
  { lat: 23.02, lng: 72.57, weight: 0.68 }, // Ahmedabad
  { lat: 21.17, lng: 72.83, weight: 0.62 }, // Surat
  { lat: 22.31, lng: 73.18, weight: 0.64 }, // Vadodara
  { lat: 19.08, lng: 72.88, weight: 0.65 }, // Mumbai
  { lat: 19.22, lng: 73.15, weight: 0.64 }, // Kalyan-Dombivli
  { lat: 19.20, lng: 72.98, weight: 0.63 }, // Thane
  { lat: 19.03, lng: 73.02, weight: 0.62 }, // Navi Mumbai
  { lat: 18.52, lng: 73.86, weight: 0.58 }, // Pune
  { lat: 19.99, lng: 73.79, weight: 0.55 }, // Nashik
  { lat: 21.15, lng: 79.08, weight: 0.60 }, // Nagpur
  { lat: 22.72, lng: 75.86, weight: 0.63 }, // Indore
  { lat: 23.26, lng: 77.41, weight: 0.61 }, // Bhopal

  // Southern India (Yellow / Light Green)
  { lat: 17.38, lng: 78.49, weight: 0.48 }, // Hyderabad
  { lat: 12.97, lng: 77.59, weight: 0.32 }, // Bengaluru
  { lat: 13.08, lng: 80.27, weight: 0.35 }, // Chennai
  { lat: 11.02, lng: 76.96, weight: 0.28 }, // Coimbatore
  { lat: 9.93,  lng: 76.27, weight: 0.24 }, // Kochi
  { lat: 8.52,  lng: 76.94, weight: 0.22 }, // Thiruvananthapuram
  { lat: 15.36, lng: 75.12, weight: 0.30 }, // Hubli

  // Middle East & Persian Gulf Dust Belt (Orange / Yellow)
  { lat: 24.86, lng: 67.01, weight: 0.74 }, // Karachi
  { lat: 25.20, lng: 55.27, weight: 0.58 }, // Dubai
  { lat: 24.45, lng: 54.38, weight: 0.54 }, // Abu Dhabi
  { lat: 25.29, lng: 51.53, weight: 0.56 }, // Doha
  { lat: 29.38, lng: 47.98, weight: 0.62 }, // Kuwait City
  { lat: 24.71, lng: 46.68, weight: 0.64 }, // Riyadh
  { lat: 21.54, lng: 39.17, weight: 0.52 }, // Jeddah
  { lat: 33.31, lng: 44.36, weight: 0.68 }, // Baghdad
  { lat: 35.69, lng: 51.39, weight: 0.72 }, // Tehran
  { lat: 30.04, lng: 31.24, weight: 0.64 }, // Cairo
  { lat: 31.20, lng: 29.92, weight: 0.56 }, // Alexandria
  { lat: 31.95, lng: 35.93, weight: 0.48 }, // Amman
  { lat: 41.30, lng: 69.24, weight: 0.55 }, // Tashkent
  { lat: 43.24, lng: 76.91, weight: 0.58 }, // Almaty

  // East Asia (Orange / Crimson / Yellow)
  { lat: 39.90, lng: 116.41, weight: 0.74 }, // Beijing
  { lat: 39.13, lng: 117.20, weight: 0.72 }, // Tianjin
  { lat: 38.04, lng: 114.51, weight: 0.76 }, // Shijiazhuang (Hebei)
  { lat: 36.65, lng: 117.12, weight: 0.70 }, // Jinan
  { lat: 34.75, lng: 113.63, weight: 0.75 }, // Zhengzhou
  { lat: 34.34, lng: 108.94, weight: 0.72 }, // Xi'an
  { lat: 30.57, lng: 104.07, weight: 0.68 }, // Chengdu
  { lat: 29.56, lng: 106.55, weight: 0.66 }, // Chongqing
  { lat: 30.59, lng: 114.31, weight: 0.60 }, // Wuhan
  { lat: 31.23, lng: 121.47, weight: 0.52 }, // Shanghai
  { lat: 23.13, lng: 113.26, weight: 0.46 }, // Guangzhou
  { lat: 22.54, lng: 114.06, weight: 0.44 }, // Shenzhen
  { lat: 37.57, lng: 126.98, weight: 0.42 }, // Seoul
  { lat: 35.18, lng: 129.08, weight: 0.36 }, // Busan
  { lat: 35.68, lng: 139.65, weight: 0.20 }, // Tokyo (Clean - Green)
  { lat: 34.69, lng: 135.50, weight: 0.22 }, // Osaka

  // Southeast Asia (Yellow / Orange / Green)
  { lat: 13.76, lng: 100.50, weight: 0.58 }, // Bangkok
  { lat: 18.79, lng: 98.98,  weight: 0.52 }, // Chiang Mai
  { lat: 21.03, lng: 105.85, weight: 0.70 }, // Hanoi
  { lat: 10.82, lng: 106.63, weight: 0.48 }, // Ho Chi Minh City
  { lat: 16.84, lng: 96.17,  weight: 0.56 }, // Yangon
  { lat: 3.14,  lng: 101.69, weight: 0.32 }, // Kuala Lumpur
  { lat: 1.35,  lng: 103.82, weight: 0.22 }, // Singapore (Good)
  { lat: -6.21, lng: 106.85, weight: 0.62 }, // Jakarta
  { lat: -7.25, lng: 112.75, weight: 0.54 }, // Surabaya
  { lat: 14.60, lng: 120.98, weight: 0.38 }, // Manila

  // Europe (Emerald Green / Light Yellow)
  { lat: 51.51, lng: -0.13,  weight: 0.18 }, // London
  { lat: 48.86, lng: 2.35,   weight: 0.20 }, // Paris
  { lat: 52.52, lng: 13.41,  weight: 0.22 }, // Berlin
  { lat: 50.85, lng: 4.35,   weight: 0.22 }, // Brussels
  { lat: 52.37, lng: 4.90,   weight: 0.19 }, // Amsterdam
  { lat: 40.42, lng: -3.70,  weight: 0.21 }, // Madrid
  { lat: 41.39, lng: 2.17,   weight: 0.24 }, // Barcelona
  { lat: 41.90, lng: 12.50,  weight: 0.28 }, // Rome
  { lat: 45.46, lng: 9.19,   weight: 0.44 }, // Milan / Po Valley
  { lat: 48.21, lng: 16.37,  weight: 0.23 }, // Vienna
  { lat: 52.23, lng: 21.01,  weight: 0.42 }, // Warsaw
  { lat: 50.06, lng: 19.94,  weight: 0.46 }, // Krakow
  { lat: 47.50, lng: 19.04,  weight: 0.32 }, // Budapest
  { lat: 44.82, lng: 20.46,  weight: 0.45 }, // Belgrade
  { lat: 37.98, lng: 23.73,  weight: 0.34 }, // Athens
  { lat: 41.01, lng: 28.98,  weight: 0.46 }, // Istanbul
  { lat: 55.75, lng: 37.62,  weight: 0.28 }, // Moscow
  { lat: 59.33, lng: 18.07,  weight: 0.12 }, // Stockholm (Clean)
  { lat: 59.91, lng: 10.75,  weight: 0.10 }, // Oslo (Clean)
  { lat: 60.17, lng: 24.94,  weight: 0.11 }, // Helsinki (Clean)

  // North America (Green / Pale Yellow)
  { lat: 40.71, lng: -74.01, weight: 0.22 }, // New York
  { lat: 42.36, lng: -71.06, weight: 0.18 }, // Boston
  { lat: 38.91, lng: -77.04, weight: 0.21 }, // Washington DC
  { lat: 41.88, lng: -87.63, weight: 0.24 }, // Chicago
  { lat: 29.76, lng: -95.37, weight: 0.32 }, // Houston
  { lat: 32.78, lng: -96.80, weight: 0.30 }, // Dallas
  { lat: 39.74, lng: -104.99,weight: 0.22 }, // Denver
  { lat: 34.05, lng: -118.24,weight: 0.48 }, // Los Angeles
  { lat: 36.75, lng: -119.77,weight: 0.52 }, // Central Valley CA
  { lat: 37.77, lng: -122.42,weight: 0.25 }, // San Francisco
  { lat: 47.61, lng: -122.33,weight: 0.16 }, // Seattle
  { lat: 43.65, lng: -79.38, weight: 0.18 }, // Toronto
  { lat: 45.50, lng: -73.57, weight: 0.16 }, // Montreal
  { lat: 49.28, lng: -123.12,weight: 0.14 }, // Vancouver
  { lat: 19.43, lng: -99.13, weight: 0.60 }, // Mexico City
  { lat: 25.69, lng: -100.32,weight: 0.56 }, // Monterrey

  // South America (Green / Light Yellow)
  { lat: 4.71,  lng: -74.07, weight: 0.28 }, // Bogota
  { lat: -0.18, lng: -78.47, weight: 0.24 }, // Quito
  { lat: -12.05,lng: -77.04, weight: 0.48 }, // Lima
  { lat: -33.45,lng: -70.67, weight: 0.48 }, // Santiago
  { lat: -34.60,lng: -58.38, weight: 0.22 }, // Buenos Aires
  { lat: -23.55,lng: -46.63, weight: 0.38 }, // Sao Paulo
  { lat: -22.91,lng: -43.17, weight: 0.34 }, // Rio de Janeiro
  { lat: -15.79,lng: -47.88, weight: 0.20 }, // Brasilia

  // Africa (Yellow / Orange / Green)
  { lat: 6.52,  lng: 3.38,   weight: 0.62 }, // Lagos
  { lat: 12.00, lng: 8.52,   weight: 0.65 }, // Kano
  { lat: 5.60,  lng: -0.19,  weight: 0.48 }, // Accra
  { lat: -4.32, lng: 15.32,  weight: 0.52 }, // Kinshasa
  { lat: -1.29, lng: 36.82,  weight: 0.26 }, // Nairobi (Green)
  { lat: 9.03,  lng: 38.74,  weight: 0.32 }, // Addis Ababa
  { lat: 33.57, lng: -7.59,  weight: 0.30 }, // Casablanca
  { lat: -26.20,lng: 28.05,  weight: 0.38 }, // Johannesburg
  { lat: -33.92,lng: 18.42,  weight: 0.16 }, // Cape Town

  // Oceania (Clean Emerald Green)
  { lat: -33.87,lng: 151.21, weight: 0.14 }, // Sydney
  { lat: -37.81,lng: 144.96, weight: 0.12 }, // Melbourne
  { lat: -27.47,lng: 153.03, weight: 0.12 }, // Brisbane
  { lat: -31.95,lng: 115.86, weight: 0.10 }, // Perth
  { lat: -36.85,lng: 174.76, weight: 0.09 }, // Auckland
  { lat: -41.29,lng: 174.78, weight: 0.08 }, // Wellington
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
  onLocationSelect,
}: Props) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [size, setSize] = useState({ width: 600, height: 500 });
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

  // Update heatmap points with current selected location reading
  const heatmapDataset = useMemo(() => {
    const points = [...livePoints];
    if (air?.current.aqi) {
      points.push({
        lat: air.stationLatitude ?? location.latitude,
        lng: air.stationLongitude ?? location.longitude,
        weight: Math.min(1, Math.max(0.1, air.current.aqi / 350)),
      });
    }
    return { id: "global-aqi-plumes", points };
  }, [livePoints, air, location.latitude, location.longitude]);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;
    globe.pointOfView({ lat: location.latitude, lng: location.longitude, altitude: 2.25 / zoom }, 1100);
  }, [location.latitude, location.longitude, zoom, ready]);

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
      const lat = coords.lat;
      const lng = coords.lng;

      onLocationSelect({
        name: "Resolving location…",
        admin: "Globe point",
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
              admin: place.admin || "Selected point",
              country: place.country || "",
              latitude: lat,
              longitude: lng,
            });
            return;
          }
        }
      } catch {}

      onLocationSelect({
        name: "Selected location",
        admin: "Globe coordinates",
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
          /* 1. Global Air Quality Atmospheric Heatmap Plumes */
          heatmapsData={heatmap ? [heatmapDataset] : []}
          heatmapPoints={(d: object) => (d as { points: Array<{ lat: number; lng: number; weight: number }> }).points}
          heatmapPointLat={(p: object) => (p as { lat: number }).lat}
          heatmapPointLng={(p: object) => (p as { lng: number }).lng}
          heatmapPointWeight={(p: object) => (p as { weight: number }).weight}
          heatmapBandwidth={5.2}
          heatmapColorSaturation={2.4}
          heatmapBaseAltitude={0.007}
          heatmapTopAltitude={0.022}
          heatmapColorFn={() => (t: number) => {
            // Normalized KDE density from 0 to 1
            if (t < 0.04) return "rgba(0, 0, 0, 0)";
            if (t < 0.20) return "rgba(34, 197, 94, 0.48)";  // #22c55e Emerald green (Good air)
            if (t < 0.40) return "rgba(234, 179, 8, 0.68)";   // #eab308 Warm amber/yellow (Moderate)
            if (t < 0.60) return "rgba(249, 115, 22, 0.82)";  // #f97316 Deep orange (Sensitive)
            if (t < 0.80) return "rgba(220, 38, 38, 0.92)";   // #dc2626 Crimson red (Unhealthy)
            return "rgba(126, 34, 206, 0.96)";                // #7e22ce Deep maroon/purple (Hazardous)
          }}
          /* 2. Country Boundary Lines */
          polygonsData={countries}
          polygonCapColor={() => "rgba(0, 0, 0, 0)"}
          polygonSideColor={() => "rgba(0, 0, 0, 0)"}
          polygonStrokeColor={() => "rgba(125, 240, 160, 0.42)"}
          polygonAltitude={0.005}
          /* 3. Atmospheric Wind Streamlines */
          pathsData={wind ? WIND_STREAMLINES : []}
          pathPoints={(d: object) => (d as { coords: Array<[number, number]> }).coords}
          pathPointLat={(p: [number, number]) => p[0]}
          pathPointLng={(p: [number, number]) => p[1]}
          pathPointAlt={() => 0.012}
          pathColor={() => "rgba(215, 250, 235, 0.45)"}
          pathDashLength={0.14}
          pathDashGap={0.04}
          pathDashAnimateTime={7500}
          /* 4. Active Station Telemetry Pin */
          pointsData={[point]}
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
