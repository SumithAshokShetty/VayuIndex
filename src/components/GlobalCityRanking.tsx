"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDownWideNarrow, ArrowUpRight, RotateCcw } from "lucide-react";
import { AQI_COLORS } from "@/lib/aqi-calculator";
import type { AirQualityResponse, Location } from "@/lib/types";

const CITIES: Location[] = [
  { name: "Delhi", country: "India", latitude: 28.6139, longitude: 77.2090 },
  { name: "Beijing", country: "China", latitude: 39.9042, longitude: 116.4074 },
  { name: "Seoul", country: "South Korea", latitude: 37.5665, longitude: 126.9780 },
  { name: "Tokyo", country: "Japan", latitude: 35.6762, longitude: 139.6503 },
  { name: "Cairo", country: "Egypt", latitude: 30.0444, longitude: 31.2357 },
  { name: "London", country: "United Kingdom", latitude: 51.5072, longitude: -0.1276 },
  { name: "Paris", country: "France", latitude: 48.8566, longitude: 2.3522 },
  { name: "New York", country: "United States", latitude: 40.7128, longitude: -74.0060 },
];

type CityReading = { location: Location; air: AirQualityResponse | null; error?: string };

function band(aqi: number | null) {
  if (aqi === null) return { label: "Unavailable", color: "#78827a" };
  if (aqi <= 50) return { label: "Good", color: AQI_COLORS[0] };
  if (aqi <= 100) return { label: "Moderate", color: AQI_COLORS[1] };
  if (aqi <= 150) return { label: "Sensitive groups", color: AQI_COLORS[2] };
  if (aqi <= 200) return { label: "Unhealthy", color: AQI_COLORS[3] };
  if (aqi <= 300) return { label: "Very unhealthy", color: AQI_COLORS[4] };
  return { label: "Hazardous", color: AQI_COLORS[5] };
}

export function GlobalCityRanking({ onSelectLocation }: { onSelectLocation: (location: Location) => void }) {
  const [readings, setReadings] = useState<CityReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const requestController = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    setLoading(true);
    const results = await Promise.all(CITIES.map(async (location): Promise<CityReading> => {
      const params = new URLSearchParams({ lat: String(location.latitude), lng: String(location.longitude) });
      try {
        const response = await fetch(`/api/air-quality?${params}`, { signal: controller.signal, cache: "no-store" });
        const payload = await response.json() as AirQualityResponse | { error?: string };
        if (!response.ok) throw new Error("error" in payload ? payload.error : "Reading unavailable");
        return { location, air: payload as AirQualityResponse };
      } catch (error) {
        if (controller.signal.aborted) return { location, air: null };
        return { location, air: null, error: error instanceof Error ? error.message : "Reading unavailable" };
      }
    }));
    if (controller.signal.aborted) return;
    results.sort((left, right) => {
      const leftAqi = typeof left.air?.current.aqi === "number" ? left.air.current.aqi : null;
      const rightAqi = typeof right.air?.current.aqi === "number" ? right.air.current.aqi : null;
      if (leftAqi === null && rightAqi === null) return left.location.name.localeCompare(right.location.name);
      if (leftAqi === null) return 1;
      if (rightAqi === null) return -1;
      return rightAqi - leftAqi;
    });
    setReadings(results);
    setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZoneName: "short" }));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 10 * 60 * 1000);
    return () => { requestController.current?.abort(); window.clearInterval(interval); };
  }, [load]);

  return <section className="global-city-ranking" aria-labelledby="global-city-ranking-title">
    <header className="global-ranking-heading">
      <div><span className="section-kicker"><span className="eyebrow-line"/> LIVE AIR SIGNALS · GLOBAL</span><h2 id="global-city-ranking-title">Live AQI⁺ global major city ranking</h2><p>Current readings across selected cities. Highest reported AQI appears first.</p></div>
      <div className="global-ranking-meta"><span><i/> LIVE · 10 MIN REFRESH</span><span>UPDATED {lastUpdated ?? "—"}</span><button type="button" onClick={() => void load()} disabled={loading} aria-label="Refresh global city ranking"><RotateCcw size={13}/> Refresh</button></div>
    </header>
    <div className="global-ranking-columns" aria-hidden="true"><span>RANK · CITY</span><span>REPORTED AQI</span><span>DATA PROVENANCE</span><span/></div>
    <ol className="global-ranking-list" aria-live="polite">
      {readings.map((item, index) => {
        const aqi = typeof item.air?.current.aqi === "number" ? item.air.current.aqi : null;
        const aqiBand = band(aqi);
        const provenance = item.air?.provenance === "station-observation" ? "GROUND STATION" : item.air?.provenance === "modeled-estimate" ? "MODEL ESTIMATE" : "NO DATA";
        return <li key={`${item.location.name}-${item.location.latitude}`}>
          <button type="button" className="global-ranking-row" onClick={() => onSelectLocation(item.location)} disabled={aqi === null}>
            <span className="global-ranking-place"><b>{String(index + 1).padStart(2, "0")}</b><span><strong>{item.location.name}</strong><small>{item.location.country}</small></span></span>
            <span className="global-ranking-aqi"><strong style={{ color: aqiBand.color }}>{aqi === null ? "—" : Math.round(aqi)}</strong><small>{aqiBand.label}</small></span>
            <span className={`global-ranking-provenance ${item.air?.provenance === "station-observation" ? "is-station" : item.air ? "is-model" : "is-unavailable"}`}><i/>{provenance}<small>{item.air?.sourceLabel ?? item.error ?? "Waiting for source"}</small></span>
            <span className="global-ranking-open">VIEW CITY <ArrowUpRight size={13}/></span>
          </button>
        </li>;
      })}
      {loading && readings.length === 0 && <li className="global-ranking-empty"><ArrowDownWideNarrow size={15}/> Loading current city readings from available sources…</li>}
      {!loading && readings.length === 0 && <li className="global-ranking-empty">No city readings are available right now.</li>}
    </ol>
    <p className="global-ranking-footnote">AQI scales and reporting times can vary by source. Station observations and modeled estimates are labelled for each city; rankings are indicative and not strict cross-provider comparisons.</p>
  </section>;
}
