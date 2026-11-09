import type { Metadata } from "next";
import { AboutView } from "@/components/AboutView";

export const metadata: Metadata = {
  title: "About Vayu Index | Ground Truth Atmospheric Intelligence",
  description: "Vayu Index brings together ground-truth station telemetry from CPCB, OpenAQ, WAQI, and Copernicus CAMS models with transparent provenance.",
};

export default function AboutPage() {
  return <AboutView />;
}
