"use client";

import { usePathname } from "next/navigation";
import { ArrowRight, Bell, BellRing, Menu, Moon, Sun, X } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/lib/use-theme";
import { useSmartAlerts } from "@/lib/use-smart-alerts";
import { SmartAqiAlertsModal } from "@/components/SmartAqiAlertsModal";
import { InAppAlertBanner } from "@/components/InAppAlertBanner";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const {
    config,
    activeAlert,
    modalOpen,
    setModalOpen,
    updateConfig,
    dismissAlert,
    triggerTestAlert,
    permissionState,
    requestBrowserPermission,
  } = useSmartAlerts();

  // Normalize path to ignore trailing slashes
  const currentPath = pathname ? (pathname.replace(/\/$/, "") || "/") : "/";

  // 1. Route Detection Logic:
  // Public marketing routes: pathname === '/' || pathname === '/about'
  const isPublicRoute = currentPath === "/" || currentPath === "/about";
  const isDark = theme === "dark";

  // Common Alerts Trigger Button
  const renderAlertsButton = (marketing = false) => (
    <button
      className="icon-button smart-alerts-toggle relative w-[34px] h-[34px] rounded-full flex items-center justify-center border cursor-pointer transition-transform hover:-translate-y-0.5"
      style={{
        backgroundColor: marketing
          ? isDark ? "rgba(22, 38, 32, 0.85)" : "rgba(250, 250, 250, 0.75)"
          : isDark ? "rgba(22, 38, 32, 0.85)" : "#ffffff",
        color: config.enabled ? (isDark ? "#83dfbd" : "#0f382c") : (isDark ? "#88958e" : "#8a948c"),
        border: marketing
          ? isDark ? "1px solid rgba(147, 226, 197, 0.32)" : "1px solid rgba(15, 56, 44, 0.26)"
          : isDark ? "1px solid rgba(147, 226, 197, 0.22)" : "1px solid #dedfd5",
      }}
      type="button"
      onClick={() => setModalOpen(true)}
      aria-label="Smart AQI Alerts Settings"
      title={`Smart AQI Alerts: ${config.enabled ? `Active (Threshold: ${config.threshold} AQI)` : "Disabled"}`}
    >
      {activeAlert ? (
        <BellRing size={16} className="text-amber-500 animate-bounce" />
      ) : (
        <Bell size={16} />
      )}
      {config.enabled && (
        <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      )}
    </button>
  );

  // 2. Render Public Marketing Navbar (When isPublicRoute is TRUE)
  if (isPublicRoute) {
    return (
      <>
        <header
          className="public-navbar-wrapper w-full border-b transition-colors duration-200 sticky top-0 z-50"
          data-theme={theme}
          style={{
            backgroundColor: isDark ? "#0b1412" : "#f7f6f0",
            color: isDark ? "#f2f7f4" : "#111111",
            borderBottom: isDark ? "1px solid rgba(147, 226, 197, 0.16)" : "1px solid rgba(15, 56, 44, 0.15)",
            width: "100%",
            maxWidth: "100%",
            left: 0,
            right: 0,
            margin: 0,
            padding: 0,
          }}
        >
          <div className="w-full max-w-[1480px] mx-auto px-6 sm:px-10 h-[80px] sm:h-[88px] flex items-center justify-between">
            {/* Brand on Left: VAYU INDEX title + GLOBAL AIR INTELLIGENCE */}
            <a className="editorial-brand flex items-center gap-3 no-underline flex-none" href="/" aria-label="Vayu Index home">
              <span
                className="brand-mark h-[34px] w-[34px] rounded-[10px] flex items-center justify-center gap-[3px] -rotate-6 transition-transform"
                style={{
                  border: isDark ? "1px solid rgba(147, 226, 197, 0.36)" : "1px solid rgba(15, 56, 44, 0.2)",
                  background: isDark
                    ? "linear-gradient(145deg, rgba(147, 226, 197, 0.14), rgba(147, 226, 197, 0.02))"
                    : "linear-gradient(145deg, #e9f4ee, #f8fbf9)",
                }}
                aria-hidden="true"
              >
                <i style={{ width: 3, height: 10, borderRadius: 8, background: isDark ? "#83dfbd" : "#0f382c", opacity: 0.7 }} />
                <i style={{ width: 3, height: 18, borderRadius: 8, background: isDark ? "#83dfbd" : "#0f382c" }} />
                <i style={{ width: 3, height: 13, borderRadius: 8, background: isDark ? "#83dfbd" : "#0f382c", opacity: 0.85 }} />
              </span>
              <span className="flex flex-col gap-0.5">
                <strong className="text-base font-bold tracking-tight" style={{ color: isDark ? "#f2f7f4" : "#171717" }}>
                  VAYU <em style={{ color: isDark ? "#83dfbd" : "#0f382c", fontStyle: "normal" }}>INDEX</em>
                </strong>
                <small className="text-[10px] font-mono tracking-widest text-neutral-500">
                  GLOBAL AIR INTELLIGENCE
                </small>
              </span>
            </a>

            {/* Links and CTA on Right */}
            <div className="public-navbar-content flex items-center gap-2 sm:gap-6 min-w-0">
              <nav className="public-primary-nav hidden lg:flex items-center gap-7 lg:gap-8" aria-label="Main navigation">
                <a
                  className={`nav-link !h-auto relative py-1 text-[15px] transition-colors no-underline ${
                    currentPath === "/"
                      ? isDark
                        ? "font-semibold text-neutral-100"
                        : "font-semibold text-neutral-900"
                      : isDark
                      ? "font-medium text-neutral-400 hover:text-neutral-200"
                      : "font-medium text-neutral-600 hover:text-neutral-900"
                  }`}
                  style={{
                    color: currentPath === "/"
                      ? (isDark ? "#83dfbd" : "#0f382c")
                      : (isDark ? "#a4b6ad" : "#5a655c"),
                  }}
                  aria-current={currentPath === "/" ? "page" : undefined}
                  href="/"
                >
                  <span>Home</span>
                  {currentPath === "/" && (
                    <span
                      className="absolute -bottom-[6px] left-0 right-0 h-[2px] rounded-full"
                      style={{ backgroundColor: isDark ? "#83dfbd" : "#0f382c" }}
                    />
                  )}
                </a>
                <a
                  className={`nav-link !h-auto relative py-1 text-[15px] transition-colors no-underline ${
                    currentPath === "/about"
                      ? isDark
                        ? "font-semibold text-neutral-100"
                        : "font-semibold text-neutral-900"
                      : isDark
                      ? "font-medium text-neutral-400 hover:text-neutral-200"
                      : "font-medium text-neutral-600 hover:text-neutral-900"
                  }`}
                  style={{
                    color: currentPath === "/about"
                      ? (isDark ? "#83dfbd" : "#0f382c")
                      : (isDark ? "#a4b6ad" : "#5a655c"),
                  }}
                  aria-current={currentPath === "/about" ? "page" : undefined}
                  href="/about"
                >
                  <span>About</span>
                  {currentPath === "/about" && (
                    <span
                      className="absolute -bottom-[6px] left-0 right-0 h-[2px] rounded-full"
                      style={{ backgroundColor: isDark ? "#83dfbd" : "#0f382c" }}
                    />
                  )}
                </a>
              </nav>

              <div className="editorial-nav-actions flex items-center gap-2 sm:gap-4">
                <a
                  className="nav-explore hidden sm:inline-flex items-center gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded text-[13px] font-semibold no-underline transition-all hover:-translate-y-0.5"
                  style={{
                    backgroundColor: isDark ? "rgba(22, 38, 32, 0.85)" : "rgba(250, 250, 250, 0.75)",
                    color: isDark ? "#83dfbd" : "#0f382c",
                    border: isDark ? "1px solid rgba(147, 226, 197, 0.32)" : "1px solid rgba(15, 56, 44, 0.26)",
                  }}
                  href="/overview"
                >
                  Explore the air <ArrowRight size={15} />
                </a>

                {/* Smart Alerts Bell Trigger */}
                {renderAlertsButton(true)}

                {/* Theme Toggle */}
                <button
                  className="icon-button theme-toggle w-[34px] h-[34px] rounded-full flex items-center justify-center border cursor-pointer transition-transform hover:-translate-y-0.5"
                  style={{
                    backgroundColor: isDark ? "rgba(22, 38, 32, 0.85)" : "rgba(250, 250, 250, 0.75)",
                    color: isDark ? "#83dfbd" : "#0f382c",
                    border: isDark ? "1px solid rgba(147, 226, 197, 0.32)" : "1px solid rgba(15, 56, 44, 0.26)",
                  }}
                  type="button"
                  onClick={toggleTheme}
                  aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
                  title={`Switch to ${isDark ? "light" : "dark"} mode`}
                >
                  {isDark ? <Sun size={16} /> : <Moon size={16} />}
                </button>
                <button
                  className="mobile-nav-toggle flex lg:hidden items-center justify-center"
                  type="button"
                  onClick={() => setMobileMenuOpen((open) => !open)}
                  aria-expanded={mobileMenuOpen}
                  aria-controls="public-mobile-navigation"
                  aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                >
                  {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
                </button>
              </div>
            </div>
          </div>
          <nav id="public-mobile-navigation" className={`mobile-nav-panel ${mobileMenuOpen ? "is-open" : ""}`} aria-label="Mobile navigation" aria-hidden={!mobileMenuOpen}>
            {[
              { href: "/", label: "Home" },
              { href: "/overview", label: "Overview" },
              { href: "/dashboard", label: "Global view" },
              { href: "/compare", label: "Compare" },
              { href: "/health", label: "Health & Safety" },
              { href: "/risk", label: "Personal risk" },
              { href: "/about", label: "About" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                aria-current={currentPath === item.href ? "page" : undefined}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            {/* Smart AQI Alerts Sentinel Trigger Card inside Mobile Nav */}
            <div className="pt-2 mt-1 border-t border-black/10 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setModalOpen(true);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-emerald-600/30 bg-emerald-500/10 text-inherit text-left cursor-pointer transition-all hover:bg-emerald-500/15"
              >
                <span className="flex items-center gap-2">
                  <BellRing size={15} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="font-mono text-xs font-bold">Smart AQI Alerts</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                  {config.enabled ? "ACTIVE" : "CONFIGURE"}
                </span>
              </button>
            </div>
          </nav>
        </header>

        {/* Floating In-App Banner & Modal */}
        <InAppAlertBanner alert={activeAlert} onDismiss={dismissAlert} />
        <SmartAqiAlertsModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          config={config}
          onUpdateConfig={updateConfig}
          onTriggerTest={triggerTestAlert}
          permissionState={permissionState}
          onRequestPermission={requestBrowserPermission}
        />
      </>
    );
  }

  // 3. Render App Workspace Navbar (When isPublicRoute is FALSE: /dashboard, /compare, /risk, etc.)
  return (
    <>
      <header
        className="app-workspace-navbar-wrapper w-full border-b transition-colors duration-200 sticky top-0 z-50 h-[72px]"
        data-theme={theme}
        style={{
          height: "72px",
          minHeight: "72px",
          maxHeight: "72px",
          backgroundColor: isDark ? "#111614" : "#f3f0e7",
          borderColor: isDark ? "#343e38" : "#dedfd5",
          color: isDark ? "#eff4ef" : "#242720",
          width: "100%",
          maxWidth: "100%",
          left: 0,
          right: 0,
          margin: 0,
          padding: 0,
        }}
      >
        <div className="w-full max-w-[1780px] mx-auto px-4 sm:px-8 lg:px-12 h-full flex items-center justify-between">
          {/* Brand on Left: VAYU INDEX title + GLOBAL AIR INTELLIGENCE monospaced subtext */}
          <a className="brand flex items-center gap-2.5 sm:gap-3 text-inherit no-underline min-w-0 flex-shrink" href="/" aria-label="Vayu Index home">
            <span
              className="brand-mark h-[35px] w-[35px] rounded-[11px] flex items-center justify-center gap-[3px] -rotate-6 transition-transform flex-shrink-0"
              style={{
                border: isDark ? "1px solid rgba(147, 226, 197, 0.36)" : "1px solid #bcd7ca",
                background: isDark
                  ? "linear-gradient(145deg, rgba(147, 226, 197, 0.14), rgba(147, 226, 197, 0.02))"
                  : "linear-gradient(145deg, #e9f4ee, #f8fbf9)",
              }}
              aria-hidden="true"
            >
              <i style={{ width: 3, height: 10, borderRadius: 8, background: isDark ? "#83dfbd" : "#21815e", opacity: 0.7 }} />
              <i style={{ width: 3, height: 18, borderRadius: 8, background: isDark ? "#83dfbd" : "#21815e" }} />
              <i style={{ width: 3, height: 13, borderRadius: 8, background: isDark ? "#83dfbd" : "#21815e", opacity: 0.85 }} />
            </span>
            <span className="brand-copy flex flex-col gap-0.5 min-w-0">
              <strong className="text-base font-bold tracking-tight truncate" style={{ color: isDark ? "#eff4ef" : "#171717" }}>
                VAYU<span style={{ color: isDark ? "#83dfbd" : "#21815e", marginLeft: 3 }}>INDEX</span>
              </strong>
              <small className="text-[10px] font-mono tracking-widest text-neutral-500 truncate">
                GLOBAL AIR INTELLIGENCE
              </small>
            </span>
          </a>

          {/* Navigation Tabs Center */}
          <nav className="main-nav h-full hidden lg:flex items-center gap-7 lg:gap-8" aria-label="Main navigation">
            {[
              { href: "/", label: "Home" },
              { href: "/overview", label: "Overview" },
              { href: "/dashboard", label: "Global view" },
              { href: "/compare", label: "Compare" },
              { href: "/health", label: "Health & Safety" },
              { href: "/risk", label: "Personal risk" },
            ].map((item) => {
              const isActive = currentPath === item.href;
              return (
                <a
                  key={item.href}
                  className={`nav-link !h-auto relative py-1 text-[15px] no-underline transition-colors ${
                    isActive
                      ? isDark
                        ? "font-semibold text-neutral-100"
                        : "font-semibold text-neutral-900"
                      : isDark
                      ? "font-medium text-neutral-400 hover:text-neutral-200"
                      : "font-medium text-neutral-600 hover:text-neutral-900"
                  }`}
                  style={{
                    color: isActive
                      ? (isDark ? "#f3f4f6" : "#171717")
                      : (isDark ? "#9ca3af" : "#52525b"),
                  }}
                  aria-current={isActive ? "page" : undefined}
                  href={item.href}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span
                      className="absolute -bottom-[6px] left-0 right-0 h-[2px] rounded-full"
                      style={{
                        backgroundColor: isDark ? "#83dfbd" : "#23835f",
                        boxShadow: isDark
                          ? "0 0 8px rgba(131, 223, 189, 0.4)"
                          : "0 0 6px rgba(35, 131, 95, 0.25)",
                      }}
                    />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Right Accessories: ● STATION DATA green live indicator badge & Smart Alerts & Theme Toggle */}
          <div className="top-actions flex items-center gap-2 sm:gap-4 min-w-0 sm:min-w-[200px] justify-end flex-shrink-0">
            <span
              className="dashboard-status hidden md:flex items-center gap-2 font-mono text-[10px] sm:text-[11px] tracking-[0.09em] whitespace-nowrap"
              style={{ color: isDark ? "#adb8b0" : "#666b60" }}
            >
              <i
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: "#39a875",
                  boxShadow: "0 0 0 3px rgba(57, 168, 117, 0.2)",
                }}
              />
              STATION DATA
            </span>

            {/* Smart Alerts Bell Trigger */}
            {renderAlertsButton(false)}

            {/* Theme Toggle */}
            <button
              className="icon-button theme-toggle w-[34px] h-[34px] rounded-full flex items-center justify-center border cursor-pointer transition-transform hover:-translate-y-0.5"
              style={{
                borderColor: isDark ? "rgba(147, 226, 197, 0.22)" : "#dedfd5",
                color: isDark ? "#83dfbd" : "#2a6643",
                background: isDark ? "rgba(22, 38, 32, 0.85)" : "#ffffff",
              }}
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
              title={`Switch to ${isDark ? "light" : "dark"} mode`}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              className="mobile-nav-toggle flex lg:hidden items-center justify-center"
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-expanded={mobileMenuOpen}
              aria-controls="workspace-mobile-navigation"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
        <nav id="workspace-mobile-navigation" className={`mobile-nav-panel ${mobileMenuOpen ? "is-open" : ""}`} aria-label="Mobile navigation" aria-hidden={!mobileMenuOpen}>
          {[
            { href: "/", label: "Home" },
            { href: "/overview", label: "Overview" },
            { href: "/dashboard", label: "Global view" },
            { href: "/compare", label: "Compare" },
            { href: "/health", label: "Health & Safety" },
            { href: "/risk", label: "Personal risk" },
            { href: "/about", label: "About" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={currentPath === item.href ? "page" : undefined}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}

          {/* Smart AQI Alerts Sentinel Trigger Card inside Mobile Nav */}
          <div className="pt-2 mt-1 border-t border-black/10 dark:border-white/10">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setModalOpen(true);
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-lg border border-emerald-600/30 bg-emerald-500/10 text-inherit text-left cursor-pointer transition-all hover:bg-emerald-500/15"
            >
              <span className="flex items-center gap-2">
                <BellRing size={15} className="text-emerald-600 dark:text-emerald-400" />
                <span className="font-mono text-xs font-bold">Smart AQI Alerts</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                {config.enabled ? "ACTIVE" : "CONFIGURE"}
              </span>
            </button>
          </div>
        </nav>
      </header>

      {/* Floating In-App Banner & Modal */}
      <InAppAlertBanner alert={activeAlert} onDismiss={dismissAlert} />
      <SmartAqiAlertsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        config={config}
        onUpdateConfig={updateConfig}
        onTriggerTest={triggerTestAlert}
        permissionState={permissionState}
        onRequestPermission={requestBrowserPermission}
      />
    </>
  );
}

export default Navbar;
