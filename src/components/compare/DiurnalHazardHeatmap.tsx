"use client";

import React, { useMemo, useState } from "react";
import { Clock, SunMedium, Moon, Sparkles, AlertOctagon } from "lucide-react";
import type { Location } from "@/lib/types";
import { locationKey } from "../LocationComparison";

interface DiurnalHazardHeatmapProps {
  locations: Location[];
  historyData: Record<string, { payload: any; loading: boolean }>;
}

export function DiurnalHazardHeatmap({
  locations,
  historyData,
}: DiurnalHazardHeatmapProps) {
  const [activeMetric, setActiveMetric] = useState<"us_aqi" | "pm2_5">("us_aqi");

  const diurnalAnalysis = useMemo(() => {
    return locations.map((loc) => {
      const key = locationKey(loc);
      const hist = historyData[key]?.payload?.hourly;

      const hourlySeries: {
        hourIndex: number;
        hourLabel: string;
        timeIso: string;
        pm2_5: number;
        aqi: number;
      }[] = [];

      if (hist?.time?.length) {
        // Take the latest 24 hours
        const total = hist.time.length;
        const start = Math.max(0, total - 24);

        for (let i = start; i < total; i++) {
          const tIso = hist.time[i];
          const date = new Date(tIso);
          const h = date.getHours();
          const hourLabel = `${h.toString().padStart(2, "0")}:00`;

          const pmVal = typeof hist.pm2_5?.[i] === "number" ? Number(hist.pm2_5[i]) : 35;
          const aqiVal = typeof hist.us_aqi?.[i] === "number" ? Number(hist.us_aqi[i]) : Math.round(pmVal * 2.5);

          hourlySeries.push({
            hourIndex: h,
            hourLabel,
            timeIso: tIso,
            pm2_5: pmVal,
            aqi: aqiVal,
          });
        }
      } else {
        // Fallback placeholder 24 hours if history is loading
        for (let h = 0; h < 24; h++) {
          const hourLabel = `${h.toString().padStart(2, "0")}:00`;
          // Diurnal wave simulation: higher at night (00-06, 21-23), lower in afternoon (12-16)
          const factor = 1 + 0.45 * Math.cos(((h - 2) / 24) * 2 * Math.PI);
          const pm = Math.round(55 * factor);
          hourlySeries.push({
            hourIndex: h,
            hourLabel,
            timeIso: `2026-11-11T${hourLabel}:00Z`,
            pm2_5: pm,
            aqi: Math.round(pm * 2.2),
          });
        }
      }

      // Identify Cleanest vs Peak Hazard Windows
      let minVal = Infinity;
      let minIdx = 0;
      let maxVal = -Infinity;
      let maxIdx = 0;

      hourlySeries.forEach((item, idx) => {
        const val = activeMetric === "pm2_5" ? item.pm2_5 : item.aqi;
        if (val < minVal) {
          minVal = val;
          minIdx = idx;
        }
        if (val > maxVal) {
          maxVal = val;
          maxIdx = idx;
        }
      });

      const cleanestHour = hourlySeries[minIdx]?.hourLabel ?? "14:00";
      const peakHazardHour = hourlySeries[maxIdx]?.hourLabel ?? "04:00";

      return {
        loc,
        hourlySeries,
        cleanestHour,
        cleanestVal: minVal,
        peakHazardHour,
        peakHazardVal: maxVal,
      };
    });
  }, [locations, historyData, activeMetric]);

  // Color helper based on metric values
  const getCellColor = (val: number, metric: "pm2_5" | "us_aqi") => {
    if (metric === "pm2_5") {
      if (val <= 12) return "bg-emerald-500 text-white";
      if (val <= 35.4) return "bg-lime-500 text-black";
      if (val <= 55.4) return "bg-amber-400 text-black";
      if (val <= 150.4) return "bg-orange-500 text-white";
      if (val <= 250.4) return "bg-rose-600 text-white";
      return "bg-purple-900 text-white";
    } else {
      if (val <= 50) return "bg-emerald-500 text-white";
      if (val <= 100) return "bg-lime-500 text-black";
      if (val <= 150) return "bg-amber-400 text-black";
      if (val <= 200) return "bg-orange-500 text-white";
      if (val <= 300) return "bg-rose-600 text-white";
      return "bg-purple-900 text-white";
    }
  };

  return (
    <div className="mt-8 rounded-2xl border border-[var(--dash-rule)] bg-[var(--dash-surface)] p-5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--dash-rule)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--dash-accent)]/15 text-[var(--dash-accent)]">
            <Clock size={18} />
          </div>
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--dash-muted)] font-bold">
              DIURNAL EXPOSURE PATTERNS
            </span>
            <h3 className="text-base sm:text-lg font-bold text-[var(--dash-ink)]">
              24-Hour Diurnal Hourly Hazard Heatmap
            </h3>
          </div>
        </div>

        {/* Metric Selector Toggle: First AQI, then PM2.5 */}
        <div className="inline-flex rounded-lg border border-[var(--dash-rule)] p-1 bg-[var(--dash-surface-soft)]">
          <button
            type="button"
            onClick={() => setActiveMetric("us_aqi")}
            className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
              activeMetric === "us_aqi"
                ? "bg-[var(--dash-surface)] text-[var(--dash-ink)] shadow-xs"
                : "text-[var(--dash-muted)] hover:text-[var(--dash-ink)]"
            }`}
          >
            AQI INDEX
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric("pm2_5")}
            className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
              activeMetric === "pm2_5"
                ? "bg-[var(--dash-surface)] text-[var(--dash-ink)] shadow-xs"
                : "text-[var(--dash-muted)] hover:text-[var(--dash-ink)]"
            }`}
          >
            PM₂.₅ (µg/m³)
          </button>
        </div>
      </div>

      {/* Heatmap Matrix Rows */}
      <div className="mt-6 space-y-6">
        {diurnalAnalysis.map((item) => (
          <div
            key={item.loc.name}
            className="p-4 rounded-xl border border-[var(--dash-rule)] bg-[var(--dash-surface)]"
          >
            {/* Row Title & Summary Window Badges */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 mb-3">
              <div>
                <strong className="text-base font-bold text-[var(--dash-ink)]">{item.loc.name}</strong>
                <span className="text-xs text-[var(--dash-muted)] ml-2 font-mono">24-Hour Cycle</span>
              </div>

              <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
                {/* Cleanest Window */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                  <SunMedium size={13} /> Cleanest Window: <strong>{item.cleanestHour}</strong> ({item.cleanestVal.toFixed(0)} {activeMetric === "pm2_5" ? "µg/m³" : "AQI"})
                </span>

                {/* Peak Hazard Window */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/25">
                  <AlertOctagon size={13} /> Peak Hazard: <strong>{item.peakHazardHour}</strong> ({item.peakHazardVal.toFixed(0)} {activeMetric === "pm2_5" ? "µg/m³" : "AQI"})
                </span>
              </div>
            </div>

            {/* 24-Column Ribbon Grid */}
            <div className="overflow-x-auto pb-1">
              <div className="min-w-[640px]">
                <div className="grid grid-cols-[repeat(24,minmax(0,1fr))] gap-1">
                  {item.hourlySeries.map((hItem, idx) => {
                    const val = activeMetric === "pm2_5" ? hItem.pm2_5 : hItem.aqi;
                    const cellColor = getCellColor(val, activeMetric);

                    return (
                      <div
                        key={idx}
                        className="group relative flex flex-col items-center cursor-default"
                      >
                        {/* Hour Cell Block */}
                        <div
                          className={`w-full h-11 rounded flex flex-col items-center justify-center font-mono text-[10px] font-bold transition-transform hover:scale-105 ${cellColor}`}
                        >
                          <span className="truncate">{Math.round(val)}</span>
                        </div>

                        {/* Hour Tag below */}
                        <span className="text-[9px] font-mono text-[var(--dash-muted)] mt-1">
                          {idx % 3 === 0 ? hItem.hourLabel.replace(":00", "h") : "·"}
                        </span>

                        {/* Hover Tooltip */}
                        <div className="absolute bottom-full mb-1.5 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                          <div className="px-2 py-1 rounded bg-[var(--dash-ink)] text-[var(--dash-surface)] font-mono text-[10px] whitespace-nowrap shadow-lg">
                            <span>{hItem.hourLabel}</span>
                            <span className="block font-bold">
                              {val.toFixed(1)} {activeMetric === "pm2_5" ? "µg/m³" : "AQI"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend Footer */}
      <div className="mt-5 pt-4 border-t border-[var(--dash-rule)] flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[var(--dash-muted)]">
        <div className="flex items-center gap-2">
          <span>Hazard Scale:</span>
          <div className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded bg-emerald-500 inline-block" title="Good (0-12 µg/m³)" />
            <span className="w-3.5 h-3.5 rounded bg-lime-500 inline-block" title="Moderate (12.1-35.4 µg/m³)" />
            <span className="w-3.5 h-3.5 rounded bg-amber-400 inline-block" title="Sensitive (35.5-55.4 µg/m³)" />
            <span className="w-3.5 h-3.5 rounded bg-orange-500 inline-block" title="Unhealthy (55.5-150.4 µg/m³)" />
            <span className="w-3.5 h-3.5 rounded bg-rose-600 inline-block" title="Very Unhealthy (150.5-250.4 µg/m³)" />
            <span className="w-3.5 h-3.5 rounded bg-purple-900 inline-block" title="Hazardous (>250.4 µg/m³)" />
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1">
            <SunMedium size={12} className="text-amber-500" /> Daytime Solar Ventilation
          </span>
          <span className="flex items-center gap-1">
            <Moon size={12} className="text-indigo-400" /> Nocturnal Surface Inversion
          </span>
        </div>
      </div>
    </div>
  );
}
