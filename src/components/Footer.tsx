"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

export function Footer() {
  const containerRef = useRef<HTMLElement>(null);
  const [clock, setClock] = useState("UTC · SYNCING");

  // Keep system time synchronized in real time
  useEffect(() => {
    const updateTime = () => {
      setClock(
        new Intl.DateTimeFormat(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZoneName: "short",
        })
          .format(new Date())
          .toUpperCase()
      );
    };
    updateTime();
    const interval = window.setInterval(updateTime, 1000);
    return () => window.clearInterval(interval);
  }, []);

  // 1 & 2. Scroll-driven animation architecture (Framer Motion)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"],
  });

  // Animate text from translateY(40%) & scale(0.85) up to translateY(0%) & scale(1.0)
  const translateY = useTransform(scrollYProgress, [0, 1], ["40%", "0%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.85, 1.0]);
  const opacity = useTransform(scrollYProgress, [0, 0.35, 1], [0.4, 0.85, 1]);

  // Spring physics for smooth analog momentum matching maray.ai
  const smoothY = useSpring(translateY, { stiffness: 100, damping: 26, mass: 0.6 });
  const smoothScale = useSpring(scale, { stiffness: 100, damping: 26, mass: 0.6 });

  return (
    <footer
      ref={containerRef}
      className="editorial-footer relative w-full overflow-hidden min-h-screen flex flex-col justify-between py-12 px-6 md:px-12 select-none transition-colors duration-300"
    >
      {/* Dynamic SVG Noise / Grain Filter Layer */}
      <svg
        className="absolute inset-0 pointer-events-none opacity-20 w-full h-full mix-blend-multiply"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <filter id="noiseFilter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>

      {/* Top Section: Indicator Dot & Editorial Meta Navigation */}
      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Floating top indicator dot */}
        <div
          className="w-3 h-3 bg-black rounded-full mx-auto my-6 animate-pulse"
          aria-hidden="true"
        />

        {/* System Time and Link Grid */}
        <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 pt-2 pb-6 border-b border-neutral-300/60 font-mono text-xs uppercase tracking-wider text-neutral-600">
          <a
            href="/"
            className="flex items-center gap-3 text-neutral-900 font-bold tracking-widest text-sm hover:opacity-80 transition-opacity"
          >
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#0f382c]" />
            VAYU INDEX
          </a>

          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            <a href="/dashboard" className="hover:text-neutral-900 transition-colors">
              Explore Dashboard
            </a>
            <a href="/risk" className="hover:text-neutral-900 transition-colors">
              Personal Risk
            </a>
            <a href="/compare" className="hover:text-neutral-900 transition-colors">
              Compare Places
            </a>
            <a href="/about" className="hover:text-neutral-900 transition-colors">
              About Vayu
            </a>
          </div>

          <div className="flex items-center gap-2 text-neutral-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>SYSTEM TIME · {clock}</span>
          </div>
        </div>
      </div>

      {/* Center: Scroll-Triggered Massive Brand Title ("VAYU INDEX") */}
      <div className="relative z-10 w-full flex-1 flex items-center justify-center overflow-hidden my-auto py-8">
        <motion.span
          style={{
            y: smoothY,
            scale: smoothScale,
            opacity,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "clamp(2.5rem, 13.8vw, 22vw)",
          }}
          className="text-[22vw] font-bold leading-none tracking-tighter text-neutral-900 text-center select-none block uppercase whitespace-nowrap will-change-transform"
          aria-hidden="true"
        >
          VAYU INDEX
        </motion.span>
      </div>

      {/* 3. Minimalist Footer Legal Bar */}
      <div className="relative z-10 w-full pt-8 pb-4 border-t border-neutral-300/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Bottom Left: Copyright notice */}
        <div className="font-mono text-xs uppercase tracking-widest text-neutral-500 pl-12 sm:pl-0 text-center sm:text-left">
          © VAYU INDEX 2026 · REAL-TIME AIR INTELLIGENCE
        </div>

        {/* Bottom Right: Legal Links with smooth hover underlines */}
        <nav
          aria-label="Legal and data attribution"
          className="flex flex-wrap items-center justify-center sm:justify-end gap-6 md:gap-8"
        >
          <a
            href="/about"
            className="font-mono text-xs uppercase tracking-widest text-neutral-500 hover:text-neutral-900 transition-colors underline-offset-4 hover:underline"
          >
            IMPRINT
          </a>
          <a
            href="/about"
            className="font-mono text-xs uppercase tracking-widest text-neutral-500 hover:text-neutral-900 transition-colors underline-offset-4 hover:underline"
          >
            PRIVACY POLICY
          </a>
          <a
            href="https://openaq.org/"
            target="_blank"
            rel="noreferrer"
            className="font-mono text-xs uppercase tracking-widest text-neutral-500 hover:text-neutral-900 transition-colors underline-offset-4 hover:underline"
          >
            OPENAQ
          </a>
          <a
            href="https://atmosphere.copernicus.eu/"
            target="_blank"
            rel="noreferrer"
            className="font-mono text-xs uppercase tracking-widest text-neutral-500 hover:text-neutral-900 transition-colors underline-offset-4 hover:underline"
          >
            CAMS ATTRIBUTION
          </a>
        </nav>
      </div>
    </footer>
  );
}

export default Footer;
