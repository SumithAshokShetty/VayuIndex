/**
 * Pollutant sub-index calculations using the piecewise-linear AQI formula.
 * Inputs must be time-averaged concentrations that satisfy the selected
 * standard's averaging period. This module intentionally does not infer or
 * manufacture those averages from instantaneous sensor samples.
 */

export type AqiStandard = "epa" | "cpcb";
export type Pollutant = "pm2_5" | "pm10" | "no2" | "so2" | "co" | "o3";
export type ConcentrationUnit = "µg/m³" | "mg/m³" | "ppm" | "ppb";
export type OzoneAveragingPeriod = "8h" | "1h";

export type PollutantConcentration = {
  value: number;
  unit: ConcentrationUnit;
  /** EPA/CPCB ozone uses 8-hour values; EPA may use 1-hour values for high AQI. */
  averagingPeriod?: OzoneAveragingPeriod;
};

export type AqiSubIndex = {
  pollutant: Pollutant;
  value: number;
  category: string;
  color: string;
  concentration: number;
  unit: ConcentrationUnit;
};

export type AqiResult = {
  standard: AqiStandard;
  aqi: number | null;
  category: string | null;
  color: string | null;
  dominantPollutant: Pollutant | null;
  subIndices: Partial<Record<Pollutant, AqiSubIndex>>;
};

type Breakpoint = { concentrationLow: number; concentrationHigh: number; indexLow: number; indexHigh: number };

export const AQI_COLORS = ["#00E400", "#FFFF00", "#FF7E00", "#FF0000", "#8F3F97", "#7E0023"] as const;
const EPA_CATEGORIES = ["Good", "Moderate", "Unhealthy for Sensitive Groups", "Unhealthy", "Very Unhealthy", "Hazardous"] as const;
const CPCB_CATEGORIES = ["Good", "Satisfactory", "Moderately Polluted", "Poor", "Very Poor", "Severe"] as const;
const EPA_AQI_BANDS: readonly [number, number][] = [[0, 50], [51, 100], [101, 150], [151, 200], [201, 300], [301, 500]];
const CPCB_AQI_BANDS: readonly [number, number][] = [[0, 50], [51, 100], [101, 200], [201, 300], [301, 400], [401, 500]];

const EPA: Record<Pollutant, readonly Breakpoint[]> = {
  pm2_5: [
    { concentrationLow: 0, concentrationHigh: 9, indexLow: 0, indexHigh: 50 },
    { concentrationLow: 9.1, concentrationHigh: 35.4, indexLow: 51, indexHigh: 100 },
    { concentrationLow: 35.5, concentrationHigh: 55.4, indexLow: 101, indexHigh: 150 },
    { concentrationLow: 55.5, concentrationHigh: 125.4, indexLow: 151, indexHigh: 200 },
    { concentrationLow: 125.5, concentrationHigh: 225.4, indexLow: 201, indexHigh: 300 },
    { concentrationLow: 225.5, concentrationHigh: 325.4, indexLow: 301, indexHigh: 500 },
  ],
  pm10: [
    { concentrationLow: 0, concentrationHigh: 54, indexLow: 0, indexHigh: 50 },
    { concentrationLow: 55, concentrationHigh: 154, indexLow: 51, indexHigh: 100 },
    { concentrationLow: 155, concentrationHigh: 254, indexLow: 101, indexHigh: 150 },
    { concentrationLow: 255, concentrationHigh: 354, indexLow: 151, indexHigh: 200 },
    { concentrationLow: 355, concentrationHigh: 424, indexLow: 201, indexHigh: 300 },
    { concentrationLow: 425, concentrationHigh: 604, indexLow: 301, indexHigh: 500 },
  ],
  co: [
    { concentrationLow: 0, concentrationHigh: 4.4, indexLow: 0, indexHigh: 50 },
    { concentrationLow: 4.5, concentrationHigh: 9.4, indexLow: 51, indexHigh: 100 },
    { concentrationLow: 9.5, concentrationHigh: 12.4, indexLow: 101, indexHigh: 150 },
    { concentrationLow: 12.5, concentrationHigh: 15.4, indexLow: 151, indexHigh: 200 },
    { concentrationLow: 15.5, concentrationHigh: 30.4, indexLow: 201, indexHigh: 300 },
    { concentrationLow: 30.5, concentrationHigh: 50.4, indexLow: 301, indexHigh: 500 },
  ],
  so2: [
    { concentrationLow: 0, concentrationHigh: 35, indexLow: 0, indexHigh: 50 },
    { concentrationLow: 36, concentrationHigh: 75, indexLow: 51, indexHigh: 100 },
    { concentrationLow: 76, concentrationHigh: 185, indexLow: 101, indexHigh: 150 },
    { concentrationLow: 186, concentrationHigh: 304, indexLow: 151, indexHigh: 200 },
    { concentrationLow: 305, concentrationHigh: 604, indexLow: 201, indexHigh: 300 },
    { concentrationLow: 605, concentrationHigh: 1004, indexLow: 301, indexHigh: 500 },
  ],
  no2: [
    { concentrationLow: 0, concentrationHigh: 53, indexLow: 0, indexHigh: 50 },
    { concentrationLow: 54, concentrationHigh: 100, indexLow: 51, indexHigh: 100 },
    { concentrationLow: 101, concentrationHigh: 360, indexLow: 101, indexHigh: 150 },
    { concentrationLow: 361, concentrationHigh: 649, indexLow: 151, indexHigh: 200 },
    { concentrationLow: 650, concentrationHigh: 1249, indexLow: 201, indexHigh: 300 },
    { concentrationLow: 1250, concentrationHigh: 2049, indexLow: 301, indexHigh: 500 },
  ],
  // The 1-hour ozone scale is used above the 8-hour scale's AQI ceiling.
  // The caller should pass the valid averaging period with its measurement.
  o3: [
    { concentrationLow: 0, concentrationHigh: 0.054, indexLow: 0, indexHigh: 50 },
    { concentrationLow: 0.055, concentrationHigh: 0.070, indexLow: 51, indexHigh: 100 },
    { concentrationLow: 0.071, concentrationHigh: 0.085, indexLow: 101, indexHigh: 150 },
    { concentrationLow: 0.086, concentrationHigh: 0.105, indexLow: 151, indexHigh: 200 },
    { concentrationLow: 0.106, concentrationHigh: 0.200, indexLow: 201, indexHigh: 300 },
  ],
};

const EPA_OZONE_1H: readonly Breakpoint[] = [
  { concentrationLow: 0.125, concentrationHigh: 0.164, indexLow: 101, indexHigh: 150 },
  { concentrationLow: 0.165, concentrationHigh: 0.204, indexLow: 151, indexHigh: 200 },
  { concentrationLow: 0.205, concentrationHigh: 0.404, indexLow: 201, indexHigh: 300 },
  { concentrationLow: 0.405, concentrationHigh: 0.604, indexLow: 301, indexHigh: 500 },
];

const CPCB: Record<Pollutant, readonly Breakpoint[]> = {
  pm2_5: [
    { concentrationLow: 0, concentrationHigh: 30, indexLow: 0, indexHigh: 50 },
    { concentrationLow: 31, concentrationHigh: 60, indexLow: 51, indexHigh: 100 },
    { concentrationLow: 61, concentrationHigh: 90, indexLow: 101, indexHigh: 200 },
    { concentrationLow: 91, concentrationHigh: 120, indexLow: 201, indexHigh: 300 },
    { concentrationLow: 121, concentrationHigh: 250, indexLow: 301, indexHigh: 400 },
  ],
  pm10: [
    { concentrationLow: 0, concentrationHigh: 50, indexLow: 0, indexHigh: 50 },
    { concentrationLow: 51, concentrationHigh: 100, indexLow: 51, indexHigh: 100 },
    { concentrationLow: 101, concentrationHigh: 250, indexLow: 101, indexHigh: 200 },
    { concentrationLow: 251, concentrationHigh: 350, indexLow: 201, indexHigh: 300 },
    { concentrationLow: 351, concentrationHigh: 430, indexLow: 301, indexHigh: 400 },
  ],
  no2: [
    { concentrationLow: 0, concentrationHigh: 40, indexLow: 0, indexHigh: 50 },
    { concentrationLow: 41, concentrationHigh: 80, indexLow: 51, indexHigh: 100 },
    { concentrationLow: 81, concentrationHigh: 180, indexLow: 101, indexHigh: 200 },
    { concentrationLow: 181, concentrationHigh: 280, indexLow: 201, indexHigh: 300 },
    { concentrationLow: 281, concentrationHigh: 400, indexLow: 301, indexHigh: 400 },
  ],
  so2: [
    { concentrationLow: 0, concentrationHigh: 40, indexLow: 0, indexHigh: 50 },
    { concentrationLow: 41, concentrationHigh: 80, indexLow: 51, indexHigh: 100 },
    { concentrationLow: 81, concentrationHigh: 380, indexLow: 101, indexHigh: 200 },
    { concentrationLow: 381, concentrationHigh: 800, indexLow: 201, indexHigh: 300 },
    { concentrationLow: 801, concentrationHigh: 1600, indexLow: 301, indexHigh: 400 },
  ],
  co: [
    { concentrationLow: 0, concentrationHigh: 1, indexLow: 0, indexHigh: 50 },
    { concentrationLow: 1.1, concentrationHigh: 2, indexLow: 51, indexHigh: 100 },
    { concentrationLow: 2.1, concentrationHigh: 10, indexLow: 101, indexHigh: 200 },
    { concentrationLow: 10.1, concentrationHigh: 17, indexLow: 201, indexHigh: 300 },
    { concentrationLow: 17.1, concentrationHigh: 34, indexLow: 301, indexHigh: 400 },
  ],
  o3: [
    { concentrationLow: 0, concentrationHigh: 50, indexLow: 0, indexHigh: 50 },
    { concentrationLow: 51, concentrationHigh: 100, indexLow: 51, indexHigh: 100 },
    { concentrationLow: 101, concentrationHigh: 168, indexLow: 101, indexHigh: 200 },
    { concentrationLow: 169, concentrationHigh: 208, indexLow: 201, indexHigh: 300 },
    { concentrationLow: 209, concentrationHigh: 748, indexLow: 301, indexHigh: 400 },
  ],
};

const MOLECULAR_WEIGHT: Partial<Record<Pollutant, number>> = { no2: 46.0055, so2: 64.066, co: 28.0101, o3: 47.9982 };

function unitFor(standard: AqiStandard, pollutant: Pollutant): ConcentrationUnit {
  if (standard === "cpcb") return pollutant === "co" ? "mg/m³" : "µg/m³";
  if (pollutant === "co" || pollutant === "o3") return "ppm";
  if (pollutant === "no2" || pollutant === "so2") return "ppb";
  return "µg/m³";
}

/** Convert compatible mass/volume or gas mixing-ratio units at 25 °C, 1 atm. */
export function convertConcentration(value: number, from: ConcentrationUnit, to: ConcentrationUnit, pollutant: Pollutant): number {
  if (from === to) return value;
  if (pollutant === "pm2_5" || pollutant === "pm10") {
    if (from === "ppm" || from === "ppb" || to === "ppm" || to === "ppb") throw new Error(`${pollutant} requires mass concentration units.`);
    const ug = from === "mg/m³" ? value * 1000 : value;
    return to === "mg/m³" ? ug / 1000 : ug;
  }
  const molecularWeight = MOLECULAR_WEIGHT[pollutant];
  if (!molecularWeight) throw new Error(`Cannot convert units for ${pollutant}.`);
  const ppm = from === "ppm" ? value
    : from === "ppb" ? value / 1000
      : (from === "mg/m³" ? value : value / 1000) * 24.45 / molecularWeight;
  if (to === "ppm") return ppm;
  if (to === "ppb") return ppm * 1000;
  const mgPerM3 = ppm * molecularWeight / 24.45;
  return to === "mg/m³" ? mgPerM3 : mgPerM3 * 1000;
}

function roundForStandard(value: number, standard: AqiStandard, pollutant: Pollutant): number {
  if (standard === "cpcb") return pollutant === "co" ? Math.floor(value * 10 + 1e-10) / 10 : Math.floor(value + 1e-10);
  const precision = pollutant === "pm2_5" || pollutant === "co" ? 10 : pollutant === "o3" ? 1000 : 1;
  return Math.floor(value * precision + 1e-10) / precision;
}

function categoryFor(aqi: number, standard: AqiStandard) {
  const bands = standard === "epa" ? EPA_AQI_BANDS : CPCB_AQI_BANDS;
  const band = bands.findIndex(([, high], index) => aqi <= high && (index === 0 || aqi >= bands[index][0]));
  const safeBand = Math.max(0, band);
  return { category: (standard === "epa" ? EPA_CATEGORIES : CPCB_CATEGORIES)[safeBand], color: AQI_COLORS[safeBand] };
}

function interpolate(value: number, breaks: readonly Breakpoint[]): number | null {
  const first = breaks[0];
  if (value < first.concentrationLow) return 0;
  const band = breaks.find((item) => value >= item.concentrationLow && value <= item.concentrationHigh);
  if (band) return Math.round(((band.indexHigh - band.indexLow) / (band.concentrationHigh - band.concentrationLow)) * (value - band.concentrationLow) + band.indexLow);
  const last = breaks[breaks.length - 1];
  if (value > last.concentrationHigh) {
    if (last.indexHigh >= 500) return 500;
    const slope = (last.indexHigh - last.indexLow) / (last.concentrationHigh - last.concentrationLow);
    return Math.max(0, Math.min(500, Math.round(slope * (value - last.concentrationLow) + last.indexLow)));
  }
  return null;
}

export function calculateSubIndex(
  pollutant: Pollutant,
  input: PollutantConcentration,
  standard: AqiStandard = "epa",
): AqiSubIndex | null {
  if (!Number.isFinite(input.value) || input.value < 0) return null;
  if (pollutant === "o3" && standard === "epa" && input.averagingPeriod === "1h" && input.value < 0.125) return null;
  if (pollutant === "o3" && standard === "epa" && input.averagingPeriod !== "1h" && input.value > 0.200) return null;
  if (pollutant === "o3" && standard === "cpcb" && input.averagingPeriod === "1h") return null;
  const unit = unitFor(standard, pollutant);
  const concentration = roundForStandard(convertConcentration(input.value, input.unit, unit, pollutant), standard, pollutant);
  let breakpoints = standard === "epa" ? EPA[pollutant] : CPCB[pollutant];
  if (standard === "epa" && pollutant === "o3" && input.averagingPeriod === "1h") breakpoints = EPA_OZONE_1H;
  const value = interpolate(concentration, breakpoints);
  if (value === null) return null;
  const { category, color } = categoryFor(value, standard);
  return { pollutant, value, category, color, concentration, unit };
}

/** Composite AQI is the maximum valid pollutant sub-index. */
export function calculateCompositeAqi(
  concentrations: Partial<Record<Pollutant, PollutantConcentration>>,
  standard: AqiStandard = "epa",
): AqiResult {
  const subIndices: Partial<Record<Pollutant, AqiSubIndex>> = {};
  for (const pollutant of Object.keys(concentrations) as Pollutant[]) {
    const measurement = concentrations[pollutant];
    if (!measurement) continue;
    const result = calculateSubIndex(pollutant, measurement, standard);
    if (result) subIndices[pollutant] = result;
  }
  const dominantPollutant = (Object.keys(subIndices) as Pollutant[]).reduce<Pollutant | null>(
    (dominant, pollutant) => dominant === null || subIndices[pollutant]!.value > subIndices[dominant]!.value ? pollutant : dominant,
    null,
  );
  const aqi = dominantPollutant ? subIndices[dominantPollutant]!.value : null;
  const band = aqi === null ? null : categoryFor(aqi, standard);
  return { standard, aqi, category: band?.category ?? null, color: band?.color ?? null, dominantPollutant, subIndices };
}
