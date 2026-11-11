"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Cpu, RefreshCw, Sparkles, Zap } from "lucide-react";
import type { AirQualityResponse, Location } from "@/lib/types";
import type { CityTelemetry, CompareAiRequest } from "@/app/api/compare-ai/route";

function getDominantPollutant(air: AirQualityResponse | null): string {
  if (!air?.current) return "PM₂.₅";
  const pollutants = [
    { key: "PM₂.₅", val: Number(air.current.pm2_5) || 0 },
    { key: "PM₁₀", val: Number(air.current.pm10) || 0 },
    { key: "NO₂", val: Number(air.current.nitrogen_dioxide) || 0 },
    { key: "SO₂", val: Number(air.current.sulphur_dioxide) || 0 },
    { key: "O₃", val: Number(air.current.ozone) || 0 },
    { key: "CO", val: (Number(air.current.carbon_monoxide) || 0) / 10 },
  ];
  pollutants.sort((a, b) => b.val - a.val);
  return pollutants[0]?.key || "PM₂.₅";
}

function calculateClientFallback(baseline: CityTelemetry, comparison: CityTelemetry): string[] {
  const aqi1 = baseline.aqi ?? 0;
  const aqi2 = comparison.aqi ?? 0;
  const pm1 = baseline.pm2_5 ?? 0;
  const pm2 = comparison.pm2_5 ?? 0;

  const worse = aqi1 >= aqi2 ? baseline : comparison;
  const cleaner = aqi1 >= aqi2 ? comparison : baseline;
  const deltaAqi = Math.abs(aqi1 - aqi2);

  const pmPct =
    cleaner.pm2_5 && cleaner.pm2_5 > 0
      ? Math.round((Math.abs(pm1 - pm2) / cleaner.pm2_5) * 100)
      : 0;

  const b1 =
    deltaAqi > 10
      ? `${worse.name} registers an elevated air quality deficit over ${cleaner.name}, reflecting a ${deltaAqi}-point AQI gap and ~${pmPct}% higher ambient PM₂.₅ mass.`
      : `${baseline.name} and ${comparison.name} demonstrate comparable atmospheric stress levels, diverging by only ${deltaAqi} composite index points.`;

  const b2 = `${worse.name}'s airshed is primarily governed by fine combustion aerosols (${worse.dominantPollutant || "PM₂.₅"}), whereas ${cleaner.name} maintains a relatively lighter total particulate burden.`;

  const b3 =
    worse.aqi && worse.aqi > 150
      ? `Commuters and sensitive groups in ${worse.name} should wear certified N95 respirators during peak inversion hours, while outdoor activity in ${cleaner.name} is comparatively less hazardous.`
      : `Usual outdoor routines remain viable in both cities, though vulnerable individuals should monitor diurnal evening concentration spikes.`;

  return [b1, b2, b3];
}

export function CompareAiInsights({
  locations,
  liveData,
  locationKey,
}: {
  locations: Location[];
  liveData: Record<string, { air: AirQualityResponse | null; loading: boolean; error?: string }>;
  locationKey: (loc: Location) => string;
}) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);
  const [modelName, setModelName] = useState<string>("qwen/qwen3.8-27b");
  const [isFallback, setIsFallback] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const baselineLoc = locations[0];
  const comparisonLoc = locations[1] || locations[0];

  const baselineAir = liveData[locationKey(baselineLoc)]?.air ?? null;
  const comparisonAir = liveData[locationKey(comparisonLoc)]?.air ?? null;

  const baselineTelemetry: CityTelemetry = useMemo(
    () => ({
      name: baselineLoc?.name || "Baseline City",
      admin: baselineLoc?.admin,
      country: baselineLoc?.country,
      aqi: typeof baselineAir?.current.aqi === "number" ? Math.round(baselineAir.current.aqi) : null,
      pm2_5:
        typeof baselineAir?.current.pm2_5 === "number"
          ? Math.round(baselineAir.current.pm2_5 * 10) / 10
          : null,
      pm10:
        typeof baselineAir?.current.pm10 === "number"
          ? Math.round(baselineAir.current.pm10 * 10) / 10
          : null,
      dominantPollutant: getDominantPollutant(baselineAir),
      sourceLabel: baselineAir?.sourceLabel,
    }),
    [baselineLoc, baselineAir]
  );

  const comparisonTelemetry: CityTelemetry = useMemo(
    () => ({
      name: comparisonLoc?.name || "Comparison City",
      admin: comparisonLoc?.admin,
      country: comparisonLoc?.country,
      aqi:
        typeof comparisonAir?.current.aqi === "number"
          ? Math.round(comparisonAir.current.aqi)
          : null,
      pm2_5:
        typeof comparisonAir?.current.pm2_5 === "number"
          ? Math.round(comparisonAir.current.pm2_5 * 10) / 10
          : null,
      pm10:
        typeof comparisonAir?.current.pm10 === "number"
          ? Math.round(comparisonAir.current.pm10 * 10) / 10
          : null,
      dominantPollutant: getDominantPollutant(comparisonAir),
      sourceLabel: comparisonAir?.sourceLabel,
    }),
    [comparisonLoc, comparisonAir]
  );

  const additionalCities: CityTelemetry[] = useMemo(() => {
    if (locations.length <= 2) return [];
    return locations.slice(2).map((loc) => {
      const air = liveData[locationKey(loc)]?.air ?? null;
      return {
        name: loc.name,
        admin: loc.admin,
        country: loc.country,
        aqi: typeof air?.current.aqi === "number" ? Math.round(air.current.aqi) : null,
        pm2_5: typeof air?.current.pm2_5 === "number" ? Math.round(air.current.pm2_5 * 10) / 10 : null,
        pm10: typeof air?.current.pm10 === "number" ? Math.round(air.current.pm10 * 10) / 10 : null,
        dominantPollutant: getDominantPollutant(air),
      };
    });
  }, [locations, liveData, locationKey]);

  const fetchInsights = useCallback(async () => {
    if (!baselineLoc || !comparisonLoc) return;

    setLoading(true);
    setErrorMsg(null);

    const payload: CompareAiRequest = {
      baselineCity: baselineTelemetry,
      comparisonCity: comparisonTelemetry,
      additionalCities,
    };

    try {
      const res = await fetch("/api/compare-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      if (Array.isArray(data.insights) && data.insights.length > 0) {
        setInsights(data.insights);
        setIsFallback(Boolean(data.fallback));
        setModelName(data.model || "qwen/qwen3.8-27b");
      } else {
        throw new Error("No insights returned");
      }
    } catch {
      // Client-side fallback
      const fallback = calculateClientFallback(baselineTelemetry, comparisonTelemetry);
      setInsights(fallback);
      setIsFallback(true);
      setModelName("Deterministic Variance Engine");
    } finally {
      setLoading(false);
    }
  }, [baselineLoc, comparisonLoc, baselineTelemetry, comparisonTelemetry, additionalCities]);

  // Automatically fetch when city telemetry settles
  const telemetryHash = `${baselineTelemetry.name}:${baselineTelemetry.aqi}-${comparisonTelemetry.name}:${comparisonTelemetry.aqi}`;

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInsights();
    }, 400);
    return () => clearTimeout(timer);
  }, [telemetryHash, fetchInsights]);

  const bulletLabels = [
    { title: "Severity & Variance Delta", color: "text-emerald-700 dark:text-emerald-400" },
    { title: "Dominant Pollutant Signature", color: "text-amber-700 dark:text-amber-400" },
    { title: "Targeted Action Advisory", color: "text-blue-700 dark:text-blue-400" },
  ];

  return (
    <article className="mt-8 p-6 sm:p-7 rounded-2xl border border-[var(--dash-rule)] bg-[var(--dash-surface)] shadow-sm transition-colors duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--dash-rule)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-600/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Sparkles size={18} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-[var(--dash-muted)] font-bold">
                SYNTHESIS 05 · COMPARATIVE REASONING
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-600/20">
                <Cpu size={11} />
                POWERED BY GROQ
              </span>
              {isFallback && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-600/20">
                  DETERMINISTIC FALLBACK
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--dash-ink)] mt-1">
              AI Atmospheric Comparison Synthesis
            </h2>
          </div>
        </div>

        {/* Action Button & Active Model Pill */}
        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <span className="hidden md:inline text-xs font-mono text-[var(--dash-muted)] bg-[var(--dash-surface-soft)] px-2.5 py-1 rounded border border-[var(--dash-rule)]">
            {modelName}
          </span>
          <button
            type="button"
            onClick={fetchInsights}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[var(--dash-surface-soft)] hover:bg-[var(--dash-surface)] text-[var(--dash-ink)] border border-[var(--dash-rule)] transition-all cursor-pointer disabled:opacity-50"
            title="Re-run AI analysis with live telemetry"
          >
            <RefreshCw size={13} className={loading ? "animate-spin text-emerald-600" : ""} />
            <span>{loading ? "Synthesizing…" : "Regenerate Analysis"}</span>
          </button>
        </div>
      </div>

      {/* Comparison Locations Quick Strip */}
      <div className="flex items-center flex-wrap gap-2 py-3 border-b border-[var(--dash-rule)]/60 text-xs font-mono text-[var(--dash-muted)]">
        <span className="font-semibold text-[var(--dash-ink)] uppercase tracking-wider">Analysis Scope:</span>
        <span className="px-2 py-0.5 rounded bg-[var(--dash-surface-soft)] border border-[var(--dash-rule)]">
          {baselineTelemetry.name} (AQI {baselineTelemetry.aqi ?? "—"})
        </span>
        <span>vs.</span>
        <span className="px-2 py-0.5 rounded bg-[var(--dash-surface-soft)] border border-[var(--dash-rule)]">
          {comparisonTelemetry.name} (AQI {comparisonTelemetry.aqi ?? "—"})
        </span>
        {additionalCities.map((city) => (
          <span key={city.name} className="px-2 py-0.5 rounded bg-[var(--dash-surface-soft)] border border-[var(--dash-rule)]">
            + {city.name} (AQI {city.aqi ?? "—"})
          </span>
        ))}
      </div>

      {/* Body Content / Bullets or Skeleton */}
      <div className="pt-5">
        {loading ? (
          <div className="space-y-4 py-2">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="flex gap-3.5 items-start">
                <div className="w-6 h-6 rounded-full bg-emerald-600/10 animate-pulse shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-[var(--dash-rule)] rounded w-36 animate-pulse" />
                  <div className="h-4 bg-[var(--dash-surface-soft)] rounded w-full animate-pulse" />
                  <div className="h-4 bg-[var(--dash-surface-soft)] rounded w-4/5 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-5">
            {insights.map((bullet, index) => {
              const meta = bulletLabels[index] || {
                title: `Key Insight 0${index + 1}`,
                color: "text-emerald-700 dark:text-emerald-400",
              };
              return (
                <div
                  key={index}
                  className="flex items-start gap-3.5 p-3.5 sm:p-4 rounded-xl bg-[var(--dash-surface-soft)] border border-[var(--dash-rule)] transition-all hover:border-emerald-600/30"
                >
                  <div className="w-6 h-6 rounded-md bg-emerald-600/10 text-emerald-800 dark:text-emerald-300 font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    0{index + 1}
                  </div>
                  <div className="flex-1">
                    <span className={`text-[11px] font-mono uppercase font-bold tracking-wider block mb-1 ${meta.color}`}>
                      {meta.title}
                    </span>
                    <p className="text-sm sm:text-[14.5px] text-[var(--dash-ink)] leading-relaxed font-sans">
                      {bullet}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Attributions */}
      <div className="mt-5 pt-3.5 border-t border-[var(--dash-rule)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-[var(--dash-muted)]">
        <span className="flex items-center gap-1.5">
          <Zap size={11} className="text-emerald-600" />
          Real-time cross-airshed atmospheric inference via Groq LPU™ Inference Engine
        </span>
        <span>Executive synthesis constrained to &lt;120 words</span>
      </div>
    </article>
  );
}
