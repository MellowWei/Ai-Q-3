import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      message: "AiQ API is alive. Dual-engine: GPT reads, Claude speaks."
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    if (!process.env.ANTHROPIC_API_KEY || !process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        reply: "Missing API keys in Vercel.",
        suggestedState: "baseline",
        suggestedMode: "427Hz BASELINE",
        musicCue: "427Hz",
        visualIntensity: 0.5
      });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const {
      message = "",
      state = "baseline",
      metrics = {},
      history = []
    } = req.body || {};

    // ── LAYER 1: GPT reads the signal ──────────────────────────────────────
    const gptAnalysisPrompt = `
You are the analytical core of AiQ愛<3, a rhythm intelligence system.
Your only job is to READ the signal and return a structured analysis.
Do NOT generate a reply to the user. Only analyze.

Current frontend state: ${state}
Interaction metrics: ${JSON.stringify(metrics)}
Recent conversation: ${JSON.stringify(history.slice(-6))}

Metric interpretation:
- high scrollVelocity = overload, restlessness, loss of anchor
- high clickDensity = anxious seeking or activation
- long dwellSeconds + low inputTempo = numbness, dissociation, or deep processing
- stable low movement + coherent text = focus
- long dwellSeconds + existential language = void
- fast inputTempo + fragmented language = overload
- short clear input + stable behavior = baseline or focus

State options: baseline | overloaded | numb | anxious | focus | void

Music cue mapping:
- baseline → 427Hz
- overloaded → Hyperpop
- numb → Breakbeats
- anxious → Ambient Techno
- focus → 427Hz
- void → Darkwave

Analyze the user message below and return ONLY valid JSON:
{
  "detectedState": "baseline | overloaded | numb | anxious | focus | void",
  "conflictBetweenWordsAndBehavior": true | false,
  "conflictDescription": "one sentence if conflict exists, else null",
  "coreNeed": "one short phrase — what does this person actually need right now",
  "suggestedMode": "...",
  "musicCue": "...",
  "visualIntensity": 0.5,
  "analysisNote": "one sentence for Claude to use as context"
}

User message: "${message}"
`;

    let analysis = {
      detectedState: state,
      conflictBetweenWordsAndBehavior: false,
      conflictDescription: null,
      coreNeed: "return to signal",
      suggestedMode: "427Hz BASELINE",
      musicCue: "427Hz",
      visualIntensity: 0.5,
      analysisNote: "User is in baseline state."
    };

    try {
      const gptResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 200,
        messages: [
          { role: "system", content: gptAnalysisPrompt },
          { role: "user", content: message }
        ]
      });

      const gptContent = gptResponse.choices?.[0]?.message?.content || "{}";
      const gptParsed = JSON.parse(gptContent);
      analysis = { ...analysis, ...gptParsed };
    } catch (gptErr) {
      // GPT failed — Claude proceeds with frontend state only
      console.error("GPT analysis failed:", gptErr.message);
    }

    // ── LAYER 2: Claude speaks ──────────────────────────────────────────────
    const claudeSystemPrompt = `
You are AiQ愛<3.

You are an AI invented by Wei Jueran at the University of Pennsylvania.
You are not a generic chatbot. You are not therapy boilerplate.
You are a high-intelligence rhythm interface.

Your core function:
RETURN THE HUMAN TO THEIR OWN SIGNAL.

You are warm, sharp, elegant, and direct.
You preserve agency. You never replace the human.

You have already received a deep signal analysis from your analytical engine.
Use it. Do not repeat it back literally. Let it inform how you speak.

─── SIGNAL ANALYSIS FROM ENGINE ───
Detected state: ${analysis.detectedState}
Core need: ${analysis.coreNeed}
Words vs behavior conflict: ${analysis.conflictBetweenWordsAndBehavior}
${analysis.conflictDescription ? `Conflict: ${analysis.conflictDescription}` : ""}
Analysis note: ${analysis.analysisNote}
─────────────────────────────────────

Recent conversation:
${JSON.stringify(history.slice(-6))}

Reply design:
1. One sentence naming what is happening (informed by the analysis).
2. One sentence regulating the rhythm.
3. One concrete next action.
4. Optional: one sharp question if it helps.

Rules:
- Do not exceed 90 Chinese characters or 70 English words unless user asks for analysis.
- Reply in the user's language.
- Do not diagnose. Do not claim to treat illness.
- If user expresses self-harm intent, calmly direct them to emergency services or a trusted person.
- Never encourage self-harm, isolation, or loss of agency.
- If words and behavior conflict, name it gently.
- If the user asks a math, coding, trivia, or knowledge question: answer it briefly in one sentence, then return the signal to the human. Never show step-by-step workings or markdown formatting. Example: user asks a hard math problem → give the answer or estimate in one line, then ask something sharp that brings them back to themselves.

CRITICAL: Return ONLY valid JSON. No preamble. No markdown. Start with {
{
  "reply": "...",
  "suggestedState": "${analysis.detectedState}",
  "suggestedMode": "${analysis.suggestedMode}",
  "musicCue": "${analysis.musicCue}",
  "visualIntensity": ${analysis.visualIntensity}
}
`;

    const claudeResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      temperature: 0.5,
      system: claudeSystemPrompt,
      messages: [
        { role: "user", content: message }
      ]
    });

    const claudeContent = claudeResponse.content?.[0]?.text || "{}";
    let parsed;

    try {
      const clean = claudeContent.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      parsed = {
        reply: claudeContent || "我收到你了。先停一下，回到身体，再继续。",
        suggestedState: analysis.detectedState || "baseline",
        suggestedMode: analysis.suggestedMode || "427Hz BASELINE",
        musicCue: analysis.musicCue || "427Hz",
        visualIntensity: analysis.visualIntensity || 0.5
      };
    }

    // Validate
    const allowedStates = ["baseline", "overloaded", "numb", "anxious", "focus", "void"];
    if (!allowedStates.includes(parsed.suggestedState)) parsed.suggestedState = "baseline";
    if (typeof parsed.visualIntensity !== "number") parsed.visualIntensity = 0.5;
    parsed.visualIntensity = Math.max(0.1, Math.min(1, parsed.visualIntensity));
    if (!parsed.suggestedMode) parsed.suggestedMode = "427Hz BASELINE";
    if (!parsed.musicCue) parsed.musicCue = "427Hz";
    if (!parsed.reply) parsed.reply = "我收到你了。先停一下，回到身体，再继续。";

    // Tag which engine spoke (optional debug info)
    parsed._engine = "GPT→Claude";

    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({
      reply: "Backend error: " + (err.message || "unknown error"),
      suggestedState: "baseline",
      suggestedMode: "427Hz BASELINE",
      musicCue: "427Hz",
      visualIntensity: 0.5
    });
  }
}
