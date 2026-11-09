"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Info,
  Search,
  Share2,
  Star,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, Layer } from "leaflet";

export type MapLayerKey = "aqi" | "pm2_5" | "pm10" | "ozone" | "no2" | "so2" | "co";

export interface SpatialHotspot {
  id: string;
  name: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
  aqi: number;
  status: string;
  advisory: string;
  pollutants: {
    pm2_5: number;
    pm10: number;
    ozone: number;
    no2: number;
    so2: number;
    co: number;
  };
  provenance: string;
  updatedAt: string;
}

export const INITIAL_HOTSPOTS: SpatialHotspot[] = [
  {
    id: "delhi",
    name: "Delhi",
    state: "National Capital Region",
    country: "India",
    lat: 28.6139,
    lng: 77.209,
    aqi: 175,
    status: "Unhealthy",
    advisory: "Everyone may begin to experience health effects; members of sensitive groups may experience more serious effects.",
    pollutants: { pm2_5: 84.1, pm10: 108.0, ozone: 104.0, no2: 88.1, so2: 52.3, co: 1459.0 },
    provenance: "OpenAQ v3 Ground Station (CPCB/DPCC)",
    updatedAt: "Today, 5:30 PM IST",
  },
  {
    id: "mumbai",
    name: "Mumbai",
    state: "Maharashtra",
    country: "India",
    lat: 19.076,
    lng: 72.8777,
    aqi: 98,
    status: "Moderate",
    advisory: "Air quality is acceptable; however, for some pollutants there may be a moderate health concern for sensitive individuals.",
    pollutants: { pm2_5: 35.0, pm10: 75.0, ozone: 54.0, no2: 32.0, so2: 18.0, co: 620.0 },
    provenance: "OpenAQ Physical Station (MPCB)",
    updatedAt: "Today, 5:15 PM IST",
  },
  {
    id: "bengaluru",
    name: "Bengaluru",
    state: "Karnataka",
    country: "India",
    lat: 12.9716,
    lng: 77.5946,
    aqi: 65,
    status: "Moderate",
    advisory: "Air quality is favorable. Ideal conditions for outdoor ventilation and physical activity.",
    pollutants: { pm2_5: 19.2, pm10: 48.0, ozone: 42.0, no2: 28.0, so2: 12.0, co: 450.0 },
    provenance: "KSPCB Continuous Monitor",
    updatedAt: "Today, 5:00 PM IST",
  },
  {
    id: "patna",
    name: "Patna",
    state: "Bihar",
    country: "India",
    lat: 25.5941,
    lng: 85.1376,
    aqi: 195,
    status: "Unhealthy",
    advisory: "High particulate accumulation. Active children and adults with respiratory illness should avoid prolonged outdoor exertion.",
    pollutants: { pm2_5: 98.4, pm10: 148.0, ozone: 72.0, no2: 55.0, so2: 32.0, co: 1200.0 },
    provenance: "BSPCB Physical Station",
    updatedAt: "Today, 5:10 PM IST",
  },
  {
    id: "lucknow",
    name: "Lucknow",
    state: "Uttar Pradesh",
    country: "India",
    lat: 26.8467,
    lng: 80.9462,
    aqi: 182,
    status: "Unhealthy",
    advisory: "Particulate smog prevailing across city core. N95 masks advised during morning and evening rush hours.",
    pollutants: { pm2_5: 91.2, pm10: 135.0, ozone: 68.0, no2: 50.0, so2: 28.0, co: 1100.0 },
    provenance: "UPPCB Station Network",
    updatedAt: "Today, 4:55 PM IST",
  },
  {
    id: "kolkata",
    name: "Kolkata",
    state: "West Bengal",
    country: "India",
    lat: 22.5726,
    lng: 88.3639,
    aqi: 162,
    status: "Unhealthy",
    advisory: "Industrial and boundary layer emissions causing smog. Sensitive groups should wear filtration masks outdoors.",
    pollutants: { pm2_5: 78.0, pm10: 115.0, ozone: 65.0, no2: 45.0, so2: 24.0, co: 950.0 },
    provenance: "WBPCB Ground Station",
    updatedAt: "Today, 5:20 PM IST",
  },
  {
    id: "chennai",
    name: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    lat: 13.0827,
    lng: 80.2707,
    aqi: 72,
    status: "Moderate",
    advisory: "Maritime breeze dispersing coastal emissions. Good ambient air conditions for general public.",
    pollutants: { pm2_5: 22.0, pm10: 52.0, ozone: 38.0, no2: 25.0, so2: 15.0, co: 480.0 },
    provenance: "TNPCB Marine Sensor",
    updatedAt: "Today, 5:05 PM IST",
  },
  {
    id: "hyderabad",
    name: "Hyderabad",
    state: "Telangana",
    country: "India",
    lat: 17.385,
    lng: 78.4867,
    aqi: 88,
    status: "Moderate",
    advisory: "Moderate vehicular congestion along IT corridor. Acceptable air quality index.",
    pollutants: { pm2_5: 30.0, pm10: 65.0, ozone: 48.0, no2: 34.0, so2: 16.0, co: 540.0 },
    provenance: "TSPCB Urban Monitor",
    updatedAt: "Today, 5:25 PM IST",
  },
  {
    id: "ahmedabad",
    name: "Ahmedabad",
    state: "Gujarat",
    country: "India",
    lat: 23.0225,
    lng: 72.5714,
    aqi: 125,
    status: "Unhealthy for Sensitive Groups",
    advisory: "Industrial dust and dry winds elevate inhalable particulate levels.",
    pollutants: { pm2_5: 48.0, pm10: 88.0, ozone: 52.0, no2: 36.0, so2: 20.0, co: 710.0 },
    provenance: "GPCB Physical Station",
    updatedAt: "Today, 5:10 PM IST",
  },
  {
    id: "jaipur",
    name: "Jaipur",
    state: "Rajasthan",
    country: "India",
    lat: 26.9124,
    lng: 75.7873,
    aqi: 140,
    status: "Unhealthy for Sensitive Groups",
    advisory: "Mineral dust coupled with commuter traffic emissions causing light haze.",
    pollutants: { pm2_5: 56.0, pm10: 98.0, ozone: 62.0, no2: 38.0, so2: 22.0, co: 780.0 },
    provenance: "RSPCB Ground Station",
    updatedAt: "Today, 4:40 PM IST",
  },
  {
    id: "mangaluru",
    name: "Mangaluru",
    state: "Karnataka",
    country: "India",
    lat: 12.9141,
    lng: 74.856,
    aqi: 78,
    status: "Moderate",
    advisory: "Coastal air currents maintaining moderate particulate dispersal.",
    pollutants: { pm2_5: 25.0, pm10: 55.0, ozone: 35.0, no2: 20.0, so2: 12.0, co: 380.0 },
    provenance: "KSPCB Port Monitor",
    updatedAt: "Today, 5:18 PM IST",
  },
  {
    id: "tokyo",
    name: "Tokyo",
    state: "Tokyo",
    country: "Japan",
    lat: 35.6762,
    lng: 139.6503,
    aqi: 35,
    status: "Good",
    advisory: "Excellent air quality. Pollutant levels are below WHO health guideline benchmarks.",
    pollutants: { pm2_5: 9.0, pm10: 18.0, ozone: 40.0, no2: 18.0, so2: 6.0, co: 280.0 },
    provenance: "Tokyo Metropolitan Environment Bureau",
    updatedAt: "Today, 9:00 PM JST",
  },
  {
    id: "new-york",
    name: "New York",
    state: "New York",
    country: "United States",
    lat: 40.7128,
    lng: -74.006,
    aqi: 42,
    status: "Good",
    advisory: "Air quality is good and poses little or no risk to public health.",
    pollutants: { pm2_5: 11.0, pm10: 22.0, ozone: 45.0, no2: 21.0, so2: 8.0, co: 320.0 },
    provenance: "US EPA AirNow",
    updatedAt: "Today, 7:00 AM EST",
  },
  {
    id: "london",
    name: "London",
    state: "England",
    country: "United Kingdom",
    lat: 51.5072,
    lng: -0.1276,
    aqi: 38,
    status: "Good",
    advisory: "Low pollution levels throughout Greater London.",
    pollutants: { pm2_5: 10.0, pm10: 20.0, ozone: 43.0, no2: 24.0, so2: 7.0, co: 310.0 },
    provenance: "London Air Quality Network (LAQN)",
    updatedAt: "Today, 12:00 PM GMT",
  },
];

function getAqiCategory(aqi: number) {
  if (aqi <= 50) return { category: "Good", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)" };
  if (aqi <= 100) return { category: "Moderate", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" };
  if (aqi <= 150) return { category: "Unhealthy for Sensitive Groups", color: "#f97316", bg: "rgba(249, 115, 22, 0.15)" };
  if (aqi <= 200) return { category: "Unhealthy", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" };
  if (aqi <= 300) return { category: "Very Unhealthy", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.15)" };
  return { category: "Hazardous", color: "#881337", bg: "rgba(136, 19, 55, 0.15)" };
}

interface OverviewSpatialMapProps {
  onSelectCity?: (hotspot: SpatialHotspot) => void;
  selectedCity?: SpatialHotspot;
}

export function OverviewSpatialMap({ onSelectCity, selectedCity }: OverviewSpatialMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Layer[]>([]);

  const [activeHotspot, setActiveHotspot] = useState<SpatialHotspot>(selectedCity || INITIAL_HOTSPOTS[0]);
  const [activeLayer, setActiveLayer] = useState<MapLayerKey>("aqi");
  const [weatherOverlay, setWeatherOverlay] = useState(false);
  const [windOverlay, setWindOverlay] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  // Sync when prop changes
  useEffect(() => {
    if (selectedCity && selectedCity.id !== activeHotspot.id) {
      setActiveHotspot(selectedCity);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([selectedCity.lat, selectedCity.lng], 6, { duration: 1.2 });
      }
    }
  }, [selectedCity, activeHotspot.id]);

  // Update markers helper
  const renderMarkers = (L: typeof import("leaflet"), map: LeafletMap) => {
    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    INITIAL_HOTSPOTS.forEach((spot) => {
      const cat = getAqiCategory(spot.aqi);

      // Outer heat glow
      const halo = L.circle([spot.lat, spot.lng], {
        radius: spot.aqi > 150 ? 45000 : 25000,
        color: cat.color,
        fillColor: cat.color,
        fillOpacity: 0.22,
        weight: 0,
      }).addTo(map);

      // Pulsing hotspot icon
      const customIcon = L.divIcon({
        className: "custom-aqi-hotspot-pin",
        html: `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            cursor: pointer;
          ">
            <span style="
              position: absolute;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: ${cat.color};
              opacity: 0.4;
              animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></span>
            <span style="
              position: relative;
              width: 14px;
              height: 14px;
              border-radius: 50%;
              background: ${cat.color};
              border: 2px solid #ffffff;
              box-shadow: 0 0 8px ${cat.color};
            "></span>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([spot.lat, spot.lng], { icon: customIcon }).addTo(map);

      marker.on("click", () => {
        setActiveHotspot(spot);
        if (onSelectCity) onSelectCity(spot);
        map.flyTo([spot.lat, spot.lng], 6, { duration: 0.8 });
      });

      markersRef.current.push(halo, marker);
    });
  };

  // Initialize Leaflet Map safely in React 18/19 StrictMode
  useEffect(() => {
    let canceled = false;

    async function initMap() {
      const container = mapContainerRef.current;
      if (!container) return;

      // Clean up previous instance if already assigned
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {
          // ignore
        }
        mapInstanceRef.current = null;
      }

      // Completely clear any leftover Leaflet ID and DOM children
      if ((container as any)._leaflet_id) {
        delete (container as any)._leaflet_id;
        container.innerHTML = "";
      }

      const L = await import("leaflet");
      if (canceled || !mapContainerRef.current) return;

      // Double-check clean state immediately before initialization
      const targetContainer = mapContainerRef.current;
      if ((targetContainer as any)._leaflet_id) {
        delete (targetContainer as any)._leaflet_id;
        targetContainer.innerHTML = "";
      }

      const map = L.map(targetContainer, {
        center: [activeHotspot.lat, activeHotspot.lng],
        zoom: 5,
        zoomControl: false,
        attributionControl: false,
      });

      // Free standard OpenStreetMap tile layer (zero watermarks, no API key required)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        subdomains: ["a", "b", "c"],
      }).addTo(map);

      // Custom zoom control in bottom right
      L.control.zoom({ position: "bottomright" }).addTo(map);

      mapInstanceRef.current = map;

      // Render hot spot circles and glowing heat halos
      renderMarkers(L, map);
    }

    initMap();

    return () => {
      canceled = true;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {
          // ignore
        }
        mapInstanceRef.current = null;
      }
      if (mapContainerRef.current) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.toLowerCase().trim();
    if (!query) return;

    const matched = INITIAL_HOTSPOTS.find(
      (h) => h.name.toLowerCase().includes(query) || h.state.toLowerCase().includes(query) || h.country.toLowerCase().includes(query)
    );

    if (matched) {
      setActiveHotspot(matched);
      if (onSelectCity) onSelectCity(matched);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([matched.lat, matched.lng], 6, { duration: 1.0 });
      }
    }
  };

  const aqiInfo = getAqiCategory(activeHotspot.aqi);

  return (
    <div className="overview-spatial-explorer w-full relative rounded-3xl overflow-hidden border border-[var(--dash-rule)] shadow-lg bg-stone-100 dark:bg-stone-900 min-h-[640px] sm:min-h-[720px] flex flex-col justify-between">
      {/* ------------------------------------------------------------------ */}
      {/* Top Floating App Bar (Search, Live Indicator, Theme, Share) */}
      {/* ------------------------------------------------------------------ */}
      <div className="absolute top-4 left-4 right-4 z-[400] flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Search Bar on Left / Center */}
        <form
          onSubmit={handleSearchSubmit}
          className="pointer-events-auto flex items-center bg-white/95 dark:bg-stone-900/95 backdrop-blur-md px-4 py-2 rounded-full border border-[var(--dash-rule)] shadow-md w-full max-w-sm sm:max-w-md transition-all focus-within:ring-2 focus-within:ring-[var(--dash-accent)]"
        >
          <Search size={18} className="text-[var(--dash-muted)] mr-2 flex-none" />
          <input
            type="text"
            placeholder="Search any city or region (e.g. Delhi, Mumbai, Bengaluru)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs sm:text-sm text-[var(--dash-ink)] outline-none placeholder:text-[var(--dash-muted)]"
          />
          <button
            type="submit"
            className="ml-2 px-3 py-1 rounded-full bg-[var(--dash-accent)] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            GO
          </button>
        </form>

        {/* Live Badge & Actions */}
        <div className="pointer-events-auto flex items-center gap-2">
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-[var(--dash-rule)] text-xs font-mono font-medium text-[var(--dash-ink)] shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Telemetry
          </span>
          <button
            type="button"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: "Vayu Index", url: window.location.href });
              }
            }}
            className="p-2 rounded-full bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-[var(--dash-rule)] text-[var(--dash-ink)] hover:text-[var(--dash-accent)] shadow-sm transition-colors"
            title="Share Spatial Telemetry"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Full-bleed Leaflet Map Container */}
      {/* ------------------------------------------------------------------ */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0 w-full h-full" />

      {/* ------------------------------------------------------------------ */}
      {/* Left Floating Card: City Telemetry, AQI, Health Advisory & Pollutants */}
      {/* ------------------------------------------------------------------ */}
      <div className="absolute top-20 left-4 z-[400] w-full max-w-xs sm:max-w-sm pointer-events-auto">
        <div className="p-5 rounded-2xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-[var(--dash-rule)] shadow-xl space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--dash-rule)] pb-2.5">
            <div>
              <h2 className="text-xl font-extrabold text-[var(--dash-ink)] tracking-tight">
                {activeHotspot.name}
              </h2>
              <span className="text-[10px] font-mono tracking-wider uppercase text-[var(--dash-muted)]">
                CURRENT AIR QUALITY · {activeHotspot.state}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              aria-label="Bookmark location"
              className="p-1.5 rounded-lg text-[var(--dash-muted)] hover:text-amber-500 transition-colors"
            >
              <Star size={18} className={isFavorite ? "fill-amber-500 text-amber-500" : ""} />
            </button>
          </div>

          {/* Big AQI Banner with India Gate Silhouette Backdrop */}
          <div
            className="p-5 rounded-xl border border-stone-200 dark:border-stone-800 relative overflow-hidden flex flex-col justify-between"
            style={{
              background: `linear-gradient(135deg, ${aqiInfo.bg}, rgba(255, 255, 255, 0.4))`,
            }}
          >
            {/* Subtle Urban Silhouette Background */}
            <div className="absolute right-0 bottom-0 opacity-15 pointer-events-none">
              <svg width="120" height="70" viewBox="0 0 120 70" fill="currentColor">
                <path d="M10 70 L10 40 L25 40 L25 25 L40 25 L40 10 L50 10 L50 70 Z M60 70 L60 20 L75 20 L75 70 Z M85 70 L85 35 L100 35 L100 15 L110 15 L110 70 Z" />
              </svg>
            </div>

            <div className="relative z-10">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--dash-muted)]">
                US AQI
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-5xl font-black font-mono tracking-tight" style={{ color: aqiInfo.color }}>
                  {activeHotspot.aqi}
                </span>
                <span className="text-base font-bold" style={{ color: aqiInfo.color }}>
                  {activeHotspot.status}
                </span>
              </div>
            </div>

            <span className="relative z-10 text-[10px] font-mono text-[var(--dash-muted)] mt-2">
              US AQI · forecast model · as of {activeHotspot.updatedAt}
            </span>
          </div>

          {/* Health Advisory Box */}
          <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-[var(--dash-rule)]">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--dash-accent)] block mb-1">
              HEALTH ADVISORY
            </span>
            <p className="text-xs text-[var(--dash-ink)] leading-relaxed">
              {activeHotspot.advisory}
            </p>
          </div>

          {/* Individual Pollutants Progress Bars */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-[var(--dash-muted)]">
              <span>Pollutants</span>
              <span>µg/m³</span>
            </div>

            {/* PM2.5 */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-[var(--dash-ink)] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> PM2.5
              </span>
              <span className="font-mono font-bold text-[var(--dash-ink)]">
                {activeHotspot.pollutants.pm2_5}
              </span>
            </div>

            {/* PM10 */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-[var(--dash-ink)] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> PM10
              </span>
              <span className="font-mono font-bold text-[var(--dash-ink)]">
                {activeHotspot.pollutants.pm10}
              </span>
            </div>

            {/* O3 */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-[var(--dash-ink)] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> O₃
              </span>
              <span className="font-mono font-bold text-[var(--dash-ink)]">
                {activeHotspot.pollutants.ozone}
              </span>
            </div>

            {/* NO2 */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-[var(--dash-ink)] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-sky-500" /> NO₂
              </span>
              <span className="font-mono font-bold text-[var(--dash-ink)]">
                {activeHotspot.pollutants.no2}
              </span>
            </div>

            {/* SO2 */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-[var(--dash-ink)] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" /> SO₂
              </span>
              <span className="font-mono font-bold text-[var(--dash-ink)]">
                {activeHotspot.pollutants.so2}
              </span>
            </div>

            {/* CO */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-[var(--dash-ink)] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-teal-500" /> CO
              </span>
              <span className="font-mono font-bold text-[var(--dash-ink)]">
                {activeHotspot.pollutants.co}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Right Floating Control Panel: MAP LAYERS (AQI, PM2.5, PM10, etc.) */}
      {/* ------------------------------------------------------------------ */}
      <div className="absolute top-20 right-4 z-[400] w-52 sm:w-60 pointer-events-auto hidden md:block">
        <div className="p-4 rounded-2xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-[var(--dash-rule)] shadow-xl space-y-3.5">
          <span className="text-[11px] font-mono font-bold tracking-widest text-[var(--dash-muted)] uppercase block border-b border-[var(--dash-rule)] pb-2">
            MAP LAYERS
          </span>

          <div className="space-y-1.5">
            {[
              { key: "aqi", label: "Air Quality (AQI)" },
              { key: "pm2_5", label: "PM2.5" },
              { key: "pm10", label: "PM10" },
              { key: "ozone", label: "Ozone (O₃)" },
              { key: "no2", label: "NO₂" },
              { key: "so2", label: "SO₂" },
              { key: "co", label: "CO" },
            ].map((layer) => (
              <label
                key={layer.key}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  activeLayer === layer.key
                    ? "bg-[var(--dash-surface-soft)] text-[var(--dash-accent)] font-bold"
                    : "text-[var(--dash-ink)] hover:bg-[var(--dash-surface-soft)]"
                }`}
              >
                <input
                  type="radio"
                  name="map_layer"
                  value={layer.key}
                  checked={activeLayer === layer.key}
                  onChange={() => setActiveLayer(layer.key as MapLayerKey)}
                  className="accent-[var(--dash-accent)] cursor-pointer"
                />
                <span>{layer.label}</span>
              </label>
            ))}
          </div>

          <div className="border-t border-[var(--dash-rule)] pt-3 space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--dash-muted)] block">
              OVERLAYS
            </span>
            <div className="flex items-center justify-between text-xs text-[var(--dash-ink)]">
              <span>Weather</span>
              <input
                type="checkbox"
                checked={weatherOverlay}
                onChange={(e) => setWeatherOverlay(e.target.checked)}
                className="accent-[var(--dash-accent)] cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-[var(--dash-ink)]">
              <span>Wind</span>
              <input
                type="checkbox"
                checked={windOverlay}
                onChange={(e) => setWindOverlay(e.target.checked)}
                className="accent-[var(--dash-accent)] cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Bottom Floating Card: AQI SCALE (US) with active range highlight */}
      {/* ------------------------------------------------------------------ */}
      <div className="absolute bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 z-[400] pointer-events-auto w-auto md:w-full md:max-w-3xl">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-[var(--dash-rule)] shadow-xl">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--dash-muted)] mb-3">
            <span>AQI SCALE (US)</span>
            <Info size={13} className="text-[var(--dash-muted)]" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            {[
              { range: "0–50", label: "Good", color: "#10b981", active: activeHotspot.aqi <= 50 },
              { range: "51–100", label: "Moderate", color: "#f59e0b", active: activeHotspot.aqi > 50 && activeHotspot.aqi <= 100 },
              {
                range: "101–150",
                label: "Unhealthy for Sensitive",
                color: "#f97316",
                active: activeHotspot.aqi > 100 && activeHotspot.aqi <= 150,
              },
              { range: "151–200", label: "Unhealthy", color: "#ef4444", active: activeHotspot.aqi > 150 && activeHotspot.aqi <= 200 },
              { range: "201–300", label: "Very Unhealthy", color: "#8b5cf6", active: activeHotspot.aqi > 200 && activeHotspot.aqi <= 300 },
              { range: "301+", label: "Hazardous", color: "#881337", active: activeHotspot.aqi > 300 },
            ].map((tier) => (
              <div
                key={tier.range}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  tier.active
                    ? "border-rose-500 shadow-[0_0_12px_rgba(239,68,68,0.25)] bg-rose-500/10 scale-105 z-10"
                    : "border-[var(--dash-rule)] bg-[var(--dash-surface-soft)] opacity-85"
                }`}
              >
                <span
                  className="w-full h-1.5 rounded-full inline-block mb-1"
                  style={{ backgroundColor: tier.color }}
                />
                <span className="text-[11px] font-mono font-bold text-[var(--dash-ink)] block">
                  {tier.range}
                </span>
                <span className="text-[10px] text-[var(--dash-muted)] font-medium leading-tight line-clamp-1">
                  {tier.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OverviewSpatialMap;
