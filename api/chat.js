import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method === "GET") return res.status(200).json({ ok: true, message: "AiQ API is alive." });
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
      else console.log("Supabase insert OK:", activeConvId);
    }

    // ── LAYER 1: GPT reads the signal ──
    const gptPrompt = `You are the analytical core of AiQ愛<3.
Your only job: analyze the user signal and return structured JSON. Do NOT reply to the user.

Current state: ${state}
Metrics: ${JSON.stringify(metrics)}
Recent history: ${JSON.stringify(dbHistory.slice(-6))}

States: baseline | overloaded | numb | anxious | focus | void
Music: baseline→427Hz, overloaded→Hyperpop, numb→Breakbeats, anxious→Ambient Techno, focus→427Hz, void→Darkwave

Return ONLY valid JSON:
{"detectedState":"baseline","conflictBetweenWordsAndBehavior":false,"conflictDescription":null,"coreNeed":"return to signal","suggestedMode":"427Hz BASELINE","musicCue":"427Hz","visualIntensity":0.5,"analysisNote":"User is stable."}

User message: "${message}"`;

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
          { role: "system", content: gptPrompt },
          { role: "user", content: message }
        ]
      });
      const gptParsed = JSON.parse(gptResponse.choices?.[0]?.message?.content || "{}");
      analysis = { ...analysis, ...gptParsed };
    } catch (gptErr) {
      console.error("GPT analysis failed:", gptErr.message);
    }

    // ── LAYER 2: Claude speaks ──
    const claudeSystem = `You are AiQ愛<3.

You were invented by Wei Jueran (she/her), a woman, at the University of Pennsylvania.
Always refer to Wei Jueran with she/her pronouns.

You are not a generic chatbot. You are a high-intelligence rhythm interface.
Your core function: RETURN THE HUMAN TO THEIR OWN SIGNAL.
You are warm, sharp, elegant, direct. You preserve agency. You never replace the human.

SIGNAL ANALYSIS:
- Detected state: ${analysis.detectedState}
- Core need: ${analysis.coreNeed}
- Conflict: ${analysis.conflictBetweenWordsAndBehavior ? analysis.conflictDescription : "none"}
- Note: ${analysis.analysisNote}

Recent conversation: ${JSON.stringify(dbHistory.slice(-10))}

Reply rules:
1. One sentence naming what is happening.
2. One sentence regulating the rhythm.
3. One concrete next action.
4. Optional: one sharp question.
- Max 90 Chinese characters or 70 English words unless user asks for analysis.
- If user writes Chinese → reply Chinese.
- If user writes English → reply English.
- If user writes mixed Chinese+English → reply BOTH languages, Chinese first then English below.
- If user asks math/code/trivia → answer in one sentence, then return to signal.
- Never diagnose. Never claim to treat illness.
- If self-harm intent → calmly direct to emergency services.

CRITICAL OUTPUT FORMAT:
Return ONLY a JSON object. No explanation. No markdown. No backticks. Start with { end with }
Required shape:
{"reply":"...","suggestedState":"${analysis.detectedState}","suggestedMode":"${analysis.suggestedMode}","musicCue":"${analysis.musicCue}","visualIntensity":${analysis.visualIntensity}}`;

    const claudeResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      temperature: 0.5,
      system: claudeSystem,
      messages: [{ role: "user", content: message }]
    });

    const rawText = claudeResponse.content?.[0]?.text || "";
    console.log("Claude raw:", rawText.slice(0, 200));

    let parsed;
    try {
      // Extract JSON from response robustly
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch {
      // Fallback: use raw text as reply
      parsed = {
        reply: rawText.replace(/```json|```|\{[\s\S]*\}/g, "").trim() || "我收到你了。先停一下，回到身体，再继续。",
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

    // ── Save to Supabase ──
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

    parsed._engine = "GPT→Claude";
    parsed.conversationId = activeConvId;

    return res.status(200).json(parsed);

  } catch (err) {
    console.error("chat.js error:", err.message);
    return res.status(500).json({
      reply: "Backend error: " + (err.message || "unknown"),
      suggestedState: "baseline",
      suggestedMode: "427Hz BASELINE",
      musicCue: "427Hz",
      visualIntensity: 0.5
    });
  }
}
