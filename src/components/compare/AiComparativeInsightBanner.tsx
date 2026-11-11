"use client";

import React, { useMemo } from "react";
import { Sparkles, TrendingUp, AlertTriangle, Wind, Flame, Factory, Compass } from "lucide-react";
import type { Location } from "@/lib/types";
import { locationKey } from "../LocationComparison";

interface InsightBannerProps {
  locations: Location[];
  liveData: Record<string, { air: any; loading: boolean }>;
  historyData: Record<string, { payload: any; loading: boolean }>;
  onGenerateDossier?: (loc: Location) => void;
}

export function AiComparativeInsightBanner({
  locations,
  liveData,
  historyData,
  onGenerateDossier,
}: InsightBannerProps) {
  const analysis = useMemo(() => {
    if (locations.length < 2) return null;

    // Extract latest PM2.5, PM10, NO2, SO2, O3 for each location
    const cityData = locations.map((loc) => {
      const key = locationKey(loc);
      const live = liveData[key]?.air;
      const hist = historyData[key]?.payload?.hourly;

      const getVal = (param: string): number => {
        if (live?.current && typeof live.current[param] === "number") {
          return Number(live.current[param]);
        }
        if (hist?.[param]?.length) {
          const last = hist[param][hist[param].length - 1];
          if (typeof last === "number" && !isNaN(last)) return Number(last);
        }
        return 0;
      };

      const pm25 = getVal("pm2_5");
      const pm10 = getVal("pm10");
      const no2 = getVal("nitrogen_dioxide");
      const so2 = getVal("sulphur_dioxide");
      const o3 = getVal("ozone");

      // Determine Signature
      let signature = "Mixed Urban Ambient Aerosol";
      let signatureIcon = Compass;
      let signatureColor = "text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/30";
      let signatureDesc = "Balanced combination of ground-level residential emissions and regional background aerosols.";

      if (pm10 > 0 && pm25 / pm10 <= 0.45 && pm10 >= 70) {
        signature = "Coarse Crustal Dust & Mechanical Resuspension";
        signatureIcon = Wind;
        signatureColor = "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30";
        signatureDesc = "Dominated by windblown soil, unpaved surfaces, road silt, and heavy construction activities.";
      } else if (so2 >= 25 || (no2 > 0 && so2 / no2 > 0.7)) {
        signature = "Industrial Sulfur & Coal Power Plumes";
        signatureIcon = Factory;
        signatureColor = "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30";
        signatureDesc = "High point-source emissions typical of coal-fired thermal generation, smelting, or refining units.";
      } else if (pm10 > 0 && pm25 / pm10 >= 0.60 && no2 >= 35) {
        signature = "Combustion Exhaust & Stagnant Inversion";
        signatureIcon = Flame;
        signatureColor = "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/30";
        signatureDesc = "Intense concentration of fine primary vehicular exhaust trapped beneath a shallow thermal inversion lid.";
      } else if (o3 >= 70) {
        signature = "Photochemical Smog & Secondary Ozone";
        signatureIcon = Sparkles;
        signatureColor = "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/30";
        signatureDesc = "Strong sunlight catalysts triggering chemical reactions between precursor NOx and volatile organic compounds.";
      }

      return {
        loc,
        pm25,
        pm10,
        no2,
        so2,
        o3,
        signature,
        signatureIcon,
        signatureColor,
        signatureDesc,
      };
    });

    // Sort by PM2.5 descending
    const sortedByPm25 = [...cityData].sort((a, b) => b.pm25 - a.pm25);
    const highest = sortedByPm25[0];
    const lowest = sortedByPm25[sortedByPm25.length - 1];

    // Variance calculations
    const pm25Variance = lowest.pm25 > 0
      ? Math.round(((highest.pm25 - lowest.pm25) / lowest.pm25) * 100)
      : null;

    const pm10Variance = lowest.pm10 > 0
      ? Math.round(((highest.pm10 - lowest.pm10) / lowest.pm10) * 100)
      : null;

    return {
      cityData,
      highest,
      lowest,
      pm25Variance,
      pm10Variance,
    };
  }, [locations, liveData, historyData]);

  if (!analysis) return null;

  const { cityData, highest, lowest, pm25Variance, pm10Variance } = analysis;

  return (
    <div className="mt-8 rounded-2xl border border-[var(--dash-rule)] bg-[var(--dash-surface)] p-5 sm:p-6 shadow-sm">
      {/* Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--dash-rule)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--dash-accent)]/15 text-[var(--dash-accent)]">
            <Sparkles size={16} />
          </div>
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--dash-muted)] font-bold">
              AI COMPARATIVE REASONING ENGINE
            </span>
            <h3 className="text-base sm:text-lg font-bold text-[var(--dash-ink)]">
              Atmospheric Variance & Source Signature Synthesis
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {pm25Variance !== null && pm25Variance > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              <TrendingUp size={13} />
              PM₂.₅ VARIANCE: +{pm25Variance}%
            </span>
          )}
          {pm10Variance !== null && pm10Variance > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs font-bold bg-[var(--dash-surface-soft)] text-[var(--dash-ink)] border border-[var(--dash-rule)]">
              PM₁₀ DELTA: +{pm10Variance}%
            </span>
          )}
        </div>
      </div>

      {/* Main Comparative Narrative */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Delta Insight Summary */}
        <div className="lg:col-span-5 flex flex-col justify-between p-4 rounded-xl bg-[var(--dash-surface-soft)] border border-[var(--dash-rule)]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[var(--dash-muted)] uppercase mb-2">
              <AlertTriangle size={14} className="text-amber-500" />
              AIRSHED GRADIENT COMPARISON
            </div>
            <p className="text-sm text-[var(--dash-ink)] leading-relaxed font-normal">
              {highest.loc.name} presents an ambient fine particulate load of{" "}
              <strong className="font-semibold text-rose-600 dark:text-rose-400 font-mono">
                {highest.pm25.toFixed(1)} µg/m³
              </strong>
              , which is{" "}
              {pm25Variance !== null ? (
                <strong className="font-semibold text-[var(--dash-ink)]">
                  {pm25Variance}% elevated
                </strong>
              ) : (
                "significantly higher"
              )}{" "}
              relative to {lowest.loc.name} ({lowest.pm25.toFixed(1)} µg/m³).
            </p>
            <p className="text-xs text-[var(--dash-muted)] mt-2 leading-relaxed">
              Coarse dust fraction indicates {highest.loc.name} has a PM2.5/PM10 ratio of{" "}
              <span className="font-mono font-semibold text-[var(--dash-ink)]">
                {highest.pm10 > 0 ? (highest.pm25 / highest.pm10).toFixed(2) : "—"}
              </span>
              , compared to{" "}
              <span className="font-mono font-semibold text-[var(--dash-ink)]">
                {lowest.pm10 > 0 ? (lowest.pm25 / lowest.pm10).toFixed(2) : "—"}
              </span>{" "}
              in {lowest.loc.name}.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--dash-rule)] flex items-center justify-between text-xs font-mono text-[var(--dash-muted)]">
            <span>Critical Airshed Divergence:</span>
            <span className="font-bold text-[var(--dash-ink)]">
              {(highest.pm25 - lowest.pm25).toFixed(1)} µg/m³ Δ
            </span>
          </div>
        </div>

        {/* Right City Signature Cards */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cityData.map((item) => {
            const Icon = item.signatureIcon;
            return (
              <div
                key={item.loc.name}
                className="p-3.5 rounded-xl border border-[var(--dash-rule)] bg-[var(--dash-surface)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-[var(--dash-ink)]">{item.loc.name}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${item.signatureColor}`}>
                      <Icon size={11} /> {item.signature}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--dash-muted)] leading-relaxed mt-1">
                    {item.signatureDesc}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-[var(--dash-rule)] flex items-center justify-between font-mono text-[11px] text-[var(--dash-muted)]">
                  <span>PM₂.₅: <strong className="text-[var(--dash-ink)]">{item.pm25.toFixed(1)}</strong></span>
                  <span>NO₂: <strong className="text-[var(--dash-ink)]">{item.no2.toFixed(1)}</strong></span>
                  <span>SO₂: <strong className="text-[var(--dash-ink)]">{item.so2.toFixed(1)}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
