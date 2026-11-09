"use client";

import React from "react";
import {
  ArrowRight,
  CheckCircle2,
  CloudFog,
  Factory,
  Flame,
  Globe,
  HeartPulse,
  RadioTower,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Wind,
  Zap,
} from "lucide-react";
import { useTheme } from "@/lib/use-theme";

export function AboutView() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Dynamic Theme Palette Tokens (Aligned with Public Marketing Shell)
  const canvasBg = isDark ? "#0b1412" : "#f7f6f0";
  const cardBg = isDark ? "#12211c" : "#ffffff";
  const cardSoftBg = isDark ? "#162822" : "#f4f6f4";
  const borderRule = isDark ? "rgba(147, 226, 197, 0.16)" : "rgba(15, 56, 44, 0.14)";
  const inkColor = isDark ? "#f2f7f4" : "#111111";
  const mutedColor = isDark ? "#9cb0a5" : "#5d6e64";
  const accentGreen = isDark ? "#83dfbd" : "#1e754f";
  const displayFont = "'DM Serif Display', Georgia, serif";

  return (
    <div
      className="w-full min-h-screen transition-colors duration-250 overflow-x-hidden"
      style={{
        backgroundColor: canvasBg,
        color: inkColor,
      }}
      data-theme={theme}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12 py-8 sm:py-12 md:py-16 space-y-12 sm:space-y-16 md:space-y-24">
        {/* ------------------------------------------------------------------ */}
        {/* 1. Hero Section (Vayu Editorial Style) */}
        {/* ------------------------------------------------------------------ */}
        <section
          className="relative flex flex-col justify-center pt-2 sm:pt-6 pb-10 sm:pb-16 border-b"
          style={{ borderColor: borderRule }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-8 space-y-4 sm:space-y-6 z-10">
              <span
                className="inline-flex items-center gap-2 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest"
                style={{ color: accentGreen }}
              >
                <span className="w-5 h-[1.5px]" style={{ backgroundColor: accentGreen }} />
                ARCHITECTURAL FOUNDATION &amp; PHILOSOPHY
              </span>

              <h1
                className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight leading-[1.04] sm:leading-[1.01] font-normal"
                style={{
                  fontFamily: displayFont,
                  color: inkColor,
                }}
              >
                Make the air{" "}
                <em className="italic" style={{ color: accentGreen }}>
                  easier to understand.
                </em>
              </h1>

              <p
                className="max-w-2xl text-sm sm:text-base md:text-lg leading-relaxed"
                style={{ color: mutedColor }}
              >
                Vayu Index brings together ground-truth station telemetry, atmospheric models, and health benchmarks, making the origin and safe limits of every reading completely transparent.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 w-full sm:w-auto">
                <a
                  href="/overview"
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full text-xs sm:text-sm font-bold shadow-md hover:opacity-90 transition-all no-underline"
                  style={{
                    backgroundColor: isDark ? "#83dfbd" : "#0f382c",
                    color: isDark ? "#081410" : "#ffffff",
                  }}
                >
                  <span>Explore the Dashboard</span>
                  <ArrowRight size={16} />
                </a>

                <span
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full text-xs font-mono border"
                  style={{
                    borderColor: borderRule,
                    background: cardSoftBg,
                    color: mutedColor,
                  }}
                >
                  <RadioTower size={14} style={{ color: accentGreen }} />
                  <span>Zero-Hallucination Pipeline</span>
                </span>
              </div>
            </div>

            {/* Minimal Abstract Orbit Graphic */}
            <div className="hidden md:flex lg:col-span-4 relative items-center justify-center min-h-[240px] lg:min-h-[280px] pointer-events-none">
              <div
                className="relative w-56 h-56 sm:w-64 sm:h-64 lg:w-72 lg:h-72 rounded-full border border-dashed flex items-center justify-center animate-spin"
                style={{
                  borderColor: isDark ? "rgba(131, 223, 189, 0.35)" : "rgba(39, 123, 86, 0.28)",
                  animationDuration: "40s",
                }}
              >
                <div
                  className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border flex items-center justify-center"
                  style={{
                    borderColor: isDark ? "rgba(131, 223, 189, 0.45)" : "rgba(39, 123, 86, 0.35)",
                  }}
                >
                  <div
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border flex items-center justify-center shadow-inner"
                    style={{
                      borderColor: isDark ? "rgba(131, 223, 189, 0.65)" : "rgba(39, 123, 86, 0.5)",
                      background: isDark ? "rgba(131, 223, 189, 0.08)" : "rgba(39, 123, 86, 0.05)",
                    }}
                  >
                    <Wind
                      size={24}
                      style={{ color: accentGreen }}
                      className="opacity-90 animate-pulse"
                    />
                  </div>
                </div>

                {/* Orbiting Telemetry Nodes */}
                <span
                  className="absolute top-2 left-10 w-2.5 h-2.5 rounded-full shadow-sm"
                  style={{ backgroundColor: accentGreen }}
                />
                <span
                  className="absolute bottom-6 right-8 w-2 h-2 rounded-full shadow-sm"
                  style={{ backgroundColor: isDark ? "#f3a16b" : "#c7773d" }}
                />
                <span
                  className="absolute top-1/2 -right-1 w-2 h-2 rounded-full shadow-sm"
                  style={{ backgroundColor: isDark ? "#60a5fa" : "#2563eb" }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* 2. Mission Statement Section */}
        {/* ------------------------------------------------------------------ */}
        <section className="space-y-4 sm:space-y-6">
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest"
              style={{ color: accentGreen }}
            >
              SECTION 01 · CORE MISSION
            </span>
          </div>

          <div
            className="rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 lg:p-12 border shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-center transition-all"
            style={{
              backgroundColor: cardBg,
              borderColor: borderRule,
            }}
          >
            {/* Mission Narrative Left Block */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-bold tracking-wider uppercase border"
                style={{
                  backgroundColor: isDark ? "rgba(131, 223, 189, 0.12)" : "rgba(39, 123, 86, 0.1)",
                  color: accentGreen,
                  borderColor: isDark ? "rgba(131, 223, 189, 0.3)" : "rgba(39, 123, 86, 0.25)",
                }}
              >
                <Sparkles size={12} /> ENVIRONMENTAL INTELLIGENCE FOR ALL
              </span>

              <h2
                className="text-2xl sm:text-3xl md:text-4xl tracking-tight leading-snug font-normal"
                style={{
                  fontFamily: displayFont,
                  color: inkColor,
                }}
              >
                Democratizing air quality telemetry with uncompromised clarity.
              </h2>

              <p className="text-xs sm:text-sm md:text-base leading-relaxed opacity-85" style={{ color: mutedColor }}>
                We believe clean air transparency is a fundamental right. Our mission is to democratize environmental intelligence by delivering an intuitive platform that translates complex meteorological and chemical data into clear, actionable health insights for everyone.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-1 sm:pt-2">
                <div
                  className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border"
                  style={{
                    backgroundColor: cardSoftBg,
                    borderColor: borderRule,
                  }}
                >
                  <strong className="block text-lg sm:text-xl font-bold font-mono" style={{ color: inkColor }}>100%</strong>
                  <span className="text-[11px] sm:text-xs" style={{ color: mutedColor }}>
                    Physical Provenance
                  </span>
                </div>
                <div
                  className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border"
                  style={{
                    backgroundColor: cardSoftBg,
                    borderColor: borderRule,
                  }}
                >
                  <strong className="block text-lg sm:text-xl font-bold font-mono" style={{ color: inkColor }}>300+</strong>
                  <span className="text-[11px] sm:text-xs" style={{ color: mutedColor }}>
                    CPCB Active Stations
                  </span>
                </div>
                <div
                  className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border"
                  style={{
                    backgroundColor: cardSoftBg,
                    borderColor: borderRule,
                  }}
                >
                  <strong className="block text-lg sm:text-xl font-bold font-mono" style={{ color: inkColor }}>Zero</strong>
                  <span className="text-[11px] sm:text-xs" style={{ color: mutedColor }}>
                    Simulated Hallucinations
                  </span>
                </div>
              </div>
            </div>

            {/* High-Resolution Landscape Image Right Block */}
            <div className="lg:col-span-5 relative w-full h-[220px] sm:h-[300px] md:h-[360px] lg:h-[390px] rounded-xl sm:rounded-2xl overflow-hidden shadow-md border border-black/10">
              <img
                src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"
                alt="Pristine mountain and forest landscape representing pure atmospheric air"
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4 sm:p-6">
                <span className="text-white text-[10px] sm:text-xs font-mono tracking-wider backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-black/40 border border-white/20">
                  Pristine Atmosphere · The Clean Air Standard
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- */}
        {/* 3. How We Get Our Data (Multi-Source Pipeline Architecture) */}
        {/* ---------------------------------------------------- */}
        <section className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span
                className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest block mb-1"
                style={{ color: accentGreen }}
              >
                SECTION 02 · PIPELINE ARCHITECTURE
              </span>
              <h2
                className="text-2xl sm:text-3xl md:text-4xl tracking-tight font-normal"
                style={{
                  fontFamily: displayFont,
                  color: inkColor,
                }}
              >
                How We Ingest &amp; Verify Atmospheric Data
              </h2>
            </div>
            <span className="text-[11px] sm:text-xs font-mono" style={{ color: mutedColor }}>
              Strict Fallback Hierarchy · Real-Time Resolution
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Card 1: CPCB */}
            <div
              className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl border shadow-sm flex flex-col justify-between space-y-4 sm:space-y-5 transition-all hover:-translate-y-1"
              style={{
                backgroundColor: cardBg,
                borderColor: borderRule,
              }}
            >
              <div className="space-y-2.5 sm:space-y-3">
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center"
                  style={{
                    backgroundColor: isDark ? "rgba(131, 223, 189, 0.15)" : "rgba(39, 123, 86, 0.1)",
                    color: accentGreen,
                  }}
                >
                  <RadioTower size={22} />
                </div>
                <span
                  className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider block"
                  style={{ color: accentGreen }}
                >
                  PRIMARY TIER · INDIA
                </span>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight" style={{ color: inkColor }}>
                  CPCB Official Telemetry
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed" style={{ color: mutedColor }}>
                  Direct ground-truth station observations from India&apos;s Central Pollution Control Board via data.gov.in and state boards (DPCC, MPCB, BSPCB). Provides verified hourly sub-indices across 300+ city stations.
                </p>
              </div>
              <div
                className="pt-3 border-t text-[11px] font-mono font-medium flex items-center justify-between"
                style={{ borderColor: borderRule }}
              >
                <span style={{ color: mutedColor }}>Provenance: Physical CAAQMS</span>
                <CheckCircle2 size={15} style={{ color: accentGreen }} />
              </div>
            </div>

            {/* Card 2: OpenAQ & WAQI */}
            <div
              className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl border shadow-sm flex flex-col justify-between space-y-4 sm:space-y-5 transition-all hover:-translate-y-1"
              style={{
                backgroundColor: cardBg,
                borderColor: borderRule,
              }}
            >
              <div className="space-y-2.5 sm:space-y-3">
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center"
                  style={{
                    backgroundColor: isDark ? "rgba(96, 165, 250, 0.15)" : "rgba(37, 99, 235, 0.1)",
                    color: isDark ? "#93c5fd" : "#2563eb",
                  }}
                >
                  <Globe size={22} />
                </div>
                <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 block">
                  SECONDARY TIER · GLOBAL
                </span>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight" style={{ color: inkColor }}>
                  OpenAQ v3 &amp; WAQI
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed" style={{ color: mutedColor }}>
                  Worldwide physical ground stations aggregating government sensor feeds across 100+ nations. Enforces strict unit conversions and timestamps before inferring international composite standards.
                </p>
              </div>
              <div
                className="pt-3 border-t text-[11px] font-mono font-medium flex items-center justify-between"
                style={{ borderColor: borderRule }}
              >
                <span style={{ color: mutedColor }}>Coverage: 100+ Nations</span>
                <CheckCircle2 size={15} className="text-sky-600 dark:text-sky-400" />
              </div>
            </div>

            {/* Card 3: Open-Meteo & Copernicus */}
            <div
              className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl border shadow-sm flex flex-col justify-between space-y-4 sm:space-y-5 transition-all hover:-translate-y-1"
              style={{
                backgroundColor: cardBg,
                borderColor: borderRule,
              }}
            >
              <div className="space-y-2.5 sm:space-y-3">
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center"
                  style={{
                    backgroundColor: isDark ? "rgba(245, 158, 11, 0.15)" : "rgba(217, 119, 6, 0.1)",
                    color: isDark ? "#fbbf24" : "#d97706",
                  }}
                >
                  <Wind size={22} />
                </div>
                <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                  TERTIARY TIER · REANALYSIS
                </span>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight" style={{ color: inkColor }}>
                  Open-Meteo &amp; Copernicus
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed" style={{ color: mutedColor }}>
                  Copernicus Atmosphere Monitoring Service (CAMS) 11km reanalysis models and Open-Meteo weather grids. Delivers continuous spatial wind vectors, multi-day historical slices, and 72-hour forecasts.
                </p>
              </div>
              <div
                className="pt-3 border-t text-[11px] font-mono font-medium flex items-center justify-between"
                style={{ borderColor: borderRule }}
              >
                <span style={{ color: mutedColor }}>Model: CAMS Reanalysis</span>
                <CheckCircle2 size={15} className="text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>

          {/* Data Integrity Statement */}
          <div
            className="p-4 sm:p-6 rounded-xl sm:rounded-2xl border flex flex-col sm:flex-row items-start gap-3.5 sm:gap-4"
            style={{
              backgroundColor: cardSoftBg,
              borderColor: borderRule,
            }}
          >
            <ShieldCheck
              size={22}
              className="flex-none mt-0.5"
              style={{ color: accentGreen }}
            />
            <div className="space-y-1">
              <h4 className="text-xs sm:text-sm font-bold tracking-tight" style={{ color: inkColor }}>
                Strict Zero-Hallucination &amp; Provenance Tagging Policy
              </h4>
              <p className="text-xs sm:text-sm leading-relaxed opacity-80" style={{ color: mutedColor }}>
                Vayu Index strictly forbids fabricated or AI-hallucinated telemetry. Every data point is tagged with its authentic provenance badge—identifying whether it originates from a verified physical CPCB monitoring station, an OpenAQ sensor, or a CAMS reanalysis numerical model.
              </p>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- */}
        {/* 4. Understanding CPCB Indian NAQI & Health Bands (6-Card Grid) */}
        {/* ---------------------------------------------------- */}
        <section className="space-y-4 sm:space-y-6">
          <div>
            <span
              className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest block mb-1"
              style={{ color: accentGreen }}
            >
              SECTION 03 · NATIONAL AIR QUALITY INDEX
            </span>
            <h2
              className="text-2xl sm:text-3xl md:text-4xl tracking-tight font-normal"
              style={{
                fontFamily: displayFont,
                color: inkColor,
              }}
            >
              Understanding Air Quality Standards (CPCB NAQI 0–500 Scale)
            </h2>
            <p className="text-xs sm:text-sm opacity-75 mt-1 max-w-3xl" style={{ color: mutedColor }}>
              Established by the Central Pollution Control Board (CPCB), the National Air Quality Index transforms complex concentrations of eight criteria pollutants into a single color-coded health risk metric.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-5">
            {/* 1. Good (0-50) */}
            <div
              className="p-4 sm:p-5 rounded-xl sm:rounded-2xl border shadow-xs space-y-2.5 sm:space-y-3"
              style={{
                backgroundColor: cardBg,
                borderColor: borderRule,
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-mono font-bold text-white shadow-xs"
                  style={{ backgroundColor: "#00B050" }}
                >
                  Good (0–50)
                </span>
                <span className="text-[11px] sm:text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  #00B050
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold" style={{ color: inkColor }}>Minimal Risk</h3>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: mutedColor }}>
                Air quality is minimal risk. Clean atmospheric conditions posing virtually no health hazards for all age groups.
              </p>
            </div>

            {/* 2. Satisfactory (51-100) */}
            <div
              className="p-4 sm:p-5 rounded-xl sm:rounded-2xl border shadow-xs space-y-2.5 sm:space-y-3"
              style={{
                backgroundColor: cardBg,
                borderColor: borderRule,
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-mono font-bold text-neutral-900 shadow-xs"
                  style={{ backgroundColor: "#92D050" }}
                >
                  Satisfactory (51–100)
                </span>
                <span className="text-[11px] sm:text-xs font-mono font-bold text-lime-600 dark:text-lime-400">
                  #92D050
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold" style={{ color: inkColor }}>Acceptable Quality</h3>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: mutedColor }}>
                Minor breathing discomfort to sensitive individuals. Generally tolerable for healthy adults and children.
              </p>
            </div>

            {/* 3. Moderate (101-200) */}
            <div
              className="p-4 sm:p-5 rounded-xl sm:rounded-2xl border shadow-xs space-y-2.5 sm:space-y-3"
              style={{
                backgroundColor: cardBg,
                borderColor: borderRule,
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-mono font-bold text-neutral-900 shadow-xs"
                  style={{ backgroundColor: "#EAB308" }}
                >
                  Moderate (101–200)
                </span>
                <span className="text-[11px] sm:text-xs font-mono font-bold text-yellow-600 dark:text-yellow-400">
                  #EAB308
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold" style={{ color: inkColor }}>Sensitive Caution</h3>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: mutedColor }}>
                Breathing discomfort for people with asthma, heart, or lung diseases. Vulnerable groups should limit prolonged outdoor exertion.
              </p>
            </div>

            {/* 4. Poor (201-300) */}
            <div
              className="p-4 sm:p-5 rounded-xl sm:rounded-2xl border shadow-xs space-y-2.5 sm:space-y-3"
              style={{
                backgroundColor: cardBg,
                borderColor: borderRule,
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-mono font-bold text-white shadow-xs"
                  style={{ backgroundColor: "#FF9900" }}
                >
                  Poor (201–300)
                </span>
                <span className="text-[11px] sm:text-xs font-mono font-bold text-orange-600 dark:text-orange-400">
                  #FF9900
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold" style={{ color: inkColor }}>General Discomfort</h3>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: mutedColor }}>
                Breathing discomfort to most people on prolonged exposure. Significant distress to persons with chronic cardiac or pulmonary conditions.
              </p>
            </div>

            {/* 5. Very Poor (301-400) */}
            <div
              className="p-4 sm:p-5 rounded-xl sm:rounded-2xl border shadow-xs space-y-2.5 sm:space-y-3"
              style={{
                backgroundColor: cardBg,
                borderColor: borderRule,
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-mono font-bold text-white shadow-xs"
                  style={{ backgroundColor: "#FF0000" }}
                >
                  Very Poor (301–400)
                </span>
                <span className="text-[11px] sm:text-xs font-mono font-bold text-red-600 dark:text-red-400">
                  #FF0000
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold" style={{ color: inkColor }}>Respiratory Illness Risk</h3>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: mutedColor }}>
                Respiratory illness on prolonged exposure. Pronounced effect on asthma, bronchitis, and cardiovascular patients.
              </p>
            </div>

            {/* 6. Severe (401-500) */}
            <div
              className="p-4 sm:p-5 rounded-xl sm:rounded-2xl border shadow-xs space-y-2.5 sm:space-y-3"
              style={{
                backgroundColor: cardBg,
                borderColor: borderRule,
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-mono font-bold text-white shadow-xs"
                  style={{ backgroundColor: "#C00000" }}
                >
                  Severe (401–500)
                </span>
                <span className="text-[11px] sm:text-xs font-mono font-bold text-rose-700 dark:text-rose-400">
                  #C00000
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold" style={{ color: inkColor }}>Emergency Warning</h3>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: mutedColor }}>
                Affects healthy people and seriously impacts those with existing conditions. Outdoor physical activity should be strictly avoided.
              </p>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- */}
        {/* 5. Key Pollutants We Monitor (2x3 Grid) */}
        {/* ---------------------------------------------------- */}
        <section className="space-y-4 sm:space-y-6">
          <div>
            <span
              className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest block mb-1"
              style={{ color: accentGreen }}
            >
              SECTION 04 · CHEMICAL TELEMETRY
            </span>
            <h2
              className="text-2xl sm:text-3xl md:text-4xl tracking-tight font-normal"
              style={{
                fontFamily: displayFont,
                color: inkColor,
              }}
            >
              Pollutants We Monitor
            </h2>
            <p className="text-xs sm:text-sm opacity-75 mt-1 max-w-2xl" style={{ color: mutedColor }}>
              Vayu Index ingests physical micro-climatic sensor readings for 6 primary criteria air contaminants defined by WHO &amp; CPCB.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-5">
            {/* PM2.5 */}
            <div
              className="p-4 sm:p-6 rounded-xl sm:rounded-2xl border shadow-xs space-y-2.5 sm:space-y-3 transition-all hover:border-[var(--dash-accent,#277b56)]"
              style={{
                backgroundColor: cardBg,
                borderColor: borderRule,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-rose-500/15 text-rose-500">
                  <HeartPulse size={18} />
                </div>
                <span className="text-[11px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  &lt; 2.5 µm
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight" style={{ color: inkColor }}>PM2.5 (Fine Particles)</h3>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: mutedColor }}>
                Fine particulate matter smaller than 2.5 microns that penetrates deep into pulmonary alveoli and enters systemic bloodstream, exacerbating cardiovascular disease.
              </p>
            </div>

            {/* PM10 */}
            <div
              className="p-4 sm:p-6 rounded-xl sm:rounded-2xl border shadow-xs space-y-2.5 sm:space-y-3 transition-all hover:border-[var(--dash-accent,#277b56)]"
              style={{
                backgroundColor: cardBg,
                borderColor: borderRule,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-amber-500/15 text-amber-500">
                  <CloudFog size={18} />
                </div>
                <span className="text-[11px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  &lt; 10 µm
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight" style={{ color: inkColor }}>PM10 (Coarse Particles)</h3>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: mutedColor }}>
                Inhalable coarse particulate matter from road dust, construction, and pollen causing mucosal irritation in the eyes, nasal pathways, and upper respiratory tract.
              </p>
            </div>

            {/* NO2 */}
            <div
              className="p-4 sm:p-6 rounded-xl sm:rounded-2xl border shadow-xs space-y-2.5 sm:space-y-3 transition-all hover:border-[var(--dash-accent,#277b56)]"
              style={{
                backgroundColor: cardBg,
                borderColor: borderRule,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-sky-500/15 text-sky-500">
                  <Flame size={18} />
                </div>
                <span className="text-[11px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                  NO₂ Gas
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight" style={{ color: inkColor }}>NO2 (Nitrogen Dioxide)</h3>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: mutedColor }}>
                Highly reactive gaseous oxidant emitted primarily by vehicular combustion and thermal power generation, inflaming bronchial airways and triggering asthma attacks.
              </p>
            </div>

            {/* O3 */}
            <div
              className="p-4 sm:p-6 rounded-xl sm:rounded-2xl border shadow-xs space-y-2.5 sm:space-y-3 transition-all hover:border-[var(--dash-accent,#277b56)]"
              style={{
                backgroundColor: cardBg,
                borderColor: borderRule,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-emerald-500/15 text-emerald-500">
                  <Zap size={18} />
                </div>
                <span className="text-[11px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  O₃ Gas
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight" style={{ color: inkColor }}>O3 (Ground-Level Ozone)</h3>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: mutedColor }}>
                Secondary photochemical smog created when nitrogen oxides react with volatile organic compounds (VOCs) in solar heat, reducing vital lung capacity.
              </p>
            </div>

            {/* CO */}
            <div
              className="p-4 sm:p-6 rounded-xl sm:rounded-2xl border shadow-xs space-y-2.5 sm:space-y-3 transition-all hover:border-[var(--dash-accent,#277b56)]"
              style={{
                backgroundColor: cardBg,
                borderColor: borderRule,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-purple-500/15 text-purple-500">
                  <ShieldAlert size={18} />
                </div>
                <span className="text-[11px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  CO Gas
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight" style={{ color: inkColor }}>CO (Carbon Monoxide)</h3>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: mutedColor }}>
                Colorless, odorless toxic gas generated by incomplete fossil fuel combustion that binds irreversibly to hemoglobin, impeding oxygen circulation to critical organs.
              </p>
            </div>

            {/* SO2 */}
            <div
              className="p-4 sm:p-6 rounded-xl sm:rounded-2xl border shadow-xs space-y-2.5 sm:space-y-3 transition-all hover:border-[var(--dash-accent,#277b56)]"
              style={{
                backgroundColor: cardBg,
                borderColor: borderRule,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-teal-500/15 text-teal-500">
                  <Factory size={18} />
                </div>
                <span className="text-[11px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                  SO₂ Gas
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight" style={{ color: inkColor }}>SO2 (Sulfur Dioxide)</h3>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: mutedColor }}>
                Pungent industrial gas discharged during coal burning and metallurgical smelting, causing acute mucosal spasms and precipitating chronic bronchitis.
              </p>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- */}
        {/* Footer Navigation */}
        {/* ---------------------------------------------------- */}
        <footer
          className="pt-6 sm:pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-center sm:text-left"
          style={{ borderColor: borderRule }}
        >
          <span style={{ color: mutedColor }}>
            VAYU INDEX · REAL-TIME GLOBAL ATMOSPHERIC INTELLIGENCE
          </span>
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="hover:underline flex items-center gap-1"
              style={{ color: accentGreen }}
            >
              Home
            </a>
            <span style={{ color: mutedColor }}>·</span>
            <a
              href="/overview"
              className="hover:underline flex items-center gap-1"
              style={{ color: accentGreen }}
            >
              Overview
            </a>
            <span style={{ color: mutedColor }}>·</span>
            <a
              href="/dashboard"
              className="hover:underline flex items-center gap-1"
              style={{ color: accentGreen }}
            >
              3D Globe
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default AboutView;
