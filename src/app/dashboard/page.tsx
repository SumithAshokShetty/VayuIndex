import { Dashboard } from "@/components/dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Air Quality Dashboard | Vayu Index",
  description: "Explore current air quality, pollutant telemetry, source provenance, and regional context.",
};

export default function DashboardPage() {
  return <Dashboard />;
}
