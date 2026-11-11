import type { Metadata } from "next";
import { HealthFindingsView } from "@/components/HealthFindingsView";

export const metadata: Metadata = {
  title: "Health & Safety Findings Journal | Vayu Index",
  description:
    "An editorial health and safety journal on airborne particulate exposure (PM2.5 vs PM10), sensitive groups, and protective interventions under CPCB NAQI standards.",
};

export default function HealthPage() {
  return <HealthFindingsView />;
}
