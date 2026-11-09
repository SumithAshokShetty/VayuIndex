import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { LocationComparison } from "@/components/LocationComparison";

export const metadata: Metadata = {
  title: "Compare Air Quality by Location | Vayu Index",
  description: "Compare compatible pollutant measurements across multiple places with clear source provenance.",
};

export default function ComparePage() {
  return (
    <div className="app-shell dashboard-app min-h-screen bg-dashboard-canvas text-dashboard-ink">
      <div className="dashboard-frame">
        <header className="topbar dashboard-topbar">
          <a className="brand" href="/" aria-label="Vayu Index home"><span className="brand-mark" aria-hidden="true"><i/><i/><i/></span><span className="brand-copy"><strong>VAYU<span>INDEX</span></strong><small>GLOBAL AIR INTELLIGENCE</small></span></a>
          <nav className="main-nav" aria-label="Main navigation"><a className="nav-link" href="/">Overview</a><a className="nav-link" href="/dashboard">Global view</a><a className="nav-link active" href="/compare">Compare</a><a className="nav-link" href="/about">About</a></nav>
          <a className="compare-dashboard-link" href="/dashboard">Dashboard <ArrowUpRight size={14}/></a>
        </header>
        <main className="dashboard-page"><LocationComparison/><footer className="dashboard-footer"><span>VAYU INDEX · LOCATION COMPARISON</span><span>MODEL ESTIMATES AND STATION MEASUREMENTS ARE IDENTIFIED BY SOURCE</span></footer></main>
      </div>
    </div>
  );
}
