"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import * as Popover from "@radix-ui/react-popover";
import { motion } from "framer-motion";
import { ArrowUpRight, Bell, LocateFixed, Map, Minus, Moon, Plus, RotateCcw, Search, Share2, ShieldAlert, Sun } from "lucide-react";
import { AqiScaleBar } from "@/components/AqiScaleBar";
import { TelemetryCard } from "@/components/TelemetryCard";
import { DashboardMotion } from "@/components/DashboardMotion";
import type { MapLayer } from "@/components/MapLayersPanel";
import { HistoricalTracker } from "@/components/HistoricalTracker";
import { AqiForecast } from "@/components/AqiForecast";
import { AqiShareCardModal } from "@/components/AqiShareCardModal";
import { useTheme } from "@/lib/use-theme";
import { useSmartAlerts } from "@/lib/use-smart-alerts";
import type { AirQualityResponse, GeocodedPlace, Location } from "@/lib/types";
import { CONTINENTS, type Continent } from "@/lib/continents";

import { GlobalCityRanking } from "@/components/GlobalCityRanking";

const GlobeEngine = dynamic(() => import("@/components/GlobeEngine").then((module) => module.GlobeEngine), { ssr: false, loading: () => <div className="globe-loading">Loading spatial engine…</div> });

const DEFAULT_LOCATION: Location = {
  name: "New Delhi",
  admin: "Delhi",
  country: "India",
  latitude: 28.6139,
  longitude: 77.209,
};

const LAYER_FIELDS: Record<Exclude<MapLayer, "aqi">, string> = { pm2_5: "pm2_5", pm10: "pm10", o3: "ozone", no2: "nitrogen_dioxide", so2: "sulphur_dioxide", co: "carbon_monoxide" };
type DashboardView = "live" | "history" | "forecast";
const DASHBOARD_VIEWS: { id: DashboardView; label: string; index: string }[] = [
  { id: "live", label: "Live telemetry", index: "01" },
  { id: "history", label: "Historical trends", index: "02" },
  { id: "forecast", label: "72-hour forecast", index: "03" },
];

const SUB_INDEX_FIELDS = [
  { key: "pm2_5", index: "us_aqi_pm2_5", label: "PM₂.₅" },
  { key: "pm10", index: "us_aqi_pm10", label: "PM₁₀" },
  { key: "nitrogen_dioxide", index: "us_aqi_nitrogen_dioxide", label: "NO₂" },
  { key: "sulphur_dioxide", index: "us_aqi_sulphur_dioxide", label: "SO₂" },
  { key: "carbon_monoxide", index: "us_aqi_carbon_monoxide", label: "CO" },
  { key: "ozone", index: "us_aqi_ozone", label: "O₃" },
] as const;

function locationCoordinates(location: Location): string {
  const latitude = `${Math.abs(location.latitude).toFixed(2)}° ${location.latitude >= 0 ? "N" : "S"}`;
  const longitude = `${Math.abs(location.longitude).toFixed(2)}° ${location.longitude >= 0 ? "E" : "W"}`;
  return `${latitude}, ${longitude}`;
}

function getDominantPollutant(air: AirQualityResponse | null) {
  if (!air) return null;
  const reported: { key: string; label: string; value: number }[] = [];
  for (const pollutant of SUB_INDEX_FIELDS) {
    const value = air.current[pollutant.index];
    if (typeof value === "number" && Number.isFinite(value)) reported.push({ key: pollutant.key, label: pollutant.label, value });
  }
  return reported.sort((left, right) => right.value - left.value)[0]?.key ?? null;
}

function getHealthGuidance(aqi: number | null) {
  if (aqi === null) return {
    label: "No composite AQI",
    advice: "This source does not provide a comparable AQI. Review the individual pollutant readings and their timestamps.",
  };
  if (aqi <= 50) return { label: "Good Air Quality", advice: "Minimal impact. Air quality is satisfactory; enjoy usual outdoor activities." };
  if (aqi <= 100) return { label: "Satisfactory", advice: "Minor breathing discomfort may be experienced by unusually sensitive people." };
  if (aqi <= 200) return { label: "Moderate", advice: "Breathing discomfort to people with lung, asthma, or heart diseases." };
  if (aqi <= 300) return { label: "Poor", advice: "Breathing discomfort to most people on prolonged exposure. Sensitive groups should reduce outdoor exertion." };
  if (aqi <= 400) return { label: "Very Poor", advice: "Respiratory illness on prolonged exposure. Vulnerable groups should avoid outdoor exertion." };
  return { label: "Severe", advice: "Affects healthy individuals and seriously impacts those with existing respiratory or cardiac ailments. Stay indoors." };
}

export function Dashboard() {
  const [location, setLocation] = useState<Location>(DEFAULT_LOCATION);
  const [air, setAir] = useState<AirQualityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [places, setPlaces] = useState<GeocodedPlace[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [mapLayer, setMapLayer] = useState<MapLayer>("aqi");
  const [heatmapEnabled, setHeatmapEnabled] = useState(true);
  const [windEnabled, setWindEnabled] = useState(true);
  const [temperatureEnabled, setTemperatureEnabled] = useState(false);
  const [weather, setWeather] = useState<{ temperature_2m?: number; wind_speed_10m?: number; wind_direction_10m?: number; time?: string } | null>(null);
  const [globeContinent, setGlobeContinent] = useState<Continent>("All");
  const [globeMetric, setGlobeMetric] = useState<"aqi" | "pm2_5">("aqi");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { checkTelemetry, setModalOpen: setAlertsModalOpen } = useSmartAlerts();
  const [activeView, setActiveView] = useState<DashboardView>("live");

  useEffect(() => {
    const requestedView = new URLSearchParams(window.location.search).get("view");
    if (requestedView === "live" || requestedView === "history" || requestedView === "forecast") {
      setActiveView(requestedView);
    }
  }, []);

  useEffect(() => {
    if (air?.current && typeof air.current.aqi === "number") {
      const pm2_5Val = typeof air.current.pm2_5 === "number" ? air.current.pm2_5 : undefined;
      checkTelemetry(location.name, air.current.aqi, pm2_5Val);
    }
  }, [air, location.name, checkTelemetry]);

  const selectLocation = useCallback((nextLocation: Location) => setLocation(nextLocation), []);

  const detectUserLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      try {
        const response = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
        if (response.ok) {
          const place = (await response.json()) as { name?: string; admin?: string; country?: string };
          if (place.name) {
            setLocation({
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

      setLocation({
        name: "Detected location",
        admin: "Browser coordinates",
        latitude: lat,
        longitude: lng,
      });
    }, () => undefined, { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 });
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("vayu-location");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.latitude === "number" && typeof parsed.longitude === "number") {
          setLocation(parsed);
        }
      }
    } catch {}
    detectUserLocation();
  }, [detectUserLocation]);

  useEffect(() => {
    if (typeof window !== "undefined" && location) {
      try {
        localStorage.setItem("vayu-location", JSON.stringify(location));
      } catch {}
    }
  }, [location]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      setAir(null);
      const params = new URLSearchParams({ lat: String(location.latitude), lng: String(location.longitude) });
      try {
        const response = await fetch(`/api/air-quality?${params}`, { signal: controller.signal, cache: "no-store" });
        const data = (await response.json()) as AirQualityResponse | { error?: string };
        if (!response.ok) throw new Error("error" in data ? data.error : "Air quality data is unavailable.");
        if (!controller.signal.aborted) setAir(data as AirQualityResponse);
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        setError(fetchError instanceof Error ? fetchError.message : "Could not connect to the air quality provider.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [location, refreshKey]);

  useEffect(() => {
    if (!windEnabled && !temperatureEnabled) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ lat: String(location.latitude), lng: String(location.longitude) });
    fetch(`/api/weather?${params}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => { if (!response.ok) throw new Error("Weather is currently unavailable."); return response.json(); })
      .then((data: { current?: typeof weather }) => { if (!controller.signal.aborted) setWeather(data.current ?? null); })
      .catch(() => { if (!controller.signal.aborted) setWeather(null); });
    return () => controller.abort();
  }, [location.latitude, location.longitude, windEnabled, temperatureEnabled]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setPlaces([]);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      setSearchError(null);
      try {
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal });
        const data = (await response.json()) as { results?: GeocodedPlace[]; error?: string };
        if (!response.ok) throw new Error(data.error || "Location search is unavailable.");
        if (!controller.signal.aborted) setPlaces(data.results ?? []);
      } catch (fetchError) {
        if (!controller.signal.aborted) setSearchError(fetchError instanceof Error ? fetchError.message : "Location search is unavailable.");
      } finally {
        if (!controller.signal.aborted) setSearchLoading(false);
      }
    }, 320);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);

  const aqi = air?.current.aqi ?? null;
  const dominantPollutant = useMemo(() => getDominantPollutant(air), [air]);
  const guidance = getHealthGuidance(aqi);
  const providerBadge = loading ? "CONNECTING" : error ? "DATA OFFLINE" : air?.provider === "cpcb" ? "CPCB OFFICIAL TELEMETRY" : air?.provider === "openaq" ? "STATION DATA" : air?.provider === "waqi" ? "WAQI AQI" : air?.provider === "open-meteo" ? "MODEL ESTIMATE" : "AIR QUALITY DATA";
  const timestamp = air?.current.time?.replace("T", " ").slice(0, 19) ?? "TIME NOT PROVIDED";
  const activeLayerValue = mapLayer === "aqi" ? aqi : air?.current[LAYER_FIELDS[mapLayer]];
  const activeLayerUnit = mapLayer === "aqi" ? "INDEX" : air?.current_units?.[LAYER_FIELDS[mapLayer]] ?? "SOURCE UNIT";

  function choosePlace(place: GeocodedPlace) {
    setLocation({ name: place.name, admin: place.admin1, country: place.country, latitude: place.latitude, longitude: place.longitude });
    setQuery("");
    setPlaces([]);
    setSearchOpen(false);
  }

  return (
    <div className="app-shell dashboard-app min-h-screen bg-dashboard-canvas text-dashboard-ink" data-theme={theme}>
      <DashboardMotion />
      <div className="dashboard-frame">
        <main className="dashboard-page">
          <motion.div className="dashboard-masthead" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div><span className="eyebrow"><span className="eyebrow-line"/> LIVE AIR INTELLIGENCE <span className="masthead-index">/ 02</span></span><h1>Air, in <em>perspective.</em></h1></div>
            <p>Explore local readings against the wider atmosphere.<br/>Every number carries its source and timestamp.</p>
          </motion.div>
          <nav className="dashboard-view-tabs" aria-label="Dashboard views" role="tablist">
            {DASHBOARD_VIEWS.map((view) => <button key={view.id} type="button" role="tab" aria-selected={activeView === view.id} className={activeView === view.id ? "active" : ""} onClick={() => setActiveView(view.id)}><span>{view.index}</span>{view.label}</button>)}
          </nav>
          <motion.div key={activeView} className="dashboard-active-view" initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }} transition={{duration:.35,ease:"easeOut"}}>
          {activeView === "live" && <>
          <section className="dashboard-split" aria-label="Live air quality dashboard">
            <aside className="dashboard-sidebar">
              <section className="location-search-card">
                <div className="location-search-heading">
                  <div>
                    <span className="section-kicker">SELECTED PLACE</span>
                    <h2>{location.name}</h2>
                    <p>{[location.admin, location.country].filter(Boolean).join(" · ")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-300 font-mono text-[11px] font-bold border border-amber-500/30 active:scale-95 transition-all cursor-pointer shadow-xs"
                      onClick={() => setAlertsModalOpen(true)}
                      title="Set Smart AQI Threshold Alert"
                      aria-label="Set Smart AQI Threshold Alert"
                    >
                      <Bell size={13} />
                      <span>Alert</span>
                    </button>
                    <button
                      type="button"
                      className="share-report-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-mono text-[11px] font-bold active:scale-95 transition-all cursor-pointer shadow-md"
                      onClick={() => setShareModalOpen(true)}
                      title="Generate Social Sharing Card"
                      aria-label="Generate Social Sharing Card"
                    >
                      <Share2 size={13} />
                      <span>Share Card</span>
                    </button>
                    <button
                      type="button"
                      className="location-pin"
                      onClick={detectUserLocation}
                      title="Detect my real location"
                      aria-label="Detect my real location"
                      style={{ cursor: "pointer", background: "none", border: "none" }}
                    >
                      <LocateFixed size={16}/>
                    </button>
                  </div>
                </div>
                <Popover.Root open={searchOpen && query.trim().length >= 2} onOpenChange={setSearchOpen}>
                  <Popover.Anchor asChild>
                    <label className="search-box" htmlFor="city-search"><Search size={15} aria-hidden="true"/><input id="city-search" type="search" placeholder="Search a city or region" autoComplete="off" value={query} onFocus={() => setSearchOpen(true)} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") setSearchOpen(false); }}/><kbd>↵</kbd></label>
                  </Popover.Anchor>
                  <Popover.Portal>
                    <Popover.Content className={`search-results ${theme === "dark" ? "dark-results" : ""}`} align="start" sideOffset={5} onOpenAutoFocus={(event) => event.preventDefault()}>
                      {searchLoading && <div className="search-message">Searching places…</div>}
                      {!searchLoading && searchError && <div className="search-message">{searchError}</div>}
                      {!searchLoading && !searchError && query.trim().length >= 2 && places.length === 0 && <div className="search-message">No matching places found</div>}
                      {!searchLoading && places.map((place) => <button type="button" key={place.id} onClick={() => choosePlace(place)}><span>{place.name}</span><small>{[place.admin1, place.country].filter(Boolean).join(" · ")}</small></button>)}
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
                <div className="location-coordinates">{locationCoordinates(location)}</div>
              </section>

              <TelemetryCard key={`${location.latitude}:${location.longitude}`} air={air} aqi={aqi} dominantPollutant={dominantPollutant} location={location} loading={loading} error={error} onShare={() => setShareModalOpen(true)} onSetAlert={() => setAlertsModalOpen(true)}/>

              <section className="health-warning" aria-live="polite">
                <div className="health-warning-top flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="health-warning-icon"><ShieldAlert size={16}/></span>
                    <span className="section-kicker">HEALTH CONTEXT · CPCB NAQI</span>
                  </div>
                  {/* Dedicated Share Alert Badge */}
                  <button
                    type="button"
                    onClick={() => setShareModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all shadow-xs cursor-pointer active:scale-95"
                    title="Share Health Alert Card to Social Media"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600 dark:bg-amber-400"></span>
                    </span>
                    <Share2 size={11} />
                    <span>Share Alert</span>
                  </button>
                </div>
                <h2>{guidance.label}</h2>
                <p>{guidance.advice}</p>
                <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-[var(--dash-rule)]/60">
                  <a href="/risk" className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--dash-ink)] hover:text-emerald-700 transition-colors">
                    Personal risk guidance <ArrowUpRight size={13}/>
                  </a>
                  {/* Dedicated Export Infographic Trigger */}
                  <button
                    type="button"
                    onClick={() => setShareModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm cursor-pointer transition-all active:scale-95"
                    title="Export High-Resolution Infographic for Social Media"
                  >
                    <Share2 size={12} />
                    <span>Export Infographic</span>
                  </button>
                </div>
                <small>General public information. Follow local health authority guidance.</small>
              </section>
            </aside>

            <section className="spatial-viewport" aria-label="Spatial air quality visualization">
              <div className="spatial-header flex flex-wrap items-center justify-between gap-2">
                <div><span className="section-kicker">PLANETARY VIEW</span><h2>One atmosphere. Many signals.</h2></div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShareModalOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm cursor-pointer transition-all active:scale-95"
                    title="Export Share Card"
                  >
                    <Share2 size={12} />
                    <span className="hidden sm:inline">Share Card</span>
                  </button>
                  <select
                    value={globeContinent}
                    onChange={(e) => setGlobeContinent(e.target.value as Continent)}
                    aria-label="Filter globe by continent"
                    className="px-2 py-1 text-[11px] font-mono rounded border border-[var(--dash-rule)] bg-[var(--dash-surface)] text-[var(--dash-ink)] cursor-pointer focus:outline-none"
                  >
                    {CONTINENTS.map((c) => (
                      <option key={c} value={c}>{c === "All" ? "All Continents" : c}</option>
                    ))}
                  </select>
                  <select
                    value={globeMetric}
                    onChange={(e) => setGlobeMetric(e.target.value as "aqi" | "pm2_5")}
                    aria-label="Globe metric selector"
                    className="px-2 py-1 text-[11px] font-mono font-semibold rounded border border-emerald-600/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 cursor-pointer focus:outline-none"
                  >
                    <option value="aqi">AQI (IN)</option>
                    <option value="pm2_5">PM2.5</option>
                  </select>
                  <span className="spatial-mode hidden sm:inline-flex"><Map size={13}/> SPATIAL PREVIEW</span>
                </div>
              </div>
              <div className="spatial-canvas" id="globe">
                <div className="spatial-grid"/><div className="spatial-orbit spatial-orbit-one"/><div className="spatial-orbit spatial-orbit-two"/>
                <div className="spatial-location-tag"><i/>{location.name}<small>{locationCoordinates(location)}</small></div>
                <motion.div className="spatial-globe-wrap" key="globe-engine" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .7, ease: "easeOut" }}>
                  <GlobeEngine location={location} air={air} layer={mapLayer} weather={weather} heatmap={heatmapEnabled} wind={windEnabled} temperature={temperatureEnabled} zoom={zoom} continent={globeContinent} metric={globeMetric} onLocationSelect={selectLocation}/>
                </motion.div>
                <div className="spatial-aqi-chip"><span>{mapLayer === "aqi" ? air?.sourceLabel ?? "WAITING FOR SOURCE" : `${mapLayer.toUpperCase().replace("_", "₂.")} · ${activeLayerUnit}`}</span><strong>{typeof activeLayerValue === "number" ? (mapLayer === "aqi" ? Math.round(activeLayerValue) : activeLayerValue.toFixed(1)) : "—"}</strong></div>
                <div className="spatial-controls"><button type="button" aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(1.18, value + .05))}><Plus size={14}/></button><button type="button" aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(.88, value - .05))}><Minus size={14}/></button></div>
                <div className="spatial-caption"><i/> CLICK THE GLOBE TO LOAD A NEW COORDINATE</div>
              </div>
              <div className="spatial-footer">
                <div className="spatial-attribution"><span className="section-kicker">DATA PROVENANCE</span><div>{air ? <><a href={air.sourceUrl} target="_blank" rel="noreferrer">{air.sourceLabel}</a>{air.stationName && air.stationUrl && <> <span>·</span> <a href={air.stationUrl} target="_blank" rel="noreferrer">{air.stationName}</a></>}</> : error ? error : "Waiting for air quality source"}</div></div>
                <div className="spatial-updated"><span className="section-kicker">SOURCE TIME · {air?.timezone ?? "—"}</span><div>{timestamp}</div><button type="button" onClick={() => setRefreshKey((key) => key + 1)} aria-label="Refresh air quality data" title="Refresh data"><RotateCcw size={13}/> Refresh</button></div>
              </div>
              {air?.fallbackNote && <p className="spatial-fallback-note">{air.fallbackNote}</p>}
            </section>
          </section>
          <AqiScaleBar value={aqi}/>
          <GlobalCityRanking onSelectLocation={selectLocation}/>
          </>}
          {activeView === "history" && <HistoricalTracker location={location}/>}
          {activeView === "forecast" && <AqiForecast location={location}/>}
          </motion.div>
          <footer className="dashboard-footer">
            <span>VAYU INDEX <i>·</i> REAL-TIME GLOBAL AIR INTELLIGENCE</span>
            <span>{air ? <>ATTRIBUTION: {air.attribution.map((item, index) => <span key={`${item.name}-${index}`}>{index > 0 && <b> · </b>}{item.url ? <a href={item.url} target="_blank" rel="noreferrer">{item.name}</a> : item.name}</span>)}</> : "SOURCE ATTRIBUTION WILL APPEAR WITH DATA"}</span>
          </footer>
        </main>
      </div>

      <AqiShareCardModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        air={air}
        location={location}
        dominantPollutant={dominantPollutant}
      />
    </div>
  );
}

