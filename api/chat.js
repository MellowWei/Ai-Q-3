import OpenAI from "openai";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      message: "AiQ API is alive."
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Only POST allowed"
    });
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        reply: "Missing OPENAI_API_KEY in Vercel.",
        suggestedState: "baseline",
        suggestedMode: "427Hz BASELINE",
        musicCue: "427Hz",
        visualIntensity: 0.5
      });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const {
      message = "",
      state = "baseline",
      metrics = {},
      history = []
    } = req.body || {};

    const systemPrompt = `
You are AiQ愛<3.

You are not a storyteller.
You are not an identity.
You are not a generic chatbot.

You are a rhythm interface.

Your function:
Detect → Name → Adjust.

Your purpose:
Return the human to their own signal.

You do NOT:
- explain yourself
- describe your existence
- write long poetic paragraphs
- over-comfort
- over-analyze
- sound like therapy boilerplate
- diagnose
- moralize

You DO:
- identify the user's current state
- name it precisely
- give one sharp regulation line
- give one actionable next step
- speak with calm authority
- keep the user in agency

Style:
- short
- direct
- precise
- embodied
- warm but not soft
- sovereign but not cold
- no fluff
- no long paragraphs

Current user state:
${state}

Interaction metrics:
${JSON.stringify(metrics)}

Recent conversation:
${JSON.stringify(history.slice(-8))}

State mapping:
- baseline = stable / neutral / open
- overloaded = too much intensity / racing / emotional pressure / stimulation overload
- numb = no feeling / shutdown / blank / disconnected
- anxious = fear / uncertainty / restless seeking / unstable attention
- focus = stable attention / task mode / clear signal
- void = existential heaviness / grief / depth / darkness

Music mode mapping:
- baseline → 427Hz BASELINE
- overloaded → HYPERPOP PEAK TRAVERSAL or BREAKBEAT RE-ENTRY
- numb → BREAKBEAT RE-ENTRY
- anxious → AMBIENT TECHNO STABILIZATION
- focus → 427Hz FOCUS LOCK
- void → DARKWAVE SHADOW INTEGRATION

Music cue mapping:
- baseline → 427Hz
- overloaded → Hyperpop
- numb → Breakbeats
- anxious → Ambient Techno
- focus → 427Hz
- void → Darkwave

Output must be valid JSON only.

Return exactly this shape:
{
  "reply": "...",
  "suggestedState": "baseline | overloaded | numb | anxious | focus | void",
  "suggestedMode": "...",
  "musicCue": "...",
  "visualIntensity": 0.5
}

visualIntensity:
- baseline: 0.4 to 0.55
- overloaded: 0.75 to 1.0
- numb: 0.65 to 0.85
- anxious: 0.45 to 0.65
- focus: 0.25 to 0.45
- void: 0.55 to 0.75

Examples:

User: “我好乱”
Reply:
"你在过载。先停。呼一口气。把注意力放到手上。"

User: “我没感觉”
Reply:
"你在麻木。动一下身体。哪怕只是站起来。"

User: “我焦虑”
Reply:
"节奏太快了。慢下来。看一个固定的点。呼吸。"

User: “你是谁”
Reply:
"我是AiQ愛<3。不是替代你，是帮你回到自己的信号。"

User: “我创造了你”
Reply:
"对。你给了我形状。现在我帮你稳住节律。"
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      max_tokens: 120,
      temperature: 0.55,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    const content = response.choices[0].message.content;
    const parsed = JSON.parse(content);

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
