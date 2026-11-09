# Vayu Index

Real-Time Global Air Intelligence & Personal Risk Engine.

## Current increment

The root route is a cinematic landing page with a scroll-driven globe story. The live dashboard lives at `/dashboard`, project and data-source details are at `/about`, and the next-part placeholder lives at `/risk`. The interface uses a restrained light palette with green accents. Internal page links are ordinary HTML anchors on purpose, so moving between routes performs full document requests instead of Next.js client-side transitions. In-page scrolling on `/` remains a normal document scroll.

The App Router dashboard searches global places and displays the selected location's AQI or reported pollutant concentrations, source, and observation/model time. `src/lib/api-orchestrator.ts` tries nearby OpenAQ station measurements first, then a WAQI station AQI when configured and attributable, and finally Open-Meteo's CAMS model estimate. OpenAQ and Open-Meteo results use a per-edge-instance, 10-minute in-memory cache; WAQI responses are excluded to respect WAQI's no-cache terms. This cache is best-effort and is not shared across Vercel instances. OpenAQ concentration readings are shown without inventing an AQI from sensor values captured at different times. WAQI does not provide usable concentration units in every feed, so this UI displays its AQI only. City lookup uses the Open-Meteo Geocoding API through a typed Edge Route Handler.

The Phase 2 dashboard uses an editorial 35/65 split layout, a light/dark token set, GSAP AQI counter, source timestamp and provenance, pollutant telemetry, a public-health context card, and a Framer Motion AQI reference marker. The right spatial viewport is reserved for a future Three.js/WebGL layer; the current Earth is a decorative SVG, and its markers are explicitly not station data.

The current visual system adapts the supplied portfolio design notes into a light-first product UI: Outfit display headings, Inter body text, DM Mono data labels, neutral flat surfaces, rounded controls, and restrained transitions. Green remains Vayu's air-intelligence accent.

`src/lib/aqi-calculator.ts` contains separate US EPA and CPCB breakpoint mappings, unit conversions, sub-index colors, and maximum-pollutant composite calculation. It expects concentrations averaged over the standard's required period; it must not be applied to a single instantaneous sensor sample as an official AQI.

The normalized endpoint is `GET /api/air-quality?lat=28.6139&lng=77.2090`. It returns `provider` and `provenance` fields so station observations remain distinct from the Open-Meteo/CAMS modeled estimate. Older `latitude` and `longitude` parameter names are accepted for compatibility. The AQI calculator is kept separate from this endpoint until a provider supplies valid standard-period averages; OpenAQ `/latest` values alone are individual readings, not enough to claim an EPA or CPCB AQI.

These are regional atmospheric model estimates, not ground-station observations. The globe is illustrative and its markers do not represent stations. CAMS global forecasts have an approximately 45 km grid; CAMS European air-quality forecasts have approximately 11 km resolution. A recent model timestamp does not mean a fresh local sensor observation. Ground-station integration and the personal risk engine are later increments.

## Run locally

Requirements: Node.js 20.9 or later and npm.

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Add your real `OPENAQ_API_KEY`, `WAQI_API_KEY`, and (for the later AI agent) `GROQ_API_KEY` values to `.env.local`, then restart the server. Do not put secrets in `.env.example` or in any `NEXT_PUBLIC_` variable. The server also accepts the legacy `WAQI_API_TOKEN` variable. If the station keys are blank, the dashboard uses Open-Meteo. Its public endpoint requires no key for non-commercial use; commercial access uses a separate customer endpoint and key. Open <http://localhost:3000>. Press `Ctrl+C` in the terminal to stop the development server.

## Chosen stack

- Next.js 15 App Router, React 19, TypeScript strict mode
- Tailwind CSS 4 with a shadcn/ui configuration and Radix UI primitives
- GSAP ScrollTrigger for the pinned landing-page scroll story and GSAP for the AQI number roll-up; Framer Motion for page entrance and future spring-driven panels
- Vercel Edge Route Handlers for air data and geocoding
- Open-Meteo APIs for geocoding and regional model estimates
- OpenAQ v3 and WAQI station feeds as configured, accessed only from server routes

The project plan introduces the remaining selected tools alongside the parts that need them: Three.js and `react-globe.gl`, Leaflet/MapLibre and heatmaps, Recharts/Plotly, Turf.js, the TypeScript personal risk engine, then LangGraph/FastAPI (or Vercel AI SDK), Groq `qwen/qwen3.8-27b`, Redis/Upstash, social cards, voice, and push alerts. Provider credentials and private keys will stay server-side.

## Data sources

- [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) — city names to coordinates.
- [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api) — current model conditions, pollutant concentrations, and US AQI.
- [Copernicus Atmosphere Monitoring Service](https://atmosphere.copernicus.eu/) — atmospheric model data attributed through Open-Meteo.
- [OpenAQ v3](https://docs.openaq.org/) — nearby station observations. Its API key is read only in the server-side route.
- [World Air Quality Index Project API](https://aqicn.org/api/) — nearby AQI fallback. WAQI requires a token; its data is not cached and response attribution is displayed.

WAQI's published terms prohibit using its data in paid applications and require explicit agreement for public use by a for-profit company. They also require attribution and prohibit caching or archiving WAQI data. Confirm the intended release fits those terms before deploying WAQI data publicly.
