"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { ArrowRight, RadioTower } from "lucide-react";
import { HealthCigaretteWidget } from "@/components/HealthCigaretteWidget";
import { HealthAdviceSelector } from "@/components/HealthAdviceSelector";
import { INITIAL_HOTSPOTS, type SpatialHotspot } from "@/components/OverviewSpatialMap";

// Dynamic import for Leaflet client-only rendering
const OverviewSpatialMap = dynamic(() => import("@/components/OverviewSpatialMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[640px] sm:h-[720px] rounded-3xl border border-[var(--dash-rule)] bg-[var(--dash-surface)] flex flex-col items-center justify-center gap-3">
      <span className="w-8 h-8 rounded-full border-2 border-[var(--dash-accent)] border-t-transparent animate-spin" />
      <span className="text-xs font-mono text-[var(--dash-muted)]">
        INITIALIZING SPATIAL HEATMAP ENGINE...
      </span>
    </div>
  ),
});

export default function OverviewPage() {
  const [selectedCity, setSelectedCity] = useState<SpatialHotspot>(INITIAL_HOTSPOTS[0]);

  return (
    <main className="overview-page-wrapper w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-12">
      {/* ------------------------------------------------------------------ */}
      {/* Editorial Header */}
      {/* ------------------------------------------------------------------ */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[var(--dash-rule)]">
        <div>
          <span className="flex items-center gap-2 text-xs sm:text-sm font-mono tracking-widest text-[var(--dash-muted)] font-bold">
            <span className="w-6 h-[1px] bg-[var(--dash-accent)]" />
            ATMOSPHERIC INTELLIGENCE HUB · EXECUTIVE OVERVIEW
          </span>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-normal tracking-tight text-[var(--dash-ink)] mt-2">
            Air, in <em>totality.</em>
          </h1>
          <p className="text-sm sm:text-base text-[var(--dash-muted)] max-w-2xl mt-1.5 leading-relaxed">
            Continuous global spatial heatmaps, validated ground-truth station observations, and personalized biological exposure metrics in one unified dashboard.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-end">
          <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-mono font-medium border border-[var(--dash-rule)] bg-[var(--dash-surface)] text-[var(--dash-ink)] shadow-sm">
            <RadioTower size={14} className="text-[var(--dash-accent)]" />
            OPENAQ V3 &amp; CAMS REANALYSIS
          </span>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-[var(--dash-accent)] text-white no-underline hover:opacity-90 shadow-sm transition-opacity"
          >
            <span>Explore 3D Globe</span>
            <ArrowRight size={14} />
          </a>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Section 1: Global Interactive Heatmap & Spatial Explorer */}
      {/* ------------------------------------------------------------------ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--dash-muted)]">
              SECTION 01 · SPATIAL HEATMAP EXPLORER
            </span>
          </div>
          <span className="text-xs font-mono text-[var(--dash-muted)] hidden sm:inline">
            Click any pin to inspect live telemetry
          </span>
        </div>

        <OverviewSpatialMap
          selectedCity={selectedCity}
          onSelectCity={(city) => setSelectedCity(city)}
        />
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 2: Health & Cigarette Equivalent Impact Widget */}
      {/* ------------------------------------------------------------------ */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--dash-muted)]">
            SECTION 02 · BIOLOGICAL EXPOSURE IMPACT
          </span>
        </div>

        <HealthCigaretteWidget
          cityName={selectedCity.name}
          pm25={selectedCity.pollutants.pm2_5}
          aqi={selectedCity.aqi}
        />
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 3: Disease & Health Condition Clinical Advice Selector */}
      {/* ------------------------------------------------------------------ */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--dash-muted)]">
            SECTION 03 · TARGETED CLINICAL ACTION PROTOCOLS
          </span>
        </div>

        <HealthAdviceSelector aqi={selectedCity.aqi} />
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Bottom Cross-Navigation Links */}
      {/* ------------------------------------------------------------------ */}
      <footer className="pt-8 border-t border-[var(--dash-rule)] grid grid-cols-1 sm:grid-cols-3 gap-4">
        <a
          href="/dashboard"
          className="p-5 rounded-2xl border border-[var(--dash-rule)] bg-[var(--dash-surface)] hover:bg-[var(--dash-surface-soft)] text-inherit no-underline transition-all flex flex-col justify-between"
        >
          <span className="text-xs font-mono text-[var(--dash-muted)] font-bold">01 GLOBAL VIEW</span>
          <div className="mt-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-[var(--dash-ink)]">3D Planetary Atmosphere</h3>
            <ArrowRight size={16} className="text-[var(--dash-accent)]" />
          </div>
        </a>

        <a
          href="/compare"
          className="p-5 rounded-2xl border border-[var(--dash-rule)] bg-[var(--dash-surface)] hover:bg-[var(--dash-surface-soft)] text-inherit no-underline transition-all flex flex-col justify-between"
        >
          <span className="text-xs font-mono text-[var(--dash-muted)] font-bold">02 LOCATION COMPARE</span>
          <div className="mt-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-[var(--dash-ink)]">Multi-City Benchmark</h3>
            <ArrowRight size={16} className="text-[var(--dash-accent)]" />
          </div>
        </a>

        <a
          href="/risk"
          className="p-5 rounded-2xl border border-[var(--dash-rule)] bg-[var(--dash-surface)] hover:bg-[var(--dash-surface-soft)] text-inherit no-underline transition-all flex flex-col justify-between"
        >
          <span className="text-xs font-mono text-[var(--dash-muted)] font-bold">03 PERSONAL RISK</span>
          <div className="mt-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-[var(--dash-ink)]">Area Air Score &amp; Havens</h3>
            <ArrowRight size={16} className="text-[var(--dash-accent)]" />
          </div>
        </a>
      </footer>
    </main>
  );
}
