import { ArrowLeft, ArrowRight, ArrowUpRight, CircleCheck, CloudSun, MapPin, RadioTower, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { AboutMotion } from "@/components/about-motion";

export const metadata: Metadata = {
  title: "About | Vayu Index",
  description: "How Vayu Index combines air quality observations and atmospheric models, with clear source information.",
};

const providers = [
  { label: "OpenAQ v3", role: "Nearby station measurements", mark: <RadioTower size={18}/>, detail: "When configured, Vayu searches for a nearby monitoring location and displays recent pollutant readings with the station, provider, units, and timestamp." },
  { label: "WAQI", role: "Station AQI fallback", mark: <MapPin size={18}/>, detail: "When configured and attribution is returned, the nearest WAQI feed can provide an AQI when no recent OpenAQ reading is available." },
  { label: "Open-Meteo · CAMS", role: "Regional model fallback", mark: <CloudSun size={18}/>, detail: "When station feeds are not configured or have no fresh result, the dashboard shows a modeled estimate and identifies it as model data." },
];

export default function AboutPage() {
  return (
    <main className="about-page">
      <AboutMotion />
      <header className="editorial-nav">
        <a className="editorial-brand" href="/" aria-label="Vayu Index home">
          <span className="brand-mark" aria-hidden="true"><i/><i/><i/></span>
          <span><strong>VAYU <em>INDEX</em></strong><small>GLOBAL AIR INTELLIGENCE</small></span>
        </a>
        <nav aria-label="Main navigation"><a href="/">Home</a><a className="current" aria-current="page" href="/about">About Vayu</a></nav>
        <div className="editorial-nav-actions"><a className="nav-explore" href="/dashboard">Explore the air <ArrowRight size={15}/></a></div>
      </header>

      <section className="about-hero">
        <span className="eyebrow"><span className="eyebrow-line"/> WHY VAYU INDEX</span>
        <h1>Make the air<br/><em>easier to understand.</em></h1>
        <p>Vayu Index brings together monitoring data and atmospheric models, then makes the source and limits of each reading clear.</p>
        <a className="story-primary" href="/dashboard">Explore the dashboard <ArrowUpRight size={15}/></a>
        <div className="about-hero-orbit" aria-hidden="true"><span/><span/><span/></div>
      </section>

      <section className="about-principles" aria-label="How Vayu Index works">
        <article><span>01</span><h2>Find the place</h2><p>Search a city and select its coordinates to request air data for that location.</p></article>
        <article><span>02</span><h2>Show the source</h2><p>Station observations, WAQI index readings, and regional model estimates have different labels and provenance.</p></article>
        <article><span>03</span><h2>Keep the context</h2><p>See the reported time and units. If a source does not provide a value, the interface leaves it unavailable.</p></article>
      </section>

      <section className="about-sources">
        <div className="about-section-heading"><span className="eyebrow"><span className="eyebrow-line"/> DATA SOURCES</span><h2>Three sources.<br/><em>Clear provenance.</em></h2></div>
        <div className="provider-list">
          {providers.map((provider) => <article className="provider-card" key={provider.label}>
            <div className="provider-icon">{provider.mark}</div><div><span className="provider-role">{provider.role}</span><h3>{provider.label}</h3><p>{provider.detail}</p></div><CircleCheck className="provider-check" size={17}/>
          </article>)}
        </div>
      </section>

      <section className="about-note">
        <div className="about-note-icon"><ShieldCheck size={20}/></div>
        <div><h2>Read each number with its source.</h2><p>OpenAQ readings are individual sensor measurements and do not automatically form an AQI. WAQI supplies a station AQI. Open-Meteo supplies a model estimate. Those values are not interchangeable, and the dashboard labels which one it displays.</p></div>
      </section>

      <section className="about-terms">
        <span className="section-kicker">SOURCE USE</span>
        <p>WAQI requires attribution, does not permit cached or archived redistribution, and restricts paid use. Public use by a for-profit company requires an explicit agreement with WAQI. Confirm the project’s intended release complies before enabling WAQI publicly.</p>
        <a href="https://aqicn.org/api/tos/" target="_blank" rel="noreferrer">Review WAQI terms <ArrowUpRight size={13}/></a>
      </section>

      <section className="about-next"><div><span className="eyebrow"><span className="eyebrow-line"/> BUILDING IN PARTS</span><h2>Next: make the risk<br/><em>personal.</em></h2></div><a className="story-primary" href="/risk">See the next part <ArrowUpRight size={15}/></a></section>
      <footer className="story-footer"><span>VAYU INDEX <i>·</i> REAL-TIME GLOBAL AIR INTELLIGENCE &amp; PERSONAL RISK ENGINE</span><a href="/dashboard">OPEN DASHBOARD <ArrowUpRight size={12}/></a></footer>
      <a className="about-back" href="/"><ArrowLeft size={13}/> Back to overview</a>
    </main>
  );
}
