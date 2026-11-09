import type { Metadata } from "next";
import { LandingEditorial } from "@/components/LandingEditorial";

export const metadata: Metadata = {
  title: "Vayu Index — Understand the Air Around You",
  description: "Real-time air quality intelligence, personal exposure context, and atmospheric forecasts for the places you care about.",
};

export default function HomePage() {
  return <LandingEditorial/>;
}
