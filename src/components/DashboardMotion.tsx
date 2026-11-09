"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Quiet, one-time editorial reveals for dashboard sections. */
export function DashboardMotion() {
  useEffect(() => {
    const context = gsap.context(() => {
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const sections = gsap.utils.toArray<HTMLElement>(".dashboard-split > *, .aqi-scale-reference");
        sections.forEach((section, index) => {
          gsap.fromTo(section, { autoAlpha: 0, y: 16 }, {
            autoAlpha: 1,
            y: 0,
            duration: 0.72,
            delay: index === 0 ? 0 : 0.06,
            ease: "power2.out",
            scrollTrigger: { trigger: section, start: "top 91%", once: true },
          });
        });
      });
    });
    return () => context.revert();
  }, []);

  return null;
}
