"use client";

import { Thermometer, Wind } from "lucide-react";

export type MapLayer = "aqi" | "pm2_5" | "pm10" | "o3" | "no2" | "so2" | "co";

const LAYERS: { id: MapLayer; label: string; short: string }[] = [
  { id: "aqi", label: "Composite AQI", short: "AQI" },
  { id: "pm2_5", label: "PM₂.₅", short: "PM₂.₅" },
  { id: "pm10", label: "PM₁₀", short: "PM₁₀" },
  { id: "o3", label: "O₃", short: "O₃" },
  { id: "no2", label: "NO₂", short: "NO₂" },
  { id: "so2", label: "SO₂", short: "SO₂" },
  { id: "co", label: "CO", short: "CO" },
];

export function MapLayersPanel({ layer, onLayerChange, wind, onWindChange, temperature, onTemperatureChange }: {
  layer: MapLayer;
  onLayerChange: (layer: MapLayer) => void;
  wind: boolean;
  onWindChange: (enabled: boolean) => void;
  temperature: boolean;
  onTemperatureChange: (enabled: boolean) => void;
}) {
  return (
    <section className="map-layers-panel" aria-label="Map layers">
      <header><span className="section-kicker">SPATIAL LAYERS</span><span className="map-layers-live"><i/> LIVE</span></header>
      <div className="map-layer-options" role="radiogroup" aria-label="Air quality layer">
        {LAYERS.map((item) => <button key={item.id} type="button" role="radio" aria-checked={layer === item.id} className={layer === item.id ? "selected" : ""} onClick={() => onLayerChange(item.id)}><span className="map-layer-radio"/><span>{item.label}</span></button>)}
      </div>
      <div className="map-layer-divider"/>
      <label className="map-layer-switch"><span className="map-layer-icon"><Wind size={14}/></span><span>Wind vector</span><input type="checkbox" checked={wind} onChange={(event) => onWindChange(event.target.checked)}/><i/></label>
      <label className="map-layer-switch"><span className="map-layer-icon"><Thermometer size={14}/></span><span>Temperature</span><input type="checkbox" checked={temperature} onChange={(event) => onTemperatureChange(event.target.checked)}/><i/></label>
    </section>
  );
}

export { LAYERS as MAP_LAYERS };
