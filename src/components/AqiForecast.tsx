"use client";

import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDown, CloudSun, ShieldCheck } from "lucide-react";
import { AQI_COLORS } from "@/lib/aqi-calculator";
import type { Location } from "@/lib/types";
import type { AirSeriesResponse } from "@/lib/phase4-types";

type Standard = "epa" | "cpcb";
const BANDS: Record<Standard, { max: number; label: string; color: string }[]> = {
  epa: [
    { max: 50, label: "Good", color: AQI_COLORS[0] }, { max: 100, label: "Moderate", color: AQI_COLORS[1] },
    { max: 150, label: "Sensitive groups", color: AQI_COLORS[2] }, { max: 200, label: "Unhealthy", color: AQI_COLORS[3] },
    { max: 300, label: "Very unhealthy", color: AQI_COLORS[4] }, { max: 500, label: "Hazardous", color: AQI_COLORS[5] },
  ],
  cpcb: [
    { max: 50, label: "Good", color: AQI_COLORS[0] }, { max: 100, label: "Satisfactory", color: AQI_COLORS[1] },
    { max: 200, label: "Moderate", color: AQI_COLORS[2] }, { max: 300, label: "Poor", color: AQI_COLORS[3] },
    { max: 400, label: "Very poor", color: AQI_COLORS[4] }, { max: 500, label: "Severe", color: AQI_COLORS[5] },
  ],
};

function bandFor(value: number, standard: Standard) { return BANDS[standard].find((band) => value <= band.max) ?? BANDS[standard][5]; }
function timeParts(value: string) {
  const date = new Date(value);
  return { hour: date.toLocaleTimeString([], { hour: "numeric", hour12: true }), day: date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) };
}

export function AqiForecast({ location }: { location: Location }) {
  const [data, setData] = useState<AirSeriesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [standard, setStandard] = useState<Standard>("cpcb");

  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(null);
    const params = new URLSearchParams({ lat: String(location.latitude), lng: String(location.longitude) });
    fetch(`/api/air-quality/forecast?${params}`, { signal: controller.signal })
      .then(async (response) => { const json = await response.json() as AirSeriesResponse & { error?: string }; if (!response.ok) throw new Error(json.error ?? "Forecast is unavailable."); return json; })
      .then((json) => { if (!controller.signal.aborted) setData(json); })
      .catch((fetchError) => { if (!controller.signal.aborted) setError(fetchError instanceof Error ? fetchError.message : "Forecast is unavailable."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [location.latitude, location.longitude]);

  const rows = useMemo(() => data?.hourly.time.map((time, index) => ({
    time,
    aqi: data.hourly.us_aqi?.[index] ?? null,
    pm2_5: data.hourly.pm2_5?.[index] ?? null,
    pm10: data.hourly.pm10?.[index] ?? null,
    ozone: data.hourly.ozone?.[index] ?? null,
  })) ?? [], [data]);

  return (
    <section className="phase-view forecast-view">
      <header className="phase-view-heading"><div><span className="section-kicker"><span className="eyebrow-line"/> FORWARD VIEW · {location.name.toUpperCase()}</span><h1>What the next <em>72 hours hold.</em></h1><p>Hourly CAMS grid-model outlook for AQI and key pollutants.</p></div><span className="provenance-pill estimate-pill"><CloudSun size={14}/> FORECAST · MODEL ESTIMATE</span></header>
      <div className="forecast-toolbar"><div className="forecast-data-badges"><span className="provenance-pill estimate-pill"><CloudSun size={13}/> FORECAST / ESTIMATE DATA</span><span className="provenance-pill station-pill"><ShieldCheck size={13}/> NOT GROUND-STATION TELEMETRY</span></div><label className="standard-select">Band labels<select value={standard} onChange={(event) => setStandard(event.target.value as Standard)}><option value="epa">US EPA</option><option value="cpcb">CPCB · reference</option></select></label></div>
      <div className="phase-chart-card forecast-chart-card"><div className="phase-chart-heading"><div><span className="section-kicker">PROVIDER AQI SERIES</span><h2>Hourly U.S. AQI forecast</h2></div><span className="chart-unit">INDEX · MODEL GRID</span></div>
        {loading ? <div className="phase-state">Loading 72-hour CAMS forecast…</div> : error ? <div className="phase-state phase-error">{error}</div> : rows.length === 0 ? <div className="phase-state">No forecast hours returned.</div> : <div className="forecast-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={rows} margin={{ top:10,right:14,left:-18,bottom:0 }}><defs><linearGradient id="forecastAqiFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#32764e" stopOpacity={.30}/><stop offset="100%" stopColor="#32764e" stopOpacity={.015}/></linearGradient></defs><CartesianGrid strokeDasharray="3 5" stroke="var(--chart-grid)"/><XAxis dataKey="time" tickFormatter={(time) => new Date(String(time)).toLocaleDateString([], { weekday:"short",hour:"numeric" })} minTickGap={45} tick={{ fill:"var(--chart-muted)",fontSize:11 }}/><YAxis domain={[0,"auto"]} tick={{ fill:"var(--chart-muted)",fontSize:11 }}/><Tooltip labelFormatter={(time) => new Date(String(time)).toLocaleString()} formatter={(value) => [value === null ? "—" : `${Number(value).toFixed(0)} AQI`,"US AQI · model"]}/><Area type="monotone" dataKey="aqi" stroke="#2f7650" strokeWidth={2.5} fill="url(#forecastAqiFill)" connectNulls={false} activeDot={{ r:5 }}/></AreaChart></ResponsiveContainer></div>}
      </div>
      <div className="forecast-hours-heading"><div><span className="section-kicker">72 MODEL TIMESTEPS</span><h2>Hour by hour</h2></div><span>Scroll to look ahead <ArrowDown size={13}/></span></div>
      {loading ? <div className="phase-state">Preparing hourly cards…</div> : error ? null : <div className="forecast-hours" aria-label="Hourly air quality forecast">{rows.map((row,index) => {
        const band = typeof row.aqi === "number" ? bandFor(row.aqi, standard) : null;
        const label = timeParts(row.time);
        return <article className="forecast-hour-card" key={row.time}><span className="forecast-hour-day">{label.day}</span><time>{label.hour}</time><strong style={{ color:band?.color ?? "var(--dash-muted)" }}>{typeof row.aqi === "number" ? Math.round(row.aqi) : "—"}</strong><span className="forecast-hour-band">{band?.label ?? "AQI unavailable"}</span><div className="forecast-hour-pollutants"><span>PM₂.₅ <b>{typeof row.pm2_5 === "number" ? row.pm2_5.toFixed(1) : "—"}</b></span><span>PM₁₀ <b>{typeof row.pm10 === "number" ? row.pm10.toFixed(1) : "—"}</b></span></div><span className="forecast-index-label">US AQI</span>{index === 0 && <i className="forecast-now-dot"/>}</article>;
      })}</div>}
      <p className="phase-disclaimer">The AQI number is the U.S. AQI series provided by Open-Meteo. CPCB selection changes the displayed category labels and color bands for reference; it does not recalculate the model using CPCB averaging periods. All forecast values are estimates, not station readings.</p>
    </section>
  );
}
