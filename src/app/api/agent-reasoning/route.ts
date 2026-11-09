import type { AirQualityResponse } from "@/lib/types";
import { compiledAgentGraph, type State } from "@/lib/agent-graph";

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
  location?: { name?: string; latitude?: number; longitude?: number };
  air?: AirQualityResponse | null;
  profile?: Profile;
  history?: Record<string, number[]>;
  forecast?: Array<Record<string, number | string | null>>;
  weather?: Record<string, number | string | null>;
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

        // Build base state for LangGraph pipeline
        const initialState: State = {
          location: body.location ?? null,
          telemetry: body.air ?? null,
          audit_results: "",
          trend_analysis: "",
          health_advisory: "",
          final_synthesis: "",
          messages: [],
          question: body.question,
          profile: (body.profile as Record<string, string>) ?? null,
          history: body.history ?? null,
          forecast: body.forecast ?? null,
          weather: body.weather ?? null,
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
