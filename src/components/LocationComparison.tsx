"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Check, Plus, Search, X } from "lucide-react";
import { convertConcentration, type ConcentrationUnit, type Pollutant } from "@/lib/aqi-calculator";
import type { AirQualityResponse, GeocodedPlace, Location } from "@/lib/types";

const COLORS = ["#2f7650", "#bb7651", "#687fa6", "#9b6e98", "#79964b"];
const POLLUTANTS: { key: string; pollutant: Pollutant; label: string; limit: number; unit: ConcentrationUnit }[] = [
  { key:"pm2_5",pollutant:"pm2_5",label:"PM₂.₅",limit:9,unit:"µg/m³" }, { key:"pm10",pollutant:"pm10",label:"PM₁₀",limit:54,unit:"µg/m³" },
  { key:"ozone",pollutant:"o3",label:"O₃",limit:.054,unit:"ppm" }, { key:"nitrogen_dioxide",pollutant:"no2",label:"NO₂",limit:53,unit:"ppb" },
  { key:"sulphur_dioxide",pollutant:"so2",label:"SO₂",limit:35,unit:"ppb" }, { key:"carbon_monoxide",pollutant:"co",label:"CO",limit:4.4,unit:"ppm" },
];
const DEFAULTS: Location[] = [
  { name:"New Delhi",admin:"Delhi",country:"India",latitude:28.6139,longitude:77.209 },
  { name:"London",admin:"England",country:"United Kingdom",latitude:51.5072,longitude:-.1276 },
];
type Site = { location: Location; air: AirQualityResponse | null; error?: string };

function normalizedUnit(value?: string): ConcentrationUnit | null {
  const unit = value?.toLowerCase().replace(/μ/g,"µ").replace(/ug/g,"µg").replace(/\s/g,"").replace(/m3/g,"m³");
  if (["µg/m³","mg/m³","ppm","ppb"].includes(unit ?? "")) return unit as ConcentrationUnit;
  return null;
}
function getValue(air: AirQualityResponse | null, item: typeof POLLUTANTS[number]): number | null {
  const value = air?.current[item.key];
  const from = normalizedUnit(air?.current_units?.[item.key]);
  if (typeof value !== "number" || !Number.isFinite(value) || !from) return null;
  try { return convertConcentration(value, from, item.unit, item.pollutant); } catch { return null; }
}

export function LocationComparison({ initialLocation }: { initialLocation?: Location }) {
  const [locations, setLocations] = useState<Location[]>(() => initialLocation ? [initialLocation, ...DEFAULTS.filter((place) => Math.abs(place.latitude-initialLocation.latitude)>.01).slice(0,1)] : DEFAULTS);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodedPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) { setSuggestions([]); setSearching(false); return; }
    const controller = new AbortController(); const timer = window.setTimeout(() => {
      setSearching(true);
      fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then(async (response) => { const json = await response.json() as { results?: GeocodedPlace[]; error?: string }; if (!response.ok) throw new Error(json.error ?? "Place search is unavailable."); return json; })
        .then((json) => { if (!controller.signal.aborted) setSuggestions(json.results ?? []); })
        .catch(() => { if (!controller.signal.aborted) setSuggestions([]); })
        .finally(() => { if (!controller.signal.aborted) setSearching(false); });
    }, 300);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);

  useEffect(() => {
    if (locations.length < 2) { setSites([]); return; }
    const controller = new AbortController(); setLoading(true); setError(null); setSites([]);
    Promise.all(locations.map(async (location): Promise<Site> => {
      const params = new URLSearchParams({ lat:String(location.latitude),lng:String(location.longitude) });
      try {
        const response = await fetch(`/api/air-quality?${params}`, { signal:controller.signal });
        const json = await response.json() as AirQualityResponse & { error?: string };
        if (!response.ok) throw new Error(json.error ?? "Air data is unavailable.");
        return { location, air:json };
      } catch (fetchError) { return { location, air:null, error:fetchError instanceof Error ? fetchError.message : "Air data is unavailable." }; }
    })).then((results) => { if (!controller.signal.aborted) setSites(results); })
      .catch(() => { if (!controller.signal.aborted) setError("Could not load the comparison readings."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [locations]);

  function addPlace(place: GeocodedPlace) {
    if (locations.length >= 5) return;
    if (locations.some((item) => Math.abs(item.latitude-place.latitude)<.01 && Math.abs(item.longitude-place.longitude)<.01)) { setQuery(""); setSuggestions([]); return; }
    setLocations((value) => [...value, { name:place.name,admin:place.admin1,country:place.country,latitude:place.latitude,longitude:place.longitude }]);
    setQuery(""); setSuggestions([]);
  }

  const comparison = useMemo(() => {
    const available = POLLUTANTS.map((pollutant) => ({ pollutant, values:sites.map((site) => getValue(site.air,pollutant)) }));
    const common = available.filter((item) => item.values.length >= 2 && item.values.every((value) => typeof value === "number" && Number.isFinite(value))).map((item) => ({ pollutant:item.pollutant,values:item.values as number[] }));
    const chartData = common.map(({ pollutant,values }) => ({ pollutant:pollutant.label, ...Object.fromEntries(values.map((value,index) => [`site${index}`,value/pollutant.limit*100])) }));
    const radarData = common.map(({ pollutant,values }) => { const max = Math.max(...values,1e-9); return { pollutant:pollutant.label,...Object.fromEntries(values.map((value,index) => [`site${index}`,value/max*100])) }; });
    const scores = sites.map((_,index) => common.length ? common.reduce((sum,item)=>sum + item.values[index]!/item.pollutant.limit,0)/common.length*100 : null);
    const best = scores.some((value)=>value!==null) ? scores.reduce<number|null>((best,value,index)=> value!==null && (best===null || value<scores[best]!) ? index : best,null) : null;
    return { chartData,radarData,scores,best,commonCount:common.length };
  }, [sites]);

  return (
    <section className="phase-view comparison-view">
      <header className="phase-view-heading"><div><span className="section-kicker"><span className="eyebrow-line"/> SIDE-BY-SIDE · LIVE SOURCE DATA</span><h1>Places, in <em>perspective.</em></h1><p>Compare shared pollutant measurements after unit conversion. Up to five locations.</p></div><span className="provenance-pill station-pill">LIVE TELEMETRY · SOURCE-LABELED</span></header>
      <div className="comparison-place-picker"><label htmlFor="compare-place"><Search size={15}/><input id="compare-place" value={query} placeholder="Add a city or region" onChange={(event)=>setQuery(event.target.value)} autoComplete="off"/><span>{locations.length}/5</span></label>{query.trim().length>=2 && <div className="compare-suggestions">{searching && <span>Searching…</span>}{!searching && suggestions.length===0 && <span>No places found</span>}{suggestions.map((place)=><button type="button" key={place.id} onClick={()=>addPlace(place)}><span>{place.name}</span><small>{[place.admin1,place.country].filter(Boolean).join(" · ")}</small><Plus size={14}/></button>)}</div>}</div>
      <div className="comparison-site-cards">{locations.map((location,index)=>{const site=sites.find((item)=>item.location.latitude===location.latitude&&item.location.longitude===location.longitude);const cleaner=comparison.best===index;return <article className={`comparison-site ${cleaner?"is-cleaner":""}`} key={`${location.latitude}-${location.longitude}`}><span className="comparison-site-index" style={{backgroundColor:COLORS[index]}}>{String(index+1).padStart(2,"0")}</span><div><h2>{location.name}</h2><p>{[location.admin,location.country].filter(Boolean).join(" · ")}</p><small>{site?.air?.sourceLabel??(loading?"FETCHING SOURCE…":site?.error??"WAITING FOR DATA")}</small></div>{cleaner&&<span className="cleaner-badge"><Check size={12}/> CLEANER RELATIVE</span>}{locations.length>2&&<button type="button" className="remove-place" aria-label={`Remove ${location.name}`} onClick={()=>setLocations((value)=>value.filter((_,itemIndex)=>itemIndex!==index))}><X size={14}/></button>}</article>})}</div>
      {error&&<div className="phase-state phase-error">{error}</div>}
      {comparison.best!==null&&<p className="comparison-clean-note"><Check size={14}/> {locations[comparison.best]?.name} has the lower comparable-pollutant relative burden across {comparison.commonCount} shared pollutant{comparison.commonCount===1?"":"s"}. This is a comparison aid, not an official AQI or health ranking.</p>}
      {comparison.commonCount===0&&!loading&&<div className="phase-state">No shared, unit-compatible pollutant readings were returned. Try locations with model estimates or live concentration measurements; WAQI index-only responses cannot be compared by pollutant.</div>}
      <div className="comparison-chart-grid"><article className="phase-chart-card"><div className="phase-chart-heading"><div><span className="section-kicker">REFERENCE-RELATIVE CONCENTRATION</span><h2>Side-by-side pollutant levels</h2></div><span className="chart-unit">% OF EPA GOOD-BAND LIMIT</span></div>{loading?<div className="phase-state">Loading selected locations…</div>:comparison.chartData.length>0&&<div className="phase-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={comparison.chartData} margin={{top:12,right:10,left:-12,bottom:0}}><CartesianGrid strokeDasharray="3 5" stroke="var(--chart-grid)"/><XAxis dataKey="pollutant" tick={{fill:"var(--chart-muted)",fontSize:10}}/><YAxis tick={{fill:"var(--chart-muted)",fontSize:10}}/><Tooltip formatter={(value,name)=>[`${Number(value).toFixed(1)}%`,name]}/><Legend/>{locations.map((location,index)=><Bar key={location.name} dataKey={`site${index}`} name={location.name} fill={COLORS[index]} radius={[4,4,0,0]}/>)}</BarChart></ResponsiveContainer></div>}</article>
        <article className="phase-chart-card"><div className="phase-chart-heading"><div><span className="section-kicker">SHARED POLLUTANTS · NORMALIZED</span><h2>Relative profile</h2></div></div>{loading?<div className="phase-state">Preparing comparison…</div>:comparison.radarData.length>0&&<div className="phase-chart radar-chart"><ResponsiveContainer width="100%" height="100%"><RadarChart data={comparison.radarData} outerRadius="72%"><PolarGrid stroke="var(--chart-grid)"/><PolarAngleAxis dataKey="pollutant" tick={{fill:"var(--chart-muted)",fontSize:10}}/><PolarRadiusAxis angle={30} domain={[0,100]} tick={{fill:"var(--chart-muted)",fontSize:8}}/><Tooltip formatter={(value)=>[`${Number(value).toFixed(0)}% of highest value`,"Relative level"]}/>{locations.map((location,index)=><Radar key={location.name} name={location.name} dataKey={`site${index}`} stroke={COLORS[index]} fill={COLORS[index]} fillOpacity={.10} strokeWidth={2}/>)}</RadarChart></ResponsiveContainer></div>}</article></div>
      <p className="phase-disclaimer">Only pollutant fields present for every compared location are charted. Concentrations are converted to common EPA AQI input units where source units permit. The cleaner-relative indicator averages each shared pollutant as a fraction of its EPA “Good” breakpoint; it is not an official AQI, and sources may represent different measurement types and update times.</p>
    </section>
  );
}
