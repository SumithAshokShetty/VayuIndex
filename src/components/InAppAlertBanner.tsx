"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, BellRing, ShieldAlert, X } from "lucide-react";
import { useTheme } from "@/lib/use-theme";
import type { ActiveAlert } from "@/lib/use-smart-alerts";

export function InAppAlertBanner({
  alert,
  onDismiss,
}: {
  alert: ActiveAlert | null;
  onDismiss: () => void;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <AnimatePresence>
      {alert && (
        <motion.div
          key={alert.id}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          data-theme={theme}
          className="fixed top-20 right-4 sm:right-6 z-[100] max-w-md w-full shadow-2xl rounded-2xl border p-4 sm:p-5"
          style={{
            backgroundColor: isDark ? "#121915" : "#fcfbf7",
            borderColor: isDark ? "#2a362f" : "#dedcd2",
            color: isDark ? "#eff4f0" : "#1a231e",
            boxShadow: isDark
              ? "0 20px 45px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(131, 223, 189, 0.15)"
              : "0 20px 45px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(15, 56, 44, 0.1)",
          }}
          role="alert"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: alert.severity === "hazardous" ? "rgba(220, 38, 38, 0.15)" : "rgba(217, 119, 6, 0.15)",
                  color: alert.severity === "hazardous" ? "#dc2626" : "#d97706",
                }}
              >
                <BellRing size={16} className="animate-bounce" />
              </div>
              <div>
                <span
                  className="text-[10px] font-mono uppercase tracking-wider font-bold block"
                  style={{ color: isDark ? "#95a39a" : "#627066" }}
                >
                  SMART AQI THRESHOLD ALERT
                </span>
                <h4 className="text-sm sm:text-base font-bold leading-snug">
                  {alert.city}: AQI {alert.aqi}
                </h4>
              </div>
            </div>

            <button
              type="button"
              onClick={onDismiss}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer"
              style={{
                color: isDark ? "#95a39a" : "#627066",
                backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              }}
              aria-label="Dismiss alert"
            >
              <X size={15} />
            </button>
          </div>

          <div
            className="mt-3 pt-3 border-t text-xs sm:text-[13px] leading-relaxed"
            style={{ borderColor: isDark ? "#2a362f" : "#dedcd2" }}
          >
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-amber-700 dark:text-amber-400 mb-1">
              <AlertTriangle size={12} />
              <span>Crossed threshold of {alert.threshold} AQI</span>
            </div>
            <p className="m-0" style={{ color: isDark ? "#a2b1a8" : "#515e55" }}>
              {alert.advice}
            </p>
          </div>

          <div
            className="mt-3 pt-2.5 border-t flex items-center justify-between text-[11px] font-mono"
            style={{ borderColor: isDark ? "#2a362f" : "#dedcd2", color: isDark ? "#849289" : "#6f7c73" }}
          >
            <span>Live telemetry triggered</span>
            <button
              type="button"
              onClick={onDismiss}
              className="font-bold underline cursor-pointer hover:opacity-80"
              style={{ color: isDark ? "#83dfbd" : "#0f382c" }}
            >
              Acknowledge & Close
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
