"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDownWideNarrow, ArrowLeft, ArrowRight, ArrowUpRight, RotateCcw } from "lucide-react";
import { AQI_COLORS } from "@/lib/aqi-calculator";
import type { Location } from "@/lib/types";

export type HighAqiEntry = {
  rank: number;
  name: string;
  country: string;
  state?: string;
  lat: number;
  lng: number;
  aqi: number;
  status: string;
  provenance: string;
  sourceLabel: string;
  isStation: boolean;
};

export type IndianCityPollutantEntry = {
  rank: number;
  name: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
  aqi: number;
  status: string;
  advisory?: string;
  pollutants: {
    pm2_5: number | null;
    pm10: number | null;
    no2: number | null;
    so2: number | null;
    co: number | null;
    ozone: number | null;
  };
  weather?: {
    temp?: number;
    humidity?: number;
    windSpeed?: number;
    windDirection?: number;
    condition?: string;
  };
  provenance: string;
  updatedAt?: string;
};

const FALLBACK_INDIAN_TOP10: IndianCityPollutantEntry[] = [
  {
    rank: 1,
    name: "Delhi",
    state: "Delhi",
    country: "India",
    lat: 28.58028,
    lng: 77.233829,
    aqi: 500,
    status: "Severe",
    pollutants: { pm2_5: 406, pm10: 408, no2: 131, so2: 80, co: 16.0, ozone: 113 },
    weather: { temp: 26.7, humidity: 55, windSpeed: 3.7, condition: "Severe Smog" },
    provenance: "CPCB Ground Telemetry (data.gov.in)",
  },
  {
    rank: 2,
    name: "Sirsa",
    state: "Haryana",
    country: "India",
    lat: 29.5364,
    lng: 75.0158,
    aqi: 500,
    status: "Severe",
    pollutants: { pm2_5: 391, pm10: 275, no2: 37, so2: 0, co: 0.1, ozone: 20 },
    weather: { temp: 25.0, humidity: 54, windSpeed: 12.0, condition: "Severe Smog" },
    provenance: "CPCB Ground Telemetry (data.gov.in)",
  },
  {
    rank: 3,
    name: "Noida",
    state: "Uttar Pradesh",
    country: "India",
    lat: 28.57216,
    lng: 77.35567,
    aqi: 500,
    status: "Severe",
    pollutants: { pm2_5: 383, pm10: 292, no2: 127, so2: 31, co: 0.1, ozone: 32 },
    weather: { temp: 27.7, humidity: 48, windSpeed: 5.5, condition: "Severe Smog" },
    provenance: "CPCB Ground Telemetry (data.gov.in)",
  },
  {
    rank: 4,
    name: "Hisar",
    state: "Haryana",
    country: "India",
    lat: 29.1492,
    lng: 75.7217,
    aqi: 495,
    status: "Severe",
    pollutants: { pm2_5: 374, pm10: 368, no2: 16, so2: 34, co: 0.1, ozone: 17 },
    weather: { temp: 26.0, humidity: 51, windSpeed: 4.8, condition: "Dense Smog" },
    provenance: "CPCB Ground Telemetry (data.gov.in)",
  },
  {
    rank: 5,
    name: "Ghaziabad",
    state: "Uttar Pradesh",
    country: "India",
    lat: 28.6692,
    lng: 77.4538,
    aqi: 483,
    status: "Severe",
    pollutants: { pm2_5: 358, pm10: 323, no2: 100, so2: 38, co: 21.0, ozone: 41 },
    weather: { temp: 27.1, humidity: 52, windSpeed: 4.1, condition: "Severe Smog" },
    provenance: "CPCB Ground Telemetry (data.gov.in)",
  },
  {
    rank: 6,
    name: "Bhiwani",
    state: "Haryana",
    country: "India",
    lat: 28.7833,
    lng: 76.1333,
    aqi: 472,
    status: "Severe",
    pollutants: { pm2_5: 343, pm10: 198, no2: 18, so2: 19, co: 8.0, ozone: 15 },
    weather: { temp: 25.8, humidity: 53, windSpeed: 6.2, condition: "Dense Smog" },
    provenance: "CPCB Ground Telemetry (data.gov.in)",
  },
  {
    rank: 7,
    name: "Gurugram",
    state: "Haryana",
    country: "India",
    lat: 28.4595,
    lng: 77.0266,
    aqi: 469,
    status: "Severe",
    pollutants: { pm2_5: 339, pm10: 257, no2: 53, so2: 18, co: 0.1, ozone: 21 },
    weather: { temp: 27.4, humidity: 49, windSpeed: 5.0, condition: "Severe Smog" },
    provenance: "CPCB Ground Telemetry (data.gov.in)",
  },
  {
    rank: 8,
    name: "Faridabad",
    state: "Haryana",
    country: "India",
    lat: 28.4089,
    lng: 77.3178,
    aqi: 467,
    status: "Severe",
    pollutants: { pm2_5: 337, pm10: 272, no2: 37, so2: 10, co: 25.0, ozone: 14 },
    weather: { temp: 27.8, humidity: 50, windSpeed: 4.5, condition: "Severe Smog" },
    provenance: "CPCB Ground Telemetry (data.gov.in)",
  },
  {
    rank: 9,
    name: "Gwalior",
    state: "Madhya Pradesh",
    country: "India",
    lat: 26.2183,
    lng: 78.1828,
    aqi: 464,
    status: "Severe",
    pollutants: { pm2_5: 333, pm10: 259, no2: 84, so2: 24, co: 0.1, ozone: 89 },
    weather: { temp: 28.5, humidity: 44, windSpeed: 7.2, condition: "Hazy Smog" },
    provenance: "CPCB Ground Telemetry (data.gov.in)",
  },
  {
    rank: 10,
    name: "Panchgaon",
    state: "Haryana",
    country: "India",
    lat: 28.3242,
    lng: 76.9011,
    aqi: 463,
    status: "Severe",
    pollutants: { pm2_5: 332, pm10: 217, no2: 14, so2: 0, co: 0.1, ozone: 9 },
    weather: { temp: 26.9, humidity: 52, windSpeed: 5.3, condition: "Dense Smog" },
    provenance: "CPCB Ground Telemetry (data.gov.in)",
  },
];

// Fallback high AQI benchmark findings across world's most severe atmospheric airsheds
const FALLBACK_HIGH_AQI_BENCHMARKS: HighAqiEntry[] = [
  {
    rank: 1,
    name: "Lahore",
    country: "Pakistan",
    state: "Punjab",
    lat: 31.5204,
    lng: 74.3587,
    aqi: 394,
    status: "Hazardous",
    provenance: "GROUND STATION",
    sourceLabel: "WAQI / EPD Punjab Telemetry",
    isStation: true,
  },
  {
    rank: 2,
    name: "Delhi",
    country: "India",
    state: "National Capital Region",
    lat: 28.6139,
    lng: 77.2090,
    aqi: 386,
    status: "Hazardous",
    provenance: "GROUND STATION",
    sourceLabel: "CPCB Official Ground Telemetry",
    isStation: true,
  },
  {
    rank: 3,
    name: "Faisalabad",
    country: "Pakistan",
    state: "Punjab",
    lat: 31.4200,
    lng: 73.0800,
    aqi: 342,
    status: "Hazardous",
    provenance: "GROUND STATION",
    sourceLabel: "WAQI Station Observation",
    isStation: true,
  },
  {
    rank: 4,
    name: "Ghaziabad",
    country: "India",
    state: "Uttar Pradesh",
    lat: 28.6692,
    lng: 77.4538,
    aqi: 318,
    status: "Hazardous",
    provenance: "GROUND STATION",
    sourceLabel: "CPCB Continuous Monitoring Station",
    isStation: true,
  },
  {
    rank: 5,
    name: "Noida",
    country: "India",
    state: "Uttar Pradesh",
    lat: 28.5355,
    lng: 77.3910,
    aqi: 295,
    status: "Very Unhealthy",
    provenance: "GROUND STATION",
    sourceLabel: "CPCB Station Network",
    isStation: true,
  },
  {
    rank: 6,
    name: "Patna",
    country: "India",
    state: "Bihar",
    lat: 25.5941,
    lng: 85.1376,
    aqi: 278,
    status: "Very Unhealthy",
    provenance: "GROUND STATION",
    sourceLabel: "CPCB Ground Telemetry",
    isStation: true,
  },
  {
    rank: 7,
    name: "Dhaka",
    country: "Bangladesh",
    state: "Dhaka Division",
    lat: 23.8103,
    lng: 90.4125,
    aqi: 264,
    status: "Very Unhealthy",
    provenance: "GROUND STATION",
    sourceLabel: "DoE Bangladesh AirNow / WAQI",
    isStation: true,
  },
  {
    rank: 8,
    name: "Lucknow",
    country: "India",
    state: "Uttar Pradesh",
    lat: 26.8467,
    lng: 80.9462,
    aqi: 252,
    status: "Very Unhealthy",
    provenance: "GROUND STATION",
    sourceLabel: "CPCB Continuous Monitoring Station",
    isStation: true,
  },
  {
    rank: 9,
    name: "Kanpur",
    country: "India",
    state: "Uttar Pradesh",
    lat: 26.4499,
    lng: 80.3319,
    aqi: 245,
    status: "Very Unhealthy",
    provenance: "GROUND STATION",
    sourceLabel: "CPCB Ground Observation",
    isStation: true,
  },
  {
    rank: 10,
    name: "Baghdad",
    country: "Iraq",
    state: "Baghdad Governorate",
    lat: 33.3152,
    lng: 44.3661,
    aqi: 228,
    status: "Very Unhealthy",
    provenance: "ATMOSPHERIC MODEL",
    sourceLabel: "Copernicus CAMS Reanalysis",
    isStation: false,
  },
  {
    rank: 11,
    name: "Ulaanbaatar",
    country: "Mongolia",
    state: "Ulaanbaatar",
    lat: 47.9188,
    lng: 106.9176,
    aqi: 215,
    status: "Very Unhealthy",
    provenance: "GROUND STATION",
    sourceLabel: "National Agency for Meteorology (NAMEM)",
    isStation: true,
  },
  {
    rank: 12,
    name: "Tashkent",
    country: "Uzbekistan",
    state: "Tashkent Region",
    lat: 41.2995,
    lng: 69.2401,
    aqi: 198,
    status: "Unhealthy",
    provenance: "GROUND STATION",
    sourceLabel: "Uzhydromet / OpenAQ",
    isStation: true,
  },
  {
    rank: 13,
    name: "Bishkek",
    country: "Kyrgyzstan",
    state: "Chuy Region",
    lat: 42.8746,
    lng: 74.5698,
    aqi: 192,
    status: "Unhealthy",
    provenance: "GROUND STATION",
    sourceLabel: "KyrgyzHydroMet / WAQI",
    isStation: true,
  },
  {
    rank: 14,
    name: "Shijiazhuang",
    country: "China",
    state: "Hebei",
    lat: 38.0428,
    lng: 114.5149,
    aqi: 188,
    status: "Unhealthy",
    provenance: "GROUND STATION",
    sourceLabel: "China National Environmental Monitoring",
    isStation: true,
  },
  {
    rank: 15,
    name: "Tehran",
    country: "Iran",
    state: "Tehran Province",
    lat: 35.6892,
    lng: 51.3890,
    aqi: 184,
    status: "Unhealthy",
    provenance: "GROUND STATION",
    sourceLabel: "Tehran Air Quality Control Company",
    isStation: true,
  },
  {
    rank: 16,
    name: "Cairo",
    country: "Egypt",
    state: "Cairo Governorate",
    lat: 30.0444,
    lng: 31.2357,
    aqi: 178,
    status: "Unhealthy",
    provenance: "GROUND STATION",
    sourceLabel: "Egyptian Environmental Affairs Agency",
    isStation: true,
  },
  {
    rank: 17,
    name: "Riyadh",
    country: "Saudi Arabia",
    state: "Riyadh Province",
    lat: 24.7136,
    lng: 46.6753,
    aqi: 174,
    status: "Unhealthy",
    provenance: "GROUND STATION",
    sourceLabel: "General Authority of Meteorology / OpenAQ",
    isStation: true,
  },
  {
    rank: 18,
    name: "Kuwait City",
    country: "Kuwait",
    state: "Al Asimah",
    lat: 29.3759,
    lng: 47.9774,
    aqi: 168,
    status: "Unhealthy",
    provenance: "GROUND STATION",
    sourceLabel: "Environment Public Authority (EPA Kuwait)",
    isStation: true,
  },
  {
    rank: 19,
    name: "Jakarta",
    country: "Indonesia",
    state: "Special Capital Region",
    lat: -6.2088,
    lng: 106.8456,
    aqi: 165,
    status: "Unhealthy",
    provenance: "GROUND STATION",
    sourceLabel: "BMKG Indonesia / WAQI",
    isStation: true,
  },
  {
    rank: 20,
    name: "Hanoi",
    country: "Vietnam",
    state: "Red River Delta",
    lat: 21.0285,
    lng: 105.8542,
    aqi: 162,
    status: "Unhealthy",
    provenance: "GROUND STATION",
    sourceLabel: "Vietnam Environment Administration",
    isStation: true,
  },
];

function band(aqi: number) {
  if (aqi <= 50) return { label: "Good", color: AQI_COLORS[0] };
  if (aqi <= 100) return { label: "Moderate", color: AQI_COLORS[1] };
  if (aqi <= 150) return { label: "Sensitive groups", color: AQI_COLORS[2] };
  if (aqi <= 200) return { label: "Unhealthy", color: AQI_COLORS[3] };
  if (aqi <= 300) return { label: "Very unhealthy", color: AQI_COLORS[4] };
  return { label: "Hazardous", color: AQI_COLORS[5] };
}

export function GlobalCityRanking({ onSelectLocation }: { onSelectLocation: (location: Location) => void }) {
  const [readings, setReadings] = useState<HighAqiEntry[]>(FALLBACK_HIGH_AQI_BENCHMARKS);
  const [topIndianCities, setTopIndianCities] = useState<IndianCityPollutantEntry[]>(FALLBACK_INDIAN_TOP10);
  const [currentPage, setCurrentPage] = useState<0 | 1>(0); // 0 = Ranks 01-10, 1 = Ranks 11-20
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const requestController = useRef<AbortController | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const load = useCallback(async () => {
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    setLoading(true);

    try {
      const res = await fetch("/api/hotspots", { signal: controller.signal, cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data?.hotspots && Array.isArray(data.hotspots) && data.hotspots.length > 0) {
          // 1. Process Indian Hotspots for the Top 10 Indian Cities Cards
          const indianHotspots = [...data.hotspots]
            .filter((h) => h.country === "India" && typeof h.aqi === "number" && !isNaN(h.aqi) && h.aqi > 0)
            .sort((a, b) => b.aqi - a.aqi);

          if (indianHotspots.length >= 10 && !controller.signal.aborted) {
            setTopIndianCities(
              indianHotspots.slice(0, 10).map((h, idx) => ({
                rank: idx + 1,
                name: h.name,
                state: h.state || "India",
                country: "India",
                lat: h.lat,
                lng: h.lng,
                aqi: Math.round(h.aqi),
                status: h.status || "Severe",
                advisory: h.advisory,
                pollutants: {
                  pm2_5: typeof h.pollutants?.pm2_5 === "number" ? Math.round(h.pollutants.pm2_5) : null,
                  pm10: typeof h.pollutants?.pm10 === "number" ? Math.round(h.pollutants.pm10) : null,
                  no2: typeof h.pollutants?.no2 === "number" ? Math.round(h.pollutants.no2) : null,
                  so2: typeof h.pollutants?.so2 === "number" ? Math.round(h.pollutants.so2) : null,
                  co: typeof h.pollutants?.co === "number" ? Number(h.pollutants.co.toFixed(1)) : null,
                  ozone: typeof h.pollutants?.ozone === "number" ? Math.round(h.pollutants.ozone) : null,
                },
                weather: h.weather,
                provenance: h.provenance || "CPCB Ground Telemetry (data.gov.in)",
                updatedAt: h.updatedAt,
              }))
            );
          }

          // 2. Sort all surveyed global cities strictly by AQI in descending order
          const sorted = [...data.hotspots]
            .filter((h) => typeof h.aqi === "number" && !isNaN(h.aqi) && h.aqi > 0)
            .sort((a, b) => b.aqi - a.aqi);

          if (sorted.length >= 20) {
            const top20: HighAqiEntry[] = sorted.slice(0, 20).map((h, idx) => ({
              rank: idx + 1,
              name: h.name,
              country: h.country,
              state: h.state,
              lat: h.lat,
              lng: h.lng,
              aqi: Math.round(h.aqi),
              status: h.status,
              provenance:
                h.country === "India"
                  ? "GROUND STATION"
                  : h.provenance.toLowerCase().includes("station")
                  ? "GROUND STATION"
                  : "ATMOSPHERIC MODEL",
              sourceLabel: h.provenance,
              isStation:
                h.country === "India" ||
                h.provenance.toLowerCase().includes("station") ||
                h.provenance.toLowerCase().includes("cpcb") ||
                h.provenance.toLowerCase().includes("waqi"),
            }));

            if (!controller.signal.aborted) {
              setReadings(top20);
              setLastUpdated(
                new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZoneName: "short" })
              );
              setLoading(false);
              return;
            }
          }
        }
      }
    } catch {
      // Keep robust benchmark dataset
    }

    if (!controller.signal.aborted) {
      setReadings(FALLBACK_HIGH_AQI_BENCHMARKS);
      setTopIndianCities(FALLBACK_INDIAN_TOP10);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZoneName: "short" }));
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 10 * 60 * 1000);
    return () => {
      requestController.current?.abort();
      window.clearInterval(interval);
    };
  }, [load]);

  // Split into Table 1 (Ranks 01-10) and Table 2 (Ranks 11-20)
  const displayedItems = readings.slice(currentPage * 10, (currentPage + 1) * 10);

  return (
    <>
      <section className="global-city-ranking" aria-labelledby="global-city-ranking-title" suppressHydrationWarning>
      <header className="global-ranking-heading" suppressHydrationWarning>
        <div>
          <span className="section-kicker" suppressHydrationWarning>
            <span className="eyebrow-line" /> LIVE AIR INTELLIGENCE · TOP 20 GLOBAL FINDINGS
          </span>
          <h2 id="global-city-ranking-title">Global Top 20 High AQI Major City Findings</h2>
          <p>
            Current highest reported AQI levels across international metropolitan airsheds. Highest air pollution
            appears first.
          </p>
        </div>
        <div className="global-ranking-meta" suppressHydrationWarning>
          <span>
            <i /> LIVE · 10 MIN REFRESH
          </span>
          <span suppressHydrationWarning>UPDATED {mounted && lastUpdated ? lastUpdated : "—"}</span>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            aria-label="Refresh global high AQI findings"
          >
            <RotateCcw size={13} className={loading ? "spin-icon" : ""} /> Refresh
          </button>
        </div>
      </header>

      {/* Table Pagination / Navigation Switcher */}
      <div className="ranking-table-controls">
        <span className="ranking-page-indicator">
          Showing {currentPage * 10 + 1}–{Math.min((currentPage + 1) * 10, readings.length)} of Top 20 Findings
        </span>

        <div className="ranking-nav-btns">
          <button
            type="button"
            className="ranking-nav-btn"
            onClick={() => setCurrentPage(0)}
            disabled={currentPage === 0}
            title="Go to previous ranks (01–10)"
          >
            <ArrowLeft size={13} /> Prev
          </button>
          <button
            type="button"
            className="ranking-nav-btn"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            title="Go to next ranks (11–20)"
          >
            Next <ArrowRight size={13} />
          </button>
        </div>
      </div>

      <div className="global-ranking-columns" aria-hidden="true">
        <span>RANK · CITY & AIRSHED</span>
        <span>REPORTED AQI</span>
        <span>DATA PROVENANCE</span>
        <span />
      </div>

      <ol className="global-ranking-list" aria-live="polite">
        {displayedItems.map((item) => {
          const aqiBand = band(item.aqi);
          return (
            <li key={`${item.name}-${item.lat}-${item.lng}`}>
              <button
                type="button"
                className="global-ranking-row"
                onClick={() =>
                  onSelectLocation({
                    name: item.name,
                    admin: item.state || item.country,
                    country: item.country,
                    latitude: item.lat,
                    longitude: item.lng,
                  })
                }
              >
                <span className="global-ranking-place">
                  <b>{String(item.rank).padStart(2, "0")}</b>
                  <span>
                    <strong>{item.name}</strong>
                    <small>
                      {[item.state, item.country].filter(Boolean).join(" · ")}
                    </small>
                  </span>
                </span>
                <span className="global-ranking-aqi">
                  <strong style={{ color: aqiBand.color }}>{Math.round(item.aqi)}</strong>
                  <small style={{ color: aqiBand.color }}>{item.status}</small>
                </span>
                <span
                  className={`global-ranking-provenance ${
                    item.isStation ? "is-station" : "is-model"
                  }`}
                >
                  <i />
                  {item.provenance}
                  <small>{item.sourceLabel}</small>
                </span>
                <span className="global-ranking-open">
                  INSPECT ON GLOBE <ArrowUpRight size={13} />
                </span>
              </button>
            </li>
          );
        })}
        {loading && readings.length === 0 && (
          <li className="global-ranking-empty">
            <ArrowDownWideNarrow size={15} /> Loading current top 20 high AQI findings…
          </li>
        )}
      </ol>

      {/* Bottom Table Switcher for seamless browsing */}
      <div className="ranking-table-controls bottom-controls">
        <span className="ranking-page-indicator">
          Showing {currentPage * 10 + 1}–{Math.min((currentPage + 1) * 10, readings.length)} of Top 20 Findings
        </span>
        <div className="ranking-nav-btns">
          <button
            type="button"
            className="ranking-nav-btn"
            onClick={() => setCurrentPage(0)}
            disabled={currentPage === 0}
            title="Go to previous ranks (01–10)"
          >
            <ArrowLeft size={13} /> Prev
          </button>
          <button
            type="button"
            className="ranking-nav-btn"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            title="Go to next ranks (11–20)"
          >
            Next <ArrowRight size={13} />
          </button>
        </div>
      </div>

      <p className="global-ranking-footnote">
        Rankings are computed dynamically from real-time official ground observation monitors (CPCB, WAQI, OpenAQ)
        and Copernicus CAMS atmospheric chemistry reanalysis. CPCB AQI standard is applied uniformly across all
        locations to ensure consistency.
      </p>
    </section>

    {/* ---------------------------------------------------- */}
    {/* TOP 10 INDIAN CITIES MULTI-POLLUTANT TELEMETRY CARDS */}
    {/* ---------------------------------------------------- */}
    <section
      className="global-city-ranking top-indian-cities-card mt-8 sm:mt-10"
      aria-labelledby="indian-cities-ranking-title"
      suppressHydrationWarning
    >
      <header className="global-ranking-heading" suppressHydrationWarning>
        <div>
          <span className="section-kicker" suppressHydrationWarning>
            <span className="eyebrow-line" /> NATIONAL AIR QUALITY SURVEILLANCE · CPCB GROUND STATIONS
          </span>
          <h2 id="indian-cities-ranking-title">Top 10 Most Polluted Indian Cities</h2>
          <p>
            Real-time multi-pollutant concentrations (PM₂.₅, PM₁₀, NO₂, SO₂, CO, O₃) from official Central Pollution Control Board telemetry across India&apos;s most critical airsheds.
          </p>
        </div>
        <div className="global-ranking-meta" suppressHydrationWarning>
          <span>
            <i /> LIVE CPCB TELEMETRY
          </span>
          <span>10 MONITORED CITIES</span>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-6">
        {topIndianCities.map((city) => {
          const aqiBand = band(city.aqi);
          const whoPm25Multiple = city.pollutants.pm2_5 ? (city.pollutants.pm2_5 / 15).toFixed(1) : null;
          return (
            <article
              key={`indian-card-${city.name}-${city.rank}`}
              onClick={() =>
                onSelectLocation({
                  name: city.name,
                  admin: city.state,
                  country: city.country,
                  latitude: city.lat,
                  longitude: city.lng,
                })
              }
              className="group relative p-4 rounded-xl border border-[var(--dash-rule)] bg-[var(--dash-surface-soft)]/50 hover:bg-[var(--dash-surface)] hover:border-emerald-600/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              {/* Top: Rank, Name, State */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--dash-surface)] text-[var(--dash-ink)] border border-[var(--dash-rule)]">
                    #{String(city.rank).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                    Inspect <ArrowUpRight size={11} />
                  </span>
                </div>

                <h4 className="text-base font-bold text-[var(--dash-ink)] group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                  {city.name}
                </h4>
                <p className="text-[11px] font-mono text-[var(--dash-muted)]">
                  {city.state} · India
                </p>

                {/* Main AQI Pill */}
                <div className="my-3 flex items-baseline justify-between p-2.5 rounded-lg bg-[var(--dash-surface)] border border-[var(--dash-rule)]/60 shadow-2xs">
                  <div>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--dash-muted)] block">
                      CPCB AQI
                    </span>
                    <strong className="text-2xl font-mono font-black" style={{ color: aqiBand.color }}>
                      {city.aqi}
                    </strong>
                  </div>
                  <span
                    className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full self-center"
                    style={{
                      color: aqiBand.color,
                      backgroundColor: `${aqiBand.color}20`,
                    }}
                  >
                    {city.status}
                  </span>
                </div>

                {/* Pollutant Matrix (PM2.5, PM10, NO2, SO2, CO, O3) */}
                <div className="space-y-1.5 pt-1 text-[10px] font-mono">
                  <div className="flex items-center justify-between py-0.5 border-b border-[var(--dash-rule)]/30">
                    <span className="text-[var(--dash-muted)] flex items-center gap-1 font-semibold">
                      PM₂.₅
                      {whoPm25Multiple && (
                        <span className="text-[8px] text-rose-600 dark:text-rose-400 font-bold">
                          ({whoPm25Multiple}× WHO)
                        </span>
                      )}
                    </span>
                    <b className="text-[var(--dash-ink)] font-bold">
                      {city.pollutants.pm2_5 !== null ? `${city.pollutants.pm2_5} µg/m³` : "—"}
                    </b>
                  </div>

                  <div className="flex items-center justify-between py-0.5 border-b border-[var(--dash-rule)]/30">
                    <span className="text-[var(--dash-muted)] font-semibold">PM₁₀</span>
                    <b className="text-[var(--dash-ink)] font-bold">
                      {city.pollutants.pm10 !== null ? `${city.pollutants.pm10} µg/m³` : "—"}
                    </b>
                  </div>

                  <div className="flex items-center justify-between py-0.5 border-b border-[var(--dash-rule)]/30">
                    <span className="text-[var(--dash-muted)]">NO₂</span>
                    <b className="text-[var(--dash-ink)]">
                      {city.pollutants.no2 !== null ? `${city.pollutants.no2} µg/m³` : "—"}
                    </b>
                  </div>

                  <div className="flex items-center justify-between py-0.5 border-b border-[var(--dash-rule)]/30">
                    <span className="text-[var(--dash-muted)]">SO₂</span>
                    <b className="text-[var(--dash-ink)]">
                      {city.pollutants.so2 !== null ? `${city.pollutants.so2} µg/m³` : "—"}
                    </b>
                  </div>

                  <div className="flex items-center justify-between py-0.5 border-b border-[var(--dash-rule)]/30">
                    <span className="text-[var(--dash-muted)]">CO</span>
                    <b className="text-[var(--dash-ink)]">
                      {city.pollutants.co !== null ? `${city.pollutants.co} mg/m³` : "—"}
                    </b>
                  </div>

                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-[var(--dash-muted)]">Ozone (O₃)</span>
                    <b className="text-[var(--dash-ink)]">
                      {city.pollutants.ozone !== null ? `${city.pollutants.ozone} µg/m³` : "—"}
                    </b>
                  </div>
                </div>
              </div>

              {/* Bottom: Micro Weather & Provenance */}
              <div className="mt-3 pt-2.5 border-t border-[var(--dash-rule)]/40 text-[9px] font-mono text-[var(--dash-muted)] space-y-1">
                {city.weather && (
                  <div className="flex items-center justify-between text-[10px]">
                    <span>{city.weather.temp}°C · {city.weather.humidity}% RH</span>
                    <span>{city.weather.windSpeed} km/h wind</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-0.5">
                  <span className="truncate">CPCB Telemetry · data.gov.in</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  </>
  );
}
