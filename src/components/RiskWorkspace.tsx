"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, LocateFixed, Navigation, ShieldCheck } from "lucide-react";
import { PersonalRiskCalculator, type RiskProfile } from "@/components/PersonalRiskCalculator";
import type { AirQualityResponse, Location } from "@/lib/types";

const INITIAL_LOCATION: Location = { name: "New Delhi", admin: "Delhi", country: "India", latitude: 28.6139, longitude: 77.209 };
const INITIAL_PROFILE: RiskProfile = { age: "adult", health: "none", activity: "light", exposure: "under1" };
type ForecastPoint = Record<string, number | string | null>;
type HistoricalReadings = Record<string, number[]>;

export function RiskWorkspace() {
  const [location, setLocation] = useState<Location>(INITIAL_LOCATION);
  const [air, setAir] = useState<AirQualityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<RiskProfile>(INITIAL_PROFILE);
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [weather, setWeather] = useState<Record<string, number | string | null> | undefined>();
  const [history, setHistory] = useState<HistoricalReadings>();


  useEffect(() => {
    const detail = { air, location, profile, forecast, weather, history: air?.provider === "open-meteo" ? history : undefined };
    (window as Window & { __vayuAssistantContext?: typeof detail }).__vayuAssistantContext = detail;
    window.dispatchEvent(new CustomEvent("vayu-assistant-context", { detail }));
  }, [air, location, profile, forecast, weather, history]);

  // Initialize location from localStorage or URL query params
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const latParam = searchParams.get("lat");
      const lngParam = searchParams.get("lng");
      const cityParam = searchParams.get("city");
      if (latParam && lngParam) {
        setLocation({
          name: cityParam || "Custom Location",
          admin: "",
          country: "",
          latitude: parseFloat(latParam),
          longitude: parseFloat(lngParam),
        });
        return;
      }

      const saved = localStorage.getItem("vayu-location");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.latitude === "number" && typeof parsed.longitude === "number") {
          setLocation(parsed);
          return;
        }
      }
    } catch {}

    // If no saved location, try detecting
    detectUserLocation();
  }, []);

  const detectUserLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        try {
          const response = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
          if (response.ok) {
            const place = (await response.json()) as { name?: string; admin?: string; country?: string };
            if (place.name) {
              const detectedLoc: Location = {
                name: place.name,
                admin: place.admin || "Detected location",
                country: place.country || "",
                latitude: lat,
                longitude: lng,
              };
              setLocation(detectedLoc);
              try {
                localStorage.setItem("vayu-location", JSON.stringify(detectedLoc));
              } catch {}
              setDetectingLocation(false);
              return;
            }
          }
        } catch {}

        const fallbackLoc: Location = {
          name: "Detected location",
          admin: "Browser coordinates",
          latitude: lat,
          longitude: lng,
        };
        setLocation(fallbackLoc);
        try {
          localStorage.setItem("vayu-location", JSON.stringify(fallbackLoc));
        } catch {}
        setDetectingLocation(false);
      },
      () => setDetectingLocation(false),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 }
    );
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ lat: String(location.latitude), lng: String(location.longitude) });
    setLoading(true);
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
    <section className="risk-page-intro"><span className="risk-eyebrow"><i/> PHASE 5 · PERSONAL EXPOSURE</span><h1>Air quality is shared.<br/><em>Exposure is personal.</em></h1><p>Put local air readings in context with age, health, activity, and time outdoors. Grounded in real-time telemetry from your exact location.</p></section>
    <div className="risk-current-place">
      <button 
        type="button" 
        onClick={detectUserLocation} 
        disabled={detectingLocation}
        title="Detect your current location via GPS" 
        className="risk-detect-pill"
      >
        <LocateFixed size={14} className={detectingLocation ? "animate-spin text-emerald-600" : "text-emerald-700"} />
        <span>{detectingLocation ? "DETECTING GPS…" : "MY CURRENT LOCATION"}</span>
      </button>
      <span className="risk-current-place-name"><strong>{location.name}</strong>{location.country ? `, ${location.country}` : location.admin ? `, ${location.admin}` : ""}</span>
      <span>{loading ? "FETCHING CURRENT AIR" : error ? "SOURCE UNAVAILABLE" : air?.sourceLabel ?? "NO DATA SOURCE"}</span>
    </div>
    {error && <p className="risk-fetch-error" role="status">{error}</p>}
    <div className="risk-workspace-grid">
      <PersonalRiskCalculator 
        aqi={typeof air?.current.aqi === "number" ? air.current.aqi : null} 
        air={air}
        location={location}
        locationName={location.name} 
        sourceLabel={loading ? "Fetching air data…" : air?.sourceLabel ?? "No source available"} 
        provenance={air?.provenance ?? null} 
        profile={profile} 
        onProfileChange={setProfile}
        onDetectLocation={detectUserLocation}
      />
      <aside className="risk-principles-card"><span className="risk-principles-icon"><ShieldCheck size={19}/></span><span className="risk-eyebrow">HOW TO READ THIS</span><h2>A context score, not a diagnosis.</h2><p>The weighted score illustrates how the selected profile changes relative exposure. The AQI and source reading remain visible, and modeled estimates are identified separately from station observations.</p><a href="/about">Explore data sources <ArrowUpRight size={14}/></a><small>General public information. Follow local health authority guidance.</small></aside>
    </div>

  </main>;
}
