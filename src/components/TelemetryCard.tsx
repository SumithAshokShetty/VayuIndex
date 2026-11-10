"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Activity, Clock3, Radio, Wind } from "lucide-react";
import { AQI_COLORS } from "@/lib/aqi-calculator";
import type { AirQualityResponse, Location } from "@/lib/types";

const POLLUTANTS = [
  { key: "pm2_5", index: "us_aqi_pm2_5", label: "PM₂.₅" },
  { key: "pm10", index: "us_aqi_pm10", label: "PM₁₀" },
  { key: "nitrogen_dioxide", index: "us_aqi_nitrogen_dioxide", label: "NO₂" },
  { key: "sulphur_dioxide", index: "us_aqi_sulphur_dioxide", label: "SO₂" },
  { key: "carbon_monoxide", index: "us_aqi_carbon_monoxide", label: "CO" },
  { key: "ozone", index: "us_aqi_ozone", label: "O₃" },
] as const;

const CPCB_BANDS = [
  { max: 50, label: "Good", color: AQI_COLORS[0] },
  { max: 100, label: "Satisfactory", color: AQI_COLORS[1] },
  { max: 200, label: "Moderate", color: AQI_COLORS[2] },
  { max: 300, label: "Poor", color: AQI_COLORS[3] },
  { max: 400, label: "Very Poor", color: AQI_COLORS[4] },
  { max: 500, label: "Severe", color: AQI_COLORS[5] },
] as const;

function getBand(value: number) {
  return CPCB_BANDS.find((band) => value <= band.max) ?? CPCB_BANDS[5];
}

function formatValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(1).replace(/\.0$/, "") : "—";
}

function formatTimestamp(value?: string, timezone?: string) {
  if (!value) return "TIME NOT PROVIDED";
  return `${value.replace("T", " ")}${timezone ? ` · ${timezone}` : ""}`;
}

type TelemetryCardProps = {
  air: AirQualityResponse | null;
  aqi: number | null;
  dominantPollutant: string | null;
  location: Location;
  loading: boolean;
  error: string | null;
};

export function TelemetryCard({ air, aqi, dominantPollutant, location, loading, error }: TelemetryCardProps) {
  const counterRef = useRef<HTMLSpanElement | null>(null);
  const band = aqi === null ? null : getBand(aqi);
  const source = air?.provider === "cpcb" ? "CPCB OFFICIAL TELEMETRY"
    : air?.provider === "openaq" ? "OPENAQ · GROUND STATION"
      : air?.provider === "waqi" ? "WAQI · STATION INDEX"
        : air?.provider === "open-meteo" ? "OPEN-METEO · CAMS MODEL" : "AIR DATA SOURCE";
  const measurementTime = air?.current.time;

  useEffect(() => {
    const element = counterRef.current;
    if (!element) return;
    if (aqi === null) {
      element.textContent = loading ? "···" : "—";
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.textContent = String(Math.round(aqi));
      return;
    }

    const counter = { value: 0 };
    const tween = gsap.to(counter, {
      value: aqi,
      duration: 1.05,
      ease: "power3.out",
      onUpdate: () => {
        if (counterRef.current) counterRef.current.textContent = String(Math.round(counter.value));
      },
    });
    return () => { tween.kill(); };
  }, [aqi, loading, location.latitude, location.longitude]);

  return (
    <article className="telemetry-card">
      <div className="telemetry-heading">
        <span className="section-kicker"><Activity size={13}/> LIVE TELEMETRY</span>
        <span className={`telemetry-live ${loading ? "is-loading" : error ? "is-error" : ""}`}><i/>{loading ? "SYNCING" : error ? "OFFLINE" : "LIVE"}</span>
      </div>

      <div className="telemetry-location">
        <span className="telemetry-label">SELECTED LOCATION</span>
        <h2>{location.name}</h2>
        <p>{[location.admin, location.country].filter(Boolean).join(" · ") || "Global coordinates"}</p>
      </div>

      <div className="telemetry-aqi">
        <div className="telemetry-aqi-copy">
          <span className="telemetry-label">CPCB NATIONAL AIR QUALITY INDEX</span>
          <div className="telemetry-value-line">
            <span className="telemetry-value" ref={counterRef} aria-label={aqi === null ? "AQI unavailable" : `Air Quality Index ${aqi}`}>
              {loading ? "···" : aqi === null ? "—" : Math.round(aqi)}
            </span>
            <span className="telemetry-unit">AQI</span>
          </div>
        </div>
        {band ? (
          <span className="aqi-glass-badge" style={{
            color: aqi !== null && aqi > 200 ? "#ffffff" : "#16221b",
            borderColor: `${band.color}70`,
            backgroundColor: `${band.color}dc`,
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}>{band.label}</span>
        ) : <span className="aqi-glass-badge aqi-unavailable">AQI UNAVAILABLE</span>}
      </div>

      <div className="telemetry-provenance">
        <span><Radio size={12}/>{source}</span>
        <span><Clock3 size={12}/>{formatTimestamp(measurementTime, air?.timezone)}</span>
      </div>

      {error && <p className="telemetry-error" role="status">{error}</p>}
      {air?.fallbackNote && <p className="telemetry-source-note">{air.fallbackNote}</p>}

      <div className="telemetry-table-wrap">
        <div className="telemetry-table-heading"><span className="telemetry-label">POLLUTANT</span><span className="telemetry-label">CONCENTRATION</span><span className="telemetry-label">SUB-INDEX</span></div>
        <div className="telemetry-table" role="table" aria-label="Pollutant concentrations">
          {POLLUTANTS.map((pollutant) => {
            const concentration = air?.current[pollutant.key];
            const index = air?.current[pollutant.index];
            const numericIndex = typeof index === "number" && Number.isFinite(index) ? index : null;
            const dominant = dominantPollutant === pollutant.key;
            const units = air?.current_units?.[pollutant.key] ?? "μg/m³";
            const color = numericIndex === null ? undefined : getBand(numericIndex).color;
            return (
              <div className={`telemetry-row ${dominant ? "is-dominant" : ""}`} role="row" key={pollutant.key}>
                <span className="telemetry-pollutant" role="cell">{pollutant.label}{dominant && <span className="dominant-tag">DOMINANT</span>}</span>
                <span className="telemetry-concentration" role="cell">{formatValue(concentration)}<small>{typeof concentration === "number" ? units : ""}</small></span>
                <span className="telemetry-subindex" role="cell" style={{ color }}>{numericIndex === null ? "—" : Math.round(numericIndex)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="telemetry-footnote"><Wind size={12}/><span>{air?.provider === "cpcb" ? "Central Pollution Control Board official real-time physical telemetry." : air?.provider === "openaq" ? "Individual station measurements; no composite AQI is inferred." : "Pollutant sub-indices are shown when supplied by the source."}</span></div>
    </article>
  );
}

