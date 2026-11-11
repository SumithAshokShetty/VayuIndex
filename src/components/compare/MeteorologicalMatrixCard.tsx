"use client";

import React, { useEffect, useState } from "react";
import { CloudSun, Navigation, Wind, Droplets, Thermometer, Gauge, ArrowUpRight } from "lucide-react";
import type { Location } from "@/lib/types";
import { locationKey } from "../LocationComparison";

interface MeteorologicalMatrixCardProps {
  locations: Location[];
}

interface WeatherPayload {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
    wind_direction_cardinal?: string;
    weather_code?: number;
    boundary_layer_height?: number;
    ventilation_index?: number;
    dispersion_category?: string;
  };
}

export function MeteorologicalMatrixCard({ locations }: MeteorologicalMatrixCardProps) {
  const [weatherMap, setWeatherMap] = useState<Record<string, { data: WeatherPayload | null; loading: boolean }>>({});

  useEffect(() => {
    const controller = new AbortController();

    locations.forEach((loc) => {
      const key = locationKey(loc);
      setWeatherMap((prev) => ({
        ...prev,
        [key]: { data: prev[key]?.data ?? null, loading: true },
      }));

      fetch(`/api/weather?lat=${loc.latitude}&lng=${loc.longitude}`, {
        signal: controller.signal,
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("Failed to fetch weather");
          return (await res.json()) as WeatherPayload;
        })
        .then((data) => {
          if (!controller.signal.aborted) {
            setWeatherMap((prev) => ({
              ...prev,
              [key]: { data, loading: false },
            }));
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setWeatherMap((prev) => ({
              ...prev,
              [key]: { data: null, loading: false },
            }));
          }
        });
    });

    return () => controller.abort();
  }, [locations]);

  return (
    <div className="mt-8 rounded-2xl border border-[var(--dash-rule)] bg-[var(--dash-surface)] p-5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--dash-rule)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--dash-accent)]/15 text-[var(--dash-accent)]">
            <CloudSun size={18} />
          </div>
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--dash-muted)] font-bold">
              OPEN-METEO SYNERGISTIC TELEMETRY
            </span>
            <h3 className="text-base sm:text-lg font-bold text-[var(--dash-ink)]">
              Meteorological & Atmospheric Dispersion Vector Matrix
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-[var(--dash-muted)]">
          <span className="px-2.5 py-1 rounded-md bg-[var(--dash-surface-soft)] border border-[var(--dash-rule)]">
            Ventilation Index = Wind Speed × Mixing Height
          </span>
        </div>
      </div>

      {/* Side-by-Side Weather Cards */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {locations.map((loc) => {
          const key = locationKey(loc);
          const wState = weatherMap[key];
          const curr = wState?.data?.current;

          const temp = curr?.temperature_2m !== undefined ? curr.temperature_2m.toFixed(1) : "—";
          const humidity = curr?.relative_humidity_2m !== undefined ? `${curr.relative_humidity_2m}%` : "—";
          const windSpeed = curr?.wind_speed_10m !== undefined ? curr.wind_speed_10m.toFixed(1) : "—";
          const windDeg = curr?.wind_direction_10m ?? 0;
          const cardinal = curr?.wind_direction_cardinal ?? "N";
          const blh = curr?.boundary_layer_height ?? 450;
          const vi = curr?.ventilation_index ?? 1800;
          const dispersionCat = curr?.dispersion_category ?? (vi < 2000 ? "Inversion Trapping" : "Partial Dispersion");

          let catBadge = "text-amber-700 dark:text-amber-400 bg-amber-500/15 border-amber-500/30";
          if (vi < 2000) {
            catBadge = "text-rose-700 dark:text-rose-400 bg-rose-500/15 border-rose-500/30";
          } else if (vi > 6000) {
            catBadge = "text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 border-emerald-500/30";
          }

          return (
            <div
              key={loc.name}
              className="p-4 rounded-xl border border-[var(--dash-rule)] bg-[var(--dash-surface)] flex flex-col justify-between"
            >
              <div>
                {/* City name & Dispersion state */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-bold text-base text-[var(--dash-ink)] truncate">
                    {loc.name}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold border truncate ${catBadge}`}
                  >
                    {dispersionCat}
                  </span>
                </div>

                {/* Primary Temp & Humidity Grid */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-[var(--dash-surface-soft)] mb-3">
                  <div className="flex items-center gap-2">
                    <Thermometer size={16} className="text-amber-500 flex-none" />
                    <div>
                      <span className="text-[10px] font-mono text-[var(--dash-muted)] uppercase block">TEMP</span>
                      <strong className="text-base font-extrabold text-[var(--dash-ink)]">{temp}°C</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Droplets size={16} className="text-sky-500 flex-none" />
                    <div>
                      <span className="text-[10px] font-mono text-[var(--dash-muted)] uppercase block">HUMIDITY</span>
                      <strong className="text-base font-extrabold text-[var(--dash-ink)]">{humidity}</strong>
                    </div>
                  </div>
                </div>

                {/* Wind Vector (Speed + Compass Direction) */}
                <div className="p-3 rounded-lg border border-[var(--dash-rule)] bg-[var(--dash-surface)] mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-mono text-[var(--dash-muted)] uppercase flex items-center gap-1.5">
                      <Wind size={13} className="text-[var(--dash-accent)]" /> Wind Vector
                    </span>
                    <span className="font-mono text-xs font-bold text-[var(--dash-ink)] flex items-center gap-1">
                      <Navigation
                        size={12}
                        className="text-[var(--dash-accent)] transition-transform duration-500"
                        style={{ transform: `rotate(${windDeg}deg)` }}
                      />
                      {cardinal} ({windDeg}°)
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-[var(--dash-muted)]">Surface Speed (10m)</span>
                    <strong className="font-mono text-sm font-bold text-[var(--dash-ink)]">
                      {windSpeed} <span className="text-xs font-normal text-[var(--dash-muted)]">km/h</span>
                    </strong>
                  </div>
                </div>
              </div>

              {/* Dispersion Mechanics (Boundary Layer Height & Ventilation Index) */}
              <div className="pt-3 border-t border-[var(--dash-rule)] space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--dash-muted)] flex items-center gap-1">
                    <Gauge size={12} /> Boundary Layer:
                  </span>
                  <strong className="text-[var(--dash-ink)]">{blh} m</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[var(--dash-muted)]">Ventilation Index:</span>
                  <strong className="text-[var(--dash-ink)]">{vi} m²/s</strong>
                </div>

                <div className="pt-1.5 text-[10px] text-[var(--dash-muted)] flex items-center gap-1 leading-snug">
                  <ArrowUpRight size={12} className="text-[var(--dash-accent)] flex-none" />
                  <span>
                    {vi < 2000
                      ? "High stagnation potential: Pollutants trapped near ground level."
                      : vi > 6000
                      ? "Favorable atmospheric flushing: Aerosols actively disperse."
                      : "Moderate vertical mixing: Partial particulate clearance."}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
