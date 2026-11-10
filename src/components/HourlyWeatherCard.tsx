"use client";

import React, { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HourlyItem {
  timeFormatted: string; // e.g. "13:00"
  temp: number; // e.g. 36
  isDay: boolean;
  weatherCode: number;
}

interface HourlyWeatherCardProps {
  cityName: string;
  lat: number;
  lng: number;
}

// Crisp, bespoke vector weather icons matching Image 2
function DaySunIcon() {
  return (
    <svg viewBox="0 0 32 32" className="w-7 h-7 text-amber-400 drop-shadow-xs" fill="currentColor">
      <circle cx="16" cy="16" r="6.5" />
      <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <line x1="16" y1="3" x2="16" y2="6.5" />
        <line x1="16" y1="25.5" x2="16" y2="29" />
        <line x1="3" y1="16" x2="6.5" y2="16" />
        <line x1="25.5" y1="16" x2="29" y2="16" />
        <line x1="6.8" y1="6.8" x2="9.3" y2="9.3" />
        <line x1="22.7" y1="22.7" x2="25.2" y2="25.2" />
        <line x1="6.8" y1="25.2" x2="9.3" y2="22.7" />
        <line x1="22.7" y1="9.3" x2="25.2" y2="6.8" />
      </g>
    </svg>
  );
}

function NightMoonIcon() {
  return (
    <svg viewBox="0 0 32 32" className="w-7 h-7 text-amber-300 drop-shadow-xs" fill="none">
      {/* Crescent Moon */}
      <path
        d="M20 7 C14.5 8 10.5 13 10.5 19 C10.5 24 14 28 19 28.5 C12 28.5 7 23 7 16.5 C7 10.5 11.5 6 17.5 5.5 C18.5 5.5 19.3 6 20 7 Z"
        fill="currentColor"
      />
      {/* Sparkle Star 1 */}
      <path
        d="M23 9 L24 11.8 L26.8 12.8 L24 13.8 L23 16.6 L22 13.8 L19.2 12.8 L22 11.8 Z"
        fill="#fde047"
      />
      {/* Small Sparkle Star 2 */}
      <path
        d="M16 21 L16.6 22.8 L18.4 23.4 L16.6 24 L16 25.8 L15.4 24 L13.6 23.4 L15.4 22.8 Z"
        fill="#fde047"
        opacity="0.85"
      />
    </svg>
  );
}

function CloudIcon({ isDay }: { isDay: boolean }) {
  return (
    <svg viewBox="0 0 32 32" className="w-7 h-7 text-slate-400" fill="currentColor">
      <path d="M10 24 C6.7 24 4 21.3 4 18 C4 15 6.2 12.5 9.1 12.1 C10.3 8.5 13.8 6 18 6 C23 6 27.1 9.7 27.8 14.5 C29.1 15.4 30 17.1 30 19 C30 21.8 27.8 24 25 24 Z" />
      {isDay && <circle cx="10" cy="10" r="3" fill="#fbbf24" />}
    </svg>
  );
}

function RainIcon() {
  return (
    <svg viewBox="0 0 32 32" className="w-7 h-7 text-sky-400" fill="none">
      <path
        d="M9 19 C6.8 19 5 17.2 5 15 C5 13 6.5 11.3 8.5 11 C9.5 8.2 12.2 6 15.5 6 C19.5 6 22.8 9 23.4 12.8 C24.5 13.5 25.2 14.8 25.2 16.3 C25.2 18.5 23.4 19 21.5 19 Z"
        fill="currentColor"
        opacity="0.85"
      />
      <line x1="11" y1="22" x2="9" y2="27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="22" x2="14" y2="27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="21" y1="22" x2="19" y2="27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function WeatherIcon({ weatherCode, isDay }: { weatherCode: number; isDay: boolean }) {
  if (weatherCode >= 51 && weatherCode <= 67 || weatherCode >= 80 && weatherCode <= 82) {
    return <RainIcon />;
  }
  if (weatherCode === 2 || weatherCode === 3 || weatherCode === 45 || weatherCode === 48) {
    return <CloudIcon isDay={isDay} />;
  }
  if (isDay) {
    return <DaySunIcon />;
  }
  return <NightMoonIcon />;
}

export function HourlyWeatherCard({ cityName, lat, lng }: HourlyWeatherCardProps) {
  const [hours, setHours] = useState<HourlyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let canceled = false;
    setLoading(true);

    fetch(`/api/weather?lat=${lat}&lng=${lng}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (canceled || !data?.hourly?.time) return;

        const times: string[] = data.hourly.time;
        const temps: number[] = data.hourly.temperature_2m || [];
        const isDayArr: number[] = data.hourly.is_day || [];
        const codes: number[] = data.hourly.weather_code || [];

        // Determine current hour starting point from now
        const nowMs = Date.now();
        let startIndex = times.findIndex((t) => {
          const tMs = new Date(t).getTime();
          // Match the hour containing the current time (within 55 minutes)
          return tMs >= nowMs - 55 * 60 * 1000;
        });

        if (startIndex === -1) startIndex = 0;

        const next24: HourlyItem[] = [];
        const count = Math.min(24, times.length - startIndex);

        for (let i = 0; i < count; i++) {
          const idx = startIndex + i;
          const rawTime = times[idx]; // "2026-11-10T13:00"
          const timeFormatted = rawTime.includes("T")
            ? rawTime.split("T")[1].slice(0, 5)
            : rawTime.slice(11, 16);

          next24.push({
            timeFormatted,
            temp: Math.round(temps[idx] ?? 28),
            isDay: Boolean(isDayArr[idx] ?? 1),
            weatherCode: codes[idx] ?? 0,
          });
        }

        setHours(next24);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!canceled) setLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, [lat, lng]);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -280 : 280;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="w-full bg-[var(--dash-surface)] border border-[var(--dash-rule)] rounded-2xl p-5 sm:p-6 shadow-sm text-[var(--dash-ink)] transition-colors">
      {/* Header matching Image 2 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg sm:text-xl font-extrabold text-[var(--dash-ink)] tracking-tight">
            Hourly weather in {cityName}
          </h3>
          <p className="text-xs sm:text-sm text-[var(--dash-muted)] mt-0.5">
            Next 24 hours, local time.
          </p>
        </div>

        {/* Scroll Navigation Buttons */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleScroll("left")}
            aria-label="Scroll left"
            className="p-1.5 rounded-lg border border-[var(--dash-rule)] hover:bg-[var(--dash-surface-soft)] text-[var(--dash-muted)] hover:text-[var(--dash-ink)] transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => handleScroll("right")}
            aria-label="Scroll right"
            className="p-1.5 rounded-lg border border-[var(--dash-rule)] hover:bg-[var(--dash-surface-soft)] text-[var(--dash-muted)] hover:text-[var(--dash-ink)] transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Carousel Track */}
      {loading ? (
        <div className="flex items-center justify-center py-10 gap-3 text-xs font-mono text-[var(--dash-muted)]">
          <span className="w-4 h-4 rounded-full border-2 border-[var(--dash-accent)] border-t-transparent animate-spin" />
          <span>Ingesting Open-Meteo local hourly forecast...</span>
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-3 overflow-x-auto pt-5 pb-2 scrollbar-thin scroll-smooth"
        >
          {hours.map((h, i) => (
            <div
              key={i}
              className="flex-none w-[72px] sm:w-[76px] h-[115px] rounded-2xl border border-[var(--dash-rule)] bg-[var(--dash-canvas)]/70 hover:bg-[var(--dash-surface-soft)] flex flex-col items-center justify-between py-3 px-1 transition-all shadow-xs"
            >
              {/* 24-hr Time format e.g. 13:00 */}
              <span className="text-xs font-mono font-semibold text-[var(--dash-muted)]">
                {h.timeFormatted}
              </span>

              {/* Day/Night Weather Vector Icon */}
              <div className="my-1">
                <WeatherIcon weatherCode={h.weatherCode} isDay={h.isDay} />
              </div>

              {/* Temperature */}
              <span className="text-base font-bold font-mono text-[var(--dash-ink)]">
                {h.temp}°
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HourlyWeatherCard;
