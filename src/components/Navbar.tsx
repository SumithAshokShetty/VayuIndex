"use client";

import { usePathname } from "next/navigation";
import { ArrowRight, Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/use-theme";

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  // Normalize path to ignore trailing slashes
  const currentPath = pathname ? (pathname.replace(/\/$/, "") || "/") : "/";

  // 1. Route Detection Logic:
  // Public marketing routes: pathname === '/' || pathname === '/about'
  const isPublicRoute = currentPath === "/" || currentPath === "/about";

  // 2. Render Public Marketing Navbar (When isPublicRoute is TRUE)
  if (isPublicRoute) {
    const isDark = theme === "dark";
    return (
      <header
        className="public-navbar-wrapper w-full transition-colors duration-200 relative z-30"
        data-theme={theme}
        style={{
          backgroundColor: isDark ? "#0b1412" : "#f7f6f0",
          color: isDark ? "#f2f7f4" : "#111111",
          borderBottom: isDark ? "1px solid rgba(147, 226, 197, 0.16)" : "1px solid rgba(15, 56, 44, 0.15)",
        }}
      >
        <div className="editorial-nav" style={{ borderBottom: "none" }}>
          {/* Brand on Left: VAYU INDEX title + GLOBAL AIR INTELLIGENCE monospaced subtext */}
          <a className="editorial-brand" href="/" aria-label="Vayu Index home">
            <span className="brand-mark" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>
              <strong style={{ color: isDark ? "#f2f7f4" : "#111111" }}>
                VAYU <em style={{ color: isDark ? "#83dfbd" : "#0f382c", fontStyle: "normal" }}>INDEX</em>
              </strong>
              <small style={{ color: isDark ? "#8fa398" : "#777f76" }}>
                GLOBAL AIR INTELLIGENCE
              </small>
            </span>
          </a>

          {/* Links on Right: Home, About */}
          <nav aria-label="Main navigation">
            <a
              className={currentPath === "/" ? "current" : undefined}
              aria-current={currentPath === "/" ? "page" : undefined}
              href="/"
            >
              Home
            </a>
            <a
              className={currentPath === "/about" ? "current" : undefined}
              aria-current={currentPath === "/about" ? "page" : undefined}
              href="/about"
            >
              About
            </a>
          </nav>

          <div className="editorial-nav-actions">
            {/* Pill CTA Button: Explore the air → */}
            <a className="nav-explore" href="/dashboard">
              Explore the air <ArrowRight size={15} />
            </a>

            {/* Sun/Moon Theme Toggle icon */}
            <button
              className="icon-button theme-toggle"
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
              title={`Switch to ${isDark ? "light" : "dark"} mode`}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </header>
    );
  }

  // 3. Render App Workspace Navbar (When isPublicRoute is FALSE: /dashboard, /compare, /risk, etc.)
  const isDark = theme === "dark";
  return (
    <header
      className="app-workspace-navbar-wrapper w-full border-b transition-colors duration-200 sticky top-0 z-50 h-[72px]"
      data-theme={theme}
      style={{
        height: "72px",
        minHeight: "72px",
        maxHeight: "72px",
        backgroundColor: isDark ? "#111614" : "rgba(247, 245, 238, 0.96)",
        borderColor: isDark ? "#343e38" : "#dedfd5",
        color: isDark ? "#eff4ef" : "#242720",
      }}
    >
      <div className="dashboard-frame h-full">
        <div className="topbar dashboard-topbar border-b-0 h-full flex items-center justify-between">
          {/* Brand on Left: VAYU INDEX title + GLOBAL AIR INTELLIGENCE monospaced subtext */}
          <a className="brand" href="/" aria-label="Vayu Index home">
            <span className="brand-mark" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="brand-copy">
              <strong>
                VAYU<span>INDEX</span>
              </strong>
              <small>GLOBAL AIR INTELLIGENCE</small>
            </span>
          </a>

          {/* Navigation Tabs Center */}
          <nav className="main-nav h-full" aria-label="Main navigation">
            <a
              className={`nav-link ${currentPath === "/" ? "active" : ""}`}
              aria-current={currentPath === "/" ? "page" : undefined}
              href="/"
            >
              Home
            </a>
            <a
              className={`nav-link ${currentPath === "/dashboard" ? "active" : ""}`}
              aria-current={currentPath === "/dashboard" ? "page" : undefined}
              href="/dashboard"
            >
              Global view
            </a>
            <a
              className={`nav-link ${currentPath === "/compare" ? "active" : ""}`}
              aria-current={currentPath === "/compare" ? "page" : undefined}
              href="/compare"
            >
              Compare
            </a>
            <a
              className={`nav-link ${currentPath === "/about" ? "active" : ""}`}
              aria-current={currentPath === "/about" ? "page" : undefined}
              href="/about"
            >
              About
            </a>
            <a
              className={`nav-link ${currentPath === "/risk" ? "active" : ""}`}
              aria-current={currentPath === "/risk" ? "page" : undefined}
              href="/risk"
            >
              Personal risk <span className="soon">NEXT</span>
            </a>
          </nav>

          {/* Right Accessories: ● STATION DATA green live indicator badge & Theme Toggle */}
          <div className="top-actions flex items-center gap-3">
            <span className="dashboard-status flex items-center gap-1.5 font-mono text-[9px] tracking-[0.09em]">
              <i />
              STATION DATA
            </span>
            <button
              className="icon-button theme-toggle"
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
              title={`Switch to ${isDark ? "light" : "dark"} mode`}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
