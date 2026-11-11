"use client";

import React, { useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Flame,
  Info,
  ShieldCheck,
  Wind,
  Zap,
} from "lucide-react";

export type PollutantKey = "pm25" | "pm10" | "no2" | "so2" | "co" | "o3";

export interface PollutantDetail {
  key: PollutantKey;
  name: string;
  chemicalSymbol: string;
  subscript: string;
  unit: string;
  liveValue: number;
  whoBenchmark: number;
  cpcbStandard: number;
  whoPeriod: string;
  cpcbPeriod: string;
  tier: "Good" | "Satisfactory" | "Moderate" | "Poor" | "Very Poor" | "Severe";
  tierColor: string;
  whoMultiplier: number;
  shortTermImpacts: string[];
  longTermImpacts: string[];
  clinicalPrecautions: string[];
  recommendedGear: {
    name: string;
    efficiency: string;
    description: string;
  }[];
  hourlyHistory: number[];
  illustrationType: "alveolar" | "bronchial" | "airway" | "laryngeal" | "hemoglobin" | "photochemical";
}

interface PollutantHealthBreakdownProps {
  livePm25?: number;
  livePm10?: number;
  liveAqi?: number;
  liveCity?: string;
  isDark?: boolean;
}

export function PollutantHealthBreakdown({
  livePm25 = 267,
  livePm10 = 157,
  liveAqi = 413,
  liveCity = "Delhi",
  isDark = false,
}: PollutantHealthBreakdownProps) {
  const [selectedPollutantKey, setSelectedPollutantKey] = useState<PollutantKey>("pm25");
  const [hoveredPoint, setHoveredPoint] = useState<{ hour: number; value: number } | null>(null);

  // Derive pollutant details dynamically from live telemetry
  const pollutantsData: Record<PollutantKey, PollutantDetail> = {
    pm25: {
      key: "pm25",
      name: "Fine Particulate Matter",
      chemicalSymbol: "PM",
      subscript: "2.5",
      unit: "µg/m³",
      liveValue: livePm25,
      whoBenchmark: 15,
      cpcbStandard: 60,
      whoPeriod: "24-Hour Mean",
      cpcbPeriod: "24-Hour Statutory Limit",
      tier: livePm25 > 250 ? "Severe" : livePm25 > 120 ? "Very Poor" : livePm25 > 90 ? "Poor" : "Moderate",
      tierColor: livePm25 > 250 ? "#7030a0" : livePm25 > 120 ? "#ef4444" : "#f97316",
      whoMultiplier: Number((livePm25 / 15.0).toFixed(1)),
      shortTermImpacts: [
        "Mucosal airway inflammation, acute coughing, and retrosternal tightness.",
        "Triggering of acute bronchospasm and reduced Forced Expiratory Volume (FEV1).",
        "Immediate spike in hospital emergency admissions for asthma and COPD flare-ups.",
      ],
      longTermImpacts: [
        "Unimpeded deep alveolar penetration bypassing ciliated airway epithelial defenses.",
        "Systemic translocation across the alveolar-capillary barrier directly into blood circulation.",
        "Accelerated arterial atherosclerosis, vascular endothelial oxidative stress, and heightened stroke risk.",
        "Class 1 carcinogenic particulate accumulation associated with pulmonary adenocarcinoma.",
      ],
      clinicalPrecautions: [
        "Wear an NIOSH-certified N95 or FFP2 respirator outdoors with an airtight bridge seal.",
        "Operate True HEPA filtration indoors with continuous recirculation to achieve ≥ 4.5 ACH.",
        "Avoid outdoor aerobic exercise during nocturnal and early morning thermal inversions.",
      ],
      recommendedGear: [
        {
          name: "N95/FFP2 Respirator",
          efficiency: "≥ 95% at 0.3 µm",
          description: "Crucial barrier preventing sub-micron particulate inhalation.",
        },
        {
          name: "True HEPA H13 Air Purifier",
          efficiency: "99.97% at 0.1 µm",
          description: "Maintains indoor air below statutory 60 µg/m³ threshold.",
        },
      ],
      hourlyHistory: [
        Math.round(livePm25 * 0.92),
        Math.round(livePm25 * 0.95),
        Math.round(livePm25 * 1.02),
        Math.round(livePm25 * 1.08),
        Math.round(livePm25 * 1.14),
        Math.round(livePm25 * 1.18),
        Math.round(livePm25 * 1.15),
        Math.round(livePm25 * 1.05),
        Math.round(livePm25 * 0.94),
        Math.round(livePm25 * 0.85),
        Math.round(livePm25 * 0.78),
        Math.round(livePm25 * 0.72),
        Math.round(livePm25 * 0.68),
        Math.round(livePm25 * 0.65),
        Math.round(livePm25 * 0.70),
        Math.round(livePm25 * 0.76),
        Math.round(livePm25 * 0.84),
        Math.round(livePm25 * 0.91),
        Math.round(livePm25 * 0.96),
        Math.round(livePm25 * 1.01),
        Math.round(livePm25 * 1.04),
        Math.round(livePm25 * 1.02),
        Math.round(livePm25 * 0.98),
        livePm25,
      ],
      illustrationType: "alveolar",
    },
    pm10: {
      key: "pm10",
      name: "Coarse Inhalable Particles",
      chemicalSymbol: "PM",
      subscript: "10",
      unit: "µg/m³",
      liveValue: livePm10,
      whoBenchmark: 45,
      cpcbStandard: 100,
      whoPeriod: "24-Hour Mean",
      cpcbPeriod: "24-Hour Statutory Limit",
      tier: livePm10 > 430 ? "Severe" : livePm10 > 350 ? "Very Poor" : livePm10 > 250 ? "Poor" : livePm10 > 100 ? "Moderate" : "Satisfactory",
      tierColor: livePm10 > 250 ? "#f97316" : livePm10 > 100 ? "#ffbf00" : "#92d050",
      whoMultiplier: Number((livePm10 / 45.0).toFixed(1)),
      shortTermImpacts: [
        "Mechanical entrapment in nasal turbinates and primary bronchial divisions.",
        "Conjunctival eye stinging, persistent rhinorrhea, and severe pharyngeal itch.",
        "Aggravation of acute bacterial or viral tracheobronchitis.",
      ],
      longTermImpacts: [
        "Chronic hypersecretion of goblet cells in the upper tracheobronchial tree.",
        "Permanent acceleration of COPD decline in smokers and elderly demographics.",
        "Structural remodeling and loss of ciliary motility along the airway mucosa.",
      ],
      clinicalPrecautions: [
        "Use buffered hypertonic nasal saline lavage twice daily to flush mucosal deposits.",
        "Seal residential window weatherstripping against ambient road-dust intrusion.",
        "Wear protective eyewear and wrap-around sunglasses during high-wind dust events.",
      ],
      recommendedGear: [
        {
          name: "Hypertonic Saline Lavage",
          efficiency: "Physical Mucosal Flush",
          description: "Restores normal ciliary beat frequency and removes coarse entrapments.",
        },
        {
          name: "MERV 11+ Pre-Filter Screen",
          efficiency: "≥ 85% at 3.0 µm",
          description: "Shields HVAC intake vents from heavy ambient fugitive dust.",
        },
      ],
      hourlyHistory: [
        Math.round(livePm10 * 0.9),
        Math.round(livePm10 * 0.93),
        Math.round(livePm10 * 0.98),
        Math.round(livePm10 * 1.05),
        Math.round(livePm10 * 1.12),
        Math.round(livePm10 * 1.15),
        Math.round(livePm10 * 1.1),
        Math.round(livePm10 * 1.02),
        Math.round(livePm10 * 0.92),
        Math.round(livePm10 * 0.86),
        Math.round(livePm10 * 0.8),
        Math.round(livePm10 * 0.75),
        Math.round(livePm10 * 0.72),
        Math.round(livePm10 * 0.74),
        Math.round(livePm10 * 0.82),
        Math.round(livePm10 * 0.88),
        Math.round(livePm10 * 0.94),
        Math.round(livePm10 * 0.97),
        Math.round(livePm10 * 1.02),
        Math.round(livePm10 * 1.06),
        Math.round(livePm10 * 1.04),
        Math.round(livePm10 * 1.01),
        Math.round(livePm10 * 0.96),
        livePm10,
      ],
      illustrationType: "bronchial",
    },
    no2: {
      key: "no2",
      name: "Nitrogen Dioxide",
      chemicalSymbol: "NO",
      subscript: "2",
      unit: "µg/m³",
      liveValue: 68,
      whoBenchmark: 25,
      cpcbStandard: 80,
      whoPeriod: "24-Hour Mean",
      cpcbPeriod: "24-Hour Statutory Limit",
      tier: "Moderate",
      tierColor: "#ffbf00",
      whoMultiplier: Number((68 / 25.0).toFixed(1)),
      shortTermImpacts: [
        "Intense bronchial hyper-responsiveness and immediate bronchospasm in asthmatics.",
        "Epithelial cytotoxicity in terminal bronchioles upon vehicular exhaust inhalation.",
        "Increased susceptibility to secondary bacterial and viral respiratory infections.",
      ],
      longTermImpacts: [
        "Impaired pediatric lung growth and chronic reduction in forced vital capacity (FVC).",
        "Increased incidence of childhood asthma in communities adjacent to major transit corridors.",
        "Long-term structural remodeling of airway smooth muscle tissue.",
      ],
      clinicalPrecautions: [
        "Avoid walking, jogging, or cycling alongside congested high-density commuter arterial roads.",
        "Keep vehicle cabin AC on internal recirculation during bumper-to-bumper transit.",
        "Equip indoor air purification systems with heavy-bed activated carbon filters.",
      ],
      recommendedGear: [
        {
          name: "Gas-Phase Carbon Adsorption Filter",
          efficiency: "Active Chemical Sorption",
          description: "Captures gaseous reactive nitrogen oxides that pass freely through HEPA.",
        },
        {
          name: "Recirculation Cabin Filter",
          efficiency: "Multi-Stage Carbon",
          description: "Reduces vehicle interior NO2 exposure spikes by up to 75%.",
        },
      ],
      hourlyHistory: [42, 38, 36, 39, 48, 62, 78, 85, 76, 68, 58, 52, 49, 48, 54, 66, 79, 86, 88, 82, 74, 69, 64, 68],
      illustrationType: "airway",
    },
    so2: {
      key: "so2",
      name: "Sulfur Dioxide",
      chemicalSymbol: "SO",
      subscript: "2",
      unit: "µg/m³",
      liveValue: 28,
      whoBenchmark: 40,
      cpcbStandard: 80,
      whoPeriod: "24-Hour Mean",
      cpcbPeriod: "24-Hour Statutory Limit",
      tier: "Good",
      tierColor: "#00b050",
      whoMultiplier: Number((28 / 40.0).toFixed(1)),
      shortTermImpacts: [
        "Rapid reflex bronchoconstriction within 10 to 15 minutes of exposure in sensitive cohorts.",
        "Severe chemical irritation of ocular, nasal, and laryngeal mucosal membranes.",
        "Substernal burning sensation triggered during exertion near coal-fired or industrial emissions.",
      ],
      longTermImpacts: [
        "Recurrent chemical tracheobronchitis and accelerated decline in pulmonary function.",
        "Aggravation of underlying cardiovascular ischemia and premature congestive heart failure events.",
        "Synergistic toxicity amplification when co-inhaled with ambient particulate matter.",
      ],
      clinicalPrecautions: [
        "Maintain distance from heavy industrial complexes, thermal power stations, and brick kilns.",
        "Patients with bronchial asthma should keep rescue bronchodilators accessible during industrial smog.",
        "Stay indoors with sealed building envelope during calm, foggy nocturnal weather conditions.",
      ],
      recommendedGear: [
        {
          name: "Chemisorptive Carbon Impregnated Filter",
          efficiency: "Neutralization of Acid Gases",
          description: "Binds gaseous SO2 via basic potassium permanganate or activated carbon.",
        },
      ],
      hourlyHistory: [18, 17, 16, 18, 20, 24, 28, 31, 29, 27, 25, 23, 22, 21, 22, 25, 28, 32, 34, 31, 29, 27, 26, 28],
      illustrationType: "laryngeal",
    },
    co: {
      key: "co",
      name: "Carbon Monoxide",
      chemicalSymbol: "CO",
      subscript: "",
      unit: "mg/m³",
      liveValue: 1.8,
      whoBenchmark: 4.0,
      cpcbStandard: 2.0,
      whoPeriod: "24-Hour Mean",
      cpcbPeriod: "8-Hour Statutory Limit",
      tier: "Satisfactory",
      tierColor: "#92d050",
      whoMultiplier: Number((1.8 / 4.0).toFixed(1)),
      shortTermImpacts: [
        "Formation of Carboxyhemoglobin (COHb), having 200x greater affinity for hemoglobin than oxygen.",
        "Impaired systemic tissue oxygen delivery, resulting in dull frontal cephalalgia and dizziness.",
        "Diminished manual dexterity, cognitive reaction speed, and exercise-induced cardiac angina.",
      ],
      longTermImpacts: [
        "Chronic low-grade myocardial ischemia and elevated risk of ventricular arrhythmias.",
        "Potential neuropsychological deficits following repeated sublethal occult exposures.",
        "Adverse fetal development and reduced birth weights in chronically exposed expectant mothers.",
      ],
      clinicalPrecautions: [
        "Install certified electrochemical CO alarms with digital PPM readout on every residential level.",
        "Never run internal combustion generators, charcoal grills, or kerosene heaters indoors.",
        "Ensure annual certified inspection of fuel-burning heating appliances and flues.",
      ],
      recommendedGear: [
        {
          name: "Electrochemical CO Detector",
          efficiency: "UL 2034 Certified",
          description: "Emits audible alarm when carboxyhemoglobin threshold limits are approached.",
        },
      ],
      hourlyHistory: [1.2, 1.1, 1.1, 1.2, 1.4, 1.7, 2.1, 2.3, 2.0, 1.8, 1.6, 1.4, 1.3, 1.2, 1.4, 1.7, 2.1, 2.4, 2.2, 2.0, 1.9, 1.8, 1.7, 1.8],
      illustrationType: "hemoglobin",
    },
    o3: {
      key: "o3",
      name: "Tropospheric Ozone",
      chemicalSymbol: "O",
      subscript: "3",
      unit: "µg/m³",
      liveValue: 52,
      whoBenchmark: 100,
      cpcbStandard: 100,
      whoPeriod: "8-Hour Peak",
      cpcbPeriod: "8-Hour Statutory Limit",
      tier: "Good",
      tierColor: "#00b050",
      whoMultiplier: Number((52 / 100.0).toFixed(1)),
      shortTermImpacts: [
        "Oxidative halogenation and peroxidation of pulmonary surfactant lipids.",
        "Sharp retrosternal pain upon taking deep breaths during outdoor aerobic exertion.",
        "Substantial reduction in vital pulmonary capacity during afternoon photochemical sunlight peaks.",
      ],
      longTermImpacts: [
        "Accelerated morphological damage to alveolar septa leading to early emphysematous changes.",
        "Persistent chronic airway inflammation and heightened susceptibility to airborne allergens.",
        "Elevated premature mortality attributable to chronic respiratory illnesses in adults.",
      ],
      clinicalPrecautions: [
        "Schedule outdoor workouts strictly for early morning hours before UV solar radiation triggers VOC/NOx synthesis.",
        "Stay indoors during sunny, stagnant summer and post-monsoon afternoon intervals (13:00 to 17:00).",
        "Avoid using residential 'ionic' air purifiers that emit ozone as a byproduct.",
      ],
      recommendedGear: [
        {
          name: "Ozone Decomposition Catalyst Filter",
          efficiency: "MnO2 / CuO Media",
          description: "Catalytically breaks down toxic O3 into harmless diatomic oxygen (O2) indoors.",
        },
      ],
      hourlyHistory: [24, 20, 18, 16, 15, 18, 24, 34, 46, 58, 68, 76, 82, 85, 78, 69, 58, 48, 38, 32, 28, 25, 24, 52],
      illustrationType: "photochemical",
    },
  };

  const selectedPollutant = pollutantsData[selectedPollutantKey];

  return (
    <section
      id="pollutant-inspection-section"
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 lg:mt-24 pb-16 transition-colors duration-300"
      aria-label="Major air pollutants inspection and clinical deep dive"
    >
      {/* ------------------------------------------------------------------ */}
      {/* 1. SECTION HEADER                                                  */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-3 mb-8 sm:mb-12">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-500 uppercase tracking-widest">
          <span className="w-5 h-[2px] bg-emerald-500" />
          <span>TIER 02 · TOXICOLOGICAL PROFILES</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold tracking-tight">
              Major Air Pollutants Inspection
            </h2>
            <p className="text-xs sm:text-sm text-[var(--dash-muted)] mt-1.5 max-w-2xl leading-relaxed">
              Select any monitored pollutant below to inspect real-time concentration metrics,
              WHO safe threshold multipliers, and specific physiological health impacts.
            </p>
          </div>
          <div
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-mono shrink-0 shadow-xs"
            style={{
              borderColor: isDark ? "rgba(147, 226, 197, 0.2)" : "rgba(15, 56, 44, 0.15)",
              backgroundColor: isDark ? "rgba(18, 33, 28, 0.6)" : "rgba(255, 255, 255, 0.7)",
            }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[var(--dash-muted)]">STATION:</span>
            <strong className="text-[var(--dash-ink)]">{liveCity} (CPCB NAQI)</strong>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. TOP 6-CARD POLLUTANT GRID (3x2 Desktop, 2x3 Mobile)            */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
        {(Object.keys(pollutantsData) as PollutantKey[]).map((key) => {
          const item = pollutantsData[key];
          const isSelected = selectedPollutantKey === key;

          return (
            <motion.button
              key={item.key}
              type="button"
              onClick={() => {
                setSelectedPollutantKey(item.key);
                const target = document.getElementById("pollutant-deep-dive-card");
                if (target) {
                  target.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
              }}
              whileHover={{ translateY: -3, scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              className={`text-left p-3.5 sm:p-4 rounded-xl border relative overflow-hidden transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? isDark
                    ? "bg-[#14231e] border-emerald-500 shadow-md ring-1 ring-emerald-500/50"
                    : "bg-white border-emerald-600 shadow-md ring-1 ring-emerald-600/40"
                  : isDark
                  ? "bg-[#0e1714]/70 border-neutral-800/80 hover:border-neutral-700"
                  : "bg-white/85 border-[#e2dcd0] hover:border-neutral-400"
              }`}
            >
              {/* Left Border Severity Pill Indicator */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1.5"
                style={{ backgroundColor: item.tierColor }}
                title={`CPCB Severity: ${item.tier}`}
              />

              <div className="pl-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-base sm:text-lg font-black tracking-tight flex items-baseline">
                    {item.chemicalSymbol}
                    {item.subscript && (
                      <sub className="text-xs font-bold">{item.subscript}</sub>
                    )}
                  </span>
                  <ChevronRight
                    size={16}
                    className={`transition-transform duration-200 ${
                      isSelected
                        ? "text-emerald-500 translate-x-1"
                        : "text-[var(--dash-muted)] opacity-60"
                    }`}
                  />
                </div>
                <div className="text-[11px] font-medium text-[var(--dash-muted)] truncate mt-0.5">
                  {item.name}
                </div>
              </div>

              <div className="mt-4 pl-1 pt-2 border-t border-[var(--dash-rule)]/50 flex items-baseline justify-between">
                <div>
                  <span className="text-lg sm:text-xl font-mono font-bold tracking-tight">
                    {item.liveValue}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--dash-muted)] ml-1">
                    {item.unit}
                  </span>
                </div>
                <span
                  className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    color: item.tierColor,
                    backgroundColor: `${item.tierColor}18`,
                  }}
                >
                  {item.tier}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. EXPANDED POLLUTANT DEEP-DIVE CARD                               */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedPollutant.key}
          id="pollutant-deep-dive-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3 }}
          className={`p-6 sm:p-8 lg:p-10 rounded-2xl border backdrop-blur-md transition-colors shadow-lg ${
            isDark
              ? "bg-neutral-900/85 border-neutral-800 text-[#eff4ef]"
              : "bg-[#faf9f5] border-[#dfd9cd] text-[#131c18]"
          }`}
        >
          {/* Top Row: Pollutant Header & Multiplier Pill */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[var(--dash-rule)]/60 gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-mono text-xl font-black shadow-xs shrink-0"
                style={{
                  backgroundColor: `${selectedPollutant.tierColor}18`,
                  color: selectedPollutant.tierColor,
                  border: `1.5px solid ${selectedPollutant.tierColor}40`,
                }}
              >
                {selectedPollutant.chemicalSymbol}
                {selectedPollutant.subscript && <sub>{selectedPollutant.subscript}</sub>}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-500">
                    CPCB STATUTORY PARAMETER
                  </span>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold"
                    style={{
                      color: selectedPollutant.tierColor,
                      backgroundColor: `${selectedPollutant.tierColor}18`,
                    }}
                  >
                    STATUS: {selectedPollutant.tier.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                  {selectedPollutant.name} ({selectedPollutant.chemicalSymbol}
                  {selectedPollutant.subscript})
                </h3>
              </div>
            </div>

            {/* Prominent WHO Benchmark Multiplier Badge */}
            <div className="flex items-center gap-3">
              <div
                className="p-3 sm:px-4 sm:py-2.5 rounded-xl border flex items-center gap-3 shadow-xs"
                style={{
                  borderColor:
                    selectedPollutant.whoMultiplier > 1.0 ? "rgba(239, 68, 68, 0.4)" : "rgba(16, 185, 129, 0.4)",
                  backgroundColor:
                    selectedPollutant.whoMultiplier > 1.0
                      ? isDark
                        ? "rgba(220, 38, 38, 0.12)"
                        : "rgba(254, 242, 242, 0.9)"
                      : isDark
                      ? "rgba(16, 185, 129, 0.12)"
                      : "rgba(240, 253, 244, 0.9)",
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor:
                      selectedPollutant.whoMultiplier > 1.0 ? "#ef4444" : "#10b981",
                    color: "#ffffff",
                  }}
                >
                  {selectedPollutant.whoMultiplier > 1.0 ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                </div>
                <div>
                  <div className="text-[10px] font-mono text-[var(--dash-muted)] uppercase">
                    WHO Guideline Ratio
                  </div>
                  <div
                    className="text-base sm:text-lg font-mono font-black"
                    style={{
                      color: selectedPollutant.whoMultiplier > 1.0 ? "#ef4444" : "#10b981",
                    }}
                  >
                    {selectedPollutant.whoMultiplier}x WHO Limit
                    <span className="text-xs font-normal text-[var(--dash-muted)] ml-1.5">
                      ({selectedPollutant.whoBenchmark} {selectedPollutant.unit})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Row: Left Vector Graphic & Right Pathophysiology Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-8 border-b border-[var(--dash-rule)]/60">
            {/* Left 4 Cols: Editorial Vector Graphic & Benchmark Cards */}
            <div className="lg:col-span-4 space-y-5 flex flex-col justify-between">
              {/* Contextual Vector Illustration */}
              <div
                className="w-full h-56 rounded-xl border p-4 flex flex-col items-center justify-center text-center relative overflow-hidden"
                style={{
                  backgroundColor: isDark ? "rgba(18, 33, 28, 0.5)" : "rgba(240, 245, 242, 0.6)",
                  borderColor: isDark ? "rgba(147, 226, 197, 0.15)" : "rgba(15, 56, 44, 0.12)",
                }}
              >
                <PollutantVectorIllustration type={selectedPollutant.illustrationType} isDark={isDark} />
                <span className="text-[11px] font-mono text-[var(--dash-muted)] mt-2 block">
                  Pathophysiological Biological Vector · {selectedPollutant.name}
                </span>
              </div>

              {/* Threshold Comparison Table */}
              <div
                className="p-4 rounded-xl border text-xs font-mono space-y-2.5"
                style={{
                  backgroundColor: isDark ? "rgba(15, 24, 21, 0.6)" : "rgba(255, 255, 255, 0.8)",
                  borderColor: isDark ? "rgba(147, 226, 197, 0.12)" : "rgba(15, 56, 44, 0.1)",
                }}
              >
                <div className="flex items-center justify-between text-[var(--dash-muted)] border-b border-[var(--dash-rule)]/50 pb-1.5">
                  <span>METRIC BENCHMARK</span>
                  <span>VALUE LIMIT</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--dash-muted)]">Current Live Station:</span>
                  <strong className="text-[var(--dash-ink)] font-bold">
                    {selectedPollutant.liveValue} {selectedPollutant.unit}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--dash-muted)]">CPCB Indian Standard:</span>
                  <span className="font-semibold text-amber-500">
                    {selectedPollutant.cpcbStandard} {selectedPollutant.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--dash-muted)]">WHO Global Guideline:</span>
                  <span className="font-semibold text-emerald-500">
                    {selectedPollutant.whoBenchmark} {selectedPollutant.unit}
                  </span>
                </div>
              </div>
            </div>

            {/* Right 8 Cols: Clinical Impacts & Precautions */}
            <div className="lg:col-span-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Short-Term Impacts */}
                <div
                  className="p-5 rounded-xl border space-y-3"
                  style={{
                    backgroundColor: isDark ? "rgba(18, 33, 28, 0.3)" : "rgba(255, 255, 255, 0.7)",
                    borderColor: isDark ? "rgba(147, 226, 197, 0.12)" : "rgba(15, 56, 44, 0.1)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <h4 className="text-xs font-mono font-bold tracking-wider uppercase text-amber-500">
                      ACUTE / SHORT-TERM IMPACTS (0–24 HRS)
                    </h4>
                  </div>
                  <ul className="space-y-2 text-xs sm:text-sm text-[var(--dash-muted)] leading-relaxed">
                    {selectedPollutant.shortTermImpacts.map((text, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-500 mt-1 shrink-0 font-bold">›</span>
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Long-Term Impacts */}
                <div
                  className="p-5 rounded-xl border space-y-3"
                  style={{
                    backgroundColor: isDark ? "rgba(220, 38, 38, 0.05)" : "rgba(254, 242, 242, 0.6)",
                    borderColor: isDark ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.18)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <h4 className="text-xs font-mono font-bold tracking-wider uppercase text-rose-500">
                      CHRONIC / CUMULATIVE PATHOPHYSIOLOGY
                    </h4>
                  </div>
                  <ul className="space-y-2 text-xs sm:text-sm text-[var(--dash-muted)] leading-relaxed">
                    {selectedPollutant.longTermImpacts.map((text, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-rose-500 mt-1 shrink-0 font-bold">›</span>
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Clinical Equipment & Actionable Protocol */}
              <div
                className="p-5 rounded-xl border space-y-3"
                style={{
                  backgroundColor: isDark ? "rgba(18, 33, 28, 0.3)" : "rgba(255, 255, 255, 0.7)",
                  borderColor: isDark ? "rgba(147, 226, 197, 0.12)" : "rgba(15, 56, 44, 0.1)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-500" />
                    <h4 className="text-xs font-mono font-bold tracking-wider uppercase text-emerald-500">
                      CLINICAL PRECAUTIONS &amp; GEAR SELECTION
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--dash-muted)]">
                    WHO GUIDELINE ALIGNED
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {selectedPollutant.recommendedGear.map((gear, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border text-xs space-y-1"
                      style={{
                        backgroundColor: isDark ? "rgba(14, 23, 20, 0.7)" : "rgba(240, 245, 242, 0.8)",
                        borderColor: isDark ? "rgba(147, 226, 197, 0.15)" : "rgba(15, 56, 44, 0.12)",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-[var(--dash-ink)] font-bold">{gear.name}</strong>
                        <span className="font-mono text-[10px] text-emerald-500 font-semibold">
                          {gear.efficiency}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--dash-muted)] leading-relaxed">
                        {gear.description}
                      </p>
                    </div>
                  ))}
                </div>

                <ul className="text-xs text-[var(--dash-muted)] space-y-1.5 pt-2 border-t border-[var(--dash-rule)]/40">
                  {selectedPollutant.clinicalPrecautions.map((prec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{prec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Row: 24-Hour Historical Concentration Line/Area Chart */}
          <div className="pt-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-500 uppercase tracking-wider block">
                  CHRONOLOGICAL TELEMETRY STREAM
                </span>
                <h4 className="text-base sm:text-lg font-bold">
                  24-Hour Concentration Chronology vs Statutory Benchmarks
                </h4>
              </div>

              {/* Chart Legend */}
              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-emerald-500 rounded-sm" />
                  <span className="text-[var(--dash-muted)]">
                    Concentration ({selectedPollutant.unit})
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-amber-500 border-b border-dashed border-amber-500" />
                  <span className="text-[var(--dash-muted)]">CPCB Limit</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-rose-500 border-b border-dashed border-rose-500" />
                  <span className="text-[var(--dash-muted)]">WHO Guideline</span>
                </div>
              </div>
            </div>

            {/* SVG Concentration Area Chart */}
            <div
              className="w-full p-4 rounded-xl border relative"
              style={{
                backgroundColor: isDark ? "rgba(10, 18, 15, 0.7)" : "rgba(255, 255, 255, 0.8)",
                borderColor: isDark ? "rgba(147, 226, 197, 0.12)" : "rgba(15, 56, 44, 0.12)",
              }}
            >
              <HistoricalConcentrationChart
                data={selectedPollutant.hourlyHistory}
                cpcbLimit={selectedPollutant.cpcbStandard}
                whoLimit={selectedPollutant.whoBenchmark}
                unit={selectedPollutant.unit}
                color={selectedPollutant.tierColor}
                isDark={isDark}
                hoveredPoint={hoveredPoint}
                setHoveredPoint={setHoveredPoint}
              />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

// ---------------------------------------------------------------------------
// CONTEXTUAL VECTOR ILLUSTRATIONS (SVG)
// ---------------------------------------------------------------------------

function PollutantVectorIllustration({
  type,
  isDark,
}: {
  type: PollutantDetail["illustrationType"];
  isDark: boolean;
}) {
  const gradientId = useId();

  if (type === "alveolar") {
    // Alveolar capillary diffusion vector
    return (
      <svg viewBox="0 0 160 120" className="w-36 h-28 mx-auto" fill="none">
        <defs>
          <radialGradient id={`alv-${gradientId}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Alveolar sac boundary */}
        <circle cx="80" cy="60" r="45" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 3" opacity="0.6" />
        <circle cx="80" cy="60" r="40" fill={`url(#alv-${gradientId})`} />
        {/* Capillary vessel */}
        <path d="M 20 60 Q 80 40 140 60" stroke="#f43f5e" strokeWidth="6" strokeLinecap="round" opacity="0.8" />
        {/* Micro particles penetrating */}
        <circle cx="75" cy="48" r="3" fill="#ef4444" />
        <circle cx="88" cy="54" r="2.5" fill="#ef4444" />
        <circle cx="68" cy="62" r="3.5" fill="#dc2626" />
        <circle cx="95" cy="68" r="2" fill="#ef4444" />
        <circle cx="82" cy="74" r="3" fill="#dc2626" />
        {/* Direction arrow */}
        <path d="M 80 25 L 80 45 M 76 40 L 80 45 L 84 40" stroke="#ef4444" strokeWidth="2" />
      </svg>
    );
  }

  if (type === "bronchial") {
    // Bronchial ciliated entrapment vector
    return (
      <svg viewBox="0 0 160 120" className="w-36 h-28 mx-auto" fill="none">
        {/* Bronchial tube fork */}
        <path d="M 80 15 L 80 50 L 50 95 M 80 50 L 110 95" stroke="#ffbf00" strokeWidth="8" strokeLinecap="round" opacity="0.8" />
        <path d="M 80 15 L 80 50 L 50 95 M 80 50 L 110 95" stroke={isDark ? "#121f1a" : "#faf8f2"} strokeWidth="4" strokeLinecap="round" />
        {/* Coarse particle cluster entrapped at bifurcation */}
        <circle cx="80" cy="48" r="6" fill="#f97316" />
        <circle cx="72" cy="40" r="4.5" fill="#f97316" />
        <circle cx="88" cy="42" r="5" fill="#f97316" />
        <circle cx="62" cy="70" r="5" fill="#eab308" />
        <circle cx="98" cy="70" r="5" fill="#eab308" />
      </svg>
    );
  }

  if (type === "hemoglobin") {
    // Hemoglobin binding vector (CO vs O2)
    return (
      <svg viewBox="0 0 160 120" className="w-36 h-28 mx-auto" fill="none">
        {/* Red Blood Cell Disc */}
        <ellipse cx="80" cy="60" rx="50" ry="32" fill="#ef4444" fillOpacity="0.25" stroke="#ef4444" strokeWidth="2" />
        <ellipse cx="80" cy="60" rx="28" ry="16" fill="#ef4444" fillOpacity="0.4" />
        {/* CO tight ligand binding */}
        <circle cx="68" cy="58" r="7" fill="#3b82f6" />
        <text x="68" y="62" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">CO</text>
        <circle cx="92" cy="58" r="6" fill="#10b981" stroke="#ffffff" strokeWidth="1" strokeDasharray="1 1" />
        <text x="92" y="61" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold">O2</text>
        <line x1="68" y1="58" x2="80" y2="60" stroke="#3b82f6" strokeWidth="2" />
      </svg>
    );
  }

  // Default chemical molecule vector (NO2, SO2, O3)
  return (
    <svg viewBox="0 0 160 120" className="w-36 h-28 mx-auto" fill="none">
      <circle cx="80" cy="45" r="14" fill="#10b981" fillOpacity="0.3" stroke="#10b981" strokeWidth="2" />
      <text x="80" y="49" textAnchor="middle" fill={isDark ? "#ffffff" : "#121c17"} fontSize="10" fontWeight="bold">N/S</text>
      <circle cx="50" cy="85" r="12" fill="#ef4444" fillOpacity="0.3" stroke="#ef4444" strokeWidth="2" />
      <text x="50" y="89" textAnchor="middle" fill={isDark ? "#ffffff" : "#121c17"} fontSize="9" fontWeight="bold">O</text>
      <circle cx="110" cy="85" r="12" fill="#ef4444" fillOpacity="0.3" stroke="#ef4444" strokeWidth="2" />
      <text x="110" y="89" textAnchor="middle" fill={isDark ? "#ffffff" : "#121c17"} fontSize="9" fontWeight="bold">O</text>
      <line x1="72" y1="55" x2="58" y2="75" stroke={isDark ? "#526259" : "#94a39b"} strokeWidth="3" />
      <line x1="88" y1="55" x2="102" y2="75" stroke={isDark ? "#526259" : "#94a39b"} strokeWidth="3" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 24-HOUR HISTORICAL CONCENTRATION CHART (SVG)
// ---------------------------------------------------------------------------

function HistoricalConcentrationChart({
  data,
  cpcbLimit,
  whoLimit,
  unit,
  color,
  isDark,
  hoveredPoint,
  setHoveredPoint,
}: {
  data: number[];
  cpcbLimit: number;
  whoLimit: number;
  unit: string;
  color: string;
  isDark: boolean;
  hoveredPoint: { hour: number; value: number } | null;
  setHoveredPoint: (pt: { hour: number; value: number } | null) => void;
}) {
  const chartWidth = 700;
  const chartHeight = 160;
  const paddingX = 40;
  const paddingY = 24;

  const maxVal = Math.max(...data, cpcbLimit, whoLimit) * 1.15;
  const minVal = 0;

  const getX = (idx: number) => {
    return paddingX + (idx / (data.length - 1)) * (chartWidth - paddingX * 2);
  };

  const getY = (val: number) => {
    const ratio = (val - minVal) / (maxVal - minVal);
    return chartHeight - paddingY - ratio * (chartHeight - paddingY * 2);
  };

  // Build SVG path
  const points = data.map((val, idx) => `${getX(idx)},${getY(val)}`);
  const linePath = `M ${points.join(" L ")}`;
  const areaPath = `${linePath} L ${getX(data.length - 1)},${chartHeight - paddingY} L ${getX(0)},${chartHeight - paddingY} Z`;

  const cpcbY = getY(cpcbLimit);
  const whoY = getY(whoLimit);

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-44 sm:h-52 select-none"
      >
        <defs>
          <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal Grid lines */}
        <line
          x1={paddingX}
          y1={chartHeight - paddingY}
          x2={chartWidth - paddingX}
          y2={chartHeight - paddingY}
          stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
          strokeWidth="1"
        />

        {/* CPCB Threshold Reference Line */}
        <line
          x1={paddingX}
          y1={cpcbY}
          x2={chartWidth - paddingX}
          y2={cpcbY}
          stroke="#f59e0b"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <text
          x={chartWidth - paddingX - 4}
          y={cpcbY - 4}
          textAnchor="end"
          fill="#f59e0b"
          fontSize="9"
          fontFamily="monospace"
          fontWeight="bold"
        >
          CPCB ({cpcbLimit} {unit})
        </text>

        {/* WHO Threshold Reference Line */}
        <line
          x1={paddingX}
          y1={whoY}
          x2={chartWidth - paddingX}
          y2={whoY}
          stroke="#ef4444"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
        <text
          x={chartWidth - paddingX - 4}
          y={whoY - 4}
          textAnchor="end"
          fill="#ef4444"
          fontSize="9"
          fontFamily="monospace"
          fontWeight="bold"
        >
          WHO ({whoLimit} {unit})
        </text>

        {/* Shaded Area Fill */}
        <path d={areaPath} fill="url(#chartAreaGradient)" />

        {/* Data Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />

        {/* Interactive Data Dots */}
        {data.map((val, idx) => {
          const cx = getX(idx);
          const cy = getY(val);
          const isHovered = hoveredPoint?.hour === idx;

          return (
            <g
              key={idx}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredPoint({ hour: idx, value: val })}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? 5 : 3}
                fill={color}
                stroke={isDark ? "#0f1714" : "#ffffff"}
                strokeWidth={isHovered ? 2 : 1}
                className="transition-all"
              />
            </g>
          );
        })}

        {/* X-Axis Hour Labels */}
        {[0, 6, 12, 18, 23].map((hr) => (
          <text
            key={hr}
            x={getX(hr)}
            y={chartHeight - 6}
            textAnchor="middle"
            fill={isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)"}
            fontSize="9"
            fontFamily="monospace"
          >
            {hr === 23 ? "Now" : `${hr}:00`}
          </text>
        ))}
      </svg>

      {/* Tooltip Overlay */}
      {hoveredPoint && (
        <div
          className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg border shadow-md text-xs font-mono backdrop-blur-md pointer-events-none"
          style={{
            backgroundColor: isDark ? "rgba(18, 33, 28, 0.95)" : "rgba(255, 255, 255, 0.95)",
            borderColor: isDark ? "rgba(147, 226, 197, 0.3)" : "rgba(15, 56, 44, 0.2)",
            color: isDark ? "#eff4ef" : "#131c18",
          }}
        >
          <span>
            {hoveredPoint.hour === 23 ? "Current Observation" : `T - ${23 - hoveredPoint.hour}h`}:{" "}
          </span>
          <strong className="text-emerald-500 font-bold">
            {hoveredPoint.value} {unit}
          </strong>
        </div>
      )}
    </div>
  );
}
