"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BellRing,
  Check,
  Clock,
  Info,
  Laptop,
  Radio,
  Sliders,
  Smartphone,
  Sparkles,
  Vibrate,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useTheme } from "@/lib/use-theme";
import type { SmartAlertConfig } from "@/lib/use-smart-alerts";

const PRESET_THRESHOLDS = [
  { value: 100, label: "100+ Moderate", desc: "Sensitive groups (asthma, children, elderly)" },
  { value: 150, label: "150+ Sensitive", desc: "Mild respiratory discomfort on exercise" },
  { value: 200, label: "200+ Poor", desc: "Noticeable breathing discomfort to most people" },
  { value: 300, label: "300+ Very Poor", desc: "Respiratory illness on prolonged exposure" },
  { value: 400, label: "400+ Severe", desc: "Emergency toxicity; severe cellular stress" },
];

export function SmartAqiAlertsModal({
  open,
  onOpenChange,
  config,
  onUpdateConfig,
  onTriggerTest,
  permissionState,
  onRequestPermission,
  currentCityName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: SmartAlertConfig;
  onUpdateConfig: (updates: Partial<SmartAlertConfig>) => void;
  onTriggerTest: () => void;
  permissionState: NotificationPermission;
  onRequestPermission: () => Promise<string>;
  currentCityName?: string;
}) {
  const [testSent, setTestSent] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  if (!open) return null;

  const handleTestClick = () => {
    onTriggerTest();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 2500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop with dark blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onOpenChange(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Window: Solid, fully opaque theme background */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          data-theme={theme}
          style={{
            backgroundColor: isDark ? "#121915" : "#fcfbf7",
            borderColor: isDark ? "#2a362f" : "#dedcd2",
            color: isDark ? "#eff4f0" : "#1a231e",
            boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.4)",
          }}
          className="relative w-full max-w-xl rounded-2xl border p-6 sm:p-7 z-10 overflow-hidden my-auto"
        >
          {/* Header */}
          <div
            className="flex items-start justify-between gap-4 pb-4 border-b"
            style={{ borderColor: isDark ? "#2a362f" : "#dedcd2" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                style={{
                  backgroundColor: isDark ? "rgba(131, 223, 189, 0.12)" : "rgba(33, 129, 94, 0.12)",
                  borderColor: isDark ? "rgba(131, 223, 189, 0.28)" : "rgba(33, 129, 94, 0.25)",
                  color: isDark ? "#83dfbd" : "#0f382c",
                }}
              >
                <BellRing size={20} className={config.enabled ? "animate-pulse" : "opacity-40"} />
              </div>
              <div>
                <span
                  className="text-[10px] font-mono uppercase tracking-widest font-bold block"
                  style={{ color: isDark ? "#95a39a" : "#627066" }}
                >
                  ATMOSPHERIC TELEMETRY SENTINEL
                </span>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Smart AQI Alerts
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer"
              style={{
                color: isDark ? "#95a39a" : "#627066",
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
              }}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-5 pt-5 max-h-[75vh] overflow-y-auto pr-1">
            {/* Master Enable Toggle */}
            <div
              className="flex items-center justify-between p-4 rounded-xl border"
              style={{
                backgroundColor: isDark ? "#18221c" : "#f4f1e8",
                borderColor: isDark ? "#28342d" : "#dedcd0",
              }}
            >
              <div>
                <strong className="text-sm font-semibold block">
                  Active Monitoring Sentinel
                </strong>
                <p className="text-xs mt-0.5" style={{ color: isDark ? "#9ea9a2" : "#637167" }}>
                  Continuously inspects incoming ground station and model telemetry against your threshold.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => onUpdateConfig({ enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-300 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Threshold Slider & Presets */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-1.5"
                  style={{ color: isDark ? "#9ea9a2" : "#637167" }}
                >
                  <Sliders size={13} /> ALERT THRESHOLD LEVEL
                </span>
                <span
                  className="text-sm font-mono font-bold px-2.5 py-0.5 rounded border"
                  style={{
                    backgroundColor: isDark ? "rgba(131, 223, 189, 0.15)" : "rgba(33, 129, 94, 0.12)",
                    borderColor: isDark ? "rgba(131, 223, 189, 0.3)" : "rgba(33, 129, 94, 0.25)",
                    color: isDark ? "#83dfbd" : "#0f382c",
                  }}
                >
                  AQI {config.threshold}
                </span>
              </div>

              {/* Slider */}
              <input
                type="range"
                min="50"
                max="450"
                step="10"
                value={config.threshold}
                disabled={!config.enabled}
                onChange={(e) => onUpdateConfig({ threshold: Number(e.target.value) })}
                className="w-full h-2 bg-neutral-300 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-emerald-600 disabled:opacity-40"
              />

              <div
                className="flex justify-between text-[10px] font-mono mt-1.5 px-0.5"
                style={{ color: isDark ? "#89968e" : "#727f76" }}
              >
                <span>50 (Good)</span>
                <span>150 (Sensitive)</span>
                <span>200 (Poor)</span>
                <span>300 (Very Poor)</span>
                <span>450 (Severe)</span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                {PRESET_THRESHOLDS.map((p) => {
                  const isSelected = config.threshold === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      disabled={!config.enabled}
                      onClick={() => onUpdateConfig({ threshold: p.value })}
                      className="text-left p-2.5 rounded-lg border text-xs transition-all cursor-pointer disabled:opacity-40"
                      style={{
                        backgroundColor: isSelected
                          ? isDark ? "rgba(131, 223, 189, 0.18)" : "rgba(33, 129, 94, 0.14)"
                          : isDark ? "#18221c" : "#f4f1e8",
                        borderColor: isSelected
                          ? isDark ? "#83dfbd" : "#21815e"
                          : isDark ? "#28342d" : "#dedcd0",
                        color: isSelected
                          ? isDark ? "#83dfbd" : "#0f382c"
                          : isDark ? "#c2cec6" : "#445048",
                        boxShadow: isSelected ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                      }}
                    >
                      <span className="font-mono font-bold block">{p.label}</span>
                      <small className="text-[10px] opacity-75 line-clamp-1">{p.desc}</small>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notification Channels & Mobile Section */}
            <div className="space-y-3 pt-1">
              <span
                className="text-xs font-mono font-bold tracking-wider uppercase block"
                style={{ color: isDark ? "#9ea9a2" : "#637167" }}
              >
                DELIVERY CHANNELS & MOBILE DISPATCH
              </span>

              {/* Mobile & Desktop Push Notification Toggle */}
              <div
                className="flex items-center justify-between p-3.5 rounded-xl border"
                style={{
                  backgroundColor: isDark ? "#18221c" : "#f4f1e8",
                  borderColor: isDark ? "#28342d" : "#dedcd0",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 shrink-0">
                    <Smartphone size={17} />
                    <Laptop size={16} />
                  </div>
                  <div>
                    <strong className="text-xs sm:text-sm font-semibold block">
                      Device Push Notifications (Mobile & Desktop)
                    </strong>
                    <span className="text-[11px]" style={{ color: isDark ? "#9ea9a2" : "#637167" }}>
                      {permissionState === "granted"
                        ? "Active · Receives instant mobile & desktop alerts"
                        : permissionState === "denied"
                        ? "Permission denied in browser site settings"
                        : "Click to enable web push notifications"}
                    </span>
                  </div>
                </div>

                {permissionState === "granted" ? (
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.browserNotifications}
                      disabled={!config.enabled}
                      onChange={(e) => onUpdateConfig({ browserNotifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-neutral-300 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                ) : (
                  <button
                    type="button"
                    onClick={onRequestPermission}
                    className="px-3 py-1 rounded text-xs font-mono font-medium bg-emerald-700 hover:bg-emerald-800 text-white transition-colors cursor-pointer"
                  >
                    Enable
                  </button>
                )}
              </div>

              {/* Mobile Haptic Device Vibration */}
              <div
                className="flex items-center justify-between p-3.5 rounded-xl border"
                style={{
                  backgroundColor: isDark ? "#18221c" : "#f4f1e8",
                  borderColor: isDark ? "#28342d" : "#dedcd0",
                }}
              >
                <div className="flex items-center gap-3">
                  <Vibrate size={17} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <div>
                    <strong className="text-xs sm:text-sm font-semibold block">
                      Mobile Haptic Vibration
                    </strong>
                    <span className="text-[11px]" style={{ color: isDark ? "#9ea9a2" : "#637167" }}>
                      Pulses the mobile vibration motor when threshold is breached.
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.vibrationEnabled}
                    disabled={!config.enabled}
                    onChange={(e) => onUpdateConfig({ vibrationEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-300 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Acoustic Sound Chime */}
              <div
                className="flex items-center justify-between p-3.5 rounded-xl border"
                style={{
                  backgroundColor: isDark ? "#18221c" : "#f4f1e8",
                  borderColor: isDark ? "#28342d" : "#dedcd0",
                }}
              >
                <div className="flex items-center gap-3">
                  {config.soundEnabled ? (
                    <Volume2 size={17} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <VolumeX size={17} className="text-neutral-400 shrink-0" />
                  )}
                  <div>
                    <strong className="text-xs sm:text-sm font-semibold block">
                      Subtle Acoustic Alert Chime
                    </strong>
                    <span className="text-[11px]" style={{ color: isDark ? "#9ea9a2" : "#637167" }}>
                      Synthesized harmonic double-tone ping via Web Audio API.
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.soundEnabled}
                    disabled={!config.enabled}
                    onChange={(e) => onUpdateConfig({ soundEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-300 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Alert Fatigue Cooldown */}
              <div
                className="flex items-center justify-between p-3.5 rounded-xl border"
                style={{
                  backgroundColor: isDark ? "#18221c" : "#f4f1e8",
                  borderColor: isDark ? "#28342d" : "#dedcd0",
                }}
              >
                <div className="flex items-center gap-3">
                  <Clock size={17} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <div>
                    <strong className="text-xs sm:text-sm font-semibold block">
                      Notification Cooldown
                    </strong>
                    <span className="text-[11px]" style={{ color: isDark ? "#9ea9a2" : "#637167" }}>
                      Dampens duplicate alerts while air remains continuously elevated.
                    </span>
                  </div>
                </div>

                <select
                  value={config.cooldownHours}
                  disabled={!config.enabled}
                  onChange={(e) => onUpdateConfig({ cooldownHours: Number(e.target.value) })}
                  className="px-2.5 py-1 text-xs font-mono rounded border outline-none cursor-pointer"
                  style={{
                    backgroundColor: isDark ? "#121915" : "#fcfbf7",
                    borderColor: isDark ? "#2a362f" : "#dedcd2",
                    color: isDark ? "#eff4f0" : "#1a231e",
                  }}
                >
                  <option value={1}>Every 1 hour</option>
                  <option value={3}>Every 3 hours</option>
                  <option value={6}>Every 6 hours</option>
                  <option value={24}>Once daily</option>
                </select>
              </div>

              {/* Mobile Tip Card */}
              <div
                className="p-3 rounded-lg border text-[11px] flex items-start gap-2.5 leading-relaxed"
                style={{
                  backgroundColor: isDark ? "rgba(131, 223, 189, 0.05)" : "rgba(33, 129, 94, 0.06)",
                  borderColor: isDark ? "rgba(131, 223, 189, 0.16)" : "rgba(33, 129, 94, 0.18)",
                  color: isDark ? "#a2b3aa" : "#4b5c51",
                }}
              >
                <Info size={15} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  <strong>Mobile Web Tip:</strong> On Android Chrome/Edge, push alerts work directly. On iOS Safari, tap <strong>Share</strong> → <strong>Add to Home Screen</strong> to receive system-level background push notifications.
                </span>
              </div>
            </div>

            {/* Target Monitored Airshed */}
            <div
              className="p-3.5 rounded-xl border text-xs flex items-center justify-between"
              style={{
                backgroundColor: isDark ? "rgba(131, 223, 189, 0.08)" : "rgba(33, 129, 94, 0.07)",
                borderColor: isDark ? "rgba(131, 223, 189, 0.22)" : "rgba(33, 129, 94, 0.2)",
              }}
            >
              <span className="flex items-center gap-2">
                <Radio size={14} className="text-emerald-600 dark:text-emerald-400 animate-pulse" />
                <span>Monitored Airshed: <strong>{currentCityName || "Current Detected Location"}</strong></span>
              </span>
              <span
                className="font-mono text-[11px] font-bold"
                style={{ color: isDark ? "#83dfbd" : "#0f382c" }}
              >
                ACTIVE
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div
            className="mt-6 pt-4 border-t flex items-center justify-between gap-3"
            style={{ borderColor: isDark ? "#2a362f" : "#dedcd2" }}
          >
            <button
              type="button"
              onClick={handleTestClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-mono font-medium border transition-all cursor-pointer hover:opacity-90 active:scale-95"
              style={{
                backgroundColor: isDark ? "#18221c" : "#f4f1e8",
                borderColor: isDark ? "#28342d" : "#dedcd0",
                color: isDark ? "#eff4f0" : "#1a231e",
              }}
            >
              {testSent ? <Check size={14} className="text-emerald-600" /> : <Sparkles size={14} className="text-amber-600" />}
              <span>{testSent ? "Test Alert Fired!" : "Send Test Alert"}</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors cursor-pointer active:scale-95 shadow-sm"
            >
              Done & Save
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
