import type { Metadata } from "next";
import { RiskWorkspace } from "@/components/RiskWorkspace";

export const metadata: Metadata = {
  title: "Personal Risk Engine | Vayu Index",
  description: "Explore a profile-weighted air exposure score using current air quality readings and transparent source context.",
};

export default function PersonalRiskPage() {
  return <RiskWorkspace/>;
}
