"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Wind } from "lucide-react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import * as THREE from "three";
import type { AirQualityResponse, Location } from "@/lib/types";
import { AQI_COLORS } from "@/lib/aqi-calculator";
import type { MapLayer } from "@/components/MapLayersPanel";

type Weather = { temperature_2m?: number; wind_speed_10m?: number; wind_direction_10m?: number; time?: string };
type Point = { lat: number; lng: number; aqi: number | null; label: string; value?: number | null };
type Props = {
  location: Location;
  air: AirQualityResponse | null;
  layer: MapLayer;
  weather: Weather | null;
  wind: boolean;
  temperature: boolean;
  zoom: number;
  onLocationSelect: (location: Location) => void;
};

function colorForAqi(value: number | null) {
  if (value === null) return "#4f8e78";
  if (value <= 50) return AQI_COLORS[0];
  if (value <= 100) return AQI_COLORS[1];
  if (value <= 150) return AQI_COLORS[2];
  if (value <= 200) return AQI_COLORS[3];
  if (value <= 300) return AQI_COLORS[4];
  return AQI_COLORS[5];
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

const FIELD_BY_LAYER: Record<MapLayer, string> = { aqi: "aqi", pm2_5: "pm2_5", pm10: "pm10", o3: "ozone", no2: "nitrogen_dioxide", so2: "sulphur_dioxide", co: "carbon_monoxide" };
const AQI_FIELD_BY_LAYER: Partial<Record<MapLayer, string>> = { pm2_5: "us_aqi_pm2_5", pm10: "us_aqi_pm10", o3: "us_aqi_ozone", no2: "us_aqi_nitrogen_dioxide", so2: "us_aqi_sulphur_dioxide", co: "us_aqi_carbon_monoxide" };

export function GlobeEngine({ location, air, layer, weather, wind, temperature, zoom, onLocationSelect }: Props) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [size, setSize] = useState({ width: 600, height: 500 });
  const selectedValue = layer === "aqi" ? air?.current.aqi : air?.current[FIELD_BY_LAYER[layer]];
  const selectedAqi = layer === "aqi" ? air?.current.aqi : AQI_FIELD_BY_LAYER[layer] ? air?.current[AQI_FIELD_BY_LAYER[layer]!] : null;
  const point = useMemo<Point>(() => ({ lat: air?.stationLatitude ?? location.latitude, lng: air?.stationLongitude ?? location.longitude, aqi: typeof selectedAqi === "number" ? selectedAqi : null, value: typeof selectedValue === "number" ? selectedValue : null, label: `${air?.stationName ?? location.name} · ${air?.sourceLabel ?? "Selected location"}` }), [air, location, selectedAqi, selectedValue]);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;
    globe.pointOfView({ lat: location.latitude, lng: location.longitude, altitude: 2.25 / zoom }, 1100);
  }, [location.latitude, location.longitude, zoom, ready]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: Math.max(1, Math.round(entry.contentRect.width)), height: Math.max(1, Math.round(entry.contentRect.height)) }));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      onLocationSelect({ name: "Your location", admin: "Detected by browser", latitude: position.coords.latitude, longitude: position.coords.longitude });
    }, () => undefined, { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 });
  // Run once on initial mount; location changes are driven by search and globe clicks.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addAtmosphere = useCallback(() => {
    const globe = globeRef.current;
    if (!globe) return;
    const scene = globe.scene();
    const radius = globe.getGlobeRadius();
    const geometry = new THREE.SphereGeometry(radius * 1.035, 48, 48);
    const material = new THREE.ShaderMaterial({
      vertexShader: `varying vec3 vNormal; varying vec3 vWorldPosition; void main(){ vNormal=normalize(normalMatrix*normal); vec4 worldPosition=modelMatrix*vec4(position,1.0); vWorldPosition=worldPosition.xyz; gl_Position=projectionMatrix*viewMatrix*worldPosition; }`,
      fragmentShader: `varying vec3 vNormal; varying vec3 vWorldPosition; void main(){ vec3 viewDirection=normalize(cameraPosition-vWorldPosition); float fresnel=pow(1.0-max(dot(normalize(vNormal),viewDirection),0.0),3.0); gl_FragColor=vec4(0.26,0.73,0.52,fresnel*0.42); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
    });
    const halo = new THREE.Mesh(geometry, material);
    halo.name = "vayu-atmosphere-halo";
    scene.add(halo);
    return () => { scene.remove(halo); geometry.dispose(); material.dispose(); };
  }, []);
  useEffect(() => { if (!ready) return; return addAtmosphere(); }, [addAtmosphere, ready]);

  const selectCoordinates = useCallback((coords: { lat: number; lng: number }) => {
    onLocationSelect({ name: "Selected location", admin: "Globe coordinates", latitude: coords.lat, longitude: coords.lng });
  }, [onLocationSelect]);

  const windAngle = weather?.wind_direction_10m ?? 0;
  return <>
    <div className="globe-webgl" ref={containerRef} aria-label={`Interactive 3D globe centered on ${location.name}`}>
      <Globe ref={globeRef} width={size.width} height={size.height} backgroundColor="rgba(0,0,0,0)" showAtmosphere atmosphereColor="#78c9a2" atmosphereAltitude={0.13} showGraticules globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg" bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png" pointsData={[point]} pointLat="lat" pointLng="lng" pointColor={(item) => colorForAqi((item as Point).aqi)} pointRadius={0.34} pointAltitude={0.012} pointResolution={16} pointLabel={(item) => { const p = item as Point; return `${escapeHtml(p.label)}<br/>${p.aqi === null ? "AQI unavailable" : `AQI ${Math.round(p.aqi)}`}`; }} onPointClick={(_, event, coords) => { event?.stopPropagation(); selectCoordinates(coords); }} onGlobeClick={(coords) => selectCoordinates(coords)} onGlobeReady={() => setReady(true)} enablePointerInteraction animateIn />
      {ready && wind && weather?.wind_speed_10m !== undefined && <div className="globe-weather-chip wind-chip"><Wind size={13} style={{ transform: `rotate(${windAngle}deg)` }}/> {weather.wind_speed_10m} km/h <small>MODEL WIND · SELECTED POINT</small></div>}
      {ready && temperature && weather?.temperature_2m !== undefined && <div className={`globe-weather-chip temperature-chip ${wind ? "with-wind" : ""}`}><span className="temperature-dot"/>{weather.temperature_2m}°C <small>MODEL TEMP · SELECTED POINT</small></div>}
      <span className="globe-data-caption">{air?.provenance === "station-observation" ? "GROUND STATION OBSERVATION" : air?.provenance === "modeled-estimate" ? "MODELED AIR QUALITY ESTIMATE" : "SELECT A POINT TO EXPLORE"}</span>
    </div>
  </>;
}
