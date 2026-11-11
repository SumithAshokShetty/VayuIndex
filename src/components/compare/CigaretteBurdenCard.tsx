"use client";

import React from "react";
import { Cigarette, ShieldAlert, HeartPulse, Baby, Stethoscope } from "lucide-react";
import type { Location } from "@/lib/types";
import { locationKey } from "../LocationComparison";

interface CigaretteBurdenCardProps {
  locations: Location[];
  liveData: Record<string, { air: any; loading: boolean }>;
  historyData: Record<string, { payload: any; loading: boolean }>;
}

export function CigaretteBurdenCard({
  locations,
  liveData,
  historyData,
}: CigaretteBurdenCardProps) {
  // Berkeley Earth conversion: 1 cigarette ≈ 22 µg/m³ PM2.5 over 24 hours
  const BERKELEY_EARTH_FACTOR = 22.0;

  const cityBurden = locations.map((loc) => {
    const key = locationKey(loc);
    const live = liveData[key]?.air;
    const hist = historyData[key]?.payload?.hourly;

    let pm25 = 0;
    if (live?.current && typeof live.current.pm2_5 === "number") {
      pm25 = Number(live.current.pm2_5);
    } else if (hist?.pm2_5?.length) {
      const last = hist.pm2_5[hist.pm2_5.length - 1];
      if (typeof last === "number" && !isNaN(last)) pm25 = Number(last);
    }

    const cigarettesPerDay = pm25 > 0 ? Number((pm25 / BERKELEY_EARTH_FACTOR).toFixed(1)) : 0;
    const cigarettesPerWeek = Number((cigarettesPerDay * 7).toFixed(1));

    // Severity tier
    let tier = "Minimal Hazard";
    let tierColor = "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    let barColor = "bg-emerald-500";
    let alertMessage = "Inhalation levels are within acceptable baseline limits.";

    if (cigarettesPerDay >= 12) {
      tier = "Extreme Inhalation Toxicity";
      tierColor = "text-rose-700 dark:text-rose-400 bg-rose-500/15 border-rose-500/30";
      barColor = "bg-rose-600";
      alertMessage = "Equivalent to smoking over half a pack daily. Severe cardiopulmonary stress across all populations.";
    } else if (cigarettesPerDay >= 6) {
      tier = "High Health Hazard";
      tierColor = "text-amber-700 dark:text-amber-400 bg-amber-500/15 border-amber-500/30";
      barColor = "bg-amber-500";
      alertMessage = "Substantial particle accumulation in lung alveoli. Dangerous for chronic respiratory patients.";
    } else if (cigarettesPerDay >= 2) {
      tier = "Elevated Exposure";
      tierColor = "text-yellow-700 dark:text-yellow-400 bg-yellow-500/15 border-yellow-500/30";
      barColor = "bg-yellow-500";
      alertMessage = "Prolonged exposure triggers throat irritation and mild bronchospasm in vulnerable individuals.";
    } else if (cigarettesPerDay > 0.5) {
      tier = "Moderate Exposure";
      tierColor = "text-teal-700 dark:text-teal-400 bg-teal-500/15 border-teal-500/30";
      barColor = "bg-teal-500";
      alertMessage = "Low particulate burden. Minimal acute symptoms expected for healthy adults.";
    }

    const percentOfMax = Math.min(100, Math.round((cigarettesPerDay / 15) * 100));

    return {
      loc,
      pm25,
      cigarettesPerDay,
      cigarettesPerWeek,
      tier,
      tierColor,
      barColor,
      alertMessage,
      percentOfMax,
    };
  });

  return (
    <div className="mt-8 rounded-2xl border border-[var(--dash-rule)] bg-[var(--dash-surface)] p-5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--dash-rule)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--dash-accent)]/15 text-[var(--dash-accent)]">
            <Cigarette size={18} />
          </div>
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--dash-muted)] font-bold">
              BERKELEY EARTH CONVERSION MODEL
            </span>
            <h3 className="text-base sm:text-lg font-bold text-[var(--dash-ink)]">
              Inhalation Health Burden & Cigarette Equivalency
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[var(--dash-muted)]">
          <span className="px-2.5 py-1 rounded-md bg-[var(--dash-surface-soft)] border border-[var(--dash-rule)]">
            Formula: 1 Cigarette ≈ 22 µg/m³ PM₂.₅ (24h)
          </span>
        </div>
      </div>

      {/* Side-by-Side City Cigarette Burdens */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cityBurden.map((item) => (
          <div
            key={item.loc.name}
            className="p-4 rounded-xl border border-[var(--dash-rule)] bg-[var(--dash-surface)] flex flex-col justify-between"
          >
            <div>
              {/* Location & Tier Badge */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-bold text-base text-[var(--dash-ink)] truncate">
                  {item.loc.name}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold border truncate ${item.tierColor}`}
                >
                  {item.tier}
                </span>
              </div>

              {/* Inhalation Metric Gauge */}
              <div className="mt-3 p-3 rounded-lg bg-[var(--dash-surface-soft)]">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-xs font-mono text-[var(--dash-muted)] uppercase">
                    Equiv. Daily Inhaled:
                  </span>
                  <span className="font-mono text-2xl font-black text-[var(--dash-ink)]">
                    {item.cigarettesPerDay}{" "}
                    <span className="text-xs font-normal text-[var(--dash-muted)] font-sans">cigs/day</span>
                  </span>
                </div>

                {/* Visual Meter Bar */}
                <div className="w-full h-2 rounded-full bg-[var(--dash-rule)] overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${item.barColor}`}
                    style={{ width: `${Math.max(item.percentOfMax, 4)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] font-mono text-[var(--dash-muted)] mt-1.5">
                  <span>0 cigs</span>
                  <span>7.5 cigs</span>
                  <span>15+ cigs</span>
                </div>
              </div>

              {/* Weekly cumulative */}
              <div className="mt-3 flex items-center justify-between text-xs font-mono text-[var(--dash-muted)] px-1">
                <span>Weekly Cumulative:</span>
                <strong className="text-[var(--dash-ink)]">{item.cigarettesPerWeek} cigarettes</strong>
              </div>

              {/* PM2.5 Base */}
              <div className="mt-1 flex items-center justify-between text-xs font-mono text-[var(--dash-muted)] px-1">
                <span>24h Avg PM₂.₅:</span>
                <strong className="text-[var(--dash-ink)]">{item.pm25.toFixed(1)} µg/m³</strong>
              </div>
            </div>

            {/* Vulnerable Population Health Alert Callout */}
            <div className="mt-4 pt-3 border-t border-[var(--dash-rule)]">
              <div className="flex items-start gap-2 text-xs">
                <ShieldAlert size={14} className="text-amber-500 flex-none mt-0.5" />
                <p className="text-[11px] text-[var(--dash-muted)] leading-relaxed">
                  {item.alertMessage}
                </p>
              </div>

              {/* Vulnerable Groups Affected Icons */}
              <div className="mt-2.5 flex items-center gap-2 text-[10px] font-mono text-[var(--dash-muted)]">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--dash-surface-soft)]">
                  <Baby size={11} className="text-[var(--dash-accent)]" /> Children
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--dash-surface-soft)]">
                  <HeartPulse size={11} className="text-rose-500" /> Cardiac
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--dash-surface-soft)]">
                  <Stethoscope size={11} className="text-sky-500" /> Asthmatic
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
