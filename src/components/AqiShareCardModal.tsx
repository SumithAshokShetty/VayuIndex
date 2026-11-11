"use client";

import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toPng, toBlob } from "html-to-image";
import { QRCodeSVG } from "qrcode.react";
import {
  Share2,
  Download,
  Copy,
  Check,
  X,
  Sparkles,
  Smartphone,
  Square,
  RectangleHorizontal,
  Flame,
  Wind,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import type { AirQualityResponse, GeocodedPlace, Location } from "@/lib/types";
import { useTheme } from "@/lib/use-theme";

export function getHealthGuidance(aqi: number | null) {
  if (aqi === null)
    return {
      label: "Telemetry Pending",
      advice: "Individual pollutant readings monitored. Check particulate mass concentrations.",
    };
  if (aqi <= 50)
    return {
      label: "Good Air",
      advice: "Minimal impact. Clean airshed; ideal conditions for outdoor activities.",
    };
  if (aqi <= 100)
    return {
      label: "Satisfactory",
      advice: "Minor breathing discomfort may be experienced by sensitive individuals.",
    };
  if (aqi <= 200)
    return {
      label: "Moderate",
      advice: "Breathing discomfort to individuals with respiratory or cardiovascular sensitivity.",
    };
  if (aqi <= 300)
    return {
      label: "Poor",
      advice: "Prolonged exposure causes discomfort. Sensitive groups should wear N95 mask outdoors.",
    };
  if (aqi <= 400)
    return {
      label: "Very Poor",
      advice: "Respiratory distress on prolonged exposure. Avoid outdoor exertion; run indoor HEPA purifiers.",
    };
  return {
    label: "Severe",
    advice: "Severe health hazard. Healthy individuals affected; keep windows sealed and stay indoors.",
  };
}

interface AqiShareCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  air: AirQualityResponse | null;
  location: Location | GeocodedPlace;
  dominantPollutant?: string | null;
}

type AspectRatio = "square" | "story" | "landscape";
type CardTheme = "editorial" | "midnight" | "crimson";

export function AqiShareCardModal({
  open,
  onOpenChange,
  air,
  location,
  dominantPollutant,
}: AqiShareCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [aspect, setAspect] = useState<AspectRatio>("square");
  const [cardTheme, setCardTheme] = useState<CardTheme>("editorial");
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const aqi = typeof air?.current.aqi === "number" ? air.current.aqi : 0;
  const pm25 = Number(air?.current?.pm2_5) || 0;
  const pm10 = Number(air?.current?.pm10) || 0;
  const no2 = Number(air?.current?.no2) || 0;
  const adminName =
    "admin" in location ? location.admin : (location as GeocodedPlace).admin1;
  const guidance = getHealthGuidance(aqi);

  // Berkeley Earth formula: ~22 µg/m³ of PM2.5 over 24h ≈ 1 cigarette
  const cigaretteEq = Math.max(0, pm25 / 22).toFixed(1);

  // NAQI Severity colors
  const severityColor =
    aqi > 400
      ? "#991b1b" // Severe (dark red)
      : aqi > 300
      ? "#dc2626" // Very Poor (red)
      : aqi > 200
      ? "#ea580c" // Poor (orange)
      : aqi > 100
      ? "#d97706" // Moderate (amber)
      : aqi > 50
      ? "#65a30d" // Satisfactory (lime)
      : "#16a34a"; // Good (green)

  const timestamp =
    air?.current.time?.replace("T", " ").slice(0, 16) ??
    new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // Dynamic share link for QR Code
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/dashboard?city=${encodeURIComponent(
          location.name
        )}`
      : `https://vayuindex.org/dashboard`;

  // Download high-resolution PNG
  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    setErrorMsg(null);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2.5,
        cacheBust: true,
        skipFonts: true,
      });
      const link = document.createElement("a");
      link.download = `VayuIndex_${location.name.replace(/\s+/g, "_")}_AQI_${aqi}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export error:", err);
      setErrorMsg("Failed to generate image. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // Copy PNG blob directly to clipboard
  const handleCopy = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    setErrorMsg(null);
    try {
      const blob = await toBlob(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        skipFonts: true,
      });
      if (blob && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } else {
        throw new Error("Clipboard API unsupported for images");
      }
    } catch (err) {
      console.error("Clipboard copy error:", err);
      await handleDownload();
    } finally {
      setIsExporting(false);
    }
  };

  // Web Share API
  const handleNativeShare = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    setErrorMsg(null);
    try {
      const blob = await toBlob(cardRef.current, {
        pixelRatio: 2.5,
        cacheBust: true,
        skipFonts: true,
      });
      if (
        blob &&
        navigator.canShare &&
        navigator.canShare({
          files: [new File([blob], "report.png", { type: "image/png" })],
        })
      ) {
        const file = new File(
          [blob],
          `VayuIndex_${location.name}_AQI.png`,
          { type: "image/png" }
        );
        await navigator.share({
          title: `Vayu Index: Air Quality in ${location.name}`,
          text: `🚨 Air Quality Index in ${location.name} is ${aqi} (${guidance.label}). Equivalent to smoking ~${cigaretteEq} cigarettes today! #AirQuality #VayuIndex`,
          files: [file],
        });
      } else if (navigator.share) {
        await navigator.share({
          title: `Vayu Index: Air Quality in ${location.name}`,
          text: `🚨 AQI in ${location.name} is ${aqi} (${guidance.label}). Inhaling this air today is equivalent to ~${cigaretteEq} cigarettes. Check live telemetry: ${shareUrl}`,
          url: shareUrl,
        });
      } else {
        await handleCopy();
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Web share error:", err);
        await handleDownload();
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Themes with crisp, saturated contrast
  const themeStyles = {
    editorial: {
      bg: "bg-[#FAF8F3]",
      border: "border-[#d8ded2]",
      textPrimary: "text-[#111915]",
      textMuted: "text-[#404c44]",
      textFaint: "text-[#627267]",
      cardSurface: "bg-[#ffffff] shadow-sm",
      pillBorder: "border-[#cfd8cb]",
      brandAccent: "#1b5e39",
      glow: "rgba(27, 94, 57, 0.12)",
    },
    midnight: {
      bg: "bg-[#090d0b]",
      border: "border-[#1e2d24]",
      textPrimary: "text-[#ffffff]",
      textMuted: "text-[#b4c8bb]",
      textFaint: "text-[#809b8b]",
      cardSurface: "bg-[#131b16] shadow-sm",
      pillBorder: "border-[#25392d]",
      brandAccent: "#4ade80",
      glow: "rgba(74, 222, 128, 0.16)",
    },
    crimson: {
      bg: "bg-[#140808]",
      border: "border-[#3f1919]",
      textPrimary: "text-[#ffffff]",
      textMuted: "text-[#f3b5b5]",
      textFaint: "text-[#b87676]",
      cardSurface: "bg-[#220d0d] shadow-sm",
      pillBorder: "border-[#522222]",
      brandAccent: "#f87171",
      glow: "rgba(248, 113, 113, 0.2)",
    },
  }[cardTheme];

  // High-clarity aspect ratio dimensions
  const aspectConfig = {
    square: {
      widthClass: "w-[480px] min-h-[480px]",
      label: "1:1 Square (Instagram / LinkedIn)",
      icon: Square,
    },
    story: {
      widthClass: "w-[400px] min-h-[710px]",
      label: "9:16 Story (IG / WhatsApp / TikTok)",
      icon: Smartphone,
    },
    landscape: {
      widthClass: "w-[620px] min-h-[350px]",
      label: "16:9 Landscape (Twitter / Web Card)",
      icon: RectangleHorizontal,
    },
  }[aspect];

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5">
          {/* Backdrop with high opacity */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal Container: Explicit High-Contrast Styling */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className={`relative z-10 max-h-[94vh] w-[95vw] max-w-[920px] overflow-y-auto rounded-2xl border p-5 sm:p-7 shadow-2xl ${
              isDark
                ? "bg-[#141b17] border-[#29382f] text-[#f1f5f2]"
                : "bg-[#ffffff] border-[#d4dcd5] text-[#131b16]"
            }`}
          >
            {/* Header with High-Contrast Typography */}
            <div
              className={`flex items-center justify-between border-b pb-4 ${
                isDark ? "border-[#25332b]" : "border-[#e5e9e6]"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md">
                  <Sparkles size={20} />
                </span>
                <div>
                  <h3 className="text-[19px] font-black tracking-tight">
                    AQI Social Sharing Card
                  </h3>
                  <p
                    className={`text-[13px] font-medium ${
                      isDark ? "text-[#a3b8ac]" : "text-[#55665b]"
                    }`}
                  >
                    High-resolution verified pollution infographic for Instagram, WhatsApp, X, and LinkedIn.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className={`rounded-xl p-2 transition-colors cursor-pointer border ${
                  isDark
                    ? "border-[#2b3b32] text-[#c0d4c7] hover:bg-[#1f2b24] hover:text-white"
                    : "border-[#d8ded9] text-[#47574d] hover:bg-[#f2f6f3] hover:text-[#111914]"
                }`}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Controls Bar: Format + Theme with High Visibility */}
            <div
              className={`my-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border p-3.5 ${
                isDark
                  ? "bg-[#1a241f] border-[#2d3d34]"
                  : "bg-[#f5f8f6] border-[#dce3de]"
              }`}
            >
              {/* Aspect Ratio Buttons */}
              <div className="flex items-center gap-2">
                <span
                  className={`text-[12px] font-mono font-bold uppercase tracking-wider ${
                    isDark ? "text-[#8fa799]" : "text-[#4b5c51]"
                  }`}
                >
                  Format:
                </span>
                {(["square", "story", "landscape"] as AspectRatio[]).map((fmt) => {
                  const Icon =
                    fmt === "square"
                      ? Square
                      : fmt === "story"
                      ? Smartphone
                      : RectangleHorizontal;
                  const label =
                    fmt === "square"
                      ? "1:1 Square"
                      : fmt === "story"
                      ? "9:16 Story"
                      : "16:9 Landscape";
                  const isSelected = aspect === fmt;
                  return (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setAspect(fmt)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold transition-all cursor-pointer border ${
                        isSelected
                          ? "bg-emerald-700 text-white border-emerald-600 shadow-md"
                          : isDark
                          ? "bg-[#223028] text-[#c5d8cb] border-[#2e4036] hover:bg-[#2b3c32]"
                          : "bg-white text-[#223026] border-[#cbd6ce] hover:bg-[#edf2ee]"
                      }`}
                    >
                      <Icon size={14} />
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Theme Selector */}
              <div className="flex items-center gap-2">
                <span
                  className={`text-[12px] font-mono font-bold uppercase tracking-wider ${
                    isDark ? "text-[#8fa799]" : "text-[#4b5c51]"
                  }`}
                >
                  Theme:
                </span>
                {(
                  [
                    { id: "editorial", label: "Ivory", swatch: "#FAF8F3" },
                    { id: "midnight", label: "Midnight", swatch: "#090d0b" },
                    { id: "crimson", label: "Crimson", swatch: "#220d0d" },
                  ] as const
                ).map((t) => {
                  const isSelected = cardTheme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setCardTheme(t.id)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] font-bold transition-all cursor-pointer border ${
                        isSelected
                          ? "ring-2 ring-emerald-500 bg-white dark:bg-[#24332b] text-[#111] dark:text-white border-emerald-500 shadow-sm"
                          : isDark
                          ? "bg-[#223028] text-[#c5d8cb] border-[#2e4036] hover:bg-[#2b3c32]"
                          : "bg-white text-[#223026] border-[#cbd6ce] hover:bg-[#edf2ee]"
                      }`}
                    >
                      <span
                        className="inline-block h-3.5 w-3.5 rounded-full border border-black/30 shadow-inner"
                        style={{ backgroundColor: t.swatch }}
                      />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive Card Canvas Preview (Render Target for html-to-image) */}
            <div
              className={`flex justify-center items-center py-4 sm:py-6 px-1 sm:px-3 overflow-x-auto max-w-full rounded-2xl border ${
                isDark
                  ? "bg-[#0b100d] border-[#223028]"
                  : "bg-[#eaedea] border-[#d2dbd4]"
              }`}
            >
              <div
                ref={cardRef}
                className={`relative flex flex-col justify-between p-5 sm:p-8 rounded-2xl border shadow-2xl transition-all duration-300 overflow-hidden select-none max-w-full ${themeStyles.bg} ${themeStyles.border} ${aspectConfig.widthClass}`}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  boxShadow: `0 25px 60px ${themeStyles.glow}`,
                }}
              >
                {/* Background ambient radial aura based on severity */}
                <div
                  className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-25 blur-3xl"
                  style={{ backgroundColor: severityColor }}
                />

                {/* TOP: Brand watermark + Telemetry Badge */}
                <div className="relative z-10 flex items-start justify-between border-b border-black/10 dark:border-white/10 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-xl shadow-sm"
                      style={{
                        background: severityColor,
                        color: "#ffffff",
                      }}
                    >
                      <Wind size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span
                        className={`text-[14px] font-black tracking-widest ${themeStyles.textPrimary}`}
                      >
                        VAYU<span style={{ color: themeStyles.brandAccent }}>INDEX</span>
                      </span>
                      <span
                        className={`font-mono text-[8px] tracking-[0.18em] uppercase font-bold ${themeStyles.textFaint}`}
                      >
                        Global Air Intelligence Bulletin
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[9px] font-black tracking-wider text-emerald-950 dark:text-emerald-200 shadow-sm"
                      style={{
                        backgroundColor: "rgba(57, 168, 117, 0.22)",
                        border: "1.5px solid rgba(57, 168, 117, 0.45)",
                      }}
                    >
                      <i className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      CPCB VERIFIED
                    </span>
                    <span
                      className={`font-mono text-[8.5px] font-semibold mt-1 ${themeStyles.textFaint}`}
                    >
                      {timestamp}
                    </span>
                  </div>
                </div>

                {/* CENTER: Location + Giant AQI Hero Block */}
                <div className="relative z-10 my-auto py-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <MapPin size={16} style={{ color: severityColor }} />
                    <h2
                      className={`text-[22px] sm:text-[25px] font-black tracking-tight truncate ${themeStyles.textPrimary}`}
                    >
                      {location.name}
                    </h2>
                    <span
                      className={`text-[12.5px] font-bold ${themeStyles.textMuted}`}
                    >
                      · {[adminName, location.country].filter(Boolean).join(", ")}
                    </span>
                  </div>

                  {/* AQI Score Row */}
                  <div className="flex items-baseline gap-4 my-2">
                    <span
                      className="text-[64px] sm:text-[76px] font-black tracking-tighter leading-none"
                      style={{ color: severityColor }}
                    >
                      {aqi || "—"}
                    </span>
                    <div className="flex flex-col">
                      <span
                        className="font-mono text-[11.5px] uppercase font-black tracking-wider"
                        style={{ color: severityColor }}
                      >
                        CPCB NAQI · {guidance.label}
                      </span>
                      <span
                        className={`text-[11.5px] font-bold leading-tight max-w-[300px] mt-1 ${themeStyles.textMuted}`}
                      >
                        {guidance.advice.split(".")[0]}.
                      </span>
                    </div>
                  </div>

                  {/* The "Shock Metric": Cigarette Inhalation Equivalent */}
                  <div
                    className={`mt-3 flex items-center justify-between rounded-xl p-3 border ${themeStyles.pillBorder} ${themeStyles.cardSurface}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
                        <Flame size={17} />
                      </span>
                      <div>
                        <span
                          className={`block font-mono text-[8.5px] uppercase font-extrabold tracking-wider ${themeStyles.textFaint}`}
                        >
                          Berkeley Earth Inhalation Burden
                        </span>
                        <span
                          className={`text-[13px] font-black ${themeStyles.textPrimary}`}
                        >
                          ≈ {cigaretteEq} Cigarettes / 24h
                        </span>
                      </div>
                    </div>
                    <span
                      className="rounded-lg px-2 py-1 font-mono text-[9px] font-black shadow-sm"
                      style={{
                        backgroundColor: `${severityColor}22`,
                        color: severityColor,
                        border: `1.5px solid ${severityColor}55`,
                      }}
                    >
                      PM2.5: {pm25.toFixed(1)} µg/m³
                    </span>
                  </div>

                  {/* Multi-Pollutant Pill Grid (Shown in square and story formats) */}
                  {aspect !== "landscape" && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div
                        className={`rounded-xl p-2 text-center border ${themeStyles.pillBorder} ${themeStyles.cardSurface}`}
                      >
                        <span
                          className={`block font-mono text-[8px] uppercase font-extrabold ${themeStyles.textFaint}`}
                        >
                          PM10
                        </span>
                        <span
                          className={`text-[12.5px] font-black font-mono ${themeStyles.textPrimary}`}
                        >
                          {pm10.toFixed(0)} <small className="text-[8px] font-normal">µg/m³</small>
                        </span>
                      </div>
                      <div
                        className={`rounded-xl p-2 text-center border ${themeStyles.pillBorder} ${themeStyles.cardSurface}`}
                      >
                        <span
                          className={`block font-mono text-[8px] uppercase font-extrabold ${themeStyles.textFaint}`}
                        >
                          NO2
                        </span>
                        <span
                          className={`text-[12.5px] font-black font-mono ${themeStyles.textPrimary}`}
                        >
                          {no2.toFixed(0)} <small className="text-[8px] font-normal">µg/m³</small>
                        </span>
                      </div>
                      <div
                        className={`rounded-xl p-2 text-center border ${themeStyles.pillBorder} ${themeStyles.cardSurface}`}
                      >
                        <span
                          className={`block font-mono text-[8px] uppercase font-extrabold ${themeStyles.textFaint}`}
                        >
                          Dominant
                        </span>
                        <span className="text-[12.5px] font-black font-mono text-emerald-600 dark:text-emerald-400 uppercase">
                          {dominantPollutant || "PM2.5"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* FOOTER: QR Code + Call to Action */}
                <div className="relative z-10 flex items-center justify-between border-t border-black/10 dark:border-white/10 pt-3.5">
                  <div className="flex flex-col">
                    <span
                      className={`text-[10.5px] font-extrabold ${themeStyles.textPrimary}`}
                    >
                      Track live atmosphere at vayuindex.org
                    </span>
                    <span
                      className={`font-mono text-[8.5px] font-semibold ${themeStyles.textFaint}`}
                    >
                      CPCB official telemetry + Copernicus CAMS
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-white p-1.5 shadow-md border border-black/15">
                      <QRCodeSVG value={shareUrl} size={38} level="L" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error notice if canvas export fails */}
            {errorMsg && (
              <p className="mt-3 text-center text-[12px] text-red-500 font-mono font-bold">
                {errorMsg}
              </p>
            )}

            {/* Action Export Buttons: High Contrast & Vibrant */}
            <div
              className={`mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4 ${
                isDark ? "border-[#25332b]" : "border-[#e5e9e6]"
              }`}
            >
              <span
                className={`text-[12px] font-mono font-bold ${
                  isDark ? "text-[#8fa799]" : "text-[#4b5c51]"
                }`}
              >
                Output: 2.5× High-DPI Retina Graphic (.PNG)
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={isExporting}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold shadow-sm transition-all cursor-pointer border ${
                    isDark
                      ? "bg-[#202c25] text-white border-[#2e4235] hover:bg-[#28382f]"
                      : "bg-[#f0f4f1] text-[#111914] border-[#ccd8cf] hover:bg-[#e4ece6]"
                  } active:scale-95 disabled:opacity-50`}
                >
                  {copied ? (
                    <>
                      <Check size={16} className="text-emerald-600 font-bold" />
                      Copied Image!
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Copy Image
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleNativeShare}
                  disabled={isExporting}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold border border-emerald-500/40 bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/30 active:scale-95 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  <Share2 size={16} />
                  Share Directly
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isExporting}
                  className="flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-5 py-2.5 text-[13px] font-black text-white shadow-lg active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Download size={16} />
                  {isExporting ? "Generating..." : "Download PNG"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
