import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getContinentForCountry, Continent } from "@/lib/continents";
import { pm25ToCpcbAqi, getCpcbCategory } from "@/lib/aqi-conversion";

export interface HistoricalCityRecord {
  rank: number;
  city: string;
  country: string;
  fullName: string;
  continent?: Continent;
  // PM2.5 in µg/m³
  pm25_2025: number | null;
  pm25_2024: number | null;
  pm25_2023: number | null;
  pm25_2022: number | null;
  pm25_2021: number | null;
  pm25_2020: number | null;
  pm25_2019: number | null;
  pm25_2018: number | null;
  pm25_2017: number | null;
  // CPCB / Indian NAQI
  aqi_2025?: number | null;
  aqi_2024?: number | null;
  aqi_2023?: number | null;
  aqi_2022?: number | null;
  aqi_2021?: number | null;
  status_2025?: string | null;
}

export interface HistoricalCountryRecord {
  rank: number;
  country: string;
  population: number | null;
  continent?: Continent;
  pm25_2025: number | null;
  pm25_2024: number | null;
  pm25_2023: number | null;
  pm25_2022: number | null;
  pm25_2021: number | null;
  pm25_2020: number | null;
  pm25_2019: number | null;
  pm25_2018: number | null;
  // CPCB / Indian NAQI
  aqi_2025?: number | null;
  aqi_2024?: number | null;
  aqi_2023?: number | null;
  aqi_2022?: number | null;
  aqi_2021?: number | null;
  status_2025?: string | null;
}

// In-memory cache
let cachedPm25Cities: HistoricalCityRecord[] | null = null;
let cachedPm25Countries: HistoricalCountryRecord[] | null = null;
let cachedAqiCities: HistoricalCityRecord[] | null = null;
let cachedAqiCountries: HistoricalCountryRecord[] | null = null;
let cachedCountryList: string[] | null = null;
let cachedSummary: any = null;

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseNumber(val: string | undefined): number | null {
  if (!val) return null;
  const cleaned = val.replace(/["']/g, "").trim();
  if (cleaned === "" || cleaned === "-" || cleaned === "--") return null;
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : null;
}

function loadData() {
  if (cachedPm25Cities && cachedPm25Countries && cachedAqiCities && cachedAqiCountries) {
    return;
  }

  const baseDir = path.join(process.cwd(), "src", "data", "iqair");
  const cityPm25Path = path.join(baseDir, "iqair_city_rankings.csv");
  const countryPm25Path = path.join(baseDir, "iqair_country_rankings.csv");
  const cityAqiPath = path.join(baseDir, "iqair_city_aqi.csv");
  const countryAqiPath = path.join(baseDir, "iqair_country_aqi.csv");
  const summaryPath = path.join(baseDir, "iqair_report_summary.json");

  // Load summary
  try {
    if (fs.existsSync(summaryPath)) {
      cachedSummary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
    }
  } catch (err) {
    console.error("Error loading IQAir summary JSON:", err);
  }

  const countrySet = new Set<string>();

  // 1. Load User's Curated AQI City Dataset (In exact order given)
  try {
    if (fs.existsSync(cityAqiPath)) {
      const content = fs.readFileSync(cityAqiPath, "utf8");
      const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const aqiCities: HistoricalCityRecord[] = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = parseCSVLine(lines[i]);
        if (parts.length < 3) continue;

        const rank = parseInt(parts[0], 10) || i;
        const sourceStr = parts[1].replace(/^"|"$/g, "").trim();

        let city = sourceStr;
        let country = "";
        const commaIdx = sourceStr.indexOf(",");
        if (commaIdx !== -1) {
          city = sourceStr.slice(0, commaIdx).trim();
          country = sourceStr.slice(commaIdx + 1).trim();
        }

        if (country) countrySet.add(country);

        const aqi_2025 = parseNumber(parts[2]);
        const status_2025 = parts[3] ? parts[3].trim() : (getCpcbCategory(aqi_2025)?.sublabel ?? null);
        const aqi_2024 = parseNumber(parts[4]);
        const aqi_2023 = parseNumber(parts[6]);
        const aqi_2022 = parseNumber(parts[8]);
        const aqi_2021 = parseNumber(parts[10]);

        aqiCities.push({
          rank,
          city,
          country,
          fullName: sourceStr,
          continent: getContinentForCountry(country),
          pm25_2025: aqi_2025 !== null ? Number((aqi_2025 * 0.45).toFixed(1)) : null,
          pm25_2024: aqi_2024 !== null ? Number((aqi_2024 * 0.45).toFixed(1)) : null,
          pm25_2023: aqi_2023 !== null ? Number((aqi_2023 * 0.45).toFixed(1)) : null,
          pm25_2022: aqi_2022 !== null ? Number((aqi_2022 * 0.45).toFixed(1)) : null,
          pm25_2021: aqi_2021 !== null ? Number((aqi_2021 * 0.45).toFixed(1)) : null,
          pm25_2020: null,
          pm25_2019: null,
          pm25_2018: null,
          pm25_2017: null,
          aqi_2025,
          aqi_2024,
          aqi_2023,
          aqi_2022,
          aqi_2021,
          status_2025,
        });
      }

      cachedAqiCities = aqiCities;
    }
  } catch (err) {
    console.error("Error loading IQAir city AQI CSV:", err);
    cachedAqiCities = [];
  }

  // 2. Load User's Curated AQI Country Dataset (In exact order given)
  try {
    if (fs.existsSync(countryAqiPath)) {
      const content = fs.readFileSync(countryAqiPath, "utf8");
      const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const aqiCountries: HistoricalCountryRecord[] = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = parseCSVLine(lines[i]);
        if (parts.length < 3) continue;

        const rank = parseInt(parts[0], 10) || i;
        const country = parts[1].replace(/^"|"$/g, "").trim();

        if (country) countrySet.add(country);

        const aqi_2025 = parseNumber(parts[2]);
        const status_2025 = parts[3] ? parts[3].trim() : (getCpcbCategory(aqi_2025)?.sublabel ?? null);
        const aqi_2024 = parseNumber(parts[4]);
        const aqi_2023 = parseNumber(parts[6]);
        const aqi_2022 = parseNumber(parts[8]);
        const aqi_2021 = parseNumber(parts[10]);

        aqiCountries.push({
          rank,
          country,
          continent: getContinentForCountry(country),
          population: null,
          pm25_2025: aqi_2025 !== null ? Number((aqi_2025 * 0.45).toFixed(1)) : null,
          pm25_2024: aqi_2024 !== null ? Number((aqi_2024 * 0.45).toFixed(1)) : null,
          pm25_2023: aqi_2023 !== null ? Number((aqi_2023 * 0.45).toFixed(1)) : null,
          pm25_2022: aqi_2022 !== null ? Number((aqi_2022 * 0.45).toFixed(1)) : null,
          pm25_2021: aqi_2021 !== null ? Number((aqi_2021 * 0.45).toFixed(1)) : null,
          pm25_2020: null,
          pm25_2019: null,
          pm25_2018: null,
          aqi_2025,
          aqi_2024,
          aqi_2023,
          aqi_2022,
          aqi_2021,
          status_2025,
        });
      }

      cachedAqiCountries = aqiCountries;
    }
  } catch (err) {
    console.error("Error loading IQAir country AQI CSV:", err);
    cachedAqiCountries = [];
  }

  // 3. Load 9,000+ PM2.5 Cities Dataset
  try {
    if (fs.existsSync(cityPm25Path)) {
      const cityContent = fs.readFileSync(cityPm25Path, "utf8");
      const lines = cityContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const cities: HistoricalCityRecord[] = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = parseCSVLine(lines[i]);
        if (parts.length < 2) continue;

        const rank = parseInt(parts[0], 10) || i;
        const sourceStr = parts[1].replace(/^"|"$/g, "").trim();

        let city = sourceStr;
        let country = "";
        const commaIdx = sourceStr.indexOf(",");
        if (commaIdx !== -1) {
          city = sourceStr.slice(0, commaIdx).trim();
          country = sourceStr.slice(commaIdx + 1).trim();
        }

        if (country) countrySet.add(country);

        const pm25_2025 = parseNumber(parts[2]);
        const pm25_2024 = parseNumber(parts[3]);
        const pm25_2023 = parseNumber(parts[4]);
        const pm25_2022 = parseNumber(parts[5]);
        const pm25_2021 = parseNumber(parts[6]);

        const aqi_2025 = pm25ToCpcbAqi(pm25_2025);
        const aqi_2024 = pm25ToCpcbAqi(pm25_2024);
        const aqi_2023 = pm25ToCpcbAqi(pm25_2023);
        const aqi_2022 = pm25ToCpcbAqi(pm25_2022);
        const aqi_2021 = pm25ToCpcbAqi(pm25_2021);
        const status_2025 = getCpcbCategory(aqi_2025)?.sublabel ?? null;

        cities.push({
          rank,
          city,
          country,
          fullName: sourceStr,
          continent: getContinentForCountry(country),
          pm25_2025,
          pm25_2024,
          pm25_2023,
          pm25_2022,
          pm25_2021,
          pm25_2020: parseNumber(parts[7]),
          pm25_2019: parseNumber(parts[8]),
          pm25_2018: parseNumber(parts[9]),
          pm25_2017: parseNumber(parts[10]),
          aqi_2025,
          aqi_2024,
          aqi_2023,
          aqi_2022,
          aqi_2021,
          status_2025,
        });
      }

      cachedPm25Cities = cities;
      cachedCountryList = Array.from(countrySet).sort((a, b) => a.localeCompare(b));
    }
  } catch (err) {
    console.error("Error loading IQAir city PM2.5 CSV:", err);
    cachedPm25Cities = [];
  }

  // 4. Load 140+ PM2.5 Countries Dataset
  try {
    if (fs.existsSync(countryPm25Path)) {
      const countryContent = fs.readFileSync(countryPm25Path, "utf8");
      const lines = countryContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const countries: HistoricalCountryRecord[] = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = parseCSVLine(lines[i]);
        if (parts.length < 2) continue;

        const rank = parseInt(parts[0], 10) || i;
        const country = parts[1].replace(/^"|"$/g, "").trim();

        if (country) countrySet.add(country);

        const pm25_2025 = parseNumber(parts[2]);
        const pm25_2024 = parseNumber(parts[3]);
        const pm25_2023 = parseNumber(parts[4]);
        const pm25_2022 = parseNumber(parts[5]);
        const pm25_2021 = parseNumber(parts[6]);

        const aqi_2025 = pm25ToCpcbAqi(pm25_2025);
        const aqi_2024 = pm25ToCpcbAqi(pm25_2024);
        const aqi_2023 = pm25ToCpcbAqi(pm25_2023);
        const aqi_2022 = pm25ToCpcbAqi(pm25_2022);
        const aqi_2021 = pm25ToCpcbAqi(pm25_2021);
        const status_2025 = getCpcbCategory(aqi_2025)?.sublabel ?? null;

        countries.push({
          rank,
          country,
          continent: getContinentForCountry(country),
          population: parseNumber(parts[10]),
          pm25_2025,
          pm25_2024,
          pm25_2023,
          pm25_2022,
          pm25_2021,
          pm25_2020: parseNumber(parts[7]),
          pm25_2019: parseNumber(parts[8]),
          pm25_2018: parseNumber(parts[9]),
          aqi_2025,
          aqi_2024,
          aqi_2023,
          aqi_2022,
          aqi_2021,
          status_2025,
        });
      }

      cachedPm25Countries = countries;
    }
  } catch (err) {
    console.error("Error loading IQAir country PM2.5 CSV:", err);
    cachedPm25Countries = [];
  }
}

export async function GET(request: NextRequest) {
  loadData();

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") || "city";
  const search = (searchParams.get("search") || "").toLowerCase().trim();
  const countryFilter = searchParams.get("country") || "";
  const continentFilter = searchParams.get("continent") || "";
  const metric = searchParams.get("metric") || "pm25"; // "pm25" or "aqi"
  const yearFilter = searchParams.get("year");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(200, Math.max(10, parseInt(searchParams.get("limit") || "50", 10)));

  // ----------------------------------------------------
  // Country Mode
  // ----------------------------------------------------
  if (type === "country") {
    // When metric is "aqi", use the user's provided AQI country dataset in the exact order given
    let list =
      metric === "aqi"
        ? [...(cachedAqiCountries || [])]
        : [...(cachedPm25Countries || [])];

    if (search) {
      list = list.filter((c) => c.country.toLowerCase().includes(search));
    }

    if (continentFilter && continentFilter !== "All") {
      list = list.filter((c) => c.continent === continentFilter);
    }

    // Only re-sort if explicitly requested by yearFilter in PM2.5 mode;
    // In AQI mode, preserve the user's provided ranking order exactly as given
    if (metric === "pm25" && yearFilter) {
      const yearKey = `pm25_${yearFilter}` as keyof HistoricalCountryRecord;
      list.sort((a, b) => {
        const valA = (a[yearKey] as number | null) ?? -1;
        const valB = (b[yearKey] as number | null) ?? -1;
        return valB - valA;
      });
    }

    const total = list.length;
    const totalPages = Math.ceil(total / limit);
    const paginated = list.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      type: "country",
      metric,
      continent: continentFilter,
      total,
      page,
      limit,
      totalPages,
      summary: cachedSummary,
      data: paginated,
    });
  }

  // ----------------------------------------------------
  // City Mode
  // ----------------------------------------------------
  // When metric is "aqi", use the user's provided AQI city dataset in the exact order given (Rank 1..300)
  let list =
    metric === "aqi"
      ? [...(cachedAqiCities || [])]
      : [...(cachedPm25Cities || [])];

  if (search) {
    list = list.filter(
      (c) =>
        c.city.toLowerCase().includes(search) ||
        c.country.toLowerCase().includes(search) ||
        c.fullName.toLowerCase().includes(search)
    );
  }

  if (countryFilter && countryFilter !== "All") {
    list = list.filter((c) => c.country.toLowerCase() === countryFilter.toLowerCase());
  }

  if (continentFilter && continentFilter !== "All") {
    list = list.filter((c) => c.continent === continentFilter);
  }

  // Only re-sort if explicitly requested by yearFilter in PM2.5 mode;
  // In AQI mode, preserve the user's provided ranking order exactly as given (1: Ghaziabad, 2: New Delhi, etc.)
  if (metric === "pm25" && yearFilter) {
    const yearKey = `pm25_${yearFilter}` as keyof HistoricalCityRecord;
    list.sort((a, b) => {
      const valA = (a[yearKey] as number | null) ?? -1;
      const valB = (b[yearKey] as number | null) ?? -1;
      return valB - valA;
    });
  }

  const total = list.length;
  const totalPages = Math.ceil(total / limit);
  const paginated = list.slice((page - 1) * limit, page * limit);

  return NextResponse.json({
    type: "city",
    metric,
    continent: continentFilter,
    total,
    page,
    limit,
    totalPages,
    countries: cachedCountryList || [],
    summary: cachedSummary,
    data: paginated,
  });
}
