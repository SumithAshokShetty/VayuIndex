"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  Clock3,
  Building2,
  Globe,
  Flame,
  Wind,
  Compass,
  Sparkles,
  TrendingUp,
  TrendingDown,
  FileText,
} from "lucide-react";
import type { Location } from "@/lib/types";
import type { AirSeriesResponse } from "@/lib/phase4-types";
import { MultiYearHistoricalView } from "@/components/MultiYearHistoricalView";
import { PollutionImpactReportModal } from "@/components/PollutionImpactReportModal";

type Range = 7 | 14 | 30;
type View = "hourly" | "daily";
type SubTab = "cams" | "city_trends" | "country_rankings";

export type PollutantKey =
  | "pm2_5"
  | "pm10"
  | "nitrogen_dioxide"
  | "sulphur_dioxide"
  | "ozone"
  | "carbon_monoxide";

export interface PollutantConfig {
  key: PollutantKey;
  label: string;
  shortLabel: string;
  unit: string;
  color: string;
  cpcbThreshold?: number;
  cpcbLabel?: string;
  whoThreshold?: number;
  whoLabel?: string;
}

export const POLLUTANT_CONFIGS: PollutantConfig[] = [
  {
    key: "pm2_5",
    label: "PM₂.₅",
    shortLabel: "PM2.5",
    unit: "µg/m³",
    color: "#2f7650",
    cpcbThreshold: 60,
    cpcbLabel: "CPCB 24h: 60 µg/m³",
    whoThreshold: 15,
    whoLabel: "WHO 24h: 15 µg/m³",
  },
  {
    key: "pm10",
    label: "PM₁₀",
    shortLabel: "PM10",
    unit: "µg/m³",
    color: "#bf7955",
    cpcbThreshold: 100,
    cpcbLabel: "CPCB 24h: 100 µg/m³",
    whoThreshold: 45,
    whoLabel: "WHO 24h: 45 µg/m³",
  },
  {
    key: "nitrogen_dioxide",
    label: "NO₂",
    shortLabel: "NO2",
    unit: "µg/m³",
    color: "#3b82f6",
    cpcbThreshold: 80,
    cpcbLabel: "CPCB 24h: 80 µg/m³",
    whoThreshold: 25,
    whoLabel: "WHO 24h: 25 µg/m³",
  },
  {
    key: "sulphur_dioxide",
    label: "SO₂",
    shortLabel: "SO2",
    unit: "µg/m³",
    color: "#e11d48",
    cpcbThreshold: 80,
    cpcbLabel: "CPCB 24h: 80 µg/m³",
    whoThreshold: 40,
    whoLabel: "WHO 24h: 40 µg/m³",
  },
  {
    key: "ozone",
    label: "O₃",
    shortLabel: "O3",
    unit: "µg/m³",
    color: "#8b5cf6",
    cpcbThreshold: 100,
    cpcbLabel: "CPCB 8h: 100 µg/m³",
    whoThreshold: 100,
    whoLabel: "WHO 8h: 100 µg/m³",
  },
  {
    key: "carbon_monoxide",
    label: "CO",
    shortLabel: "CO",
    unit: "µg/m³",
    color: "#d97706",
    cpcbThreshold: 2000,
    cpcbLabel: "CPCB 8h: 2,000 µg/m³",
    whoThreshold: 4000,
    whoLabel: "WHO 24h: 4,000 µg/m³",
  },
];

type ChartPoint = {
  time: string;
  label: string;
  fullTime: string;
  pm2_5: number | null;
  pm10: number | null;
  nitrogen_dioxide: number | null;
  sulphur_dioxide: number | null;
  ozone: number | null;
  carbon_monoxide: number | null;
};

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function formatTime(value: string, view: View) {
  const date = new Date(value);
  return view === "hourly"
    ? date.toLocaleTimeString([], { hour: "numeric", hour12: true })
    : date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatPercent(value: number | null) {
  return value === null ? "—" : `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function HistoricalTracker({ location }: { location: Location }) {
  const [subTab, setSubTab] = useState<SubTab>("cams");
  const [days, setDays] = useState<Range>(14);
  const [view, setView] = useState<View>("hourly");
  const [data, setData] = useState<AirSeriesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Multi-pollutant overlay toggles
  const [activePollutants, setActivePollutants] = useState<Set<PollutantKey>>(
    new Set(["pm2_5", "pm10"])
  );

  const togglePollutant = (key: PollutantKey) => {
    setActivePollutants((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      lat: String(location.latitude),
      lng: String(location.longitude),
      days: String(days),
    });
    fetch(`/api/air-quality/history?${params}`, { signal: controller.signal })
      .then(async (response) => {
        const json = (await response.json()) as AirSeriesResponse & { error?: string };
        if (!response.ok) throw new Error(json.error ?? "Historical data is unavailable.");
        return json;
      })
      .then((json) => {
        if (!controller.signal.aborted) setData(json);
      })
      .catch((fetchError) => {
        if (!controller.signal.aborted) {
          setError(fetchError instanceof Error ? fetchError.message : "Historical data is unavailable.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [location.latitude, location.longitude, days]);

  const points = useMemo<ChartPoint[]>(() => {
    if (!data?.hourly.time) return [];
    const rows = data.hourly.time.map((time, index) => ({
      time,
      label: formatTime(time, view),
      fullTime: time,
      pm2_5: data.hourly.pm2_5?.[index] ?? null,
      pm10: data.hourly.pm10?.[index] ?? null,
      nitrogen_dioxide: data.hourly.nitrogen_dioxide?.[index] ?? null,
      sulphur_dioxide: data.hourly.sulphur_dioxide?.[index] ?? null,
      ozone: data.hourly.ozone?.[index] ?? null,
      carbon_monoxide: data.hourly.carbon_monoxide?.[index] ?? null,
    }));

    if (view === "hourly") return rows.slice(-48);

    const grouped = new Map<string, Record<PollutantKey, number[]>>();
    for (const row of rows) {
      const key = row.time.slice(0, 10);
      let group = grouped.get(key);
      if (!group) {
        group = {
          pm2_5: [],
          pm10: [],
          nitrogen_dioxide: [],
          sulphur_dioxide: [],
          ozone: [],
          carbon_monoxide: [],
        };
        grouped.set(key, group);
      }
      POLLUTANT_CONFIGS.forEach((p) => {
        const val = row[p.key];
        if (isNumber(val)) group![p.key].push(val);
      });
    }

    return [...grouped].map(([date, group]) => {
      const point: any = { time: date, label: formatTime(date, "daily"), fullTime: date };
      POLLUTANT_CONFIGS.forEach((p) => {
        point[p.key] = group[p.key].length
          ? group[p.key].reduce((a, b) => a + b, 0) / group[p.key].length
          : null;
      });
      return point as ChartPoint;
    });
  }, [data, view]);

  const stats = useMemo(() => {
    const calculate = (key: "pm2_5" | "pm10") => {
      const values = points.map((point) => point[key]).filter(isNumber);
      if (values.length < 2) return { latest: values.at(-1) ?? null, change: null };
      const current = values.at(-1)!;
      const baselineValues =
        view === "hourly"
          ? values.slice(Math.max(0, values.length - 25), -1)
          : values.slice(0, -1);
      const baseline = baselineValues.length
        ? baselineValues.reduce((sum, value) => sum + value, 0) / baselineValues.length
        : null;
      return {
        latest: current,
        change: baseline && baseline > 0 ? ((current - baseline) / baseline) * 100 : null,
      };
    };
    return { pm2_5: calculate("pm2_5"), pm10: calculate("pm10") };
  }, [points, view]);

  // Peak Exposure Time Window Calculation (Over active 48h timeframe)
  const peakWindow = useMemo(() => {
    if (points.length < 4) return null;
    let maxAvg = -Infinity;
    let bestStart = 0;
    const windowSize = Math.min(4, Math.floor(points.length / 2));

    for (let i = 0; i <= points.length - windowSize; i++) {
      let sum = 0;
      let count = 0;
      for (let j = 0; j < windowSize; j++) {
        const val = points[i + j].pm2_5 ?? points[i + j].pm10;
        if (isNumber(val)) {
          sum += val;
          count++;
        }
      }
      if (count > 0) {
        const avg = sum / count;
        if (avg > maxAvg) {
          maxAvg = avg;
          bestStart = i;
        }
      }
    }

    const startPoint = points[bestStart];
    const endPoint = points[bestStart + windowSize - 1];
    if (!startPoint || !endPoint) return null;

    const startDate = new Date(startPoint.time);
    const endDate = new Date(endPoint.time);

    const startLabel = startDate.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const endLabel = endDate.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return {
      startTime: startPoint.time,
      endTime: endPoint.time,
      startLabel,
      endLabel,
      peakAvg: maxAvg,
      badgeText: "Nighttime Boundary Layer Inversion",
    };
  }, [points]);

  // Atmospheric Driver & Particulate Ratio Analysis
  const ratioInsight = useMemo(() => {
    const latestPm25 = stats.pm2_5.latest;
    const latestPm10 = stats.pm10.latest;
    if (!isNumber(latestPm25) || !isNumber(latestPm10) || latestPm10 <= 0) {
      return null;
    }
    const ratio = Number((latestPm25 / latestPm10).toFixed(2));
    let signature = "Mixed Urban Aerosols";
    let desc = "Balanced distribution of fine combustion matter and coarse crustal dust.";
    let icon = Compass;
    let color = "text-sky-600 dark:text-sky-400";
    let badgeBg = "bg-sky-500/15 border-sky-500/30 text-sky-700 dark:text-sky-300";

    if (ratio >= 0.75) {
      signature = "Vehicular & Combustion Smoke";
      desc = "Fine respirable particles dominate (>75%), signalling heavy traffic exhaust or biomass combustion.";
      icon = Flame;
      color = "text-rose-600 dark:text-rose-400";
      badgeBg = "bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300";
    } else if (ratio < 0.50) {
      signature = "Windblown Road Dust & Coarse Matter";
      desc = "Coarse particulate fraction dominates (<50%), characteristic of road silt and mechanical abrasion.";
      icon = Wind;
      color = "text-amber-600 dark:text-amber-400";
      badgeBg = "bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300";
    }

    return { ratio, signature, desc, icon, color, badgeBg };
  }, [stats]);

  const anomalies = useMemo(() => {
    const find = (key: "pm2_5" | "pm10") => {
      const values = points.map((point) => point[key]).filter(isNumber);
      if (values.length < 5) return [] as { time: string; value: number; pollutant: string }[];
      const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
      const deviation = Math.sqrt(
        values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
      );
      return points
        .filter((point) => isNumber(point[key]) && deviation > 0 && point[key]! > mean + deviation * 2)
        .map((point) => ({ time: point.time, value: point[key] as number, pollutant: key }));
    };
    return [...find("pm2_5"), ...find("pm10")];
  }, [points]);

  return (
    <section className="phase-view historical-view">
      {/* Editorial Sub-Navigation Toggle with Mobile Horizontal Scroll & Persistent Report CTA */}
      <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-1 mb-6">
        <div className="overflow-x-auto no-scrollbar">
          <nav className="dashboard-view-tabs flex-nowrap min-w-max" aria-label="Historical Views" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={subTab === "cams"}
              onClick={() => setSubTab("cams")}
              className={`transition-all ${
                subTab === "cams"
                  ? "active selected font-bold"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              <span><Activity size={13} /></span>
              Short-Term CAMS Model
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={subTab === "city_trends"}
              onClick={() => setSubTab("city_trends")}
              className={`transition-all ${
                subTab === "city_trends"
                  ? "active selected font-bold"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              <span><Building2 size={13} /></span>
              Annual City Historical Trends
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={subTab === "country_rankings"}
              onClick={() => setSubTab("country_rankings")}
              className={`transition-all ${
                subTab === "country_rankings"
                  ? "active selected font-bold"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              <span><Globe size={13} /></span>
              Global Country Rankings & WHO Matrix
            </button>
          </nav>
        </div>

        <button
          type="button"
          onClick={() => setReportModalOpen(true)}
          className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-mono text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          title="Generate Historical Pollution Impact Report Dossier"
        >
          <FileText size={14} />
          <span>Pollution Impact Report</span>
        </button>
      </div>

      {/* View 1: Short-Term CAMS Model */}
      {subTab === "cams" && (
        <>
          <header className="phase-view-heading">
            <div>
              <span className="section-kicker">
                <span className="eyebrow-line" /> MODELED HISTORY · {location.name.toUpperCase()}
              </span>
              <h1>Air, over <em>time.</em></h1>
              <p>Hourly and daily particulate trends from the Open-Meteo CAMS model archive.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setReportModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-mono text-[11.5px] font-bold shadow-md active:scale-95 transition-all cursor-pointer"
                title="Generate Pollution Impact Report Dossier"
              >
                <FileText size={15} />
                <span>Pollution Impact Report</span>
              </button>
              <span className="provenance-pill estimate-pill">
                <Activity size={14} /> HISTORICAL MODEL ESTIMATE
              </span>
            </div>
          </header>

          <div className="phase-controls">
            <div className="segmented-control" role="group" aria-label="Chart resolution">
              <button
                className={view === "hourly" ? "selected" : ""}
                onClick={() => setView("hourly")}
                type="button"
              >
                <Clock3 size={14} /> Hourly
              </button>
              <button
                className={view === "daily" ? "selected" : ""}
                onClick={() => setView("daily")}
                type="button"
              >
                <CalendarDays size={14} /> Daily mean
              </button>
            </div>

            <div className="segmented-control" role="group" aria-label="Historical range">
              {([7, 14, 30] as const).map((range) => (
                <button
                  type="button"
                  className={days === range ? "selected" : ""}
                  onClick={() => setDays(range)}
                  key={range}
                >
                  {range} days
                </button>
              ))}
            </div>
          </div>

          {/* Variance KPI Cards + Atmospheric Driver & Delta Insights Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-6">
            {/* PM2.5 Metric */}
            <article className="p-5 rounded-2xl border border-[var(--dash-rule)] bg-[var(--dash-surface)] shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--dash-muted)] font-bold">
                  PM₂.₅ · LATEST MODEL VALUE
                </span>
                <div className="text-3xl font-extrabold text-[var(--dash-ink)] mt-1.5">
                  {stats.pm2_5.latest === null ? "—" : stats.pm2_5.latest.toFixed(1)}{" "}
                  <small className="text-xs font-mono font-normal text-[var(--dash-muted)]">
                    {data?.hourly_units?.pm2_5 ?? "µg/m³"}
                  </small>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-[var(--dash-rule)]/60">
                <span
                  className={`inline-flex items-center gap-1 font-mono text-xs font-bold ${
                    stats.pm2_5.change === null
                      ? "text-[var(--dash-muted)]"
                      : stats.pm2_5.change > 0
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {stats.pm2_5.change !== null && stats.pm2_5.change > 0 ? (
                    <TrendingUp size={14} />
                  ) : (
                    <TrendingDown size={14} />
                  )}
                  {formatPercent(stats.pm2_5.change)}
                  <span className="text-[10px] font-normal text-[var(--dash-muted)] ml-1">
                    vs previous 24h baseline
                  </span>
                </span>
              </div>
            </article>

            {/* PM10 Metric */}
            <article className="p-5 rounded-2xl border border-[var(--dash-rule)] bg-[var(--dash-surface)] shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--dash-muted)] font-bold">
                  PM₁₀ · LATEST MODEL VALUE
                </span>
                <div className="text-3xl font-extrabold text-[var(--dash-ink)] mt-1.5">
                  {stats.pm10.latest === null ? "—" : stats.pm10.latest.toFixed(1)}{" "}
                  <small className="text-xs font-mono font-normal text-[var(--dash-muted)]">
                    {data?.hourly_units?.pm10 ?? "µg/m³"}
                  </small>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-[var(--dash-rule)]/60">
                <span
                  className={`inline-flex items-center gap-1 font-mono text-xs font-bold ${
                    stats.pm10.change === null
                      ? "text-[var(--dash-muted)]"
                      : stats.pm10.change > 0
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {stats.pm10.change !== null && stats.pm10.change > 0 ? (
                    <TrendingUp size={14} />
                  ) : (
                    <TrendingDown size={14} />
                  )}
                  {formatPercent(stats.pm10.change)}
                  <span className="text-[10px] font-normal text-[var(--dash-muted)] ml-1">
                    vs previous 24h baseline
                  </span>
                </span>
              </div>
            </article>

            {/* Atmospheric Driver & Particulate Ratio Card */}
            <article className="p-5 rounded-2xl border border-[var(--dash-rule)] bg-[var(--dash-surface)] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--dash-muted)] font-bold flex items-center gap-1.5">
                    <Sparkles size={12} className="text-[var(--dash-accent)]" />
                    ATMOSPHERIC DRIVER RATIO
                  </span>
                  {ratioInsight && (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${ratioInsight.badgeBg}`}
                    >
                      {ratioInsight.signature}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold font-mono text-[var(--dash-ink)]">
                    {ratioInsight ? ratioInsight.ratio : "—"}
                  </span>
                  <span className="text-xs font-mono text-[var(--dash-muted)]">
                    PM₂.₅ / PM₁₀ Ratio
                  </span>
                </div>

                <p className="text-xs text-[var(--dash-muted)] leading-relaxed mt-2">
                  {ratioInsight?.desc ??
                    "Aerosol stoichiometry provides diagnostic indications of primary combustion exhaust versus windblown mechanical dust."}
                </p>
              </div>

              {peakWindow && (
                <div className="mt-3 pt-2.5 border-t border-[var(--dash-rule)]/60 flex items-center justify-between text-xs font-mono">
                  <span className="text-[var(--dash-muted)] flex items-center gap-1">
                    <AlertTriangle size={12} className="text-amber-500" /> Peak Window:
                  </span>
                  <strong className="text-[var(--dash-ink)]">
                    {peakWindow.startLabel} – {peakWindow.endLabel}
                  </strong>
                </div>
              )}
            </article>
          </div>

          {/* Main Chart Card with Threshold Lines, Overlays & Peak Window Highlight */}
          <div className="phase-chart-card">
            <div className="phase-chart-heading flex flex-col md:flex-row md:items-end justify-between gap-3">
              <div>
                <span className="section-kicker">PARTICULATE MATTER & MULTI-POLLUTANT OVERLAYS</span>
                <h2>{view === "hourly" ? "Last 48 hourly readings" : `${days}-day daily averages`}</h2>
              </div>

              {/* Peak Exposure Window Badge */}
              {peakWindow && view === "hourly" && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-400 text-xs font-mono">
                  <AlertTriangle size={13} className="flex-none" />
                  <span>
                    Peak Trapping: <strong>{peakWindow.startLabel} – {peakWindow.endLabel}</strong> ({peakWindow.badgeText})
                  </span>
                </div>
              )}
            </div>

            {/* Multi-Pollutant Selector Toggles */}
            <div className="flex flex-wrap items-center gap-2 my-4 pt-3 border-t border-[var(--dash-rule)]/60">
              <span className="text-[11px] font-mono font-bold text-[var(--dash-muted)] uppercase tracking-wider mr-1">
                OVERLAYS:
              </span>
              {POLLUTANT_CONFIGS.map((p) => {
                const isSelected = activePollutants.has(p.key);
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => togglePollutant(p.key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold transition-all border ${
                      isSelected
                        ? "border-[var(--dash-rule)] bg-[var(--dash-surface)] text-[var(--dash-ink)] shadow-xs"
                        : "border-transparent bg-transparent text-[var(--dash-muted)] hover:text-[var(--dash-ink)]"
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: p.color }}
                    />
                    {p.shortLabel}
                  </button>
                );
              })}
            </div>

            {loading ? (
              <div className="phase-state">Loading historical model series…</div>
            ) : error ? (
              <div className="phase-state phase-error">{error}</div>
            ) : points.length === 0 ? (
              <div className="phase-state">No historical model points available.</div>
            ) : (
              <div className="phase-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={points} margin={{ top: 16, right: 28, left: -14, bottom: 3 }}>
                    <CartesianGrid strokeDasharray="3 5" stroke="var(--chart-grid)" />
                    <XAxis
                      dataKey="time"
                      tickFormatter={(value) => formatTime(value, view)}
                      minTickGap={28}
                      tick={{ fill: "var(--chart-muted)", fontSize: 11 }}
                    />
                    <YAxis tick={{ fill: "var(--chart-muted)", fontSize: 11 }} width={48} />
                    <Tooltip
                      labelFormatter={(label) => new Date(String(label)).toLocaleString()}
                      formatter={(value, name) => [
                        `${Number(value).toFixed(1)} µg/m³`,
                        name,
                      ]}
                    />
                    <Legend wrapperStyle={{ paddingTop: 8, fontSize: 12 }} />

                    {/* Peak Hazard Inversion Vertical Shaded Band */}
                    {peakWindow && view === "hourly" && (
                      <ReferenceArea
                        x1={peakWindow.startTime}
                        x2={peakWindow.endTime}
                        fill="#ef4444"
                        fillOpacity={0.09}
                        stroke="#ef4444"
                        strokeOpacity={0.3}
                        strokeDasharray="3 3"
                      />
                    )}

                    {/* Statutory Threshold Reference Lines (CPCB Limit in Red, WHO Benchmark in Teal) */}
                    {activePollutants.has("pm2_5") && (
                      <>
                        <ReferenceLine
                          y={60}
                          stroke="#dc2626"
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                          label={{
                            value: "CPCB 24h: 60 µg/m³",
                            fill: "#dc2626",
                            fontSize: 10,
                            position: "insideTopRight",
                          }}
                        />
                        <ReferenceLine
                          y={15}
                          stroke="#00A3A6"
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                          label={{
                            value: "WHO 24h: 15 µg/m³",
                            fill: "#00A3A6",
                            fontSize: 10,
                            position: "insideTopRight",
                          }}
                        />
                      </>
                    )}

                    {!activePollutants.has("pm2_5") && activePollutants.has("pm10") && (
                      <>
                        <ReferenceLine
                          y={100}
                          stroke="#dc2626"
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                          label={{
                            value: "CPCB 24h: 100 µg/m³",
                            fill: "#dc2626",
                            fontSize: 10,
                            position: "insideTopRight",
                          }}
                        />
                        <ReferenceLine
                          y={45}
                          stroke="#00A3A6"
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                          label={{
                            value: "WHO 24h: 45 µg/m³",
                            fill: "#00A3A6",
                            fontSize: 10,
                            position: "insideTopRight",
                          }}
                        />
                      </>
                    )}

                    {/* Active Pollutant Lines */}
                    {POLLUTANT_CONFIGS.filter((p) => activePollutants.has(p.key)).map((p) => (
                      <Line
                        key={p.key}
                        type="monotone"
                        dataKey={p.key}
                        name={p.label}
                        stroke={p.color}
                        strokeWidth={p.key === "pm2_5" ? 2.6 : 2.2}
                        dot={false}
                        activeDot={{ r: 5 }}
                      />
                    ))}

                    {/* Anomaly Spikes */}
                    {anomalies.map((point, index) => (
                      <ReferenceDot
                        key={`${point.pollutant}-${point.time}-${index}`}
                        x={point.time}
                        y={point.value}
                        r={5}
                        fill="#bf493e"
                        stroke="#fff"
                        strokeWidth={2}
                        ifOverflow="visible"
                        label={{
                          value: "Spike",
                          position: "top",
                          fill: "#a33e36",
                          fontSize: 10,
                        }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {anomalies.length > 0 && (
              <div className="anomaly-note">
                <AlertTriangle size={14} />
                <span>
                  {anomalies.length} high-variance spike{anomalies.length === 1 ? "" : "s"} marked · values above 2 standard deviations from this window’s mean.
                </span>
              </div>
            )}
          </div>

          <p className="phase-disclaimer">
            Historical values are CAMS model estimates on an approximately 11 km grid, not archived ground-station measurements. Percentage change compares the latest plotted value with the preceding 24-hour mean (hourly) or earlier daily mean (daily). Statutory limits indicate standard CPCB 24-hour guidelines alongside WHO safe annual exposure targets.
          </p>
        </>
      )}

      {/* View 2: Annual City Historical Trends */}
      {subTab === "city_trends" && <MultiYearHistoricalView initialType="city" />}

      {/* View 3: Global Country Rankings & WHO Benchmark Matrix */}
      {subTab === "country_rankings" && <MultiYearHistoricalView initialType="country" />}

      <PollutionImpactReportModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        location={location}
        initialData={data}
      />
    </section>
  );
}
