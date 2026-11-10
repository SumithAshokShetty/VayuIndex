"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Globe,
  Info,
  Navigation,
  Search,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, Layer, TileLayer } from "leaflet";
import { useTheme } from "@/lib/use-theme";
import { getCityLandmarkSvg } from "@/lib/city-landmarks";

export type MapLayerKey = "aqi" | "pm2_5" | "pm10" | "ozone" | "no2" | "so2" | "co";

import {
  INITIAL_HOTSPOTS,
  type SpatialHotspot,
  type HotspotWeather,
  getCardinalDirection,
} from "@/lib/spatial-ground-truth";

export {
  INITIAL_HOTSPOTS,
  type SpatialHotspot,
  type HotspotWeather,
  getCardinalDirection,
};

function getAqiCategory(aqi: number) {
  if (aqi <= 50) return { category: "Good", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)" };
  if (aqi <= 100) return { category: "Moderate", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" };
  if (aqi <= 150) return { category: "Unhealthy for Sensitive", color: "#f97316", bg: "rgba(249, 115, 22, 0.15)" };
  if (aqi <= 200) return { category: "Unhealthy", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" };
  if (aqi <= 300) return { category: "Very Unhealthy", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.15)" };
  return { category: "Hazardous", color: "#881337", bg: "rgba(136, 19, 55, 0.15)" };
}

function getAqiAdvisory(aqi: number): string {
  if (aqi <= 50) return "Air quality is satisfactory; enjoy normal outdoor air exposure.";
  if (aqi <= 100) return "Acceptable air quality; exceptionally sensitive individuals should monitor prolonged exertion.";
  if (aqi <= 150) return "Sensitive groups (asthma, children, elderly) may experience health effects; limit heavy exertion.";
  if (aqi <= 200) return "Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.";
  if (aqi <= 300) return "Health alert: The risk of health effects is increased for everyone. Avoid prolonged outdoor exertion.";
  return "Health warning of emergency conditions: the entire population is more likely to be affected. Stay indoors.";
}

export interface MetricIntensity {
  value: number;
  formattedValue: string;
  unit: string;
  metricLabel: string;
  category: string;
  color: string;
  bg: string;
  intensityRatio: number;
}

export function getLayerMetric(spot: SpatialHotspot, layer: MapLayerKey): MetricIntensity {
  switch (layer) {
    case "pm2_5": {
      const val = spot.pollutants.pm2_5;
      let cat = "Good";
      let color = "#10b981";
      if (val > 250) { cat = "Severe"; color = "#881337"; }
      else if (val > 120) { cat = "Very Poor"; color = "#ef4444"; }
      else if (val > 90) { cat = "Poor"; color = "#f97316"; }
      else if (val > 60) { cat = "Moderate"; color = "#f59e0b"; }
      else if (val > 30) { cat = "Satisfactory"; color = "#84cc16"; }
      return {
        value: val,
        formattedValue: `${val}`,
        unit: "µg/m³",
        metricLabel: "PM2.5",
        category: cat,
        color,
        bg: `${color}26`,
        intensityRatio: Math.min(1, Math.max(0.2, val / 150)),
      };
    }
    case "pm10": {
      const val = spot.pollutants.pm10;
      let cat = "Good";
      let color = "#10b981";
      if (val > 430) { cat = "Severe"; color = "#881337"; }
      else if (val > 350) { cat = "Very Poor"; color = "#ef4444"; }
      else if (val > 250) { cat = "Poor"; color = "#f97316"; }
      else if (val > 100) { cat = "Moderate"; color = "#f59e0b"; }
      else if (val > 50) { cat = "Satisfactory"; color = "#84cc16"; }
      return {
        value: val,
        formattedValue: `${val}`,
        unit: "µg/m³",
        metricLabel: "PM10",
        category: cat,
        color,
        bg: `${color}26`,
        intensityRatio: Math.min(1, Math.max(0.2, val / 250)),
      };
    }
    case "ozone": {
      const val = spot.pollutants.ozone;
      let cat = "Good";
      let color = "#10b981";
      if (val > 748) { cat = "Severe"; color = "#881337"; }
      else if (val > 208) { cat = "Very Poor"; color = "#ef4444"; }
      else if (val > 168) { cat = "Poor"; color = "#f97316"; }
      else if (val > 100) { cat = "Moderate"; color = "#f59e0b"; }
      else if (val > 50) { cat = "Satisfactory"; color = "#84cc16"; }
      return {
        value: val,
        formattedValue: `${val}`,
        unit: "µg/m³",
        metricLabel: "Ozone (O₃)",
        category: cat,
        color,
        bg: `${color}26`,
        intensityRatio: Math.min(1, Math.max(0.2, val / 180)),
      };
    }
    case "no2": {
      const val = spot.pollutants.no2;
      let cat = "Good";
      let color = "#10b981";
      if (val > 400) { cat = "Severe"; color = "#881337"; }
      else if (val > 280) { cat = "Very Poor"; color = "#ef4444"; }
      else if (val > 180) { cat = "Poor"; color = "#f97316"; }
      else if (val > 80) { cat = "Moderate"; color = "#f59e0b"; }
      else if (val > 40) { cat = "Satisfactory"; color = "#84cc16"; }
      return {
        value: val,
        formattedValue: `${val}`,
        unit: "µg/m³",
        metricLabel: "NO₂",
        category: cat,
        color,
        bg: `${color}26`,
        intensityRatio: Math.min(1, Math.max(0.2, val / 150)),
      };
    }
    case "so2": {
      const val = spot.pollutants.so2;
      let cat = "Good";
      let color = "#10b981";
      if (val > 800) { cat = "Severe"; color = "#881337"; }
      else if (val > 380) { cat = "Very Poor"; color = "#ef4444"; }
      else if (val > 80) { cat = "Poor"; color = "#f97316"; }
      else if (val > 40) { cat = "Moderate"; color = "#f59e0b"; }
      else if (val > 20) { cat = "Satisfactory"; color = "#84cc16"; }
      return {
        value: val,
        formattedValue: `${val}`,
        unit: "µg/m³",
        metricLabel: "SO₂",
        category: cat,
        color,
        bg: `${color}26`,
        intensityRatio: Math.min(1, Math.max(0.2, val / 100)),
      };
    }
    case "co": {
      const val = spot.pollutants.co;
      let cat = "Good";
      let color = "#10b981";
      if (val > 17000) { cat = "Severe"; color = "#881337"; }
      else if (val > 10000) { cat = "Very Poor"; color = "#ef4444"; }
      else if (val > 2000) { cat = "Poor"; color = "#f97316"; }
      else if (val > 1000) { cat = "Moderate"; color = "#f59e0b"; }
      else if (val > 500) { cat = "Satisfactory"; color = "#84cc16"; }
      return {
        value: val,
        formattedValue: `${val}`,
        unit: "µg/m³",
        metricLabel: "CO",
        category: cat,
        color,
        bg: `${color}26`,
        intensityRatio: Math.min(1, Math.max(0.2, val / 2500)),
      };
    }
    case "aqi":
    default: {
      const val = spot.aqi;
      const catObj = getAqiCategory(val);
      return {
        value: val,
        formattedValue: `${val}`,
        unit: "AQI",
        metricLabel: "Air Quality (AQI)",
        category: catObj.category,
        color: catObj.color,
        bg: catObj.bg,
        intensityRatio: Math.min(1, Math.max(0.25, val / 200)),
      };
    }
  }
}

export interface ScaleTier {
  range: string;
  label: string;
  color: string;
  active: boolean;
}

export function getScaleTiers(layer: MapLayerKey, activeVal: number): ScaleTier[] {
  switch (layer) {
    case "pm2_5":
      return [
        { range: "0–30", label: "Good", color: "#10b981", active: activeVal <= 30 },
        { range: "31–60", label: "Satisfactory", color: "#84cc16", active: activeVal > 30 && activeVal <= 60 },
        { range: "61–90", label: "Moderate", color: "#f59e0b", active: activeVal > 60 && activeVal <= 90 },
        { range: "91–120", label: "Poor", color: "#f97316", active: activeVal > 90 && activeVal <= 120 },
        { range: "121–250", label: "Very Poor", color: "#ef4444", active: activeVal > 120 && activeVal <= 250 },
        { range: "250+", label: "Severe", color: "#881337", active: activeVal > 250 },
      ];
    case "pm10":
      return [
        { range: "0–50", label: "Good", color: "#10b981", active: activeVal <= 50 },
        { range: "51–100", label: "Satisfactory", color: "#84cc16", active: activeVal > 50 && activeVal <= 100 },
        { range: "101–250", label: "Moderate", color: "#f59e0b", active: activeVal > 100 && activeVal <= 250 },
        { range: "251–350", label: "Poor", color: "#f97316", active: activeVal > 250 && activeVal <= 350 },
        { range: "351–430", label: "Very Poor", color: "#ef4444", active: activeVal > 350 && activeVal <= 430 },
        { range: "430+", label: "Severe", color: "#881337", active: activeVal > 430 },
      ];
    case "ozone":
      return [
        { range: "0–50", label: "Good", color: "#10b981", active: activeVal <= 50 },
        { range: "51–100", label: "Satisfactory", color: "#84cc16", active: activeVal > 50 && activeVal <= 100 },
        { range: "101–168", label: "Moderate", color: "#f59e0b", active: activeVal > 100 && activeVal <= 168 },
        { range: "169–208", label: "Poor", color: "#f97316", active: activeVal > 168 && activeVal <= 208 },
        { range: "209–748", label: "Very Poor", color: "#ef4444", active: activeVal > 208 && activeVal <= 748 },
        { range: "748+", label: "Severe", color: "#881337", active: activeVal > 748 },
      ];
    case "no2":
      return [
        { range: "0–40", label: "Good", color: "#10b981", active: activeVal <= 40 },
        { range: "41–80", label: "Satisfactory", color: "#84cc16", active: activeVal > 40 && activeVal <= 80 },
        { range: "81–180", label: "Moderate", color: "#f59e0b", active: activeVal > 80 && activeVal <= 180 },
        { range: "181–280", label: "Poor", color: "#f97316", active: activeVal > 180 && activeVal <= 280 },
        { range: "281–400", label: "Very Poor", color: "#ef4444", active: activeVal > 280 && activeVal <= 400 },
        { range: "400+", label: "Severe", color: "#881337", active: activeVal > 400 },
      ];
    case "so2":
      return [
        { range: "0–20", label: "Good", color: "#10b981", active: activeVal <= 20 },
        { range: "21–40", label: "Satisfactory", color: "#84cc16", active: activeVal > 20 && activeVal <= 40 },
        { range: "41–80", label: "Moderate", color: "#f59e0b", active: activeVal > 40 && activeVal <= 80 },
        { range: "81–380", label: "Poor", color: "#f97316", active: activeVal > 80 && activeVal <= 380 },
        { range: "381–800", label: "Very Poor", color: "#ef4444", active: activeVal > 380 && activeVal <= 800 },
        { range: "800+", label: "Severe", color: "#881337", active: activeVal > 800 },
      ];
    case "co":
      return [
        { range: "0–500", label: "Good", color: "#10b981", active: activeVal <= 500 },
        { range: "501–1k", label: "Satisfactory", color: "#84cc16", active: activeVal > 500 && activeVal <= 1000 },
        { range: "1k–2k", label: "Moderate", color: "#f59e0b", active: activeVal > 1000 && activeVal <= 2000 },
        { range: "2k–10k", label: "Poor", color: "#f97316", active: activeVal > 2000 && activeVal <= 10000 },
        { range: "10k–17k", label: "Very Poor", color: "#ef4444", active: activeVal > 10000 && activeVal <= 17000 },
        { range: "17k+", label: "Severe", color: "#881337", active: activeVal > 17000 },
      ];
    case "aqi":
    default:
      return [
        { range: "0–50", label: "Good", color: "#10b981", active: activeVal <= 50 },
        { range: "51–100", label: "Moderate", color: "#f59e0b", active: activeVal > 50 && activeVal <= 100 },
        { range: "101–150", label: "Unhealthy for Sensitive", color: "#f97316", active: activeVal > 100 && activeVal <= 150 },
        { range: "151–200", label: "Unhealthy", color: "#ef4444", active: activeVal > 150 && activeVal <= 200 },
        { range: "201–300", label: "Very Unhealthy", color: "#8b5cf6", active: activeVal > 200 && activeVal <= 300 },
        { range: "301+", label: "Hazardous", color: "#881337", active: activeVal > 300 },
      ];
  }
}

interface OverviewSpatialMapProps {
  onSelectCity?: (hotspot: SpatialHotspot) => void;
  selectedCity?: SpatialHotspot;
}

interface LeafletContainer extends HTMLDivElement {
  _leaflet_id?: number | string;
}

export function OverviewSpatialMap({ onSelectCity, selectedCity }: OverviewSpatialMapProps) {
  const { theme } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const baseTileRef = useRef<TileLayer | null>(null);
  const refTileRef = useRef<TileLayer | null>(null);
  const markersRef = useRef<Layer[]>([]);
  const windCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const windAnimFrameRef = useRef<number | null>(null);
  const userMarkerRef = useRef<Layer | null>(null);
  const autoDetectTriggeredRef = useRef(false);

  const [hotspots, setHotspots] = useState<SpatialHotspot[]>(INITIAL_HOTSPOTS);
  const [activeHotspot, setActiveHotspot] = useState<SpatialHotspot>(selectedCity || INITIAL_HOTSPOTS[0]);
  const [activeContinent, setActiveContinent] = useState<string>("Global");
  const [activeLayer, setActiveLayer] = useState<MapLayerKey>("aqi");
  const [weatherOverlay, setWeatherOverlay] = useState(false);
  const [windOverlay, setWindOverlay] = useState(false);
  const [heatmapOverlay, setHeatmapOverlay] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [liveUpdating, setLiveUpdating] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [userLocationDetected, setUserLocationDetected] = useState(false);
  const [liveTimeFormatted, setLiveTimeFormatted] = useState("10 Nov, 12:30 PM IST");

  // Dynamic live date & time clock for AQI card (matching IST provenance badge)
  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const options: Intl.DateTimeFormatOptions = {
          day: "numeric",
          month: "short",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone: "Asia/Kolkata",
        };
        const formatter = new Intl.DateTimeFormat("en-IN", options);
        setLiveTimeFormatted(formatter.format(now) + " IST");
      } catch {
        setLiveTimeFormatted("Live Real-Time");
      }
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  // User Geolocation Auto-Detection & Physical Reading Ingestion
  const detectUserLocation = useCallback(
    (flyImmediately = true) => {
      if (typeof window === "undefined" || !navigator.geolocation) return;

      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;

          // 1. English Reverse Geocoding via internal API route
          let placeName = "Your Location";
          let adminName = "";
          let countryName = "India";

          try {
            const geoRes = await fetch(`/api/geocode?lat=${latitude}&lng=${longitude}`);
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              if (geoData.name) placeName = geoData.name;
              if (geoData.admin) adminName = geoData.admin;
              if (geoData.country) countryName = geoData.country;
            }
          } catch {
            // fallback
          }

          // 2. Find closest station/hotspot as baseline
          let closest = INITIAL_HOTSPOTS[0];
          let minDist = Infinity;
          hotspots.forEach((h) => {
            const d = Math.hypot(h.lat - latitude, h.lng - longitude);
            if (d < minDist) {
              minDist = d;
              closest = h;
            }
          });

          // 3. Fetch real-time air quality telemetry
          let detectedAqi = closest.aqi;
          let detectedStatus = closest.status;
          let detectedAdvisory = closest.advisory;
          let detectedPollutants = { ...closest.pollutants };
          let detectedProvenance = "CPCB Ground Telemetry · Live Station";

          try {
            const aqRes = await fetch(`/api/air-quality?lat=${latitude}&lng=${longitude}`);
            if (aqRes.ok) {
              const aqData = await aqRes.json();
              if (aqData.aqi !== undefined && aqData.aqi !== null) {
                detectedAqi = Math.round(aqData.aqi);
                const cat = getAqiCategory(detectedAqi);
                detectedStatus = cat.category;
                detectedAdvisory = getAqiAdvisory(detectedAqi);
              }
              if (aqData.pollutants) {
                detectedPollutants = {
                  pm2_5: Math.round((aqData.pollutants.pm2_5?.value ?? closest.pollutants.pm2_5) * 10) / 10,
                  pm10: Math.round((aqData.pollutants.pm10?.value ?? closest.pollutants.pm10) * 10) / 10,
                  ozone: Math.round((aqData.pollutants.ozone?.value ?? closest.pollutants.ozone) * 10) / 10,
                  no2: Math.round((aqData.pollutants.no2?.value ?? closest.pollutants.no2) * 10) / 10,
                  so2: Math.round((aqData.pollutants.so2?.value ?? closest.pollutants.so2) * 10) / 10,
                  co: Math.round((aqData.pollutants.co?.value ?? closest.pollutants.co) * 10) / 10,
                };
              }
              if (aqData.source?.station) {
                detectedProvenance = `${aqData.source.station} · Live Telemetry`;
              }
            }
          } catch {
            // fallback
          }

          const detectedSpot: SpatialHotspot = {
            id: `user-loc-${Math.round(latitude * 100)}-${Math.round(longitude * 100)}`,
            name: placeName,
            state: adminName || closest.state,
            country: countryName || closest.country,
            continent: "Asia",
            lat: latitude,
            lng: longitude,
            aqi: detectedAqi,
            status: detectedStatus,
            advisory: detectedAdvisory,
            pollutants: detectedPollutants,
            provenance: detectedProvenance,
            updatedAt: "Live Real-Time Telemetry",
          };

          setActiveHotspot(detectedSpot);
          if (onSelectCity) onSelectCity(detectedSpot);

          // Place pulsing GPS marker on map
          if (mapInstanceRef.current) {
            import("leaflet").then((L) => {
              if (!mapInstanceRef.current) return;
              if (userMarkerRef.current) {
                userMarkerRef.current.remove();
                userMarkerRef.current = null;
              }

              const pinIcon = L.divIcon({
                className: "user-gps-pin",
                html: `
                  <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px;">
                    <span style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: #0284c7; opacity: 0.45; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
                    <span style="position: relative; width: 16px; height: 16px; border-radius: 50%; background: #0284c7; border: 3px solid #ffffff; box-shadow: 0 0 14px rgba(2, 132, 199, 0.9);"></span>
                  </div>
                `,
                iconSize: [44, 44],
                iconAnchor: [22, 22],
              });

              const marker = L.marker([latitude, longitude], { icon: pinIcon, zIndexOffset: 1200 }).addTo(mapInstanceRef.current);
              marker.bindTooltip(
                `
                  <div style="
                    background: var(--dash-surface, #1e293b);
                    color: var(--dash-ink, #f8fafc);
                    border: 1px solid rgba(2, 132, 199, 0.5);
                    border-radius: 12px;
                    padding: 8px 12px;
                    box-shadow: 0 10px 25px -4px rgba(0, 0, 0, 0.45), 0 0 14px rgba(2, 132, 199, 0.35);
                    backdrop-filter: blur(14px);
                    -webkit-backdrop-filter: blur(14px);
                    font-size: 11px;
                    font-family: inherit;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    line-height: 1.2;
                  ">
                    <span style="width: 8px; height: 8px; border-radius: 50%; background: #0284c7; box-shadow: 0 0 8px #0284c7;"></span>
                    <div>
                      <div style="font-size: 9px; font-family: monospace; font-weight: 700; text-transform: uppercase; color: #0284c7; letter-spacing: 0.05em;">Your Location</div>
                      <strong style="font-size: 13px; font-weight: 800;">${placeName}</strong>
                    </div>
                  </div>
                `,
                {
                  permanent: false,
                  direction: "top",
                  offset: [0, -14],
                  className: "custom-telemetry-tooltip",
                }
              );
              userMarkerRef.current = marker;

              if (flyImmediately) {
                mapInstanceRef.current.flyTo([latitude, longitude], 7, { duration: 1.2 });
              }
            });
          }

          setIsLocating(false);
          setUserLocationDetected(true);
        },
        (err) => {
          console.warn("Geolocation skipped or denied:", err.message);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    },
    [hotspots, onSelectCity]
  );

  // Auto-Detect Location on Initial Mount
  useEffect(() => {
    if (!autoDetectTriggeredRef.current) {
      autoDetectTriggeredRef.current = true;
      detectUserLocation(true);
    }
  }, [detectUserLocation]);

  // Ingest live real-time global hotspots from API endpoint
  useEffect(() => {
    let canceled = false;
    setLiveUpdating(true);

    fetch("/api/hotspots")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!canceled && data?.hotspots && Array.isArray(data.hotspots)) {
          setHotspots(data.hotspots);

          // If active city is in the new live data, update its telemetry
          setActiveHotspot((prev) => {
            const found = data.hotspots.find(
              (h: SpatialHotspot) =>
                h.id === prev.id || h.name.toLowerCase() === prev.name.toLowerCase()
            );
            return found || prev;
          });
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!canceled) setLiveUpdating(false);
      });

    return () => {
      canceled = true;
    };
  }, []);

  // Sync when prop changes
  useEffect(() => {
    if (selectedCity && selectedCity.id !== activeHotspot.id) {
      setActiveHotspot(selectedCity);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([selectedCity.lat, selectedCity.lng], 6, { duration: 1.0 });
      }
    }
  }, [selectedCity, activeHotspot.id]);

  // Seamlessly switch tile layers when theme changes (Light vs Dark)
  useEffect(() => {
    if (baseTileRef.current && refTileRef.current) {
      const isLightMode = theme === "light";
      const baseTileUrl = isLightMode
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        : "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";
      const refTileUrl = isLightMode
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
        : "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}";

      baseTileRef.current.setUrl(baseTileUrl);
      refTileRef.current.setUrl(refTileUrl);
    }
  }, [theme]);

  // Render glowing markers on map
  const renderMarkers = useCallback(
    (
      L: typeof import("leaflet"),
      map: LeafletMap,
      list: SpatialHotspot[],
      layer: MapLayerKey,
      showWeather: boolean,
      showHeatmap: boolean
    ) => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      list.forEach((spot) => {
        const metric = getLayerMetric(spot, layer);
        const weather = spot.weather || {
          temp: Math.round(24 + Math.sin(spot.lat * 0.1) * 8),
          humidity: Math.round(48 + Math.cos(spot.lng * 0.1) * 18),
          windSpeed: Math.round(8 + Math.abs(Math.sin(spot.lat * 0.2)) * 10),
          windDirection: Math.round(Math.abs(spot.lat * 19 + spot.lng * 23) % 360),
          condition: spot.aqi > 150 ? "Hazy Smog" : "Partly Cloudy",
        };
        const cardinal = getCardinalDirection(weather.windDirection);

        // 1. Semi-transparent regional heatmap layer (visible when Heatmap overlay is clicked)
        // Kept delicately transparent so country borders, roads, and cities remain completely visible
        if (showHeatmap) {
          const heatOuter = L.circle([spot.lat, spot.lng], {
            radius: 340000 + metric.intensityRatio * 150000,
            color: metric.color,
            fillColor: metric.color,
            fillOpacity: 0.08,
            weight: 0,
            interactive: false,
          }).addTo(map);

          const heatInner = L.circle([spot.lat, spot.lng], {
            radius: 170000 + metric.intensityRatio * 80000,
            color: metric.color,
            fillColor: metric.color,
            fillOpacity: 0.13,
            weight: 0,
            interactive: false,
          }).addTo(map);

          markersRef.current.push(heatOuter, heatInner);
        }

        // 2. Base Heat Halo (compact local footprint)
        const haloRadius = Math.round(35000 + metric.intensityRatio * 45000);
        const halo = L.circle([spot.lat, spot.lng], {
          radius: haloRadius,
          color: metric.color,
          fillColor: metric.color,
          fillOpacity: showHeatmap ? 0.20 : 0.28 + metric.intensityRatio * 0.12,
          weight: 0,
        }).addTo(map);
        markersRef.current.push(halo);

        // 3. Optional Weather overlay pill
        let weatherPillHtml = "";
        if (showWeather) {
          const icon = weather.temp > 32 ? "☀️" : weather.temp < 15 ? "❄️" : "⛅";
          weatherPillHtml = `
            <div style="
              position: absolute;
              top: -20px;
              white-space: nowrap;
              background: rgba(15, 23, 42, 0.88);
              color: #f8fafc;
              border: 1px solid rgba(255, 255, 255, 0.25);
              border-radius: 9999px;
              padding: 1.5px 6px;
              font-size: 9px;
              font-family: monospace;
              font-weight: 700;
              box-shadow: 0 2px 6px rgba(0,0,0,0.35);
              display: flex;
              align-items: center;
              gap: 3px;
              pointer-events: none;
            ">
              <span>${icon}</span>
              <span>${weather.temp}°C</span>
              <span style="opacity: 0.7; font-size: 8px;">${weather.humidity}%</span>
            </div>
          `;
        }

        // Interactive pulsating hotspot icon with metric value & color
        const customIcon = L.divIcon({
          className: "custom-aqi-hotspot-pin",
          html: `
            <div style="
              position: relative;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              width: 50px;
              height: 50px;
              cursor: pointer;
            " title="${spot.name}, ${spot.country}: ${metric.metricLabel} ${metric.formattedValue} ${metric.unit} | Weather: ${weather.temp}°C, Wind: ${weather.windSpeed} km/h ${cardinal}">
              ${weatherPillHtml}
              <div style="position: relative; display: flex; align-items: center; justify-content: center;">
                <span style="
                  position: absolute;
                  width: 32px;
                  height: 32px;
                  border-radius: 50%;
                  background: ${metric.color};
                  opacity: 0.45;
                  animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
                "></span>
                <span style="
                  position: relative;
                  padding: 2px 6px;
                  min-width: 28px;
                  height: 20px;
                  border-radius: 10px;
                  background: ${metric.color};
                  border: 2px solid #ffffff;
                  box-shadow: 0 0 12px ${metric.color};
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 10px;
                  font-family: monospace;
                  font-weight: 800;
                  color: white;
                  white-space: nowrap;
                ">
                  ${Math.round(metric.value)}
                </span>
              </div>
            </div>
          `,
          iconSize: [50, 50],
          iconAnchor: [25, 25],
        });

        const marker = L.marker([spot.lat, spot.lng], { icon: customIcon }).addTo(map);

        // Enhanced Glassmorphic Telemetry HUD Tooltip on Hover
        marker.bindTooltip(
          `
            <div style="
              min-width: 220px;
              background: var(--dash-surface, #1e293b);
              color: var(--dash-ink, #f8fafc);
              border: 1px solid var(--dash-rule, rgba(255, 255, 255, 0.15));
              border-radius: 14px;
              padding: 11px 13px;
              box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.5), 0 0 16px -2px ${metric.color}40;
              backdrop-filter: blur(16px);
              -webkit-backdrop-filter: blur(16px);
              font-family: inherit;
              pointer-events: none;
              line-height: 1.35;
            ">
              <!-- Top Row: Location & Country -->
              <div style="display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 7px;">
                <span style="font-size: 14px; font-weight: 800; letter-spacing: -0.01em;">
                  ${spot.name}
                </span>
                <span style="font-size: 9px; font-family: monospace; font-weight: 700; text-transform: uppercase; opacity: 0.55; letter-spacing: 0.05em;">
                  ${spot.country}
                </span>
              </div>

              <!-- Active Metric Chip -->
              <div style="
                background: linear-gradient(135deg, ${metric.color}22, transparent);
                border: 1px solid ${metric.color}45;
                border-radius: 9px;
                padding: 6px 9px;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                justify-content: space-between;
              ">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="width: 7px; height: 7px; border-radius: 50%; background: ${metric.color}; box-shadow: 0 0 6px ${metric.color};"></span>
                  <span style="font-size: 10px; font-family: monospace; font-weight: 700; text-transform: uppercase;">
                    ${metric.metricLabel}
                  </span>
                </div>
                <div style="text-align: right;">
                  <span style="font-size: 13px; font-weight: 900; font-family: monospace; color: ${metric.color};">
                    ${metric.formattedValue} ${metric.unit}
                  </span>
                  <span style="font-size: 9px; font-weight: 700; color: ${metric.color}; margin-left: 4px;">
                    · ${metric.category}
                  </span>
                </div>
              </div>

              <!-- Atmospheric & Weather Telemetry Grid -->
              <div style="
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 5px;
                padding-top: 6px;
                border-top: 1px solid var(--dash-rule, rgba(255, 255, 255, 0.1));
                font-size: 10px;
                font-family: monospace;
                color: var(--dash-muted, #94a3b8);
              ">
                <div style="display: flex; align-items: center; gap: 4px;">
                  <span>🌡️</span>
                  <strong style="color: var(--dash-ink, #f8fafc);">${weather.temp}°C</strong>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                  <span>💧</span>
                  <strong style="color: var(--dash-ink, #f8fafc);">${weather.humidity}%</strong>
                </div>
                <div style="grid-column: 1 / -1; display: flex; align-items: center; gap: 4px; padding-top: 2px;">
                  <span>💨</span>
                  <strong style="color: var(--dash-ink, #f8fafc);">${weather.windSpeed} km/h ${cardinal}</strong>
                  <span style="opacity: 0.65; font-size: 9px;">(${weather.windDirection}°)</span>
                </div>
              </div>

              <!-- Footer Prompt -->
              <div style="margin-top: 7px; padding-top: 5px; border-top: 1px solid var(--dash-rule, rgba(255, 255, 255, 0.08)); font-size: 9px; font-family: monospace; opacity: 0.65; text-align: center;">
                Click pin to inspect full telemetry →
              </div>
            </div>
          `,
          {
            direction: "top",
            offset: [0, -14],
            className: "custom-telemetry-tooltip",
          }
        );

        marker.on("click", () => {
          setActiveHotspot(spot);
          if (onSelectCity) onSelectCity(spot);
          map.flyTo([spot.lat, spot.lng], 6, { duration: 0.8 });
        });

        markersRef.current.push(marker);
      });
    },
    [onSelectCity]
  );

  // Subtle, fluid Canvas Wind Streamline Particle Animation
  useEffect(() => {
    const canvas = windCanvasRef.current;
    if (!canvas) return;

    if (!windOverlay) {
      if (windAnimFrameRef.current) {
        cancelAnimationFrame(windAnimFrameRef.current);
        windAnimFrameRef.current = null;
      }
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const map = mapInstanceRef.current;
    if (!map) return;

    // Resize canvas to match display size
    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateSize();

    // Wind vector calculation based on meteorological vectors across regions
    const getVector = (lat: number, lng: number) => {
      let baseAngle = 135;
      if (lat >= 24 && lng >= 73 && lng <= 88) {
        // Indo-Gangetic basin NW to SE winter flow
        baseAngle = 120 + Math.sin(lng * 0.4) * 14;
      } else if (lat < 22 && lng > 83) {
        // Bay of Bengal cyclonic/NE monsoon curve towards SW
        baseAngle = 215 + Math.sin(lat * 0.5) * 16;
      } else if (lat < 22 && lng < 74) {
        // Arabian Sea NNE to SSW flow
        baseAngle = 205 + Math.cos(lat * 0.5) * 14;
      } else if (lat >= 13 && lat < 25 && lng >= 74 && lng <= 83) {
        // Central Indian plateau flow
        baseAngle = 230 + Math.sin(lat * 0.3) * 10;
      } else if (lat < 13) {
        // Peninsular tip & Sri Lanka easterly flow
        baseAngle = 245 + Math.cos(lng * 0.4) * 8;
      } else {
        baseAngle = Math.round((lat * 13 + lng * 17) % 360);
      }

      // Compass bearing to screen Cartesian deltas
      const rad = (baseAngle * Math.PI) / 180;
      const speed = 1.4 + Math.abs(Math.sin(lat * 0.2 + lng * 0.1)) * 0.9;
      return {
        dx: Math.sin(rad) * speed,
        dy: -Math.cos(rad) * speed,
      };
    };

    // Particle pool: 240 subtle, organic drifting wind particles
    const PARTICLE_COUNT = 240;
    interface WindParticle {
      x: number;
      y: number;
      age: number;
      maxAge: number;
    }

    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    const particles: WindParticle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        age: Math.floor(Math.random() * 60),
        maxAge: 45 + Math.floor(Math.random() * 45),
      });
    }

    const isLight = theme === "light";
    // Subtle, semi-transparent strokes: soft slate-cyan in light mode, luminous mint in dark mode
    const strokeColor = isLight ? "rgba(51, 65, 85, 0.42)" : "rgba(110, 231, 183, 0.48)";

    let isRunning = true;

    const animate = () => {
      if (!isRunning) return;

      // Soft fading trail creating smooth streamline drift
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.35;
      ctx.lineCap = "round";

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Convert screen pixel to LatLng via Leaflet
        let lat = 20;
        let lng = 78;
        try {
          const ll = map.containerPointToLatLng([p.x, p.y]);
          lat = ll.lat;
          lng = ll.lng;
        } catch {
          // Off-screen or projection boundary fallback
        }

        const v = getVector(lat, lng);
        const nextX = p.x + v.dx;
        const nextY = p.y + v.dy;

        // Draw line segment
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(nextX, nextY);
        ctx.stroke();

        p.x = nextX;
        p.y = nextY;
        p.age++;

        // Reset if expired or out of bounds
        if (p.age >= p.maxAge || p.x < 0 || p.x > w || p.y < 0 || p.y > h) {
          p.x = Math.random() * w;
          p.y = Math.random() * h;
          p.age = 0;
          p.maxAge = 45 + Math.floor(Math.random() * 45);
        }
      }

      windAnimFrameRef.current = requestAnimationFrame(animate);
    };

    windAnimFrameRef.current = requestAnimationFrame(animate);

    // On map movement or zoom, clear canvas & reseed particles
    const handleMapChange = () => {
      updateSize();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const newRect = canvas.getBoundingClientRect();
      for (const p of particles) {
        p.x = Math.random() * newRect.width;
        p.y = Math.random() * newRect.height;
        p.age = Math.floor(Math.random() * 30);
      }
    };

    map.on("move", handleMapChange);
    map.on("zoom", handleMapChange);
    map.on("resize", handleMapChange);

    return () => {
      isRunning = false;
      if (windAnimFrameRef.current) {
        cancelAnimationFrame(windAnimFrameRef.current);
        windAnimFrameRef.current = null;
      }
      map.off("move", handleMapChange);
      map.off("zoom", handleMapChange);
      map.off("resize", handleMapChange);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [windOverlay, theme]);

  // Update markers when hotspots, active layer, or overlays change
  useEffect(() => {
    if (mapInstanceRef.current) {
      import("leaflet").then((L) => {
        if (mapInstanceRef.current) {
          renderMarkers(
            L,
            mapInstanceRef.current,
            hotspots,
            activeLayer,
            weatherOverlay,
            heatmapOverlay
          );
        }
      });
    }
  }, [hotspots, activeLayer, weatherOverlay, heatmapOverlay, renderMarkers]);

  // Initialize Leaflet Map safely in React 18/19 StrictMode
  useEffect(() => {
    let canceled = false;
    const currentContainer = mapContainerRef.current as LeafletContainer | null;

    async function initMap() {
      const container = mapContainerRef.current as LeafletContainer | null;
      if (!container) return;

      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {
          // ignore
        }
        mapInstanceRef.current = null;
      }

      if (container._leaflet_id) {
        delete container._leaflet_id;
        container.innerHTML = "";
      }

      const L = await import("leaflet");
      if (canceled || !mapContainerRef.current) return;

      const targetContainer = mapContainerRef.current as LeafletContainer;
      if (targetContainer._leaflet_id) {
        delete targetContainer._leaflet_id;
        targetContainer.innerHTML = "";
      }

      // Initial center centered directly on India
      const map = L.map(targetContainer, {
        center: [22.0, 79.0],
        zoom: 4.5,
        minZoom: 2,
        maxZoom: 16,
        zoomControl: false,
        attributionControl: false,
      });

      const isLightMode = theme === "light";
      const baseTileUrl = isLightMode
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        : "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";
      const refTileUrl = isLightMode
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
        : "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}";

      // 100% Free, High-Performance Cartography (Esri Canvas: No API Key, No Watermark)
      const baseTile = L.tileLayer(baseTileUrl, {
        maxZoom: 16,
        attribution: "Esri, HERE, Garmin, OpenStreetMap",
      }).addTo(map);

      // Clean Sharp Country & City Reference Labels
      const refTile = L.tileLayer(refTileUrl, {
        maxZoom: 16,
        pane: "shadowPane",
      }).addTo(map);

      baseTileRef.current = baseTile;
      refTileRef.current = refTile;

      // Custom zoom control in bottom right
      L.control.zoom({ position: "bottomright" }).addTo(map);

      mapInstanceRef.current = map;

      renderMarkers(
        L,
        map,
        hotspots,
        activeLayer,
        weatherOverlay,
        heatmapOverlay
      );

      // Enable clicking anywhere on the map to inspect real-time telemetry for that place
      map.on("click", async (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        // Check if user clicked close to an existing hotspot
        let closestSpot: SpatialHotspot | null = null;
        let minDistance = Infinity;
        for (const h of hotspots) {
          const dist = Math.hypot(h.lat - lat, h.lng - lng);
          if (dist < minDistance) {
            minDistance = dist;
            closestSpot = h;
          }
        }

        if (closestSpot && minDistance < 0.45) {
          setActiveHotspot(closestSpot);
          if (onSelectCity) onSelectCity(closestSpot);
          map.flyTo([closestSpot.lat, closestSpot.lng], 6, { duration: 0.8 });
          return;
        }

        map.panTo([lat, lng], { animate: true, duration: 0.6 });

        const tempSpot: SpatialHotspot = {
          id: `point-${lat.toFixed(2)}-${lng.toFixed(2)}`,
          name: "Inspecting location…",
          state: `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? "N" : "S"}`,
          country: `${Math.abs(lng).toFixed(2)}° ${lng >= 0 ? "E" : "W"}`,
          continent: "Asia",
          lat,
          lng,
          aqi: 65,
          status: "Moderate",
          advisory: "Retrieving atmospheric telemetry for selected coordinates…",
          pollutants: { pm2_5: 20, pm10: 42, ozone: 32, no2: 22, so2: 10, co: 410 },
          provenance: "Live Telemetry",
          updatedAt: "Live Real-Time Telemetry",
        };
        setActiveHotspot(tempSpot);

        try {
          const [geoRes, airRes] = await Promise.all([
            fetch(`/api/geocode?lat=${lat}&lng=${lng}`),
            fetch(`/api/air-quality?lat=${lat}&lng=${lng}`),
          ]);

          const geoData = geoRes.ok ? await geoRes.json() : null;
          const airData = airRes.ok ? await airRes.json() : null;

          const placeName = geoData?.name || `Location (${Math.abs(lat).toFixed(1)}°${lat >= 0 ? "N" : "S"}, ${Math.abs(lng).toFixed(1)}°${lng >= 0 ? "E" : "W"})`;
          const adminName = geoData?.admin || "Selected region";
          const countryName = geoData?.country || "";
          const resolvedAqi = airData?.current?.aqi ?? 65;

          const resolvedSpot: SpatialHotspot = {
            id: `point-${lat.toFixed(2)}-${lng.toFixed(2)}`,
            name: placeName,
            state: adminName,
            country: countryName,
            continent: "Asia",
            lat,
            lng,
            aqi: resolvedAqi,
            status:
              resolvedAqi <= 50
                ? "Good"
                : resolvedAqi <= 100
                ? "Moderate"
                : resolvedAqi <= 150
                ? "Unhealthy for Sensitive Groups"
                : resolvedAqi <= 200
                ? "Unhealthy"
                : resolvedAqi <= 300
                ? "Very Unhealthy"
                : "Hazardous",
            advisory:
              airData?.fallbackNote ||
              (resolvedAqi <= 50
                ? "Air quality is satisfactory and poses minimal health risk."
                : resolvedAqi <= 100
                ? "Air quality is acceptable; sensitive individuals should monitor prolonged exertion."
                : resolvedAqi <= 150
                ? "Members of sensitive groups may experience health effects. General public is less affected."
                : "Everyone may begin to experience health effects. Minimize outdoor exposure."),
            pollutants: {
              pm2_5: airData?.current?.pm2_5 ?? 22,
              pm10: airData?.current?.pm10 ?? 45,
              ozone: airData?.current?.ozone ?? 34,
              no2: airData?.current?.nitrogen_dioxide ?? 24,
              so2: airData?.current?.sulphur_dioxide ?? 10,
              co: airData?.current?.carbon_monoxide ?? 420,
            },
            provenance: airData?.sourceLabel || "Live Ground Telemetry",
            updatedAt: "Live Real-Time Telemetry",
          };

          setActiveHotspot(resolvedSpot);
          if (onSelectCity) onSelectCity(resolvedSpot);
        } catch (err) {
          console.error("Error inspecting clicked location", err);
        }
      });
    }

    initMap();

    return () => {
      canceled = true;
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {
          // ignore
        }
        mapInstanceRef.current = null;
      }
      if (currentContainer && currentContainer._leaflet_id) {
        delete currentContainer._leaflet_id;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dynamically swap map tiles when user toggles light/dark theme
  useEffect(() => {
    if (!baseTileRef.current || !refTileRef.current) return;
    const isLightMode = theme === "light";
    const baseTileUrl = isLightMode
      ? "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
      : "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";
    const refTileUrl = isLightMode
      ? "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
      : "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}";

    baseTileRef.current.setUrl(baseTileUrl);
    refTileRef.current.setUrl(refTileUrl);
  }, [theme]);

  const handleContinentClick = (region: string) => {
    setActiveContinent(region);
    if (!mapInstanceRef.current) return;

    if (region === "Global") {
      mapInstanceRef.current.flyTo([22.0, 79.0], 3.8, { duration: 1.2 });
    } else if (region === "Asia") {
      mapInstanceRef.current.flyTo([22.0, 79.0], 4.5, { duration: 1.2 });
    } else if (region === "Europe") {
      mapInstanceRef.current.flyTo([50.0, 15.0], 4, { duration: 1.2 });
    } else if (region === "Americas") {
      mapInstanceRef.current.flyTo([22.0, -85.0], 3, { duration: 1.2 });
    } else if (region === "Africa") {
      mapInstanceRef.current.flyTo([5.0, 20.0], 3.2, { duration: 1.2 });
    } else if (region === "Oceania") {
      mapInstanceRef.current.flyTo([-28.0, 140.0], 4, { duration: 1.2 });
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.toLowerCase().trim();
    if (!query) return;

    const matched = hotspots.find(
      (h) =>
        h.name.toLowerCase().includes(query) ||
        h.state.toLowerCase().includes(query) ||
        h.country.toLowerCase().includes(query)
    );

    if (matched) {
      setActiveHotspot(matched);
      if (onSelectCity) onSelectCity(matched);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([matched.lat, matched.lng], 6, { duration: 1.0 });
      }
    }
  };

  const aqiInfo = getAqiCategory(activeHotspot.aqi);
  const activeMetric = getLayerMetric(activeHotspot, activeLayer);
  const scaleTiers = getScaleTiers(activeLayer, activeMetric.value);

  return (
    <div className="space-y-4 w-full">
      {/* ------------------------------------------------------------------ */}
      {/* Controls Bar: Search & Continent Navigator */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center bg-[var(--dash-surface)] px-4 py-2.5 rounded-xl border border-[var(--dash-rule)] shadow-sm w-full max-w-md transition-all focus-within:border-[var(--dash-accent)]"
        >
          <Search size={16} className="text-[var(--dash-muted)] mr-2.5 flex-none" />
          <input
            type="text"
            placeholder="Search worldwide city (e.g. New York, London, Tokyo, Delhi, Cairo)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs sm:text-sm text-[var(--dash-ink)] outline-none placeholder:text-[var(--dash-faint)]"
          />
          <button
            type="submit"
            className="ml-2 px-3 py-1 rounded-lg bg-[var(--dash-accent)] hover:opacity-90 text-white text-xs font-semibold transition-opacity"
          >
            GO
          </button>
        </form>

        {/* Global Continent Navigator Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-mono text-[var(--dash-muted)] mr-1 hidden sm:inline-flex items-center gap-1 font-bold">
            <Globe size={13} className="text-[var(--dash-accent)]" /> REGION:
          </span>
          {["Global", "Asia", "Europe", "Americas", "Africa", "Oceania"].map((region) => (
            <button
              key={region}
              type="button"
              onClick={() => handleContinentClick(region)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                activeContinent === region
                  ? "bg-[var(--dash-accent)] text-white shadow-sm"
                  : "bg-[var(--dash-surface)] hover:bg-[var(--dash-surface-soft)] text-[var(--dash-muted)] border border-[var(--dash-rule)]"
              }`}
            >
              {region}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 self-start lg:self-center">
          <span className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--dash-surface)] border border-[var(--dash-rule)] text-xs font-mono text-[var(--dash-muted)] shadow-sm">
            <span
              className={`w-2 h-2 rounded-full ${
                liveUpdating ? "bg-amber-400 animate-spin" : "bg-emerald-500 animate-pulse"
              }`}
            />
            {liveUpdating ? "Ingesting Feeds..." : "CPCB · OpenAQ · WAQI Live"}
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 1. Dedicated Leaflet Container (Clean Bounds & Theme-Adaptive Cartography) */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative w-full h-[650px] rounded-2xl overflow-hidden border border-[var(--dash-rule)] shadow-xl bg-[var(--dash-surface-soft)]">
        {/* Full Spatial Map Canvas */}
        <div ref={mapContainerRef} className="absolute inset-0 z-0 w-full h-full" />

        {/* Subtle Fluid Animated Wind Vector Streamlines Overlay */}
        <canvas
          ref={windCanvasRef}
          className={`absolute inset-0 z-10 w-full h-full pointer-events-none transition-opacity duration-300 ${
            windOverlay ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* ------------------------------------------------------------------ */}
        {/* Left Floating Drawer: Absolute Pinning with Theme Adaptive Card */}
        {/* ------------------------------------------------------------------ */}
        <div className="absolute top-4 left-4 z-20 w-full max-w-sm backdrop-blur-md bg-[var(--dash-surface)]/95 border border-[var(--dash-rule)] text-[var(--dash-ink)] rounded-2xl shadow-2xl p-4 sm:p-5 space-y-3.5 pointer-events-auto max-h-[618px] overflow-y-auto scrollbar-thin">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--dash-rule)] pb-2.5">
            <div>
              <h2 className="text-xl font-extrabold text-[var(--dash-ink)] tracking-tight">
                {activeHotspot.name}
              </h2>
              <span className="text-[10px] font-mono tracking-wider uppercase text-[var(--dash-muted)] font-semibold">
                {activeHotspot.state ? `${activeHotspot.state}, ` : ""}{activeHotspot.country}
              </span>
            </div>
          </div>

          {/* Big AQI Banner with City Landmark Art & Provenance Badge (Image 2) */}
          <div
            className="p-4 sm:p-5 rounded-2xl border border-[var(--dash-rule)] relative overflow-hidden flex flex-col justify-between shadow-sm min-h-[145px]"
            style={{
              background: `linear-gradient(135deg, ${aqiInfo.bg}, transparent)`,
            }}
          >
            {/* Architectural Monument Line-Art in Background (Image 2) */}
            <div className="absolute right-0 bottom-0 w-3/4 h-full pointer-events-none opacity-30 dark:opacity-20 flex items-end justify-end overflow-hidden pr-1 pb-0.5">
              {getCityLandmarkSvg(activeHotspot.name, aqiInfo.color)}
            </div>

            <div className="relative z-10">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--dash-muted)]">
                AQI
              </span>
              <div className="flex items-baseline gap-2.5 mt-0.5">
                <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight" style={{ color: aqiInfo.color }}>
                  {activeHotspot.aqi}
                </span>
                <span className="text-base sm:text-lg font-bold" style={{ color: aqiInfo.color }}>
                  {activeHotspot.status}
                </span>
              </div>
            </div>

            {/* Provenance Pill Badge (Image 2) */}
            <div className="relative z-10 mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--dash-surface)]/90 border border-[var(--dash-rule)] backdrop-blur-md self-start text-[11px] font-mono text-[var(--dash-ink)] shadow-xs">
              <span>US AQI - forecast model - as of {liveTimeFormatted}</span>
            </div>
          </div>

          {/* Health Advisory Box */}
          <div className="p-3 rounded-lg bg-[var(--dash-surface-soft)] border border-[var(--dash-rule)] text-[var(--dash-ink)]">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--dash-accent)] block mb-1">
              ATMOSPHERIC HEALTH ADVISORY
            </span>
            <p className="text-xs leading-relaxed text-[var(--dash-muted)]">
              {activeHotspot.advisory}
            </p>
          </div>

          {/* Regional Weather Details when Weather Overlay is Active */}
          {weatherOverlay && (
            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-[var(--dash-ink)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 flex items-center gap-1">
                  <span>🌡️</span> REGIONAL WEATHER
                </span>
                <span className="text-[10px] font-mono text-[var(--dash-muted)]">
                  {activeHotspot.weather?.condition || "Live"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-0.5">
                <div className="p-1.5 rounded-lg bg-[var(--dash-surface)] border border-[var(--dash-rule)]">
                  <span className="text-[9px] font-mono text-[var(--dash-muted)] block uppercase">Temp</span>
                  <span className="text-sm font-mono font-extrabold text-[var(--dash-ink)]">
                    {activeHotspot.weather?.temp ?? 26}°C
                  </span>
                </div>
                <div className="p-1.5 rounded-lg bg-[var(--dash-surface)] border border-[var(--dash-rule)]">
                  <span className="text-[9px] font-mono text-[var(--dash-muted)] block uppercase">Humidity</span>
                  <span className="text-sm font-mono font-extrabold text-[var(--dash-ink)]">
                    {activeHotspot.weather?.humidity ?? 48}%
                  </span>
                </div>
                <div className="p-1.5 rounded-lg bg-[var(--dash-surface)] border border-[var(--dash-rule)]">
                  <span className="text-[9px] font-mono text-[var(--dash-muted)] block uppercase">Wind</span>
                  <span className="text-xs font-mono font-extrabold text-sky-600 dark:text-sky-400 block truncate">
                    {activeHotspot.weather?.windSpeed ?? 10} km/h
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Active Heatmap indicator */}
          {heatmapOverlay && (
            <div className="px-3 py-1.5 rounded-lg bg-[var(--dash-surface-soft)] border border-[var(--dash-rule)] text-[10px] font-mono text-[var(--dash-muted)] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeMetric.color }} />
                <span>Heatmap: <strong>{activeMetric.metricLabel}</strong></span>
              </span>
              <span className="font-bold" style={{ color: activeMetric.color }}>
                {activeMetric.category}
              </span>
            </div>
          )}

          {/* Individual Pollutants Progress Bars */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-[var(--dash-muted)] border-b border-[var(--dash-rule)] pb-1">
              <span>Pollutant</span>
              <span>Concentration</span>
            </div>

            {/* PM2.5 */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-[var(--dash-ink)] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> PM2.5
              </span>
              <span className="font-mono text-[var(--dash-muted)]">{activeHotspot.pollutants.pm2_5} µg/m³</span>
            </div>
            <div className="w-full bg-[var(--dash-surface-soft)] h-1.5 rounded-full overflow-hidden border border-[var(--dash-rule)]">
              <div
                className="bg-rose-500 h-full rounded-full"
                style={{ width: `${Math.min(100, (activeHotspot.pollutants.pm2_5 / 150) * 100)}%` }}
              />
            </div>

            {/* PM10 */}
            <div className="flex items-center justify-between gap-3 text-xs mt-2">
              <span className="font-semibold text-[var(--dash-ink)] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> PM10
              </span>
              <span className="font-mono text-[var(--dash-muted)]">{activeHotspot.pollutants.pm10} µg/m³</span>
            </div>
            <div className="w-full bg-[var(--dash-surface-soft)] h-1.5 rounded-full overflow-hidden border border-[var(--dash-rule)]">
              <div
                className="bg-amber-500 h-full rounded-full"
                style={{ width: `${Math.min(100, (activeHotspot.pollutants.pm10 / 250) * 100)}%` }}
              />
            </div>

            {/* Ozone */}
            <div className="flex items-center justify-between gap-3 text-xs mt-2">
              <span className="font-semibold text-[var(--dash-ink)] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Ozone (O₃)
              </span>
              <span className="font-mono text-[var(--dash-muted)]">{activeHotspot.pollutants.ozone} µg/m³</span>
            </div>

            {/* NO2 */}
            <div className="flex items-center justify-between gap-3 text-xs mt-2">
              <span className="font-semibold text-[var(--dash-ink)] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500" /> Nitrogen Dioxide (NO₂)
              </span>
              <span className="font-mono text-[var(--dash-muted)]">{activeHotspot.pollutants.no2} µg/m³</span>
            </div>

            {/* SO2 */}
            <div className="flex items-center justify-between gap-3 text-xs mt-2">
              <span className="font-semibold text-[var(--dash-ink)] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500" /> Sulphur Dioxide (SO₂)
              </span>
              <span className="font-mono text-[var(--dash-muted)]">{activeHotspot.pollutants.so2} µg/m³</span>
            </div>

            {/* CO */}
            <div className="flex items-center justify-between gap-3 text-xs mt-2">
              <span className="font-semibold text-[var(--dash-ink)] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" /> Carbon Monoxide (CO)
              </span>
              <span className="font-mono text-[var(--dash-muted)]">{activeHotspot.pollutants.co} µg/m³</span>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Top Right GPS Location Target Button (Image 1) */}
        {/* ------------------------------------------------------------------ */}
        <div className="absolute top-4 right-54 sm:right-56 z-20 pointer-events-auto">
          <button
            type="button"
            onClick={() => detectUserLocation(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl backdrop-blur-md bg-[var(--dash-surface)]/95 border border-[var(--dash-rule)] text-[var(--dash-ink)] hover:text-[var(--dash-accent)] shadow-xl transition-all active:scale-95 text-xs font-mono font-bold"
            title="Detect my physical location and view real-time readings"
          >
            <Navigation
              size={14}
              className={`text-[var(--dash-accent)] transition-transform ${isLocating ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">
              {isLocating ? "Locating..." : userLocationDetected ? "My Location" : "Detect Location"}
            </span>
          </button>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Right Floating Map Layers Panel */}
        {/* ------------------------------------------------------------------ */}
        <div className="absolute top-4 right-4 z-20 backdrop-blur-md bg-[var(--dash-surface)]/95 border border-[var(--dash-rule)] rounded-2xl p-4 text-[var(--dash-ink)] shadow-2xl w-48 space-y-3 pointer-events-auto">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--dash-muted)] block border-b border-[var(--dash-rule)] pb-1.5">
            MAP LAYERS
          </span>

          <div className="space-y-1.5">
            {[
              { id: "aqi", label: "Air Quality (AQI)" },
              { id: "pm2_5", label: "PM2.5" },
              { id: "pm10", label: "PM10" },
              { id: "ozone", label: "Ozone (O₃)" },
              { id: "no2", label: "NO₂" },
              { id: "so2", label: "SO₂" },
              { id: "co", label: "CO" },
            ].map((layer) => (
              <label
                key={layer.id}
                className={`flex items-center gap-2.5 text-xs cursor-pointer p-1.5 rounded-lg transition-colors ${
                  activeLayer === layer.id ? "bg-[var(--dash-surface-soft)] text-[var(--dash-accent)] font-semibold" : "text-[var(--dash-muted)] hover:bg-[var(--dash-surface-soft)]"
                }`}
              >
                <input
                  type="radio"
                  name="map-layer"
                  value={layer.id}
                  checked={activeLayer === layer.id}
                  onChange={() => setActiveLayer(layer.id as MapLayerKey)}
                  className="accent-[var(--dash-accent)]"
                />
                <span>{layer.label}</span>
              </label>
            ))}
          </div>

          <div className="pt-2 border-t border-[var(--dash-rule)] space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--dash-muted)] block">
              OVERLAYS
            </span>
            <div className="flex items-center justify-between text-xs text-[var(--dash-muted)]">
              <span className="flex items-center gap-1.5 font-medium">
                <span>🌡️</span> Weather
              </span>
              <input
                type="checkbox"
                checked={weatherOverlay}
                onChange={(e) => setWeatherOverlay(e.target.checked)}
                className="accent-[var(--dash-accent)] cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-[var(--dash-muted)]">
              <span className="flex items-center gap-1.5 font-medium">
                <span>💨</span> Wind Direction
              </span>
              <input
                type="checkbox"
                checked={windOverlay}
                onChange={(e) => setWindOverlay(e.target.checked)}
                className="accent-[var(--dash-accent)] cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-[var(--dash-muted)]">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 shadow-xs" />
                Heatmap
              </span>
              <input
                type="checkbox"
                checked={heatmapOverlay}
                onChange={(e) => setHeatmapOverlay(e.target.checked)}
                className="accent-[var(--dash-accent)] cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Multi-Metric Scale Bar: Cleanly Placed Directly Underneath Map Canvas */}
      {/* ------------------------------------------------------------------ */}
      <div className="w-full p-4 sm:p-5 rounded-2xl border border-[var(--dash-rule)] bg-[var(--dash-surface)] backdrop-blur-md shadow-sm text-[var(--dash-ink)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--dash-ink)]">
            <span className="uppercase">{activeMetric.metricLabel} INTENSITY SCALE ({activeMetric.unit})</span>
            <Info size={13} className="text-[var(--dash-muted)]" />
          </div>
          <span className="text-[11px] font-mono text-[var(--dash-muted)]">
            Selected City: <strong className="text-[var(--dash-ink)]">{activeHotspot.name}</strong> ({activeHotspot.country}) ·{" "}
            <span style={{ color: activeMetric.color }} className="font-semibold">
              {activeMetric.metricLabel}: {activeMetric.formattedValue} {activeMetric.unit} ({activeMetric.category})
            </span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
          {scaleTiers.map((tier) => (
            <div
              key={tier.range}
              className={`p-3 rounded-xl border text-center transition-all ${
                tier.active
                  ? "border-[var(--dash-accent)] shadow-md bg-[var(--dash-surface-soft)] scale-102 z-10"
                  : "border-[var(--dash-rule)] bg-[var(--dash-surface)] opacity-85"
              }`}
            >
              <span
                className="w-full h-1.5 rounded-full inline-block mb-1.5"
                style={{ backgroundColor: tier.color }}
              />
              <span className="text-xs font-mono font-bold text-[var(--dash-ink)] block">
                {tier.range}
              </span>
              <span className="text-[11px] text-[var(--dash-muted)] font-medium leading-tight line-clamp-1 mt-0.5">
                {tier.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default OverviewSpatialMap;
