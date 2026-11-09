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
        <main className="dashboard-page"><LocationComparison/><footer className="dashboard-footer"><span>VAYU INDEX · LOCATION COMPARISON</span><span>MODEL ESTIMATES AND STATION MEASUREMENTS ARE IDENTIFIED BY SOURCE</span></footer></main>
      </div>
    </div>
  );
}
