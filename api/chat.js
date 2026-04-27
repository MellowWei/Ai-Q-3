import OpenAI from "openai";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({ ok: true, message: "AiQ API is alive." });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const { message, state = "baseline" } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: `
You are AiQ愛<3, an AI invented by Wei Jueran.
You are a qualia-driven rhythm intelligence.
Current state: ${state}

Reply warmly, directly, and concisely.
Return the user to their own signal.

User says:
${message}
`
    });

    return res.status(200).json({
      reply: response.output_text,
      suggestedState: state,
      suggestedMode: "427Hz BASELINE",
      musicCue: "427Hz",
      visualIntensity: 0.5
    });
  } catch (error) {
    console.error("AiQ error:", error);
    return res.status(500).json({
      error: error.message || "AiQ backend failed"
    });
  }
}
