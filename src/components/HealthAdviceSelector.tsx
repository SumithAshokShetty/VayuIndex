"use client";

import React, { useState } from "react";
import {
  Activity,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export type HealthConditionKey =
  | "asthma"
  | "heart"
  | "allergies"
  | "sinus"
  | "cold_flu"
  | "copd";

interface ConditionData {
  key: HealthConditionKey;
  label: string;
  iconName: string;
  riskSeverity: (aqi: number) => { label: string; level: "low" | "mild" | "moderate" | "high" | "severe"; color: string };
  dos: string[];
  donts: string[];
  clinicalNote: string;
}

const CONDITIONS: ConditionData[] = [
  {
    key: "asthma",
    label: "Asthma",
    iconName: "lungs",
    riskSeverity: (aqi) => {
      if (aqi > 200) return { label: "High Risk of Severe Asthma Bronchospasms", level: "severe", color: "#dc2626" };
      if (aqi > 150) return { label: "Moderate to High Risk of Asthma Flare-ups", level: "high", color: "#ef4444" };
      if (aqi > 100) return { label: "Mild Chances of Asthma Irritation", level: "moderate", color: "#f59e0b" };
      return { label: "Low Risk of Asthma Episodes", level: "low", color: "#10b981" };
    },
    dos: [
      "Carry quick-relief rescue inhaler (Albuterol/Salbutamol) at all times.",
      "Run True HEPA air filtration indoors, especially during night sleep.",
      "Monitor Peak Expiratory Flow (PEF) readings twice daily during spikes.",
      "Wear a tightly fitted N95 mask if transitioning through traffic zones.",
      "Rinse nasal passages with isotonic saline spray after returning indoors.",
    ],
    donts: [
      "Do NOT jog, cycle, or perform vigorous aerobic exercises outdoors.",
      "Do NOT skip daily inhaled corticosteroid controller medications.",
      "Do NOT open windows during peak morning and evening inversion hours.",
      "Do NOT burn incense sticks, scented candles, or mosquito coils.",
      "Do NOT ignore early warning signs like chest tightness or persistent wheezing.",
    ],
    clinicalNote: "Particulate matter PM2.5 penetrates past terminal bronchioles, triggering airway eosinophil influx and acute bronchoconstriction.",
  },
  {
    key: "heart",
    label: "Heart Issues",
    iconName: "heart",
    riskSeverity: (aqi) => {
      if (aqi > 200) return { label: "Severe Threat of Cardiovascular Events", level: "severe", color: "#dc2626" };
      if (aqi > 150) return { label: "Elevated Risk of Arrhythmia & BP Spikes", level: "high", color: "#ef4444" };
      if (aqi > 100) return { label: "Mild Chances of Heart Strain", level: "moderate", color: "#f59e0b" };
      return { label: "Nominal Cardiac Stress Level", level: "low", color: "#10b981" };
    },
    dos: [
      "Keep blood pressure readings logged morning and evening.",
      "Strictly adhere to prescribed beta-blockers, statins, or anticoagulants.",
      "Stay well-hydrated to reduce systemic blood viscosity.",
      "Opt for gentle indoor mobility exercises in air-purified rooms.",
      "Seek emergency medical evaluation if chest pressure or radiating pain occurs.",
    ],
    donts: [
      "Do NOT engage in heavy isometric straining or lifting outdoors.",
      "Do NOT commute along congested arterial roads during peak rush hours.",
      "Do NOT consume high-sodium processed foods that further elevate blood pressure.",
      "Do NOT disregard sudden palpitations, dizziness, or unusual fatigue.",
    ],
    clinicalNote: "Inhaled ultrafine particulate matter crosses the alveolar-capillary barrier into bloodstream, accelerating arterial plaque instability and autonomic vasoconstriction.",
  },
  {
    key: "allergies",
    label: "Allergies",
    iconName: "stethoscope",
    riskSeverity: (aqi) => {
      if (aqi > 150) return { label: "High Risk of Allergic Rhinitis & Conjunctivitis", level: "high", color: "#ef4444" };
      if (aqi > 100) return { label: "Moderate Allergic Mucosal Sensitivity", level: "moderate", color: "#f59e0b" };
      return { label: "Low Allergic Trigger Environment", level: "low", color: "#10b981" };
    },
    dos: [
      "Wash face, eyelashes, and exposed skin immediately upon arriving home.",
      "Use protective wraparound eyeglasses or sunglasses when stepping outdoors.",
      "Take prescribed non-drowsy antihistamines proactively before peak exposure.",
      "Keep clean bedding and run HEPA room air purification.",
    ],
    donts: [
      "Do NOT dry freshly laundered clothes outdoors on open balconies.",
      "Do NOT rub itchy eyes with unwashed fingers (prevents secondary infection).",
      "Do NOT leave bedroom windows open during dry, breezy afternoons.",
    ],
    clinicalNote: "Synergistic interaction between nitrogen dioxide (NO2) and airborne allergens chemically ruptures pollen grains, multiplying allergenicity.",
  },
  {
    key: "sinus",
    label: "Sinus",
    iconName: "activity",
    riskSeverity: (aqi) => {
      if (aqi > 150) return { label: "Elevated Risk of Acute Sinus Congestion", level: "high", color: "#ef4444" };
      if (aqi > 100) return { label: "Mild Chances of Sinus Headaches", level: "moderate", color: "#f59e0b" };
      return { label: "Optimal Sinus Clearance Conditions", level: "low", color: "#10b981" };
    },
    dos: [
      "Practice warm steam inhalation with plain sterile water for 5–10 minutes.",
      "Keep indoor humidity between 40% and 55% using an ultrasonic humidifier.",
      "Drink warm fluids like herbal tea, ginger water, or warm broths.",
      "Keep nasal passages moisturized with saline drops.",
    ],
    donts: [
      "Do NOT overuse OTC vasoconstrictor decongestant sprays (> 3 consecutive days).",
      "Do NOT smoke cigarettes or linger near secondary passive smoke.",
      "Do NOT sleep directly in front of unfiltered dry air conditioner vents.",
    ],
    clinicalNote: "Sulfur dioxide and coarse particulate matter cause ciliary paralysis in paranasal sinuses, blocking natural mucus drainage.",
  },
  {
    key: "cold_flu",
    label: "Cold/Flu",
    iconName: "thermometer",
    riskSeverity: (aqi) => {
      if (aqi > 150) return { label: "High Risk of Prolonged Respiratory Infection", level: "high", color: "#ef4444" };
      if (aqi > 100) return { label: "Moderate Susceptibility to Airborne Pathogens", level: "moderate", color: "#f59e0b" };
      return { label: "Standard Immune Defense Capacity", level: "low", color: "#10b981" };
    },
    dos: [
      "Prioritize 8+ hours of restorative sleep to reinforce immune antibodies.",
      "Gargle with warm salt water to soothe irritated pharyngeal tissues.",
      "Maintain high dietary intake of Vitamin C and bioflavonoid antioxidants.",
      "Rest indoors until active coughing and nasal congestion subside.",
    ],
    donts: [
      "Do NOT exert physical energy or push through fever and chills.",
      "Do NOT share eating utensils or cups in poorly ventilated indoor zones.",
      "Do NOT expose recovering lungs to cold evening particulate smoke.",
    ],
    clinicalNote: "Particulate smog suppresses pulmonary alveolar macrophage phagocytosis, impairing the lung's first line of immune defense against viral proliferation.",
  },
  {
    key: "copd",
    label: "Chronic (COPD)",
    iconName: "shield",
    riskSeverity: (aqi) => {
      if (aqi > 150) return { label: "Extreme Danger of Acute COPD Exacerbation", level: "severe", color: "#dc2626" };
      if (aqi > 100) return { label: "Elevated Risk of Hypoxia & Lung Fatigue", level: "high", color: "#ef4444" };
      return { label: "Moderate COPD Vigilance Advised", level: "moderate", color: "#f59e0b" };
    },
    dos: [
      "Maintain continuous access to portable supplemental oxygen if prescribed.",
      "Perform prescribed pursed-lip breathing exercises to maximize gas exchange.",
      "Keep emergency contact numbers for your pulmonologist on speed dial.",
      "Ensure all bronchodilator and muscarinic antagonist doses are taken on schedule.",
    ],
    donts: [
      "Do NOT step outdoors unless strictly unavoidable during high-smog episodes.",
      "Do NOT rely on surgical or cloth masks (only certified N95/FFP2 filter PM2.5).",
      "Do NOT delay hospital presentation if finger pulse oximeter reads below 90%.",
    ],
    clinicalNote: "Chronic bronchitis and emphysema patients possess severely diminished functional reserve, making acute PM2.5 spikes a primary trigger for emergency hospitalization.",
  },
];

export function HealthAdviceSelector({ aqi = 145 }: { aqi?: number }) {
  const [selectedKey, setSelectedKey] = useState<HealthConditionKey>("asthma");

  const activeCondition = CONDITIONS.find((c) => c.key === selectedKey) || CONDITIONS[0];
  const severity = activeCondition.riskSeverity(aqi);

  return (
    <section className="health-advice-section w-full rounded-2xl border border-neutral-800 bg-neutral-900/90 backdrop-blur-md p-6 sm:p-8 shadow-xl text-white">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-neutral-800 pb-4 mb-6">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase flex items-center gap-2">
            <Activity size={14} className="text-emerald-400" />
            DISEASE &amp; HEALTH CONDITION CLINICAL ADVICE
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
            Prevent Health Problems: <em className="text-emerald-400 not-italic">Understand Your Risk</em>
          </h2>
        </div>
        <span className="text-xs font-mono px-3 py-1 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
          Targeted Clinical Protocols
        </span>
      </div>

      {/* Pill Switcher Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CONDITIONS.map((cond) => {
          const isSelected = cond.key === selectedKey;
          return (
            <button
              key={cond.key}
              type="button"
              onClick={() => setSelectedKey(cond.key)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border ${
                isSelected
                  ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                  : "bg-neutral-950/70 text-neutral-400 hover:text-white border-neutral-800"
              }`}
            >
              {cond.label}
            </button>
          );
        })}
      </div>

      {/* Severity Banner */}
      <div className="mt-6 p-4 sm:p-5 rounded-xl border border-neutral-800 bg-neutral-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
        <div className="flex items-center gap-3">
          <span
            className="w-3.5 h-3.5 rounded-full flex-none animate-pulse"
            style={{ backgroundColor: severity.color }}
          />
          <div>
            <span className="text-xs font-mono uppercase tracking-wider font-bold text-neutral-400">
              CONDITION RISK STATUS · AQI {Math.round(aqi)}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-white">
              {severity.label}
            </h3>
          </div>
        </div>
        <span className="text-xs font-mono px-3 py-1.5 rounded-md font-bold self-start sm:self-auto bg-neutral-900 border border-neutral-800 text-neutral-200">
          Severity: {severity.level.toUpperCase()}
        </span>
      </div>

      {/* Do's and Don'ts Two-Column Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* DO'S Column */}
        <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={20} className="text-emerald-400" />
              <h4 className="text-base font-bold text-emerald-300 font-mono tracking-wide">
                RECOMMENDED DO&apos;S
              </h4>
            </div>
            <ul className="space-y-3">
              {activeCondition.dos.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-200 leading-relaxed">
                  <span className="text-emerald-400 font-bold mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* DON'TS Column */}
        <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-950/20 flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <XCircle size={20} className="text-rose-400" />
              <h4 className="text-base font-bold text-rose-300 font-mono tracking-wide">
                STRICT DON&apos;TS &amp; AVOIDANCES
              </h4>
            </div>
            <ul className="space-y-3">
              {activeCondition.donts.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-200 leading-relaxed">
                  <span className="text-rose-400 font-bold mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Clinical Mechanism Footnote */}
      <div className="mt-6 p-4 rounded-xl border border-neutral-800 bg-neutral-950/70 text-xs text-neutral-400 leading-relaxed">
        <strong>Pathophysiology Note:</strong> {activeCondition.clinicalNote}
      </div>
    </section>
  );
}

export default HealthAdviceSelector;
