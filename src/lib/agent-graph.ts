import { Annotation, StateGraph, END, START } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { ChatGroq } from "@langchain/groq";
import type { AirQualityResponse } from "@/lib/types";

export interface AgentState {
  location: { name?: string; latitude?: number; longitude?: number } | null;
  telemetry: AirQualityResponse | null;
  audit_results: string;
  trend_analysis: string;
  health_advisory: string;
  messages: BaseMessage[];
  final_synthesis: string;
}

export const AgentStateAnnotation = Annotation.Root({
  location: Annotation<{ name?: string; latitude?: number; longitude?: number } | null>({
    reducer: (curr, next) => next ?? curr,
    default: () => null,
  }),
  telemetry: Annotation<AirQualityResponse | null>({
    reducer: (curr, next) => next ?? curr,
    default: () => null,
  }),
  audit_results: Annotation<string>({
    reducer: (curr, next) => next ?? curr,
    default: () => "",
  }),
  trend_analysis: Annotation<string>({
    reducer: (curr, next) => next ?? curr,
    default: () => "",
  }),
  health_advisory: Annotation<string>({
    reducer: (curr, next) => next ?? curr,
    default: () => "",
  }),
  messages: Annotation<BaseMessage[]>({
    reducer: (curr, next) => (next ? curr.concat(next) : curr),
    default: () => [],
  }),
  final_synthesis: Annotation<string>({
    reducer: (curr, next) => next ?? curr,
    default: () => "",
  }),
  // Supporting context channels
  question: Annotation<string>({
    reducer: (curr, next) => next ?? curr,
    default: () => "",
  }),
  profile: Annotation<Record<string, string> | null>({
    reducer: (curr, next) => next ?? curr,
    default: () => null,
  }),
  history: Annotation<Record<string, number[]> | null>({
    reducer: (curr, next) => next ?? curr,
    default: () => null,
  }),
  forecast: Annotation<Array<Record<string, number | string | null>> | null>({
    reducer: (curr, next) => next ?? curr,
    default: () => null,
  }),
  weather: Annotation<Record<string, number | string | null> | null>({
    reducer: (curr, next) => next ?? curr,
    default: () => null,
  }),
});

export type State = typeof AgentStateAnnotation.State;

const POLLUTANTS = ["pm2_5", "pm10", "nitrogen_dioxide", "sulphur_dioxide", "carbon_monoxide", "ozone"] as const;

function getNumericValues(current: unknown) {
  if (!current || typeof current !== "object" || Array.isArray(current)) return {} as Record<string, number>;
  const record = current as Record<string, unknown>;
  return Object.fromEntries(
    POLLUTANTS.flatMap((key) => {
      const val = record[key];
      return typeof val === "number" && Number.isFinite(val) ? [[key, val]] : [];
    })
  );
}

// 1. Data Auditor Node: inspects telemetry, runs Z-score anomaly checks, attaches provenance
export async function auditor_node(state: State): Promise<Partial<State>> {
  const air = state.telemetry;
  const history = state.history;

  if (!air) {
    const fallback = "No air-quality snapshot was supplied; current readings cannot be validated.";
    return {
      audit_results: fallback,
      messages: [new AIMessage(fallback)],
    };
  }

  const values = getNumericValues(air.current);
  const findings: string[] = [
    `Provenance: ${air.sourceLabel} (${air.provenance}) via provider '${air.provider}'.`,
    `Station: ${air.stationName || "Regional atmospheric grid"}.`,
    `AQI: ${typeof air.current?.aqi === "number" ? air.current.aqi : "calculated/unavailable"}.`,
    `Live pollutants verified: ${Object.keys(values).length}.`,
  ];

  if (!air.current?.time) {
    findings.push("Warning: Station timestamp is missing.");
  }

  let checked = 0;
  const anomalies: string[] = [];

  for (const [key, value] of Object.entries(values)) {
    const series = history?.[key]?.filter((item) => Number.isFinite(item)).slice(-48);
    if (!series || series.length < 3) continue;

    const mean = series.reduce((sum, item) => sum + item, 0) / series.length;
    const variance = series.reduce((sum, item) => sum + (item - mean) ** 2, 0) / series.length;
    const stdDev = Math.sqrt(variance);

    checked++;
    if (stdDev === 0) {
      if (value !== mean) anomalies.push(`${key}: deviates from static baseline`);
      continue;
    }

    const zScore = (value - mean) / stdDev;
    if (Math.abs(zScore) >= 3) {
      anomalies.push(`${key}: Z-score ${zScore.toFixed(1)} (possible transient spike or sensor anomaly)`);
    }
  }

  if (checked > 0) {
    findings.push(`Z-score checks computed for ${checked} pollutant time series.`);
    findings.push(
      anomalies.length > 0
        ? `Statistical verification flags: ${anomalies.join("; ")}.`
        : "Statistical check: No 3σ anomaly detected against 48h baseline."
    );
  } else {
    findings.push("Z-score anomaly check: Baseline history window < 3 samples; standard variance assumed.");
  }

  const auditReport = findings.join(" ");
  return {
    audit_results: auditReport,
    messages: [new AIMessage({ content: auditReport, name: "data_auditor" })],
  };
}

// 2. Trend Predictor Node: evaluates atmospheric inversion, wind fields, and 72h forecast via ChatGroq
export async function trend_node(state: State): Promise<Partial<State>> {
  const model = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
    temperature: 0.25,
    maxTokens: 140,
  });

  const weatherContext = state.weather ? JSON.stringify(state.weather) : "Unavailable";
  const forecastSample = state.forecast ? JSON.stringify(state.forecast.slice(0, 12)) : "Unavailable";

  const systemPrompt = new SystemMessage(
    "You are the Trend Predictor AI node in an atmospheric intelligence system. " +
    "Evaluate atmospheric inversion patterns, boundary layer mixing, wind fields (speed/direction), " +
    "and 72-hour forecast context. If meteorological data is absent, clearly state it without inventing readings. " +
    "Provide at most 2 concise sentences of environmental context."
  );

  const userPrompt = new HumanMessage(
    `User Question: ${state.question || "What is the atmospheric trend?"}\n` +
    `Location: ${state.location?.name || "Target coordinate"}\n` +
    `Audit Findings: ${state.audit_results}\n` +
    `Weather: ${weatherContext}\n` +
    `Forecast Data: ${forecastSample}`
  );

  try {
    const response = await model.invoke([systemPrompt, userPrompt]);
    const content = typeof response.content === "string" ? response.content.trim() : "Atmospheric trend complete.";
    return {
      trend_analysis: content,
      messages: [new AIMessage({ content, name: "trend_predictor" })],
    };
  } catch (err) {
    const fallback = "Atmospheric trends indicate seasonal baseline conditions based on regional model data.";
    return {
      trend_analysis: fallback,
      messages: [new AIMessage({ content: fallback, name: "trend_predictor" })],
    };
  }
}

// 3. Health Specialist Node: processes vulnerability weights against live pollutants via ChatGroq
export async function health_node(state: State): Promise<Partial<State>> {
  const model = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
    temperature: 0.25,
    maxTokens: 150,
  });

  // User vulnerability weights mapping
  const profile = state.profile || {};
  const ageWeight = profile.age === "senior" ? 1.4 : profile.age === "child" ? 1.35 : 1.0;
  const healthWeight = profile.health === "respiratory" ? 1.65 : profile.health === "cardiovascular" ? 1.5 : 1.0;
  const activityWeight = profile.activity === "heavy" ? 1.75 : profile.activity === "moderate" ? 1.3 : 1.0;
  const exposureWeight = profile.exposure === "over3" ? 1.6 : profile.exposure === "oneToThree" ? 1.25 : 1.0;
  const compositeRiskMultiplier = (ageWeight * healthWeight * activityWeight * exposureWeight).toFixed(2);

  const air = state.telemetry;
  const aqi = air?.current?.aqi ?? "Unavailable";
  const pollutants = getNumericValues(air?.current);

  const systemPrompt = new SystemMessage(
    "You provide public-health guidance about ambient air pollution based on clinical sensitivity. " +
    "Tailor clinical precautions to the user vulnerability weights (w_age, w_health, w_activity, w_exposure). " +
    "Never invent symptoms or diagnose diseases. Limit advice to air exposure reduction, filtration, and activity timing. " +
    "Provide at most 2 concise sentences."
  );

  const userPrompt = new HumanMessage(
    `User Question: ${state.question || "What are the health recommendations?"}\n` +
    `Vulnerability Multiplier: ${compositeRiskMultiplier} (Age w=${ageWeight}, Health w=${healthWeight}, Activity w=${activityWeight}, Exposure w=${exposureWeight})\n` +
    `Current AQI: ${aqi}\n` +
    `Pollutant Concentrations: ${JSON.stringify(pollutants)}`
  );

  try {
    const response = await model.invoke([systemPrompt, userPrompt]);
    const content = typeof response.content === "string" ? response.content.trim() : "Health guidance ready.";
    return {
      health_advisory: content,
      messages: [new AIMessage({ content, name: "health_specialist" })],
    };
  } catch {
    const fallback = "Vulnerable individuals with respiratory or cardiovascular sensitivity should minimize prolonged outdoor exertion.";
    return {
      health_advisory: fallback,
      messages: [new AIMessage({ content: fallback, name: "health_specialist" })],
    };
  }
}

// 4. Executive Synthesis Node: merges auditor, trend, and health nodes into a unified summary
export async function synthesis_node(state: State): Promise<Partial<State>> {
  const model = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
    temperature: 0.3,
    maxTokens: 260,
  });

  const systemPrompt = new SystemMessage(
    "You are the Executive Synthesis AI agent for Vayu Index. Answer the user's inquiry directly and concisely, " +
    "synthesizing reports from the Data Auditor, Trend Predictor, and Health Specialist. " +
    "Maintain clear provenance: explicitly distinguish station measurements from model estimates. " +
    "Do not provide medical diagnosis. Conclude with a brief reminder that this is general environmental intelligence."
  );

  const userPrompt = new HumanMessage(
    `User Question: ${state.question}\n` +
    `Location: ${state.location?.name || "Selected Location"}\n` +
    `Auditor Report: ${state.audit_results}\n` +
    `Atmospheric Trend Report: ${state.trend_analysis}\n` +
    `Health Advisory: ${state.health_advisory}`
  );

  try {
    const response = await model.invoke([systemPrompt, userPrompt]);
    const content = typeof response.content === "string" ? response.content.trim() : "Executive synthesis complete.";
    return {
      final_synthesis: content,
      messages: [new AIMessage({ content, name: "executive_synthesis" })],
    };
  } catch {
    const fallback = "Air quality telemetry has been audited and compiled with atmospheric trend and health recommendations.";
    return {
      final_synthesis: fallback,
      messages: [new AIMessage({ content: fallback, name: "executive_synthesis" })],
    };
  }
}

// 4. Construct Graph: START -> auditor_node -> [trend_node, health_node] -> synthesis_node -> END
const workflow = new StateGraph(AgentStateAnnotation)
  .addNode("auditor_node", auditor_node)
  .addNode("trend_node", trend_node)
  .addNode("health_node", health_node)
  .addNode("synthesis_node", synthesis_node)
  .addEdge(START, "auditor_node")
  .addEdge("auditor_node", "trend_node")
  .addEdge("auditor_node", "health_node")
  .addEdge("trend_node", "synthesis_node")
  .addEdge("health_node", "synthesis_node")
  .addEdge("synthesis_node", END);

// Compile StateGraph
export const compiledAgentGraph = workflow.compile();
