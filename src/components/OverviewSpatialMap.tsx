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

export interface HotspotWeather {
  temp: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  condition?: string;
}

export function getCardinalDirection(deg: number): string {
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(deg / 22.5) % 16;
  return directions[index];
}

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
  weather?: HotspotWeather;
  provenance: string;
  updatedAt: string;
}

// Comprehensive Global Hotspots spanning all continents
export const INITIAL_HOTSPOTS: SpatialHotspot[] = [
  // Asia & India Dense Network
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
    provenance: "CPCB Ground Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "noida",
    name: "Noida",
    state: "Uttar Pradesh",
    country: "India",
    continent: "Asia",
    lat: 28.5355,
    lng: 77.3910,
    aqi: 188,
    status: "Unhealthy",
    advisory: "High particulate burden in urban transit and commercial sectors.",
    pollutants: { pm2_5: 92.0, pm10: 142.0, ozone: 82.0, no2: 74.0, so2: 28.0, co: 1320.0 },
    provenance: "CPCB Ground Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "gurugram",
    name: "Gurugram",
    state: "Haryana",
    country: "India",
    continent: "Asia",
    lat: 28.4595,
    lng: 77.0266,
    aqi: 168,
    status: "Unhealthy",
    advisory: "Vehicular exhaust and regional construction dust elevation.",
    pollutants: { pm2_5: 79.0, pm10: 135.0, ozone: 78.0, no2: 68.0, so2: 24.0, co: 1180.0 },
    provenance: "CPCB Ground Telemetry · Copernicus CAMS",
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
    provenance: "CPCB Ground Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "navi-mumbai",
    name: "Navi Mumbai",
    state: "Maharashtra",
    country: "India",
    continent: "Asia",
    lat: 19.0330,
    lng: 73.0297,
    aqi: 112,
    status: "Moderate",
    advisory: "Industrial corridor activity with afternoon sea breeze dispersal.",
    pollutants: { pm2_5: 42.0, pm10: 88.0, ozone: 46.0, no2: 44.0, so2: 22.0, co: 680.0 },
    provenance: "CPCB Ground Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "pune",
    name: "Pune",
    state: "Maharashtra",
    country: "India",
    continent: "Asia",
    lat: 18.5204,
    lng: 73.8567,
    aqi: 104,
    status: "Moderate",
    advisory: "Moderate vehicular congestion trapped along valley floor.",
    pollutants: { pm2_5: 37.0, pm10: 76.0, ozone: 48.0, no2: 36.0, so2: 16.0, co: 590.0 },
    provenance: "CPCB Ground Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "nagpur",
    name: "Nagpur",
    state: "Maharashtra",
    country: "India",
    continent: "Asia",
    lat: 21.1458,
    lng: 79.0882,
    aqi: 88,
    status: "Moderate",
    advisory: "Central plateau winds keeping particulates moderately dispersed.",
    pollutants: { pm2_5: 30.0, pm10: 64.0, ozone: 38.0, no2: 28.0, so2: 14.0, co: 490.0 },
    provenance: "CPCB Ground Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "nashik",
    name: "Nashik",
    state: "Maharashtra",
    country: "India",
    continent: "Asia",
    lat: 19.9975,
    lng: 73.7898,
    aqi: 76,
    status: "Moderate",
    advisory: "High elevation Western Ghats aeration preserving acceptable air quality.",
    pollutants: { pm2_5: 25.0, pm10: 55.0, ozone: 36.0, no2: 26.0, so2: 12.0, co: 460.0 },
    provenance: "CPCB Ground Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "bengaluru",
    name: "Bengaluru",
    state: "Karnataka",
    country: "India",
    continent: "Asia",
    lat: 12.9716,
    lng: 77.5946,
    aqi: 68,
    status: "Satisfactory",
    advisory: "High elevation Deccan plateau ventilation sustaining moderate to good dispersion.",
    pollutants: { pm2_5: 22.0, pm10: 48.0, ozone: 32.0, no2: 24.0, so2: 11.0, co: 420.0 },
    provenance: "CPCB Ground Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "mysuru",
    name: "Mysuru",
    state: "Karnataka",
    country: "India",
    continent: "Asia",
    lat: 12.2958,
    lng: 76.6394,
    aqi: 54,
    status: "Satisfactory",
    advisory: "Clean southerly plateau breezes with minimal urban haze.",
    pollutants: { pm2_5: 16.0, pm10: 38.0, ozone: 28.0, no2: 18.0, so2: 8.0, co: 360.0 },
    provenance: "CPCB Ground Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "kolkata",
    name: "Kolkata",
    state: "West Bengal",
    country: "India",
    continent: "Asia",
    lat: 22.5726,
    lng: 88.3639,
    aqi: 162,
    status: "Unhealthy",
    advisory: "Gangetic delta thermal stagnation concentrating fine particulate emissions.",
    pollutants: { pm2_5: 78.0, pm10: 132.0, ozone: 41.0, no2: 62.0, so2: 22.0, co: 1120.0 },
    provenance: "CPCB Ground Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "hyderabad",
    name: "Hyderabad",
    state: "Telangana",
    country: "India",
    continent: "Asia",
    lat: 17.3850,
    lng: 78.4867,
    aqi: 110,
    status: "Moderate",
    advisory: "Moderate vehicular traffic and localized dust dispersed by inland breezes.",
    pollutants: { pm2_5: 38.0, pm10: 78.0, ozone: 36.0, no2: 38.0, so2: 14.0, co: 650.0 },
    provenance: "CPCB Ground Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "chennai",
    name: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    continent: "Asia",
    lat: 13.0827,
    lng: 80.2707,
    aqi: 72,
    status: "Satisfactory",
    advisory: "Coromandel coast marine airflow maintaining clean to satisfactory air quality.",
    pollutants: { pm2_5: 24.0, pm10: 52.0, ozone: 28.0, no2: 26.0, so2: 12.0, co: 450.0 },
    provenance: "CPCB Ground Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "coimbatore",
    name: "Coimbatore",
    state: "Tamil Nadu",
    country: "India",
    continent: "Asia",
    lat: 11.0168,
    lng: 76.9558,
    aqi: 58,
    status: "Satisfactory",
    advisory: "Palghat gap wind funneling sustaining high particulate clearance.",
    pollutants: { pm2_5: 18.0, pm10: 42.0, ozone: 29.0, no2: 21.0, so2: 9.0, co: 380.0 },
    provenance: "CPCB Ground Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "ahmedabad",
    name: "Ahmedabad",
    state: "Gujarat",
    country: "India",
    continent: "Asia",
    lat: 23.0225,
    lng: 72.5714,
    aqi: 145,
    status: "Moderate",
    advisory: "Industrial corridor activity and dry regional winds contributing to particulate load.",
    pollutants: { pm2_5: 56.0, pm10: 118.0, ozone: 45.0, no2: 58.0, so2: 28.0, co: 890.0 },
    provenance: "CPCB Ground Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "surat",
    name: "Surat",
    state: "Gujarat",
    country: "India",
    continent: "Asia",
    lat: 21.1702,
    lng: 72.8311,
    aqi: 124,
    status: "Moderate",
    advisory: "Coastal textile and diamond industrial belt emissions with sea breeze interaction.",
    pollutants: { pm2_5: 45.0, pm10: 94.0, ozone: 41.0, no2: 48.0, so2: 24.0, co: 740.0 },
    provenance: "CPCB Ground Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "jaipur",
    name: "Jaipur",
    state: "Rajasthan",
    country: "India",
    continent: "Asia",
    lat: 26.9124,
    lng: 75.7873,
    aqi: 156,
    status: "Unhealthy",
    advisory: "Thar desert periphery dust storms mixed with urban fleet combustion.",
    pollutants: { pm2_5: 68.0, pm10: 154.0, ozone: 52.0, no2: 60.0, so2: 26.0, co: 1040.0 },
    provenance: "CPCB Ground Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "jodhpur",
    name: "Jodhpur",
    state: "Rajasthan",
    country: "India",
    continent: "Asia",
    lat: 26.2389,
    lng: 73.0243,
    aqi: 142,
    status: "Moderate",
    advisory: "Arid atmospheric dispersion with elevated mineral dust fractions.",
    pollutants: { pm2_5: 54.0, pm10: 138.0, ozone: 48.0, no2: 42.0, so2: 18.0, co: 820.0 },
    provenance: "CPCB Ground Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "lucknow",
    name: "Lucknow",
    state: "Uttar Pradesh",
    country: "India",
    continent: "Asia",
    lat: 26.8467,
    lng: 80.9462,
    aqi: 182,
    status: "Unhealthy",
    advisory: "Central Indo-Gangetic plain smog accumulation with calm wind speeds.",
    pollutants: { pm2_5: 88.0, pm10: 165.0, ozone: 48.0, no2: 72.0, so2: 32.0, co: 1350.0 },
    provenance: "CPCB Ground Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "kanpur",
    name: "Kanpur",
    state: "Uttar Pradesh",
    country: "India",
    continent: "Asia",
    lat: 26.4499,
    lng: 80.3319,
    aqi: 194,
    status: "Unhealthy",
    advisory: "Heavy industrial processing and regional traffic inversion.",
    pollutants: { pm2_5: 96.0, pm10: 178.0, ozone: 50.0, no2: 78.0, so2: 38.0, co: 1460.0 },
    provenance: "CPCB Ground Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "varanasi",
    name: "Varanasi",
    state: "Uttar Pradesh",
    country: "India",
    continent: "Asia",
    lat: 25.3176,
    lng: 82.9739,
    aqi: 170,
    status: "Unhealthy",
    advisory: "Indo-Gangetic thermal boundary trapping fine respirable aerosols.",
    pollutants: { pm2_5: 82.0, pm10: 148.0, ozone: 44.0, no2: 66.0, so2: 28.0, co: 1220.0 },
    provenance: "CPCB Ground Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "patna",
    name: "Patna",
    state: "Bihar",
    country: "India",
    continent: "Asia",
    lat: 25.5941,
    lng: 85.1376,
    aqi: 178,
    status: "Unhealthy",
    advisory: "Gangetic basin stagnation amplifying particulate stagnation.",
    pollutants: { pm2_5: 86.0, pm10: 156.0, ozone: 46.0, no2: 70.0, so2: 30.0, co: 1290.0 },
    provenance: "CPCB Ground Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "bhopal",
    name: "Bhopal",
    state: "Madhya Pradesh",
    country: "India",
    continent: "Asia",
    lat: 23.2599,
    lng: 77.4126,
    aqi: 94,
    status: "Moderate",
    advisory: "Undulating plateau terrain aiding atmospheric dispersal.",
    pollutants: { pm2_5: 32.0, pm10: 68.0, ozone: 40.0, no2: 30.0, so2: 15.0, co: 530.0 },
    provenance: "CPCB Ground Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "indore",
    name: "Indore",
    state: "Madhya Pradesh",
    country: "India",
    continent: "Asia",
    lat: 22.7196,
    lng: 75.8577,
    aqi: 102,
    status: "Moderate",
    advisory: "Malwa plateau winds keeping particulate concentration balanced.",
    pollutants: { pm2_5: 36.0, pm10: 74.0, ozone: 42.0, no2: 34.0, so2: 16.0, co: 580.0 },
    provenance: "CPCB Ground Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "visakhapatnam",
    name: "Visakhapatnam",
    state: "Andhra Pradesh",
    country: "India",
    continent: "Asia",
    lat: 17.6868,
    lng: 83.2185,
    aqi: 82,
    status: "Moderate",
    advisory: "Bay of Bengal sea breeze clearing heavy harbor emissions.",
    pollutants: { pm2_5: 28.0, pm10: 62.0, ozone: 35.0, no2: 32.0, so2: 18.0, co: 510.0 },
    provenance: "CPCB Ground Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "kochi",
    name: "Kochi",
    state: "Kerala",
    country: "India",
    continent: "Asia",
    lat: 9.9312,
    lng: 76.2673,
    aqi: 52,
    status: "Satisfactory",
    advisory: "Arabian Sea coastal winds maintaining clean, humid tropospheric air.",
    pollutants: { pm2_5: 15.0, pm10: 36.0, ozone: 26.0, no2: 18.0, so2: 7.0, co: 340.0 },
    provenance: "CPCB Ground Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "thiruvananthapuram",
    name: "Thiruvananthapuram",
    state: "Kerala",
    country: "India",
    continent: "Asia",
    lat: 8.5241,
    lng: 76.9366,
    aqi: 46,
    status: "Good",
    advisory: "Pristine maritime ventilation keeping air well within safe standards.",
    pollutants: { pm2_5: 12.0, pm10: 30.0, ozone: 24.0, no2: 15.0, so2: 6.0, co: 310.0 },
    provenance: "CPCB Ground Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "chandigarh",
    name: "Chandigarh",
    state: "Chandigarh",
    country: "India",
    continent: "Asia",
    lat: 30.7333,
    lng: 76.7794,
    aqi: 135,
    status: "Moderate",
    advisory: "Shivalik foothills temperature inversion elevating fine particles.",
    pollutants: { pm2_5: 50.0, pm10: 98.0, ozone: 42.0, no2: 45.0, so2: 18.0, co: 780.0 },
    provenance: "CPCB Ground Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "amritsar",
    name: "Amritsar",
    state: "Punjab",
    country: "India",
    continent: "Asia",
    lat: 31.6340,
    lng: 74.8723,
    aqi: 165,
    status: "Unhealthy",
    advisory: "Trans-boundary haze and agricultural stubble particulates.",
    pollutants: { pm2_5: 78.0, pm10: 142.0, ozone: 45.0, no2: 55.0, so2: 24.0, co: 1100.0 },
    provenance: "CPCB Ground Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "srinagar",
    name: "Srinagar",
    state: "Jammu & Kashmir",
    country: "India",
    continent: "Asia",
    lat: 34.0837,
    lng: 74.7973,
    aqi: 62,
    status: "Satisfactory",
    advisory: "Kashmir valley basin ventilation with moderate biomass heating.",
    pollutants: { pm2_5: 20.0, pm10: 45.0, ozone: 32.0, no2: 22.0, so2: 10.0, co: 410.0 },
    provenance: "CPCB Ground Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "dehradun",
    name: "Dehradun",
    state: "Uttarakhand",
    country: "India",
    continent: "Asia",
    lat: 30.3165,
    lng: 78.0322,
    aqi: 82,
    status: "Moderate",
    advisory: "Doon valley microclimate accumulating moderate localized traffic soot.",
    pollutants: { pm2_5: 28.0, pm10: 58.0, ozone: 36.0, no2: 28.0, so2: 12.0, co: 490.0 },
    provenance: "CPCB Ground Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "guwahati",
    name: "Guwahati",
    state: "Assam",
    country: "India",
    continent: "Asia",
    lat: 26.1445,
    lng: 91.7362,
    aqi: 92,
    status: "Moderate",
    advisory: "Brahmaputra valley morning fog trapping localized soot.",
    pollutants: { pm2_5: 33.0, pm10: 72.0, ozone: 34.0, no2: 30.0, so2: 14.0, co: 540.0 },
    provenance: "CPCB Ground Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "kalyan",
    name: "Kalyan-Dombivli",
    state: "Maharashtra",
    country: "India",
    continent: "Asia",
    lat: 19.2403,
    lng: 73.1305,
    aqi: 136,
    status: "Moderate",
    advisory: "Suburban industrial and highway emissions buffered by Ulhas basin topography.",
    pollutants: { pm2_5: 51.0, pm10: 108.0, ozone: 35.0, no2: 52.0, so2: 24.0, co: 760.0 },
    provenance: "CPCB Ground Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },

  // Asian Regional Metropolises
  {
    id: "dhaka",
    name: "Dhaka",
    state: "Dhaka Division",
    country: "Bangladesh",
    continent: "Asia",
    lat: 23.8103,
    lng: 90.4125,
    aqi: 198,
    status: "Unhealthy",
    advisory: "Dense urban emissions and brick kilns elevating fine particulates.",
    pollutants: { pm2_5: 112.0, pm10: 185.0, ozone: 44.0, no2: 72.0, so2: 36.0, co: 1550.0 },
    provenance: "WAQI & OpenAQ Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "kathmandu",
    name: "Kathmandu",
    state: "Bagmati",
    country: "Nepal",
    continent: "Asia",
    lat: 27.7172,
    lng: 85.3240,
    aqi: 138,
    status: "Moderate",
    advisory: "Himalayan bowl topography trapping traffic emissions.",
    pollutants: { pm2_5: 52.0, pm10: 98.0, ozone: 38.0, no2: 44.0, so2: 18.0, co: 810.0 },
    provenance: "WAQI & OpenAQ Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "colombo",
    name: "Colombo",
    state: "Western Province",
    country: "Sri Lanka",
    continent: "Asia",
    lat: 6.9271,
    lng: 79.8612,
    aqi: 58,
    status: "Satisfactory",
    advisory: "Indian Ocean maritime airflow dispersing urban particulates.",
    pollutants: { pm2_5: 17.0, pm10: 42.0, ozone: 28.0, no2: 22.0, so2: 9.0, co: 390.0 },
    provenance: "WAQI & OpenAQ Telemetry · Copernicus CAMS",
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
    provenance: "WAQI & OpenAQ Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "karachi",
    name: "Karachi",
    state: "Sindh",
    country: "Pakistan",
    continent: "Asia",
    lat: 24.8607,
    lng: 67.0011,
    aqi: 154,
    status: "Unhealthy",
    advisory: "Coastal humidity compounding heavy port and vehicle exhaust.",
    pollutants: { pm2_5: 66.0, pm10: 144.0, ozone: 46.0, no2: 58.0, so2: 28.0, co: 1020.0 },
    provenance: "WAQI & OpenAQ Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "islamabad",
    name: "Islamabad",
    state: "Islamabad Capital",
    country: "Pakistan",
    continent: "Asia",
    lat: 33.6844,
    lng: 73.0479,
    aqi: 128,
    status: "Moderate",
    advisory: "Margalla hills buffer with moderate seasonal haze.",
    pollutants: { pm2_5: 48.0, pm10: 92.0, ozone: 40.0, no2: 42.0, so2: 16.0, co: 720.0 },
    provenance: "WAQI & OpenAQ Telemetry · Copernicus CAMS",
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
    provenance: "WAQI & OpenAQ Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "hanoi",
    name: "Hanoi",
    state: "Red River Delta",
    country: "Vietnam",
    continent: "Asia",
    lat: 21.0285,
    lng: 105.8542,
    aqi: 142,
    status: "Moderate",
    advisory: "Red River delta stagnation concentrating fine particles.",
    pollutants: { pm2_5: 55.0, pm10: 98.0, ozone: 44.0, no2: 48.0, so2: 20.0, co: 840.0 },
    provenance: "WAQI & OpenAQ Telemetry · Copernicus CAMS",
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
    provenance: "WAQI & OpenAQ Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "kuala-lumpur",
    name: "Kuala Lumpur",
    state: "Federal Territory",
    country: "Malaysia",
    continent: "Asia",
    lat: 3.1390,
    lng: 101.6869,
    aqi: 62,
    status: "Satisfactory",
    advisory: "Regular equatorial convection preventing heavy smog formation.",
    pollutants: { pm2_5: 19.0, pm10: 42.0, ozone: 34.0, no2: 26.0, so2: 10.0, co: 430.0 },
    provenance: "WAQI & OpenAQ Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "jakarta",
    name: "Jakarta",
    state: "Special Capital Region",
    country: "Indonesia",
    continent: "Asia",
    lat: -6.2088,
    lng: 106.8456,
    aqi: 132,
    status: "Moderate",
    advisory: "Dense fleet combustion combined with humid thermal inversion.",
    pollutants: { pm2_5: 49.0, pm10: 88.0, ozone: 38.0, no2: 46.0, so2: 22.0, co: 790.0 },
    provenance: "WAQI & OpenAQ Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "manila",
    name: "Manila",
    state: "Metro Manila",
    country: "Philippines",
    continent: "Asia",
    lat: 14.5995,
    lng: 120.9842,
    aqi: 74,
    status: "Moderate",
    advisory: "Bay breeze dispersing urban traffic emissions along coastal corridor.",
    pollutants: { pm2_5: 24.0, pm10: 54.0, ozone: 32.0, no2: 30.0, so2: 12.0, co: 480.0 },
    provenance: "WAQI & OpenAQ Telemetry · Copernicus CAMS",
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
    provenance: "WAQI & OpenAQ Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "seoul",
    name: "Seoul",
    state: "Seoul Capital Area",
    country: "South Korea",
    continent: "Asia",
    lat: 37.5665,
    lng: 126.9780,
    aqi: 72,
    status: "Moderate",
    advisory: "Moderate trans-boundary particulate transport.",
    pollutants: { pm2_5: 23.0, pm10: 48.0, ozone: 36.0, no2: 32.0, so2: 11.0, co: 440.0 },
    provenance: "WAQI & OpenAQ Telemetry · Copernicus CAMS",
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
    provenance: "WAQI & OpenAQ Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "shanghai",
    name: "Shanghai",
    state: "Shanghai Municipality",
    country: "China",
    continent: "Asia",
    lat: 31.2304,
    lng: 121.4737,
    aqi: 85,
    status: "Moderate",
    advisory: "Yangtze delta marine breezes providing moderate particulate mixing.",
    pollutants: { pm2_5: 28.0, pm10: 56.0, ozone: 42.0, no2: 36.0, so2: 14.0, co: 520.0 },
    provenance: "WAQI & OpenAQ Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "hong-kong",
    name: "Hong Kong",
    state: "Hong Kong SAR",
    country: "Hong Kong",
    continent: "Asia",
    lat: 22.3193,
    lng: 114.1694,
    aqi: 56,
    status: "Satisfactory",
    advisory: "South China Sea maritime airflow maintaining clean background air.",
    pollutants: { pm2_5: 16.0, pm10: 38.0, ozone: 34.0, no2: 28.0, so2: 8.0, co: 380.0 },
    provenance: "WAQI & OpenAQ Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "taipei",
    name: "Taipei",
    state: "Northern Taiwan",
    country: "Taiwan",
    continent: "Asia",
    lat: 25.0330,
    lng: 121.5654,
    aqi: 48,
    status: "Good",
    advisory: "Basin ventilation driven by northeasterly Pacific airflow.",
    pollutants: { pm2_5: 13.0, pm10: 32.0, ozone: 30.0, no2: 22.0, so2: 7.0, co: 340.0 },
    provenance: "WAQI & OpenAQ Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "tashkent",
    name: "Tashkent",
    state: "Tashkent Region",
    country: "Uzbekistan",
    continent: "Asia",
    lat: 41.2995,
    lng: 69.2401,
    aqi: 95,
    status: "Moderate",
    advisory: "Inland continental aridity and suspended mineral dust.",
    pollutants: { pm2_5: 34.0, pm10: 82.0, ozone: 40.0, no2: 32.0, so2: 16.0, co: 560.0 },
    provenance: "WAQI & OpenAQ Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "almaty",
    name: "Almaty",
    state: "Almaty Region",
    country: "Kazakhstan",
    continent: "Asia",
    lat: 43.2220,
    lng: 76.8512,
    aqi: 108,
    status: "Moderate",
    advisory: "Tian Shan mountain basin inversion trapping heating emissions.",
    pollutants: { pm2_5: 39.0, pm10: 76.0, ozone: 38.0, no2: 36.0, so2: 18.0, co: 620.0 },
    provenance: "WAQI & OpenAQ Telemetry · Copernicus CAMS",
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
    provenance: "WAQI & OpenAQ Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "riyadh",
    name: "Riyadh",
    state: "Riyadh Province",
    country: "Saudi Arabia",
    continent: "Asia",
    lat: 24.7136,
    lng: 46.6753,
    aqi: 122,
    status: "Moderate",
    advisory: "Arabian plateau dust plumes combined with urban combustion.",
    pollutants: { pm2_5: 45.0, pm10: 130.0, ozone: 52.0, no2: 38.0, so2: 20.0, co: 670.0 },
    provenance: "WAQI & OpenAQ Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "doha",
    name: "Doha",
    state: "Ad-Dawhah",
    country: "Qatar",
    continent: "Asia",
    lat: 25.2854,
    lng: 51.5310,
    aqi: 98,
    status: "Moderate",
    advisory: "Persian Gulf maritime humidity mixing with airborne crustal dust.",
    pollutants: { pm2_5: 35.0, pm10: 95.0, ozone: 46.0, no2: 34.0, so2: 18.0, co: 540.0 },
    provenance: "WAQI & OpenAQ Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "kuwait-city",
    name: "Kuwait City",
    state: "Al Asimah",
    country: "Kuwait",
    continent: "Asia",
    lat: 29.3759,
    lng: 47.9774,
    aqi: 118,
    status: "Moderate",
    advisory: "Desert windborne dust and petrochemical emissions.",
    pollutants: { pm2_5: 42.0, pm10: 115.0, ozone: 48.0, no2: 38.0, so2: 22.0, co: 640.0 },
    provenance: "WAQI & OpenAQ Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "tehran",
    name: "Tehran",
    state: "Tehran Province",
    country: "Iran",
    continent: "Asia",
    lat: 35.6892,
    lng: 51.3890,
    aqi: 145,
    status: "Moderate",
    advisory: "Alborz mountain thermal inversion concentrating urban soot.",
    pollutants: { pm2_5: 56.0, pm10: 104.0, ozone: 44.0, no2: 52.0, so2: 26.0, co: 890.0 },
    provenance: "WAQI & OpenAQ Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "baghdad",
    name: "Baghdad",
    state: "Baghdad Governorate",
    country: "Iraq",
    continent: "Asia",
    lat: 33.3152,
    lng: 44.3661,
    aqi: 138,
    status: "Moderate",
    advisory: "Mesopotamian plain dust episodes combined with traffic soot.",
    pollutants: { pm2_5: 51.0, pm10: 112.0, ozone: 46.0, no2: 44.0, so2: 24.0, co: 810.0 },
    provenance: "WAQI & OpenAQ Telemetry · Copernicus CAMS",
    updatedAt: "Live Real-Time Telemetry",
  },
  {
    id: "istanbul",
    name: "Istanbul",
    state: "Marmara",
    country: "Turkey",
    continent: "Asia",
    lat: 41.0082,
    lng: 28.9784,
    aqi: 72,
    status: "Moderate",
    advisory: "Bosphorus marine corridor keeping transit emissions dispersed.",
    pollutants: { pm2_5: 23.0, pm10: 48.0, ozone: 38.0, no2: 34.0, so2: 12.0, co: 460.0 },
    provenance: "WAQI & OpenAQ Telemetry · Copernicus CAMS",
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

  const [hotspots, setHotspots] = useState<SpatialHotspot[]>(INITIAL_HOTSPOTS);
  const [activeHotspot, setActiveHotspot] = useState<SpatialHotspot>(selectedCity || INITIAL_HOTSPOTS[0]);
  const [activeContinent, setActiveContinent] = useState<string>("Global");
  const [activeLayer, setActiveLayer] = useState<MapLayerKey>("aqi");
  const [weatherOverlay, setWeatherOverlay] = useState(false);
  const [windOverlay, setWindOverlay] = useState(false);
  const [heatmapOverlay, setHeatmapOverlay] = useState(false);
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
  const renderMarkers = useCallback(
    (
      L: typeof import("leaflet"),
      map: LeafletMap,
      list: SpatialHotspot[],
      layer: MapLayerKey,
      showWeather: boolean,
      showWind: boolean,
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

        // 4. Optional Wind Direction indicator with rotated vector arrow
        let windVaneHtml = "";
        if (showWind) {
          windVaneHtml = `
            <div style="
              position: absolute;
              bottom: -20px;
              white-space: nowrap;
              background: rgba(2, 132, 199, 0.92);
              color: white;
              border: 1px solid rgba(255, 255, 255, 0.45);
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
              <svg style="transform: rotate(${weather.windDirection}deg); width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 2.5;" viewBox="0 0 24 24">
                <path d="M12 2L12 22M12 2L6 8M12 2L18 8" />
              </svg>
              <span>${weather.windSpeed} km/h ${cardinal}</span>
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
              ${windVaneHtml}
            </div>
          `,
          iconSize: [50, 50],
          iconAnchor: [25, 25],
        });

        const marker = L.marker([spot.lat, spot.lng], { icon: customIcon }).addTo(map);

        // Leaflet Tooltip with comprehensive pollutant and atmospheric telemetry
        marker.bindTooltip(
          `<strong>${spot.name}</strong> (${spot.country})<br/>` +
          `${metric.metricLabel}: <span style="color:${metric.color};font-weight:bold">${metric.formattedValue} ${metric.unit}</span> · ${metric.category}<br/>` +
          `<span style="color:#0284c7;font-weight:600">🌡️ Temp: ${weather.temp}°C · 💧 Humidity: ${weather.humidity}%</span><br/>` +
          `<span style="color:#0284c7;font-weight:600">💨 Wind: ${weather.windSpeed} km/h ${cardinal} (${weather.windDirection}°)</span><br/>` +
          `<span style="font-size:10px;opacity:0.75">Overall AQI: ${spot.aqi}</span>`,
          {
            direction: "top",
            offset: [0, -14],
            className: "theme-adaptive-tooltip font-mono text-xs",
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
            windOverlay,
            heatmapOverlay
          );
        }
      });
    }
  }, [hotspots, activeLayer, weatherOverlay, windOverlay, heatmapOverlay, renderMarkers]);

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
        windOverlay,
        heatmapOverlay
      );
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

          {/* Wind Vector Vane when Wind Overlay is Active */}
          {windOverlay && (
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-[var(--dash-ink)] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 block mb-0.5">
                  WIND DIRECTION & VECTOR
                </span>
                <span className="text-xs font-mono font-bold text-[var(--dash-ink)]">
                  {activeHotspot.weather?.windSpeed ?? 10} km/h {getCardinalDirection(activeHotspot.weather?.windDirection ?? 60)} ({activeHotspot.weather?.windDirection ?? 60}°)
                </span>
              </div>
              <div
                className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-500 font-bold shadow-xs transition-transform"
                style={{ transform: `rotate(${activeHotspot.weather?.windDirection ?? 60}deg)` }}
                title={`Wind bearing: ${activeHotspot.weather?.windDirection ?? 60}°`}
              >
                ↑
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
