"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, LocateFixed, ShieldCheck } from "lucide-react";
import { AiAssistant } from "@/components/AiAssistant";
import { PersonalRiskCalculator, type RiskProfile } from "@/components/PersonalRiskCalculator";
import { AreaAirScore } from "@/components/AreaAirScore";
import type { AirQualityResponse, Location } from "@/lib/types";

const INITIAL_LOCATION: Location = { name: "New Delhi", admin: "Delhi", country: "India", latitude: 28.6139, longitude: 77.209 };
const INITIAL_PROFILE: RiskProfile = { age: "adult", health: "none", activity: "light", exposure: "under1" };
type ForecastPoint = Record<string, number | string | null>;
type HistoricalReadings = Record<string, number[]>;

export function RiskWorkspace() {
  const [location, setLocation] = useState<Location>(INITIAL_LOCATION);
  const [air, setAir] = useState<AirQualityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<RiskProfile>(INITIAL_PROFILE);
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [weather, setWeather] = useState<Record<string, number | string | null> | undefined>();
  const [history, setHistory] = useState<HistoricalReadings>();

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ lat: String(location.latitude), lng: String(location.longitude) });
    fetch(`/api/air-quality?${params}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as AirQualityResponse | { error?: string };
        if (!response.ok) throw new Error("error" in payload ? payload.error : "Air readings are unavailable.");
        if (!controller.signal.aborted) setAir(payload as AirQualityResponse);
      })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Air readings are unavailable."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });

    fetch(`/api/air-quality/forecast?${params}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((data: { hourly?: { time?: string[]; us_aqi?: (number | null)[]; pm2_5?: (number | null)[]; pm10?: (number | null)[] }; source?: string } | null) => {
        if (!data?.hourly?.time || controller.signal.aborted) return;
        setForecast(data.hourly.time.slice(0, 72).map((time, index) => ({ time, us_aqi: data.hourly?.us_aqi?.[index] ?? null, pm2_5: data.hourly?.pm2_5?.[index] ?? null, pm10: data.hourly?.pm10?.[index] ?? null })).filter((point) => point.us_aqi !== null || point.pm2_5 !== null || point.pm10 !== null));
      }).catch(() => undefined);

    fetch(`/api/weather?${params}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((data: { current?: Record<string, number | string | null> } | null) => { if (data?.current && !controller.signal.aborted) setWeather(data.current); })
      .catch(() => undefined);

    fetch(`/api/air-quality/history?${new URLSearchParams({ lat: String(location.latitude), lng: String(location.longitude), days: "7" })}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((data: { hourly?: { pm2_5?: (number | null)[]; pm10?: (number | null)[] } } | null) => {
        if (!data?.hourly || controller.signal.aborted) return;
        const values: HistoricalReadings = {};
        for (const pollutant of ["pm2_5", "pm10"] as const) values[pollutant] = (data.hourly[pollutant] ?? []).filter((value): value is number => typeof value === "number" && Number.isFinite(value));
        setHistory(values);
      }).catch(() => undefined);
    return () => controller.abort();
  }, [location]);

  return <main className="risk-page">
    <section className="risk-page-intro"><span className="risk-eyebrow"><i/> PHASE 5 · PERSONAL EXPOSURE</span><h1>Air quality is shared.<br/><em>Exposure is personal.</em></h1><p>Put local air readings in context with age, health, activity, and time outdoors. The profile stays in this page; asking the assistant sends it with your question to Groq for that response.</p></section>
    <div className="risk-current-place"><LocateFixed size={15}/><span>{location.name}, {location.country}</span><span>{loading ? "FETCHING CURRENT AIR" : error ? "SOURCE UNAVAILABLE" : air?.sourceLabel ?? "NO DATA SOURCE"}</span></div>
    {error && <p className="risk-fetch-error" role="status">{error}</p>}
    <div className="risk-workspace-grid">
      <PersonalRiskCalculator aqi={typeof air?.current.aqi === "number" ? air.current.aqi : null} locationName={location.name} sourceLabel={loading ? "Fetching air data…" : air?.sourceLabel ?? "No source available"} provenance={air?.provenance ?? null} profile={profile} onProfileChange={setProfile}/>
      <aside className="risk-principles-card"><span className="risk-principles-icon"><ShieldCheck size={19}/></span><span className="risk-eyebrow">HOW TO READ THIS</span><h2>A context score, not a diagnosis.</h2><p>The weighted score illustrates how the selected profile changes relative exposure. The AQI and source reading remain visible, and modeled estimates are identified separately from station observations.</p><a href="/about">Explore data sources <ArrowUpRight size={14}/></a><small>General public information. Follow local health authority guidance.</small></aside>
    </div>

    {/* Area Air Score Station Breakdown & Safer Nearby Havens Engine */}
    <div className="mt-8">
      <AreaAirScore currentLocation={location} onSwitchLocation={setLocation} />
    </div>

    <AiAssistant air={air} location={location} profile={profile} forecast={forecast} weather={weather} history={air?.provider === "open-meteo" ? history : undefined}/>
  </main>;
}
