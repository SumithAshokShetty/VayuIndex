export type Continent =
  | "All"
  | "Africa"
  | "Asia"
  | "Europe"
  | "North America"
  | "Oceania"
  | "South America";

export const CONTINENTS: Continent[] = [
  "All",
  "Africa",
  "Asia",
  "Europe",
  "North America",
  "Oceania",
  "South America",
];

// Comprehensive Country to Continent mapping
export const COUNTRY_TO_CONTINENT: Record<string, Continent> = {
  // Asia
  India: "Asia",
  China: "Asia",
  Pakistan: "Asia",
  Bangladesh: "Asia",
  Tajikistan: "Asia",
  Uzbekistan: "Asia",
  Kyrgyzstan: "Asia",
  Kazakhstan: "Asia",
  Turkmenistan: "Asia",
  Nepal: "Asia",
  "Sri Lanka": "Asia",
  Myanmar: "Asia",
  Laos: "Asia",
  Vietnam: "Asia",
  Cambodia: "Asia",
  Thailand: "Asia",
  Malaysia: "Asia",
  Singapore: "Asia",
  Indonesia: "Asia",
  Philippines: "Asia",
  Japan: "Asia",
  "South Korea": "Asia",
  "North Korea": "Asia",
  Taiwan: "Asia",
  Mongolia: "Asia",
  "United Arab Emirates": "Asia",
  "Saudi Arabia": "Asia",
  Qatar: "Asia",
  Kuwait: "Asia",
  Bahrain: "Asia",
  Oman: "Asia",
  Iraq: "Asia",
  Iran: "Asia",
  Jordan: "Asia",
  Lebanon: "Asia",
  Syria: "Asia",
  Israel: "Asia",
  Palestine: "Asia",
  Yemen: "Asia",
  Armenia: "Asia",
  Azerbaijan: "Asia",
  Georgia: "Asia",
  Cyprus: "Asia",
  Turkey: "Asia",
  Brunei: "Asia",
  Maldives: "Asia",
  "Hong Kong SAR": "Asia",
  "Macao SAR": "Asia",
  Afghanistan: "Asia",
  Bhutan: "Asia",
  Timor_Leste: "Asia",

  // Europe
  "United Kingdom": "Europe",
  UK: "Europe",
  Germany: "Europe",
  France: "Europe",
  Italy: "Europe",
  Spain: "Europe",
  Portugal: "Europe",
  Poland: "Europe",
  Ukraine: "Europe",
  Russia: "Europe",
  Netherlands: "Europe",
  Belgium: "Europe",
  Switzerland: "Europe",
  Austria: "Europe",
  Sweden: "Europe",
  Norway: "Europe",
  Denmark: "Europe",
  Finland: "Europe",
  Iceland: "Europe",
  Ireland: "Europe",
  Greece: "Europe",
  "Czech Republic": "Europe",
  Czechia: "Europe",
  Slovakia: "Europe",
  Hungary: "Europe",
  Romania: "Europe",
  Bulgaria: "Europe",
  Serbia: "Europe",
  Croatia: "Europe",
  Slovenia: "Europe",
  "Bosnia Herzegovina": "Europe",
  "Bosnia and Herzegovina": "Europe",
  "North Macedonia": "Europe",
  Albania: "Europe",
  Montenegro: "Europe",
  Kosovo: "Europe",
  Moldova: "Europe",
  Belarus: "Europe",
  Estonia: "Europe",
  Latvia: "Europe",
  Lithuania: "Europe",
  Luxembourg: "Europe",
  Andorra: "Europe",
  "San Marino": "Europe",
  Liechtenstein: "Europe",
  Malta: "Europe",
  Monaco: "Europe",

  // Africa
  Egypt: "Africa",
  Chad: "Africa",
  Uganda: "Africa",
  "Democratic Republic of the Congo": "Africa",
  Nigeria: "Africa",
  "South Africa": "Africa",
  Gabon: "Africa",
  Ghana: "Africa",
  Senegal: "Africa",
  Ethiopia: "Africa",
  Kenya: "Africa",
  Cameroon: "Africa",
  "Ivory Coast": "Africa",
  "Cote D'Ivoire": "Africa",
  Benin: "Africa",
  Guinea: "Africa",
  Mali: "Africa",
  "Burkina Faso": "Africa",
  Togo: "Africa",
  Liberia: "Africa",
  Gambia: "Africa",
  "Cape Verde": "Africa",
  Angola: "Africa",
  Madagascar: "Africa",
  Botswana: "Africa",
  Zambia: "Africa",
  Morocco: "Africa",
  Algeria: "Africa",
  Namibia: "Africa",
  Rwanda: "Africa",
  Sudan: "Africa",
  "South Sudan": "Africa",
  Djibouti: "Africa",
  Eswatini: "Africa",
  Tanzania: "Africa",
  Zimbabwe: "Africa",
  Tunisia: "Africa",
  Libya: "Africa",
  Mauritania: "Africa",
  Niger: "Africa",
  Somalia: "Africa",
  "Canary Islands": "Africa",

  // North America
  "United States": "North America",
  USA: "North America",
  Canada: "North America",
  Mexico: "North America",
  Guatemala: "North America",
  "El Salvador": "North America",
  Honduras: "North America",
  "Costa Rica": "North America",
  Panama: "North America",
  Nicaragua: "North America",
  Haiti: "North America",
  "Trinidad and Tobago": "North America",
  "Trinidad And Tobago": "North America",
  Barbados: "North America",
  Grenada: "North America",
  Curacao: "North America",
  "Puerto Rico": "North America",
  "Cayman Islands": "North America",
  Bermuda: "North America",
  Anguilla: "North America",
  "U.S. Virgin Islands": "North America",
  Jamaica: "North America",
  Belize: "North America",
  Bahamas: "North America",

  // South America
  Brazil: "South America",
  Argentina: "South America",
  Colombia: "South America",
  Chile: "South America",
  Peru: "South America",
  Ecuador: "South America",
  Bolivia: "South America",
  Paraguay: "South America",
  Uruguay: "South America",
  Venezuela: "South America",
  Guyana: "South America",
  Suriname: "South America",

  // Oceania
  Australia: "Oceania",
  "New Zealand": "Oceania",
  "French Polynesia": "Oceania",
  "New Caledonia": "Oceania",
  Fiji: "Oceania",
  "Papua New Guinea": "Oceania",
};

export function getContinentForCountry(countryName: string): Continent {
  if (!countryName) return "All";
  const clean = countryName.trim();
  if (COUNTRY_TO_CONTINENT[clean]) return COUNTRY_TO_CONTINENT[clean];

  // Case-insensitive lookup
  const lower = clean.toLowerCase();
  for (const [key, continent] of Object.entries(COUNTRY_TO_CONTINENT)) {
    if (key.toLowerCase() === lower) return continent;
  }

  // Substring checks for special cases
  if (lower.includes("india") || lower.includes("china") || lower.includes("korea") || lower.includes("japan")) return "Asia";
  if (lower.includes("united states") || lower.includes("america") || lower.includes("canada") || lower.includes("mexico")) return "North America";
  if (lower.includes("brazil") || lower.includes("argentina") || lower.includes("chile") || lower.includes("colombia")) return "South America";
  if (lower.includes("uk") || lower.includes("britain") || lower.includes("france") || lower.includes("germany") || lower.includes("europe")) return "Europe";
  if (lower.includes("congo") || lower.includes("africa") || lower.includes("egypt")) return "Africa";
  if (lower.includes("zealand") || lower.includes("australia")) return "Oceania";

  return "All";
}

// Coordinate bounding check for Globe Heatmap points
export function getContinentForCoordinates(lat: number, lng: number): Continent {
  // Oceania
  if (lat < 0 && lng > 110 && lng < 180 && lat > -50) return "Oceania";
  // South America
  if (lat < 15 && lat > -60 && lng < -30 && lng > -90) return "South America";
  // North America
  if (lat >= 15 && lat < 85 && lng < -50 && lng > -170) return "North America";
  // Africa
  if (lat < 37 && lat > -36 && lng > -20 && lng < 55) return "Africa";
  // Europe
  if (lat >= 36 && lat < 72 && lng >= -25 && lng <= 45) return "Europe";
  // Asia
  if (lat >= 5 && lat < 75 && lng > 45 && lng < 150) return "Asia";
  if (lat < 5 && lat > -12 && lng > 95 && lng < 145) return "Asia"; // SE Asia maritime

  return "All";
}
