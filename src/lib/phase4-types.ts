export type HourlyAirQuality = {
  time: string[];
  pm2_5?: (number | null)[];
  pm10?: (number | null)[];
  us_aqi?: (number | null)[];
  ozone?: (number | null)[];
  nitrogen_dioxide?: (number | null)[];
  sulphur_dioxide?: (number | null)[];
  carbon_monoxide?: (number | null)[];
};

export type AirSeriesResponse = {
  latitude: number;
  longitude: number;
  timezone: string;
  hourly: HourlyAirQuality;
  hourly_units?: Record<string, string>;
  provenance: "modeled-historical" | "modeled-forecast";
  source: string;
};
