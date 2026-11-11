"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowDown, ArrowRight, ArrowUpRight, Orbit, Wind } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export function LandingStory() {
  const scrollRef = useRef<HTMLElement | null>(null);
  const pinRef = useRef<HTMLDivElement | null>(null);
  const stepRef = useRef<HTMLSpanElement | null>(null);
  const progressRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const context = gsap.context(() => {
      const media = gsap.matchMedia();
      media.add("(min-width: 761px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.from(".story-copy-hero .story-line-inner", { yPercent: 112, duration: 1, stagger: 0.12, ease: "power3.out", delay: 0.12 });
        gsap.from(".story-copy-hero .story-kicker,.story-copy-hero>p,.story-copy-hero .story-primary,.story-copy-hero .story-secondary", { autoAlpha: 0, y: 16, duration: 0.65, stagger: 0.08, ease: "power2.out", delay: 0.38 });
        gsap.from(".story-nav", { y: -22, autoAlpha: 0, duration: 0.7, ease: "power2.out" });
        pinRef.current?.classList.add("story-live");
        const story = gsap.timeline({
          scrollTrigger: {
            trigger: scrollRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
          },
        });
        story
          .to(".story-copy-hero", { autoAlpha: 0, y: -28, duration: 0.8 })
          .to(".story-copy-global", { autoAlpha: 1, y: 0, duration: 0.8 }, 0.45)
          .fromTo(".story-copy-global .story-line-inner", { yPercent: 112 }, { yPercent: 0, duration: 0.78, stagger: 0.1, ease: "power3.out" }, 0.48)
          .to(".story-globe", { scale: 1.18, rotation: -8, duration: 1.2 }, 0.2)
          .to(".story-orbit", { rotation: 18, scale: 1.14, duration: 1.4 }, 0.1)
          .to(".story-haze", { opacity: 0.16, scale: 1.1, duration: 1.2 }, 0.2)
          .to(".story-copy-global", { autoAlpha: 0, y: -24, duration: 0.8 }, 1.55)
          .to(".story-copy-city", { autoAlpha: 1, y: 0, duration: 0.8 }, 1.8)
          .fromTo(".story-copy-city .story-line-inner", { yPercent: 112 }, { yPercent: 0, duration: 0.78, stagger: 0.1, ease: "power3.out" }, 1.82)
          .to(".story-globe", { scale: 1.55, rotation: 2, duration: 1.25 }, 1.55)
          .to(".story-city-pulse", { scale: 1.5, opacity: 0.9, duration: 0.7 }, 1.9)
          .to(".story-city-card", { autoAlpha: 1, y: 0, duration: 0.8 }, 2.05)
          .to(".story-scroll-cue", { autoAlpha: 0, duration: 0.35 }, 0.15);
        story.eventCallback("onUpdate", () => {
          if (!stepRef.current) return;
          const progress = story.progress();
          stepRef.current.textContent = progress < 0.34 ? "01" : progress < 0.68 ? "02" : "03";
          if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`;
        });
        return () => {
          story.scrollTrigger?.kill();
          pinRef.current?.classList.remove("story-live");
        };
      });
    }, scrollRef);
    return () => context.revert();
  }, []);

  return (
    <main className="story-page" id="top">
      <section className="story-scroll" ref={scrollRef} aria-label="Vayu Index introduction">
        <div className="story-pin" ref={pinRef}>
          <div className="story-grain" aria-hidden="true"/>
          <div className="story-progress" aria-hidden="true"><span ref={progressRef}/></div>
          <header className="story-nav">
            <a className="brand" href="/" aria-label="Vayu Index home">
              <span className="brand-mark" aria-hidden="true"><i/><i/><i/></span>
              <span className="brand-copy"><strong>VAYU<span>INDEX</span></strong><small>GLOBAL AIR INTELLIGENCE</small></span>
            </a>
            <nav aria-label="Main navigation"><a className="story-nav-link active" href="/">The atmosphere</a><a className="story-nav-link" href="/overview">Overview <ArrowUpRight size={13}/></a><a className="story-nav-link" href="/about">About</a><a className="story-nav-cta" href="/overview">Explore the air <ArrowRight size={14}/></a></nav>
          </header>

          <div className="story-sky" aria-hidden="true">
            <div className="story-haze haze-one"/><div className="story-haze haze-two"/>
            <div className="story-orbit orbit-a"/><div className="story-orbit orbit-b"/>
            <svg className="story-globe" viewBox="0 0 720 720" role="img" aria-label="Illustration of Earth under an atmospheric veil">
              <defs>
                <radialGradient id="story-ocean" cx="34%" cy="29%" r="75%"><stop offset="0" stopColor="#2b6860"/><stop offset=".48" stopColor="#163c3b"/><stop offset="1" stopColor="#07191c"/></radialGradient>
                <linearGradient id="story-rim" x1=".1" y1=".08" x2=".93" y2=".9"><stop stopColor="#d7ffe9" stopOpacity=".82"/><stop offset=".35" stopColor="#8be8c8" stopOpacity=".38"/><stop offset="1" stopColor="#76bbaf" stopOpacity=".04"/></linearGradient>
                <radialGradient id="story-atmosphere"><stop offset=".7" stopColor="#80dfc0" stopOpacity="0"/><stop offset="1" stopColor="#8be8c8" stopOpacity=".17"/></radialGradient>
                <clipPath id="story-clip"><circle cx="360" cy="360" r="303"/></clipPath>
                <filter id="story-blur"><feGaussianBlur stdDeviation="22"/></filter>
              </defs>
              <circle cx="360" cy="360" r="316" fill="#55d3ae" opacity=".065" filter="url(#story-blur)"/>
              <circle cx="360" cy="360" r="307" fill="url(#story-ocean)" stroke="url(#story-rim)" strokeWidth="2.4"/>
              <g clipPath="url(#story-clip)">
                <ellipse cx="360" cy="360" rx="120" ry="305" fill="none" stroke="#a4e6d4" strokeOpacity=".18"/>
                <ellipse cx="360" cy="360" rx="220" ry="305" fill="none" stroke="#a4e6d4" strokeOpacity=".11"/>
                <path d="M58 360h604M94 246h532M94 474h532M170 150h380M170 570h380" fill="none" stroke="#a4e6d4" strokeOpacity=".12"/>
                <path d="M100 218l25-34 46-23 32 11 22 25 40-1 28 22-22 24-37 11-7 31-30 21-7 40-27 27-1 47-21 21-16-29-1-38-20-24-13-38-26-29-1-33z M251 378l34 5 23 30-13 31 15 36-5 44-21 41-21 32-19-31-9-45-23-31 8-38-18-34z M374 211l35-25 53 8 19 20 51-5 35 22 47 10 28 29-22 24-40-8-18 27-37-6-23 24-34-9-18 25-27-15-9-39-29-17-20-34-34-13-14-23-33-8z M401 343l43-22 44 16 21 30-15 28-28 13-5 44-29 32-27-17-20-37-22-21 7-37z M539 496l32-17 38 11 9 22-27 18-39-6z" fill="#83aa88" fillOpacity=".67" stroke="#c3e2bd" strokeOpacity=".17" strokeWidth="1.5"/>
                <ellipse cx="505" cy="303" rx="113" ry="77" fill="#e99d67" opacity=".13" filter="url(#story-blur)"/>
                <ellipse cx="230" cy="380" rx="112" ry="100" fill="#82dcb5" opacity=".11" filter="url(#story-blur)"/>
                <circle cx="360" cy="360" r="306" fill="url(#story-atmosphere)"/>
                <g className="story-city-pulse"><circle cx="448" cy="275" r="19" fill="#ffc18b" fillOpacity=".15" stroke="#ffc18b" strokeOpacity=".75"/><circle cx="448" cy="275" r="4" fill="#ffe0bb"/></g>
              </g>
            </svg>
            <div className="story-star star-one"/><div className="story-star star-two"/><div className="story-star star-three"/>
            <div className="story-planet-label">EARTH <span>·</span> ONE SHARED ATMOSPHERE</div>
            <div className="story-city-card"><span className="story-live-dot"/><div><small>MODEL-BASED CITY VIEW</small><b>Explore air near you <strong>→</strong></b></div><ArrowUpRight size={15}/></div>
          </div>

          <div className="story-copy story-copy-hero">
            <span className="story-kicker"><span/> THE AIR AROUND US, MADE CLEAR</span>
            <h1><span className="story-headline-line"><span className="story-line-inner">Tomorrow</span></span><span className="story-headline-line"><span className="story-line-inner">begins <em>in the air.</em></span></span></h1>
            <p>Understand our atmosphere. See how air changes from one place to another. Find a clearer next step.</p>
            <a className="story-primary" href="/dashboard">Descend into the world <ArrowDown size={15}/></a>
            <a className="story-secondary" href="#our-atmosphere">Discover the journey <ArrowDown size={13}/></a>
          </div>

          <div className="story-copy story-copy-global">
            <span className="story-kicker"><span/> A PLANET IN MOTION</span>
            <h2><span className="story-headline-line"><span className="story-line-inner">One atmosphere.</span></span><span className="story-headline-line"><span className="story-line-inner"><em>Countless signals.</em></span></span></h2>
            <p>Pollutants, weather, and local conditions shape the air we share. Vayu brings the wider picture into focus.</p>
            <div className="story-metrics"><div><b>01</b><span>GLOBAL VIEW</span></div><div><b>MODEL</b><span>ESTIMATES</span></div><div><b>YOU</b><span>IN THE PICTURE</span></div></div>
          </div>

          <div className="story-copy story-copy-city">
            <span className="story-kicker"><span/> FROM PLANET TO PLACE</span>
            <h2><span className="story-headline-line"><span className="story-line-inner">See the air</span></span><span className="story-headline-line"><span className="story-line-inner"><em>where you are.</em></span></span></h2>
            <p>Explore a city’s model estimate, pollutant mix, and the time behind the reading.</p>
            <a className="story-primary" href="/dashboard">Open the air dashboard <ArrowRight size={15}/></a>
          </div>

          <div className="story-scroll-cue"><span>SCROLL TO EXPLORE</span><i/></div>
          <div className="story-counter"><span ref={stepRef}>01</span><i/><span>03</span></div>
          <div className="story-credit"><Orbit size={12}/> VAYU INDEX <span>·</span> AIR INTELLIGENCE</div>
        </div>
      </section>

      <section className="story-outro" id="our-atmosphere">
        <div><span className="eyebrow"><span className="eyebrow-line"/> START WITH A PLACE</span><h2>Make the global<br/><em>feel personal.</em></h2></div>
        <p>Open the dashboard to search a city and explore a regional model estimate, with its source and timestamp in view.</p>
        <a className="story-outro-link" href="/dashboard">Explore global air <ArrowUpRight size={16}/></a>
        <div className="story-outro-orb" aria-hidden="true"><Wind size={54}/></div>
      </section>

      <footer className="story-footer"><span>VAYU INDEX <i>·</i> REAL-TIME GLOBAL AIR INTELLIGENCE &amp; PERSONAL RISK ENGINE</span><a href="/dashboard">OPEN DASHBOARD <ArrowUpRight size={12}/></a></footer>
    </main>
  );
}
