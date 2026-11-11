"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { ArrowRight, RadioTower, Share2 } from "lucide-react";
import { HealthCigaretteWidget } from "@/components/HealthCigaretteWidget";
import { HealthAdviceSelector } from "@/components/HealthAdviceSelector";
import { HourlyWeatherCard } from "@/components/HourlyWeatherCard";
import { AreaAirScore } from "@/components/AreaAirScore";
import { INITIAL_HOTSPOTS, type SpatialHotspot } from "@/components/OverviewSpatialMap";
import { AqiShareCardModal } from "@/components/AqiShareCardModal";
import { useTheme } from "@/lib/use-theme";
import type { AirQualityResponse, Location } from "@/lib/types";

// Dynamic import for Leaflet client-only rendering
const OverviewSpatialMap = dynamic(() => import("@/components/OverviewSpatialMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[640px] sm:h-[720px] rounded-2xl border border-[var(--dash-rule)] bg-[var(--dash-surface)] flex flex-col items-center justify-center gap-3">
      <span className="w-8 h-8 rounded-full border-2 border-[var(--dash-accent)] border-t-transparent animate-spin" />
      <span className="text-xs font-mono text-[var(--dash-muted)]">
        INITIALIZING SPATIAL HEATMAP ENGINE...
      </span>
    </div>
  ),
});

export default function OverviewPage() {
  const { theme } = useTheme();
  const [selectedCity, setSelectedCity] = useState<SpatialHotspot>(INITIAL_HOTSPOTS[0]);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const shareLocation: Location = {
    name: selectedCity.name,
    admin: selectedCity.state,
    country: selectedCity.country,
    latitude: selectedCity.lat,
    longitude: selectedCity.lng,
  };

  const shareAir: AirQualityResponse = {
    provider: "cpcb",
    provenance: "station-observation",
    sourceLabel: "CPCB Ground Telemetry / Global Heatmap Reanalysis",
    sourceUrl: "https://cpcb.nic.in",
    latitude: selectedCity.lat,
    longitude: selectedCity.lng,
    timezone: "Asia/Kolkata",
    current: {
      time: new Date().toISOString(),
      aqi: selectedCity.aqi,
      pm2_5: selectedCity.pollutants.pm2_5,
      pm10: selectedCity.pollutants.pm10,
      no2: selectedCity.pollutants.no2,
      so2: selectedCity.pollutants.so2,
      o3: selectedCity.pollutants.ozone,
      co: selectedCity.pollutants.co,
    },
    attribution: [{ name: "CPCB Ground Telemetry / Global Heatmap Reanalysis" }],
  };

  return (
    <div
      className={`app-shell dashboard-app min-h-screen bg-[var(--dash-canvas)] text-[var(--dash-ink)] transition-colors ${
        theme === "dark" ? "dark" : ""
      }`}
      data-theme={theme}
    >
      <div className="dashboard-frame">
        <main className="dashboard-page space-y-10 py-6">
          {/* ------------------------------------------------------------------ */}
          {/* Editorial Masthead (Font & Style matched to Home, Dashboard & Compare) */}
          {/* ------------------------------------------------------------------ */}
          <header className="dashboard-masthead">
            <div>
              <span className="eyebrow flex items-center gap-2 text-xs font-mono tracking-widest text-[var(--dash-accent)] font-bold">
                <span className="eyebrow-line w-6 h-[1px] bg-[var(--dash-accent)]" />
                ATMOSPHERIC INTELLIGENCE HUB<span className="masthead-index">/ 02</span>
              </span>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-normal tracking-tight text-[var(--dash-ink)] mt-2">
                Air, in <em>totality.</em>
              </h1>
              <p className="text-sm sm:text-base text-[var(--dash-muted)] max-w-2xl mt-1.5 leading-relaxed">
                Continuous global spatial heatmaps, validated ground-truth station observations, and personalized biological exposure metrics in one unified dashboard.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start md:self-end">
              <button
                type="button"
                onClick={() => setShareModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition-all active:scale-95 cursor-pointer"
                title={`Generate Share Card for ${selectedCity.name}`}
              >
                <Share2 size={13} />
                <span>Share {selectedCity.name} Card</span>
              </button>
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-mono font-medium border border-[var(--dash-rule)] bg-[var(--dash-surface)] text-[var(--dash-ink)] shadow-sm">
                <RadioTower size={14} className="text-[var(--dash-accent)]" />
                CPCB · OPENAQ V3 · WAQI · CAMS
              </span>
              <a
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-[var(--dash-accent)] text-white no-underline shadow-sm hover:opacity-90 transition-opacity"
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
                Click any hotspot to inspect live telemetry
              </span>
            </div>

            <OverviewSpatialMap
              selectedCity={selectedCity}
              onSelectCity={(city) => setSelectedCity(city)}
              onShareCity={(city) => {
                setSelectedCity(city);
                setShareModalOpen(true);
              }}
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
              onShare={() => setShareModalOpen(true)}
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
          {/* Hourly Weather Forecast (Next 24 Hours, Local Time - Image 2) */}
          {/* ------------------------------------------------------------------ */}
          <section className="space-y-4">
            <HourlyWeatherCard
              cityName={selectedCity.name}
              lat={selectedCity.lat}
              lng={selectedCity.lng}
            />
          </section>

          {/* ------------------------------------------------------------------ */}
          {/* Section 4: Local Monitoring Network & Safer Havens */}
          {/* ------------------------------------------------------------------ */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--dash-muted)]">
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
        </main>

        <AqiShareCardModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          air={shareAir}
          location={shareLocation}
          dominantPollutant="PM2.5"
        />
      </div>
    </div>
  );
}
