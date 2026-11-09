"use client";

import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, AlertTriangle, CalendarDays, Clock3 } from "lucide-react";
import type { Location } from "@/lib/types";
import type { AirSeriesResponse } from "@/lib/phase4-types";

type Range = 7 | 14 | 30;
type View = "hourly" | "daily";
type ChartPoint = { time: string; label: string; pm2_5: number | null; pm10: number | null; fullTime: string };

function isNumber(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value); }
function formatTime(value: string, view: View) {
  const date = new Date(value);
  return view === "hourly" ? date.toLocaleTimeString([], { hour: "numeric", hour12: true }) : date.toLocaleDateString([], { month: "short", day: "numeric" });
}
function formatPercent(value: number | null) { return value === null ? "—" : `${value > 0 ? "+" : ""}${value.toFixed(1)}%`; }

export function HistoricalTracker({ location }: { location: Location }) {
  const [days, setDays] = useState<Range>(14);
  const [view, setView] = useState<View>("hourly");
  const [data, setData] = useState<AirSeriesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(null);
    const params = new URLSearchParams({ lat: String(location.latitude), lng: String(location.longitude), days: String(days) });
    fetch(`/api/air-quality/history?${params}`, { signal: controller.signal })
      .then(async (response) => { const json = await response.json() as AirSeriesResponse & { error?: string }; if (!response.ok) throw new Error(json.error ?? "Historical data is unavailable."); return json; })
      .then((json) => { if (!controller.signal.aborted) setData(json); })
      .catch((fetchError) => { if (!controller.signal.aborted) setError(fetchError instanceof Error ? fetchError.message : "Historical data is unavailable."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [location.latitude, location.longitude, days]);

  const points = useMemo<ChartPoint[]>(() => {
    if (!data?.hourly.time) return [];
    const rows = data.hourly.time.map((time, index) => ({ time, label: formatTime(time, view), fullTime: time, pm2_5: data.hourly.pm2_5?.[index] ?? null, pm10: data.hourly.pm10?.[index] ?? null }));
    if (view === "hourly") return rows.slice(-48);
    const grouped = new Map<string, { pm2_5: number[]; pm10: number[] }>();
    for (const row of rows) {
      const key = row.time.slice(0, 10); const group = grouped.get(key) ?? { pm2_5: [], pm10: [] };
      if (isNumber(row.pm2_5)) group.pm2_5.push(row.pm2_5);
      if (isNumber(row.pm10)) group.pm10.push(row.pm10);
      grouped.set(key, group);
    }
    return [...grouped].map(([date, group]) => ({ time: date, label: formatTime(date, "daily"), fullTime: date, pm2_5: group.pm2_5.length ? group.pm2_5.reduce((a,b)=>a+b,0)/group.pm2_5.length : null, pm10: group.pm10.length ? group.pm10.reduce((a,b)=>a+b,0)/group.pm10.length : null }));
  }, [data, view]);

  const stats = useMemo(() => {
    const calculate = (key: "pm2_5" | "pm10") => {
      const values = points.map((point) => point[key]).filter(isNumber);
      if (values.length < 2) return { latest: values.at(-1) ?? null, change: null };
      const current = values.at(-1)!;
      const baselineValues = view === "hourly" ? values.slice(Math.max(0, values.length - 25), -1) : values.slice(0, -1);
      const baseline = baselineValues.length ? baselineValues.reduce((sum, value) => sum + value, 0) / baselineValues.length : null;
      return { latest: current, change: baseline && baseline > 0 ? ((current - baseline) / baseline) * 100 : null };
    };
    return { pm2_5: calculate("pm2_5"), pm10: calculate("pm10") };
  }, [points, view]);

  const anomalies = useMemo(() => {
    const find = (key: "pm2_5" | "pm10") => {
      const values = points.map((point) => point[key]).filter(isNumber);
      if (values.length < 5) return [] as { time: string; value: number; pollutant: string }[];
      const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
      const deviation = Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length);
      return points.filter((point) => isNumber(point[key]) && deviation > 0 && point[key]! > mean + deviation * 2).map((point) => ({ time: point.time, value: point[key] as number, pollutant: key }));
    };
    return [...find("pm2_5"), ...find("pm10")];
  }, [points]);

  return (
    <section className="phase-view historical-view">
      <header className="phase-view-heading"><div><span className="section-kicker"><span className="eyebrow-line"/> MODELED HISTORY · {location.name.toUpperCase()}</span><h1>Air, over <em>time.</em></h1><p>Hourly and daily particulate trends from the Open-Meteo CAMS model archive.</p></div><span className="provenance-pill estimate-pill"><Activity size={14}/> HISTORICAL MODEL ESTIMATE</span></header>
      <div className="phase-controls"><div className="segmented-control" role="group" aria-label="Chart resolution"><button className={view === "hourly" ? "selected" : ""} onClick={() => setView("hourly")} type="button"><Clock3 size={14}/> Hourly</button><button className={view === "daily" ? "selected" : ""} onClick={() => setView("daily")} type="button"><CalendarDays size={14}/> Daily mean</button></div><div className="segmented-control" role="group" aria-label="Historical range">{([7,14,30] as const).map((range) => <button type="button" className={days === range ? "selected" : ""} onClick={() => setDays(range)} key={range}>{range} days</button>)}</div></div>
      <div className="variance-grid">
        {[{ key:"pm2_5",label:"PM₂.₅",unit:data?.hourly_units?.pm2_5 ?? "µg/m³",...stats.pm2_5 },{ key:"pm10",label:"PM₁₀",unit:data?.hourly_units?.pm10 ?? "µg/m³",...stats.pm10 }].map((item) => <article className="variance-card" key={item.key}><span>{item.label} · LATEST MODEL VALUE</span><strong>{item.latest === null ? "—" : item.latest.toFixed(1)} <small>{item.unit}</small></strong><em className={item.change === null ? "neutral" : item.change > 0 ? "up" : "down"}>{formatPercent(item.change)} <small>vs previous baseline</small></em></article>)}
      </div>
      <div className="phase-chart-card"><div className="phase-chart-heading"><div><span className="section-kicker">PARTICULATE MATTER</span><h2>{view === "hourly" ? "Last 48 hourly readings" : `${days}-day daily averages`}</h2></div><span className="chart-unit">{data?.hourly_units?.pm2_5 ?? "µg/m³"}</span></div>
        {loading ? <div className="phase-state">Loading historical model series…</div> : error ? <div className="phase-state phase-error">{error}</div> : points.length === 0 ? <div className="phase-state">No historical model points available.</div> : <div className="phase-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={points} margin={{ top: 16, right: 18, left: -14, bottom: 3 }}><CartesianGrid strokeDasharray="3 5" stroke="var(--chart-grid)"/><XAxis dataKey="time" tickFormatter={(value) => formatTime(value, view)} minTickGap={28} tick={{ fill:"var(--chart-muted)",fontSize:11 }}/><YAxis tick={{ fill:"var(--chart-muted)",fontSize:11 }} width={48}/><Tooltip labelFormatter={(label) => new Date(String(label)).toLocaleString()} formatter={(value, name) => [`${Number(value).toFixed(1)} ${data?.hourly_units?.[name === "PM₂.₅" ? "pm2_5" : "pm10"] ?? "µg/m³"}`, name]}/><Legend/><Line type="monotone" dataKey="pm2_5" name="PM₂.₅" stroke="#2f7650" strokeWidth={2.6} dot={false} activeDot={{ r:5 }}/><Line type="monotone" dataKey="pm10" name="PM₁₀" stroke="#bf7955" strokeWidth={2.4} dot={false} activeDot={{ r:5 }}/>{anomalies.map((point,index) => <ReferenceDot key={`${point.pollutant}-${point.time}-${index}`} x={point.time} y={point.value} r={5} fill="#bf493e" stroke="#fff" strokeWidth={2} ifOverflow="visible" label={{ value:"Spike", position:"top", fill:"#a33e36", fontSize:10 }}/>)}</LineChart></ResponsiveContainer></div>}
        {anomalies.length > 0 && <div className="anomaly-note"><AlertTriangle size={14}/><span>{anomalies.length} high-variance spike{anomalies.length === 1 ? "" : "s"} marked · values above 2 standard deviations from this window’s mean.</span></div>}
      </div>
      <p className="phase-disclaimer">Historical values are CAMS model estimates on an approximately 11 km grid, not archived ground-station measurements. Percentage change compares the latest plotted value with the preceding 24-hour mean (hourly) or earlier daily mean (daily). Variance is unavailable when the reference value is zero.</p>
    </section>
  );
}
