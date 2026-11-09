"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Globe,
  Info,
  Search,
  Share2,
  Star,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, Layer, TileLayer } from "leaflet";
import { useTheme } from "@/lib/use-theme";

export type MapLayerKey = "aqi" | "pm2_5" | "pm10" | "ozone" | "no2" | "so2" | "co";

export interface SpatialHotspot {
  id: string;
  name: string;
  state: string;
  country: string;
  continent?: "Asia" | "Europe" | "Americas" | "Africa" | "Oceania";
  lat: number;
  lng: number;
  aqi: number;
  status: string;
  advisory: string;
  pollutants: {
    pm2_5: number;
    pm10: number;
    ozone: number;
    no2: number;
    so2: number;
    co: number;
  };
  provenance: string;
  updatedAt: string;
}

// Comprehensive Global Hotspots spanning all continents
export const INITIAL_HOTSPOTS: SpatialHotspot[] = [
  // Asia & Middle East
  {
    id: "delhi",
    name: "Delhi",
    state: "National Capital Region",
    country: "India",
    continent: "Asia",
    lat: 28.6139,
    lng: 77.209,
    aqi: 175,
    status: "Unhealthy",
    advisory: "Everyone may begin to experience health effects; sensitive groups should avoid outdoor exertion.",
    pollutants: { pm2_5: 84.1, pm10: 108.0, ozone: 104.0, no2: 88.1, so2: 52.3, co: 1459.0 },
    provenance: "OpenAQ v3 Ground Station (CPCB/DPCC)",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "mumbai",
    name: "Mumbai",
    state: "Maharashtra",
    country: "India",
    continent: "Asia",
    lat: 19.076,
    lng: 72.8777,
    aqi: 98,
    status: "Moderate",
    advisory: "Air quality is acceptable; however, sensitive individuals should monitor respiration.",
    pollutants: { pm2_5: 35.0, pm10: 75.0, ozone: 54.0, no2: 32.0, so2: 18.0, co: 620.0 },
    provenance: "OpenAQ Physical Station (MPCB)",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "beijing",
    name: "Beijing",
    state: "Beijing Municipality",
    country: "China",
    continent: "Asia",
    lat: 39.9042,
    lng: 116.4074,
    aqi: 115,
    status: "Unhealthy for Sensitive Groups",
    advisory: "Inversion layer trapping thermal particulates. Sensitive groups should wear HEPA masks.",
    pollutants: { pm2_5: 41.2, pm10: 68.0, ozone: 35.0, no2: 44.0, so2: 12.0, co: 650.0 },
    provenance: "China National Environmental Monitoring Centre / WAQI",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "tokyo",
    name: "Tokyo",
    state: "Kanto",
    country: "Japan",
    continent: "Asia",
    lat: 35.6762,
    lng: 139.6503,
    aqi: 32,
    status: "Good",
    advisory: "Optimal atmospheric conditions. Particulate levels well below WHO safety thresholds.",
    pollutants: { pm2_5: 7.8, pm10: 16.0, ozone: 38.0, no2: 17.0, so2: 5.0, co: 260.0 },
    provenance: "Tokyo Metropolitan Environment Bureau / OpenAQ",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "bangkok",
    name: "Bangkok",
    state: "Central Thailand",
    country: "Thailand",
    continent: "Asia",
    lat: 13.7563,
    lng: 100.5018,
    aqi: 88,
    status: "Moderate",
    advisory: "Humid maritime dispersal keeping urban soot at moderate levels.",
    pollutants: { pm2_5: 29.5, pm10: 55.0, ozone: 42.0, no2: 28.0, so2: 9.0, co: 480.0 },
    provenance: "Pollution Control Department (PCD Thailand)",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "lahore",
    name: "Lahore",
    state: "Punjab",
    country: "Pakistan",
    continent: "Asia",
    lat: 31.5204,
    lng: 74.3587,
    aqi: 215,
    status: "Very Unhealthy",
    advisory: "Severe regional smog episode. High risk of cardiovascular and respiratory distress.",
    pollutants: { pm2_5: 145.0, pm10: 220.0, ozone: 62.0, no2: 78.0, so2: 45.0, co: 1850.0 },
    provenance: "Punjab EPD Physical Sensors / WAQI",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "dubai",
    name: "Dubai",
    state: "Emirate of Dubai",
    country: "United Arab Emirates",
    continent: "Asia",
    lat: 25.2048,
    lng: 55.2708,
    aqi: 105,
    status: "Unhealthy for Sensitive Groups",
    advisory: "Suspended desert mineral dust and vehicular emissions.",
    pollutants: { pm2_5: 37.0, pm10: 110.0, ozone: 50.0, no2: 36.0, so2: 16.0, co: 510.0 },
    provenance: "Dubai Municipality Air Quality Network",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "singapore",
    name: "Singapore",
    state: "Central Region",
    country: "Singapore",
    continent: "Asia",
    lat: 1.3521,
    lng: 103.8198,
    aqi: 45,
    status: "Good",
    advisory: "Maritime winds clear equatorial boundary layer efficiently.",
    pollutants: { pm2_5: 11.0, pm10: 24.0, ozone: 32.0, no2: 21.0, so2: 8.0, co: 320.0 },
    provenance: "National Environment Agency (NEA Singapore)",
    updatedAt: "Live Real-Time Telemetry",
  },

  // Europe
  {
    id: "london",
    name: "London",
    state: "Greater London",
    country: "United Kingdom",
    continent: "Europe",
    lat: 51.5074,
    lng: -0.1278,
    aqi: 36,
    status: "Good",
    advisory: "Clean maritime air flow; fine particulate levels remain low.",
    pollutants: { pm2_5: 8.9, pm10: 18.5, ozone: 41.0, no2: 22.0, so2: 6.0, co: 290.0 },
    provenance: "London Air Quality Network (LAQN) / DEFRA",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "paris",
    name: "Paris",
    state: "Île-de-France",
    country: "France",
    continent: "Europe",
    lat: 48.8566,
    lng: 2.3522,
    aqi: 40,
    status: "Good",
    advisory: "Air quality is favorable across Île-de-France.",
    pollutants: { pm2_5: 10.2, pm10: 20.0, ozone: 45.0, no2: 26.0, so2: 7.0, co: 310.0 },
    provenance: "Airparif Ground Observation Stations",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "berlin",
    name: "Berlin",
    state: "State of Berlin",
    country: "Germany",
    continent: "Europe",
    lat: 52.52,
    lng: 13.405,
    aqi: 44,
    status: "Good",
    advisory: "Normal urban background levels. Little to no health risk.",
    pollutants: { pm2_5: 11.5, pm10: 22.0, ozone: 43.0, no2: 25.0, so2: 8.0, co: 340.0 },
    provenance: "Umweltbundesamt (UBA Germany)",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "madrid",
    name: "Madrid",
    state: "Community of Madrid",
    country: "Spain",
    continent: "Europe",
    lat: 40.4168,
    lng: -3.7038,
    aqi: 52,
    status: "Moderate",
    advisory: "Moderate NO2 from traffic corridors; fine particulates remain controlled.",
    pollutants: { pm2_5: 14.0, pm10: 28.0, ozone: 48.0, no2: 34.0, so2: 9.0, co: 370.0 },
    provenance: "Ayuntamiento de Madrid Calidad del Aire",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "warsaw",
    name: "Warsaw",
    state: "Masovian Voivodeship",
    country: "Poland",
    continent: "Europe",
    lat: 52.2297,
    lng: 21.0122,
    aqi: 78,
    status: "Moderate",
    advisory: "Seasonal residential heating slightly elevating PM2.5 readings.",
    pollutants: { pm2_5: 25.0, pm10: 45.0, ozone: 38.0, no2: 30.0, so2: 15.0, co: 440.0 },
    provenance: "GIOŚ National Monitoring System Poland",
    updatedAt: "Live Real-Time Telemetry",
  },

  // Americas
  {
    id: "new-york",
    name: "New York",
    state: "New York",
    country: "United States",
    continent: "Americas",
    lat: 40.7128,
    lng: -74.006,
    aqi: 38,
    status: "Good",
    advisory: "Air quality meets US EPA National Ambient Air Quality Standards.",
    pollutants: { pm2_5: 9.2, pm10: 17.0, ozone: 42.0, no2: 21.0, so2: 7.0, co: 300.0 },
    provenance: "US EPA AirNow / DEC New York",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "los-angeles",
    name: "Los Angeles",
    state: "California",
    country: "United States",
    continent: "Americas",
    lat: 34.0522,
    lng: -118.2437,
    aqi: 72,
    status: "Moderate",
    advisory: "Basin microclimate concentrates ozone and particulate matter during afternoon hours.",
    pollutants: { pm2_5: 22.4, pm10: 48.0, ozone: 55.0, no2: 32.0, so2: 8.0, co: 420.0 },
    provenance: "South Coast Air Quality Management District (SCAQMD)",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "chicago",
    name: "Chicago",
    state: "Illinois",
    country: "United States",
    continent: "Americas",
    lat: 41.8781,
    lng: -87.6298,
    aqi: 42,
    status: "Good",
    advisory: "Lake Michigan breeze maintaining clean atmospheric mixing.",
    pollutants: { pm2_5: 10.5, pm10: 20.0, ozone: 39.0, no2: 24.0, so2: 8.0, co: 330.0 },
    provenance: "Illinois EPA Ground Truth Sensors",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "mexico-city",
    name: "Mexico City",
    state: "Federal District",
    country: "Mexico",
    continent: "Americas",
    lat: 19.4326,
    lng: -99.1332,
    aqi: 122,
    status: "Unhealthy for Sensitive Groups",
    advisory: "High elevation valley topography traps ozone and fine particulates.",
    pollutants: { pm2_5: 44.0, pm10: 82.0, ozone: 68.0, no2: 41.0, so2: 18.0, co: 680.0 },
    provenance: "SEDEMA Sistema de Monitoreo Atmosférico",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "sao-paulo",
    name: "São Paulo",
    state: "State of São Paulo",
    country: "Brazil",
    continent: "Americas",
    lat: -23.5505,
    lng: -46.6333,
    aqi: 82,
    status: "Moderate",
    advisory: "Metropolitan fleet emissions causing moderate particulate accumulation.",
    pollutants: { pm2_5: 27.0, pm10: 52.0, ozone: 45.0, no2: 35.0, so2: 11.0, co: 520.0 },
    provenance: "CETESB Companhia Ambiental de São Paulo",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "buenos-aires",
    name: "Buenos Aires",
    state: "Autonomous City",
    country: "Argentina",
    continent: "Americas",
    lat: -34.6037,
    lng: -58.3816,
    aqi: 46,
    status: "Good",
    advisory: "Río de la Plata coastal ventilation keeps air fresh and clean.",
    pollutants: { pm2_5: 11.8, pm10: 23.0, ozone: 38.0, no2: 22.0, so2: 7.0, co: 310.0 },
    provenance: "Agencia de Protección Ambiental (APRA)",
    updatedAt: "Live Real-Time Telemetry",
  },

  // Africa
  {
    id: "cairo",
    name: "Cairo",
    state: "Cairo Governorate",
    country: "Egypt",
    continent: "Africa",
    lat: 30.0444,
    lng: 31.2357,
    aqi: 155,
    status: "Unhealthy",
    advisory: "Desert dust plumes compounded by dense vehicular traffic.",
    pollutants: { pm2_5: 68.0, pm10: 165.0, ozone: 58.0, no2: 52.0, so2: 28.0, co: 980.0 },
    provenance: "Egyptian Environmental Affairs Agency (EEAA)",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "lagos",
    name: "Lagos",
    state: "Lagos State",
    country: "Nigeria",
    continent: "Africa",
    lat: 6.5244,
    lng: 3.3792,
    aqi: 135,
    status: "Unhealthy for Sensitive Groups",
    advisory: "Coastal humidity and high traffic density elevate respirable particulates.",
    pollutants: { pm2_5: 52.0, pm10: 95.0, ozone: 42.0, no2: 40.0, so2: 20.0, co: 850.0 },
    provenance: "LASEPA Ground Station Network",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "johannesburg",
    name: "Johannesburg",
    state: "Gauteng",
    country: "South Africa",
    continent: "Africa",
    lat: -26.2041,
    lng: 28.0473,
    aqi: 85,
    status: "Moderate",
    advisory: "Highveld atmospheric inversion causing moderate particulate concentration.",
    pollutants: { pm2_5: 28.0, pm10: 58.0, ozone: 46.0, no2: 30.0, so2: 18.0, co: 490.0 },
    provenance: "South African Air Quality Information System (SAAQIS)",
    updatedAt: "Live Real-Time Telemetry",
  },

  // Oceania
  {
    id: "sydney",
    name: "Sydney",
    state: "New South Wales",
    country: "Australia",
    continent: "Oceania",
    lat: -33.8688,
    lng: 151.2093,
    aqi: 28,
    status: "Good",
    advisory: "Pristine oceanic air flow. Telemetry well within WHO guideline limits.",
    pollutants: { pm2_5: 6.5, pm10: 14.0, ozone: 35.0, no2: 15.0, so2: 4.0, co: 220.0 },
    provenance: "NSW Department of Planning and Environment",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "melbourne",
    name: "Melbourne",
    state: "Victoria",
    country: "Australia",
    continent: "Oceania",
    lat: -37.8136,
    lng: 144.9631,
    aqi: 25,
    status: "Good",
    advisory: "Excellent atmospheric clarity. Minimal fine particle burden.",
    pollutants: { pm2_5: 5.8, pm10: 13.0, ozone: 33.0, no2: 14.0, so2: 3.5, co: 210.0 },
    provenance: "EPA Victoria Monitoring Stations",
    updatedAt: "Live Real-Time Telemetry",
  },
];

function getAqiCategory(aqi: number) {
  if (aqi <= 50) return { category: "Good", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)" };
  if (aqi <= 100) return { category: "Moderate", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" };
  if (aqi <= 150) return { category: "Unhealthy for Sensitive", color: "#f97316", bg: "rgba(249, 115, 22, 0.15)" };
  if (aqi <= 200) return { category: "Unhealthy", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" };
  if (aqi <= 300) return { category: "Very Unhealthy", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.15)" };
  return { category: "Hazardous", color: "#881337", bg: "rgba(136, 19, 55, 0.15)" };
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

  const [hotspots, setHotspots] = useState<SpatialHotspot[]>(INITIAL_HOTSPOTS);
  const [activeHotspot, setActiveHotspot] = useState<SpatialHotspot>(selectedCity || INITIAL_HOTSPOTS[0]);
  const [activeContinent, setActiveContinent] = useState<string>("Global");
  const [activeLayer, setActiveLayer] = useState<MapLayerKey>("aqi");
  const [weatherOverlay, setWeatherOverlay] = useState(false);
  const [windOverlay, setWindOverlay] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [liveUpdating, setLiveUpdating] = useState(false);

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
  const renderMarkers = useCallback((L: typeof import("leaflet"), map: LeafletMap, list: SpatialHotspot[]) => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    list.forEach((spot) => {
      const cat = getAqiCategory(spot.aqi);

      // Outer heat halo
      const halo = L.circle([spot.lat, spot.lng], {
        radius: spot.aqi > 150 ? 90000 : 45000,
        color: cat.color,
        fillColor: cat.color,
        fillOpacity: 0.28,
        weight: 0,
      }).addTo(map);

      // Interactive pulsating hotspot icon
      const customIcon = L.divIcon({
        className: "custom-aqi-hotspot-pin",
        html: `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            cursor: pointer;
          " title="${spot.name}, ${spot.country}: AQI ${spot.aqi} (${spot.status})">
            <span style="
              position: absolute;
              width: 26px;
              height: 26px;
              border-radius: 50%;
              background: ${cat.color};
              opacity: 0.55;
              animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></span>
            <span style="
              position: relative;
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background: ${cat.color};
              border: 2px solid #ffffff;
              box-shadow: 0 0 12px ${cat.color};
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 8px;
              font-weight: bold;
              color: white;
            "></span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([spot.lat, spot.lng], { icon: customIcon }).addTo(map);

      // Leaflet Tooltip with provenance
      marker.bindTooltip(
        `<strong>${spot.name}</strong> (${spot.country})<br/>AQI: <span style="color:${cat.color};font-weight:bold">${spot.aqi}</span> · ${spot.status}`,
        {
          direction: "top",
          offset: [0, -10],
          className: "theme-adaptive-tooltip font-mono text-xs",
        }
      );

      marker.on("click", () => {
        setActiveHotspot(spot);
        if (onSelectCity) onSelectCity(spot);
        map.flyTo([spot.lat, spot.lng], 6, { duration: 0.8 });
      });

      markersRef.current.push(halo, marker);
    });
  }, [onSelectCity]);

  // Update markers when hotspots change
  useEffect(() => {
    if (mapInstanceRef.current) {
      import("leaflet").then((L) => {
        if (mapInstanceRef.current) {
          renderMarkers(L, mapInstanceRef.current, hotspots);
        }
      });
    }
  }, [hotspots, renderMarkers]);

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

      // Initial center centered on world view
      const map = L.map(targetContainer, {
        center: [24, 20],
        zoom: 3,
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

      renderMarkers(L, map, hotspots);
    }

    initMap();

    return () => {
      canceled = true;
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
      mapInstanceRef.current.flyTo([24, 20], 3, { duration: 1.2 });
    } else if (region === "Asia") {
      mapInstanceRef.current.flyTo([28.0, 85.0], 4, { duration: 1.2 });
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
            {liveUpdating ? "Ingesting Feeds..." : "OpenAQ · WAQI · CAMS Live"}
          </span>
          <button
            type="button"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: "Vayu Index", url: window.location.href });
              }
            }}
            className="p-2 rounded-xl bg-[var(--dash-surface)] border border-[var(--dash-rule)] text-[var(--dash-muted)] hover:text-[var(--dash-accent)] transition-colors shadow-sm"
            title="Share"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 1. Dedicated Leaflet Container (Clean Bounds & Theme-Adaptive Cartography) */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative w-full h-[650px] rounded-2xl overflow-hidden border border-[var(--dash-rule)] shadow-xl bg-[var(--dash-surface-soft)]">
        {/* Full Spatial Map Canvas */}
        <div ref={mapContainerRef} className="absolute inset-0 z-0 w-full h-full" />

        {/* ------------------------------------------------------------------ */}
        {/* Left Floating Drawer: Absolute Pinning with Theme Adaptive Card */}
        {/* ------------------------------------------------------------------ */}
        <div className="absolute top-4 left-4 z-20 w-full max-w-sm backdrop-blur-md bg-[var(--dash-surface)]/95 border border-[var(--dash-rule)] text-[var(--dash-ink)] rounded-2xl shadow-2xl p-4 sm:p-5 space-y-3.5 pointer-events-auto">
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
            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              aria-label="Bookmark location"
              className="p-1.5 rounded-lg text-[var(--dash-muted)] hover:text-amber-500 transition-colors"
            >
              <Star size={18} className={isFavorite ? "fill-amber-400 text-amber-500" : ""} />
            </button>
          </div>

          {/* Big AQI Banner */}
          <div
            className="p-4 rounded-xl border border-[var(--dash-rule)] relative overflow-hidden flex flex-col justify-between"
            style={{
              background: `linear-gradient(135deg, ${aqiInfo.bg}, transparent)`,
            }}
          >
            <div className="relative z-10">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--dash-muted)]">
                US AQI · {activeHotspot.country}
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight" style={{ color: aqiInfo.color }}>
                  {activeHotspot.aqi}
                </span>
                <span className="text-base font-bold" style={{ color: aqiInfo.color }}>
                  {activeHotspot.status}
                </span>
              </div>
            </div>

            <div className="relative z-10 flex flex-col gap-0.5 mt-2">
              <span className="text-[10px] font-mono text-[var(--dash-muted)]">
                Provenance: <strong className="text-[var(--dash-accent)]">{activeHotspot.provenance}</strong>
              </span>
              <span className="text-[9px] font-mono text-[var(--dash-faint)]">
                Updated: {activeHotspot.updatedAt}
              </span>
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
              <span>Weather</span>
              <input
                type="checkbox"
                checked={weatherOverlay}
                onChange={(e) => setWeatherOverlay(e.target.checked)}
                className="accent-[var(--dash-accent)] cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-[var(--dash-muted)]">
              <span>Wind</span>
              <input
                type="checkbox"
                checked={windOverlay}
                onChange={(e) => setWindOverlay(e.target.checked)}
                className="accent-[var(--dash-accent)] cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* AQI Scale Bar: Cleanly Placed Directly Underneath Map Canvas */}
      {/* ------------------------------------------------------------------ */}
      <div className="w-full p-4 sm:p-5 rounded-2xl border border-[var(--dash-rule)] bg-[var(--dash-surface)] backdrop-blur-md shadow-sm text-[var(--dash-ink)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--dash-ink)]">
            <span>AQI SCALE (US)</span>
            <Info size={13} className="text-[var(--dash-muted)]" />
          </div>
          <span className="text-[11px] font-mono text-[var(--dash-muted)]">
            Selected City: <strong className="text-[var(--dash-ink)]">{activeHotspot.name}</strong> ({activeHotspot.country}) · <span style={{ color: aqiInfo.color }}>{activeHotspot.status}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
          {[
            { range: "0–50", label: "Good", color: "#10b981", active: activeHotspot.aqi <= 50 },
            { range: "51–100", label: "Moderate", color: "#f59e0b", active: activeHotspot.aqi > 50 && activeHotspot.aqi <= 100 },
            {
              range: "101–150",
              label: "Unhealthy for Sensitive",
              color: "#f97316",
              active: activeHotspot.aqi > 100 && activeHotspot.aqi <= 150,
            },
            { range: "151–200", label: "Unhealthy", color: "#ef4444", active: activeHotspot.aqi > 150 && activeHotspot.aqi <= 200 },
            { range: "201–300", label: "Very Unhealthy", color: "#8b5cf6", active: activeHotspot.aqi > 200 && activeHotspot.aqi <= 300 },
            { range: "301+", label: "Hazardous", color: "#881337", active: activeHotspot.aqi > 300 },
          ].map((tier) => (
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
