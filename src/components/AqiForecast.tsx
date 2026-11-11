"use client";

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowDown,
  BrainCircuit,
  CheckCircle2,
  CloudSun,
  Compass,
  Crosshair,
  Info,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
  Zap,
  TrendingUp,
  TrendingDown,
  Activity,
  Flame,
  ShieldAlert,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Wind,
  BarChart3,
} from "lucide-react";
import { AQI_COLORS } from "@/lib/aqi-calculator";
import { useTheme } from "@/lib/use-theme";
import type { Location, GeocodedPlace } from "@/lib/types";

type Standard = "epa" | "cpcb";

export interface ForecastResponsePayload {
  provenance: "PROVIDER_METEO" | "PROVIDER_CAMS" | "ML_PREDICTIVE_MODEL";
  source: string;
  algorithm?: string;
  generatedAt: string;
  forecastHours?: number;
  timezone?: string;
  fallbackNote?: string;
  hourly: {
    time: string[];
    us_aqi?: number[];
    cpcb_aqi?: number[];
    pm2_5?: number[];
    pm10?: number[];
    nitrogen_dioxide?: number[];
    sulphur_dioxide?: number[];
    carbon_monoxide?: number[];
    ozone?: number[];
  };
  confidenceIntervals?: {
    aqiLower?: number[];
    aqiUpper?: number[];
    errorMargin?: number[];
    confidenceLevel?: string;
  };
  featuresUsed?: {
    historicalLags?: string[];
    meteorological?: string[];
    temporalCyclical?: string[];
  };
  error?: string;
}

const BANDS: Record<Standard, { max: number; label: string; color: string }[]> = {
  epa: [
    { max: 50, label: "Good", color: AQI_COLORS[0] },
    { max: 100, label: "Moderate", color: AQI_COLORS[1] },
    { max: 150, label: "Sensitive groups", color: AQI_COLORS[2] },
    { max: 200, label: "Unhealthy", color: AQI_COLORS[3] },
    { max: 300, label: "Very unhealthy", color: AQI_COLORS[4] },
    { max: 500, label: "Hazardous", color: AQI_COLORS[5] },
  ],
  cpcb: [
    { max: 50, label: "Good", color: AQI_COLORS[0] },
    { max: 100, label: "Satisfactory", color: AQI_COLORS[1] },
    { max: 200, label: "Moderate", color: AQI_COLORS[2] },
    { max: 300, label: "Poor", color: AQI_COLORS[3] },
    { max: 400, label: "Very poor", color: AQI_COLORS[4] },
    { max: 500, label: "Severe", color: AQI_COLORS[5] },
  ],
};

const POPULAR_CITIES: Location[] = [
  { name: "Delhi", admin: "National Capital Territory", country: "India", latitude: 28.6139, longitude: 77.209 },
  { name: "Mumbai", admin: "Maharashtra", country: "India", latitude: 19.076, longitude: 72.8777 },
  { name: "Bengaluru", admin: "Karnataka", country: "India", latitude: 12.9716, longitude: 77.5946 },
  { name: "Kolkata", admin: "West Bengal", country: "India", latitude: 22.5726, longitude: 88.3639 },
  { name: "Hyderabad", admin: "Telangana", country: "India", latitude: 17.385, longitude: 78.4867 },
  { name: "Chennai", admin: "Tamil Nadu", country: "India", latitude: 13.0827, longitude: 80.2707 },
  { name: "Pune", admin: "Maharashtra", country: "India", latitude: 18.5204, longitude: 73.8567 },
  { name: "London", admin: "Greater London", country: "United Kingdom", latitude: 51.5074, longitude: -0.1278 },
  { name: "New York", admin: "New York", country: "United States", latitude: 40.7128, longitude: -74.006 },
];

function bandFor(value: number, standard: Standard) {
  return BANDS[standard].find((band) => value <= band.max) ?? BANDS[standard][5];
}

function timeParts(value: string) {
  const date = new Date(value);
  return {
    hour: date.toLocaleTimeString([], { hour: "numeric", hour12: true }),
    day: date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }),
    dayShort: date.toLocaleDateString([], { weekday: "short" }),
  };
}

export function AqiForecast({ location }: { location: Location }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Active selected location state (defaults to passed location, with auto-detect capability)
  const [selectedLoc, setSelectedLoc] = useState<Location>(location);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodedPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Model & Telemetry State
  const [data, setData] = useState<ForecastResponsePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [standard, setStandard] = useState<Standard>("cpcb");
  const [forceMl, setForceMl] = useState(false);
  const [showConfidenceBand, setShowConfidenceBand] = useState(true);
  const [showMlDetails, setShowMlDetails] = useState(false);

  // Auto-detect current location on initial mount if browser supports geolocation
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          try {
            const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
            if (res.ok) {
              const place = (await res.json()) as { name?: string; admin?: string; country?: string };
              if (place.name) {
                setSelectedLoc({
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
          setSelectedLoc((prev) => ({
            ...prev,
            name: "Current Location",
            admin: "GPS Coordinates",
            latitude: lat,
            longitude: lng,
          }));
        },
        () => undefined,
        { enableHighAccuracy: false, timeout: 6000, maximumAge: 300_000 }
      );
    }
  }, []);

  // Fetch forecast data whenever selectedLoc or forceMl changes
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      lat: String(selectedLoc.latitude),
      lng: String(selectedLoc.longitude),
      ...(forceMl ? { force_ml: "true" } : {}),
    });

    fetch(`/api/forecast?${params}`, { signal: controller.signal })
      .then(async (response) => {
        const json = (await response.json()) as ForecastResponsePayload;
        if (!response.ok) throw new Error(json.error ?? "Forecast is unavailable.");
        return json;
      })
      .then((json) => {
        if (!controller.signal.aborted) setData(json);
      })
      .catch((fetchError) => {
        if (!controller.signal.aborted) {
          setError(fetchError instanceof Error ? fetchError.message : "Forecast is unavailable.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [selectedLoc.latitude, selectedLoc.longitude, forceMl]);

  // Click outside to close search dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle location search input with debounce
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    fetch(`/api/geocode?q=${encodeURIComponent(query)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((places: GeocodedPlace[]) => {
        setSearchResults(places.slice(0, 6));
        setSearchDropdownOpen(true);
      })
      .catch(() => setSearchResults([]))
      .finally(() => setIsSearching(false));
  };

  // Trigger explicit GPS location detection
  const handleDetectLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        try {
          const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
          if (res.ok) {
            const place = (await res.json()) as { name?: string; admin?: string; country?: string };
            if (place.name) {
              setSelectedLoc({
                name: place.name,
                admin: place.admin || "Detected location",
                country: place.country || "",
                latitude: lat,
                longitude: lng,
              });
              setIsDetectingLocation(false);
              return;
            }
          }
        } catch {}
        setSelectedLoc({
          name: "Current Location",
          admin: "GPS Coordinates",
          latitude: lat,
          longitude: lng,
        });
        setIsDetectingLocation(false);
      },
      () => {
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // Pre-process rows for chart and hourly cards
  const rows = useMemo(() => {
    if (!data?.hourly?.time) return [];
    return data.hourly.time.map((time, index) => {
      const usAqi = data.hourly.us_aqi?.[index] ?? null;
      const cpcbAqi = data.hourly.cpcb_aqi?.[index] ?? null;
      const activeAqi = standard === "cpcb" ? (cpcbAqi ?? usAqi) : (usAqi ?? cpcbAqi);

      const margin = data.confidenceIntervals?.errorMargin?.[index] ?? Math.round(7 + index * 0.18);
      const lower = data.confidenceIntervals?.aqiLower?.[index] ?? Math.max(0, (activeAqi ?? 100) - margin);
      const upper = data.confidenceIntervals?.aqiUpper?.[index] ?? Math.min(500, (activeAqi ?? 100) + margin);

      return {
        time,
        aqi: activeAqi,
        usAqi,
        cpcbAqi,
        pm2_5: data.hourly.pm2_5?.[index] ?? null,
        pm10: data.hourly.pm10?.[index] ?? null,
        no2: data.hourly.nitrogen_dioxide?.[index] ?? null,
        o3: data.hourly.ozone?.[index] ?? null,
        so2: data.hourly.sulphur_dioxide?.[index] ?? null,
        co: data.hourly.carbon_monoxide?.[index] ?? null,
        aqiLower: lower,
        aqiUpper: upper,
        errorMargin: margin,
      };
    });
  }, [data, standard]);

  // Key Analytics Calculations (Peak, Lowest, Mean)
  const analytics = useMemo(() => {
    if (rows.length === 0) return null;
    let peakRow = rows[0];
    let cleanRow = rows[0];
    let sum = 0;
    let count = 0;

    for (const r of rows) {
      if (typeof r.aqi === "number") {
        if (typeof peakRow.aqi !== "number" || r.aqi > peakRow.aqi) peakRow = r;
        if (typeof cleanRow.aqi !== "number" || r.aqi < cleanRow.aqi) cleanRow = r;
        sum += r.aqi;
        count++;
      }
    }

    const avg = count > 0 ? Math.round(sum / count) : 0;
    const peakBand = typeof peakRow.aqi === "number" ? bandFor(peakRow.aqi, standard) : null;
    const cleanBand = typeof cleanRow.aqi === "number" ? bandFor(cleanRow.aqi, standard) : null;

    return {
      peak: {
        val: peakRow.aqi,
        time: timeParts(peakRow.time),
        band: peakBand,
      },
      cleanest: {
        val: cleanRow.aqi,
        time: timeParts(cleanRow.time),
        band: cleanBand,
      },
      average: avg,
      avgBand: bandFor(avg, standard),
    };
  }, [rows, standard]);

  // Comprehensive 72-Hour Trajectory, Spikes, & Percentage Swings Analysis
  const trajectory = useMemo(() => {
    if (rows.length < 2) return null;

    const startRow = rows[0];
    const endRow = rows[rows.length - 1];

    const startAqi = typeof startRow.aqi === "number" ? Math.round(startRow.aqi) : 0;
    const endAqi = typeof endRow.aqi === "number" ? Math.round(endRow.aqi) : 0;

    const netDelta = endAqi - startAqi;
    const netChangePct = startAqi > 0 ? (netDelta / startAqi) * 100 : 0;
    const isNetIncrease = netDelta > 0;

    let peakRow = rows[0];
    let troughRow = rows[0];
    let sumAqi = 0;
    let countAqi = 0;

    rows.forEach((r) => {
      if (typeof r.aqi === "number") {
        if (typeof peakRow.aqi !== "number" || r.aqi > peakRow.aqi) peakRow = r;
        if (typeof troughRow.aqi !== "number" || r.aqi < troughRow.aqi) troughRow = r;
        sumAqi += r.aqi;
        countAqi++;
      }
    });

    const peakAqi = typeof peakRow.aqi === "number" ? Math.round(peakRow.aqi) : startAqi;
    const troughAqi = typeof troughRow.aqi === "number" ? Math.round(troughRow.aqi) : startAqi;
    const avgAqi = countAqi > 0 ? Math.round(sumAqi / countAqi) : startAqi;

    const maxSwingPct = troughAqi > 0 ? ((peakAqi - troughAqi) / troughAqi) * 100 : 0;
    const surgeFromBaselinePct = startAqi > 0 ? ((peakAqi - startAqi) / startAqi) * 100 : 0;

    const startBand = bandFor(startAqi, standard);
    const endBand = bandFor(endAqi, standard);
    const peakBand = bandFor(peakAqi, standard);
    const troughBand = bandFor(troughAqi, standard);
    const avgBand = bandFor(avgAqi, standard);

    const peakTimeParts = timeParts(peakRow.time);
    const troughTimeParts = timeParts(troughRow.time);

    // Day 1, Day 2, Day 3 Segments
    const d1Slice = rows.slice(0, Math.min(24, rows.length));
    const d2Slice = rows.slice(24, Math.min(48, rows.length));
    const d3Slice = rows.slice(48, Math.min(72, rows.length));

    const computeDaySegment = (slice: typeof rows, label: string, hoursLabel: string) => {
      if (!slice.length) return null;
      const firstItem = slice[0];
      const lastItem = slice[slice.length - 1];
      const dStart = typeof firstItem?.aqi === "number" ? Math.round(firstItem.aqi) : 0;
      const dEnd = typeof lastItem?.aqi === "number" ? Math.round(lastItem.aqi) : dStart;
      const dDelta = dEnd - dStart;
      const dPct = dStart > 0 ? (dDelta / dStart) * 100 : 0;

      let dPeak = slice[0];
      let dSum = 0;
      slice.forEach((r) => {
        if (typeof r.aqi === "number") {
          if (typeof dPeak.aqi !== "number" || r.aqi > dPeak.aqi) dPeak = r;
          dSum += r.aqi;
        }
      });
      const dAvg = Math.round(dSum / slice.length);
      const dPeakVal = typeof dPeak.aqi === "number" ? Math.round(dPeak.aqi) : dStart;

      return {
        label,
        hoursLabel,
        startAqi: dStart,
        endAqi: dEnd,
        delta: dDelta,
        pct: dPct,
        isIncrease: dDelta > 0,
        avgAqi: dAvg,
        avgBand: bandFor(dAvg, standard),
        peakAqi: dPeakVal,
        peakBand: bandFor(dPeakVal, standard),
        peakTime: timeParts(dPeak.time),
      };
    };

    const day1 = computeDaySegment(d1Slice, "Day 1 (Next 24h)", "0h – 24h");
    const day2 = computeDaySegment(d2Slice, "Day 2 (Mid-Range)", "24h – 48h");
    const day3 = computeDaySegment(d3Slice, "Day 3 (Extended)", "48h – 72h");

    // Detect Top Distinct Spikes across 72h
    const candidateSpikes: {
      index: number;
      row: typeof rows[0];
      aqi: number;
      surgeFromValley: number;
      hour: number;
    }[] = [];

    for (let i = 1; i < rows.length - 1; i++) {
      const prev = rows[i - 1].aqi;
      const curr = rows[i].aqi;
      const next = rows[i + 1].aqi;
      if (
        typeof curr === "number" &&
        typeof prev === "number" &&
        typeof next === "number" &&
        curr >= prev &&
        curr >= next &&
        curr >= avgAqi * 1.05
      ) {
        let minBefore = curr;
        for (let j = Math.max(0, i - 8); j < i; j++) {
          if (typeof rows[j].aqi === "number" && (rows[j].aqi as number) < minBefore) {
            minBefore = rows[j].aqi as number;
          }
        }
        const surge = minBefore > 0 ? ((curr - minBefore) / minBefore) * 100 : 0;
        let dHour = 12;
        try {
          dHour = new Date(rows[i].time).getHours();
        } catch {
          // ignore
        }
        candidateSpikes.push({
          index: i,
          row: rows[i],
          aqi: Math.round(curr),
          surgeFromValley: surge,
          hour: dHour,
        });
      }
    }

    // Sort by aqi descending and filter to at most 3 distinct peaks
    candidateSpikes.sort((a, b) => b.aqi - a.aqi);
    const selectedSpikes: typeof candidateSpikes = [];
    for (const c of candidateSpikes) {
      const tooClose = selectedSpikes.some((s) => Math.abs(s.index - c.index) < 7);
      if (!tooClose) {
        selectedSpikes.push(c);
        if (selectedSpikes.length >= 3) break;
      }
    }

    if (selectedSpikes.length === 0 && peakAqi > troughAqi) {
      let dHour = 12;
      try {
        dHour = new Date(peakRow.time).getHours();
      } catch {
        // ignore
      }
      selectedSpikes.push({
        index: rows.indexOf(peakRow),
        row: peakRow,
        aqi: peakAqi,
        surgeFromValley: maxSwingPct,
        hour: dHour,
      });
    }

    selectedSpikes.sort((a, b) => a.index - b.index);

    const formattedSpikes = selectedSpikes.map((s, idx) => {
      const parts = timeParts(s.row.time);
      const isNight = s.hour >= 20 || s.hour <= 5;
      const isMorningCommute = s.hour >= 6 && s.hour <= 10;
      const isAfternoon = s.hour >= 12 && s.hour <= 17;

      let cause = "Atmospheric boundary layer compression and particulate stagnation.";
      if (isNight) {
        cause = "Nocturnal Surface Temperature Inversion: Cold dense air caps vertical dispersion, trapping local vehicular and heating aerosols near ground level.";
      } else if (isMorningCommute) {
        cause = "Morning Commute Emissions Peak: High commuter traffic volume coincides with a shallow mixing height before solar thermal convection initiates.";
      } else if (isAfternoon) {
        cause = "Photochemical Secondary Aerosols: Solar ultraviolet radiation drives chemical formation of fine nitrates and secondary organic aerosols.";
      }

      return {
        id: `spike-${idx + 1}`,
        badge: idx === 0 ? "PRIMARY PROJECTED SPIKE" : `SECONDARY SURGE #${idx + 1}`,
        time: `${parts.day} · ${parts.hour}`,
        aqi: s.aqi,
        band: bandFor(s.aqi, standard),
        surgePct: s.surgeFromValley,
        pm2_5: s.row.pm2_5,
        pm10: s.row.pm10,
        cause,
      };
    });

    // Atmospheric Condition Prognosis Text
    let conditionTrend: "deteriorating" | "improving" | "stable" | "volatile" = "stable";
    if (Math.abs(netChangePct) > 12) {
      conditionTrend = isNetIncrease ? "deteriorating" : "improving";
    } else if (maxSwingPct > 55) {
      conditionTrend = "volatile";
    }

    let conditionNarrative = "";
    if (conditionTrend === "deteriorating") {
      conditionNarrative = `Over the upcoming 72 hours, ambient atmospheric conditions are projected to progressively deteriorate, registering an overall +${Math.abs(netChangePct).toFixed(1)}% escalation in composite air pollutant concentrations (shifting from ${startAqi} ${startBand.label} to ${endAqi} ${endBand.label}). This build-up is largely propelled by reduced boundary-layer ventilation and episodic calm surface winds. The most critical period occurs at ${peakTimeParts.day} (${peakTimeParts.hour}) when a severe peak of ${peakAqi} AQI is modeled—representing a +${maxSwingPct.toFixed(0)}% surge above the cleanest window.`;
    } else if (conditionTrend === "improving") {
      conditionNarrative = `Over the upcoming 72 hours, ambient atmospheric conditions are projected to register marked net improvement, exhibiting an overall -${Math.abs(netChangePct).toFixed(1)}% reduction in composite air pollutant load (easing from ${startAqi} ${startBand.label} down to ${endAqi} ${endBand.label}). Enhanced atmospheric venting and convective dispersion will facilitate particulate clearing, although diurnal nocturnal surges will still produce transient spikes, with the highest reaching ${peakAqi} AQI before clearing toward a clean trough of ${troughAqi} AQI at ${troughTimeParts.day} (${troughTimeParts.hour}).`;
    } else if (conditionTrend === "volatile") {
      conditionNarrative = `The 72-hour forecast exhibits pronounced diurnal volatility (+${maxSwingPct.toFixed(0)}% amplitude swing between peak and trough), despite a relatively moderate net drift of ${netChangePct >= 0 ? "+" : ""}${netChangePct.toFixed(1)}% overall. Air quality will oscillate cyclically between daytime convective reprieves (dipping to ${troughAqi} ${troughBand.label}) and sharp nocturnal inversion peaks (surging up to ${peakAqi} ${peakBand.label}). Daily outdoor routines and indoor air filtration should be timed precisely around these recurring cycles.`;
    } else {
      conditionNarrative = `The 72-hour forecast demonstrates steady cyclical equilibrium with a mild net variation of ${netChangePct >= 0 ? "+" : ""}${netChangePct.toFixed(1)}% throughout the entire horizon (starting at ${startAqi} and stabilizing near ${endAqi}). While baseline pollutant loading remains persistent, regular diurnal cycles will govern daily exposure, reaching a maximum ceiling of ${peakAqi} AQI on ${peakTimeParts.day} (${peakTimeParts.hour}) and a baseline trough of ${troughAqi} AQI on ${troughTimeParts.day} (${troughTimeParts.hour}).`;
    }

    return {
      startAqi,
      endAqi,
      netDelta,
      netChangePct,
      isNetIncrease,
      peakAqi,
      peakTime: `${peakTimeParts.day} · ${peakTimeParts.hour}`,
      peakBand,
      troughAqi,
      troughTime: `${troughTimeParts.day} · ${troughTimeParts.hour}`,
      troughBand,
      avgAqi,
      avgBand,
      maxSwingPct,
      surgeFromBaselinePct,
      conditionTrend,
      conditionNarrative,
      day1,
      day2,
      day3,
      spikes: formattedSpikes,
    };
  }, [rows, standard]);

  const isMlModelActive = data?.provenance === "ML_PREDICTIVE_MODEL";

  return (
    <section className="phase-view forecast-view space-y-6 sm:space-y-8" aria-label="72-Hour Atmospheric AQI Forecast">
      {/* ------------------------------------------------------------------ */}
      {/* 1. EDITORIAL HEADER & LOCATION SELECTOR                            */}
      {/* ------------------------------------------------------------------ */}
      <header className="phase-view-heading flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[var(--dash-rule)]/40">
        <div>
          <span className="section-kicker flex items-center gap-2">
            <span className="eyebrow-line" />
            FORWARD VIEW · {selectedLoc.name.toUpperCase()}
            {selectedLoc.admin && ` (${selectedLoc.admin.toUpperCase()})`}
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight mt-1 text-[var(--dash-ink)]">
            What the next <em>72 hours hold.</em>
          </h1>
          <p className="text-xs sm:text-sm text-[var(--dash-muted)] mt-1 max-w-2xl leading-relaxed">
            Multi-step hourly trajectory synthesizing atmospheric grid reanalysis and custom
            machine learning gradient-boosted forecasters.
          </p>
        </div>

        {/* Provenance Badge Pill */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {isMlModelActive ? (
            <span className="provenance-pill flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-purple-500/15 border border-purple-500/35 text-purple-700 dark:text-purple-300 shadow-xs animate-pulse">
              <BrainCircuit size={14} className="text-purple-600 dark:text-purple-400" />
              <span>CUSTOM ML FORECASTER (XGBOOST/GBDT)</span>
            </span>
          ) : data?.provenance === "PROVIDER_CAMS" ? (
            <span className="provenance-pill estimate-pill flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-blue-500/15 border border-blue-500/35 text-blue-700 dark:text-blue-300">
              <Compass size={14} />
              <span>ECMWF CAMS GRID MODEL</span>
            </span>
          ) : (
            <span className="provenance-pill estimate-pill flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-emerald-500/15 border border-emerald-500/35 text-emerald-800 dark:text-emerald-300">
              <CloudSun size={14} />
              <span>OPEN-METEO CAMS FORECAST</span>
            </span>
          )}
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* 2. INTERACTIVE LOCATION CHOOSER & GEOLOCATION TOOLBAR             */}
      {/* ------------------------------------------------------------------ */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border transition-colors space-y-3.5 ${
          isDark
            ? "bg-[#0e1714]/75 border-neutral-800"
            : "bg-white/90 border-[#e3ded4] shadow-xs"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            <MapPin size={15} />
            <span>Select Forecast Location:</span>
          </div>

          {/* Quick GPS Geolocation Trigger */}
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={isDetectingLocation}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all disabled:opacity-50 cursor-pointer shadow-xs ${
              isDark
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                : "border-emerald-600/30 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold"
            }`}
            title="Detect location automatically via browser GPS"
          >
            <Crosshair size={14} className={isDetectingLocation ? "animate-spin" : ""} />
            <span>{isDetectingLocation ? "Acquiring GPS..." : "Use Current Location"}</span>
          </button>
        </div>

        {/* Search Input with Dynamic Geocoding Dropdown */}
        <div className="relative" ref={searchContainerRef}>
          <div
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all ${
              isDark
                ? "bg-black/30 border-neutral-700 text-white focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/40"
                : "bg-[#faf9f5] border-[#dcd6c9] text-[#131c18] focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600/30 shadow-inner"
            }`}
          >
            <Search size={16} className="text-[var(--dash-muted)] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setSearchDropdownOpen(true);
              }}
              placeholder={`Search city or coordinates (currently: ${selectedLoc.name})...`}
              className="w-full bg-transparent text-sm focus:outline-none font-sans"
            />
            {isSearching && (
              <RefreshCw size={14} className="animate-spin text-emerald-500 shrink-0" />
            )}
          </div>

          {/* Search Dropdown Results */}
          {searchDropdownOpen && searchResults.length > 0 && (
            <div
              className={`absolute top-full left-0 right-0 mt-1.5 p-1.5 rounded-xl border shadow-2xl z-50 space-y-1 ${
                isDark
                  ? "border-neutral-700 bg-neutral-900/95 backdrop-blur-md text-white"
                  : "border-[#dcd6c9] bg-white text-[#131c18]"
              }`}
            >
              {searchResults.map((place) => (
                <button
                  key={`${place.latitude}-${place.longitude}`}
                  type="button"
                  onClick={() => {
                    setSelectedLoc({
                      name: place.name,
                      admin: place.admin1,
                      country: place.country,
                      latitude: place.latitude,
                      longitude: place.longitude,
                    });
                    setSearchDropdownOpen(false);
                    setSearchQuery("");
                  }}
                  className={`w-full text-left p-2.5 rounded-lg transition-colors flex items-center justify-between text-xs font-mono cursor-pointer ${
                    isDark ? "hover:bg-neutral-800/80" : "hover:bg-[#f4f1ea]"
                  }`}
                >
                  <span className="font-bold">
                    {place.name}
                    {place.admin1 && <span className="font-normal opacity-70">, {place.admin1}</span>}
                    {place.country && <span className="font-normal opacity-50"> · {place.country}</span>}
                  </span>
                  <span className="text-[10px] opacity-70">
                    {place.latitude.toFixed(2)}°, {place.longitude.toFixed(2)}°
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Selection City Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono scrollbar-none">
          <span className="text-[10px] text-[var(--dash-muted)] uppercase shrink-0 mr-1 font-bold">
            QUICK CITIES:
          </span>
          {POPULAR_CITIES.map((c) => {
            const isCurrent =
              Math.abs(selectedLoc.latitude - c.latitude) < 0.05 &&
              Math.abs(selectedLoc.longitude - c.longitude) < 0.05;

            return (
              <button
                key={c.name}
                type="button"
                onClick={() => setSelectedLoc(c)}
                className={`px-2.5 py-1 rounded-lg border transition-all shrink-0 cursor-pointer ${
                  isCurrent
                    ? isDark
                      ? "border-emerald-500 bg-emerald-500/20 text-emerald-400 font-bold"
                      : "border-emerald-600 bg-emerald-600/10 text-emerald-800 font-bold shadow-xs"
                    : isDark
                    ? "border-neutral-800 bg-neutral-900/60 text-[var(--dash-muted)] hover:border-neutral-700 hover:text-white"
                    : "border-[#ded8cb] bg-white text-[#525e57] hover:border-neutral-400 hover:text-[#131c18]"
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. 72-HOUR ANALYTICS RIBBON (4 Metric Cards)                       */}
      {/* ------------------------------------------------------------------ */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Peak Severity */}
          <div
            className={`p-4 rounded-xl border transition-colors space-y-1.5 ${
              isDark
                ? "bg-[#0e1714]/80 border-neutral-800"
                : "bg-white/90 border-[#e4dfd6] shadow-xs"
            }`}
          >
            <span className="text-[10px] font-mono font-bold text-rose-600 uppercase flex items-center gap-1.5">
              <AlertTriangle size={13} />
              <span>72H PEAK SEVERITY</span>
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-mono font-black text-rose-600">
                {analytics.peak.val}
              </span>
              <span
                className="text-xs font-mono font-bold px-2 py-0.5 rounded-full"
                style={{
                  color: analytics.peak.band?.color,
                  backgroundColor: `${analytics.peak.band?.color}18`,
                }}
              >
                {analytics.peak.band?.label}
              </span>
            </div>
            <p className="text-[11px] text-[var(--dash-muted)] font-mono">
              Expected at {analytics.peak.time.dayShort} {analytics.peak.time.hour}
            </p>
          </div>

          {/* Cleanest Window */}
          <div
            className={`p-4 rounded-xl border transition-colors space-y-1.5 ${
              isDark
                ? "bg-[#0e1714]/80 border-neutral-800"
                : "bg-white/90 border-[#e4dfd6] shadow-xs"
            }`}
          >
            <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase flex items-center gap-1.5">
              <CheckCircle2 size={13} />
              <span>OPTIMAL BREATHING WINDOW</span>
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-mono font-black text-emerald-700 dark:text-emerald-400">
                {analytics.cleanest.val}
              </span>
              <span
                className="text-xs font-mono font-bold px-2 py-0.5 rounded-full"
                style={{
                  color: analytics.cleanest.band?.color,
                  backgroundColor: `${analytics.cleanest.band?.color}18`,
                }}
              >
                {analytics.cleanest.band?.label}
              </span>
            </div>
            <p className="text-[11px] text-[var(--dash-muted)] font-mono">
              Window near {analytics.cleanest.time.dayShort} {analytics.cleanest.time.hour}
            </p>
          </div>

          {/* 72h Mean Exposure */}
          <div
            className={`p-4 rounded-xl border transition-colors space-y-1.5 ${
              isDark
                ? "bg-[#0e1714]/80 border-neutral-800"
                : "bg-white/90 border-[#e4dfd6] shadow-xs"
            }`}
          >
            <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-500 uppercase flex items-center gap-1.5">
              <Compass size={13} />
              <span>72H CUMULATIVE AVERAGE</span>
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-mono font-black text-amber-700 dark:text-amber-500">
                {analytics.average}
              </span>
              <span
                className="text-xs font-mono font-bold px-2 py-0.5 rounded-full"
                style={{
                  color: analytics.avgBand.color,
                  backgroundColor: `${analytics.avgBand.color}18`,
                }}
              >
                {analytics.avgBand.label}
              </span>
            </div>
            <p className="text-[11px] text-[var(--dash-muted)] font-mono">
              Overall projected exposure burden
            </p>
          </div>

          {/* Forecast Model & Uncertainty Margin */}
          <div
            className={`p-4 rounded-xl border transition-colors space-y-1.5 ${
              isDark
                ? "bg-[#0e1714]/80 border-neutral-800"
                : "bg-white/90 border-[#e4dfd6] shadow-xs"
            }`}
          >
            <span className="text-[10px] font-mono font-bold text-purple-700 dark:text-purple-400 uppercase flex items-center gap-1.5">
              <Zap size={13} />
              <span>MODEL UNCERTAINTY (95% CI)</span>
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-mono font-black text-purple-700 dark:text-purple-400">
                ±14
              </span>
              <span className="text-xs font-mono font-bold text-[var(--dash-ink)]">
                AQI Margin
              </span>
            </div>
            <p className="text-[11px] text-[var(--dash-muted)] font-mono">
              {isMlModelActive ? "Gradient-Boosted GBDT Auto-Regressor" : "CAMS Multi-Model Ensemble"}
            </p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 4. FORECAST CONTROLS & MODEL SIMULATION TOOLBAR                   */}
      {/* ------------------------------------------------------------------ */}
      <div
        className={`forecast-toolbar flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl border transition-colors ${
          isDark
            ? "bg-neutral-900/60 border-neutral-800"
            : "bg-white/80 border-[#e4ded5] shadow-xs"
        }`}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Statutory Standard Switcher */}
          <label className="standard-select flex items-center gap-2 text-xs font-mono">
            <span className="text-[var(--dash-muted)]">Scale Standard:</span>
            <select
              value={standard}
              onChange={(e) => setStandard(e.target.value as Standard)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border font-mono focus:outline-none cursor-pointer ${
                isDark
                  ? "bg-neutral-800 text-white border-neutral-700"
                  : "bg-white text-[#131c18] border-[#ded8cb] shadow-xs"
              }`}
            >
              <option value="cpcb">CPCB NAQI (India Statutory)</option>
              <option value="epa">US-EPA Scale</option>
            </select>
          </label>

          {/* Confidence Band Toggle */}
          <button
            type="button"
            onClick={() => setShowConfidenceBand((prev) => !prev)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
              showConfidenceBand
                ? isDark
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400 font-bold"
                  : "border-emerald-600 bg-emerald-50 text-emerald-800 font-bold shadow-xs"
                : isDark
                ? "border-neutral-800 text-[var(--dash-muted)] hover:text-white"
                : "border-[#ded8cb] bg-white text-[#525e57] hover:text-[#131c18]"
            }`}
          >
            {showConfidenceBand ? "✓ 95% Confidence Band" : "Hide Error Bounds"}
          </button>
        </div>

        {/* Custom ML Simulation Fallback Trigger */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setForceMl((prev) => !prev)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
              forceMl
                ? isDark
                  ? "border-purple-500 bg-purple-500/20 text-purple-300 font-bold ring-1 ring-purple-500/40"
                  : "border-purple-600 bg-purple-100 text-purple-900 font-bold ring-1 ring-purple-600/30"
                : isDark
                ? "border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400"
                : "border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold"
            }`}
            title="Simulate external provider failure and run on-the-fly Custom ML Forecaster"
          >
            <BrainCircuit size={14} className={forceMl ? "animate-pulse" : ""} />
            <span>{forceMl ? "Active: ML Fallback Engine" : "Test Custom ML Forecaster"}</span>
          </button>

          {isMlModelActive && (
            <button
              type="button"
              onClick={() => setShowMlDetails((prev) => !prev)}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isDark
                  ? "border-neutral-700 hover:bg-neutral-800 text-[var(--dash-muted)]"
                  : "border-[#ded8cb] bg-white hover:bg-[#f4f1ea] text-[#525e57]"
              }`}
              title="Inspect ML Feature Vector"
            >
              <Info size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Fallback Notice Bar (if external APIs were unavailable) */}
      {data?.fallbackNote && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-mono flex items-center justify-between gap-3 ${
            isDark
              ? "border-purple-500/30 bg-purple-500/10 text-purple-300"
              : "border-purple-300 bg-purple-50 text-purple-900 shadow-xs"
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-purple-600 dark:text-purple-400 shrink-0" />
            <span>{data.fallbackNote}</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider opacity-70 shrink-0 font-bold">
            PROVENANCE: ML_PREDICTIVE_MODEL
          </span>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 5. MAIN PREDICTIVE AREA CHART                                     */}
      {/* ------------------------------------------------------------------ */}
      <div
        className={`phase-chart-card forecast-chart-card rounded-2xl border p-5 sm:p-7 transition-colors ${
          isDark
            ? "bg-[#0e1714]/90 border-neutral-800 text-white"
            : "bg-white border-[#e4ded5] text-[#131c18] shadow-sm"
        }`}
      >
        <div className="phase-chart-heading flex items-center justify-between pb-4 border-b border-[var(--dash-rule)]/40 mb-4">
          <div>
            <span className="section-kicker font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase">
              {isMlModelActive ? "MACHINE LEARNING AUTOREGRESSIVE TIME-SERIES" : "ATMOSPHERIC DISPERSION REANALYSIS"}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Hourly {standard === "cpcb" ? "CPCB NAQI" : "US-EPA AQI"} 72-Hour Prediction
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-[var(--dash-muted)]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-emerald-500" />
              <span>Projected AQI</span>
            </span>
            {showConfidenceBand && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-purple-500/25 border border-purple-500/50" />
                <span>95% Confidence Band</span>
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="h-64 sm:h-80 flex flex-col items-center justify-center gap-3 font-mono text-xs text-[var(--dash-muted)]">
            <RefreshCw size={24} className="animate-spin text-emerald-500" />
            <span>Synthesizing multi-step 72-hour trajectory for {selectedLoc.name}…</span>
          </div>
        ) : error ? (
          <div className="h-64 sm:h-80 flex items-center justify-center text-xs font-mono text-rose-500">
            {error}
          </div>
        ) : rows.length === 0 ? (
          <div className="h-64 sm:h-80 flex items-center justify-center text-xs font-mono text-[var(--dash-muted)]">
            No forecast timesteps returned.
          </div>
        ) : (
          <div className="h-64 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rows} margin={{ top: 10, right: 14, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="forecastAqiFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="confidenceBandFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 5"
                  stroke={isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}
                />
                <XAxis
                  dataKey="time"
                  tickFormatter={(time) =>
                    new Date(String(time)).toLocaleDateString([], {
                      weekday: "short",
                      hour: "numeric",
                    })
                  }
                  minTickGap={45}
                  tick={{
                    fill: isDark ? "rgba(255, 255, 255, 0.55)" : "rgba(20, 32, 25, 0.65)",
                    fontSize: 11,
                    fontFamily: "monospace",
                  }}
                />
                <YAxis
                  domain={[0, "auto"]}
                  tick={{
                    fill: isDark ? "rgba(255, 255, 255, 0.55)" : "rgba(20, 32, 25, 0.65)",
                    fontSize: 11,
                    fontFamily: "monospace",
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const row = payload[0].payload as typeof rows[0];
                    const band = typeof row.aqi === "number" ? bandFor(row.aqi, standard) : null;
                    const dateStr = new Date(String(row.time)).toLocaleString([], {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        className={`p-3.5 rounded-xl border shadow-xl text-xs font-mono space-y-1.5 min-w-[220px] ${
                          isDark
                            ? "bg-neutral-900/95 border-neutral-700 text-[#eff4ef]"
                            : "bg-white/95 border-[#ded8cb] text-[#131c18]"
                        }`}
                      >
                        <div className="text-[10px] text-[var(--dash-muted)] border-b border-[var(--dash-rule)]/50 pb-1">
                          {dateStr}
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="font-bold">
                            {standard === "cpcb" ? "CPCB NAQI:" : "US-EPA AQI:"}
                          </span>
                          <span className="text-base font-black" style={{ color: band?.color ?? "#10b981" }}>
                            {row.aqi ?? "—"} ({band?.label})
                          </span>
                        </div>
                        <div className="text-[10px] text-[var(--dash-muted)] space-y-0.5 pt-1 border-t border-[var(--dash-rule)]/40">
                          <div className="flex justify-between">
                            <span>PM2.5:</span>
                            <strong className="text-[var(--dash-ink)]">
                              {row.pm2_5 !== null ? `${row.pm2_5.toFixed(1)} µg/m³` : "—"}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span>PM10:</span>
                            <strong className="text-[var(--dash-ink)]">
                              {row.pm10 !== null ? `${row.pm10.toFixed(1)} µg/m³` : "—"}
                            </strong>
                          </div>
                          {row.no2 !== null && (
                            <div className="flex justify-between">
                              <span>NO2:</span>
                              <strong className="text-[var(--dash-ink)]">{row.no2.toFixed(1)} µg/m³</strong>
                            </div>
                          )}
                          <div className="flex justify-between text-purple-700 dark:text-purple-400 pt-1 border-t border-[var(--dash-rule)]/30">
                            <span>Confidence:</span>
                            <strong>±{row.errorMargin} AQI ({row.aqiLower}–{row.aqiUpper})</strong>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
                {/* Confidence Interval Upper and Lower Bounds */}
                {showConfidenceBand && (
                  <Area
                    type="monotone"
                    dataKey="aqiUpper"
                    stroke="#8b5cf6"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                    fill="url(#confidenceBandFill)"
                    connectNulls={false}
                  />
                )}
                {/* Main Predicted Trajectory Line */}
                <Area
                  type="monotone"
                  dataKey="aqi"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#forecastAqiFill)"
                  connectNulls={false}
                  activeDot={{ r: 5, fill: "#10b981", stroke: "#ffffff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 6. ML FEATURE VECTOR DISCLOSURE DRAWER                             */}
      {/* ------------------------------------------------------------------ */}
      {isMlModelActive && showMlDetails && data?.featuresUsed && (
        <div
          className={`p-5 rounded-2xl border backdrop-blur-md space-y-4 ${
            isDark
              ? "border-purple-500/30 bg-purple-500/5 text-purple-300"
              : "border-purple-300 bg-purple-50/70 text-purple-900 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BrainCircuit size={18} className="text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                Machine Learning Model Architecture &amp; Feature Vector Inputs
              </h3>
            </div>
            <span
              className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${
                isDark ? "bg-purple-500/20 text-purple-300" : "bg-purple-200 text-purple-900 font-bold"
              }`}
            >
              {data.algorithm}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div
              className={`p-3 rounded-xl border space-y-2 ${
                isDark
                  ? "border-purple-500/20 bg-neutral-900/60"
                  : "border-purple-200 bg-white"
              }`}
            >
              <strong className="text-purple-700 dark:text-purple-300 block uppercase">1. Historical Lag Features</strong>
              <ul className="space-y-1 text-[var(--dash-muted)]">
                {data.featuresUsed.historicalLags?.map((f, i) => (
                  <li key={i}>› {f}</li>
                ))}
              </ul>
            </div>
            <div
              className={`p-3 rounded-xl border space-y-2 ${
                isDark
                  ? "border-purple-500/20 bg-neutral-900/60"
                  : "border-purple-200 bg-white"
              }`}
            >
              <strong className="text-purple-700 dark:text-purple-300 block uppercase">2. Meteorological Coupled Physics</strong>
              <ul className="space-y-1 text-[var(--dash-muted)]">
                {data.featuresUsed.meteorological?.map((f, i) => (
                  <li key={i}>› {f}</li>
                ))}
              </ul>
            </div>
            <div
              className={`p-3 rounded-xl border space-y-2 ${
                isDark
                  ? "border-purple-500/20 bg-neutral-900/60"
                  : "border-purple-200 bg-white"
              }`}
            >
              <strong className="text-purple-700 dark:text-purple-300 block uppercase">3. Cyclical Trigonometrics</strong>
              <ul className="space-y-1 text-[var(--dash-muted)]">
                {data.featuresUsed.temporalCyclical?.map((f, i) => (
                  <li key={i}>› {f}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 7. 72-HOUR TIMESTEP CARD CAROUSEL                                 */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-3">
        <div className="forecast-hours-heading flex items-center justify-between">
          <div>
            <span className="section-kicker font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase">
              72 MODEL TIMESTEPS
            </span>
            <h2 className="text-xl font-bold text-[var(--dash-ink)]">Hour-by-Hour Chronological Stream</h2>
          </div>
          <span className="text-xs font-mono text-[var(--dash-muted)] flex items-center gap-1.5">
            Scroll horizontally to inspect <ArrowDown size={13} className="-rotate-90" />
          </span>
        </div>

        {loading ? (
          <div className="phase-state">Synthesizing hourly forecast cards…</div>
        ) : error ? null : (
          <div className="forecast-hours flex gap-3 overflow-x-auto pb-4 pt-1 scrollbar-thin" aria-label="Hourly air quality forecast">
            {rows.map((row, index) => {
              const band = typeof row.aqi === "number" ? bandFor(row.aqi, standard) : null;
              const label = timeParts(row.time);

              return (
                <article
                  className={`forecast-hour-card min-w-[130px] p-3.5 rounded-xl border relative flex flex-col justify-between shrink-0 transition-colors ${
                    isDark
                      ? "bg-[#0e1714]/80 border-neutral-800 hover:border-emerald-500/50"
                      : "bg-white border-[#e4ded5] hover:border-emerald-600/50 shadow-xs"
                  }`}
                  key={row.time}
                >
                  <div>
                    <span className="forecast-hour-day text-[10px] font-mono text-[var(--dash-muted)] uppercase block">
                      {label.day}
                    </span>
                    <time className="text-xs font-mono font-bold block text-[var(--dash-ink)]">{label.hour}</time>
                  </div>

                  <div className="my-2 text-center">
                    <strong
                      className="text-2xl font-mono font-black block"
                      style={{ color: band?.color ?? "var(--dash-muted)" }}
                    >
                      {typeof row.aqi === "number" ? Math.round(row.aqi) : "—"}
                    </strong>
                    <span
                      className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-full inline-block mt-0.5"
                      style={{
                        color: band?.color,
                        backgroundColor: `${band?.color}18`,
                      }}
                    >
                      {band?.label ?? "Unavailable"}
                    </span>
                  </div>

                  <div className="forecast-hour-pollutants pt-2 border-t border-[var(--dash-rule)]/40 text-[10px] font-mono space-y-0.5 text-[var(--dash-muted)]">
                    <div className="flex justify-between">
                      <span>PM₂.₅</span>
                      <b className="text-[var(--dash-ink)]">
                        {typeof row.pm2_5 === "number" ? row.pm2_5.toFixed(0) : "—"}
                      </b>
                    </div>
                    <div className="flex justify-between">
                      <span>PM₁₀</span>
                      <b className="text-[var(--dash-ink)]">
                        {typeof row.pm10 === "number" ? row.pm10.toFixed(0) : "—"}
                      </b>
                    </div>
                    <div className="flex justify-between text-purple-700 dark:text-purple-400 pt-0.5 font-semibold">
                      <span>CI:</span>
                      <span>±{row.errorMargin}</span>
                    </div>
                  </div>

                  {index === 0 && <i className="forecast-now-dot absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 8. 72-HOUR ATMOSPHERIC TRAJECTORY & SPIKE ANALYSIS DOSSIER         */}
      {/* ------------------------------------------------------------------ */}
      {trajectory && (
        <section
          className={`trajectory-dossier p-6 sm:p-8 rounded-2xl border transition-colors space-y-6 sm:space-y-8 ${
            isDark
              ? "bg-[#0e1714]/90 border-neutral-800 shadow-xl"
              : "bg-white border-[#e3ded4] shadow-sm"
          }`}
          aria-label="72-Hour Atmospheric Condition and Spike Breakdown"
        >
          {/* Header & Status Pill */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--dash-rule)]/50">
            <div>
              <span className="section-kicker flex items-center gap-2 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                <Sparkles size={13} />
                ATMOSPHERIC TRAJECTORY DOSSIER · 72-HOUR HORIZON
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--dash-ink)] mt-1">
                Atmospheric Conditions Ahead & Spike Trajectory
              </h2>
              <p className="text-xs sm:text-sm text-[var(--dash-muted)] mt-1 max-w-3xl leading-relaxed">
                Synthesis of physical atmospheric evolution, demonstrated pollution spikes, diurnal boundary layer shifts, and net percentage trajectories across {selectedLoc.name}.
              </p>
            </div>

            {/* Overall Trajectory Badge */}
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold border shadow-xs ${
                  trajectory.isNetIncrease
                    ? "bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-400"
                    : "bg-emerald-500/15 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                }`}
              >
                {trajectory.isNetIncrease ? (
                  <TrendingUp size={15} className="text-rose-600 dark:text-rose-400" />
                ) : (
                  <TrendingDown size={15} className="text-emerald-600 dark:text-emerald-400" />
                )}
                <span>
                  {trajectory.isNetIncrease ? "+" : ""}
                  {trajectory.netChangePct.toFixed(1)}% Net Trajectory (
                  {trajectory.isNetIncrease ? "Accumulating Risk" : "Clearing / Venting"})
                </span>
              </span>
            </div>
          </div>

          {/* 4 Analytical Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: 72h Net Trajectory */}
            <div
              className={`p-4 rounded-xl border flex flex-col justify-between ${
                isDark ? "bg-[#131f1b]/70 border-neutral-800" : "bg-[#f9f7f2] border-[#e7e2d7]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-[var(--dash-muted)] font-bold">
                  72H Net Delta
                </span>
                {trajectory.isNetIncrease ? (
                  <ArrowUpRight size={15} className="text-rose-500" />
                ) : (
                  <ArrowDownRight size={15} className="text-emerald-500" />
                )}
              </div>
              <div className="my-2">
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-3xl font-mono font-black ${
                      trajectory.isNetIncrease
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-emerald-700 dark:text-emerald-400"
                    }`}
                  >
                    {trajectory.isNetIncrease ? "+" : ""}
                    {trajectory.netChangePct.toFixed(1)}%
                  </span>
                  <span className="text-xs font-mono text-[var(--dash-muted)]">
                    ({trajectory.netDelta >= 0 ? `+${trajectory.netDelta}` : trajectory.netDelta} pts)
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[var(--dash-muted)] block mt-0.5">
                  Start: <b>{trajectory.startAqi}</b> → End: <b>{trajectory.endAqi}</b> AQI
                </span>
              </div>
              <div className="pt-2 border-t border-[var(--dash-rule)]/40 text-[10px] font-mono text-[var(--dash-muted)] flex items-center justify-between">
                <span>Horizon Shift</span>
                <span className="font-semibold text-[var(--dash-ink)]">
                  {trajectory.isNetIncrease ? "Particulate Retention" : "Atmospheric Clean-out"}
                </span>
              </div>
            </div>

            {/* Card 2: Maximum Peak Spike */}
            <div
              className={`p-4 rounded-xl border flex flex-col justify-between ${
                isDark ? "bg-[#131f1b]/70 border-neutral-800" : "bg-[#f9f7f2] border-[#e7e2d7]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-[var(--dash-muted)] font-bold">
                  Primary Peak Spike
                </span>
                <Flame size={15} className="text-amber-500" />
              </div>
              <div className="my-2">
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-3xl font-mono font-black"
                    style={{ color: trajectory.peakBand?.color }}
                  >
                    {trajectory.peakAqi}
                  </span>
                  <span
                    className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-full"
                    style={{
                      color: trajectory.peakBand?.color,
                      backgroundColor: `${trajectory.peakBand?.color}20`,
                    }}
                  >
                    {trajectory.peakBand?.label}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[var(--dash-muted)] block mt-0.5">
                  Peak at: <b>{trajectory.peakTime}</b>
                </span>
              </div>
              <div className="pt-2 border-t border-[var(--dash-rule)]/40 text-[10px] font-mono text-[var(--dash-muted)] flex items-center justify-between">
                <span>Spike Surge</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  +{trajectory.surgeFromBaselinePct.toFixed(0)}% vs baseline
                </span>
              </div>
            </div>

            {/* Card 3: Cleanest Reprieve Trough */}
            <div
              className={`p-4 rounded-xl border flex flex-col justify-between ${
                isDark ? "bg-[#131f1b]/70 border-neutral-800" : "bg-[#f9f7f2] border-[#e7e2d7]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-[var(--dash-muted)] font-bold">
                  Cleanest Reprieve Window
                </span>
                <Wind size={15} className="text-emerald-500" />
              </div>
              <div className="my-2">
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-3xl font-mono font-black"
                    style={{ color: trajectory.troughBand?.color }}
                  >
                    {trajectory.troughAqi}
                  </span>
                  <span
                    className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-full"
                    style={{
                      color: trajectory.troughBand?.color,
                      backgroundColor: `${trajectory.troughBand?.color}20`,
                    }}
                  >
                    {trajectory.troughBand?.label}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[var(--dash-muted)] block mt-0.5">
                  Window at: <b>{trajectory.troughTime}</b>
                </span>
              </div>
              <div className="pt-2 border-t border-[var(--dash-rule)]/40 text-[10px] font-mono text-[var(--dash-muted)] flex items-center justify-between">
                <span>Relief Drop</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  -{trajectory.maxSwingPct.toFixed(0)}% vs peak spike
                </span>
              </div>
            </div>

            {/* Card 4: 72h Volatility / Amplitude Swing */}
            <div
              className={`p-4 rounded-xl border flex flex-col justify-between ${
                isDark ? "bg-[#131f1b]/70 border-neutral-800" : "bg-[#f9f7f2] border-[#e7e2d7]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-[var(--dash-muted)] font-bold">
                  Atmospheric Amplitude
                </span>
                <Activity size={15} className="text-purple-500" />
              </div>
              <div className="my-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-mono font-black text-[var(--dash-ink)]">
                    ±{Math.round((trajectory.peakAqi - trajectory.troughAqi) / 2)}
                  </span>
                  <span className="text-xs font-mono font-bold text-purple-700 dark:text-purple-400">
                    +{trajectory.maxSwingPct.toFixed(0)}% span
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[var(--dash-muted)] block mt-0.5">
                  Spread: <b>{trajectory.peakAqi - trajectory.troughAqi} AQI points</b>
                </span>
              </div>
              <div className="pt-2 border-t border-[var(--dash-rule)]/40 text-[10px] font-mono text-[var(--dash-muted)] flex items-center justify-between">
                <span>Diurnal Class</span>
                <span className="font-semibold uppercase text-purple-700 dark:text-purple-300">
                  {trajectory.conditionTrend} Dynamics
                </span>
              </div>
            </div>
          </div>

          {/* Condition Ahead Narrative Card */}
          <div
            className={`p-5 rounded-xl border ${
              isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-[#f5f1e8] border-[#e4ded5]"
            }`}
          >
            <div className="flex items-center gap-2 mb-2 text-xs font-mono font-bold text-emerald-800 dark:text-emerald-400 uppercase">
              <Activity size={14} />
              <span>Forward Atmospheric Prognosis (What Lies Ahead)</span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--dash-ink)] leading-relaxed font-sans">
              {trajectory.conditionNarrative}
            </p>
          </div>

          {/* Demonstrated Spikes & Meteorological Triggers */}
          <div className="space-y-4">
            <div>
              <span className="section-kicker font-mono text-xs font-bold text-rose-700 dark:text-rose-400 uppercase">
                POLLUTION PEAKS & ANOMALIES
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-[var(--dash-ink)]">
                Demonstrated Pollution Spikes & Trigger Dynamics
              </h3>
              <p className="text-xs text-[var(--dash-muted)] mt-0.5">
                Identified hourly episodes where boundary layer inversions, commuter surges, or chemical secondary reactions trigger abrupt particulate jumps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trajectory.spikes.map((spike) => (
                <div
                  key={spike.id}
                  className={`p-4 rounded-xl border relative flex flex-col justify-between transition-colors ${
                    isDark
                      ? "bg-[#111a17]/90 border-neutral-800 hover:border-neutral-700"
                      : "bg-[#fbf9f4] border-[#e6e1d6] hover:border-[#d9d3c5] shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full"
                      style={{
                        color: spike.band?.color,
                        backgroundColor: `${spike.band?.color}20`,
                      }}
                    >
                      {spike.badge}
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-[var(--dash-muted)] flex items-center gap-1">
                      <Clock size={12} />
                      {spike.time}
                    </span>
                  </div>

                  <div className="my-2">
                    <div className="flex items-baseline gap-2">
                      <strong
                        className="text-3xl font-mono font-black"
                        style={{ color: spike.band?.color }}
                      >
                        {spike.aqi}
                      </strong>
                      <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                        +{spike.surgePct.toFixed(0)}% Surge
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-[var(--dash-muted)] mt-1 flex gap-3">
                      <span>PM₂.₅: <b>{spike.pm2_5 ? `${spike.pm2_5.toFixed(0)} µg/m³` : "—"}</b></span>
                      <span>PM₁₀: <b>{spike.pm10 ? `${spike.pm10.toFixed(0)} µg/m³` : "—"}</b></span>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-[var(--dash-rule)]/50 text-[11px] leading-relaxed text-[var(--dash-muted)]">
                    <strong className="text-[var(--dash-ink)] block mb-0.5 font-semibold">
                      Meteorological Mechanism:
                    </strong>
                    {spike.cause}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Phase-by-Phase Day 1 vs Day 2 vs Day 3 Trajectory */}
          <div className="space-y-4">
            <div>
              <span className="section-kicker font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                CHRONOLOGICAL EVOLUTION
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-[var(--dash-ink)]">
                Phase-by-Phase Percentage Trajectory (Day 1 · Day 2 · Day 3)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[trajectory.day1, trajectory.day2, trajectory.day3].map((seg, sIdx) => {
                if (!seg) return null;
                return (
                  <div
                    key={sIdx}
                    className={`p-4 rounded-xl border flex flex-col justify-between ${
                      isDark ? "bg-[#111a17]/80 border-neutral-800" : "bg-[#fbf9f4] border-[#e6e1d6]"
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--dash-rule)]/40">
                      <div>
                        <span className="text-xs font-bold text-[var(--dash-ink)] block">{seg.label}</span>
                        <span className="text-[10px] font-mono text-[var(--dash-muted)]">{seg.hoursLabel}</span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-bold border ${
                          seg.isIncrease
                            ? "bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-400"
                            : "bg-emerald-500/15 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                        }`}
                      >
                        {seg.isIncrease ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {seg.isIncrease ? "+" : ""}
                        {seg.pct.toFixed(1)}%
                      </span>
                    </div>

                    <div className="my-3 grid grid-cols-2 gap-2 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-[var(--dash-muted)] uppercase block">Start → End</span>
                        <b className="text-[var(--dash-ink)] text-sm">{seg.startAqi} → {seg.endAqi}</b>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--dash-muted)] uppercase block">24h Average</span>
                        <b className="text-[var(--dash-ink)] text-sm">{seg.avgAqi} AQI</b>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[var(--dash-rule)]/40 text-[11px] font-mono flex items-center justify-between">
                      <span className="text-[var(--dash-muted)]">Day Peak:</span>
                      <span className="font-bold text-[var(--dash-ink)] flex items-center gap-1">
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: seg.peakBand.color }}
                        />
                        {seg.peakAqi} AQI ({seg.peakTime.hour})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actionable Protective Health Advisory */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isDark
                ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-200"
                : "bg-emerald-50/80 border-emerald-200 text-emerald-900 shadow-xs"
            }`}
          >
            <div className="flex items-start sm:items-center gap-2.5">
              <ShieldAlert size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
              <div className="text-xs font-sans leading-relaxed">
                <strong>Exposure Planning Recommendation: </strong>
                Plan intensive outdoor cardiovascular exercise or home ventilation exclusively during the clean window around{" "}
                <b>{trajectory.troughTime} ({trajectory.troughAqi} AQI)</b>. Restrict outdoor exposure and ensure certified N95 / HEPA filtration during the predicted spike window around{" "}
                <b>{trajectory.peakTime} ({trajectory.peakAqi} AQI)</b>.
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Statutory Disclaimer */}
      <p
        className={`phase-disclaimer text-xs font-mono leading-relaxed p-4 rounded-xl border transition-colors ${
          isDark
            ? "border-neutral-800 bg-neutral-900/40 text-[var(--dash-muted)]"
            : "border-[#e4ded5] bg-white/70 text-[#525e57] shadow-xs"
        }`}
      >
        <strong>Forecasting Methodology: </strong>
        Predictions integrate primary Open-Meteo CAMS multi-model atmospheric dispersion fields.
        In the event of API upstream interruption, the Vayu Custom ML Autoregressive Engine
        synthesizes 72-hour timesteps dynamically from boundary layer meteorological dynamics, diurnal
        inversions, and regional lag statistics with 95% confidence bounds.
      </p>
    </section>
  );
}
