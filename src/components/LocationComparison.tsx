"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart2,
  Calendar,
  ChevronDown,
  Clock,
  Plus,
  RadioTower,
  Search,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import type { AirQualityResponse, GeocodedPlace, Location } from "@/lib/types";
import { useTheme } from "@/lib/use-theme";

// ==========================================
// Types & Constants
// ==========================================

export type Timeframe = "24h" | "7d" | "30d";

export type ParameterKey =
  | "us_aqi"
  | "pm2_5"
  | "pm10"
  | "nitrogen_dioxide"
  | "sulphur_dioxide"
  | "carbon_monoxide"
  | "ozone";

export interface ParameterDef {
  key: ParameterKey;
  label: string;
  shortLabel: string;
  unit: string;
  threshold: number;
  thresholdLabel: string;
  description: string;
}

export const PARAMETERS: ParameterDef[] = [
  {
    key: "us_aqi",
    label: "Composite AQI (US)",
    shortLabel: "AQI",
    unit: "AQI",
    threshold: 50,
    thresholdLabel: "EPA Good (50)",
    description: "Standard US EPA composite air quality index",
  },
  {
    key: "pm2_5",
    label: "PM2.5 (Fine Particles)",
    shortLabel: "PM₂.₅",
    unit: "µg/m³",
    threshold: 12.0,
    thresholdLabel: "EPA 24h Good (12 µg/m³)",
    description: "Fine respirable particles under 2.5 micrometers",
  },
  {
    key: "pm10",
    label: "PM10 (Inhalable Dust)",
    shortLabel: "PM₁₀",
    unit: "µg/m³",
    threshold: 54.0,
    thresholdLabel: "EPA 24h Good (54 µg/m³)",
    description: "Coarse particulate matter under 10 micrometers",
  },
  {
    key: "nitrogen_dioxide",
    label: "NO2 (Nitrogen Dioxide)",
    shortLabel: "NO₂",
    unit: "µg/m³",
    threshold: 53.0,
    thresholdLabel: "Combustion Reference (53 µg/m³)",
    description: "Urban traffic and fossil fuel combustion emissions",
  },
  {
    key: "sulphur_dioxide",
    label: "SO2 (Sulphur Dioxide)",
    shortLabel: "SO₂",
    unit: "µg/m³",
    threshold: 35.0,
    thresholdLabel: "Industrial Reference (35 µg/m³)",
    description: "Heavy industrial and coal-fired generation emissions",
  },
  {
    key: "carbon_monoxide",
    label: "CO (Carbon Monoxide)",
    shortLabel: "CO",
    unit: "µg/m³",
    threshold: 4400.0,
    thresholdLabel: "EPA 8h Reference (4,400 µg/m³)",
    description: "Incomplete combustion product and vehicle tracer",
  },
  {
    key: "ozone",
    label: "O3 (Ground-level Ozone)",
    shortLabel: "O₃",
    unit: "µg/m³",
    threshold: 100.0,
    thresholdLabel: "WHO 8h Guideline (100 µg/m³)",
    description: "Photochemical oxidant created by sunlight and precursors",
  },
];

export const PRESETS = [
  {
    label: "Mumbai vs Delhi",
    locations: [
      { name: "Mumbai", admin: "Maharashtra", country: "India", latitude: 19.076, longitude: 72.8777 },
      { name: "Delhi", admin: "Delhi", country: "India", latitude: 28.6139, longitude: 77.209 },
    ],
  },
  {
    label: "Tokyo vs Paris",
    locations: [
      { name: "Tokyo", admin: "Tokyo", country: "Japan", latitude: 35.6762, longitude: 139.6503 },
      { name: "Paris", admin: "Île-de-France", country: "France", latitude: 48.8566, longitude: 2.3522 },
    ],
  },
  {
    label: "New York vs London",
    locations: [
      { name: "New York", admin: "New York", country: "United States", latitude: 40.7128, longitude: -74.006 },
      { name: "London", admin: "England", country: "United Kingdom", latitude: 51.5072, longitude: -0.1276 },
    ],
  },
];

const LOCATION_THEMES = [
  { stroke: "#2f7650", fill: "#83dfbd", bg: "rgba(47, 118, 80, 0.12)", badgeBg: "rgba(47, 118, 80, 0.2)", badgeText: "#2f7650" },
  { stroke: "#bb7651", fill: "#f3a16b", bg: "rgba(187, 118, 81, 0.12)", badgeBg: "rgba(187, 118, 81, 0.2)", badgeText: "#bb7651" },
  { stroke: "#3b7aa3", fill: "#70b1d9", bg: "rgba(59, 122, 163, 0.12)", badgeBg: "rgba(59, 122, 163, 0.2)", badgeText: "#3b7aa3" },
  { stroke: "#8d5e8f", fill: "#ba8cb7", bg: "rgba(141, 94, 143, 0.12)", badgeBg: "rgba(141, 94, 143, 0.2)", badgeText: "#8d5e8f" },
];

const POLLUTANT_SNAPSHOT_LIST: { key: ParameterKey; label: string; limit: number }[] = [
  { key: "pm2_5", label: "PM₂.₅", limit: 12.0 },
  { key: "pm10", label: "PM₁₀", limit: 54.0 },
  { key: "nitrogen_dioxide", label: "NO₂", limit: 53.0 },
  { key: "sulphur_dioxide", label: "SO₂", limit: 35.0 },
  { key: "carbon_monoxide", label: "CO", limit: 4400.0 },
  { key: "ozone", label: "O₃", limit: 100.0 },
];

// Clean formatting helpers for X-axis ticks
function formatTimestampForAxis(isoString: string, tf: Timeframe): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;

    const hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? "pm" : "am";
    const h12 = hours % 12 === 0 ? 12 : hours % 12;
    const h12Pad = String(h12).padStart(2, "0");
    const minPad = String(minutes).padStart(2, "0");
    const day = d.getDate();
    const month = d.toLocaleDateString([], { month: "short" });

    if (tf === "24h") {
      // Clean 12-hour format: 12:00am, 03:00am, 06:00am, 09:00am
      return `${h12Pad}:${minPad}${ampm}`;
    }
    if (tf === "7d") {
      // 12am 2 Nov, 12pm 2 Nov, 12am 3 Nov
      return `${h12}${ampm} ${day} ${month}`;
    }
    // 30d
    return `${day} ${month}`;
  } catch {
    return isoString;
  }
}

// Compact formatting helper for Min/Max summary badge timestamps
function formatTimestampBadge(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const hours = d.getHours();
    const ampm = hours >= 12 ? "pm" : "am";
    const h12 = hours % 12 === 0 ? 12 : hours % 12;
    const day = d.getDate();
    const month = d.toLocaleDateString([], { month: "short" });
    return `${h12}${ampm} ${day} ${month}`;
  } catch {
    return isoString;
  }
}

function locationKey(loc: Location): string {
  return `${loc.latitude.toFixed(3)}:${loc.longitude.toFixed(3)}`;
}

// ==========================================
// Main Component
// ==========================================

export function LocationComparison({ initialLocation }: { initialLocation?: Location }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // 1. Comparison Location State (2 to 4 locations)
  const [locations, setLocations] = useState<Location[]>(() => {
    if (initialLocation) {
      const other = PRESETS[0].locations.find(
        (p) => Math.abs(p.latitude - initialLocation.latitude) > 0.05
      ) || PRESETS[0].locations[1];
      return [initialLocation, other];
    }
    return PRESETS[0].locations;
  });

  // 2. Control Bar Filters
  const [timeframe, setTimeframe] = useState<Timeframe>("24h");
  const [parameterKey, setParameterKey] = useState<ParameterKey>("us_aqi");
  const [viewMode, setViewMode] = useState<"line" | "bar">("line");

  // 3. Search & Suggestions State
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodedPlace[]>([]);
  const [searching, setSearching] = useState(false);

  // 4. Ingested Data State
  const [liveData, setLiveData] = useState<Record<string, { air: AirQualityResponse | null; loading: boolean; error?: string }>>({});
  const [historyData, setHistoryData] = useState<Record<string, { payload: any | null; loading: boolean; error?: string }>>({});

  const activeParam = useMemo(
    () => PARAMETERS.find((p) => p.key === parameterKey) || PARAMETERS[0],
    [parameterKey]
  );

  // ------------------------------------------
  // Geocode Search Autocomplete
  // ------------------------------------------
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSearching(true);
      fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then(async (res) => {
          const json = (await res.json()) as { results?: GeocodedPlace[] };
          if (!res.ok) throw new Error("Search failed");
          return json;
        })
        .then((json) => {
          if (!controller.signal.aborted) setSuggestions(json.results || []);
        })
        .catch(() => {
          if (!controller.signal.aborted) setSuggestions([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // ------------------------------------------
  // Data Ingestion Pipeline (Live & History)
  // ------------------------------------------
  useEffect(() => {
    const controller = new AbortController();
    const days = timeframe === "24h" ? 1 : timeframe === "7d" ? 7 : 30;

    locations.forEach((loc) => {
      const key = locationKey(loc);

      // Ingest Live Physical Station (OpenAQ v3 / WAQI / Open-Meteo)
      setLiveData((prev) => ({
        ...prev,
        [key]: { air: prev[key]?.air ?? null, loading: true },
      }));

      fetch(`/api/air-quality?lat=${loc.latitude}&lng=${loc.longitude}`, {
        signal: controller.signal,
      })
        .then(async (res) => {
          const json = (await res.json()) as AirQualityResponse;
          if (!res.ok) throw new Error(json.fallbackNote || "Station telemetry unavailable");
          if (!controller.signal.aborted) {
            setLiveData((prev) => ({ ...prev, [key]: { air: json, loading: false } }));
          }
        })
        .catch((err) => {
          if (!controller.signal.aborted) {
            setLiveData((prev) => ({
              ...prev,
              [key]: { air: null, loading: false, error: err.message },
            }));
          }
        });

      // Ingest Continuous Time-Series (Open-Meteo CAMS Reanalysis Grid)
      setHistoryData((prev) => ({
        ...prev,
        [key]: { payload: prev[key]?.payload ?? null, loading: true },
      }));

      fetch(`/api/air-quality/history?lat=${loc.latitude}&lng=${loc.longitude}&days=${days}`, {
        signal: controller.signal,
      })
        .then(async (res) => {
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || "Time-series unavailable");
          if (!controller.signal.aborted) {
            setHistoryData((prev) => ({ ...prev, [key]: { payload: json, loading: false } }));
          }
        })
        .catch((err) => {
          if (!controller.signal.aborted) {
            setHistoryData((prev) => ({
              ...prev,
              [key]: { payload: null, loading: false, error: err.message },
            }));
          }
        });
    });

    return () => controller.abort();
  }, [locations, timeframe]);

  // ------------------------------------------
  // Action Helpers
  // ------------------------------------------
  const addLocation = (place: GeocodedPlace) => {
    if (locations.length >= 4) return;
    const exists = locations.some(
      (l) => Math.abs(l.latitude - place.latitude) < 0.02 && Math.abs(l.longitude - place.longitude) < 0.02
    );
    if (exists) {
      setQuery("");
      setSuggestions([]);
      return;
    }
    setLocations((prev) => [
      ...prev,
      {
        name: place.name,
        admin: place.admin1,
        country: place.country,
        latitude: place.latitude,
        longitude: place.longitude,
      },
    ]);
    setQuery("");
    setSuggestions([]);
  };

  const removeLocation = (index: number) => {
    if (locations.length <= 2) return;
    setLocations((prev) => prev.filter((_, i) => i !== index));
  };

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    setLocations(preset.locations);
  };

  // ------------------------------------------
  // Comparative Analytics & Variance Synthesis
  // ------------------------------------------

  // Chart 1 Data: Time-Series Comparison formatted with timestamp key
  const timeSeriesData = useMemo(() => {
    const baselineKey = locationKey(locations[0]);
    const baselineHistory = historyData[baselineKey]?.payload?.hourly;
    if (!baselineHistory?.time?.length) return [];

    const times: string[] = baselineHistory.time;
    return times.map((t, timeIndex) => {
      const entry: Record<string, any> = {
        rawTime: t,
        timestamp: formatTimestampForAxis(t, timeframe),
      };

      locations.forEach((loc) => {
        const key = locationKey(loc);
        const hourly = historyData[key]?.payload?.hourly;
        const val = hourly?.[parameterKey]?.[timeIndex];
        entry[loc.name] = typeof val === "number" && !isNaN(val) ? Number(val.toFixed(1)) : null;
      });

      return entry;
    });
  }, [locations, historyData, parameterKey, timeframe]);

  // Min / Max Extremes Summary for each location in the active timeframe
  const locationExtremes = useMemo(() => {
    return locations.map((loc, idx) => {
      const key = locationKey(loc);
      const hourly = historyData[key]?.payload?.hourly;
      const values: number[] = hourly?.[parameterKey] || [];
      const times: string[] = hourly?.time || [];

      let minVal: number | null = null;
      let minTime = "";
      let maxVal: number | null = null;
      let maxTime = "";

      values.forEach((v, i) => {
        if (typeof v === "number" && !isNaN(v)) {
          if (minVal === null || v < minVal) {
            minVal = v;
            minTime = formatTimestampBadge(times[i]);
          }
          if (maxVal === null || v > maxVal) {
            maxVal = v;
            maxTime = formatTimestampBadge(times[i]);
          }
        }
      });

      const resolvedMin = minVal !== null ? Number((minVal as number).toFixed(1)) : null;
      const resolvedMax = maxVal !== null ? Number((maxVal as number).toFixed(1)) : null;

      return {
        location: loc,
        theme: LOCATION_THEMES[idx % LOCATION_THEMES.length],
        minVal: resolvedMin,
        minTime,
        maxVal: resolvedMax,
        maxTime,
      };
    });
  }, [locations, historyData, parameterKey]);

  // Live Metric Snapshot & Best Air Quality Badge
  const { siteMetrics, bestIndex, varianceAnalysis } = useMemo(() => {
    const metrics = locations.map((loc, idx) => {
      const key = locationKey(loc);
      const live = liveData[key]?.air;
      const hist = historyData[key]?.payload?.hourly;

      // Extract current parameter value
      let currentVal: number | null = null;
      if (live?.current) {
        if (parameterKey === "us_aqi") {
          currentVal = live.current.us_aqi !== undefined ? Number(live.current.us_aqi) : live.current.aqi ?? null;
        } else if (typeof live.current[parameterKey] === "number") {
          currentVal = Number(live.current[parameterKey]);
        }
      }

      // Fallback to latest historical hourly if live station sensor missing this specific parameter
      if (currentVal === null && hist?.[parameterKey]?.length) {
        const lastVal = hist[parameterKey][hist[parameterKey].length - 1];
        if (typeof lastVal === "number" && !isNaN(lastVal)) {
          currentVal = Number(lastVal);
        }
      }

      // Compute timeframe average
      let avgVal: number | null = null;
      let peakVal: number | null = null;
      let peakTime: string | null = null;
      if (hist?.[parameterKey]?.length) {
        const validValues: number[] = hist[parameterKey].filter((v: any) => typeof v === "number" && !isNaN(v));
        if (validValues.length) {
          avgVal = validValues.reduce((a, b) => a + b, 0) / validValues.length;
          peakVal = Math.max(...validValues);
          const maxIdx = hist[parameterKey].indexOf(peakVal);
          if (maxIdx >= 0 && hist.time?.[maxIdx]) {
            peakTime = formatTimestampBadge(hist.time[maxIdx]);
          }
        }
      }

      // Live composite AQI for overall best comparison
      const compositeAqi = live?.current?.aqi ?? (typeof live?.current?.us_aqi === "number" ? live.current.us_aqi : null);

      return {
        location: loc,
        live,
        currentVal,
        avgVal,
        peakVal,
        peakTime,
        compositeAqi,
        provenance: live?.provenance ?? "modeled-estimate",
        sourceLabel: live?.sourceLabel ?? "Open-Meteo CAMS Reanalysis",
        stationName: live?.stationName,
        theme: LOCATION_THEMES[idx % LOCATION_THEMES.length],
      };
    });

    // Best Air Quality: Lowest AQI (or lowest parameter concentration)
    let best = 0;
    let minScore = Infinity;
    metrics.forEach((m, idx) => {
      const score = m.compositeAqi ?? m.currentVal;
      if (score !== null && score < minScore) {
        minScore = score;
        best = idx;
      }
    });

    // Variance vs Baseline (locations[0])
    const baseline = metrics[0];
    const variances = metrics.slice(1).map((m) => {
      let currentDeltaPct: number | null = null;
      let currentDeltaAbs: number | null = null;
      let avgDeltaPct: number | null = null;

      if (baseline.currentVal !== null && m.currentVal !== null && baseline.currentVal > 0) {
        currentDeltaAbs = m.currentVal - baseline.currentVal;
        currentDeltaPct = ((m.currentVal - baseline.currentVal) / baseline.currentVal) * 100;
      }
      if (baseline.avgVal !== null && m.avgVal !== null && baseline.avgVal > 0) {
        avgDeltaPct = ((m.avgVal - baseline.avgVal) / baseline.avgVal) * 100;
      }

      return {
        targetName: m.location.name,
        baselineName: baseline.location.name,
        currentDeltaPct,
        currentDeltaAbs,
        avgDeltaPct,
        m,
      };
    });

    return {
      siteMetrics: metrics,
      bestIndex: minScore !== Infinity ? best : null,
      varianceAnalysis: variances,
    };
  }, [locations, liveData, historyData, parameterKey, timeframe]);

  // Chart 2 Data: Side-by-Side Parameter Snapshot (% of EPA Good-Band Limit)
  const snapshotData = useMemo(() => {
    return POLLUTANT_SNAPSHOT_LIST.map((pollutant) => {
      const row: Record<string, any> = {
        pollutant: pollutant.label,
        key: pollutant.key,
        limit: pollutant.limit,
      };

      locations.forEach((loc) => {
        const key = locationKey(loc);
        const live = liveData[key]?.air;
        let val: number | null = null;
        if (live?.current && typeof live.current[pollutant.key] === "number") {
          val = Number(live.current[pollutant.key]);
        }
        // Percentage relative to reference standard
        row[loc.name] = val !== null ? Number(((val / pollutant.limit) * 100).toFixed(1)) : null;
        row[`${loc.name}_raw`] = val !== null ? Number(val.toFixed(1)) : null;
      });

      return row;
    });
  }, [locations, liveData]);

  // Chart 3 Data: Atmospheric Multi-Pollutant Fingerprint (Radar)
  const radarData = useMemo(() => {
    return POLLUTANT_SNAPSHOT_LIST.map((pollutant) => {
      const row: Record<string, any> = {
        pollutant: pollutant.label,
      };

      // Collect raw values
      const values = locations.map((loc) => {
        const key = locationKey(loc);
        const live = liveData[key]?.air;
        const val = live?.current?.[pollutant.key];
        return typeof val === "number" && !isNaN(val) ? Number(val) : 0;
      });

      const maxVal = Math.max(...values, pollutant.limit, 0.001);

      locations.forEach((loc, idx) => {
        const pct = Math.min(100, Math.round((values[idx] / maxVal) * 100));
        row[loc.name] = pct;
      });

      return row;
    });
  }, [locations, liveData]);

  return (
    <section className="phase-view comparison-view w-full pb-16">
      {/* ---------------------------------------------------- */}
      {/* Header Tier */}
      {/* ---------------------------------------------------- */}
      <header className="phase-view-heading flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[var(--dash-rule)]">
        <div>
          <span className="section-kicker flex items-center gap-2 text-xs sm:text-sm font-mono tracking-widest text-[var(--dash-muted)]">
            <span className="eyebrow-line w-6 h-[1px] bg-[var(--dash-accent)]" />
            TELEMETRY ENGINE · MULTI-LOCATION BENCHMARK
          </span>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-normal tracking-tight text-[var(--dash-ink)] mt-2">
            Air, in <em>comparison.</em>
          </h1>
          <p className="text-sm sm:text-base text-[var(--dash-muted)] max-w-2xl mt-1.5">
            Compare validated ground-truth station observations with continuous atmospheric CAMS reanalysis across global coordinates.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-end">
          <span className="provenance-pill inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-mono font-medium border border-[var(--dash-rule)] bg-[var(--dash-surface)] text-[var(--dash-ink)] shadow-sm">
            <RadioTower size={14} className="text-[var(--dash-accent)]" />
            OPENAQ V3 & WAQI GROUND PROVENANCE
          </span>
        </div>
      </header>

      {/* ---------------------------------------------------- */}
      {/* Tier 1: Search & Quick Presets */}
      {/* ---------------------------------------------------- */}
      <div className="mt-8 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
          {/* Location Autocomplete Input */}
          <div className="lg:col-span-6 relative">
            <label
              htmlFor="compare-search-input"
              className="flex items-center gap-3 h-12 px-4 rounded-xl border border-[var(--dash-rule)] bg-[var(--dash-surface)] text-[var(--dash-ink)] shadow-sm focus-within:border-[var(--dash-accent)] transition-colors"
            >
              <Search size={18} className="text-[var(--dash-muted)] flex-none" />
              <input
                id="compare-search-input"
                className="w-full bg-transparent text-sm sm:text-base outline-none placeholder:text-[var(--dash-faint)] text-[var(--dash-ink)] font-medium"
                placeholder={locations.length >= 4 ? "Maximum 4 locations reached" : "Search to add city or coordinate..."}
                disabled={locations.length >= 4}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />
              <span className="font-mono text-xs text-[var(--dash-muted)] font-semibold px-2.5 py-1 rounded-md bg-[var(--dash-surface-soft)]">
                {locations.length}/4
              </span>
            </label>

            {/* Autocomplete Dropdown Suggestions */}
            {query.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 z-40 max-h-64 overflow-y-auto rounded-xl border border-[var(--dash-rule)] bg-[var(--dash-surface)] shadow-2xl divide-y divide-[var(--dash-rule)]">
                {searching && (
                  <div className="p-3.5 text-sm text-[var(--dash-muted)] font-mono flex items-center gap-2">
                    <Clock size={14} className="animate-spin" /> Querying geocoding registry...
                  </div>
                )}
                {!searching && suggestions.length === 0 && (
                  <div className="p-3.5 text-sm text-[var(--dash-muted)]">No geographic places matched.</div>
                )}
                {suggestions.map((place) => (
                  <button
                    type="button"
                    key={place.id}
                    onClick={() => addLocation(place)}
                    className="w-full text-left px-4 py-3 hover:bg-[var(--dash-surface-soft)] flex items-center justify-between text-sm text-[var(--dash-ink)] transition-colors"
                  >
                    <div>
                      <strong className="font-semibold text-[var(--dash-ink)] block">{place.name}</strong>
                      <span className="text-xs text-[var(--dash-muted)]">
                        {[place.admin1, place.country].filter(Boolean).join(" · ")}
                      </span>
                    </div>
                    <Plus size={16} className="text-[var(--dash-accent)]" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Comparison Preset Buttons */}
          <div className="lg:col-span-6 flex items-center flex-wrap gap-2.5">
            <span className="text-xs font-mono font-bold text-[var(--dash-muted)] uppercase tracking-wider mr-1">
              PRESETS:
            </span>
            {PRESETS.map((preset) => (
              <button
                type="button"
                key={preset.label}
                onClick={() => applyPreset(preset)}
                className="px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold border border-[var(--dash-rule)] bg-[var(--dash-surface)] text-[var(--dash-ink)] hover:border-[var(--dash-accent)] hover:text-[var(--dash-accent)] transition-all shadow-sm"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* Tier 2: Multi-Location Metric Snapshot Cards */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <AnimatePresence>
          {siteMetrics.map((site, index) => {
            const isBest = bestIndex === index;
            const locTheme = site.theme;

            return (
              <motion.article
                key={site.location.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                className={`relative p-5 rounded-2xl border transition-all ${
                  isBest
                    ? "border-[var(--dash-accent)] ring-1 ring-[var(--dash-accent)]/30 bg-[var(--dash-surface)] shadow-md"
                    : "border-[var(--dash-rule)] bg-[var(--dash-surface)] hover:border-[var(--dash-muted)]"
                }`}
              >
                {/* Header: Dot Index + Best Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold text-white shadow-sm"
                      style={{ backgroundColor: locTheme.stroke }}
                    >
                      {index + 1}
                    </span>
                    <span className="font-mono text-xs text-[var(--dash-muted)] font-bold uppercase tracking-wider">
                      {index === 0 ? "BASELINE" : "COMPARISON"}
                    </span>
                  </div>

                  {isBest && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                      <Sparkles size={12} /> BEST AIR QUALITY
                    </span>
                  )}

                  {locations.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeLocation(index)}
                      className="text-[var(--dash-muted)] hover:text-[var(--dash-ink)] p-1.5 rounded-full hover:bg-[var(--dash-surface-soft)] transition-colors"
                      aria-label={`Remove ${site.location.name}`}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* City and Coordinates */}
                <h2 className="text-2xl font-bold tracking-tight text-[var(--dash-ink)] truncate">
                  {site.location.name}
                </h2>
                <p className="text-xs text-[var(--dash-muted)] truncate mb-4 font-medium">
                  {[site.location.admin, site.location.country].filter(Boolean).join(" · ")}
                </p>

                {/* Current Active Parameter Highlight */}
                <div className="flex items-baseline justify-between p-3.5 rounded-xl bg-[var(--dash-surface-soft)] mb-3.5">
                  <div>
                    <span className="text-xs font-mono text-[var(--dash-muted)] font-semibold block uppercase">
                      {activeParam.shortLabel} NOW
                    </span>
                    <strong className="text-3xl font-extrabold text-[var(--dash-ink)]">
                      {site.currentVal !== null ? site.currentVal.toFixed(1) : "—"}
                    </strong>
                    <span className="text-xs font-mono text-[var(--dash-muted)] font-semibold ml-1.5">
                      {activeParam.unit}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono text-[var(--dash-muted)] font-semibold block uppercase">
                      {timeframe.toUpperCase()} AVG
                    </span>
                    <span className="text-base font-bold text-[var(--dash-ink)]">
                      {site.avgVal !== null ? site.avgVal.toFixed(1) : "—"}
                    </span>
                  </div>
                </div>

                {/* Provenance Badge & Live Metadata */}
                <div className="space-y-2 pt-2.5 border-t border-[var(--dash-rule)] text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-[var(--dash-muted)]">
                    <RadioTower size={13} className={site.provenance === "station-observation" ? "text-emerald-500" : "text-amber-500"} />
                    <span className="truncate font-medium">{site.sourceLabel}</span>
                  </div>
                  {site.live?.current?.time && (
                    <div className="text-[var(--dash-faint)] flex items-center gap-1.5">
                      <Clock size={12} />
                      Observed: {new Date(site.live.current.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ---------------------------------------------------- */}
      {/* Tier 3: Selectors Bar (Directly Above Chart 1) */}
      {/* ---------------------------------------------------- */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-[var(--dash-rule)] bg-[var(--dash-surface)] shadow-sm">
        {/* Timeframe Selector (24 Hours, 7 Days, 30 Days) */}
        <div className="flex items-center gap-3">
          <span className="text-xs sm:text-sm font-mono font-bold text-[var(--dash-muted)] flex items-center gap-2">
            <Calendar size={16} className="text-[var(--dash-accent)]" />
            HORIZON:
          </span>
          <div className="inline-flex rounded-lg border border-[var(--dash-rule)] p-1 bg-[var(--dash-surface-soft)]">
            {(["24h", "7d", "30d"] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-4 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-colors ${
                  timeframe === tf
                    ? "bg-[var(--dash-surface)] text-[var(--dash-ink)] shadow-sm border border-[var(--dash-rule)] font-bold text-[var(--dash-accent)]"
                    : "text-[var(--dash-muted)] hover:text-[var(--dash-ink)]"
                }`}
              >
                {tf === "24h" ? "24 Hours" : tf === "7d" ? "7 Days" : "30 Days"}
              </button>
            ))}
          </div>
        </div>

        {/* Parameter Selector Dropdown */}
        <div className="flex items-center gap-3">
          <span className="text-xs sm:text-sm font-mono font-bold text-[var(--dash-muted)] flex items-center gap-2">
            <Activity size={16} className="text-[var(--dash-accent)]" />
            PARAMETER:
          </span>
          <div className="relative">
            <select
              value={parameterKey}
              onChange={(e) => setParameterKey(e.target.value as ParameterKey)}
              aria-label="Active parameter to compare"
              className="h-10 pl-4 pr-10 rounded-lg text-xs sm:text-sm font-semibold border border-[var(--dash-rule)] bg-[var(--dash-surface-soft)] text-[var(--dash-ink)] outline-none cursor-pointer appearance-none focus:border-[var(--dash-accent)] shadow-sm"
            >
              {PARAMETERS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label} ({p.unit})
                </option>
              ))}
            </select>
            <ChevronDown size={15} className="absolute right-3.5 top-3 text-[var(--dash-muted)] pointer-events-none" />
          </div>
        </div>

        {/* View Mode Toggle Icons (Line vs Bar) */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs sm:text-sm font-mono font-bold text-[var(--dash-muted)] mr-1 hidden sm:inline">VIEW:</span>
          <button
            type="button"
            onClick={() => setViewMode("line")}
            aria-label="Line trend view"
            className={`p-2 rounded-lg border transition-colors ${
              viewMode === "line"
                ? "border-[var(--dash-accent)] bg-[var(--dash-surface-soft)] text-[var(--dash-accent)] shadow-sm"
                : "border-[var(--dash-rule)] text-[var(--dash-muted)] hover:text-[var(--dash-ink)]"
            }`}
            title="Line Chart Trend"
          >
            <TrendingUp size={18} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("bar")}
            aria-label="Bar snapshot view"
            className={`p-2 rounded-lg border transition-colors ${
              viewMode === "bar"
                ? "border-[var(--dash-accent)] bg-[var(--dash-surface-soft)] text-[var(--dash-accent)] shadow-sm"
                : "border-[var(--dash-rule)] text-[var(--dash-muted)] hover:text-[var(--dash-ink)]"
            }`}
            title="Bar Chart Snapshot"
          >
            <BarChart2 size={18} />
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* Tier 4: Chart 1: Time-Series Metric Trend Comparison */}
      {/* ---------------------------------------------------- */}
      <article className="mt-6 p-6 sm:p-7 rounded-2xl border border-[var(--dash-rule)] bg-[var(--dash-surface)] shadow-sm">
        {/* Chart Header + Top-Right Min / Max Summary Badges */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-[var(--dash-muted)] font-bold">
                CHART 01 · CONTINUOUS CHRONOLOGY
              </span>
              <span className="px-2.5 py-1 rounded text-xs font-mono font-medium bg-[var(--dash-surface-soft)] text-[var(--dash-ink)] border border-[var(--dash-rule)]">
                CAMS Atmospheric Reanalysis
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--dash-ink)] mt-1.5">
              {activeParam.label} Dynamic Trend
            </h2>
          </div>

          {/* Top-Right Dynamic Min / Max Summary Badges */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-end">
            {locationExtremes.map((item) => (
              <div
                key={item.location.name}
                className="flex flex-wrap items-center gap-2 px-3.5 py-1.5 rounded-xl border border-[var(--dash-rule)] bg-[var(--dash-surface-soft)] text-xs shadow-sm"
              >
                <span className="flex items-center gap-1.5 font-bold text-[var(--dash-ink)]">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: item.theme.stroke }} />
                  {item.location.name}:
                </span>
                {item.minVal !== null ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                    Min: {item.minVal} ({item.minTime})
                  </span>
                ) : null}
                {item.maxVal !== null ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                    Max: {item.maxVal} ({item.maxTime})
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* Recharts Canvas */}
        <div className="w-full h-80 sm:h-96">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === "line" ? (
              <LineChart data={timeSeriesData} margin={{ top: 12, right: 12, left: -4, bottom: 0 }}>
                {/* Horizontal grid lines strictly */}
                <CartesianGrid
                  stroke={isDark ? "rgba(255, 255, 255, 0.08)" : "#E5E7EB"}
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="timestamp"
                  interval="preserveStartEnd"
                  minTickGap={40}
                  tick={{ fill: "var(--dash-muted)", fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: "var(--dash-muted)", fontSize: 12 }}
                  label={{
                    value: activeParam.key === "us_aqi" ? "AQI (US)" : activeParam.unit,
                    angle: -90,
                    position: "insideLeft",
                    fill: "var(--dash-muted)",
                    fontSize: 12,
                    offset: 10,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--dash-surface)",
                    borderColor: "var(--dash-rule)",
                    borderRadius: "10px",
                    fontSize: "13px",
                    color: "var(--dash-ink)",
                    boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
                    padding: "10px 14px",
                  }}
                  formatter={(val: any, name: any) => [`${val} ${activeParam.unit}`, name]}
                  labelStyle={{ color: "var(--dash-muted)", marginBottom: "6px", fontSize: "12px", fontWeight: 600 }}
                />
                <Legend wrapperStyle={{ paddingTop: 10, fontSize: 13 }} />
                <ReferenceLine
                  y={activeParam.threshold}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  label={{
                    value: activeParam.thresholdLabel,
                    fill: "#f59e0b",
                    fontSize: 11,
                    position: "insideTopRight",
                  }}
                />
                {locations.map((loc, idx) => {
                  const locTheme = LOCATION_THEMES[idx % LOCATION_THEMES.length];
                  return (
                    <Line
                      key={loc.name}
                      type="monotone"
                      dataKey={loc.name}
                      name={loc.name}
                      stroke={locTheme.stroke}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: isDark ? "#2a342c" : "#E5E7EB", stroke: locTheme.stroke, strokeWidth: 1.5 }}
                      activeDot={{ r: 6, stroke: locTheme.stroke, strokeWidth: 2, fill: "#ffffff" }}
                    />
                  );
                })}
              </LineChart>
            ) : (
              <AreaChart data={timeSeriesData} margin={{ top: 12, right: 12, left: -4, bottom: 0 }}>
                <CartesianGrid
                  stroke={isDark ? "rgba(255, 255, 255, 0.08)" : "#E5E7EB"}
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="timestamp"
                  interval="preserveStartEnd"
                  minTickGap={40}
                  tick={{ fill: "var(--dash-muted)", fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: "var(--dash-muted)", fontSize: 12 }}
                  label={{
                    value: activeParam.key === "us_aqi" ? "AQI (US)" : activeParam.unit,
                    angle: -90,
                    position: "insideLeft",
                    fill: "var(--dash-muted)",
                    fontSize: 12,
                    offset: 10,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--dash-surface)",
                    borderColor: "var(--dash-rule)",
                    borderRadius: "10px",
                    fontSize: "13px",
                    color: "var(--dash-ink)",
                  }}
                  formatter={(val: any, name: any) => [`${val} ${activeParam.unit}`, name]}
                />
                <Legend wrapperStyle={{ paddingTop: 10, fontSize: 13 }} />
                <ReferenceLine y={activeParam.threshold} stroke="#f59e0b" strokeDasharray="4 4" />
                {locations.map((loc, idx) => {
                  const locTheme = LOCATION_THEMES[idx % LOCATION_THEMES.length];
                  return (
                    <Area
                      key={loc.name}
                      type="monotone"
                      dataKey={loc.name}
                      name={loc.name}
                      stroke={locTheme.stroke}
                      fill={locTheme.fill}
                      fillOpacity={0.16}
                      strokeWidth={2}
                    />
                  );
                })}
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Automated Percentage Variance & Trend Narrative Callout */}
        <div className="mt-6 p-4 sm:p-5 rounded-xl bg-[var(--dash-surface-soft)] border border-[var(--dash-rule)]">
          <span className="text-xs font-mono text-[var(--dash-accent)] uppercase tracking-wider flex items-center gap-2 font-bold mb-2.5">
            <Sparkles size={14} /> AUTOMATED VARIANCE & PROVENANCE INSIGHTS:
          </span>
          <div className="space-y-2.5 text-xs sm:text-sm text-[var(--dash-ink)] leading-relaxed">
            {varianceAnalysis.map((item) => {
              const isHigher = (item.currentDeltaPct ?? 0) > 0;
              return (
                <div key={item.targetName} className="flex items-start gap-2.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold ${
                      isHigher
                        ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                        : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {isHigher ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {item.currentDeltaPct !== null ? `${item.currentDeltaPct > 0 ? "+" : ""}${item.currentDeltaPct.toFixed(1)}%` : "0%"}
                  </span>
                  <p>
                    <strong>{item.targetName}</strong> exhibits a{" "}
                    <strong>{item.currentDeltaPct !== null ? `${Math.abs(item.currentDeltaPct).toFixed(1)}% ${isHigher ? "higher" : "lower"}` : "comparable"}</strong>{" "}
                    level of {activeParam.label} relative to <strong>{item.baselineName}</strong> ({item.m.currentVal?.toFixed(1) ?? "—"} vs{" "}
                    {siteMetrics[0]?.currentVal?.toFixed(1) ?? "—"} {activeParam.unit}). Across the {timeframe} window, {item.targetName} averaged{" "}
                    <strong>{item.m.avgVal?.toFixed(1) ?? "—"} {activeParam.unit}</strong>{" "}
                    {item.m.peakVal !== null && `with a peak accumulation of ${item.m.peakVal.toFixed(1)} ${activeParam.unit} observed at ${item.m.peakTime}`}.
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </article>

      {/* ---------------------------------------------------- */}
      {/* Tier 5: Charts 2 & 3 (Grouped Bar Snapshot & Radar Profile) */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
        {/* Chart 2: Side-by-Side Parameter Snapshot (Grouped Bar) */}
        <article className="lg:col-span-7 p-6 sm:p-7 rounded-2xl border border-[var(--dash-rule)] bg-[var(--dash-surface)] shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[var(--dash-muted)] font-bold">
                CHART 02 · MULTI-POLLUTANT SNAPSHOT
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-[var(--dash-ink)] mt-1">
                Pollutant Burden vs Benchmark
              </h2>
            </div>
            <span className="text-xs font-mono font-semibold px-3 py-1 rounded-md bg-[var(--dash-surface-soft)] text-[var(--dash-muted)] border border-[var(--dash-rule)]">
              % of EPA/WHO Limit
            </span>
          </div>

          <div className="w-full h-80 sm:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={snapshotData} margin={{ top: 14, right: 10, left: -6, bottom: 0 }}>
                <CartesianGrid
                  stroke={isDark ? "rgba(255, 255, 255, 0.08)" : "#E5E7EB"}
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis dataKey="pollutant" tick={{ fill: "var(--dash-muted)", fontSize: 12 }} />
                <YAxis
                  tick={{ fill: "var(--dash-muted)", fontSize: 12 }}
                  label={{ value: "% of Limit", angle: -90, position: "insideLeft", fill: "var(--dash-muted)", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--dash-surface)",
                    borderColor: "var(--dash-rule)",
                    borderRadius: "10px",
                    fontSize: "13px",
                    color: "var(--dash-ink)",
                    padding: "10px 14px",
                  }}
                  formatter={(val: any, name: any, item: any) => [
                    `${val}% (${item.payload[`${name}_raw`]} raw)`,
                    name,
                  ]}
                />
                <Legend wrapperStyle={{ paddingTop: 10, fontSize: 13 }} />
                <ReferenceLine
                  y={100}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{ value: "100% Health Standard", fill: "#ef4444", fontSize: 11, position: "insideTopRight" }}
                />
                {locations.map((loc, idx) => (
                  <Bar
                    key={loc.name}
                    dataKey={loc.name}
                    name={loc.name}
                    fill={LOCATION_THEMES[idx % LOCATION_THEMES.length].stroke}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs sm:text-sm text-[var(--dash-muted)] mt-4 font-medium">
            Bars exceeding 100% indicate concentrations surpassing EPA or WHO clean-air benchmark thresholds.
          </p>
        </article>

        {/* Chart 3: Atmospheric Multi-Pollutant Fingerprint (Radar) */}
        <article className="lg:col-span-5 p-6 sm:p-7 rounded-2xl border border-[var(--dash-rule)] bg-[var(--dash-surface)] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-[var(--dash-muted)] font-bold">
                  CHART 03 · CHEMICAL SIGNATURE
                </span>
                <h2 className="text-2xl font-bold tracking-tight text-[var(--dash-ink)] mt-1">
                  Atmospheric Profile
                </h2>
              </div>
            </div>

            <div className="w-full h-80 sm:h-96 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="72%">
                  <PolarGrid stroke={isDark ? "rgba(255, 255, 255, 0.12)" : "var(--dash-rule)"} />
                  <PolarAngleAxis dataKey="pollutant" tick={{ fill: "var(--dash-muted)", fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "var(--dash-muted)", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--dash-surface)",
                      borderColor: "var(--dash-rule)",
                      borderRadius: "10px",
                      fontSize: "13px",
                      color: "var(--dash-ink)",
                    }}
                    formatter={(val: any) => [`${val}% relative intensity`, "Burden"]}
                  />
                  <Legend wrapperStyle={{ paddingTop: 10, fontSize: 13 }} />
                  {locations.map((loc, idx) => {
                    const locTheme = LOCATION_THEMES[idx % LOCATION_THEMES.length];
                    return (
                      <Radar
                        key={loc.name}
                        name={loc.name}
                        dataKey={loc.name}
                        stroke={locTheme.stroke}
                        fill={locTheme.fill}
                        fillOpacity={0.16}
                        strokeWidth={2}
                      />
                    );
                  })}
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--dash-surface-soft)] border border-[var(--dash-rule)] text-xs sm:text-sm text-[var(--dash-muted)] mt-4 font-medium">
            The radar signature demonstrates whether atmospheric stress is particulate-heavy (PM2.5/PM10) or traffic/industrial (NO2/SO2/CO).
          </div>
        </article>
      </div>
    </section>
  );
}

export default LocationComparison;
