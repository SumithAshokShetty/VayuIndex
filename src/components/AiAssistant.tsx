"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Bot, Check, LoaderCircle, X } from "lucide-react";
import type { AirQualityResponse, Location } from "@/lib/types";
import type { RiskProfile } from "@/components/PersonalRiskCalculator";

type AgentStep = { agent: string; label: string; content: string; status: "running" | "complete" };
type Conversation = { question: string; answer: string; steps: AgentStep[] };

const PROMPTS = [
  "How can PM₂.₅ affect me differently from PM₁₀?",
  "What precautions make sense for today's air?",
  "How can I reduce exposure during outdoor exercise?",
];

export function AiAssistant({ air, location, profile, forecast, weather, history }: { air: AirQualityResponse | null; location: Location; profile: RiskProfile; forecast?: Array<Record<string, number | string | null>>; weather?: Record<string, number | string | null>; history?: Record<string, number[]> }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  async function ask(prompt: string) {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt || loading) return;
    setQuestion("");
    setError(null);
    setLoading(true);
    setConversations((items) => [...items, { question: cleanPrompt, answer: "", steps: [] }]);

    try {
      const response = await fetch("/api/agent-reasoning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: cleanPrompt, location, air, profile, forecast, weather, history }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(payload.error ?? "The air-quality assistant could not respond.");
      }
      if (!response.body) throw new Error("The browser could not open the response stream.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const updateLast = (updater: (conversation: Conversation) => Conversation) => {
        setConversations((items) => items.map((item, index) => index === items.length - 1 ? updater(item) : item));
      };
      const handleFrame = (frame: string) => {
        const data = frame.split("\n").find((line) => line.startsWith("data: "))?.slice(6);
        if (!data) return;
        try {
          const event = JSON.parse(data) as { type: string; agent?: string; label?: string; content?: string; message?: string };
          if (event.type === "agent-start" && event.agent && event.label) {
            updateLast((item) => ({ ...item, steps: [...item.steps, { agent: event.agent!, label: event.label!, content: "Working…", status: "running" }] }));
          } else if (event.type === "agent-result" && event.agent && event.label && event.content) {
            updateLast((item) => {
              const existing = item.steps.findIndex((step) => step.agent === event.agent);
              const result = { agent: event.agent!, label: event.label!, content: event.content!, status: "complete" as const };
              if (existing < 0) return { ...item, steps: [...item.steps, result] };
              return { ...item, steps: item.steps.map((step, index) => index === existing ? result : step) };
            });
          } else if (event.type === "token" && event.content) {
            updateLast((item) => ({ ...item, answer: item.answer + event.content }));
          } else if (event.type === "error") {
            setError(event.message ?? "The agent pipeline stopped unexpectedly.");
          }
        } catch { /* Ignore malformed provider frames and continue reading. */ }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";
        frames.forEach(handleFrame);
      }
      if (buffer.trim()) handleFrame(buffer);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The assistant is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(question);
  }

  return <>
    <button type="button" className="assistant-launcher" onClick={() => setOpen(true)} aria-label="Ask Vayu air assistant"><Bot size={18}/><span>ASK VAYU</span></button>
    <AnimatePresence>
      {open && <>
        <motion.button className="assistant-backdrop" type="button" aria-label="Close assistant" onClick={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}/>
        <motion.aside className="assistant-drawer" role="dialog" aria-modal="true" aria-labelledby="assistant-title" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 280, damping: 30 }}>
          <header className="assistant-header"><div><span className="assistant-eyebrow"><i/> GROQ · AIR INSIGHTS</span><h2 id="assistant-title">Ask about your air.</h2></div><button type="button" aria-label="Close assistant" onClick={() => setOpen(false)}><X size={18}/></button></header>
          <p className="assistant-context">{location.name} · {air?.sourceLabel ?? "Air source unavailable"}</p>
          <div className="assistant-conversation" aria-live="polite">
            {conversations.length === 0 && <div className="assistant-welcome"><Bot size={20}/><p>Ask about local readings, pollutant differences, or ways to reduce exposure. Responses distinguish source data from general guidance.</p><div className="assistant-prompts">{PROMPTS.map((prompt) => <button key={prompt} type="button" onClick={() => void ask(prompt)}>{prompt}</button>)}</div></div>}
            {conversations.map((conversation, index) => <article className="assistant-turn" key={`${conversation.question}-${index}`}>
              <p className="assistant-question">{conversation.question}</p>
              {conversation.steps.length > 0 && <div className="assistant-steps" aria-label="Agent process updates">{conversation.steps.map((step) => <div className="assistant-step" key={step.agent}><span className="assistant-step-label">{step.status === "complete" ? <Check size={11}/> : <LoaderCircle size={11} className="assistant-spinner"/>}{step.label}</span><p>{step.content}</p></div>)}</div>}
              {conversation.answer && <p className="assistant-answer">{conversation.answer}</p>}
              {loading && index === conversations.length - 1 && !conversation.answer && <p className="assistant-placeholder"><LoaderCircle size={13} className="assistant-spinner"/> Preparing a source-aware answer…</p>}
            </article>)}
            {error && <p className="assistant-error">{error}</p>}
          </div>
          <form className="assistant-form" onSubmit={submit}><textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about local air quality…" rows={2} maxLength={900} aria-label="Your question"/><button type="submit" disabled={loading || !question.trim()} aria-label="Send question"><ArrowUp size={17}/></button></form>
          <p className="assistant-disclaimer">General information only · Not medical advice</p>
        </motion.aside>
      </>}
    </AnimatePresence>
  </>;
}
