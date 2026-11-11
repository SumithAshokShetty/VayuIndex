import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export const runtime = "nodejs";
export const maxDuration = 30;

export type CityTelemetry = {
  name: string;
  admin?: string;
  country?: string;
  aqi: number | null;
  pm2_5: number | null;
  pm10: number | null;
  dominantPollutant?: string | null;
  sourceLabel?: string;
};

export type CompareAiRequest = {
  baselineCity: CityTelemetry;
  comparisonCity: CityTelemetry;
  additionalCities?: CityTelemetry[];
};

function generateDeterministicFallback(
  baseline: CityTelemetry,
  comparison: CityTelemetry
): string[] {
  const aqi1 = baseline.aqi ?? 0;
  const aqi2 = comparison.aqi ?? 0;
  const pm1 = baseline.pm2_5 ?? 0;
  const pm2 = comparison.pm2_5 ?? 0;

  const worse = aqi1 >= aqi2 ? baseline : comparison;
  const cleaner = aqi1 >= aqi2 ? comparison : baseline;
  const aqiDelta = Math.abs(aqi1 - aqi2);

  const pmDeltaPct =
    cleaner.pm2_5 && cleaner.pm2_5 > 0
      ? Math.round((Math.abs(pm1 - pm2) / cleaner.pm2_5) * 100)
      : 0;

  // Bullet 1: Primary severity delta
  const bullet1 =
    aqiDelta > 15
      ? `${worse.name} exhibits a significantly higher atmospheric burden than ${cleaner.name}, reflecting a delta of ${aqiDelta} AQI points (${pmDeltaPct}% higher PM₂.₅ concentration).`
      : `${baseline.name} and ${comparison.name} record comparable atmospheric severity, differing by merely ${aqiDelta} AQI index points.`;

  // Bullet 2: Dominant signature
  const worseDominant = worse.dominantPollutant?.toUpperCase() || "PM₂.₅";
  const cleanerDominant = cleaner.dominantPollutant?.toUpperCase() || "PM₂.₅";
  const bullet2 =
    worse.name !== cleaner.name
      ? `${worse.name}'s airshed is primarily driven by elevated ${worseDominant} particulate concentrations, whereas ${cleaner.name} maintains a relatively balanced signature dominated by ${cleanerDominant}.`
      : `Both airsheds reflect a similar composition vector dominated by fine particulate dust.`;

  // Bullet 3: Direct health advice
  const bullet3 =
    worse.aqi && worse.aqi > 150
      ? `Residents or travelers moving into ${worse.name} should wear certified N95 filtration during morning/evening commute peaks, whereas outdoor activities in ${cleaner.name} carry lower acute respiratory stress.`
      : `Both locations allow typical outdoor activity, though sensitive individuals should monitor localized inversion spikes during early morning hours.`;

  return [bullet1, bullet2, bullet3];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CompareAiRequest;

    if (!body || !body.baselineCity || !body.comparisonCity) {
      return NextResponse.json(
        { error: "Both baselineCity and comparisonCity are required." },
        { status: 400 }
      );
    }

    const { baselineCity, comparisonCity, additionalCities } = body;

    // Check if GROQ_API_KEY is configured
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      const fallbackInsights = generateDeterministicFallback(baselineCity, comparisonCity);
      return NextResponse.json({
        insights: fallbackInsights,
        rawText: fallbackInsights.map((b) => `• ${b}`).join("\n"),
        fallback: true,
        reason: "GROQ_API_KEY not configured. Running deterministic telemetry variance analysis.",
        model: "Deterministic Rule Engine (Fallback)",
      });
    }

    const groqModel = process.env.GROQ_MODEL?.trim() || "qwen/qwen3.8-27b";

    const promptDetails = [
      `BASELINE CITY: ${baselineCity.name}${baselineCity.country ? `, ${baselineCity.country}` : ""}`,
      `- Current AQI: ${baselineCity.aqi ?? "Unavailable"}`,
      `- PM2.5: ${baselineCity.pm2_5 ?? "Unavailable"} µg/m³`,
      `- PM10: ${baselineCity.pm10 ?? "Unavailable"} µg/m³`,
      `- Dominant Pollutant: ${baselineCity.dominantPollutant || "PM2.5"}`,
      `- Station / Source: ${baselineCity.sourceLabel || "Ground Telemetry"}`,
      ``,
      `COMPARISON CITY: ${comparisonCity.name}${comparisonCity.country ? `, ${comparisonCity.country}` : ""}`,
      `- Current AQI: ${comparisonCity.aqi ?? "Unavailable"}`,
      `- PM2.5: ${comparisonCity.pm2_5 ?? "Unavailable"} µg/m³`,
      `- PM10: ${comparisonCity.pm10 ?? "Unavailable"} µg/m³`,
      `- Dominant Pollutant: ${comparisonCity.dominantPollutant || "PM2.5"}`,
      `- Station / Source: ${comparisonCity.sourceLabel || "Ground Telemetry"}`,
    ];

    if (Array.isArray(additionalCities) && additionalCities.length > 0) {
      promptDetails.push(``, `ADDITIONAL CITIES IN COMPARISON:`);
      for (const city of additionalCities) {
        promptDetails.push(
          `- ${city.name}: AQI ${city.aqi ?? "N/A"}, PM2.5 ${city.pm2_5 ?? "N/A"} µg/m³, Dominant: ${city.dominantPollutant || "PM2.5"}`
        );
      }
    }

    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      model: groqModel,
      temperature: 0.25,
      max_tokens: 350,
      messages: [
        {
          role: "system",
          content:
            "You are an expert environmental health analyst for Vayu Index. Analyze the air quality comparison between two cities and generate a clear, conversational 3-bullet executive summary (under 120 words total). Avoid complex jargon. Explain:\n1. The primary severity delta between the two locations.\n2. The dominant pollutant signature driving the difference (e.g., fine particulate dust vs. combustion gases).\n3. Direct, practical health action advice for residents traveling between or living in these locations.\nFormat your response strictly as 3 bullet points starting with '• '.",
        },
        {
          role: "user",
          content: `Compare the atmospheric telemetry between these locations:\n\n${promptDetails.join("\n")}`,
        },
      ],
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || "";

    // Parse bullets
    const bullets = responseText
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.replace(/^[•*-]\s*/, "").replace(/^\d+\.\s*/, "").trim())
      .filter((line) => line.length > 10);

    const finalInsights =
      bullets.length >= 2
        ? bullets.slice(0, 3)
        : generateDeterministicFallback(baselineCity, comparisonCity);

    return NextResponse.json({
      insights: finalInsights,
      rawText: responseText || finalInsights.map((b) => `• ${b}`).join("\n"),
      fallback: false,
      model: groqModel,
    });
  } catch (error) {
    console.error("Groq Compare AI error:", error);
    try {
      const parsedBody = (await request.clone().json()) as CompareAiRequest;
      const fallbackInsights = generateDeterministicFallback(
        parsedBody.baselineCity,
        parsedBody.comparisonCity
      );
      return NextResponse.json({
        insights: fallbackInsights,
        rawText: fallbackInsights.map((b) => `• ${b}`).join("\n"),
        fallback: true,
        reason: error instanceof Error ? error.message : "Service temporarily overloaded",
        model: "Deterministic Rule Engine (Fallback)",
      });
    } catch {
      return NextResponse.json(
        { error: "Failed to generate comparison insights." },
        { status: 500 }
      );
    }
  }
}
