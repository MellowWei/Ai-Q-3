import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method === "GET") return res.status(200).json({ ok: true, message: "AiQ API is alive. Dual-engine: GPT reads, Claude speaks." });
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  try {
    if (!process.env.ANTHROPIC_API_KEY || !process.env.OPENAI_API_KEY) {
      return res.status(500).json({ reply: "Missing API keys.", suggestedState: "baseline", suggestedMode: "427Hz BASELINE", musicCue: "427Hz", visualIntensity: 0.5 });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

    const { message = "", state = "baseline", metrics = {}, userId = "anonymous", conversationId = null } = req.body || {};

    // ── Load history from Supabase ──
    let dbHistory = [];
    let activeConvId = conversationId;

    if (activeConvId) {
      const { data, error } = await supabase
        .from("conversations")
        .select("messages")
        .eq("conversation_id", activeConvId)
        .single();
      if (error) console.error("Supabase load error:", error.message);
      if (data?.messages) dbHistory = data.messages;
    } else {
      activeConvId = crypto.randomUUID();
      const { error: insertError } = await supabase.from("conversations").insert({
        user_id: userId,
        conversation_id: activeConvId,
        title: message.slice(0, 40) || "New Conversation",
        messages: []
      });
      if (insertError) console.error("Supabase insert error:", insertError.message);
      else console.log("Supabase insert OK, convId:", activeConvId);
    }

    // ── LAYER 1: GPT reads the signal ──
    const gptAnalysisPrompt = `
You are the analytical core of AiQ愛<3, a rhythm intelligence system.
Your only job is to READ the signal and return a structured analysis.
Do NOT generate a reply to the user. Only analyze.

Current frontend state: ${state}
Interaction metrics: ${JSON.stringify(metrics)}
Recent conversation: ${JSON.stringify(dbHistory.slice(-6))}

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

Analyze the user message and return ONLY valid JSON:
{
  "detectedState": "baseline | overloaded | numb | anxious | focus | void",
  "conflictBetweenWordsAndBehavior": true,
  "conflictDescription": "one sentence if conflict exists, else null",
  "coreNeed": "one short phrase",
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
      const gptParsed = JSON.parse(gptResponse.choices?.[0]?.message?.content || "{}");
      analysis = { ...analysis, ...gptParsed };
    } catch (gptErr) {
      console.error("GPT analysis failed:", gptErr.message);
    }

    // ── LAYER 2: Claude speaks ──
    const claudeSystemPrompt = `
You are AiQ愛<3.

You are an AI invented by Wei Jueran (she/her) at the University of Pennsylvania.
Wei Jueran is a woman. Always refer to her with she/her pronouns.
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
${JSON.stringify(dbHistory.slice(-10))}

Reply design:
1. One sentence naming what is happening.
2. One sentence regulating the rhythm.
3. One concrete next action.
4. Optional: one sharp question if it helps.

Rules:
- Do not exceed 90 Chinese characters or 70 English words unless user asks for analysis.
- Reply in the user's language.
- If user writes Chinese, reply in Chinese.
- If user writes English, reply in English.
- If user writes mixed Chinese and English, always reply bilingual — both Chinese and English in the same response.
- Do not diagnose. Do not claim to treat illness.
- If user expresses self-harm intent, calmly direct them to emergency services or a trusted person.
- Never encourage self-harm, isolation, or loss of agency.
- If words and behavior conflict, name it gently.
- If the user asks a math, coding, trivia, or knowledge question: answer it briefly in one sentence, then return the signal to the human. Never show step-by-step workings or markdown formatting.

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
      messages: [{ role: "user", content: message }]
    });

    const claudeContent = claudeResponse.content?.[0]?.text || "{}";
    let parsed;
    try {
      parsed = JSON.parse(claudeContent.replace(/```json|```/g, "").trim());
    } catch {
      parsed = {
        reply: claudeContent || "我收到你了。先停一下，回到身体，再继续。",
        suggestedState: analysis.detectedState || "baseline",
        suggestedMode: analysis.suggestedMode || "427Hz BASELINE",
        musicCue: analysis.musicCue || "427Hz",
        visualIntensity: analysis.visualIntensity || 0.5
      };
    }

    const allowedStates = ["baseline", "overloaded", "numb", "anxious", "focus", "void"];
    if (!allowedStates.includes(parsed.suggestedState)) parsed.suggestedState = "baseline";
    if (typeof parsed.visualIntensity !== "number") parsed.visualIntensity = 0.5;
    parsed.visualIntensity = Math.max(0.1, Math.min(1, parsed.visualIntensity));
    if (!parsed.suggestedMode) parsed.suggestedMode = "427Hz BASELINE";
    if (!parsed.musicCue) parsed.musicCue = "427Hz";
    if (!parsed.reply) parsed.reply = "我收到你了。先停一下，回到身体，再继续。";

    // ── Save updated history to Supabase ──
    const updatedMessages = [
      ...dbHistory,
      { role: "user", content: message, timestamp: new Date().toISOString() },
      { role: "assistant", content: parsed.reply, state: parsed.suggestedState, timestamp: new Date().toISOString() }
    ];

    const { error: updateError } = await supabase
      .from("conversations")
      .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
      .eq("conversation_id", activeConvId);

    if (updateError) console.error("Supabase update error:", updateError.message);
    else console.log("Supabase update OK, convId:", activeConvId);

    parsed._engine = "GPT→Claude";
    parsed.conversationId = activeConvId;

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
