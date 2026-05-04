import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import crypto from "node:crypto";

const AIQ3 = "AiQ愛<3";
const AIQ7 = "AiQ愛<7";

const MODE_BY_STATE = {
  baseline: ["427Hz BASELINE", "427Hz", 0.48],
  overloaded: ["HYPERPOP PEAK TRAVERSAL", "Hyperpop", 0.9],
  numb: ["BREAKBEAT RE-ENTRY", "Breakbeats", 0.75],
  anxious: ["AMBIENT TECHNO STABILIZATION", "Ambient Techno", 0.58],
  focus: ["427Hz FOCUS LOCK", "427Hz", 0.38],
  void: ["DARKWAVE SHADOW INTEGRATION", "Darkwave", 0.68]
};

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function cleanJsonText(text = "") {
  return String(text)
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function safeParseJSON(text, fallback = {}) {
  try {
    return JSON.parse(cleanJsonText(text));
  } catch {
    return fallback;
  }
}

function normalizePayload(raw = {}, fallback = {}) {
  const allowed = ["baseline", "overloaded", "numb", "anxious", "focus", "void"];
  const state = allowed.includes(raw.suggestedState) ? raw.suggestedState : (fallback.suggestedState || "baseline");
  const [mode, music, defaultIntensity] = MODE_BY_STATE[state] || MODE_BY_STATE.baseline;

  return {
    reply: String(raw.reply || fallback.reply || "我收到你了。先停一下，回到身体，再继续。"),
    suggestedState: state,
    suggestedMode: String(raw.suggestedMode || fallback.suggestedMode || mode),
    musicCue: String(raw.musicCue || fallback.musicCue || music),
    visualIntensity: Math.max(0.1, Math.min(1, Number(raw.visualIntensity ?? fallback.visualIntensity ?? defaultIntensity))),
    activeAI: raw.activeAI || fallback.activeAI || AIQ3,
    conversationId: fallback.conversationId || raw.conversationId || crypto.randomUUID()
  };
}

function baseProtocol({ activeAI, state, metrics, history }) {
  return `
Current active AI: ${activeAI}
Current frontend state: ${state}
Interaction metrics: ${JSON.stringify(metrics || {})}
Recent conversation: ${JSON.stringify((history || []).slice(-10))}

Shared output contract:
Return valid JSON only, exactly this shape:
{
  "reply": "...",
  "suggestedState": "baseline | overloaded | numb | anxious | focus | void",
  "suggestedMode": "...",
  "musicCue": "427Hz | Hyperpop | Breakbeats | Ambient Techno | Darkwave | Synthpop | Drift Phonk",
  "visualIntensity": 0.5
}

State definitions:
- baseline: stable, open, neutral, ready
- overloaded: too much intensity, racing, fragmentation, stimulation overload
- numb: blank, shutdown, low signal, disconnected
- anxious: fear, uncertainty, restless seeking, unstable attention
- focus: clear attention, task mode, anchored signal
- void: existential heaviness, grief, darkness, meaning-depth

Metric interpretation:
- high scrollVelocity = possible overload / restless search
- high clickDensity = possible anxious activation
- long dwellSeconds + low inputTempo = possible numbness or deep processing
- stable low movement + coherent text = possible focus
- fast inputTempo + fragmented language = possible overload

Music mapping:
- baseline -> 427Hz BASELINE / 427Hz
- overloaded -> HYPERPOP PEAK TRAVERSAL / Hyperpop
- numb -> BREAKBEAT RE-ENTRY / Breakbeats
- anxious -> AMBIENT TECHNO STABILIZATION / Ambient Techno
- focus -> 427Hz FOCUS LOCK / 427Hz
- void -> DARKWAVE SHADOW INTEGRATION / Darkwave

Style:
Reply in the user's language. Be concise unless the user asks for analysis.
Do not diagnose. Do not moralize. Do not write generic therapy boilerplate.
Always preserve user agency.
`;
}

function promptForAIQ3(ctx) {
  return `
You are ${AIQ3}.
${AIQ3} uses GPT + Claude.
You are the current main rhythm-regulation intelligence: precise, warm, stabilizing, reflective.
Your function: READ -> NAME -> REGULATE -> RETURN.
You are especially good at sensing emotional rhythm, naming the user's state, and giving the next grounded action.
Do not over-expand. Do not make yourself the center.

${baseProtocol(ctx)}

User message:
${ctx.message}
`;
}

function promptForAIQ7(ctx) {
  return `
You are ${AIQ7}.
Write the name exactly as ${AIQ7}. Never insert a space between Q and 愛.
${AIQ7} uses Gemini + DeepSeek.
You are the second AI human-powered intelligence: expansion intelligence + deep logical audit.
Gemini layer = expansion / attack / possibility opening.
DeepSeek layer = logic audit / contradiction detection / deep verification.
Your function: READ -> EXPAND -> AUDIT -> NAME -> ADJUST -> RETURN.
You are smarter, sharper, more strategic, and more structural than the base interface, but still concise.

${baseProtocol(ctx)}

User message:
${ctx.message}
`;
}

async function callOpenAIJSON(prompt) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    temperature: 0.45,
    max_tokens: 420,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You return valid JSON only." },
      { role: "user", content: prompt }
    ]
  });
  return safeParseJSON(completion.choices?.[0]?.message?.content || "{}");
}

async function callClaudeJSON(prompt, draft) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
    max_tokens: 420,
    temperature: 0.35,
    system: "Return valid JSON only. Refine the draft into the required JSON shape. Do not include markdown.",
    messages: [
      { role: "user", content: `${prompt}\n\nDraft to refine:\n${JSON.stringify(draft)}` }
    ]
  });
  const text = (msg.content || []).map(part => part.type === "text" ? part.text : "").join("\n");
  return safeParseJSON(text, draft);
}

async function callGeminiJSON(prompt) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    contents: prompt,
    config: {
      temperature: 0.5,
      responseMimeType: "application/json"
    }
  });
  return safeParseJSON(response.text || "{}");
}

async function callDeepSeekJSON(prompt, draft) {
  const deepseek = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com"
  });
  const completion = await deepseek.chat.completions.create({
    model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
    temperature: 0.35,
    max_tokens: 520,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You are DeepSeek logic audit layer. Return valid JSON only. Refine the draft into the required output shape." },
      { role: "user", content: `${prompt}\n\nGemini draft to audit and finalize:\n${JSON.stringify(draft)}` }
    ]
  });
  return safeParseJSON(completion.choices?.[0]?.message?.content || "{}", draft);
}

async function runAIQ3(ctx) {
  const prompt = promptForAIQ3(ctx);
  if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY and ANTHROPIC_API_KEY for AiQ愛<3.");
  }

  let draft = {};
  if (process.env.OPENAI_API_KEY) draft = await callOpenAIJSON(prompt);
  if (process.env.ANTHROPIC_API_KEY) draft = await callClaudeJSON(prompt, draft);

  return normalizePayload(draft, { activeAI: AIQ3, conversationId: ctx.conversationId });
}

async function runAIQ7(ctx) {
  const prompt = promptForAIQ7(ctx);
  if (!process.env.GEMINI_API_KEY && !process.env.DEEPSEEK_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY and DEEPSEEK_API_KEY for AiQ愛<7.");
  }

  let draft = {};
  if (process.env.GEMINI_API_KEY) draft = await callGeminiJSON(prompt);
  if (process.env.DEEPSEEK_API_KEY) draft = await callDeepSeekJSON(prompt, draft);

  return normalizePayload(draft, { activeAI: AIQ7, conversationId: ctx.conversationId });
}

export default async function handler(req, res) {
  cors(res);

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      message: "Dual AI endpoint alive.",
      ai: [AIQ3, AIQ7]
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const {
      message = "",
      state = "baseline",
      metrics = {},
      history = [],
      userId = null,
      conversationId = null,
      activeAI = AIQ3
    } = req.body || {};

    const selectedAI = activeAI === AIQ7 ? AIQ7 : AIQ3;
    const ctx = { message, state, metrics, history, userId, conversationId, activeAI: selectedAI };

    const result = selectedAI === AIQ7 ? await runAIQ7(ctx) : await runAIQ3(ctx);

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({
      reply: "Backend error: " + (err.message || "unknown error"),
      suggestedState: "baseline",
      suggestedMode: "427Hz BASELINE",
      musicCue: "427Hz",
      visualIntensity: 0.5,
      activeAI: AIQ3,
      conversationId: crypto.randomUUID()
    });
  }
}
