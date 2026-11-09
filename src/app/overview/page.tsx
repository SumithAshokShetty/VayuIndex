"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { ArrowRight, RadioTower } from "lucide-react";
import { HealthCigaretteWidget } from "@/components/HealthCigaretteWidget";
import { HealthAdviceSelector } from "@/components/HealthAdviceSelector";
import { AreaAirScore } from "@/components/AreaAirScore";
import { INITIAL_HOTSPOTS, type SpatialHotspot } from "@/components/OverviewSpatialMap";

// Dynamic import for Leaflet client-only rendering
const OverviewSpatialMap = dynamic(() => import("@/components/OverviewSpatialMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[640px] sm:h-[720px] rounded-3xl border border-neutral-800 bg-neutral-950 flex flex-col items-center justify-center gap-3">
      <span className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      <span className="text-xs font-mono text-neutral-400">
        INITIALIZING SPATIAL HEATMAP ENGINE...
      </span>
    </div>
  ),
});

export default function OverviewPage() {
  const [selectedCity, setSelectedCity] = useState<SpatialHotspot>(INITIAL_HOTSPOTS[0]);

  return (
    <main className="overview-page-wrapper min-h-screen bg-[#0B1311] text-neutral-100 w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-12">
      {/* ------------------------------------------------------------------ */}
      {/* Editorial Header */}
      {/* ------------------------------------------------------------------ */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <span className="flex items-center gap-2 text-xs sm:text-sm font-mono tracking-widest text-emerald-400 font-bold">
            <span className="w-6 h-[1px] bg-emerald-500" />
            ATMOSPHERIC INTELLIGENCE HUB · EXECUTIVE OVERVIEW
          </span>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-normal tracking-tight text-white mt-2">
            Air, in <em className="italic text-emerald-300">totality.</em>
          </h1>
          <p className="text-sm sm:text-base text-neutral-400 max-w-2xl mt-1.5 leading-relaxed">
            Continuous global spatial heatmaps, validated ground-truth station observations, and personalized biological exposure metrics in one unified dashboard.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-end">
          <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-mono font-medium border border-neutral-800 bg-neutral-900/90 text-neutral-200 shadow-sm">
            <RadioTower size={14} className="text-emerald-400" />
            OPENAQ V3 &amp; CAMS REANALYSIS
          </span>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white no-underline shadow-sm transition-opacity"
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
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">
              SECTION 01 · SPATIAL HEATMAP EXPLORER
            </span>
          </div>
          <span className="text-xs font-mono text-neutral-400 hidden sm:inline">
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
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">
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
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">
            SECTION 03 · TARGETED CLINICAL ACTION PROTOCOLS
          </span>
        </div>

        <HealthAdviceSelector aqi={selectedCity.aqi} />
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 4: Local Monitoring Network & Safer Havens */}
      {/* ------------------------------------------------------------------ */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">
            SECTION 04 · LOCAL MONITORING NETWORK &amp; SAFER HAVENS
          </span>
        </div>

        <AreaAirScore
          currentLocation={{
            name: selectedCity.name,
            admin: selectedCity.state,
            country: selectedCity.country,
            latitude: selectedCity.lat,
            longitude: selectedCity.lng,
          }}
          onSwitchLocation={(newLoc) => {
            const found = INITIAL_HOTSPOTS.find(
              (h) => h.name.toLowerCase() === newLoc.name.toLowerCase()
            );
            if (found) {
              setSelectedCity(found);
            }
          }}
        />
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Bottom Cross-Navigation Links */}
      {/* ------------------------------------------------------------------ */}
      <footer className="pt-8 border-t border-neutral-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <a
          href="/dashboard"
          className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800/80 text-white no-underline transition-all flex flex-col justify-between"
        >
          <span className="text-xs font-mono text-neutral-400 font-bold">01 GLOBAL VIEW</span>
          <div className="mt-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-white">3D Planetary Atmosphere</h3>
            <ArrowRight size={16} className="text-emerald-400" />
          </div>
        </a>

        <a
          href="/compare"
          className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800/80 text-white no-underline transition-all flex flex-col justify-between"
        >
          <span className="text-xs font-mono text-neutral-400 font-bold">02 LOCATION COMPARE</span>
          <div className="mt-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Multi-City Benchmark</h3>
            <ArrowRight size={16} className="text-emerald-400" />
          </div>
        </a>

        <a
          href="/risk"
          className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800/80 text-white no-underline transition-all flex flex-col justify-between"
        >
          <span className="text-xs font-mono text-neutral-400 font-bold">03 PERSONAL RISK</span>
          <div className="mt-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Area Air Score &amp; Havens</h3>
            <ArrowRight size={16} className="text-emerald-400" />
          </div>
        </a>
      </footer>
    </main>
  );
}
