"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, HeartPulse, ShieldAlert, X } from "lucide-react";

export type RiskProfile = {
  age: "child" | "adult" | "senior";
  health: "none" | "respiratory" | "cardiovascular";
  activity: "light" | "moderate" | "heavy";
  exposure: "under1" | "oneToThree" | "over3";
};

const OPTIONS = {
  age: [
    { value: "child", label: "Child", weight: 1.35 },
    { value: "adult", label: "Adult", weight: 1.0 },
    { value: "senior", label: "Senior", weight: 1.4 },
  ],
  health: [
    { value: "none", label: "No known condition", weight: 1.0 },
    { value: "respiratory", label: "Respiratory / asthma", weight: 1.65 },
    { value: "cardiovascular", label: "Cardiovascular", weight: 1.5 },
  ],
  activity: [
    { value: "light", label: "Light", weight: 1.0 },
    { value: "moderate", label: "Moderate", weight: 1.3 },
    { value: "heavy", label: "Heavy", weight: 1.75 },
  ],
  exposure: [
    { value: "under1", label: "Under 1 hour", weight: 1.0 },
    { value: "oneToThree", label: "1–3 hours", weight: 1.25 },
    { value: "over3", label: "3+ hours", weight: 1.6 },
  ],
} as const;

type OptionKey = keyof typeof OPTIONS;
const INITIAL_PROFILE: RiskProfile = { age: "adult", health: "none", activity: "light", exposure: "under1" };

function weightFor<K extends OptionKey>(key: K, value: RiskProfile[K]) {
  const option = (OPTIONS[key] as readonly { value: string; weight: number }[]).find((item) => item.value === value);
  return option?.weight ?? 1;
}

function category(aqi: number) {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for sensitive groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very unhealthy";
  return "Hazardous";
}

export function PersonalRiskCalculator({ aqi, locationName, sourceLabel, provenance, profile, onProfileChange }: {
  aqi: number | null;
  locationName: string;
  sourceLabel: string;
  provenance: "station-observation" | "modeled-estimate" | null;
  profile: RiskProfile;
  onProfileChange: (profile: RiskProfile) => void;
}) {
  const [guidanceOpen, setGuidanceOpen] = useState(false);
  const score = useMemo(() => aqi === null ? null : Math.round(aqi * weightFor("age", profile.age) * weightFor("health", profile.health) * weightFor("activity", profile.activity) * weightFor("exposure", profile.exposure)), [aqi, profile]);
  const sensitive = profile.age !== "adult" || profile.health !== "none";
  const needsCaution = aqi !== null && (aqi > 100 || (sensitive && aqi > 50));

  function setField<K extends OptionKey>(key: K, value: RiskProfile[K]) {
    onProfileChange({ ...profile, [key]: value });
  }

  return (
    <section className="risk-calculator-card">
      <div className="risk-card-heading">
        <div><span className="risk-eyebrow"><HeartPulse size={13}/> PERSONAL EXPOSURE ENGINE</span><h2>Risk is personal.</h2><p>Adjust the profile to see how activity and time outdoors change your relative exposure score.</p></div>
        <span className="risk-location-tag">{locationName}</span>
      </div>

      <div className="risk-profile-grid">
        {(Object.keys(OPTIONS) as OptionKey[]).map((key) => (
          <label className="risk-field" key={key}>
            <span>{key === "age" ? "AGE GROUP" : key === "health" ? "HEALTH CONTEXT" : key === "activity" ? "OUTDOOR ACTIVITY" : "TIME OUTDOORS"}</span>
            <select value={profile[key]} onChange={(event) => setField(key, event.target.value as RiskProfile[typeof key])}>
              {OPTIONS[key].map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        ))}
      </div>

      <div className="risk-score-row">
        <div><span className="risk-eyebrow">WEIGHTED RELATIVE SCORE</span><strong>{score === null ? "—" : score}</strong><small>Composite AQI {aqi === null ? "unavailable" : `${Math.round(aqi)} · ${category(aqi)}`}</small></div>
        <button type="button" className="risk-guidance-button" onClick={() => setGuidanceOpen(true)}>View personal guidance <ArrowUpRight size={15}/></button>
      </div>
      <div className="risk-source-note"><span className={provenance === "station-observation" ? "risk-source-dot station" : "risk-source-dot model"}/><span>{sourceLabel}</span><span>{provenance === "station-observation" ? "GROUND STATION" : provenance === "modeled-estimate" ? "MODEL ESTIMATE" : "NO SOURCE"}</span></div>

      <AnimatePresence>
        {guidanceOpen && <>
          <motion.button className="risk-drawer-backdrop" type="button" aria-label="Close personal guidance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setGuidanceOpen(false)}/>
          <motion.aside className="risk-guidance-drawer" role="dialog" aria-modal="true" aria-labelledby="risk-guidance-title" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 270, damping: 30 }}>
            <div className="risk-drawer-heading"><span className="risk-eyebrow"><ShieldAlert size={14}/> GENERAL HEALTH CONTEXT</span><button type="button" aria-label="Close" onClick={() => setGuidanceOpen(false)}><X size={18}/></button></div>
            <h2 id="risk-guidance-title">Your exposure picture</h2>
            <p className="risk-drawer-score">{score === null ? "No AQI available" : `Relative exposure score · ${score}`}</p>
            {aqi === null ? <p>Current AQI is unavailable from the selected source. Review individual pollutant readings and follow local air-quality guidance.</p> : needsCaution ? <p>Air quality is {category(aqi).toLowerCase()}. {sensitive ? "Your selected age or health context may increase sensitivity. Consider reducing prolonged or intense outdoor exertion, especially during peak pollution periods." : "Consider reducing prolonged or intense outdoor exertion, especially during peak pollution periods."}</p> : <p>Current AQI is {category(aqi).toLowerCase()}. Usual outdoor activity is generally reasonable for many people; sensitive individuals should follow their personal care plan and local advisories.</p>}
            <div className="risk-callout"><strong>Practical precautions</strong><ul><li>Choose a lighter activity or shorten time outdoors when readings rise.</li><li>Keep windows closed during local pollution peaks; use filtration if available.</li><li>If you develop symptoms, move to cleaner air and follow advice from a qualified clinician.</li></ul></div>
            <p className="risk-disclaimer">This is an informational exposure estimate, not a clinical assessment or medical advice. It uses the selected AQI source and profile weights; it does not replace local public-health guidance.</p>
          </motion.aside>
        </>}
      </AnimatePresence>
    </section>
  );
}
