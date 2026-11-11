import type { AirQualityResponse } from "@/lib/types";
import { compiledAgentGraph, type State } from "@/lib/agent-graph";
import { getAirQuality } from "@/lib/api-orchestrator";
import { INITIAL_HOTSPOTS } from "@/lib/spatial-ground-truth";

export const runtime = "nodejs";
export const maxDuration = 60;

type Profile = {
  age?: string;
  health?: string;
  activity?: string;
  exposure?: string;
};

type AgentRequest = {
  question: string;
  location?: { name?: string; latitude?: number; longitude?: number; admin?: string; country?: string };
  air?: AirQualityResponse | null;
  profile?: Profile;
  history?: Record<string, number[]>;
  forecast?: Array<Record<string, number | string | null>>;
  weather?: Record<string, number | string | null>;
  chatHistory?: Array<{ question: string; answer: string }>;
};

const AGENT_GRAPH = {
  nodes: ["data-auditor", "trend-predictor", "health-specialist", "executive-synthesis"],
  edges: [
    ["data-auditor", "trend-predictor"],
    ["data-auditor", "health-specialist"],
    ["trend-predictor", "executive-synthesis"],
    ["health-specialist", "executive-synthesis"],
  ],
} as const;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function event(controller: ReadableStreamDefaultController<Uint8Array>, payload: unknown) {
  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`));
}

function extractPlaces(question: string): string[] {
  const possessive = question.match(/\b(?:what(?:\s+is|'s)?\s+)?([a-z][a-z0-9.' -]{1,48}?)['’]s\s+(?:aqi|air\s+quality|pollution)\b/i);
  let phrase = possessive?.[1];

  if (!phrase) {
    const strongMarkers = [...question.matchAll(/\b(?:in|at|near|around|between)\s+(?:the\s+city\s+of\s+)?/gi)];
    const otherMarkers = [...question.matchAll(/\b(?:of|for|about)\s+(?:the\s+city\s+of\s+)?/gi)];
    const marker = strongMarkers.at(-1) ?? otherMarkers.at(-1);
    if (marker && marker.index !== undefined) phrase = question.slice(marker.index + marker[0].length);
    else {
      const comparison = question.match(/\b(?:compare|comparison\s+of)\s+(.+)$/i);
      phrase = comparison?.[1];
    }
  }

  if (!phrase) return [];
  phrase = phrase
    .replace(/[?!,;].*$/, "")
    .replace(/\s+and\s+(?=(?:what|how|which|should|can|does|do|is|are|will)\b).*$/i, "")
    .replace(/\s+(?:(?:right now|today|currently|at present|now|please|this morning|tonight)\s*)+$/i, "")
    .replace(/\s+(?:aqi|air\s+quality|pollution|pm.?2.?5|pm.?10)\s*(?:levels?)?$/i, "")
    .trim();

  const places = phrase.split(/\s+(?:and|&|versus|vs\.?|compared\s+(?:with|to)|with)\s+/i)
    .map((place) => place.replace(/^(?:(?:the|a|an)\s+)?(?:city\s+of\s+)?/i, "").replace(/\s+(?:region|area)$/i, "").trim())
    .filter((place) => place.length >= 2 && place.length <= 60)
    .filter((place) => !/^(me|my|our|us|this|that|people|children|seniors|asthma|health|exposure|outdoor exercise|my location|this location|the air|air|the data|data|the platform|platform|vayu index|the app|app|general|today|now|current conditions|pm.?2.?5|pm.?10|aqi|naqi|moderate category|severe category|pollutants|features|the features)$/i.test(place));

  return [...new Set(places)].slice(0, 3);
}

async function resolvePlace(place: string, fallbackCountry?: string) {
  const normalize = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const normalizedPlace = normalize(place);
  const knownPlace = INITIAL_HOTSPOTS.find((hotspot) => {
    const sameName = normalize(hotspot.name) === normalizedPlace ||
      normalize(`${hotspot.name} ${hotspot.state}`) === normalizedPlace;
    const sameCountry = !fallbackCountry || normalize(hotspot.country) === normalize(fallbackCountry);
    return sameName && sameCountry;
  });

  // Prefer the app's curated city coordinates if geocoding is unavailable or
  // returns a less specific match. Live telemetry is still fetched below.
  if (knownPlace) {
    return {
      name: knownPlace.name,
      admin: knownPlace.state,
      country: knownPlace.country,
      latitude: knownPlace.lat,
      longitude: knownPlace.lng,
    };
  }

  const searchName = fallbackCountry && !place.toLowerCase().includes(fallbackCountry.toLowerCase())
    ? `${place}, ${fallbackCountry}`
    : place;
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.search = new URLSearchParams({ name: searchName, count: "5", language: "en", format: "json" }).toString();
  const response = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(5000) });
  if (!response.ok) return null;
  const data = await response.json() as { results?: Array<{ name?: string; latitude?: number; longitude?: number; admin1?: string; country?: string }> };
  const result = data.results?.find((item) => typeof item.latitude === "number" && typeof item.longitude === "number");
  if (!result?.name || typeof result.latitude !== "number" || typeof result.longitude !== "number") return null;
  return { name: result.name, admin: result.admin1 ?? "", country: result.country ?? fallbackCountry ?? "", latitude: result.latitude, longitude: result.longitude };
}

function summarizePlaceReading(location: { name: string; country?: string }, air: AirQualityResponse | null) {
  if (!air) return `${location.name}: no current reading was returned by the available air-quality sources.`;
  const current = air.current as Record<string, number | string | null>;
  const reading = (key: string, label: string) => {
    const value = current[key];
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    const unit = air.current_units?.[key] ?? "µg/m³";
    return `${label} ${Number.isInteger(value) ? value : value.toFixed(1)} ${unit}`;
  };
  const details = [
    typeof current.aqi === "number" ? `AQI ${Math.round(current.aqi)}` : null,
    reading("pm2_5", "PM2.5"),
    reading("pm10", "PM10"),
  ].filter(Boolean);
  const geography = [location.name, location.country].filter(Boolean).join(", ");
  const station = air.stationName ? `; station ${air.stationName}` : "";
  return `${geography}: ${details.length ? details.join("; ") : "current AQI and pollutant readings unavailable"}. Source: ${air.sourceLabel} (${air.provenance})${station}.`;
}

export async function POST(request: Request) {
  let body: AgentRequest;
  try {
    const parsed: unknown = await request.json();
    if (!record(parsed)) {
      return Response.json({ error: "Expected a JSON request body." }, { status: 400 });
    }
    if (typeof parsed.question !== "string" || parsed.question.trim().length === 0) {
      return Response.json({ error: "Add a question for the air-quality assistant." }, { status: 400 });
    }
    if (parsed.question.length > 900) {
      return Response.json({ error: "Keep the question under 900 characters." }, { status: 413 });
    }
    body = parsed as unknown as AgentRequest;
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!process.env.GROQ_API_KEY) {
    return Response.json({ error: "AI insights are unavailable: GROQ_API_KEY is not configured." }, { status: 503 });
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        event(controller, { type: "start", graph: AGENT_GRAPH });

        // Resolve every explicitly named place; selected dashboard telemetry is not a city lookup limit.
        const requestedPlaces = extractPlaces(body.question);
        let effectiveLocation = body.location ?? null;
        let effectiveAir = body.air ?? null;
        let effectiveWeather = body.weather ?? null;
        let effectiveForecast = body.forecast ?? null;
        let effectiveHistory = body.history ?? null;
        let requestedPlaceReadings: string[] = [];
        if (requestedPlaces.length) {
          const results = await Promise.all(requestedPlaces.map(async (name) => {
            try {
              const location = await resolvePlace(name, body.location?.country);
              if (!location) return { location: { name, country: body.location?.country }, air: null as AirQualityResponse | null };
              const air = await getAirQuality({ latitude: location.latitude, longitude: location.longitude });
              return { location, air };
            } catch {
              return { location: { name, country: body.location?.country }, air: null as AirQualityResponse | null };
            }
          }));
          requestedPlaceReadings = results.map(({ location, air }) => summarizePlaceReading(location, air));
          effectiveLocation = results[0]?.location ?? effectiveLocation;
          effectiveAir = results[0]?.air ?? null;
          // Never reuse weather, forecast, or history from a different selected city.
          effectiveWeather = null;
          effectiveForecast = null;
          effectiveHistory = null;
          event(controller, { type: "context", location: effectiveLocation, air: effectiveAir });
        }

        // Build base state for LangGraph pipeline
        const priorTurns = Array.isArray(body.chatHistory)
          ? body.chatHistory.slice(-6).filter((turn) => typeof turn?.question === "string" && typeof turn?.answer === "string")
          : [];
        const contextualQuestion = [
          priorTurns.length
            ? `Earlier conversation:\n${priorTurns.map((turn) => `User: ${turn.question.slice(0, 900)}\nAssistant: ${turn.answer.slice(0, 1800)}`).join("\n\n")}\n\nLatest user question: ${body.question}`
            : body.question,
          requestedPlaceReadings.length
            ? `Current readings retrieved for each place explicitly requested (use these readings in the answer; do not claim the data is limited to the selected dashboard location):\n${requestedPlaceReadings.map((reading) => `- ${reading}`).join("\n")}`
            : "",
        ].filter(Boolean).join("\n\n");

        const initialState: State = {
          location: effectiveLocation,
          telemetry: effectiveAir,
          audit_results: "",
          trend_analysis: "",
          health_advisory: "",
          final_synthesis: "",
          messages: [],
          question: contextualQuestion,
          profile: (body.profile as Record<string, string>) ?? null,
          history: effectiveHistory,
          forecast: effectiveForecast,
          weather: effectiveWeather,
        };

        // 1. Start execution of compiled LangGraph state graph
        event(controller, { type: "agent-start", agent: "data-auditor", label: "Data Auditor" });

        // Stream updates from compiled LangGraph state graph:
        // START -> auditor_node -> [trend_node, health_node] -> synthesis_node -> END
        const graphStream = await compiledAgentGraph.stream(initialState, {
          streamMode: "updates",
        });

        let trendStarted = false;
        let synthesisStarted = false;

        for await (const chunk of graphStream) {
          const step = chunk as Record<string, Partial<State>>;

          if (step.auditor_node) {
            const auditResults = step.auditor_node.audit_results || "Telemetry verification complete.";
            event(controller, {
              type: "agent-result",
              agent: "data-auditor",
              label: "Data Auditor",
              content: auditResults,
            });

            if (!trendStarted) {
              trendStarted = true;
              event(controller, { type: "agent-start", agent: "trend-predictor", label: "Trend Predictor" });
              event(controller, { type: "agent-start", agent: "health-specialist", label: "Health Specialist" });
            }
          }

          if (step.trend_node) {
            event(controller, {
              type: "agent-result",
              agent: "trend-predictor",
              label: "Trend Predictor",
              content: step.trend_node.trend_analysis || "Atmospheric trend analyzed.",
            });
          }

          if (step.health_node) {
            event(controller, {
              type: "agent-result",
              agent: "health-specialist",
              label: "Health Specialist",
              content: step.health_node.health_advisory || "Health guidance compiled.",
            });
          }

          if (step.synthesis_node) {
            if (!synthesisStarted) {
              synthesisStarted = true;
              event(controller, { type: "agent-start", agent: "executive-synthesis", label: "Executive Synthesis" });
            }

            const synthesisText = step.synthesis_node.final_synthesis || "Executive synthesis complete.";
            event(controller, {
              type: "agent-result",
              agent: "executive-synthesis",
              label: "Executive Synthesis",
              content: synthesisText,
            });

            // Stream response tokens to the client
            const words = synthesisText.split(" ");
            for (let i = 0; i < words.length; i++) {
              event(controller, {
                type: "token",
                agent: "executive-synthesis",
                content: (i === 0 ? "" : " ") + words[i],
              });
            }
          }
        }

        event(controller, { type: "done" });
      } catch (error) {
        if (!request.signal.aborted) {
          event(controller, {
            type: "error",
            message: error instanceof Error ? error.message : "LangGraph agent workflow failed.",
          });
        }
      } finally {
        try {
          controller.close();
        } catch {
          /* Stream may already be closed */
        }
      }
    },
    cancel() {},
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
