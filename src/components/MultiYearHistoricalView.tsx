"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Dot,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Globe,
  Building2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  Compass,
} from "lucide-react";
import type { HistoricalCityRecord, HistoricalCountryRecord } from "@/app/api/historical-rankings/route";
import { CONTINENTS, Continent, getContinentForCountry } from "@/lib/continents";
import { CPCB_AQI_CATEGORIES, getCpcbCategory } from "@/lib/aqi-conversion";

export type MultiYearViewMode = "city" | "country";
export type MetricType = "pm25" | "aqi";

interface MultiYearHistoricalViewProps {
  initialType?: MultiYearViewMode;
  onContinentChange?: (continent: Continent) => void;
  onMetricChange?: (metric: MetricType) => void;
}

export interface WhoCategory {
  min: number;
  max: number;
  label: string;
  sublabel: string;
  bg: string;
  text: string;
}

export const WHO_CATEGORIES: WhoCategory[] = [
  { min: 0, max: 5.0, label: "0–5", sublabel: "Meets WHO guideline", bg: "#00A3A6", text: "#ffffff" },
  { min: 5.1, max: 10.0, label: "5.1–10", sublabel: "Exceeds by 1 to 2x", bg: "#72BF44", text: "#0d2605" },
  { min: 10.1, max: 15.0, label: "10.1–15", sublabel: "Exceeds by 2 to 3x", bg: "#FFC20E", text: "#332400" },
  { min: 15.1, max: 25.0, label: "15.1–25", sublabel: "Exceeds by 3 to 5x", bg: "#F37023", text: "#ffffff" },
  { min: 25.1, max: 35.0, label: "25.1–35", sublabel: "Exceeds by 5 to 7x", bg: "#EE4036", text: "#ffffff" },
  { min: 35.1, max: 50.0, label: "35.1–50", sublabel: "Exceeds by 7 to 10x", bg: "#92278F", text: "#ffffff" },
  { min: 50.1, max: 9999, label: ">50.1", sublabel: "Exceeds by over 10x", bg: "#80243B", text: "#ffffff" },
];

export function getWhoCategory(val: number | null): WhoCategory | null {
  if (val === null || val === undefined || isNaN(val)) return null;
  for (const cat of WHO_CATEGORIES) {
    if (val <= cat.max) return cat;
  }
  return WHO_CATEGORIES[WHO_CATEGORIES.length - 1];
}

const COUNTRY_FLAGS: Record<string, string> = {
  India: "🇮🇳",
  China: "🇨🇳",
  Pakistan: "🇵🇰",
  Bangladesh: "🇧🇩",
  Tajikistan: "🇹🇯",
  Chad: "🇹🇩",
  "Democratic Republic of the Congo": "🇨🇩",
  Kuwait: "🇰🇼",
  Uganda: "🇺🇬",
  Egypt: "🇪🇬",
  Uzbekistan: "🇺🇿",
  Iraq: "🇮🇶",
  Nepal: "🇳🇵",
  "United Arab Emirates": "🇦🇪",
  Bahrain: "🇧🇭",
  Indonesia: "🇮🇩",
  Nigeria: "🇳🇬",
  "Saudi Arabia": "🇸🇦",
  Iran: "🇮🇷",
  Vietnam: "🇻🇳",
  Thailand: "🇹🇭",
  "United States": "🇺🇸",
  USA: "🇺🇸",
  "United Kingdom": "🇬🇧",
  UK: "🇬🇧",
  Canada: "🇨🇦",
  Australia: "🇦🇺",
  Germany: "🇩🇪",
  France: "🇫🇷",
  Italy: "🇮🇹",
  Spain: "🇪🇸",
  Japan: "🇯🇵",
  "South Korea": "🇰🇷",
  Russia: "🇷🇺",
  Brazil: "🇧🇷",
  Mexico: "🇲🇽",
  "South Africa": "🇿🇦",
  Turkey: "🇹🇷",
  Poland: "🇵🇱",
  Ukraine: "🇺🇦",
  Kazakhstan: "🇰🇿",
  Kyrgyzstan: "🇰🇬",
  Mongolia: "🇲🇳",
  Myanmar: "🇲🇲",
  Laos: "🇱🇦",
  Cambodia: "🇰🇭",
  Philippines: "🇵🇭",
  Malaysia: "🇲🇾",
  Singapore: "🇸🇬",
  "Sri Lanka": "🇱🇰",
  Peru: "🇵🇪",
  Chile: "🇨🇱",
  Colombia: "🇨🇴",
  Argentina: "🇦🇷",
  Qatar: "🇶🇦",
  Oman: "🇴🇲",
  Jordan: "🇯🇴",
  Lebanon: "🇱🇧",
  Israel: "🇮🇱",
  Switzerland: "🇨🇭",
  Sweden: "🇸🇪",
  Norway: "🇳🇴",
  Finland: "🇫🇮",
  Iceland: "🇮🇸",
  "New Zealand": "🇳🇿",
};

export function getCountryFlag(country: string): string {
  if (!country) return "🌐";
  return COUNTRY_FLAGS[country] || "🌐";
}

export function MultiYearHistoricalView({
  initialType = "city",
  onContinentChange,
  onMetricChange,
}: MultiYearHistoricalViewProps) {
  const [type, setType] = useState<MultiYearViewMode>(initialType);
  const [search, setSearch] = useState("");
  const [continentFilter, setContinentFilter] = useState<Continent>("All");
  const [countryFilter, setCountryFilter] = useState("All");
  const [metric, setMetric] = useState<MetricType>("aqi");
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cityData, setCityData] = useState<HistoricalCityRecord[]>([]);
  const [countryData, setCountryData] = useState<HistoricalCountryRecord[]>([]);
  const [countriesList, setCountriesList] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Sync initialType when parent toggle switches
  useEffect(() => {
    setType(initialType);
    setPage(1);
    setExpandedId(null);
  }, [initialType]);

  // Notify parent of filter updates if callback provided
  const handleContinentSelect = (c: Continent) => {
    setContinentFilter(c);
    setCountryFilter("All");
    setPage(1);
    if (onContinentChange) onContinentChange(c);
  };

  const handleMetricSelect = (m: MetricType) => {
    setMetric(m);
    setPage(1);
    if (onMetricChange) onMetricChange(m);
  };

  // Fetch data
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      type,
      metric,
      page: String(page),
      limit: String(limit),
    });

    if (search.trim()) params.set("search", search.trim());
    if (continentFilter && continentFilter !== "All") {
      params.set("continent", continentFilter);
    }
    if (type === "city" && countryFilter && countryFilter !== "All") {
      params.set("country", countryFilter);
    }

    fetch(`/api/historical-rankings?${params.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load historical rankings");
        return res.json();
      })
      .then((json) => {
        if (controller.signal.aborted) return;
        if (type === "city") {
          setCityData(json.data || []);
          if (json.countries?.length) setCountriesList(json.countries);
        } else {
          setCountryData(json.data || []);
        }
        setTotalCount(json.total || 0);
        setTotalPages(json.totalPages || 1);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Error fetching rankings");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [type, search, continentFilter, countryFilter, metric, page, limit]);

  // Filter country list by selected continent
  const availableCountries = useMemo(() => {
    if (continentFilter === "All") return countriesList;
    return countriesList.filter((c) => getContinentForCountry(c) === continentFilter);
  }, [countriesList, continentFilter]);

  const handleRowClick = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const yearsCity = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017];
  const yearsCountry = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018];
  const yearsAqi = [2025, 2024, 2023, 2022, 2021];
  const currentYears = metric === "aqi" ? yearsAqi : (type === "city" ? yearsCity : yearsCountry);

  return (
    <div className="w-full mt-6 space-y-6">
      {/* Header Description & Source Badge */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[var(--dash-rule)]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] tracking-widest font-mono uppercase text-[var(--dash-muted)]">
              IQAir Global Surveillance · Multi-Year Historical Archive
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-serif text-[var(--dash-ink)]">
            {type === "city"
              ? "World's Most Polluted Cities"
              : "Global Country Rankings & WHO Benchmark Matrix"}
          </h2>
          <p className="text-xs md:text-sm text-[var(--dash-muted)] mt-1 max-w-3xl">
            {metric === "aqi"
              ? "Annual air quality evaluated on the statutory CPCB / Indian NAQI scale (0–500). Displays categorized severity bands from Good to Severe."
              : "Annual PM2.5 concentrations for 9,300+ global monitoring airsheds. Color-coded according to official World Health Organization safe guidelines (5 µg/m³)."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <span className="px-3 py-1 rounded-full text-[10px] font-mono border border-[var(--dash-rule)] bg-[var(--dash-surface)] text-[var(--dash-muted)]">
            {totalCount.toLocaleString()} {type === "city" ? "CITIES" : "COUNTRIES"} INDEXED
          </span>
          <span className="px-3 py-1 rounded-full text-[10px] font-mono font-semibold border border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            {metric === "aqi" ? "CPCB NAQI SCALE" : "WHO PM2.5 STANDARD"}
          </span>
        </div>
      </div>

      {/* Responsive Filter and Search Bar: 1-col on mobile, 2-col on tablet, 4-col on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[var(--dash-surface)] p-3.5 rounded-xl border border-[var(--dash-rule)] shadow-sm">
        {/* 1. Search Input */}
        <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--dash-muted)] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={
              type === "city"
                ? "Search city, e.g., Delhi, Loni, Mumbai..."
                : "Search country, e.g., India, Pakistan, Chad..."
            }
            className="w-full pl-9 pr-3 py-2 text-xs md:text-sm rounded-lg bg-[var(--dash-bg)] border border-[var(--dash-rule)] text-[var(--dash-ink)] placeholder-[var(--dash-muted)] focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* 2. Continent Filter Dropdown */}
        <div className="relative col-span-1">
          <Compass className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--dash-muted)] pointer-events-none" />
          <select
            value={continentFilter}
            onChange={(e) => handleContinentSelect(e.target.value as Continent)}
            aria-label="Filter by continent"
            className="w-full pl-8 pr-7 py-2 text-xs md:text-sm rounded-lg bg-[var(--dash-bg)] border border-[var(--dash-rule)] text-[var(--dash-ink)] appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
          >
            {CONTINENTS.map((c) => (
              <option key={c} value={c}>
                {c === "All" ? "All Continents" : c}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--dash-muted)] pointer-events-none" />
        </div>

        {/* 3. Country Filter Dropdown (in city view) */}
        {type === "city" ? (
          <div className="relative col-span-1">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--dash-muted)] pointer-events-none" />
            <select
              value={countryFilter}
              onChange={(e) => {
                setCountryFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by country"
              className="w-full pl-8 pr-7 py-2 text-xs md:text-sm rounded-lg bg-[var(--dash-bg)] border border-[var(--dash-rule)] text-[var(--dash-ink)] appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
            >
              <option value="All">All Countries / Regions</option>
              {availableCountries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--dash-muted)] pointer-events-none" />
          </div>
        ) : (
          <div className="hidden lg:block col-span-1" />
        )}

        {/* 4. Metric Switcher Dropdown */}
        <div className="relative col-span-1">
          <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--dash-muted)] pointer-events-none" />
          <select
            value={metric}
            onChange={(e) => handleMetricSelect(e.target.value as MetricType)}
            aria-label="Metric display switcher"
            className="w-full pl-8 pr-7 py-2 text-xs md:text-sm font-semibold rounded-lg bg-[var(--dash-bg)] border border-emerald-600/30 text-emerald-800 dark:text-emerald-300 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="aqi">AQI (IN) (CPCB 0–500)</option>
            <option value="pm25">PM2.5 (WHO µg/m³)</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--dash-muted)] pointer-events-none" />
        </div>
      </div>

      {/* Active Filter Summary Bar with Reset Action */}
      {(search || continentFilter !== "All" || countryFilter !== "All" || metric !== "pm25") && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[var(--dash-muted)] px-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span>Filtered by:</span>
            {continentFilter !== "All" && (
              <span className="px-2 py-0.5 rounded bg-[var(--dash-bg)] border border-[var(--dash-rule)] text-[var(--dash-ink)]">
                Continent: {continentFilter}
              </span>
            )}
            {countryFilter !== "All" && (
              <span className="px-2 py-0.5 rounded bg-[var(--dash-bg)] border border-[var(--dash-rule)] text-[var(--dash-ink)]">
                Country: {countryFilter}
              </span>
            )}
            {search && (
              <span className="px-2 py-0.5 rounded bg-[var(--dash-bg)] border border-[var(--dash-rule)] text-[var(--dash-ink)]">
                Query: "{search}"
              </span>
            )}
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold">
              {metric === "aqi" ? "Metric: AQI (IN)" : "Metric: PM2.5"}
            </span>
          </div>

          <button
            onClick={() => {
              setSearch("");
              setContinentFilter("All");
              setCountryFilter("All");
              setMetric("pm25");
              setPage(1);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono text-[var(--dash-muted)] hover:text-[var(--dash-ink)] hover:bg-[var(--dash-bg)] border border-[var(--dash-rule)] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset all
          </button>
        </div>
      )}

      {/* Dynamic Metric Benchmark Legend Bar */}
      <div className="bg-[var(--dash-surface)] p-3.5 rounded-xl border border-[var(--dash-rule)] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono tracking-wider uppercase text-[var(--dash-muted)]">
            {metric === "aqi"
              ? "Indian Statutory NAQI Legend (CPCB 0–500 Standard)"
              : "PM2.5 Legend (Annual Concentration in µg/m³ categorized by WHO Guideline)"}
          </span>
          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
            {metric === "aqi" ? "Target: ≤ 50 (Good)" : "Target: ≤ 5.0 µg/m³"}
          </span>
        </div>
        <div
          className={`grid gap-1.5 pt-1 ${
            metric === "aqi" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6" : "grid-cols-2 sm:grid-cols-4 lg:grid-cols-7"
          }`}
        >
          {metric === "aqi"
            ? CPCB_AQI_CATEGORIES.map((cat) => (
                <div
                  key={cat.label}
                  className="flex flex-col justify-center px-2.5 py-1.5 rounded-md text-center shadow-xs transition-transform hover:scale-[1.02]"
                  style={{ backgroundColor: cat.bg, color: cat.text }}
                >
                  <span className="text-xs font-bold tracking-tight font-mono">{cat.label}</span>
                  <span className="text-[9.5px] opacity-90 leading-tight truncate font-sans">{cat.sublabel}</span>
                </div>
              ))
            : WHO_CATEGORIES.map((cat) => (
                <div
                  key={cat.label}
                  className="flex flex-col justify-center px-2.5 py-1.5 rounded-md text-center shadow-xs transition-transform hover:scale-[1.02]"
                  style={{ backgroundColor: cat.bg, color: cat.text }}
                >
                  <span className="text-xs font-bold tracking-tight font-mono">{cat.label}</span>
                  <span className="text-[9.5px] opacity-90 leading-tight truncate">{cat.sublabel}</span>
                </div>
              ))}
        </div>
      </div>

      {/* Main Matrix Table with Mobile Responsiveness Overhaul */}
      <div className="overflow-hidden rounded-xl border border-[var(--dash-rule)] bg-[var(--dash-surface)] shadow-xs">
        <div className="overflow-x-auto w-full no-scrollbar relative">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--dash-rule)] bg-[var(--dash-bg)]/80 text-[10px] font-mono uppercase tracking-wider text-[var(--dash-muted)]">
                {/* Sticky Left Column 1: Rank */}
                <th className="py-3 px-3 w-12 text-center sticky left-0 z-20 bg-[var(--dash-surface)] border-r border-[var(--dash-rule)]/40 shadow-xs">
                  Rank
                </th>

                {/* Sticky Left Column 2: City / Country */}
                <th className="py-3 px-4 min-w-[170px] sm:min-w-[210px] sticky left-12 z-20 bg-[var(--dash-surface)] border-r border-[var(--dash-rule)]/40 shadow-xs">
                  {type === "city" ? "City / Region" : "Country / Region"}
                </th>

                {type === "country" && (
                  <th className="py-3 px-3 min-w-[85px] text-right hidden sm:table-cell">
                    Population
                  </th>
                )}

                {/* Latest Year (2025) is always visible on all devices */}
                <th className="py-3 px-3 text-center min-w-[70px] font-bold text-[var(--dash-ink)] bg-emerald-500/5">
                  2025
                </th>

                {/* Earlier years (2024..2017) collapsed on small mobile (<768px), visible on md+ */}
                {currentYears.slice(1).map((yr) => (
                  <th
                    key={yr}
                    className="py-3 px-3 text-center min-w-[65px] hidden md:table-cell"
                  >
                    {yr}
                  </th>
                ))}

                {/* Trend Action Column */}
                <th className="py-3 px-3 w-16 text-center font-bold text-[var(--dash-ink)]">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--dash-rule)]/60">
              {loading ? (
                <tr>
                  <td
                    colSpan={12}
                    className="py-16 text-center text-sm font-mono text-[var(--dash-muted)]"
                  >
                    <div className="inline-flex items-center gap-3">
                      <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      Loading multi-year historical matrix...
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={12}
                    className="py-12 text-center text-sm font-mono text-red-500"
                  >
                    <div className="inline-flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      {error}
                    </div>
                  </td>
                </tr>
              ) : (type === "city" ? cityData : countryData).length === 0 ? (
                <tr>
                  <td
                    colSpan={12}
                    className="py-12 text-center text-sm font-mono text-[var(--dash-muted)]"
                  >
                    No matching records found for "{search}".
                  </td>
                </tr>
              ) : (
                (type === "city" ? cityData : countryData).map((item) => {
                  const id =
                    type === "city"
                      ? `${(item as HistoricalCityRecord).rank}-${(item as HistoricalCityRecord).fullName}`
                      : `${(item as HistoricalCountryRecord).rank}-${(item as HistoricalCountryRecord).country}`;
                  const isExpanded = expandedId === id;

                  const countryName =
                    type === "city"
                      ? (item as HistoricalCityRecord).country
                      : (item as HistoricalCountryRecord).country;
                  const flag = getCountryFlag(countryName);

                  return (
                    <MatrixRowItem
                      key={id}
                      item={item}
                      type={type}
                      metric={metric}
                      flag={flag}
                      years={currentYears}
                      isExpanded={isExpanded}
                      onClick={() => handleRowClick(id)}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-[var(--dash-bg)]/60 border-t border-[var(--dash-rule)] text-xs text-[var(--dash-muted)]">
          <div className="font-mono text-[11px]">
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, totalCount)} of{" "}
            <span className="font-semibold text-[var(--dash-ink)]">
              {totalCount.toLocaleString()}
            </span>{" "}
            {type === "city" ? "monitored cities" : "countries"}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 rounded-lg border border-[var(--dash-rule)] bg-[var(--dash-surface)] text-[var(--dash-ink)] font-mono text-xs disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--dash-bg)] transition-colors cursor-pointer"
            >
              Prev
            </button>
            <span className="px-2 font-mono text-[11px]">
              {page} / {Math.max(1, totalPages)}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 rounded-lg border border-[var(--dash-rule)] bg-[var(--dash-surface)] text-[var(--dash-ink)] font-mono text-xs disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--dash-bg)] transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Individual Row with Expandable Inline Trajectory and Mobile Breakdown
function MatrixRowItem({
  item,
  type,
  metric,
  flag,
  years,
  isExpanded,
  onClick,
}: {
  item: HistoricalCityRecord | HistoricalCountryRecord;
  type: MultiYearViewMode;
  metric: MetricType;
  flag: string;
  years: number[];
  isExpanded: boolean;
  onClick: () => void;
}) {
  const isCity = type === "city";
  const cityItem = item as HistoricalCityRecord;
  const countryItem = item as HistoricalCountryRecord;

  // Prepare chart series: chronological
  const chartSeries = useMemo(() => {
    const list: { year: string; value: number | null; label: string }[] = [];
    const reversedYears = [...years].reverse();
    for (const yr of reversedYears) {
      let val: number | null = null;
      if (metric === "aqi") {
        val = (item as any)[`aqi_${yr}`] ?? null;
      } else {
        val = (item as any)[`pm25_${yr}`] ?? null;
      }

      list.push({
        year: String(yr),
        value: typeof val === "number" ? val : null,
        label: `${yr}: ${val !== null ? `${metric === "aqi" ? Math.round(val) : `${val} µg/m³`}` : "No data"}`,
      });
    }
    return list;
  }, [item, years, metric]);

  const validPoints = chartSeries.filter((p) => p.value !== null && !isNaN(p.value));
  const latestVal = metric === "aqi" ? item.aqi_2025 : item.pm25_2025;
  const earliestVal = validPoints.length > 0 ? validPoints[0].value : null;
  const whoMultiplier =
    metric === "pm25" && item.pm25_2025 ? (item.pm25_2025 / 5.0).toFixed(1) : null;
  const totalChangePercent =
    latestVal && earliestVal
      ? (((latestVal - earliestVal) / earliestVal) * 100).toFixed(1)
      : null;

  return (
    <>
      <tr
        onClick={onClick}
        className={`cursor-pointer transition-colors hover:bg-[var(--dash-bg)]/70 ${
          isExpanded ? "bg-[var(--dash-bg)] font-medium" : ""
        }`}
      >
        {/* Sticky Left 1: Rank */}
        <td className="py-3 px-3 font-mono text-[11px] text-center text-[var(--dash-muted)] sticky left-0 z-10 bg-[var(--dash-surface)] border-r border-[var(--dash-rule)]/40">
          {item.rank}
        </td>

        {/* Sticky Left 2: City or Country Name */}
        <td className="py-3 px-4 sticky left-12 z-10 bg-[var(--dash-surface)] border-r border-[var(--dash-rule)]/40 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-base select-none">{flag}</span>
            <div className="leading-tight">
              <span className="font-semibold text-xs text-[var(--dash-ink)]">
                {isCity ? cityItem.city : countryItem.country}
              </span>
              {isCity && cityItem.country && (
                <span className="block text-[10px] text-[var(--dash-muted)] font-mono">
                  {cityItem.country}
                </span>
              )}
            </div>
          </div>
        </td>

        {/* Population (Country view only) */}
        {!isCity && (
          <td className="py-3 px-3 text-right font-mono text-[11px] text-[var(--dash-muted)] hidden sm:table-cell">
            {countryItem.population ? countryItem.population.toLocaleString() : "—"}
          </td>
        )}

        {/* Latest Year (2025) - ALWAYS VISIBLE */}
        {(() => {
          const val = metric === "aqi" ? item.aqi_2025 : item.pm25_2025;
          const cat =
            metric === "aqi" ? getCpcbCategory(val ?? null) : getWhoCategory(val ?? null);

          return (
            <td className="py-2 px-2 text-center bg-emerald-500/5 font-semibold">
              {val !== null && val !== undefined && cat ? (
                <span
                  className="inline-block min-w-[46px] px-2 py-0.5 rounded-full text-[11px] font-mono font-medium shadow-2xs"
                  style={{
                    backgroundColor: cat.bg,
                    color: cat.text,
                  }}
                  title={`2025: ${metric === "aqi" ? Math.round(val) : `${val} µg/m³`} (${cat.sublabel})`}
                >
                  {metric === "aqi" ? Math.round(val) : val.toFixed(1)}
                </span>
              ) : (
                <span className="text-[11px] font-mono text-[var(--dash-muted)] opacity-40">
                  --
                </span>
              )}
            </td>
          );
        })()}

        {/* Earlier Years (2024..2017) - COLLAPSED ON MOBILE (<768px), VISIBLE ON MD+ */}
        {years.slice(1).map((yr) => {
          const val =
            metric === "aqi"
              ? ((item as any)[`aqi_${yr}`] as number | null)
              : ((item as any)[`pm25_${yr}`] as number | null);
          const cat =
            metric === "aqi" ? getCpcbCategory(val) : getWhoCategory(val);

          return (
            <td key={yr} className="py-2 px-2 text-center hidden md:table-cell">
              {val !== null && val !== undefined && cat ? (
                <span
                  className="inline-block min-w-[44px] px-2 py-0.5 rounded-full text-[11px] font-mono font-medium shadow-2xs"
                  style={{
                    backgroundColor: cat.bg,
                    color: cat.text,
                  }}
                  title={`${yr}: ${metric === "aqi" ? Math.round(val) : `${val} µg/m³`} (${cat.sublabel})`}
                >
                  {metric === "aqi" ? Math.round(val) : val.toFixed(1)}
                </span>
              ) : (
                <span className="text-[11px] font-mono text-[var(--dash-muted)] opacity-40">
                  --
                </span>
              )}
            </td>
          );
        })}

        {/* Expand Action Button */}
        <td className="py-2.5 px-3 text-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            aria-label={isExpanded ? "Collapse trajectory chart" : "Expand trajectory chart"}
            title={isExpanded ? "Collapse trajectory chart" : "Expand multi-year trajectory"}
            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all shadow-xs border ${
              isExpanded
                ? "bg-[#0f382c] dark:bg-emerald-600 text-white border-transparent shadow-sm"
                : "bg-[var(--dash-surface-elevated)] border-[var(--dash-rule)] text-[var(--dash-ink)] hover:bg-[#0f382c]/10 dark:hover:bg-emerald-500/20 hover:text-emerald-700 dark:hover:text-emerald-300 hover:border-emerald-600/40"
            }`}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <ChevronDown className="w-4 h-4 stroke-[2.5] text-[#0f382c] dark:text-emerald-400" />
            )}
          </button>
        </td>
      </tr>

      {/* Expanded Trajectory Inspection Card & Mobile Multi-Year Breakdown */}
      {isExpanded && (
        <tr className="bg-[var(--dash-bg)]/90 border-b border-[var(--dash-rule)]">
          <td colSpan={12} className="p-3 sm:p-5">
            <div className="bg-[var(--dash-surface)] rounded-xl border border-[var(--dash-rule)] p-4 md:p-5 shadow-sm space-y-4">
              {/* Inspection Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[var(--dash-rule)] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{flag}</span>
                  <div>
                    <h4 className="text-base md:text-lg font-serif text-[var(--dash-ink)]">
                      {isCity ? cityItem.fullName : countryItem.country} Multi-Year{" "}
                      {metric === "aqi" ? "CPCB AQI Trajectory" : "PM2.5 Trajectory"}
                    </h4>
                    <span className="text-[10px] font-mono text-[var(--dash-muted)]">
                      {metric === "aqi"
                        ? "Timeline: 2021 → 2025 against the 50 AQI (Good Air Standard)"
                        : "Historical Timeline: 2017 → 2025 against the 5 µg/m³ WHO Safe Threshold"}
                    </span>
                  </div>
                </div>

                {/* Stat Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  {whoMultiplier && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                      {whoMultiplier}× Above WHO Guideline
                    </span>
                  )}
                  {metric === "aqi" && item.status_2025 && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                      Status: {item.status_2025}
                    </span>
                  )}
                  {totalChangePercent && (
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-mono flex items-center gap-1 border ${
                        parseFloat(totalChangePercent) > 0
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                      }`}
                    >
                      {parseFloat(totalChangePercent) > 0 ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}
                      {totalChangePercent}% change since {validPoints[0]?.year}
                    </span>
                  )}
                </div>
              </div>

              {/* Mobile Breakdown Grid (Displays all collapsed years on mobile viewports <768px) */}
              <div className="block md:hidden border border-[var(--dash-rule)]/60 rounded-lg p-3 bg-[var(--dash-bg)]/40">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--dash-muted)] block mb-2">
                  Multi-Year Historical Values:
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {years.map((yr) => {
                    const val =
                      metric === "aqi"
                        ? ((item as any)[`aqi_${yr}`] as number | null)
                        : ((item as any)[`pm25_${yr}`] as number | null);
                    const cat =
                      metric === "aqi" ? getCpcbCategory(val) : getWhoCategory(val);

                    return (
                      <div
                        key={yr}
                        className="flex flex-col items-center justify-center p-2 rounded border border-[var(--dash-rule)]/50 bg-[var(--dash-surface)]"
                      >
                        <span className="text-[10px] font-mono text-[var(--dash-muted)]">{yr}</span>
                        {val !== null && val !== undefined && cat ? (
                          <span
                            className="mt-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold"
                            style={{ backgroundColor: cat.bg, color: cat.text }}
                          >
                            {metric === "aqi" ? Math.round(val) : val.toFixed(1)}
                          </span>
                        ) : (
                          <span className="mt-1 text-[11px] font-mono text-[var(--dash-muted)] opacity-40">
                            --
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recharts Multi-Year Line Chart */}
              <div className="h-56 sm:h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartSeries}
                    margin={{ top: 15, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis
                      dataKey="year"
                      tick={{ fontSize: 11, fill: "var(--dash-muted)" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--dash-muted)" }}
                      tickLine={false}
                      domain={[0, "auto"]}
                      unit={metric === "aqi" ? "" : " µg"}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const data = payload[0].payload as {
                          year: string;
                          value: number | null;
                        };
                        const cat =
                          metric === "aqi"
                            ? getCpcbCategory(data.value)
                            : getWhoCategory(data.value);
                        return (
                          <div className="bg-[var(--dash-surface)] p-2.5 rounded-lg border border-[var(--dash-rule)] shadow-lg text-xs font-mono space-y-1">
                            <div className="font-bold text-[var(--dash-ink)]">Year {data.year}</div>
                            {data.value !== null ? (
                              <>
                                <div className="flex items-center gap-2">
                                  <span>Concentration:</span>
                                  <span
                                    className="px-1.5 py-0.5 rounded font-bold"
                                    style={{
                                      backgroundColor: cat?.bg,
                                      color: cat?.text,
                                    }}
                                  >
                                    {metric === "aqi"
                                      ? `${Math.round(data.value)} AQI`
                                      : `${data.value} µg/m³`}
                                  </span>
                                </div>
                                <div className="text-[10px] text-[var(--dash-muted)]">
                                  {cat?.sublabel}
                                </div>
                              </>
                            ) : (
                              <div className="text-[var(--dash-muted)]">No data recorded</div>
                            )}
                          </div>
                        );
                      }}
                    />
                    {/* Baseline Reference Line */}
                    <ReferenceLine
                      y={metric === "aqi" ? 50 : 5.0}
                      stroke={metric === "aqi" ? "#22c55e" : "#00A3A6"}
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: metric === "aqi" ? "CPCB Good (50 AQI)" : "WHO Safe Guideline (5 µg/m³)",
                        fill: metric === "aqi" ? "#22c55e" : "#00A3A6",
                        fontSize: 10,
                        position: "insideTopRight",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#0f382c"
                      strokeWidth={2.5}
                      connectNulls
                      dot={{ r: 4, fill: "#0f382c", strokeWidth: 1, stroke: "#fff" }}
                      activeDot={{ r: 6, fill: "#23835f", stroke: "#fff", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
