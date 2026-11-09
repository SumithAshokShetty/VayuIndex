"use client";

import { ArrowRight, Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/use-theme";

export function EditorialNav({ current }: { current: "home" | "about" }) {
  const { theme, toggleTheme } = useTheme();

  return <header className="editorial-nav">
    <a className="editorial-brand" href="/" aria-label="Vayu Index home">
      <span className="brand-mark" aria-hidden="true"><i/><i/><i/></span>
      <span><strong>VAYU <em>INDEX</em></strong><small>GLOBAL AIR INTELLIGENCE</small></span>
    </a>
    <nav aria-label="Main navigation">
      <a className={current === "home" ? "current" : undefined} aria-current={current === "home" ? "page" : undefined} href="/">Home</a>
      <a className={current === "about" ? "current" : undefined} aria-current={current === "about" ? "page" : undefined} href="/about">About</a>
    </nav>
    <div className="editorial-nav-actions">
      <a className="nav-explore" href="/dashboard">Explore the air <ArrowRight size={15}/></a>
      <button className="icon-button theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`} title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>
        {theme === "light" ? <Moon size={16}/> : <Sun size={16}/>}
      </button>
    </div>
  </header>;
}

export default EditorialNav;
