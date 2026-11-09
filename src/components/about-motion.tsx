"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Adds quiet, once-per-section scroll reveals without changing route behavior. */
export function AboutMotion() {
  useEffect(() => {
    const context = gsap.context(() => {
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const groups = [
          { selector: ".about-principles article", trigger: ".about-principles" },
          { selector: ".provider-card", trigger: ".about-sources" },
          { selector: ".about-note", trigger: ".about-note" },
          { selector: ".about-terms", trigger: ".about-terms" },
          { selector: ".about-next", trigger: ".about-next" },
        ];

        for (const group of groups) {
          const targets = gsap.utils.toArray<HTMLElement>(group.selector);
          if (!targets.length) continue;
          gsap.from(targets, {
            autoAlpha: 0,
            y: 24,
            duration: 0.72,
            stagger: 0.09,
            ease: "power2.out",
            scrollTrigger: { trigger: group.trigger, start: "top 84%", once: true },
          });
        }
      });
    });
    return () => context.revert();
  }, []);

  return null;
}
