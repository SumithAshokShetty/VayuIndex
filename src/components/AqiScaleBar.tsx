"use client";

import { motion, useReducedMotion } from "framer-motion";
import { AQI_COLORS } from "@/lib/aqi-calculator";

const BANDS = [
  { min: 0, max: 50, label: "GOOD", range: "0–50", color: AQI_COLORS[0], width: 10 },
  { min: 51, max: 100, label: "MODERATE", range: "51–100", color: AQI_COLORS[1], width: 10 },
  { min: 101, max: 150, label: "SENSITIVE", range: "101–150", color: AQI_COLORS[2], width: 10 },
  { min: 151, max: 200, label: "UNHEALTHY", range: "151–200", color: AQI_COLORS[3], width: 10 },
  { min: 201, max: 300, label: "VERY UNHEALTHY", range: "201–300", color: AQI_COLORS[4], width: 20 },
  { min: 301, max: 500, label: "HAZARDOUS", range: "301+", color: AQI_COLORS[5], width: 40 },
] as const;

export function AqiScaleBar({ value }: { value: number | null }) {
  const reduceMotion = useReducedMotion();
  const markerPosition = value === null ? 0 : Math.max(0, Math.min(100, value / 5));

  return (
    <section className="aqi-scale-reference" aria-label="US EPA AQI category reference">
      <div className="aqi-scale-reference-heading">
        <div><span className="section-kicker">READ THE INDEX</span><h2>US EPA air quality scale</h2></div>
        <span className="aqi-scale-reference-note">COLOR INDICATES LEVEL OF CONCERN</span>
      </div>
      <div className="aqi-bands" role="img" aria-label={value === null ? "AQI scale from 0 to 500" : `Current AQI ${Math.round(value)} on a scale from 0 to 500`}>
        {BANDS.map((band) => <div className="aqi-band" key={band.label} style={{ width: `${band.width}%`, backgroundColor: band.color }} />)}
        {value !== null && <motion.div
          className={`aqi-scale-marker ${markerPosition <= 2 ? "at-start" : markerPosition >= 98 ? "at-end" : ""}`}
          initial={{ left: "0%" }}
          animate={{ left: `${markerPosition}%` }}
          transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 130, damping: 22, mass: 0.7 }}
          aria-hidden="true"
        ><span>{Math.round(value)}</span></motion.div>}
      </div>
      <div className="aqi-band-labels">
        {BANDS.map((band) => <div className="aqi-band-label" key={band.label} style={{ width: `${band.width}%` }}>
          <span>{band.range}</span><small>{band.label}</small>
        </div>)}
      </div>
    </section>
  );
}

