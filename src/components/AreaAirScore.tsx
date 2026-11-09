"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight, MapPin, RefreshCw, Sparkles, TrendingDown } from "lucide-react";
import type { StationData, NearbyHaven } from "@/app/api/stations/route";
import type { Location } from "@/lib/types";

interface AreaAirScoreProps {
  currentLocation: Location;
  onSwitchLocation?: (loc: Location) => void;
}

export function AreaAirScore({ currentLocation, onSwitchLocation }: AreaAirScoreProps) {
  const [stations, setStations] = useState<StationData[]>([]);
  const [havens, setHavens] = useState<NearbyHaven[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    const queryCity = currentLocation.name.toLowerCase();
    fetch(`/api/stations?lat=${currentLocation.latitude}&lng=${currentLocation.longitude}&city=${encodeURIComponent(queryCity)}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!controller.signal.aborted && data) {
          setStations(data.stations || []);
          setHavens(data.havens || []);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [currentLocation]);

  return (
    <div className="area-air-score-container space-y-6 w-full text-white">
      {/* ---------------------------------------------------- */}
      {/* Component 1: Area Air Score Station Cards Breakdown */}
      {/* ---------------------------------------------------- */}
      <section className="p-6 sm:p-7 rounded-2xl border border-neutral-800 bg-neutral-900/90 backdrop-blur-md shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-neutral-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
                AREA AIR SCORE · LOCAL MONITORING NETWORK
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-neutral-800 text-neutral-300 border border-neutral-700">
                Sub-District Sensor Grid
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
              Station Breakdown for {currentLocation.name}
            </h3>
          </div>
          <span className="text-xs font-mono text-neutral-400 self-start sm:self-auto">
            Ranked Cleanest to Most Stressed
          </span>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs font-mono text-neutral-400">
            <RefreshCw size={18} className="animate-spin text-emerald-400" />
            <span>INGESTING PHYSICAL MONITORING STATIONS...</span>
          </div>
        ) : stations.length === 0 ? (
          <p className="text-xs text-neutral-400 py-6 text-center">
            No local physical monitoring stations reporting within range.
          </p>
        ) : (
          <div className="flex items-stretch gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible">
            {stations.map((station) => (
              <div
                key={station.id}
                className="min-w-[280px] sm:min-w-0 p-4 rounded-xl border border-neutral-800 bg-neutral-950/70 hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-3 shadow-md"
              >
                {/* Top Rank Badge & Network */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-neutral-800 text-emerald-400 border border-neutral-700">
                    #{station.rank}
                  </span>
                  <span className="text-[10px] font-mono font-semibold text-neutral-400 px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800">
                    {station.network}
                  </span>
                </div>

                {/* Station Name & Locality */}
                <div>
                  <h4 className="text-sm font-bold text-white line-clamp-1">
                    {station.name}
                  </h4>
                  <span className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                    <MapPin size={11} className="text-emerald-400" />
                    {station.locality}
                  </span>
                </div>

                {/* Live Numerical AQI Score in Bold Typography */}
                <div className="flex items-baseline justify-between pt-1 border-t border-neutral-800">
                  <div>
                    <span className="text-3xl font-black font-mono tracking-tight text-white">
                      {station.aqi}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400 ml-1.5">
                      AQI
                    </span>
                  </div>

                  {/* Status Tag Badge with EPA/CPCB color coding */}
                  <span
                    className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wide border shadow-xs"
                    style={{
                      backgroundColor: `${station.statusColor}22`,
                      borderColor: `${station.statusColor}55`,
                      color: station.statusColor,
                    }}
                  >
                    {station.status}
                  </span>
                </div>

                {/* Primary Pollutant Driver & Mass */}
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 pt-1">
                  <span>Driven by {station.primaryPollutant}</span>
                  <strong className="text-neutral-200">
                    {station.primaryPollutant} {station.primaryValue} µg/m³
                  </strong>
                </div>

                {/* Provenance Tag */}
                <div className="text-[9px] font-mono text-neutral-500 flex items-center justify-between pt-1 border-t border-neutral-800/80">
                  <span className="truncate">{station.provenance}</span>
                  <span>{station.updatedAt}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---------------------------------------------------- */}
      {/* Component 2: Safer Nearby Havens Recommendation Engine */}
      {/* ---------------------------------------------------- */}
      <section className="p-6 sm:p-7 rounded-2xl border border-neutral-800 bg-neutral-900/90 backdrop-blur-md shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-neutral-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                <Sparkles size={14} /> SAFER NEARBY HAVENS RECOMMENDATION ENGINE
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
              Cleaner Atmospheric Refuges within 50km
            </h3>
          </div>
          <span className="text-xs font-mono text-neutral-400">
            Relative Micro-Climate Variance
          </span>
        </div>

        {havens.length === 0 ? (
          <p className="text-xs text-neutral-400 py-4">
            Scanning for cleaner micro-climates in surrounding 50km radius...
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {havens.map((haven) => (
              <div
                key={haven.name}
                className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 flex flex-col justify-between space-y-3 shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/25 text-emerald-300 border border-emerald-500/40">
                      <TrendingDown size={13} />
                      {haven.cleanerPercentage}% CLEANER
                    </span>
                    <span className="text-[11px] font-mono text-neutral-400">
                      {haven.distanceKm} km away
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white mt-2.5">
                    {haven.name}
                  </h4>
                  <span className="text-xs text-neutral-400">
                    {haven.city} · {haven.status} Air Quality
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-2 border-t border-neutral-800">
                  <div>
                    <span className="text-2xl font-extrabold font-mono text-emerald-400">
                      {haven.aqi}
                    </span>
                    <span className="text-xs font-mono text-neutral-400 ml-1">AQI</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <a
                      href="/compare"
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 no-underline transition-colors"
                      title="Compare with Selected"
                    >
                      Compare
                    </a>
                    {onSwitchLocation && (
                      <button
                        type="button"
                        onClick={() =>
                          onSwitchLocation({
                            name: haven.name,
                            admin: haven.city,
                            country: "India",
                            latitude: haven.latitude,
                            longitude: haven.longitude,
                          })
                        }
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors"
                        title="Switch Location"
                      >
                        Switch
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800 text-xs text-neutral-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>
            <strong>Atmospheric Haven Rule:</strong> Micro-climates featuring expansive urban forestry, water bodies, or elevated topography disperse particulate matter up to 40% faster than dense concrete corridors.
          </span>
          <a
            href="/compare"
            className="flex-none inline-flex items-center gap-1 font-semibold text-emerald-400 hover:underline"
          >
            Side-by-Side Comparison <ArrowRight size={13} />
          </a>
        </div>
      </section>
    </div>
  );
}

export default AreaAirScore;
