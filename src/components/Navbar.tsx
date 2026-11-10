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
  const isDark = theme === "dark";

  // 2. Render Public Marketing Navbar (When isPublicRoute is TRUE)
  if (isPublicRoute) {
    return (
      <header
        className="public-navbar-wrapper w-full border-b transition-colors duration-200 relative z-30"
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
              <strong className="text-[17px] sm:text-[18px] font-bold tracking-[0.09em]" style={{ color: isDark ? "#f2f7f4" : "#111111" }}>
                VAYU <em style={{ color: isDark ? "#83dfbd" : "#0f382c", fontStyle: "normal" }}>INDEX</em>
              </strong>
              <small className="font-mono text-[9px] tracking-[0.14em]" style={{ color: isDark ? "#8fa398" : "#777f76" }}>
                GLOBAL AIR INTELLIGENCE
              </small>
            </span>
          </a>

          {/* Links and CTA on Right */}
          <div className="flex items-center gap-6 sm:gap-10">
            <nav className="flex items-center gap-6 sm:gap-8" aria-label="Main navigation">
              <a
                className="relative py-2 text-[14px] sm:text-[15px] font-medium no-underline transition-colors"
                style={{
                  color: currentPath === "/"
                    ? (isDark ? "#83dfbd" : "#0f382c")
                    : (isDark ? "#a4b6ad" : "#5a655c"),
                  fontWeight: currentPath === "/" ? 600 : 500,
                }}
                aria-current={currentPath === "/" ? "page" : undefined}
                href="/"
              >
                Home
                {currentPath === "/" && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-[2px]"
                    style={{ backgroundColor: isDark ? "#83dfbd" : "#0f382c" }}
                  />
                )}
              </a>
              <a
                className="relative py-2 text-[14px] sm:text-[15px] font-medium no-underline transition-colors"
                style={{
                  color: currentPath === "/about"
                    ? (isDark ? "#83dfbd" : "#0f382c")
                    : (isDark ? "#a4b6ad" : "#5a655c"),
                  fontWeight: currentPath === "/about" ? 600 : 500,
                }}
                aria-current={currentPath === "/about" ? "page" : undefined}
                href="/about"
              >
                About
                {currentPath === "/about" && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-[2px]"
                    style={{ backgroundColor: isDark ? "#83dfbd" : "#0f382c" }}
                  />
                )}
              </a>
            </nav>

            <div className="editorial-nav-actions flex items-center gap-3 sm:gap-4">
              <a
                className="nav-explore inline-flex items-center gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded text-[13px] font-semibold no-underline transition-all hover:-translate-y-0.5"
                style={{
                  backgroundColor: isDark ? "rgba(22, 38, 32, 0.85)" : "rgba(250, 250, 250, 0.75)",
                  color: isDark ? "#83dfbd" : "#0f382c",
                  border: isDark ? "1px solid rgba(147, 226, 197, 0.32)" : "1px solid rgba(15, 56, 44, 0.26)",
                }}
                href="/dashboard"
              >
                Explore the air <ArrowRight size={15} />
              </a>

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
            </div>
          </div>
        </div>
      </header>
    );
  }

  // 3. Render App Workspace Navbar (When isPublicRoute is FALSE: /dashboard, /compare, /risk, etc.)
  return (
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
        <a className="brand flex items-center gap-3 text-inherit no-underline min-w-[180px] sm:min-w-[220px]" href="/" aria-label="Vayu Index home">
          <span
            className="brand-mark h-[35px] w-[35px] rounded-[11px] flex items-center justify-center gap-[3px] -rotate-6 transition-transform"
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
          <span className="brand-copy flex flex-col gap-0.5">
            <strong className="text-[15px] font-extrabold tracking-[0.11em]" style={{ color: isDark ? "#eff4ef" : "#242720" }}>
              VAYU<span style={{ color: isDark ? "#83dfbd" : "#21815e", marginLeft: 3 }}>INDEX</span>
            </strong>
            <small className="font-mono text-[8px] tracking-[0.13em]" style={{ color: isDark ? "#8fa398" : "#7a8982" }}>
              GLOBAL AIR INTELLIGENCE
            </small>
          </span>
        </a>

        {/* Navigation Tabs Center */}
        <nav className="main-nav h-full flex items-center gap-3 sm:gap-6 lg:gap-8" aria-label="Main navigation">
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
                className="nav-link relative h-full flex items-center text-[11.5px] sm:text-[12px] font-medium no-underline transition-colors px-1"
                style={{
                  color: isActive
                    ? (isDark ? "#eff4ef" : "#172620")
                    : (isDark ? "#8d9d9c" : "#666b60"),
                }}
                aria-current={isActive ? "page" : undefined}
                href={item.href}
              >
                {item.label}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-[2px]"
                    style={{
                      backgroundColor: isDark ? "#83dfbd" : "#23835f",
                      boxShadow: isDark ? "0 0 10px rgba(131, 223, 189, 0.4)" : "0 0 8px rgba(35, 131, 95, 0.25)",
                    }}
                  />
                )}
              </a>
            );
          })}
        </nav>

        {/* Right Accessories: ● STATION DATA green live indicator badge & Theme Toggle */}
        <div className="top-actions flex items-center gap-3 sm:gap-4 min-w-[160px] sm:min-w-[200px] justify-end">
          <span
            className="dashboard-status flex items-center gap-2 font-mono text-[9px] tracking-[0.09em] whitespace-nowrap"
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
        </div>
      </div>
    </header>
  );
}

export default Navbar;
