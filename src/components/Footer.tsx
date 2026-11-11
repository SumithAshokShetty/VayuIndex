"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";

export function Footer({ className }: { className?: string } = {}) {
  const [istTime, setIstTime] = useState<string>("SYNCING IST...");

  // Keep IST system time synchronized in real time
  useEffect(() => {
    const updateTime = () => {
      try {
        const timeStr = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date());
        setIstTime(`${timeStr} IST`);
      } catch {
        const now = new Date();
        setIstTime(now.toLocaleTimeString("en-GB") + " IST");
      }
    };

    updateTime();
    const interval = window.setInterval(updateTime, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <footer
      className={`editorial-footer relative w-full overflow-hidden bg-[#F7F6F0] dark:bg-[#091311] text-neutral-900 dark:text-[#eef6f2] pt-20 sm:pt-28 lg:pt-36 pb-12 px-6 sm:px-10 lg:px-16 transition-colors duration-300 border-none mt-20 sm:mt-28 lg:mt-36 ${className || ""}`}
    >
      {/* Dynamic SVG Noise / Grain Filter Layer */}
      <svg
        className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-25 w-full h-full mix-blend-multiply dark:mix-blend-overlay z-0"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <filter id="footerNoise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#footerNoise)" />
      </svg>

      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col justify-between">
        {/* Tier 1: Standard Vertical Link Columns Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 pb-12 border-b border-neutral-300/40 dark:border-white/5">
          {/* Column 1: Brand & Bio */}
          <div className="flex flex-col items-start gap-3">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-[#83dfbd]">
              BRAND
            </span>
            <a
              href="/"
              className="text-lg sm:text-xl font-bold font-sans tracking-tight text-neutral-900 dark:text-[#f2f7f4] hover:opacity-85 transition-opacity flex items-center gap-2"
            >
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-700 dark:bg-[#83dfbd]" />
              VAYU INDEX
            </a>
            <p className="text-xs sm:text-[13px] text-neutral-600 dark:text-[#a7b9af] leading-relaxed max-w-[270px]">
              Planetary air intelligence combining verified ground-station telemetry, atmospheric dispersion models, and real-time personal exposure analytics.
            </p>
          </div>

          {/* Column 2: Navigation */}
          <div className="flex flex-col items-start gap-3">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-[#83dfbd]">
              NAVIGATION
            </span>
            <nav className="flex flex-col items-start gap-2.5 font-sans text-xs sm:text-[13px]">
              <a
                href="/overview"
                className="text-neutral-600 dark:text-[#c4d4cc] hover:text-neutral-950 dark:hover:text-[#83dfbd] flex items-center gap-2 group transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600/40 dark:bg-emerald-400/40 group-hover:bg-emerald-600 dark:group-hover:bg-[#83dfbd] transition-colors" />
                Air Intelligence Overview
              </a>
              <a
                href="/dashboard"
                className="text-neutral-600 dark:text-[#c4d4cc] hover:text-neutral-950 dark:hover:text-[#83dfbd] flex items-center gap-2 group transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600/40 dark:bg-emerald-400/40 group-hover:bg-emerald-600 dark:group-hover:bg-[#83dfbd] transition-colors" />
                Live AQI Dashboard
              </a>
              <a
                href="/compare"
                className="text-neutral-600 dark:text-[#c4d4cc] hover:text-neutral-950 dark:hover:text-[#83dfbd] flex items-center gap-2 group transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600/40 dark:bg-emerald-400/40 group-hover:bg-emerald-600 dark:group-hover:bg-[#83dfbd] transition-colors" />
                Location Comparison
              </a>
              <a
                href="/risk"
                className="text-neutral-600 dark:text-[#c4d4cc] hover:text-neutral-950 dark:hover:text-[#83dfbd] flex items-center gap-2 group transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600/40 dark:bg-emerald-400/40 group-hover:bg-emerald-600 dark:group-hover:bg-[#83dfbd] transition-colors" />
                Personal Risk Engine
              </a>
              <a
                href="/dashboard#forecast"
                className="text-neutral-600 dark:text-[#c4d4cc] hover:text-neutral-950 dark:hover:text-[#83dfbd] flex items-center gap-2 group transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600/40 dark:bg-emerald-400/40 group-hover:bg-emerald-600 dark:group-hover:bg-[#83dfbd] transition-colors" />
                72-Hour Forecast
              </a>
            </nav>
          </div>

          {/* Column 3: Data Sources */}
          <div className="flex flex-col items-start gap-3">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-[#83dfbd]">
              DATA SOURCES
            </span>
            <nav className="flex flex-col items-start gap-2.5 font-sans text-xs sm:text-[13px]">
              <a
                href="https://openaq.org/"
                target="_blank"
                rel="noreferrer"
                className="text-neutral-600 dark:text-[#c4d4cc] hover:text-neutral-950 dark:hover:text-[#83dfbd] inline-flex items-center gap-1.5 group transition-colors"
              >
                <span>OpenAQ v3 API</span>
                <ArrowUpRight size={13} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-emerald-600 dark:text-[#83dfbd]" />
              </a>
              <a
                href="https://aqicn.org/"
                target="_blank"
                rel="noreferrer"
                className="text-neutral-600 dark:text-[#c4d4cc] hover:text-neutral-950 dark:hover:text-[#83dfbd] inline-flex items-center gap-1.5 group transition-colors"
              >
                <span>WAQI Network</span>
                <ArrowUpRight size={13} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-emerald-600 dark:text-[#83dfbd]" />
              </a>
              <a
                href="https://open-meteo.com/en/docs/air-quality-api"
                target="_blank"
                rel="noreferrer"
                className="text-neutral-600 dark:text-[#c4d4cc] hover:text-neutral-950 dark:hover:text-[#83dfbd] inline-flex items-center gap-1.5 group transition-colors"
              >
                <span>Open-Meteo CAMS</span>
                <ArrowUpRight size={13} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-emerald-600 dark:text-[#83dfbd]" />
              </a>
              <a
                href="https://groq.com/"
                target="_blank"
                rel="noreferrer"
                className="text-neutral-600 dark:text-[#c4d4cc] hover:text-neutral-950 dark:hover:text-[#83dfbd] inline-flex items-center gap-1.5 group transition-colors"
              >
                <span>Groq Llama 3 AI</span>
                <ArrowUpRight size={13} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-emerald-600 dark:text-[#83dfbd]" />
              </a>
            </nav>
          </div>

          {/* Column 4: System Status */}
          <div className="flex flex-col items-start gap-4">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-[#83dfbd]">
              SYSTEM STATUS
            </span>

            {/* Green pulsing TELEMETRY LIVE status badge */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-emerald-600/25 dark:border-[#83dfbd]/25 bg-emerald-600/10 dark:bg-[#83dfbd]/10 text-emerald-800 dark:text-[#83dfbd] font-mono text-[11px] tracking-wider font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600 dark:bg-[#83dfbd]" />
              </span>
              TELEMETRY LIVE
            </div>

            {/* Dynamic IST system time */}
            <div className="flex flex-col gap-1 mt-0.5">
              <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 dark:text-[#8fa398]">
                SYSTEM TIME
              </span>
              <strong className="font-mono text-sm sm:text-base font-semibold text-neutral-900 dark:text-[#f2f7f4] tracking-wider">
                {istTime}
              </strong>
            </div>
          </div>
        </div>

        {/* Tier 2: Centered Pulsing Anchor Dot */}
        <div className="py-12 sm:py-16 flex items-center justify-center">
          <div className="relative flex items-center justify-center w-5 h-5">
            <span className="w-2.5 h-2.5 bg-neutral-950 dark:bg-[#83dfbd] rounded-full animate-ping absolute opacity-70" />
            <span className="w-2.5 h-2.5 bg-neutral-950 dark:bg-[#83dfbd] rounded-full relative" />
          </div>
        </div>

        {/* Tier 3: Oversized Textured Title & Legal Bar */}
        <div className="w-full flex items-center justify-center overflow-hidden py-6 sm:py-10">
          <span
            className="text-[clamp(2.5rem,12.5vw,14vw)] font-extrabold leading-none tracking-[-0.065em] text-neutral-900 dark:text-[#f2f7f4] select-none uppercase text-center block w-full whitespace-nowrap will-change-transform"
            aria-hidden="true"
          >
            VAYU INDEX
          </span>
        </div>

        {/* Bottom Metadata Bar */}
        <div className="pt-8 pb-4 border-t border-neutral-300/40 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left: Copyright */}
          <div className="font-mono text-[11px] uppercase tracking-wider text-neutral-500 dark:text-[#8fa398] pl-14 sm:pl-0 text-center sm:text-left">
            © 2026 VAYU INDEX · ALL RIGHTS RESERVED
          </div>

          {/* Right: Legal inline links */}
          <nav
            aria-label="Legal and attribution navigation"
            className="flex flex-wrap items-center justify-center sm:justify-end gap-6 sm:gap-8 font-mono text-[11px] uppercase tracking-wider text-neutral-500 dark:text-[#8fa398]"
          >
            <a
              href="/about"
              className="hover:text-neutral-900 dark:hover:text-[#83dfbd] underline-offset-4 hover:underline transition-colors"
            >
              PRIVACY
            </a>
            <a
              href="/about"
              className="hover:text-neutral-900 dark:hover:text-[#83dfbd] underline-offset-4 hover:underline transition-colors"
            >
              TERMS
            </a>
            <a
              href="/about"
              className="hover:text-neutral-900 dark:hover:text-[#83dfbd] underline-offset-4 hover:underline transition-colors"
            >
              ATTRIBUTION
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
