"use client";

import { useEffect, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

let currentTheme: Theme = "dark";
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function getSnapshot(): Theme {
  return currentTheme;
}

function getServerSnapshot(): Theme {
  return "dark";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function updateTheme(next: Theme) {
  if (currentTheme !== next) {
    currentTheme = next;
    emitChange();
  }
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("vayu-theme", next);
    } catch {}
    document.documentElement.setAttribute("data-theme", next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    window.dispatchEvent(new CustomEvent("vayu-theme-change", { detail: next }));
  }
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    // 1. Sync on mount from DOM attribute or localStorage
    const docTheme = typeof document !== "undefined"
      ? (document.documentElement.getAttribute("data-theme") as Theme | null)
      : null;
    let saved: Theme | null = null;
    try {
      saved = localStorage.getItem("vayu-theme") as Theme | null;
    } catch {}

    const resolved: Theme = docTheme === "light" || docTheme === "dark"
      ? docTheme
      : (saved === "light" || saved === "dark" ? saved : "dark");

    if (resolved !== currentTheme) {
      currentTheme = resolved;
      emitChange();
    }
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", resolved);
      if (resolved === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }

    // 2. Cross-tab storage synchronization
    const onStorage = (e: StorageEvent) => {
      if (e.key === "vayu-theme" && (e.newValue === "light" || e.newValue === "dark")) {
        if (currentTheme !== e.newValue) {
          currentTheme = e.newValue;
          if (typeof document !== "undefined") {
            document.documentElement.setAttribute("data-theme", e.newValue);
            if (e.newValue === "dark") {
              document.documentElement.classList.add("dark");
            } else {
              document.documentElement.classList.remove("dark");
            }
          }
          emitChange();
        }
      }
    };
    window.addEventListener("storage", onStorage);

    // 3. Custom in-app event synchronization
    const onThemeChange = (e: Event) => {
      const custom = e as CustomEvent<Theme>;
      if (custom.detail && (custom.detail === "light" || custom.detail === "dark")) {
        if (currentTheme !== custom.detail) {
          currentTheme = custom.detail;
          emitChange();
        }
      }
    };
    window.addEventListener("vayu-theme-change", onThemeChange);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("vayu-theme-change", onThemeChange);
    };
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    updateTheme(next);
  };

  const setTheme = (next: Theme) => {
    updateTheme(next);
  };

  return { theme, toggleTheme, setTheme };
}
