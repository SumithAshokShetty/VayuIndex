"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

export type SmartAlertConfig = {
  enabled: boolean;
  threshold: number; // e.g. 150, 200, 300
  metric: "aqi" | "pm2_5";
  browserNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean; // Mobile haptic vibration feedback
  cooldownHours: number; // 1, 3, 6, 24
  lastNotifiedAt?: number;
  lastNotifiedAqi?: number;
  monitoredCity?: string; // "Auto (Current Location)" or specific
};

export type ActiveAlert = {
  id: string;
  city: string;
  aqi: number;
  pm2_5?: number;
  threshold: number;
  timestamp: number;
  advice: string;
  severity: "moderate" | "poor" | "very_poor" | "hazardous";
};

const STORAGE_KEY = "vayu-smart-alerts-config";

export const DEFAULT_ALERT_CONFIG: SmartAlertConfig = {
  enabled: true,
  threshold: 200,
  metric: "aqi",
  browserNotifications: false,
  soundEnabled: true,
  vibrationEnabled: true,
  cooldownHours: 3,
  monitoredCity: "Auto (Current Location)",
};

function getSeverityAndAdvice(aqi: number, threshold: number): {
  severity: ActiveAlert["severity"];
  advice: string;
} {
  if (aqi >= 400) {
    return {
      severity: "hazardous",
      advice: "Emergency toxicity. Remain indoors, seal windows, and run continuous HEPA H13 air filtration.",
    };
  }
  if (aqi >= 300) {
    return {
      severity: "very_poor",
      advice: "Serious respiratory stress. Vulnerable individuals must avoid outdoor exertion. Wear an airtight N95 mask.",
    };
  }
  if (aqi >= 200) {
    return {
      severity: "poor",
      advice: "Breathing discomfort likely upon prolonged exposure. Move vigorous cardio workouts indoors.",
    };
  }
  return {
    severity: "moderate",
    advice: "AQI crossed your sensitivity threshold. Sensitive individuals should reduce intense outdoor workouts.",
  };
}

export function playSoftAlertChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(520, now);
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(680, now + 0.12);
    gain2.gain.setValueAtTime(0.08, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.48);
  } catch {}
}

export function triggerMobileHapticVibration() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      // Distinct double buzz pattern: 250ms buzz, 100ms pause, 250ms buzz
      navigator.vibrate([250, 100, 250]);
    } catch {}
  }
}

export async function sendBrowserNotification(title: string, body: string): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;

  if (Notification.permission === "granted") {
    try {
      // Check if service worker is active for mobile web push
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, {
          body,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: "vayu-aqi-alert",
          // @ts-expect-error vibrate is standard in PushNotification options
          vibrate: [250, 100, 250],
        });
        return true;
      }

      new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: "vayu-aqi-alert",
      });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

// -------------------------------------------------------------
// Shared Module Store (React useSyncExternalStore compliant)
// -------------------------------------------------------------
interface SmartAlertsStoreState {
  config: SmartAlertConfig;
  activeAlert: ActiveAlert | null;
  modalOpen: boolean;
  permissionState: NotificationPermission;
}

let storeState: SmartAlertsStoreState = {
  config: DEFAULT_ALERT_CONFIG,
  activeAlert: null,
  modalOpen: false,
  permissionState: "default",
};

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function initBrowserState() {
  if (typeof window === "undefined") return;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed.threshold === "number") {
        storeState = {
          ...storeState,
          config: { ...DEFAULT_ALERT_CONFIG, ...parsed },
        };
      }
    }
  } catch {}

  if ("Notification" in window) {
    storeState = {
      ...storeState,
      permissionState: Notification.permission,
    };
  }
}

// Execute initial load if running in browser
if (typeof window !== "undefined") {
  initBrowserState();
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        storeState = {
          ...storeState,
          config: { ...DEFAULT_ALERT_CONFIG, ...parsed },
        };
        emitChange();
      } catch {}
    }
  });
}

function getSnapshot(): SmartAlertsStoreState {
  return storeState;
}

function getServerSnapshot(): SmartAlertsStoreState {
  return {
    config: DEFAULT_ALERT_CONFIG,
    activeAlert: null,
    modalOpen: false,
    permissionState: "default",
  };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setAlertsModalOpen(open: boolean) {
  if (storeState.modalOpen !== open) {
    storeState = { ...storeState, modalOpen: open };
    emitChange();
  }
}

export function updateAlertsConfig(updates: Partial<SmartAlertConfig>) {
  const nextConfig = { ...storeState.config, ...updates };
  storeState = { ...storeState, config: nextConfig };
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextConfig));
    }
  } catch {}
  emitChange();
}

export function dismissActiveAlert() {
  if (storeState.activeAlert !== null) {
    storeState = { ...storeState, activeAlert: null };
    emitChange();
  }
}

export function triggerTestAlertNotification() {
  const currentConfig = storeState.config;
  const testCity =
    currentConfig.monitoredCity === "Auto (Current Location)"
      ? "Your Airshed"
      : currentConfig.monitoredCity || "Your Airshed";
  const testAqi = Math.max(currentConfig.threshold + 35, 235);
  const { severity, advice } = getSeverityAndAdvice(testAqi, currentConfig.threshold);

  const testPayload: ActiveAlert = {
    id: `test-${Date.now()}`,
    city: testCity,
    aqi: testAqi,
    pm2_5: 114.5,
    threshold: currentConfig.threshold,
    timestamp: Date.now(),
    advice,
    severity,
  };

  storeState = { ...storeState, activeAlert: testPayload };
  emitChange();

  if (currentConfig.soundEnabled) {
    playSoftAlertChime();
  }

  if (currentConfig.vibrationEnabled) {
    triggerMobileHapticVibration();
  }

  if (currentConfig.browserNotifications && storeState.permissionState === "granted") {
    sendBrowserNotification(
      `Vayu Alert: ${testCity} AQI crossed ${currentConfig.threshold}`,
      `Test notification: Measured ${testAqi} AQI. ${advice}`
    );
  }
}

export async function requestBrowserPushPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  try {
    const res = await Notification.requestPermission();
    storeState = { ...storeState, permissionState: res };
    if (res === "granted") {
      updateAlertsConfig({ browserNotifications: true });
    } else {
      updateAlertsConfig({ browserNotifications: false });
    }
    emitChange();
    return res;
  } catch {
    return "denied";
  }
}

export function evaluateTelemetryAlert(cityName: string, aqi: number, pm2_5?: number) {
  const currentConfig = storeState.config;
  if (!currentConfig.enabled) return;
  if (aqi < currentConfig.threshold) return;

  const now = Date.now();
  const cooldownMs = currentConfig.cooldownHours * 3600 * 1000;

  if (currentConfig.lastNotifiedAt && now - currentConfig.lastNotifiedAt < cooldownMs) {
    // Cooldown active
    return;
  }

  const { severity, advice } = getSeverityAndAdvice(aqi, currentConfig.threshold);

  const alertPayload: ActiveAlert = {
    id: `${cityName}-${now}`,
    city: cityName,
    aqi: Math.round(aqi),
    pm2_5: typeof pm2_5 === "number" ? Math.round(pm2_5 * 10) / 10 : undefined,
    threshold: currentConfig.threshold,
    timestamp: now,
    advice,
    severity,
  };

  storeState = { ...storeState, activeAlert: alertPayload };
  updateAlertsConfig({ lastNotifiedAt: now, lastNotifiedAqi: aqi });
  emitChange();

  if (currentConfig.soundEnabled) {
    playSoftAlertChime();
  }

  if (currentConfig.vibrationEnabled) {
    triggerMobileHapticVibration();
  }

  if (currentConfig.browserNotifications && storeState.permissionState === "granted") {
    sendBrowserNotification(
      `Vayu Alert: ${cityName} AQI reached ${Math.round(aqi)}`,
      `Air quality crossed your ${currentConfig.threshold} AQI threshold. ${advice}`
    );
  }
}

// React Hook wrapper
export function useSmartAlerts() {
  const store = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setModalOpen = useCallback((open: boolean) => {
    setAlertsModalOpen(open);
  }, []);

  const updateConfig = useCallback((updates: Partial<SmartAlertConfig>) => {
    updateAlertsConfig(updates);
  }, []);

  const dismissAlert = useCallback(() => {
    dismissActiveAlert();
  }, []);

  const triggerTestAlert = useCallback(() => {
    triggerTestAlertNotification();
  }, []);

  const checkTelemetry = useCallback((cityName: string, aqi: number, pm2_5?: number) => {
    evaluateTelemetryAlert(cityName, aqi, pm2_5);
  }, []);

  const requestBrowserPermission = useCallback(async () => {
    return requestBrowserPushPermission();
  }, []);

  return {
    config: store.config,
    activeAlert: store.activeAlert,
    modalOpen: store.modalOpen,
    setModalOpen,
    updateConfig,
    dismissAlert,
    triggerTestAlert,
    checkTelemetry,
    permissionState: store.permissionState,
    requestBrowserPermission,
  };
}
