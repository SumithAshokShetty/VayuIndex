"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  HeartPulse,
  Info,
  LocateFixed,
  MapPin,
  Pill,
  Shield,
  ShieldAlert,
  Sparkles,
  SunMedium,
  Wind,
  X,
  Zap,
} from "lucide-react";
import type { AirQualityResponse, Location } from "@/lib/types";

export type RiskProfile = {
  age: "child" | "adult" | "senior";
  health: "none" | "respiratory" | "cardiovascular";
  activity: "light" | "moderate" | "heavy";
  exposure: "under1" | "oneToThree" | "over3";
};

const OPTIONS = {
  age: [
    { value: "child", label: "Child (0–17)", weight: 1.35, desc: "Developing lungs, higher ventilation / kg" },
    { value: "adult", label: "Adult (18–64)", weight: 1.0, desc: "Standard physiological baseline" },
    { value: "senior", label: "Senior (65+)", weight: 1.4, desc: "Vascular stiffness, reduced ciliary clearance" },
  ],
  health: [
    { value: "none", label: "No known condition", weight: 1.0, desc: "Normal compensatory buffering" },
    { value: "respiratory", label: "Respiratory / asthma", weight: 1.65, desc: "Bronchial hyper-reactivity, airway spasms" },
    { value: "cardiovascular", label: "Cardiovascular", weight: 1.5, desc: "Endothelial stress, elevated cardiac workload" },
  ],
  activity: [
    { value: "light", label: "Light (Rest / Walk)", weight: 1.0, desc: "~7.5 L/min · Nasal filtration intact" },
    { value: "moderate", label: "Moderate (Brisk walk / Commute)", weight: 1.3, desc: "~24 L/min · Partial oral breathing" },
    { value: "heavy", label: "Heavy (Running / Sports)", weight: 1.75, desc: "~65 L/min · Direct oral alveolar influx" },
  ],
  exposure: [
    { value: "under1", label: "Under 1 hour", weight: 1.0, desc: "~45 min active window" },
    { value: "oneToThree", label: "1–3 hours", weight: 1.25, desc: "~2 hours prolonged exposure" },
    { value: "over3", label: "3+ hours", weight: 1.6, desc: "~4.5 hours chronic accumulation" },
  ],
} as const;

type OptionKey = keyof typeof OPTIONS;

const VENTILATION_RATES = {
  light: { lpm: 7.5, m3h: 0.45, label: "Light / Resting" },
  moderate: { lpm: 24.0, m3h: 1.44, label: "Moderate Exertion" },
  heavy: { lpm: 65.0, m3h: 3.90, label: "Heavy Exertion" },
} as const;

const DURATION_HOURS = {
  under1: 0.75,
  oneToThree: 2.0,
  over3: 4.5,
} as const;

function weightFor<K extends OptionKey>(key: K, value: RiskProfile[K]) {
  const option = (OPTIONS[key] as readonly { value: string; weight: number }[]).find((item) => item.value === value);
  return option?.weight ?? 1;
}

function category(aqi: number) {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

function getScoreTier(score: number) {
  if (score >= 800) {
    return {
      tier: "Critical Hazardous Cellular Threat",
      accent: "#b91c1c",
      border: "rgba(185, 28, 28, 0.3)",
      bg: "rgba(185, 28, 28, 0.08)",
      badge: "ACUTE SYSTEMIC INFLUX",
      summary: "Inhalation under this composite score exceeds physiological safety buffers. Acute particulate deposition provokes rapid bronchial inflammation, microvascular strain, and cellular oxidative damage.",
    };
  }
  if (score >= 500) {
    return {
      tier: "Severe Toxic Inhalation Burden",
      accent: "#c2410c",
      border: "rgba(194, 65, 12, 0.3)",
      bg: "rgba(194, 65, 12, 0.08)",
      badge: "HIGH CARDIOPULMONARY BURDEN",
      summary: "Sustained particulate deposition triggers deep alveolar penetration, mast-cell histamine cascade, and significant bronchial restriction in sensitive airways.",
    };
  }
  if (score >= 250) {
    return {
      tier: "High Vulnerability Index",
      accent: "#b45309",
      border: "rgba(180, 83, 9, 0.3)",
      bg: "rgba(180, 83, 9, 0.08)",
      badge: "ELEVATED PHYSIOLOGICAL STRESS",
      summary: "Noticeable airway resistance and heightened inflammatory cytokines occur, especially during outdoor physical exertion or with pre-existing conditions.",
    };
  }
  if (score >= 100) {
    return {
      tier: "Moderate Environmental Stress",
      accent: "#166534",
      border: "rgba(22, 101, 52, 0.3)",
      bg: "rgba(22, 101, 52, 0.08)",
      badge: "MILD INFLAMMATORY LOAD",
      summary: "Particulate concentration causes subtle upper-airway irritation and oxidative compensation in sensitive or active individuals.",
    };
  }
  return {
    tier: "Low Baseline Impact",
    accent: "#15803d",
    border: "rgba(21, 128, 61, 0.3)",
    bg: "rgba(21, 128, 61, 0.08)",
    badge: "PHYSIOLOGICAL HOMEOSTASIS",
    summary: "Ambient particulate exposure remains within typical physiological clearance capacity with minimal acute pulmonary stress.",
  };
}

export function PersonalRiskCalculator({
  aqi,
  air,
  location,
  locationName,
  sourceLabel,
  provenance,
  profile,
  onProfileChange,
  onDetectLocation,
}: {
  aqi: number | null;
  air?: AirQualityResponse | null;
  location?: Location;
  locationName: string;
  sourceLabel: string;
  provenance: "station-observation" | "modeled-estimate" | null;
  profile: RiskProfile;
  onProfileChange: (profile: RiskProfile) => void;
  onDetectLocation?: () => void;
}) {
  const [guidanceOpen, setGuidanceOpen] = useState(false);

  const effectiveAqi = useMemo(() => {
    if (typeof aqi === "number" && !Number.isNaN(aqi)) return Math.round(aqi);
    if (typeof air?.current.aqi === "number") return Math.round(air.current.aqi);
    return null;
  }, [aqi, air]);

  const score = useMemo(() => {
    if (effectiveAqi === null) return null;
    return Math.round(
      effectiveAqi *
        weightFor("age", profile.age) *
        weightFor("health", profile.health) *
        weightFor("activity", profile.activity) *
        weightFor("exposure", profile.exposure)
    );
  }, [effectiveAqi, profile]);

  // Determine ambient PM2.5 concentration in ug/m3
  const pm25Concentration = useMemo(() => {
    if (typeof air?.current.pm2_5 === "number" && Number.isFinite(air.current.pm2_5)) {
      return Math.round(air.current.pm2_5 * 10) / 10;
    }
    if (typeof effectiveAqi === "number" && effectiveAqi > 0) {
      if (effectiveAqi <= 50) return Math.round((effectiveAqi * 12.0 / 50) * 10) / 10;
      if (effectiveAqi <= 100) return Math.round((12.1 + (effectiveAqi - 50) * 23.3 / 50) * 10) / 10;
      if (effectiveAqi <= 150) return Math.round((35.5 + (effectiveAqi - 100) * 19.9 / 50) * 10) / 10;
      if (effectiveAqi <= 200) return Math.round((55.5 + (effectiveAqi - 150) * 94.9 / 50) * 10) / 10;
      if (effectiveAqi <= 300) return Math.round((150.5 + (effectiveAqi - 200) * 99.9 / 100) * 10) / 10;
      return Math.round((250.5 + (effectiveAqi - 300) * 249.9 / 200) * 10) / 10;
    }
    return 65.0;
  }, [air, effectiveAqi]);

  // Biometric dosimetry computations
  const durationHours = DURATION_HOURS[profile.exposure];
  const ventData = VENTILATION_RATES[profile.activity];
  const airVolumeM3 = Math.round(ventData.m3h * durationHours * 100) / 100;
  const inhaledPm25Ug = Math.round(airVolumeM3 * pm25Concentration * 10) / 10;
  // Berkeley Earth formula: ~22 ug/m3 over 24h (~484 ug PM2.5 inhaled) ~ 1 cigarette
  const cigaretteEquiv = Math.max(0.1, Math.round((inhaledPm25Ug / 484) * 10) / 10);
  const whoSafeThresholdUg = Math.round(airVolumeM3 * 5 * 10) / 10; // WHO 24h annual guideline 5 ug/m3
  const riskMultiplier = Math.round((inhaledPm25Ug / Math.max(0.1, whoSafeThresholdUg)) * 10) / 10;

  const scoreTier = score ? getScoreTier(score) : null;
  const resolvedCity = location?.name || locationName || "Your Area";
  const resolvedRegion = location?.admin ? `${location.admin}, ${location.country || ""}` : (location?.country || "Current Airshed");

  function setField<K extends OptionKey>(key: K, value: RiskProfile[K]) {
    onProfileChange({ ...profile, [key]: value });
  }

  return (
    <section className="risk-calculator-card">
      <div className="risk-card-heading">
        <div>
          <span className="risk-eyebrow">
            <HeartPulse size={13} /> PERSONAL EXPOSURE ENGINE
          </span>
          <h2>Risk is personal.</h2>
          <p>
            Adjust your biological profile, pre-existing sensitivities, and exertion level to see how ambient air in{" "}
            <strong>{resolvedCity}</strong> alters your personal exposure burden.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onDetectLocation && (
            <button
              type="button"
              onClick={onDetectLocation}
              title="Sync with current GPS location"
              className="risk-location-detect-icon"
              aria-label="Detect GPS Location"
            >
              <LocateFixed size={13} />
            </button>
          )}
          <span className="risk-location-tag" title={resolvedRegion}>
            {resolvedCity}
          </span>
        </div>
      </div>

      <div className="risk-profile-grid">
        {(Object.keys(OPTIONS) as OptionKey[]).map((key) => (
          <label className="risk-field" key={key}>
            <span>
              {key === "age"
                ? "AGE GROUP"
                : key === "health"
                ? "HEALTH CONTEXT"
                : key === "activity"
                ? "OUTDOOR ACTIVITY"
                : "TIME OUTDOORS"}
            </span>
            <select
              value={profile[key]}
              onChange={(event) => setField(key, event.target.value as RiskProfile[typeof key])}
            >
              {OPTIONS[key].map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <div className="risk-score-row">
        <div>
          <span className="risk-eyebrow">WEIGHTED RELATIVE SCORE</span>
          <strong>{score === null ? "—" : score}</strong>
          <small>
            Composite AQI {effectiveAqi === null ? "unavailable" : `${effectiveAqi} · ${category(effectiveAqi)}`} in{" "}
            {resolvedCity}
          </small>
        </div>
        <button
          type="button"
          className="risk-guidance-button"
          onClick={() => setGuidanceOpen(true)}
        >
          View personal guidance <ArrowUpRight size={15} />
        </button>
      </div>

      <div className="risk-source-note">
        <span
          className={
            provenance === "station-observation"
              ? "risk-source-dot station"
              : "risk-source-dot model"
          }
        />
        <span>{sourceLabel}</span>
        <span>
          {provenance === "station-observation"
            ? "GROUND STATION OBSERVATION"
            : provenance === "modeled-estimate"
            ? "MODEL ESTIMATE"
            : "LIVE AIRSHED"}
        </span>
      </div>

      {/* Deeply Personalized & Location-Grounded Guidance Drawer */}
      <AnimatePresence>
        {guidanceOpen && (
          <>
            <motion.button
              className="risk-drawer-backdrop"
              type="button"
              aria-label="Close personal guidance"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setGuidanceOpen(false)}
            />
            <motion.aside
              className="risk-guidance-drawer"
              role="dialog"
              aria-modal="true"
              aria-labelledby="risk-guidance-title"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 32 }}
            >
              {/* Drawer Top Bar */}
              <div className="risk-drawer-heading">
                <span className="risk-eyebrow">
                  <ShieldAlert size={14} /> CLINICAL EXPOSURE DOSSIER
                </span>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setGuidanceOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Title & Airshed Pin */}
              <h2 id="risk-guidance-title">Personal Risk Analysis</h2>
              <div className="risk-drawer-airshed-tag">
                <MapPin size={13} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span>
                  <strong>{resolvedCity}</strong> · {resolvedRegion}
                </span>
                <span className="risk-drawer-airshed-reading">
                  PM₂.₅: <strong>{pm25Concentration} µg/m³</strong> (AQI {effectiveAqi ?? "—"})
                </span>
              </div>

              {/* Main Score Hero Card */}
              {scoreTier && (
                <div
                  className="risk-drawer-score-hero"
                  style={{
                    backgroundColor: scoreTier.bg,
                    borderColor: scoreTier.border,
                  }}
                >
                  <div className="risk-drawer-score-top">
                    <div>
                      <span className="risk-drawer-badge" style={{ color: scoreTier.accent }}>
                        {scoreTier.badge}
                      </span>
                      <h3 style={{ color: scoreTier.accent }}>{scoreTier.tier}</h3>
                    </div>
                    <div className="risk-drawer-big-score" style={{ color: scoreTier.accent }}>
                      {score}
                    </div>
                  </div>
                  <p className="risk-drawer-score-summary">{scoreTier.summary}</p>

                  {/* Active Profile Vector Chips */}
                  <div className="risk-profile-chips">
                    <span className="risk-chip">
                      <strong>Age:</strong> {profile.age === "child" ? "Child (1.35× load)" : profile.age === "senior" ? "Senior (1.4× load)" : "Adult (1.0×)"}
                    </span>
                    <span className="risk-chip">
                      <strong>Condition:</strong> {profile.health === "respiratory" ? "Asthma / Respiratory (+65%)" : profile.health === "cardiovascular" ? "Cardiovascular (+50%)" : "No Condition (1.0×)"}
                    </span>
                    <span className="risk-chip">
                      <strong>Activity:</strong> {ventData.label}
                    </span>
                    <span className="risk-chip">
                      <strong>Window:</strong> ~{durationHours * 60} min ({profile.exposure === "under1" ? "< 1 Hour" : profile.exposure === "oneToThree" ? "1–3 Hours" : "3+ Hours"})
                    </span>
                  </div>
                </div>
              )}

              {/* Inhalation Biometric Dosimetry Grid */}
              <div className="risk-biometrics-container">
                <span className="risk-section-eyebrow">
                  <Activity size={13} /> ESTIMATED INHALATION METRICS FOR THIS SESSION
                </span>
                <div className="risk-biometrics-grid">
                  <div className="risk-biometric-card">
                    <span className="risk-bio-label">INHALED PM₂.₅ MASS</span>
                    <strong className="risk-bio-value text-red-600 dark:text-red-400">
                      {inhaledPm25Ug} <span className="text-xs font-normal">µg</span>
                    </strong>
                    <small>Mass deposited directly into your bronchial airways</small>
                  </div>

                  <div className="risk-biometric-card">
                    <span className="risk-bio-label">RESPIRATORY VOLUME</span>
                    <strong className="risk-bio-value text-emerald-800 dark:text-emerald-300">
                      {airVolumeM3} <span className="text-xs font-normal">m³</span>
                    </strong>
                    <small>~{Math.round(airVolumeM3 * 1000)} Liters breathed during this window</small>
                  </div>

                  <div className="risk-biometric-card">
                    <span className="risk-bio-label">CIGARETTE EQUIVALENT</span>
                    <strong className="risk-bio-value text-amber-700 dark:text-amber-400">
                      ~{cigaretteEquiv} <span className="text-xs font-normal">cigs</span>
                    </strong>
                    <small>Berkeley Earth acute particulate intake benchmark</small>
                  </div>

                  <div className="risk-biometric-card">
                    <span className="risk-bio-label">WHO BASELINE MULTIPLIER</span>
                    <strong className="risk-bio-value text-red-700 dark:text-red-300">
                      {riskMultiplier}× <span className="text-xs font-normal">excess</span>
                    </strong>
                    <small>Exceedance over WHO clean air reference baseline</small>
                  </div>
                </div>
              </div>

              {/* Condition-Specific Clinical Physiology */}
              <div className="risk-clinical-section">
                <span className="risk-section-eyebrow">
                  <HeartPulse size={13} /> PHYSIOLOGICAL IMPACT ON YOUR BODY
                </span>

                {profile.health === "respiratory" && (
                  <div className="risk-clinical-block">
                    <h4>
                      <AlertTriangle size={15} className="text-red-600 inline mr-1.5" />
                      Respiratory & Asthmatic Airway Mechanics
                    </h4>
                    <p>
                      In <strong>{resolvedCity}</strong>, ambient PM₂.₅ combustion aerosols bypass your nasopharyngeal
                      filtration and lodge in secondary and terminal bronchioles. Under your elevated relative score of{" "}
                      <strong>{score}</strong>, inhaled fine particulates trigger immediate mast cell degranulation,
                      histamine secretion, and eosinophilic airway inflammation.
                    </p>
                    <p>
                      Because your activity is set to <strong>{ventData.label}</strong>, deeper oral ventilation bypasses
                      the humidification and filtering of nasal turbinates. This increases particle collision frequency at
                      bronchial bifurcations, accelerating the risk of acute bronchospasm, dry persistent coughing, and
                      sudden drops in peak expiratory flow (PEF).
                    </p>
                  </div>
                )}

                {profile.health === "cardiovascular" && (
                  <div className="risk-clinical-block">
                    <h4>
                      <HeartPulse size={15} className="text-red-600 inline mr-1.5" />
                      Cardiovascular & Hemodynamic Stress
                    </h4>
                    <p>
                      Inhaled ultra-fine particulates (&lt; 0.1 µm) translocate directly across the alveolar-capillary
                      membrane into arterial blood circulation in <strong>{resolvedCity}</strong>. At a personal risk score
                      of <strong>{score}</strong>, this triggers acute endothelial dysfunction, systemic oxidative stress,
                      and increased blood viscosity.
                    </p>
                    <p>
                      Simultaneously, pulmonary autonomic reflexes stimulate sympathetic nerve tone, elevating resting
                      heart rate and arterial blood pressure while reducing Heart Rate Variability (HRV). For
                      cardiovascular patients, this sharply amplifies myocardial oxygen demand.
                    </p>
                  </div>
                )}

                {profile.health === "none" && (
                  <div className="risk-clinical-block">
                    <h4>
                      <Shield size={15} className="text-emerald-700 inline mr-1.5" />
                      Systemic Airway Defense & Inflammatory Load
                    </h4>
                    <p>
                      Although you have no diagnosed chronic conditions, an exposure score of <strong>{score}</strong> in{" "}
                      <strong>{resolvedCity}</strong> places substantial burden on your alveolar macrophages and
                      mucociliary escalator. Inhaling ~{inhaledPm25Ug} µg of PM₂.₅ over ~{durationHours * 60} minutes
                      causes transient alveolar membrane inflammation and throat irritation.
                    </p>
                  </div>
                )}

                {/* Age-Specific Factor */}
                <div className="risk-age-factor">
                  <strong>Age Factor ({profile.age.toUpperCase()}):</strong>{" "}
                  {profile.age === "child"
                    ? `Children inhale up to 50% more air per kilogram of body mass than adults, and their alveolar branching is actively developing. Exposure in ${resolvedCity} can impact long-term lung parenchyma growth.`
                    : profile.age === "senior"
                    ? `Aging respiratory defenses (reduced ciliary clearance and loss of chest wall elasticity) make particulate clearance significantly slower, heightening systemic vascular inflammation.`
                    : `As an adult, physiological clearance functions normally, but increased exertion accelerates particulate deposition deep into lower respiratory units.`}
                </div>
              </div>

              {/* Local Airshed & Inversion Advisory */}
              <div className="risk-local-inversion-block">
                <span className="risk-section-eyebrow">
                  <Wind size={13} /> {resolvedCity.toUpperCase()} AIRSHED DYNAMICS & INVERSION
                </span>
                <div className="risk-inversion-content">
                  <p>
                    The local planetary boundary layer over <strong>{resolvedCity}</strong> experiences pronounced diurnal
                    thermal inversion:
                  </p>
                  <ul>
                    <li>
                      <strong>Morning & Evening Trapping (7:00 AM – 9:30 AM & 8:00 PM – 11:30 PM):</strong> Nocturnal
                      radiation cooling traps vehicular exhausts and ground emissions beneath a cold stagnant air ceiling,
                      spiking surface PM₂.₅ concentrations.
                    </li>
                    <li>
                      <strong>Recommended Safe Outdoor Window (1:00 PM – 4:30 PM):</strong> Daytime solar insolation breaks
                      the surface inversion layer, creating thermal convective mixing that dilutes surface pollutants to
                      their diurnal minimum.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Tailored Clinical Action Checklist */}
              <div className="risk-checklist-container">
                <span className="risk-section-eyebrow">
                  <ShieldAlert size={13} /> ACTIONABLE DEFENSE PROTOCOL FOR YOU
                </span>
                <ul className="risk-checklist-items">
                  <li>
                    <div className="risk-chk-icon">
                      <Shield size={15} />
                    </div>
                    <div>
                      <strong>Wear a Certified N95 / FFP2 Respirator Outdoors:</strong>
                      <p>
                        Surgical masks and cloth bandanas seal &lt; 15% against PM₂.₅. In <strong>{resolvedCity}</strong>,
                        use an N95 or FFP2 respirator with an airtight nasal pinch clamp to prevent edge leakage.
                      </p>
                    </div>
                  </li>

                  <li>
                    <div className="risk-chk-icon">
                      <SunMedium size={15} />
                    </div>
                    <div>
                      <strong>Shift Exertion to Afternoon or Indoors:</strong>
                      <p>
                        Postpone high-aerobic activities ({ventData.label}) until after 1:00 PM, or transition to a
                        HEPA-filtered indoor space where particulate counts are kept below 15 µg/m³.
                      </p>
                    </div>
                  </li>

                  {profile.health === "respiratory" && (
                    <li>
                      <div className="risk-chk-icon">
                        <Pill size={15} />
                      </div>
                      <div>
                        <strong>Keep Rapid-Acting Inhaler Immediately Accessible:</strong>
                        <p>
                          Keep your prescribed rescue bronchodilator (e.g. Salbutamol / Albuterol) on hand. Pre-treat if
                          advised by your physician before mandatory outdoor transit.
                        </p>
                      </div>
                    </li>
                  )}

                  <li>
                    <div className="risk-chk-icon">
                      <Sparkles size={15} />
                    </div>
                    <div>
                      <strong>Maintain an Indoor Clean Air Refuge:</strong>
                      <p>
                        Latch all exterior windows during peak morning and night hours. Run an air purifier with a true HEPA
                        H13 filter in your bedroom or workspace. Avoid burning incense, coils, or indoor frying.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Biometric Comparison Matrix */}
              <div className="risk-matrix-section">
                <span className="risk-section-eyebrow">
                  <Clock size={13} /> COMPARATIVE EXPOSURE BENCHMARK
                </span>
                <div className="risk-matrix-table-wrap">
                  <table className="risk-matrix-table">
                    <thead>
                      <tr>
                        <th>Scenario</th>
                        <th>Ventilation</th>
                        <th>Inhaled PM₂.₅</th>
                        <th>Relative Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>WHO Safe Clean Air</td>
                        <td>~7.5 L/min</td>
                        <td>~2.8 µg</td>
                        <td>
                          <span className="risk-status-tag clean">Optimal</span>
                        </td>
                      </tr>
                      <tr>
                        <td>Standard Adult (Resting in {resolvedCity})</td>
                        <td>~7.5 L/min</td>
                        <td>{Math.round(0.45 * durationHours * pm25Concentration)} µg</td>
                        <td>
                          <span className="risk-status-tag moderate">Moderate</span>
                        </td>
                      </tr>
                      <tr className="risk-current-user-row">
                        <td>
                          <strong>Your Profile</strong> ({profile.age}, {profile.health === "none" ? "healthy" : profile.health})
                        </td>
                        <td>{ventData.lpm} L/min</td>
                        <td>
                          <strong>{inhaledPm25Ug} µg</strong>
                        </td>
                        <td>
                          <span
                            className="risk-status-tag"
                            style={{
                              backgroundColor: scoreTier?.bg,
                              color: scoreTier?.accent,
                              border: `1px solid ${scoreTier?.border}`,
                            }}
                          >
                            Score {score}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Legal Disclaimer */}
              <p className="risk-disclaimer">
                This personalized dossier provides bio-environmental exposure dosimetry based on WHO Air Quality
                Guidelines (2021) and the Berkeley Earth particulate burden model. It serves informational and risk
                mitigation purposes and does not replace medical advice from a licensed physician or official local
                public health advisories.
              </p>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}