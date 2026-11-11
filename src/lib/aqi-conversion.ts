/**
 * CPCB / Indian NAQI Standard Breakpoint Conversion & Visual Color Bands
 */

export interface AqiCategory {
  min: number;
  max: number;
  label: string;
  sublabel: string;
  bg: string;
  text: string;
}

export const CPCB_AQI_CATEGORIES: AqiCategory[] = [
  { min: 0, max: 50, label: "0–50", sublabel: "Good", bg: "#00A3A6", text: "#ffffff" },
  { min: 51, max: 100, label: "51–100", sublabel: "Satisfactory", bg: "#72BF44", text: "#0d2605" },
  { min: 101, max: 200, label: "101–200", sublabel: "Moderate", bg: "#FFC20E", text: "#332400" },
  { min: 201, max: 300, label: "201–300", sublabel: "Poor", bg: "#F37023", text: "#ffffff" },
  { min: 301, max: 400, label: "301–400", sublabel: "Very Poor", bg: "#EE4036", text: "#ffffff" },
  { min: 401, max: 500, label: "401–500", sublabel: "Severe", bg: "#80243B", text: "#ffffff" },
];

export function getCpcbCategory(aqi: number | null): AqiCategory | null {
  if (aqi === null || aqi === undefined || isNaN(aqi)) return null;
  const rounded = Math.round(aqi);
  for (const cat of CPCB_AQI_CATEGORIES) {
    if (rounded <= cat.max) return cat;
  }
  return CPCB_AQI_CATEGORIES[CPCB_AQI_CATEGORIES.length - 1];
}

/**
 * CPCB Piecewise Linear Conversion for PM2.5 (µg/m³) -> Indian NAQI (0–500)
 * Breakpoints (CPCB Guidelines):
 * 0 - 30   -> 0 - 50
 * 31 - 60  -> 51 - 100
 * 61 - 90  -> 101 - 200
 * 91 - 120 -> 201 - 300
 * 121 - 250 -> 301 - 400
 * 250+     -> 401 - 500
 */
export function pm25ToCpcbAqi(pm25: number | null): number | null {
  if (pm25 === null || pm25 === undefined || isNaN(pm25)) return null;
  if (pm25 <= 0) return 0;
  if (pm25 <= 30) {
    return Math.round((pm25 / 30) * 50);
  }
  if (pm25 <= 60) {
    return Math.round(50 + ((pm25 - 30) / 30) * 50);
  }
  if (pm25 <= 90) {
    return Math.round(100 + ((pm25 - 60) / 30) * 100);
  }
  if (pm25 <= 120) {
    return Math.round(200 + ((pm25 - 90) / 30) * 100);
  }
  if (pm25 <= 250) {
    return Math.round(300 + ((pm25 - 120) / 130) * 100);
  }
  return Math.min(500, Math.round(400 + ((pm25 - 250) / 130) * 100));
}
