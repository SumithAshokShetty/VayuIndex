"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowDown, ArrowRight, ArrowUpRight, Activity, BrainCircuit, HeartPulse, Layers3, Wind } from "lucide-react";
import { AQI_COLORS } from "@/lib/aqi-calculator";
import type { AirQualityResponse } from "@/lib/types";
import { Footer } from "@/components/Footer";

const InteractiveLandingGlobe = dynamic(() => import("@/components/InteractiveLandingGlobe").then((module) => module.InteractiveLandingGlobe), { ssr: false, loading: () => <div className="landing-globe-loading">Preparing the atmosphere…</div> });

const CITIES = [
  { name: "Mumbai", coordinates: [19.076, 72.8777] as const },
  { name: "Tokyo", coordinates: [35.6762, 139.6503] as const },
  { name: "Paris", coordinates: [48.8566, 2.3522] as const },
  { name: "Delhi", coordinates: [28.6139, 77.209] as const },
];

const FEATURES = [
  { number:"01",icon:Activity,title:"Real-time telemetry & failover ingestion",description:"Station observations first, with a clearly identified model estimate when nearby ground readings are unavailable.",tags:["OPENAQ V3","WAQI","OPEN-METEO"],href:"/dashboard",tone:"paper" },
  { number:"02",icon:HeartPulse,title:"Personal exposure risk calculator",description:"Explore how age, health context, activity, and exposure can shape a more individual risk picture.",tags:["DEMOGRAPHICS","ACTIVITY","EXPOSURE"],href:"/risk",tone:"moss" },
  { number:"03",icon:BrainCircuit,title:"Autonomous multi-agent intelligence",description:"A planned agent network for data auditing, trend context, health guidance, and clear executive summaries.",tags:["DATA AUDITOR","TREND PREDICTOR","IN DEVELOPMENT"],href:"/about",tone:"dark" },
  { number:"04",icon:Layers3,title:"72-hour forecast & spatial context",description:"Follow model-based air quality estimates over time and explore the atmosphere around a selected place.",tags:["72-HOUR OUTLOOK","CAMS MODEL","SPATIAL VIEW"],href:"/dashboard",tone:"sage" },
];

function getBandColor(aqi: number | null) {
  if (aqi === null) return "#718078";
  if (aqi <= 50) return AQI_COLORS[0];
  if (aqi <= 100) return AQI_COLORS[1];
  if (aqi <= 150) return AQI_COLORS[2];
  if (aqi <= 200) return AQI_COLORS[3];
  if (aqi <= 300) return AQI_COLORS[4];
  return AQI_COLORS[5];
}

function sourceKind(data: AirQualityResponse | null) {
  if (!data) return "SOURCE PENDING";
  return data.provenance === "station-observation" ? "GROUND STATION" : "MODEL ESTIMATE";
}

function CityTicker() {
  const [values, setValues] = useState<(AirQualityResponse | null)[]>(CITIES.map(() => null));
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all(CITIES.map(async (city) => {
      const params = new URLSearchParams({ lat:String(city.coordinates[0]),lng:String(city.coordinates[1]) });
      try {
        const response = await fetch(`/api/air-quality?${params}`, { signal:controller.signal });
        if (!response.ok) return null;
        return await response.json() as AirQualityResponse;
      } catch { return null; }
    })).then((results) => { if (!controller.signal.aborted) setValues(results); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const items = CITIES.map((city,index) => {
    const data = values[index];
    const aqi = typeof data?.current.aqi === "number" ? data.current.aqi : null;
    const pm25 = data?.current.pm2_5;
    return { name:city.name,aqi,source:sourceKind(data),pm25:typeof pm25 === "number" ? pm25 : null };
  });
  const tickerItems = [...items,...items];
  return <section className="landing-ticker" aria-label="Current air quality from selected cities">
    <div className="ticker-intro"><span className="ticker-live-dot"/><span>SELECTED CITY SIGNALS</span></div>
    <div className="ticker-window"><div className="ticker-track" aria-live="polite">{tickerItems.map((item,index)=><div className="ticker-item" key={`${item.name}-${index}`}>
      <span className="ticker-city">{item.name}</span><strong style={{color:getBandColor(item.aqi)}}>{loading?"···":item.aqi===null?"AQI —":Math.round(item.aqi)}</strong>
      <span className="ticker-category">{loading?"UPDATING":item.aqi===null?(item.pm25===null?item.source:`PM₂.₅ ${item.pm25.toFixed(1)} · ${item.source}`):item.aqi<=50?"GOOD":item.aqi<=100?"MODERATE":item.aqi<=150?"SENSITIVE GROUPS":item.aqi<=200?"UNHEALTHY":item.aqi<=300?"VERY UNHEALTHY":"HAZARDOUS"}</span>
      <span className="ticker-separator" aria-hidden="true">✳</span>
    </div>)}</div></div>
  </section>;
}

function FeatureCard({ feature, index }: { feature: typeof FEATURES[number]; index: number }) {
  const Icon = feature.icon;
  return <motion.a href={feature.href} className={`editorial-feature-card feature-${feature.tone}`} initial={{ opacity:0,y:28 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true,amount:.18 }} transition={{ duration:.62,delay:index*.07,ease:[.22,.72,.26,1] }} whileHover={{ y:-5,rotateX:1.5,rotateY:index%2?1:-1 }}>
    <div className="feature-card-top"><span className="feature-number">{feature.number} / VAYU INDEX</span><span className="feature-icon"><Icon size={19} strokeWidth={1.6}/></span></div>
    <div className="feature-card-main"><span className="feature-kicker">AIR INTELLIGENCE · MODULE {feature.number}</span><h3>{feature.title}</h3><p>{feature.description}</p></div>
    <div className="feature-card-bottom"><div className="feature-tags">{feature.tags.map((tag)=><span key={tag}>{tag}</span>)}</div><span className="feature-reveal">EXPLORE FEATURE <ArrowRight size={13}/></span></div>
    <span className="feature-glow" aria-hidden="true"/>
  </motion.a>;
}

export function LandingEditorial() {
  const { scrollY } = useScroll();
  const globeOpacity = useSpring(useTransform(scrollY, [0, 600], [1, 0]), { stiffness: 90, damping: 26, mass: .7 });
  const globeScale = useSpring(useTransform(scrollY, [0, 600], [1, .85]), { stiffness: 90, damping: 26, mass: .7 });
  const globeY = useSpring(useTransform(scrollY, [0, 600], [-50, -90]), { stiffness: 90, damping: 26, mass: .7 });
  const tiltX = useSpring(useMotionValue(0),{stiffness:110,damping:20,mass:.7});
  const tiltY = useSpring(useMotionValue(0),{stiffness:110,damping:20,mass:.7});
  function tiltGlobe(event: React.PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x=(event.clientX-bounds.left)/bounds.width-.5;
    const y=(event.clientY-bounds.top)/bounds.height-.5;
    tiltX.set(-y*3.5);tiltY.set(x*4.5);
  }
  function resetTilt(){tiltX.set(0);tiltY.set(0);}

  return <main className="editorial-landing">
    <section className="editorial-hero" aria-labelledby="landing-title">
      <div className="hero-copy">
        <motion.span className="editorial-kicker" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:.55,delay:.1}}> <span/> THE AIR AROUND US, MADE CLEAR</motion.span>
        <motion.h1 id="landing-title" initial="hidden" animate="visible" variants={{hidden:{},visible:{transition:{staggerChildren:.13,delayChildren:.22}}}}>
          {["Tomorrow","begins in the","air."] .map((line,index)=><span className="hero-title-line" key={line}><motion.span variants={{hidden:{y:40,opacity:0},visible:{y:0,opacity:1}}} transition={{duration:.78,ease:[.2,.72,.25,1]}}>{index===2?<em>{line}</em>:line}</motion.span></span>)}
        </motion.h1>
        <motion.p className="hero-description" initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{duration:.62,delay:.7}}>Understand our atmosphere. See how air changes from one place to another. Find a clearer next step.</motion.p>
        <motion.div className="hero-actions" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:.6,delay:.84}}><a className="hero-primary" href="/overview">Explore air intelligence <ArrowUpRight size={15}/></a><a className="hero-secondary" href="#intelligence">Discover the system <ArrowDown size={14}/></a></motion.div>
        <motion.div className="hero-proofline" initial={{opacity:0}} animate={{opacity:1}} transition={{duration:.6,delay:1.1}}><span><i/> STATION + MODEL PROVENANCE</span><span>BUILT FOR A LIVING PLANET</span></motion.div>
      </div>
      <motion.div className="hero-globe-wrap" style={{y:globeY,opacity:globeOpacity,scale:globeScale,rotateX:tiltX,rotateY:tiltY}} onPointerMove={tiltGlobe} onPointerLeave={resetTilt}>
        <div className="globe-haze haze-a"/><div className="globe-haze haze-b"/><InteractiveLandingGlobe/>
        <div className="hero-coordinate-tag"><Wind size={13}/><span>ONE SHARED ATMOSPHERE</span></div>
      </motion.div>
      <div className="hero-bottomline"><span>01 <i/> THE ATMOSPHERE</span><a href="#intelligence">SCROLL TO EXPLORE <span>↓</span></a><span>GLOBAL VIEW · ESTIMATE AND OBSERVATION</span></div>
    </section>

    <CityTicker/>

    <section className="editorial-intro" id="intelligence"><div><span className="editorial-kicker"><span/> A CLEARER VIEW OF THE AIR</span><h2>Make the invisible<br/><em>understandable.</em></h2></div><p>Air is local. Its sources, pollutants, and risks change from one place to another. Vayu Index brings those signals together with transparent provenance and a more personal point of view.</p></section>

    <section className="feature-section" aria-label="Vayu Index platform features"><div className="feature-section-heading"><div><span className="editorial-kicker"><span/> THE INTELLIGENCE SYSTEM</span><h2>Four ways to<br/><em>read the atmosphere.</em></h2></div><span className="feature-section-index">01 — 04<br/>PLATFORM MODULES</span></div>
      <div className="editorial-feature-grid">{FEATURES.map((feature,index)=><FeatureCard feature={feature} index={index} key={feature.number}/>)}</div>
    </section>

    <section className="editorial-cta"><div className="cta-orbit" aria-hidden="true"/><span className="editorial-kicker"><span/> START WITH A PLACE</span><h2>Ready to understand<br/>your atmosphere?</h2><p>Explore current readings, source context, and the changing air around a place you care about.</p><a href="/overview">Enter Vayu Index <ArrowUpRight size={15}/></a><span className="cta-index">V · 01</span></section>

    <Footer />
  </main>;
}
