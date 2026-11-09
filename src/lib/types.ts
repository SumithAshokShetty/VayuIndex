export type Location = {
  name: string;
  admin?: string;
  country?: string;
  latitude: number;
  longitude: number;
};

export type AirCurrent = Record<string, number | string | null> & {
  time: string;
  aqi: number | null;
};

export type AirQualityResponse = {
  provider: "cpcb" | "openaq" | "waqi" | "open-meteo";
  provenance: "station-observation" | "modeled-estimate";
  sourceLabel: string;
  sourceUrl: string;
  stationName?: string;
  stationUrl?: string;
  stationLatitude?: number;
  stationLongitude?: number;
  fallbackNote?: string;
  attribution: { name: string; url?: string }[];
  measurementTimes?: Record<string, string>;
  latitude: number;
  longitude: number;
  timezone: string;
  current: AirCurrent;
  current_units?: Record<string, string>;
};

export type GeocodedPlace = {
  id: number;
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
};
