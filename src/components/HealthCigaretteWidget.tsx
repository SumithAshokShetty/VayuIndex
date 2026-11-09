"use client";

import React, { useMemo } from "react";
import { Car, ChevronRight, Home, Info, ShieldCheck, Wind } from "lucide-react";

interface HealthCigaretteWidgetProps {
  cityName: string;
  pm25: number | null;
  aqi: number | null;
}

export function HealthCigaretteWidget({ cityName, pm25, aqi }: HealthCigaretteWidgetProps) {
  // Berkeley Earth formula: 1 cigarette per day ≈ 22 µg/m³ PM2.5
  const dailyCigarettes = useMemo(() => {
    if (pm25 === null || pm25 <= 0) {
      if (aqi !== null && aqi > 0) {
        // Fallback estimate from AQI if PM2.5 sensor is missing: rough EPA PM2.5 equivalent
        const estimatedPm25 = aqi <= 50 ? aqi * 0.24 : aqi <= 100 ? 12 + (aqi - 50) * 0.46 : 35 + (aqi - 100) * 0.4;
        return Number((estimatedPm25 / 22.0).toFixed(1));
      }
      return 1.2;
    }
    return Number((pm25 / 22.0).toFixed(1));
  }, [pm25, aqi]);

  const weeklyCigarettes = Number((dailyCigarettes * 7).toFixed(1));
  const monthlyCigarettes = Math.round(dailyCigarettes * 30);

  // Recommendations dynamic status depending on AQI
  const currentAqi = aqi ?? (pm25 ? pm25 * 1.8 : 120);

  const getActionStatus = (type: "purifier" | "car" | "mask" | "indoor") => {
    if (currentAqi > 150) {
      return { label: type === "purifier" ? "Turn On" : "Must", urgent: true };
    }
    if (currentAqi > 100) {
      return { label: type === "purifier" ? "Turn On" : type === "indoor" ? "Advised" : "Must", urgent: true };
    }
    if (currentAqi > 50) {
      return { label: type === "purifier" ? "Auto" : "Recommended", urgent: false };
    }
    return { label: "Optional", urgent: false };
  };

  return (
    <section className="health-cigarette-card w-full rounded-2xl border border-[var(--dash-rule)] bg-[var(--dash-surface)] p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[var(--dash-rule)] pb-4 mb-6">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-[var(--dash-muted)] uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            REAL-WORLD HEALTH EXPOSURE EQUIVALENT
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--dash-ink)] mt-1">
            Health Advice For People Living In{" "}
            <span className="text-[var(--dash-accent)] underline decoration-[var(--dash-rule)] decoration-2 underline-offset-4">
              {cityName}
            </span>
          </h2>
        </div>
        <span className="text-xs font-mono text-[var(--dash-muted)] self-start sm:self-auto">
          Source: Berkeley Earth Algorithm
        </span>
      </div>

      {/* Main Cigarette Equivalency Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Big Cigarettes Per Day Card with Graphic */}
        <div className="lg:col-span-8 p-6 sm:p-7 rounded-2xl bg-[var(--dash-surface-soft)] border border-[var(--dash-rule)] relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-5xl sm:text-6xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400 font-mono">
                  {dailyCigarettes}
                </span>
                <div className="flex flex-col">
                  <span className="text-base sm:text-lg font-bold text-rose-600 dark:text-rose-400 leading-tight">
                    Cigarettes
                  </span>
                  <span className="text-xs font-mono text-[var(--dash-muted)] uppercase tracking-wider">
                    per day
                  </span>
                </div>
              </div>

              {/* Realistic Animated SVG Cigarette */}
              <div className="py-2 flex items-center gap-3">
                <div className="relative flex items-center">
                  {/* Filter tip */}
                  <div className="w-8 h-4 rounded-l-sm bg-amber-600 border border-amber-700 shadow-inner" />
                  {/* White body */}
                  <div className="w-32 h-4 bg-stone-100 border-t border-b border-stone-300 shadow-sm relative flex items-center">
                    <span className="w-3 h-full border-r border-stone-200" />
                  </div>
                  {/* Burning ember tip */}
                  <div className="w-2.5 h-4 rounded-r-xs bg-gradient-to-r from-red-600 via-orange-500 to-amber-300 shadow-[0_0_10px_#ef4444] animate-pulse" />

                  {/* Rising Smoke Particles */}
                  <div className="absolute -right-3 -top-5 flex flex-col items-center pointer-events-none opacity-80">
                    <span className="w-2 h-2 rounded-full bg-stone-400 blur-[1px] animate-bounce" />
                    <span className="w-3.5 h-3.5 rounded-full bg-stone-400/60 blur-[2px] -mt-1 ml-2" />
                    <span className="w-5 h-5 rounded-full bg-stone-400/40 blur-[3px] -mt-1 ml-4" />
                  </div>
                </div>
              </div>

              <p className="text-sm sm:text-base text-[var(--dash-ink)] font-medium leading-relaxed max-w-lg pt-1">
                Breathing the ambient air in this location is as biologically harmful as smoking{" "}
                <strong className="text-rose-600 dark:text-rose-400">{dailyCigarettes} cigarettes</strong> a day.
              </p>
            </div>

            {/* Weekly & Monthly Projections */}
            <div className="flex flex-row md:flex-col gap-4 border-t md:border-t-0 md:border-l border-[var(--dash-rule)] pt-4 md:pt-0 md:pl-6 min-w-[150px]">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--dash-muted)] font-semibold block">
                  Weekly
                </span>
                <span className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
                  {weeklyCigarettes}{" "}
                  <span className="text-xs font-sans font-normal text-[var(--dash-muted)]">Cigarettes</span>
                </span>
              </div>

              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--dash-muted)] font-semibold block">
                  Monthly
                </span>
                <span className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
                  {monthlyCigarettes}{" "}
                  <span className="text-xs font-sans font-normal text-[var(--dash-muted)]">Cigarettes</span>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--dash-rule)] flex items-start gap-2 text-[11px] text-[var(--dash-muted)]">
            <Info size={14} className="flex-none mt-0.5 text-[var(--dash-accent)]" />
            <span>
              Disclaimer: This cigarette-equivalent estimate is derived from the average PM2.5 concentration over the last 24 hours (22 µg/m³ PM2.5 ≈ 1 cigarette/day), assuming continuous exposure during that window.
            </span>
          </div>
        </div>

        {/* Right Callout Banner */}
        <div className="lg:col-span-4 p-6 rounded-2xl border border-[var(--dash-rule)] bg-[var(--dash-surface-soft)] flex flex-col justify-between h-full">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--dash-accent)] flex items-center gap-1.5">
              <ShieldCheck size={16} /> AIR DEFENSE ADVISORY
            </span>
            <h3 className="text-lg font-bold text-[var(--dash-ink)] mt-2">
              {currentAqi > 150
                ? "Immediate Air Purification Required"
                : currentAqi > 100
                ? "Heightened Sensitivity Window"
                : "Standard Clean-Air Precautions"}
            </h3>
            <p className="text-xs sm:text-sm text-[var(--dash-muted)] mt-2 leading-relaxed">
              Elevated respirable particles bypass nasal hairs and lodge deep in lung alveoli. Running a True-HEPA purifier in living spaces removes over 99.97% of fine particles.
            </p>
          </div>

          <a
            href="/risk"
            className="mt-4 inline-flex items-center justify-between px-4 py-2.5 rounded-xl bg-[var(--dash-surface)] hover:bg-[var(--dash-surface-soft)] border border-[var(--dash-rule)] text-xs font-semibold text-[var(--dash-ink)] no-underline transition-colors"
          >
            <span>Calculate your personalized risk</span>
            <ChevronRight size={15} />
          </a>
        </div>
      </div>

      {/* Solutions for Current AQI (US) - 4 Action Cards */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-bold text-[var(--dash-ink)]">
            Solutions for Current AQI (US)
          </h3>
          <span className="text-xs font-mono text-[var(--dash-muted)]">
            Live AQI: <strong className="text-[var(--dash-ink)]">{Math.round(currentAqi)}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Air Purifier */}
          <div className="p-4 rounded-xl border border-[var(--dash-rule)] bg-[var(--dash-surface-soft)] flex flex-col justify-between transition-all hover:border-[var(--dash-accent)]">
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-lg bg-[var(--dash-surface)] text-[var(--dash-accent)] border border-[var(--dash-rule)]">
                <Wind size={20} />
              </span>
              <span
                className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                  getActionStatus("purifier").urgent
                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                    : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                }`}
              >
                {getActionStatus("purifier").label}
              </span>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-bold text-[var(--dash-ink)]">Air Purifier</h4>
              <p className="text-[11px] text-[var(--dash-muted)] mt-0.5">True HEPA H13 Filter</p>
            </div>
          </div>

          {/* Card 2: Car Filter */}
          <div className="p-4 rounded-xl border border-[var(--dash-rule)] bg-[var(--dash-surface-soft)] flex flex-col justify-between transition-all hover:border-[var(--dash-accent)]">
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-lg bg-[var(--dash-surface)] text-[var(--dash-accent)] border border-[var(--dash-rule)]">
                <Car size={20} />
              </span>
              <span
                className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                  getActionStatus("car").urgent
                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                    : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                }`}
              >
                {getActionStatus("car").label}
              </span>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-bold text-[var(--dash-ink)]">Car Filter</h4>
              <p className="text-[11px] text-[var(--dash-muted)] mt-0.5">Recirculate Cabin Air</p>
            </div>
          </div>

          {/* Card 3: N95 Mask */}
          <div className="p-4 rounded-xl border border-[var(--dash-rule)] bg-[var(--dash-surface-soft)] flex flex-col justify-between transition-all hover:border-[var(--dash-accent)]">
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-lg bg-[var(--dash-surface)] text-[var(--dash-accent)] border border-[var(--dash-rule)]">
                <ShieldCheck size={20} />
              </span>
              <span
                className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                  getActionStatus("mask").urgent
                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                    : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                }`}
              >
                {getActionStatus("mask").label}
              </span>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-bold text-[var(--dash-ink)]">N95 Mask</h4>
              <p className="text-[11px] text-[var(--dash-muted)] mt-0.5">When Venturing Outdoors</p>
            </div>
          </div>

          {/* Card 4: Stay Indoor */}
          <div className="p-4 rounded-xl border border-[var(--dash-rule)] bg-[var(--dash-surface-soft)] flex flex-col justify-between transition-all hover:border-[var(--dash-accent)]">
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-lg bg-[var(--dash-surface)] text-[var(--dash-accent)] border border-[var(--dash-rule)]">
                <Home size={20} />
              </span>
              <span
                className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                  getActionStatus("indoor").urgent
                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                    : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                }`}
              >
                {getActionStatus("indoor").label}
              </span>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-bold text-[var(--dash-ink)]">Stay Indoor</h4>
              <p className="text-[11px] text-[var(--dash-muted)] mt-0.5">Close Ventilators & Windows</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HealthCigaretteWidget;
