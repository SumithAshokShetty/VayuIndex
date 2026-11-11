"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, LoaderCircle, Mic, Send, Volume2, X } from "lucide-react";
import type { AirQualityResponse, Location } from "@/lib/types";
import type { RiskProfile } from "@/components/PersonalRiskCalculator";

type Conversation = { question: string; answer: string };
type ChatHistoryTurn = { question: string; answer: string };
type AssistantContext = { air: AirQualityResponse | null; location: Location; profile: RiskProfile; forecast?: Array<Record<string, number | string | null>>; weather?: Record<string, number | string | null>; history?: Record<string, number[]> };
type RecognitionAlternative = { transcript: string };
type RecognitionEvent = Event & { results: ArrayLike<ArrayLike<RecognitionAlternative>> };
type RecognitionInstance = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => RecognitionInstance;
  webkitSpeechRecognition?: new () => RecognitionInstance;
};

const PROMPTS = [
  "How can PM₂.₅ affect me differently from PM₁₀?",
  "What precautions make sense for today's air?",
  "How can I reduce exposure during outdoor exercise?",
];
const DEFAULT_LOCATION: Location = { name: "New Delhi", admin: "Delhi", country: "India", latitude: 28.6139, longitude: 77.209 };
const DEFAULT_PROFILE: RiskProfile = { age: "adult", health: "none", activity: "light", exposure: "under1" };

function inlineMarkdown(text: string) {
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*\n]+\*)/g).filter(Boolean);
  return tokens.map((token, index) => {
    if (token.startsWith("**") && token.endsWith("**")) return <strong key={index}>{token.slice(2, -2)}</strong>;
    if (token.startsWith("__") && token.endsWith("__")) return <strong key={index}>{token.slice(2, -2)}</strong>;
    if (token.startsWith("*") && token.endsWith("*")) return <em key={index}>{token.slice(1, -1)}</em>;
    if (token.startsWith("`") && token.endsWith("`")) return <code key={index}>{token.slice(1, -1)}</code>;
    return token;
  });
}

function FormattedAnswer({ text }: { text: string }) {
  const normalized = text.replace(/\r/g, "").replace(/[ \t]+\n/g, "\n")
    .replace(/([^\n])\s+(?=(?:[-*+]\s+\*\*|\d+[.)]\s+\*\*))/g, "$1\n");
  const lines = normalized.split("\n");
  const blocks: Array<{ type: "paragraph" | "heading" | "list"; text?: string; items?: string[]; ordered?: boolean }> = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let listOrdered = false;
  const flushParagraph = () => { if (paragraph.length) blocks.push({ type: "paragraph", text: paragraph.join(" ") }); paragraph = []; };
  const flushList = () => { if (listItems.length) blocks.push({ type: "list", items: listItems, ordered: listOrdered }); listItems = []; };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) { flushParagraph(); flushList(); continue; }
    const heading = line.match(/^#{1,3}\s+(.+)$/);
    const list = line.match(/^(?:[-*+]\s+|\d+[.)]\s+)(.+)$/);
    if (heading) { flushParagraph(); flushList(); blocks.push({ type: "heading", text: heading[1] }); continue; }
    if (list) {
      flushParagraph();
      const ordered = /^\d+[.)]/.test(line);
      if (listItems.length && ordered !== listOrdered) flushList();
      listOrdered = ordered;
      listItems.push(list[1]);
      continue;
    }
    flushList();
    paragraph.push(line);
  }
  flushParagraph();
  flushList();

  return <div className="assistant-answer-content">{blocks.map((block, index) => {
    if (block.type === "heading") return <h4 key={index}>{inlineMarkdown(block.text ?? "")}</h4>;
    if (block.type === "list") {
      const List = block.ordered ? "ol" : "ul";
      return <List key={index}>{block.items?.map((item, itemIndex) => <li key={itemIndex}>{inlineMarkdown(item)}</li>)}</List>;
    }
    return <p key={index}>{inlineMarkdown(block.text ?? "")}</p>;
  })}</div>;
}

function storedLocation(): Location {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem("vayu-location") ?? "null");
    if (saved && typeof saved === "object" && "latitude" in saved && "longitude" in saved &&
      typeof saved.latitude === "number" && typeof saved.longitude === "number") {
      return { ...DEFAULT_LOCATION, ...saved } as Location;
    }
  } catch { /* Use the default location until the user chooses one. */ }
  return DEFAULT_LOCATION;
}

export function AiAssistant({ air: suppliedAir, location: suppliedLocation, profile: suppliedProfile, forecast, weather, history }: {
  air?: AirQualityResponse | null;
  location?: Location;
  profile?: RiskProfile;
  forecast?: Array<Record<string, number | string | null>>;
  weather?: Record<string, number | string | null>;
  history?: Record<string, number[]>;
} = {}) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceInputSupported, setVoiceInputSupported] = useState(false);
  const [voiceOutputSupported, setVoiceOutputSupported] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [savedLocation, setSavedLocation] = useState<Location>(DEFAULT_LOCATION);
  const [liveAir, setLiveAir] = useState<AirQualityResponse | null>(null);
  const [pageContext, setPageContext] = useState<AssistantContext | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const conversationRef = useRef<HTMLDivElement>(null);

  const location = suppliedLocation ?? pageContext?.location ?? savedLocation;
  const air = suppliedAir !== undefined ? suppliedAir : pageContext ? pageContext.air : liveAir;
  const profile = suppliedProfile ?? pageContext?.profile ?? DEFAULT_PROFILE;
  const activeForecast = forecast ?? pageContext?.forecast;
  const activeWeather = weather ?? pageContext?.weather;
  const activeHistory = history ?? pageContext?.history;

  useEffect(() => {
    setSavedLocation(storedLocation());
    const speechWindow = window as SpeechWindow & { __vayuAssistantContext?: AssistantContext };
    setVoiceInputSupported(Boolean(speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition));
    setVoiceOutputSupported("speechSynthesis" in window);
    if (speechWindow.__vayuAssistantContext) setPageContext(speechWindow.__vayuAssistantContext);
    const onContext = (event: Event) => {
      const contextEvent = event as CustomEvent<AssistantContext>;
      if (contextEvent.detail?.location) setPageContext(contextEvent.detail);
    };
    window.addEventListener("vayu-assistant-context", onContext);
    return () => window.removeEventListener("vayu-assistant-context", onContext);
  }, []);

  useEffect(() => {
    if (!open) { if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel(); setSpeakingIndex(null); }
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [open]);

  useEffect(() => {
    const conversation = conversationRef.current;
    if (!conversation) return;
    requestAnimationFrame(() => { conversation.scrollTop = conversation.scrollHeight; });
  }, [conversations, loading, error]);

  useEffect(() => {
    if (suppliedAir !== undefined || suppliedLocation || pageContext) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ lat: String(location.latitude), lng: String(location.longitude) });
    fetch(`/api/air-quality?${params}`, { signal: controller.signal, cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<AirQualityResponse> : null)
      .then((data) => { if (data && !controller.signal.aborted) setLiveAir(data); })
      .catch(() => undefined);
    return () => controller.abort();
  }, [location, suppliedAir, suppliedLocation, pageContext]);

  async function ask(prompt: string) {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt || loading) return;
    setQuestion("");
    if (inputRef.current) inputRef.current.style.height = "48px";
    setError(null);
    setLoading(true);
    const chatHistory: ChatHistoryTurn[] = conversations
      .filter((item) => item.answer.trim())
      .slice(-6)
      .map(({ question: priorQuestion, answer }) => ({ question: priorQuestion, answer }));
    setConversations((items) => [...items, { question: cleanPrompt, answer: "" }]);

    try {
      const response = await fetch("/api/agent-reasoning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: cleanPrompt, chatHistory, location, air, profile, forecast: activeForecast, weather: activeWeather, history: activeHistory }),
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
          const event = JSON.parse(data) as { type: string; content?: string; message?: string; location?: Location; air?: AirQualityResponse | null };
          if (event.type === "context" && event.location) {
            setPageContext((current) => ({
              location: event.location!,
              air: event.air ?? null,
              profile: current?.profile ?? profile,
            }));
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

  function startVoiceInput() {
    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition || listening) return;
    const recognition = new Recognition();
    recognition.lang = navigator.language || "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => setQuestion(event.results[0]?.[0]?.transcript ?? "");
    recognition.onerror = () => { setListening(false); setError("Voice input was unavailable. Check your microphone permission and try again."); };
    recognition.onend = () => setListening(false);
    setError(null);
    setListening(true);
    try { recognition.start(); } catch { setListening(false); }
  }

  function cleanSpeechText(text: string) {
    return text
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/^\s{0,3}#{1,6}\s*/gm, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/^\s*[-*+]\s+/gm, "")
      .replace(/^\s*\d+[.)]\s+/gm, "")
      .replace(/[\*_#]/g, "")
      .replace(/\s*\n+\s*/g, ". ")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  function speak(text: string, index: number) {
    if (!("speechSynthesis" in window) || !text) return;
    if (speakingIndex === index) {
      stopSpeech();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanSpeechText(text));
    utterance.lang = navigator.language || "en-IN";
    utterance.onstart = () => setSpeakingIndex(index);
    utterance.onend = () => setSpeakingIndex((active) => active === index ? null : active);
    utterance.onerror = () => setSpeakingIndex((active) => active === index ? null : active);
    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  }

  function stopSpeech() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeakingIndex(null);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(question);
  }

  return <>
    {!open && <button type="button" className="assistant-launcher" onClick={() => setOpen(true)} aria-label="Ask Vayu air assistant"><Bot size={18}/><span>ASK VAYU</span></button>}
    <AnimatePresence>
      {open && <>
        <motion.button className="assistant-backdrop" type="button" aria-label="Close assistant" onClick={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}/>
        <motion.aside className="assistant-drawer" role="dialog" aria-modal="true" aria-labelledby="assistant-title" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 280, damping: 30 }}>
          <header className="assistant-header">
            <div className="assistant-heading-copy">
              <span className="assistant-eyebrow"><i/> GROQ AIR INSIGHTS</span>
              <h2 id="assistant-title">Ask about your air.</h2>
              <p className="assistant-context">{location.name} <span>•</span> {air?.sourceLabel ?? "AIR SOURCE UNAVAILABLE"}</p>
            </div>
            <button className="assistant-close" type="button" aria-label="Close assistant" onClick={() => { setOpen(false); window.speechSynthesis?.cancel(); }}><X size={19}/></button>
          </header>

          <div ref={conversationRef} className="assistant-conversation" aria-live="polite">
            {conversations.length === 0 && <div className="assistant-welcome">
              <div className="assistant-welcome-icon"><Bot size={18}/></div>
              <p>Ask about AQI, PM₂.₅ and PM₁₀, local readings, forecasts, or ways to reduce exposure.</p>
              <div className="assistant-prompts">{PROMPTS.map((prompt) => <button key={prompt} type="button" onClick={() => void ask(prompt)}>{prompt}</button>)}</div>
            </div>}
            {conversations.map((conversation, index) => <article className="assistant-turn" key={`${conversation.question}-${index}`}>
              <p className="assistant-question">{conversation.question}</p>
              {conversation.answer && <div className="assistant-message">
                <span className="assistant-avatar" aria-hidden="true"><Bot size={15}/></span>
                <div className="assistant-answer-bubble">
                  <div className="assistant-answer-row"><FormattedAnswer text={conversation.answer}/>{voiceOutputSupported && <button type="button" className={`assistant-speak ${speakingIndex === index ? "is-speaking" : ""}`} onClick={() => speak(conversation.answer, index)} aria-pressed={speakingIndex === index} aria-label={speakingIndex === index ? "Stop reading this answer" : "Read this answer aloud"} title={speakingIndex === index ? "Stop reading" : "Read answer aloud"}><Volume2 size={16}/></button>}</div>
                </div>
              </div>}
              {loading && index === conversations.length - 1 && !conversation.answer && <div className="assistant-message"><span className="assistant-avatar" aria-hidden="true"><Bot size={15}/></span><div className="assistant-answer-bubble"><p className="assistant-placeholder"><LoaderCircle size={13} className="assistant-spinner"/> Preparing an answer…</p></div></div>}
            </article>)}
            {error && <p className="assistant-error" role="alert">{error}</p>}
          </div>

          <footer className="assistant-dock">
            <form className="assistant-form" onSubmit={submit}>
              <textarea ref={inputRef} value={question} onChange={(event) => {
                setQuestion(event.target.value);
                event.currentTarget.style.height = "auto";
                event.currentTarget.style.height = `${Math.min(event.currentTarget.scrollHeight, 144)}px`;
                event.currentTarget.style.overflowY = event.currentTarget.scrollHeight > 144 ? "auto" : "hidden";
              }} onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); if (question.trim() && !loading) void ask(question); }
              }} placeholder="Ask about local air quality…" rows={1} maxLength={900} aria-label="Your question"/>
              <div className="assistant-form-actions">
                {voiceInputSupported && <button type="button" className={`assistant-mic ${listening ? "is-listening" : ""}`} onClick={startVoiceInput} disabled={loading || listening} aria-label={listening ? "Listening" : "Ask by voice"} title={listening ? "Listening…" : "Ask by voice"}><Mic size={17}/></button>}
                <button type="submit" disabled={loading || !question.trim()} aria-label="Send question" title="Send question"><Send size={17}/></button>
              </div>
            </form>
            <p className="assistant-disclaimer">General air quality information • Not medical advice</p>
          </footer>
        </motion.aside>
      </>}
    </AnimatePresence>
  </>;
}
