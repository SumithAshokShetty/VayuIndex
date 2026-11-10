"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { ThreeBookCanvas } from "@/components/ThreeBookCanvas";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Compass,
  ExternalLink,
  Flame,
  Info,
  LayoutGrid,
  Stethoscope,
  X,
  XCircle,
} from "lucide-react";
import { useTheme } from "@/lib/use-theme";

// ---------------------------------------------------------------------------
// DATA DEFINITIONS & TYPES
// ---------------------------------------------------------------------------

export type AnatomicalStage = "nasal" | "bronchial" | "alveolar" | "bloodstream";

export type SensitiveGroupKey = "children" | "seniors" | "asthma" | "cardiac";

export interface InterventionGear {
  id: string;
  name: string;
  subtitle: string;
  status: "Required" | "Recommended" | "Optional";
  statusColor: string;
  filtrationEfficiency: string;
  targetParticle: string;
  icon: string;
  summary: string;
  protocolSteps: string[];
  clinicalCitations: string[];
  maintenanceNotice: string;
}

const INTERVENTIONS: InterventionGear[] = [
  {
    id: "n95",
    name: "N95 / FFP2 Certified Respirator",
    subtitle: "Electrostatic Micro-Fiber Masking",
    status: "Required",
    statusColor: "#ef4444",
    filtrationEfficiency: "≥ 95% down to 0.3 µm",
    targetParticle: "Fine PM2.5 & Combustive Soot",
    icon: "shield",
    summary:
      "Tightly sealed non-woven polypropylene fibers deploy an electrostatic charge to entrap airborne particulates that ordinary surgical or cloth masks cannot capture.",
    protocolSteps: [
      "Select an NIOSH or EN149 certified model with dual head-straps (ear loops often leak up to 20% along jawlines).",
      "Perform a positive pressure seal check: exhale gently; the mask should slightly bulge with zero air escaping around the bridge of the nose.",
      "Never wash or spray with alcohol sanitizer; moisture degrades the internal electrostatic charge immediately.",
      "Replace after 36–40 accumulated hours of wear or when breathing resistance increases noticeably.",
    ],
    clinicalCitations: [
      "National Institute for Occupational Safety and Health (NIOSH) Standards 42 CFR 84",
      "WHO Guidance on Personal Respiratory Protection in Severe Ambient Air Pollution",
    ],
    maintenanceNotice: "Store in a dry, ventilated paper pouch between daily commutes.",
  },
  {
    id: "hepa",
    name: "True HEPA H13/H14 Air Purifier",
    subtitle: "Continuous Indoor Recirculation",
    status: "Recommended",
    statusColor: "#10b981",
    filtrationEfficiency: "99.97% down to 0.1 µm",
    targetParticle: "PM2.5, PM10 & Ultrafine Aerosols",
    icon: "wind",
    summary:
      "Medical-grade fiberglass pleated filtration combined with activated carbon adsorption captures both toxic particulate matter and volatile chemical gases indoors.",
    protocolSteps: [
      "Size the unit based on Clean Air Delivery Rate (CADR): ensure at least 4.5 complete Air Changes per Hour (ACH) for your room volume.",
      "Keep the purifier positioned at least 1 meter away from walls to preserve laminar intake flow.",
      "Operate continuously on low/auto during sleep; PM2.5 levels often peak during nocturnal temperature inversions.",
      "Inspect and vacuum the mesh pre-filter every 14 days to preserve motor velocity and filter life.",
    ],
    clinicalCitations: [
      "EPA Guide to Air Cleaners in the Home (Second Edition)",
      "Lancet Respiratory Medicine: Indoor Air Quality & Systemic Health Interventions",
    ],
    maintenanceNotice: "Replace the primary H13 HEPA barrel every 6 to 12 months.",
  },
  {
    id: "saline",
    name: "Hypertonic Nasal Saline Irrigation",
    subtitle: "Mucociliary Escalator Rehabilitation",
    status: "Recommended",
    statusColor: "#06b6d4",
    filtrationEfficiency: "Physical Turbinate Lavage",
    targetParticle: "Coarse PM10, Dust & Allergens",
    icon: "droplet",
    summary:
      "Buffered saline lavage flushes deposited coarse particles and irritants from the nasal mucosa, reducing local histamine cascades and restoring natural ciliary beat frequency.",
    protocolSteps: [
      "Use only sterile, distilled, or boiled water—never unboiled tap water.",
      "Mix with pharmaceutical-grade sodium chloride and sodium bicarbonate buffer sachets.",
      "Irrigate each nostril while leaning forward over a basin at a 45-degree angle, breathing through the mouth.",
      "Gently blow nose without pinching tightly to prevent eustachian tube pressure changes.",
    ],
    clinicalCitations: [
      "Cochrane Systematic Review: Saline irrigation for upper respiratory irritations",
      "Allergy & Rhinology: Mucociliary clearance post-particulate matter exposure",
    ],
    maintenanceNotice: "Rinse and air-dry the sinus rinse bottle after every administration.",
  },
  {
    id: "ventilation",
    name: "Positive-Pressure Ventilation & Sealing",
    subtitle: "Building Envelope Barrier Control",
    status: "Optional",
    statusColor: "#8b5cf6",
    filtrationEfficiency: "Envelope Infiltration Reduction",
    targetParticle: "Ambient Infiltration Corridor",
    icon: "building",
    summary:
      "Sealing window perimeter gaps with high-density EPDM rubber weatherstripping prevents particulate ingress through microscopic structural expansion seams.",
    protocolSteps: [
      "Inspect exterior doors and window sashes with an acoustic or smoke-pencil leak detector.",
      "Apply silicone-based or foam seal tape along all operable sash perimeters.",
      "Keep kitchen and bathroom exhaust fans moderated during severe smog days to avoid drawing in unconditioned outside air.",
      "If using split ACs, engage the internal filtration cycle and check return vents weekly.",
    ],
    clinicalCitations: [
      "ASHRAE Standard 62.1: Ventilation for Acceptable Indoor Air Quality",
      "Building and Environment: Envelope airtightness and particulate ingress dynamics",
    ],
    maintenanceNotice: "Re-evaluate weather seals seasonally ahead of winter meteorological inversions.",
  },
];

const SENSITIVE_GROUPS: Record<
  SensitiveGroupKey,
  {
    title: string;
    badge: string;
    riskColor: string;
    biometrics: string;
    criticalThreshold: string;
    mechanism: string;
    clinicalDos: string[];
    clinicalDonts: string[];
  }
> = {
  children: {
    title: "Children & Infants",
    badge: "High Vulnerability",
    riskColor: "#f59e0b",
    biometrics: "Minute ventilation: 400 mL/kg/min (2x Adult baseline)",
    criticalThreshold: "AQI > 100 (CPCB Moderate)",
    mechanism:
      "Children breathe faster per unit of body weight and possess narrower airway lumens. Because their alveoli continue multiplying until age 8, particulate exposure triggers chronic airway remodeling and stunted lung capacity growth.",
    clinicalDos: [
      "Shift physical education and recess periods indoors whenever AQI exceeds 100.",
      "Keep bedroom doors closed with continuous HEPA filtration during overnight sleep.",
      "Ensure hydration to maintain protective airway mucosal viscosity.",
    ],
    clinicalDonts: [
      "Never use non-certified masks on infants under 2 years (suffocation hazard).",
      "Avoid stroller walks along heavy transit corridors where vehicle exhaust settles at stroller height.",
      "Do not dismiss recurrent nocturnal coughs as simple seasonal changes.",
    ],
  },
  seniors: {
    title: "Elderly & Seniors (65+)",
    badge: "Severe Vascular Vulnerability",
    riskColor: "#ef4444",
    biometrics: "Reduced forced expiratory volume (FEV1) & arterial compliance",
    criticalThreshold: "AQI > 150 (CPCB Poor)",
    mechanism:
      "Aging respiratory systems feature reduced ciliary motility and stiffened pulmonary capillary beds. Particulate translocation accelerates carotid atherosclerosis and triggers acute autonomic arrhythmia episodes.",
    clinicalDos: [
      "Maintain a verified 7-day supply of cardiovascular and pulmonary maintenance medicines.",
      "Perform low-impact stretching and gentle indoor mobility drills rather than outdoor walks.",
      "Check blood pressure twice daily during ambient pollution episodes.",
    ],
    clinicalDonts: [
      "Do not conduct early morning garden walks when ground-level temperature inversions trap smog.",
      "Avoid unmonitored outdoor exertion during winter fog spikes.",
      "Never discontinue prescribed anticoagulants or beta-blockers without physician consultation.",
    ],
  },
  asthma: {
    title: "Asthma & Respiratory (COPD)",
    badge: "Critical Bronchial Risk",
    riskColor: "#dc2626",
    biometrics: "Elevated bronchial hyper-responsiveness & airway eosinophils",
    criticalThreshold: "AQI > 80 (CPCB Satisfactory upper bound)",
    mechanism:
      "Particulate matter acts as a potent mechanical and chemical irritant, stripping respiratory surfactant and inducing smooth-muscle bronchospasms, mucosal edema, and acute exacerbation cycles.",
    clinicalDos: [
      "Keep fast-acting bronchodilator rescue inhalers on person at all times.",
      "Record peak flow meter readings morning and evening to anticipate flare-ups before symptoms surface.",
      "Wear an N95 respirator immediately upon stepping outside into unfiltered air.",
    ],
    clinicalDonts: [
      "Never exercise outdoors when AQI exceeds 100.",
      "Do not ignore chest tightness, wheezing, or difficulty completing sentences.",
      "Avoid exposure to secondary indoor triggers: incense, cooking smoke, or volatile aerosol sprays.",
    ],
  },
  cardiac: {
    title: "Cardiovascular & Hypertensive",
    badge: "Acute Ischemic Risk",
    riskColor: "#b91c1c",
    biometrics: "Vascular endothelial dysfunction & elevated C-Reactive Protein",
    criticalThreshold: "AQI > 120 (CPCB Poor threshold)",
    mechanism:
      "PM2.5 particles crossing the alveolar-capillary barrier induce systemic oxidative stress, promoting platelet activation, arterial vasoconstriction, and rupture of vulnerable atherosclerotic plaques.",
    clinicalDos: [
      "Strictly adhere to prescribed statins, anti-platelets, and antihypertensive regimens.",
      "Utilize heart rate variability monitors to gauge autonomic stress during high-smog periods.",
      "Rest immediately and notify emergency services if experiencing retrosternal pressure or shortness of breath.",
    ],
    clinicalDonts: [
      "Do not shovel, lift heavy weights, or perform isometric straining in cold, polluted ambient air.",
      "Avoid standing near diesel-exhaust idling zones, generators, or busy intersections.",
      "Never dismiss sudden jaw pain, shoulder radiating discomfort, or cold sweats.",
    ],
  },
};

// ---------------------------------------------------------------------------
// MAIN HEALTH FINDINGS COMPONENT
// ---------------------------------------------------------------------------

export function HealthFindingsView() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Display Mode: 3D Luxury Journal vs Flat Editorial Grid
  const [viewMode, setViewMode] = useState<"journal" | "grid">("journal");

  // Journal Current Chapter: 1 to 4
  const [currentChapter, setCurrentChapter] = useState<number>(1);
  const [turnDirection, setTurnDirection] = useState<"next" | "prev">("next");

  // Interactive Pathophysiology State
  const [activeParticle, setActiveParticle] = useState<"pm10" | "pm25">("pm25");

  // Sensitive Group Active Tab
  const [activeSensitiveGroup, setActiveSensitiveGroup] = useState<SensitiveGroupKey>("asthma");

  // Selected Intervention Modal Drawer
  const [selectedIntervention, setSelectedIntervention] = useState<InterventionGear | null>(null);

  // Live Telemetry Reading from CPCB Endpoint
  const [liveAqi, setLiveAqi] = useState<number>(413);
  const [livePm25, setLivePm25] = useState<number>(267);
  const [livePm10, setLivePm10] = useState<number>(157);
  const [liveCity, setLiveCity] = useState<string>("Delhi");

  // Ingest live telemetry on mount
  useEffect(() => {
    fetch("/api/air-quality?lat=28.6139&lng=77.2090")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.current) {
          if (typeof data.current.aqi === "number") setLiveAqi(Math.round(data.current.aqi));
          if (typeof data.current.pm2_5 === "number") setLivePm25(Math.round(data.current.pm2_5));
          if (typeof data.current.pm10 === "number") setLivePm10(Math.round(data.current.pm10));
          if (data.stationName) setLiveCity(data.stationName.split(",")[0]);
        }
      })
      .catch(() => undefined);
  }, []);

  // Berkeley Earth formula: 1 cigarette per day ≈ 22 µg/m³ PM2.5
  const cigaretteEquivalent = useMemo(() => {
    return Number((livePm25 / 22.0).toFixed(1));
  }, [livePm25]);

  // Pinned 3D Journal Scroll Physics (Inspired by maray.ai)
  const scrollTrackRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  const { scrollYProgress } = useScroll({
    target: scrollTrackRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setScrollProgress(latest);
  });

  const scrollToChapter = (chap: number) => {
    if (!scrollTrackRef.current) return;
    const track = scrollTrackRef.current;
    const rect = track.getBoundingClientRect();
    const trackTop = window.scrollY + rect.top;
    const trackScrollable = track.offsetHeight - window.innerHeight;
    if (trackScrollable <= 0) return;

    // Checkpoint targets for 4 chapters:
    // Chap 1: 0.22, Chap 2: 0.50, Chap 3: 0.78, Chap 4: 0.98
    const targets = [0.22, 0.50, 0.78, 0.98];
    const targetP = targets[chap - 1] ?? 0.22;
    window.scrollTo({
      top: trackTop + trackScrollable * targetP,
      behavior: "smooth",
    });
  };

  const handleNextChapter = () => {
    if (currentChapter < 4) {
      setTurnDirection("next");
      setCurrentChapter((prev) => prev + 1);
    }
  };

  const handlePrevChapter = () => {
    if (currentChapter > 1) {
      setTurnDirection("prev");
      setCurrentChapter((prev) => prev - 1);
    }
  };

  return (
    <div
      className={`health-findings-page min-h-screen transition-colors duration-300 ${
        isDark ? "bg-[#0b1311] text-[#eff4ef]" : "bg-[#f7f6f0] text-[#131c18]"
      }`}
      style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* 1. EDITORIAL HEADER & VIEW SWITCHER                                */}
      {/* ------------------------------------------------------------------ */}
      <header
        className="w-full border-b backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 transition-colors"
        style={{
          borderColor: isDark ? "rgba(147, 226, 197, 0.14)" : "rgba(15, 56, 44, 0.12)",
          backgroundColor: isDark ? "rgba(11, 19, 17, 0.88)" : "rgba(247, 246, 240, 0.92)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center border shadow-xs"
            style={{
              borderColor: isDark ? "rgba(131, 223, 189, 0.35)" : "rgba(35, 131, 95, 0.35)",
              backgroundColor: isDark ? "rgba(131, 223, 189, 0.1)" : "rgba(35, 131, 95, 0.08)",
              color: isDark ? "#83dfbd" : "#23835f",
            }}
          >
            <Stethoscope size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] font-bold tracking-widest uppercase text-emerald-500">
                CLINICAL ATMOSPHERIC INTELLIGENCE
              </span>
              <span
                className="text-[9px] font-mono px-2 py-0.5 rounded-full border"
                style={{
                  borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)",
                }}
              >
                CPCB NAQI STANDARD
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight">
              Health &amp; Safety Findings Journal
            </h1>
          </div>
        </div>

        {/* View Switcher: 3D Journal vs Flat Grid */}
        <div
          className="flex items-center p-1 rounded-xl border shadow-inner text-xs font-medium"
          style={{
            borderColor: isDark ? "rgba(147, 226, 197, 0.2)" : "rgba(15, 56, 44, 0.15)",
            backgroundColor: isDark ? "rgba(18, 33, 28, 0.7)" : "rgba(255, 255, 255, 0.8)",
          }}
        >
          <button
            type="button"
            onClick={() => setViewMode("journal")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
              viewMode === "journal"
                ? isDark
                  ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow-xs font-semibold"
                  : "bg-emerald-700 text-white shadow-xs font-semibold"
                : "text-[var(--dash-muted)] hover:opacity-80"
            }`}
            aria-pressed={viewMode === "journal"}
          >
            <BookOpen size={14} />
            <span>3D Journal Spread</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
              viewMode === "grid"
                ? isDark
                  ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow-xs font-semibold"
                  : "bg-emerald-700 text-white shadow-xs font-semibold"
                : "text-[var(--dash-muted)] hover:opacity-80"
            }`}
            aria-pressed={viewMode === "grid"}
          >
            <LayoutGrid size={14} />
            <span>Flat Grid Dashboard</span>
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* 2. MODE A: 3D INTERACTIVE HARDCOVER NOTEBOOK JOURNAL              */}
      {/* ------------------------------------------------------------------ */}
      {viewMode === "journal" ? (
        <>
          {/* -------------------------------------------------------------- */}
          {/* 2. 3D HARDCOVER PINNED SCROLL SEQUENCE (Inspired by maray.ai)  */}
          {/* -------------------------------------------------------------- */}
          <div ref={scrollTrackRef} className="relative w-full h-[450vh]">
            <div className="sticky top-0 h-screen w-full flex flex-col justify-center items-center overflow-hidden">
              {/* Hero Editorial Header Overlay (Fade out when scrollProgress >= 0.12) */}
              <div
                className="absolute inset-0 z-20 pointer-events-none flex items-center justify-between px-6 sm:px-12 lg:px-20 max-w-7xl mx-auto w-full transition-all duration-300"
                style={{
                  opacity: scrollProgress < 0.12 ? 1 - scrollProgress / 0.12 : 0,
                  transform: `translateY(${scrollProgress < 0.12 ? -scrollProgress * 120 : -30}px)`,
                  pointerEvents: scrollProgress < 0.08 ? "auto" : "none",
                }}
              >
                {/* Left Column: Hero Editorial Title & Subtitle */}
                <div className="max-w-md space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium border bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    VAYU INDEX · CLINICAL REPOSITORY
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-[var(--dash-ink)] leading-[1.12]">
                    Health &amp; Safety Journal
                  </h1>
                  <p className="text-xs sm:text-sm text-[var(--dash-muted)] leading-relaxed font-normal">
                    An editorial hardbound compendium detailing particulate biological infiltration, CPCB clinical exposure thresholds, and certified countermeasures.
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="text-xs font-mono font-medium px-3 py-1.5 rounded-lg border bg-[var(--dash-surface-soft)] text-[var(--dash-ink)] border-[var(--dash-rule)]">
                      {liveCity} CPCB AQI: <strong>{liveAqi}</strong> (Severe)
                    </span>
                    <span className="text-xs font-mono text-[var(--dash-muted)] flex items-center gap-1 animate-pulse">
                      Scroll to open journal ↓
                    </span>
                  </div>
                </div>

                {/* Right Column: Plus-Marked Table of Contents (as seen in maray.ai) */}
                <div className="hidden lg:flex flex-col max-w-xs space-y-3 text-right">
                  <span className="text-xs font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-bold">
                    COMPENDIUM CHAPTERS
                  </span>
                  <ul className="space-y-2.5 text-xs font-mono text-[var(--dash-muted)]">
                    <li
                      onClick={() => scrollToChapter(1)}
                      className="flex items-center justify-end gap-2 group hover:text-emerald-500 transition-colors cursor-pointer"
                    >
                      <span>01 PM2.5 vs PM10 Infiltration</span>
                      <span className="text-emerald-500 font-bold group-hover:scale-125 transition-transform">+</span>
                    </li>
                    <li
                      onClick={() => scrollToChapter(2)}
                      className="flex items-center justify-end gap-2 group hover:text-emerald-500 transition-colors cursor-pointer"
                    >
                      <span>02 CPCB NAQI Clinical Breakpoints</span>
                      <span className="text-emerald-500 font-bold group-hover:scale-125 transition-transform">+</span>
                    </li>
                    <li
                      onClick={() => scrollToChapter(3)}
                      className="flex items-center justify-end gap-2 group hover:text-emerald-500 transition-colors cursor-pointer"
                    >
                      <span>03 Vulnerable Cohort Matrix</span>
                      <span className="text-emerald-500 font-bold group-hover:scale-125 transition-transform">+</span>
                    </li>
                    <li
                      onClick={() => scrollToChapter(4)}
                      className="flex items-center justify-end gap-2 group hover:text-emerald-500 transition-colors cursor-pointer"
                    >
                      <span>04 Certified Gear &amp; Protocols</span>
                      <span className="text-emerald-500 font-bold group-hover:scale-125 transition-transform">+</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <span className="text-[11px] font-mono text-emerald-500/80 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20 inline-block">
                      Scroll or drag to turn pages
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Chapter Navigation Pill (Active when reading pages, scrollProgress >= 0.12) */}
              <div
                className="absolute top-4 left-4 right-4 sm:left-8 sm:right-8 z-30 pointer-events-none flex items-center justify-between transition-opacity duration-300"
                style={{
                  opacity: scrollProgress >= 0.12 ? 1 : 0,
                  pointerEvents: scrollProgress >= 0.12 ? "auto" : "none",
                }}
              >
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-mono font-medium backdrop-blur-md bg-[var(--dash-surface-soft)] text-[var(--dash-ink)] border-[var(--dash-rule)] shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>CHAPTER 0{currentChapter} OF 04</span>
                  <span className="hidden sm:inline text-[var(--dash-muted)]">
                    · {currentChapter === 1 ? "Pathophysiology" : currentChapter === 2 ? "CPCB Scale" : currentChapter === 3 ? "Sensitive Cohorts" : "Equipment"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 pointer-events-auto">
                  {[1, 2, 3, 4].map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => scrollToChapter(ch)}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all border ${
                        currentChapter === ch
                          ? "bg-emerald-500 text-white border-emerald-600 font-bold shadow-sm"
                          : "bg-[var(--dash-surface)] text-[var(--dash-muted)] border-[var(--dash-rule)] hover:text-[var(--dash-ink)]"
                      }`}
                    >
                      CH 0{ch}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3D WebGL Hardcover & Interactive Page-Turn Canvas */}
              <div className="w-full h-full max-w-7xl mx-auto flex items-center justify-center p-2 sm:p-4">
                <ThreeBookCanvas
                  currentChapter={currentChapter}
                  onChapterChange={(chap, dir) => {
                    setTurnDirection(dir);
                    setCurrentChapter(chap);
                  }}
                  isDark={isDark}
                  scrollProgress={scrollProgress}
                  isScrollControlled={true}
                >
            {/* The Open Two-Page Spread Hybrid UI Overlay */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentChapter}
                initial={{
                  opacity: 0,
                  x: turnDirection === "next" ? 24 : -24,
                  scale: 0.98,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  x: turnDirection === "next" ? -24 : 24,
                  scale: 0.98,
                }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-1 lg:grid-cols-2 rounded-2xl overflow-hidden border relative shadow-xl backdrop-blur-xs"
                style={{
                  backgroundColor: isDark ? "rgba(18, 29, 26, 0.96)" : "rgba(253, 251, 247, 0.96)",
                  borderColor: isDark ? "rgba(147, 226, 197, 0.16)" : "rgba(15, 56, 44, 0.14)",
                }}
              >
                {/* Center Book Crease / Gutter Shadow Divider */}
                <div
                  className="hidden lg:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-12 pointer-events-none z-20"
                  style={{
                    background: isDark
                      ? "linear-gradient(90deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.12) 40%, rgba(0,0,0,0.0) 50%, rgba(0,0,0,0.12) 60%, rgba(0,0,0,0.5) 100%)"
                      : "linear-gradient(90deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.07) 40%, rgba(0,0,0,0.0) 50%, rgba(0,0,0,0.07) 60%, rgba(0,0,0,0.2) 100%)",
                  }}
                />

                  {/* -------------------------------------------------------- */}
                  {/* LEFT PAGE: Concept, Philosophy & Narrative Storytelling */}
                  {/* -------------------------------------------------------- */}
                  <div className="p-6 sm:p-10 lg:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-dashed border-[var(--dash-rule)] relative">
                    <div className="space-y-6">
                      {/* Chapter Kicker & Eyebrow */}
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold tracking-widest text-emerald-500 uppercase flex items-center gap-2">
                          <span className="w-4 h-[1.5px] bg-emerald-500" />
                          CHAPTER 0{currentChapter} / 04
                        </span>
                        <span className="text-[var(--dash-muted)]">
                          {currentChapter === 1 && "EPIDEMIOLOGICAL EXPOSURE"}
                          {currentChapter === 2 && "PATHOPHYSIOLOGY BREAKDOWN"}
                          {currentChapter === 3 && "CLINICAL VULNERABILITY"}
                          {currentChapter === 4 && "EQUIPMENT & PROTOCOLS"}
                        </span>
                      </div>

                      {/* CHAPTER 1 LEFT CONTENT */}
                      {currentChapter === 1 && (
                        <div className="space-y-5">
                          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold tracking-tight leading-snug">
                            The invisible architecture of ambient inhalation.
                          </h2>
                          <p className="text-sm sm:text-base leading-relaxed text-[var(--dash-muted)]">
                            The human respiratory tree processes over{" "}
                            <strong className="text-[var(--dash-ink)]">11,000 liters</strong> of ambient
                            air every single day. In heavily polluted airsheds across South Asia, airborne
                            aerosols constantly breach the airway mucosal clearance system.
                          </p>

                          <div
                            className="p-4 rounded-xl border space-y-3"
                            style={{
                              backgroundColor: isDark ? "rgba(18, 33, 28, 0.4)" : "rgba(240, 245, 242, 0.6)",
                              borderColor: isDark ? "rgba(147, 226, 197, 0.15)" : "rgba(15, 56, 44, 0.12)",
                            }}
                          >
                            <span className="text-[11px] font-mono font-bold tracking-wider text-emerald-500 uppercase block">
                              EPIDEMIOLOGICAL AXIOM
                            </span>
                            <p className="text-xs sm:text-sm leading-relaxed text-[var(--dash-muted)]">
                              According to the Central Pollution Control Board (CPCB), prolonged exposure
                              to concentrations above statutory limits induces severe oxidative distress,
                              reducing alveolar elasticity and triggering systemic endothelial inflammation.
                            </p>
                          </div>

                          {/* Cigarette Inhalation Equivalent Widget */}
                          <div
                            className="p-4 rounded-xl border space-y-2.5"
                            style={{
                              backgroundColor: isDark ? "rgba(220, 38, 38, 0.08)" : "rgba(254, 242, 242, 0.8)",
                              borderColor: isDark ? "rgba(239, 68, 68, 0.3)" : "rgba(239, 68, 68, 0.25)",
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-mono font-bold text-rose-500 uppercase flex items-center gap-1.5">
                                <Flame size={13} />
                                <span>INHALATION EQUIVALENT</span>
                              </span>
                              <span className="text-[10px] font-mono text-[var(--dash-muted)]">
                                Berkeley Earth Formula
                              </span>
                            </div>
                            <div className="flex items-baseline gap-3">
                              <span className="text-3xl sm:text-4xl font-mono font-black text-rose-500">
                                ~{cigaretteEquivalent}
                              </span>
                              <span className="text-xs sm:text-sm font-semibold text-[var(--dash-ink)]">
                                cigarettes inhaled today in {liveCity}
                              </span>
                            </div>
                            <p className="text-[11px] text-[var(--dash-muted)] leading-relaxed">
                              Based on live CPCB ground observation (PM2.5 = {livePm25} µg/m³, PM10 = {livePm10} µg/m³). 1
                              cigarette ≈ 22 µg/m³ PM2.5 per 24 hours.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* CHAPTER 2 LEFT CONTENT */}
                      {currentChapter === 2 && (
                        <div className="space-y-5">
                          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold tracking-tight leading-snug">
                            Particle dynamics: Upper airway vs Deep alveolar diffusion.
                          </h2>
                          <p className="text-sm leading-relaxed text-[var(--dash-muted)]">
                            Not all dust behaves equally. Toxicity is strictly governed by physical
                            aerodynamic diameter ($d_a$). While coarse particles are mechanically
                            halted by the body&apos;s upper defenses, fine combustion aerosols penetrate
                            directly into the vascular network.
                          </p>

                          {/* Dual Column Comparative Breakdown */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            {/* PM10 Card */}
                            <div
                              onClick={() => setActiveParticle("pm10")}
                              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                activeParticle === "pm10"
                                  ? "border-amber-500 bg-amber-500/10 shadow-sm"
                                  : "border-[var(--dash-rule)] hover:border-amber-500/40"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-mono text-xs font-bold text-amber-500">
                                  PM10 (≤ 10 µm)
                                </span>
                                <span className="text-[10px] font-mono text-[var(--dash-muted)]">
                                  COARSE DUST
                                </span>
                              </div>
                              <h3 className="text-sm font-bold mb-1">Upper Airway Entrapment</h3>
                              <p className="text-xs text-[var(--dash-muted)] leading-relaxed">
                                Dust, road pulverized sand, pollen. Stopped at the nasal turbinates and
                                trachea by the mucociliary escalator. Causes acute rhinitis and bronchitis.
                              </p>
                            </div>

                            {/* PM2.5 Card */}
                            <div
                              onClick={() => setActiveParticle("pm25")}
                              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                activeParticle === "pm25"
                                  ? "border-rose-500 bg-rose-500/10 shadow-sm"
                                  : "border-[var(--dash-rule)] hover:border-rose-500/40"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-mono text-xs font-bold text-rose-500">
                                  PM2.5 (≤ 2.5 µm)
                                </span>
                                <span className="text-[10px] font-mono text-[var(--dash-muted)]">
                                  FINE SOOT
                                </span>
                              </div>
                              <h3 className="text-sm font-bold mb-1">Alveolar Translocation</h3>
                              <p className="text-xs text-[var(--dash-muted)] leading-relaxed">
                                1/30th diameter of human hair. Penetrates non-ciliated alveolar sacs,
                                crossing into capillaries to cause systemic arterial inflammation.
                              </p>
                            </div>
                          </div>

                          <div className="p-3 rounded-xl border border-dashed border-[var(--dash-rule)] text-xs text-[var(--dash-muted)] flex items-center gap-3">
                            <Info size={16} className="text-emerald-500 shrink-0" />
                            <span>
                              Toggle between PM10 and PM2.5 to see the interactive 4-stage anatomical
                              penetration depth on the opposite page.
                            </span>
                          </div>
                        </div>
                      )}

                      {/* CHAPTER 3 LEFT CONTENT */}
                      {currentChapter === 3 && (
                        <div className="space-y-5">
                          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold tracking-tight leading-snug">
                            Differential susceptibility across physiological cohorts.
                          </h2>
                          <p className="text-sm leading-relaxed text-[var(--dash-muted)]">
                            Ambient pollution damages bodies unevenly. Baseline pulmonary reserve,
                            autonomic cardiac regulation, and immune inflammatory markers determine
                            whether an AQI spike manifests as mild throat irritation or an acute medical
                            emergency.
                          </p>

                          <div
                            className="p-4 rounded-xl border space-y-2.5"
                            style={{
                              backgroundColor: isDark ? "rgba(18, 33, 28, 0.4)" : "rgba(240, 245, 242, 0.6)",
                              borderColor: isDark ? "rgba(147, 226, 197, 0.15)" : "rgba(15, 56, 44, 0.12)",
                            }}
                          >
                            <span className="text-[11px] font-mono font-bold tracking-wider text-emerald-500 uppercase block">
                              CLINICAL SEVERITY THRESHOLDS
                            </span>
                            <ul className="text-xs space-y-1.5 text-[var(--dash-muted)]">
                              <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>
                                  <strong>AQI 0–100 (Good / Satisfactory):</strong> Minimal clinical
                                  manifestation across all groups.
                                </span>
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                <span>
                                  <strong>AQI 101–200 (Moderate):</strong> Early bronchospasm triggers in
                                  active asthma and pediatric populations.
                                </span>
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                <span>
                                  <strong>AQI 301–500 (Very Poor / Severe):</strong> Acute cardiovascular
                                  ischemia risk; healthy adults experience marked airway inflammation.
                                </span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* CHAPTER 4 LEFT CONTENT */}
                      {currentChapter === 4 && (
                        <div className="space-y-5">
                          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold tracking-tight leading-snug">
                            The hierarchy of clinical protective interventions.
                          </h2>
                          <p className="text-sm leading-relaxed text-[var(--dash-muted)]">
                            Public health mitigation follows a strict hierarchy of controls: from
                            indoor structural sealing and HEPA filtration down to certified personal
                            respiratory equipment.
                          </p>

                          <div
                            className="p-4 rounded-xl border space-y-2"
                            style={{
                              backgroundColor: isDark ? "rgba(18, 33, 28, 0.4)" : "rgba(240, 245, 242, 0.6)",
                              borderColor: isDark ? "rgba(147, 226, 197, 0.15)" : "rgba(15, 56, 44, 0.12)",
                            }}
                          >
                            <span className="text-[11px] font-mono font-bold tracking-wider text-emerald-500 uppercase block">
                              WHY SURGICAL MASKS FAIL
                            </span>
                            <p className="text-xs text-[var(--dash-muted)] leading-relaxed">
                              Standard loose surgical and cloth masks offer near-zero seal against PM2.5.
                              Over 85% of ambient air bypasses along the loose nose bridge and jawlines.
                              Only certified N95 / FFP2 respirators with dual headbands provide tight
                              marginal seals.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Left Page Number Footer */}
                    <div className="pt-8 flex items-center justify-between text-[11px] font-mono text-[var(--dash-muted)] border-t border-[var(--dash-rule)]/40 mt-6">
                      <span>VAYU CLINICAL FIELD NOTEBOOK</span>
                      <span className="font-bold">PAGE 0{currentChapter * 2 - 1}</span>
                    </div>
                  </div>

                  {/* -------------------------------------------------------- */}
                  {/* RIGHT PAGE: Interactive UI Widgets, Telemetry & Data Cards */}
                  {/* -------------------------------------------------------- */}
                  <div className="p-6 sm:p-10 lg:p-12 flex flex-col justify-between relative bg-opacity-40">
                    <div className="space-y-6">
                      {/* Chapter 1 Right Content: CPCB NAQI Spectrum Table */}
                      {currentChapter === 1 && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold">CPCB NAQI Index Spectrum</h3>
                            <span className="font-mono text-[10px] text-emerald-500 font-bold uppercase">
                              INDIAN STATUTORY SCALE
                            </span>
                          </div>

                          <div className="space-y-2">
                            {[
                              {
                                range: "0 – 50",
                                label: "Good",
                                color: "#00b050",
                                desc: "Minimal impact; air is clean and safe.",
                              },
                              {
                                range: "51 – 100",
                                label: "Satisfactory",
                                color: "#92d050",
                                desc: "Minor breathing discomfort to sensitive individuals.",
                              },
                              {
                                range: "101 – 200",
                                label: "Moderate",
                                color: "#ffbf00",
                                desc: "Discomfort to patients with lungs, asthma, and heart conditions.",
                              },
                              {
                                range: "201 – 300",
                                label: "Poor",
                                color: "#ff7c00",
                                desc: "Breathing discomfort to most people on prolonged exposure.",
                              },
                              {
                                range: "301 – 400",
                                label: "Very Poor",
                                color: "#ef4444",
                                desc: "Respiratory illness on prolonged exposure.",
                              },
                              {
                                range: "401 – 500",
                                label: "Severe",
                                color: "#7030a0",
                                desc: "Affects healthy people; serious risk to those with diseases.",
                              },
                            ].map((tier) => {
                              const isCurrentLive =
                                liveAqi >= parseInt(tier.range.split("–")[0]) &&
                                (tier.range.includes("500")
                                  ? liveAqi >= 401
                                  : liveAqi <= parseInt(tier.range.split("–")[1]));
                              return (
                                <div
                                  key={tier.label}
                                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                                    isCurrentLive
                                      ? "ring-2 ring-emerald-500 bg-emerald-500/10 font-semibold"
                                      : "border-[var(--dash-rule)]"
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span
                                      className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                                      style={{ backgroundColor: tier.color }}
                                    />
                                    <div>
                                      <span className="font-bold">{tier.label}</span>
                                      <span className="font-mono text-[10px] text-[var(--dash-muted)] ml-2">
                                        ({tier.range})
                                      </span>
                                    </div>
                                  </div>
                                  <span className="text-[11px] text-[var(--dash-muted)] max-w-[210px] text-right truncate">
                                    {tier.desc}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Live Station Provenance Note */}
                          <div
                            className="p-3 rounded-xl border flex items-center justify-between text-xs font-mono"
                            style={{
                              backgroundColor: isDark ? "rgba(18, 33, 28, 0.6)" : "rgba(255, 255, 255, 0.7)",
                              borderColor: isDark ? "rgba(147, 226, 197, 0.15)" : "rgba(15, 56, 44, 0.12)",
                            }}
                          >
                            <span className="text-[var(--dash-muted)]">Live Telemetry Station:</span>
                            <strong className="text-emerald-500">
                              {liveCity} · AQI {liveAqi} (Severe)
                            </strong>
                          </div>
                        </div>
                      )}

                      {/* Chapter 2 Right Content: Interactive 4-Stage Anatomical Scale */}
                      {currentChapter === 2 && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold">4-Stage Anatomical Infiltration</h3>
                            <span className="font-mono text-[10px] text-emerald-500 font-bold uppercase">
                              PENETRATION DEPTH
                            </span>
                          </div>

                          {/* Interactive Particle Selector */}
                          <div
                            className="flex items-center p-1 rounded-xl border text-xs font-mono"
                            style={{
                              backgroundColor: isDark ? "rgba(18, 33, 28, 0.6)" : "rgba(240, 245, 242, 0.8)",
                              borderColor: isDark ? "rgba(147, 226, 197, 0.2)" : "rgba(15, 56, 44, 0.15)",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => setActiveParticle("pm10")}
                              className={`flex-1 py-1.5 rounded-lg transition-all ${
                                activeParticle === "pm10"
                                  ? "bg-amber-500 text-white font-bold shadow-xs"
                                  : "text-[var(--dash-muted)]"
                              }`}
                            >
                              PM10 Coarse Mode
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveParticle("pm25")}
                              className={`flex-1 py-1.5 rounded-lg transition-all ${
                                activeParticle === "pm25"
                                  ? "bg-rose-600 text-white font-bold shadow-xs"
                                  : "text-[var(--dash-muted)]"
                              }`}
                            >
                              PM2.5 Bio-Penetration Mode
                            </button>
                          </div>

                          {/* Step-by-Step Anatomical Nodes */}
                          <div className="space-y-3 pt-2">
                            {[
                              {
                                id: "nasal",
                                step: "01",
                                title: "Nasal Turbinates & Cilia",
                                target: "Mechanical mucosal filtration",
                                pm10Effect: "HALTED & ENTRAPPED",
                                pm25Effect: "BYPASSES EASILY",
                                pm10Active: true,
                                pm25Active: true,
                              },
                              {
                                id: "bronchial",
                                step: "02",
                                title: "Tracheobronchial Mucosa",
                                target: "Mucociliary escalator sweep",
                                pm10Effect: "CLEARED VIA COUGH",
                                pm25Effect: "PENETRATES FURTHER",
                                pm10Active: true,
                                pm25Active: true,
                              },
                              {
                                id: "alveolar",
                                step: "03",
                                title: "Deep Alveolar Sacs",
                                target: "Non-ciliated terminal gas exchange",
                                pm10Effect: "NO INGRESS",
                                pm25Effect: "DEEP MACROPHAGE CYTOKINES",
                                pm10Active: false,
                                pm25Active: true,
                              },
                              {
                                id: "bloodstream",
                                step: "04",
                                title: "Vascular Capillary Diffusion",
                                target: "Crosses alveolar-capillary membrane",
                                pm10Effect: "NO INGRESS",
                                pm25Effect: "SYSTEMIC INFLAMMATION & CLOTS",
                                pm10Active: false,
                                pm25Active: true,
                              },
                            ].map((node) => {
                              const isTraversed =
                                activeParticle === "pm10" ? node.pm10Active : node.pm25Active;

                              return (
                                <div
                                  key={node.id}
                                  className={`p-3 rounded-xl border transition-all ${
                                    isTraversed
                                      ? activeParticle === "pm10"
                                        ? "border-amber-500/50 bg-amber-500/5"
                                        : "border-rose-500/60 bg-rose-500/10 shadow-xs"
                                      : "border-[var(--dash-rule)]/40 opacity-40"
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold ${
                                          isTraversed
                                            ? activeParticle === "pm10"
                                              ? "bg-amber-500 text-white"
                                              : "bg-rose-600 text-white"
                                            : "bg-neutral-500/20 text-neutral-400"
                                        }`}
                                      >
                                        {node.step}
                                      </span>
                                      <span className="text-xs font-bold">{node.title}</span>
                                    </div>
                                    <span
                                      className={`font-mono text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                        activeParticle === "pm10"
                                          ? isTraversed
                                            ? "text-amber-500 bg-amber-500/10"
                                            : "text-neutral-400"
                                          : isTraversed
                                          ? "text-rose-500 bg-rose-500/10"
                                          : "text-neutral-400"
                                      }`}
                                    >
                                      {activeParticle === "pm10" ? node.pm10Effect : node.pm25Effect}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-[var(--dash-muted)] pl-7">
                                    {node.target}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Chapter 3 Right Content: Sensitive Populations Tabs */}
                      {currentChapter === 3 && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold">Vulnerability Cohorts</h3>
                            <span className="font-mono text-[10px] text-emerald-500 font-bold uppercase">
                              CLINICAL PROFILES
                            </span>
                          </div>

                          {/* Sensitive Tabs with Framer Motion LayoutId Pill */}
                          <div
                            className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 rounded-xl border text-xs font-medium"
                            style={{
                              backgroundColor: isDark ? "rgba(18, 33, 28, 0.6)" : "rgba(240, 245, 242, 0.8)",
                              borderColor: isDark ? "rgba(147, 226, 197, 0.2)" : "rgba(15, 56, 44, 0.15)",
                            }}
                          >
                            {(
                              [
                                { key: "children", label: "Children" },
                                { key: "seniors", label: "Seniors 65+" },
                                { key: "asthma", label: "Asthma / COPD" },
                                { key: "cardiac", label: "Cardiac" },
                              ] as { key: SensitiveGroupKey; label: string }[]
                            ).map((tab) => (
                              <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveSensitiveGroup(tab.key)}
                                className={`relative py-1.5 px-2 rounded-lg text-center transition-colors z-10 ${
                                  activeSensitiveGroup === tab.key
                                    ? "text-white font-bold"
                                    : "text-[var(--dash-muted)] hover:opacity-80"
                                }`}
                              >
                                {activeSensitiveGroup === tab.key && (
                                  <motion.div
                                    layoutId="activeTabPill"
                                    className="absolute inset-0 rounded-lg bg-emerald-600 shadow-xs z-[-1]"
                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                  />
                                )}
                                <span>{tab.label}</span>
                              </button>
                            ))}
                          </div>

                          {/* Selected Cohort Card */}
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={activeSensitiveGroup}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                              className="p-4 rounded-xl border space-y-3"
                              style={{
                                backgroundColor: isDark ? "rgba(18, 33, 28, 0.4)" : "rgba(255, 255, 255, 0.8)",
                                borderColor: isDark ? "rgba(147, 226, 197, 0.15)" : "rgba(15, 56, 44, 0.12)",
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <h4 className="text-base font-bold">
                                  {SENSITIVE_GROUPS[activeSensitiveGroup].title}
                                </h4>
                                <span
                                  className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full"
                                  style={{
                                    color: SENSITIVE_GROUPS[activeSensitiveGroup].riskColor,
                                    backgroundColor: `${SENSITIVE_GROUPS[activeSensitiveGroup].riskColor}18`,
                                  }}
                                >
                                  {SENSITIVE_GROUPS[activeSensitiveGroup].badge}
                                </span>
                              </div>

                              <div className="font-mono text-[10px] text-[var(--dash-muted)] space-y-0.5 border-b border-[var(--dash-rule)] pb-2.5">
                                <div>
                                  Trigger Threshold:{" "}
                                  <strong className="text-[var(--dash-ink)]">
                                    {SENSITIVE_GROUPS[activeSensitiveGroup].criticalThreshold}
                                  </strong>
                                </div>
                                <div>{SENSITIVE_GROUPS[activeSensitiveGroup].biometrics}</div>
                              </div>

                              <p className="text-xs text-[var(--dash-muted)] leading-relaxed">
                                {SENSITIVE_GROUPS[activeSensitiveGroup].mechanism}
                              </p>

                              <div className="pt-1 space-y-1.5">
                                <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase block">
                                  CRITICAL CLINICAL PROTOCOLS
                                </span>
                                {SENSITIVE_GROUPS[activeSensitiveGroup].clinicalDos.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-start gap-2 text-xs text-[var(--dash-muted)]"
                                  >
                                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          </AnimatePresence>
                        </div>
                      )}

                      {/* Chapter 4 Right Content: Medical Interventions & Gear Grid */}
                      {currentChapter === 4 && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold">Actionable Equipment Grid</h3>
                            <span className="font-mono text-[10px] text-emerald-500 font-bold uppercase">
                              CLICK TO OPEN PROTOCOL
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {INTERVENTIONS.map((gear) => (
                              <motion.div
                                key={gear.id}
                                whileHover={{ scale: 1.02, translateY: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedIntervention(gear)}
                                className="p-3.5 rounded-xl border cursor-pointer transition-all space-y-2 group"
                                style={{
                                  backgroundColor: isDark
                                    ? "rgba(18, 33, 28, 0.4)"
                                    : "rgba(255, 255, 255, 0.7)",
                                  borderColor: isDark
                                    ? "rgba(147, 226, 197, 0.15)"
                                    : "rgba(15, 56, 44, 0.12)",
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <span
                                    className="font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border"
                                    style={{
                                      color: gear.statusColor,
                                      borderColor: `${gear.statusColor}40`,
                                      backgroundColor: `${gear.statusColor}10`,
                                    }}
                                  >
                                    {gear.status}
                                  </span>
                                  <ChevronRight
                                    size={14}
                                    className="text-[var(--dash-muted)] group-hover:translate-x-1 transition-transform"
                                  />
                                </div>
                                <h4 className="text-xs font-bold group-hover:text-emerald-500 transition-colors">
                                  {gear.name}
                                </h4>
                                <p className="text-[10px] text-[var(--dash-muted)] line-clamp-2">
                                  {gear.summary}
                                </p>
                                <span className="font-mono text-[9px] text-emerald-500 font-bold block pt-1">
                                  {gear.filtrationEfficiency}
                                </span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Page Number Footer */}
                    <div className="pt-8 flex items-center justify-between text-[11px] font-mono text-[var(--dash-muted)] border-t border-[var(--dash-rule)]/40 mt-6">
                      <span>CPCB EPIDEMIOLOGICAL ARCHIVES</span>
                      <span className="font-bold">PAGE 0{currentChapter * 2}</span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
                </ThreeBookCanvas>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* ------------------------------------------------------------------ */
        /* 3. MODE B: FLAT EDITORIAL GRID DASHBOARD (RESPONSIVE & SCROLL-DRIVEN) */
        /* ------------------------------------------------------------------ */
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">
          {/* Section 1: Hero Exposure Headline */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="p-6 sm:p-10 rounded-2xl border backdrop-blur-md space-y-4"
            style={{
              backgroundColor: isDark ? "rgba(18, 33, 28, 0.6)" : "rgba(255, 255, 255, 0.8)",
              borderColor: isDark ? "rgba(147, 226, 197, 0.15)" : "rgba(15, 56, 44, 0.12)",
            }}
          >
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-500 uppercase">
              <span className="w-4 h-[1.5px] bg-emerald-500" />
              <span>SECTION 01 · AMBIENT EXPOSURE BURDEN</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold tracking-tight">
              Clinical Pathophysiology &amp; Protective Protocols
            </h2>
            <p className="text-sm sm:text-base text-[var(--dash-muted)] leading-relaxed max-w-3xl">
              An evidence-based health reference for navigating severe airborne particulate matter.
              Data is synced directly with live Central Pollution Control Board (CPCB) monitoring
              stations.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[var(--dash-rule)]">
              <div className="p-3 rounded-xl border border-[var(--dash-rule)]/50">
                <span className="text-[10px] font-mono text-[var(--dash-muted)] block uppercase">
                  Current Airshed
                </span>
                <span className="text-lg font-bold">{liveCity} Telemetry</span>
              </div>
              <div className="p-3 rounded-xl border border-[var(--dash-rule)]/50">
                <span className="text-[10px] font-mono text-[var(--dash-muted)] block uppercase">
                  Reported CPCB AQI
                </span>
                <span className="text-lg font-bold text-rose-500 font-mono">
                  {liveAqi} (Severe Tier)
                </span>
              </div>
              <div className="p-3 rounded-xl border border-[var(--dash-rule)]/50">
                <span className="text-[10px] font-mono text-[var(--dash-muted)] block uppercase">
                  Daily Cigarette Burden
                </span>
                <span className="text-lg font-bold text-rose-500 font-mono">
                  ~{cigaretteEquivalent} Cigarettes / Day
                </span>
              </div>
            </div>
          </motion.section>

          {/* Section 2: PM2.5 vs PM10 Pathophysiology */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, staggerChildren: 0.1 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-500 uppercase">
                  SECTION 02 · PARTICLE MECHANICS
                </span>
                <h3 className="text-xl sm:text-2xl font-bold mt-1">
                  PM2.5 vs PM10 Pathophysiology
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-3">
                <span className="font-mono text-xs font-bold text-amber-500 uppercase">
                  COARSE MATTER (PM10 ≤ 10 µm)
                </span>
                <h4 className="text-lg font-bold">Upper Airway Entrapment</h4>
                <p className="text-xs leading-relaxed text-[var(--dash-muted)]">
                  Derived from pulverized road dust, construction concrete, and pollen. Inertial
                  impaction traps these coarse particles in the upper nasal passages and trachea.
                  Symptoms include acute sinus irritation, cough, and pharyngitis.
                </p>
                <div className="font-mono text-[11px] text-amber-500 font-semibold pt-1">
                  Anatomical Limit: Tracheobronchial Cilia (Does not reach capillaries)
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-500/5 space-y-3">
                <span className="font-mono text-xs font-bold text-rose-500 uppercase">
                  FINE SOOT (PM2.5 ≤ 2.5 µm)
                </span>
                <h4 className="text-lg font-bold">Deep Alveolar Translocation</h4>
                <p className="text-xs leading-relaxed text-[var(--dash-muted)]">
                  Originates from vehicular combustion, industrial smoke, and agricultural burning.
                  Bypasses ciliated airways entirely, reaching terminal non-ciliated alveoli.
                  Translocates across the blood barrier, causing vascular plaque instability, stroke,
                  and infarction.
                </p>
                <div className="font-mono text-[11px] text-rose-500 font-semibold pt-1">
                  Anatomical Limit: Deep Systemic Capillary Circulation
                </div>
              </div>
            </div>
          </motion.section>

          {/* Section 3: Sensitive Groups Selector */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="p-6 sm:p-10 rounded-2xl border backdrop-blur-md space-y-6"
            style={{
              backgroundColor: isDark ? "rgba(18, 33, 28, 0.6)" : "rgba(255, 255, 255, 0.8)",
              borderColor: isDark ? "rgba(147, 226, 197, 0.15)" : "rgba(15, 56, 44, 0.12)",
            }}
          >
            <div>
              <span className="text-xs font-mono font-bold text-emerald-500 uppercase">
                SECTION 03 · CLINICAL PROFILES
              </span>
              <h3 className="text-xl sm:text-2xl font-bold mt-1">Sensitive Population Guidance</h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  { key: "children", label: "Children & Infants" },
                  { key: "seniors", label: "Seniors (65+)" },
                  { key: "asthma", label: "Asthma & COPD" },
                  { key: "cardiac", label: "Cardiovascular Patients" },
                ] as { key: SensitiveGroupKey; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveSensitiveGroup(tab.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-mono transition-all ${
                    activeSensitiveGroup === tab.key
                      ? "bg-emerald-600 text-white font-bold shadow-xs"
                      : "border border-[var(--dash-rule)] hover:bg-neutral-500/10 text-[var(--dash-muted)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-5 rounded-xl border border-[var(--dash-rule)]/60 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold">
                  {SENSITIVE_GROUPS[activeSensitiveGroup].title}
                </h4>
                <span
                  className="text-xs font-mono font-bold px-3 py-1 rounded-full"
                  style={{
                    color: SENSITIVE_GROUPS[activeSensitiveGroup].riskColor,
                    backgroundColor: `${SENSITIVE_GROUPS[activeSensitiveGroup].riskColor}18`,
                  }}
                >
                  {SENSITIVE_GROUPS[activeSensitiveGroup].badge}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[var(--dash-muted)] leading-relaxed">
                {SENSITIVE_GROUPS[activeSensitiveGroup].mechanism}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono font-bold text-emerald-500 uppercase block">
                    RECOMMENDED ACTIONS
                  </span>
                  {SENSITIVE_GROUPS[activeSensitiveGroup].clinicalDos.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-[var(--dash-muted)]">
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono font-bold text-rose-500 uppercase block">
                    HAZARDS TO AVOID
                  </span>
                  {SENSITIVE_GROUPS[activeSensitiveGroup].clinicalDonts.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-[var(--dash-muted)]">
                      <XCircle size={13} className="text-rose-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>

          {/* Section 4: Intervention Gear Grid */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div>
              <span className="text-xs font-mono font-bold text-emerald-500 uppercase">
                SECTION 04 · PHYSICAL INTERVENTIONS
              </span>
              <h3 className="text-xl sm:text-2xl font-bold mt-1">Medical Gear &amp; Equipment Protocols</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {INTERVENTIONS.map((gear) => (
                <motion.div
                  key={gear.id}
                  whileHover={{ scale: 1.02, translateY: -3 }}
                  onClick={() => setSelectedIntervention(gear)}
                  className="p-5 rounded-2xl border cursor-pointer transition-all space-y-3 flex flex-col justify-between"
                  style={{
                    backgroundColor: isDark ? "rgba(18, 33, 28, 0.6)" : "rgba(255, 255, 255, 0.8)",
                    borderColor: isDark ? "rgba(147, 226, 197, 0.15)" : "rgba(15, 56, 44, 0.12)",
                  }}
                >
                  <div className="space-y-2">
                    <span
                      className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full border inline-block"
                      style={{
                        color: gear.statusColor,
                        borderColor: `${gear.statusColor}40`,
                        backgroundColor: `${gear.statusColor}10`,
                      }}
                    >
                      {gear.status}
                    </span>
                    <h4 className="text-base font-bold">{gear.name}</h4>
                    <p className="text-xs text-[var(--dash-muted)] leading-relaxed">
                      {gear.summary}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[var(--dash-rule)]/50 flex items-center justify-between text-xs font-mono text-emerald-500 font-semibold">
                    <span>View Usage Guide</span>
                    <ArrowRight size={13} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </main>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 4. EXPANDING CLINICAL USAGE DRAWER / MODAL                         */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {selectedIntervention && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-xl rounded-3xl border shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
              style={{
                backgroundColor: isDark ? "#0f1c18" : "#ffffff",
                borderColor: isDark ? "rgba(147, 226, 197, 0.25)" : "rgba(15, 56, 44, 0.2)",
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full border inline-block mb-1.5"
                    style={{
                      color: selectedIntervention.statusColor,
                      borderColor: `${selectedIntervention.statusColor}40`,
                      backgroundColor: `${selectedIntervention.statusColor}10`,
                    }}
                  >
                    {selectedIntervention.status}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold">{selectedIntervention.name}</h3>
                  <p className="text-xs font-mono text-[var(--dash-muted)]">
                    {selectedIntervention.subtitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedIntervention(null)}
                  className="p-2 rounded-full border hover:bg-neutral-500/10 transition-colors"
                  aria-label="Close dialog"
                >
                  <X size={16} />
                </button>
              </div>

              <div
                className="p-3.5 rounded-xl border text-xs font-mono space-y-1"
                style={{
                  backgroundColor: isDark ? "rgba(18, 33, 28, 0.6)" : "rgba(240, 245, 242, 0.8)",
                  borderColor: isDark ? "rgba(147, 226, 197, 0.2)" : "rgba(15, 56, 44, 0.15)",
                }}
              >
                <div>
                  Filtration Efficiency:{" "}
                  <strong className="text-emerald-500">
                    {selectedIntervention.filtrationEfficiency}
                  </strong>
                </div>
                <div>
                  Primary Particle Target:{" "}
                  <strong className="text-[var(--dash-ink)]">
                    {selectedIntervention.targetParticle}
                  </strong>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-mono font-bold text-emerald-500 uppercase tracking-wider block">
                  STEP-BY-STEP CLINICAL PROTOCOL
                </span>
                <ol className="space-y-2 text-xs sm:text-sm text-[var(--dash-muted)] list-decimal pl-4 leading-relaxed">
                  {selectedIntervention.protocolSteps.map((step, idx) => (
                    <li key={idx}>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="space-y-2 pt-2 border-t border-[var(--dash-rule)]/50">
                <span className="text-[11px] font-mono font-bold text-[var(--dash-muted)] uppercase block">
                  SCIENTIFIC CITATIONS &amp; STANDARDS
                </span>
                <ul className="text-xs text-[var(--dash-muted)] space-y-1">
                  {selectedIntervention.clinicalCitations.map((cite, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <ExternalLink size={12} className="text-emerald-500 shrink-0" />
                      <span>{cite}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl border border-dashed border-[var(--dash-rule)] text-xs text-[var(--dash-muted)]">
                <strong>Notice: </strong>
                {selectedIntervention.maintenanceNotice}
              </div>

              <button
                type="button"
                onClick={() => setSelectedIntervention(null)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
              >
                Dismiss Protocol Guide
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
