const API_ENDPOINT = "https://ai-q-3.vercel.app/api/chat";

const canvas = document.getElementById("field");
const ctx = canvas.getContext("2d");
const bgGlow = document.getElementById("bgGlow");
const logEl = document.getElementById("log");
const statusEl = document.getElementById("status");
const homeModeEl = document.getElementById("homeMode");

let w, h, particles = [];
let intensity = 0.5;
let targetIntensity = 0.5;

let currentState = "baseline";
let currentMode = "427Hz BASELINE";
let currentMusic = "427Hz";

let lastScroll = window.scrollY;
let lastTime = Date.now();
let clicks = 0;
let dwellStart = Date.now();
let conversationHistory = [];
let typingStart = null;

let metrics = {
  scrollVelocity: 0,
  clickDensity: 0,
  dwellSeconds: 0,
  inputTempo: 0
};

/* =========================
   AUDIO ENGINE v2
   multi-layer synthesized sound field
========================= */

let audioCtx = null;
let masterGain = null;
let layers = {};
let audioEnabled = false;
let currentAudioMode = "427Hz";

function initAudio() {
  if (audioCtx) return;

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0;
  masterGain.connect(audioCtx.destination);

  createLayer("pad", "sine", 427, 0.15);
  createLayer("bass", "sine", 110, 0.1);
  createLayer("pulse", "square", 2, 0);
  createLayer("air", "triangle", 854, 0.025);
}

function createLayer(name, type, freq, gain) {
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();

  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;

  osc.connect(g);
  g.connect(masterGain);

  osc.start();

  layers[name] = {
    osc,
    gain: g
  };
}

function ensureAudioOn() {
  initAudio();

  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  audioEnabled = true;
  masterGain.gain.setTargetAtTime(0.12, audioCtx.currentTime, 0.1);
  updateStatus();
}

function toggleAudio() {
  initAudio();

  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  audioEnabled = !audioEnabled;

  masterGain.gain.setTargetAtTime(
    audioEnabled ? 0.12 : 0,
    audioCtx.currentTime,
    0.1
  );

  updateStatus();
}

function setAudioMode(mode) {
  if (!audioCtx) return;

  currentAudioMode = mode || "427Hz";
  const now = audioCtx.currentTime;

  const modes = {
    "427Hz": {
      pad: { freq: 427, gain: 0.15, type: "sine" },
      bass: { freq: 110, gain: 0.08, type: "sine" },
      pulse: { freq: 1.2, gain: 0, type: "square" },
      air: { freq: 854, gain: 0.018, type: "triangle" }
    },

    "Hyperpop": {
      pad: { freq: 800, gain: 0.12, type: "sawtooth" },
      bass: { freq: 180, gain: 0.12, type: "square" },
      pulse: { freq: 9, gain: 0.08, type: "square" },
      air: { freq: 1200, gain: 0.035, type: "sawtooth" }
    },

    "Breakbeats": {
      pad: { freq: 427, gain: 0.1, type: "triangle" },
      bass: { freq: 200, gain: 0.12, type: "sine" },
      pulse: { freq: 5, gain: 0.12, type: "square" },
      air: { freq: 900, gain: 0.025, type: "triangle" }
    },

    "Ambient Techno": {
      pad: { freq: 320, gain: 0.14, type: "sine" },
      bass: { freq: 140, gain: 0.08, type: "sine" },
      pulse: { freq: 2, gain: 0.05, type: "square" },
      air: { freq: 640, gain: 0.025, type: "triangle" }
    },

    "Darkwave": {
      pad: { freq: 110, gain: 0.18, type: "sine" },
      bass: { freq: 70, gain: 0.12, type: "sine" },
      pulse: { freq: 1, gain: 0.03, type: "square" },
      air: { freq: 220, gain: 0.018, type: "triangle" }
    },

    "Synthpop": {
      pad: { freq: 640, gain: 0.14, type: "triangle" },
      bass: { freq: 200, gain: 0.08, type: "sine" },
      pulse: { freq: 3, gain: 0.05, type: "square" },
      air: { freq: 960, gain: 0.035, type: "triangle" }
    },

    "Drift Phonk": {
      pad: { freq: 180, gain: 0.12, type: "sawtooth" },
      bass: { freq: 90, gain: 0.15, type: "sine" },
      pulse: { freq: 4, gain: 0.1, type: "square" },
      air: { freq: 360, gain: 0.02, type: "triangle" }
    }
  };

  const selected = modes[currentAudioMode] || modes["427Hz"];

  for (let key in selected) {
    const layer = layers[key];
    if (!layer) continue;

    layer.osc.type = selected[key].type;
    layer.osc.frequency.setTargetAtTime(selected[key].freq, now, 0.12);
    layer.gain.gain.setTargetAtTime(selected[key].gain, now, 0.12);
  }

  updateStatus();
}

/* =========================
   STATE MAP
========================= */

const stateMap = {
  overloaded: {
    mode: "HYPERPOP PEAK TRAVERSAL",
    music: "Hyperpop",
    intensity: 0.95,
    message: "Energy is valid. Let it peak, then release.",
    glow: 1
  },
  numb: {
    mode: "BREAKBEAT RE-ENTRY",
    music: "Breakbeats",
    intensity: 0.78,
    message: "Body first. Meaning later.",
    glow: 0.75
  },
  anxious: {
    mode: "AMBIENT TECHNO STABILIZATION",
    music: "Ambient Techno",
    intensity: 0.55,
    message: "Space becomes rhythm. Rhythm becomes safety.",
    glow: 0.55
  },
  focus: {
    mode: "427Hz FOCUS LOCK",
    music: "427Hz",
    intensity: 0.32,
    message: "Attention anchored. Drift reduced.",
    glow: 0.3
  },
  void: {
    mode: "DARKWAVE SHADOW INTEGRATION",
    music: "Darkwave",
    intensity: 0.68,
    message: "Descend with agency. Darkness is not the enemy.",
    glow: 0.68
  },
  baseline: {
    mode: "427Hz BASELINE",
    music: "427Hz",
    intensity: 0.48,
    message: "Local resonance established.",
    glow: 0.45
  }
};

const musicVisualMap = {
  "Hyperpop": {
    state: "overloaded",
    mode: "HYPERPOP PEAK TRAVERSAL",
    intensity: 0.96,
    glow: 1
  },
  "Synthpop": {
    state: "baseline",
    mode: "SYNTHPOP FIRST BREATH",
    intensity: 0.58,
    glow: 0.62
  },
  "Drift Phonk": {
    state: "focus",
    mode: "DRIFT PHONK EMBODIMENT",
    intensity: 0.72,
    glow: 0.7
  },
  "Ambient Techno": {
    state: "anxious",
    mode: "AMBIENT TECHNO STABILIZATION",
    intensity: 0.5,
    glow: 0.55
  },
  "Darkwave": {
    state: "void",
    mode: "DARKWAVE SHADOW INTEGRATION",
    intensity: 0.68,
    glow: 0.68
  },
  "Breakbeats": {
    state: "numb",
    mode: "BREAKBEAT RE-ENTRY",
    intensity: 0.78,
    glow: 0.75
  },
  "427Hz": {
    state: "baseline",
    mode: "427Hz BASELINE",
    intensity: 0.42,
    glow: 0.45
  }
};

/* =========================
   VISUAL ENGINE
========================= */

function resize() {
  w = canvas.width = innerWidth;
  h = canvas.height = innerHeight;
}

resize();
addEventListener("resize", resize);

function createParticles() {
  particles = [];

  const count = Math.min(
    210,
    Math.floor((innerWidth * innerHeight) / 7800)
  );

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      r: Math.random() * 2 + 0.4,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35
    });
  }
}

createParticles();

function draw() {
  ctx.clearRect(0, 0, w, h);

  intensity += (targetIntensity - intensity) * 0.045;

  for (const p of particles) {
    p.x += p.vx * (1 + intensity * 4);
    p.y += p.vy * (1 + intensity * 4);

    if (p.x < 0) p.x = w;
    if (p.x > w) p.x = 0;
    if (p.y < 0) p.y = h;
    if (p.y > h) p.y = 0;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r + intensity * 0.9, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(220,210,255,${0.18 + intensity * 0.42})`;
    ctx.fill();
  }

  requestAnimationFrame(draw);
}

draw();

/* =========================
   UI + STATE CONTROL
========================= */

function enterSystem() {
  document.getElementById("enter").classList.add("hide");
  ensureAudioOn();
  setState("baseline", false);
}

function normalizeState(state) {
  const allowed = ["baseline", "overloaded", "numb", "anxious", "focus", "void"];
  return allowed.includes(state) ? state : "baseline";
}

function setState(state, writeLog = true) {
  ensureAudioOn();

  currentState = normalizeState(state);
  const config = stateMap[currentState];

  currentMode = config.mode;
  currentMusic = config.music;
  targetIntensity = config.intensity;

  bgGlow.style.opacity = String(config.glow);
  document.body.setAttribute("data-state", currentState);

  setAudioMode(currentMusic);
  updateStatus();

  homeModeEl.textContent = `CURRENT MODE: ${currentMode}`;

  if (writeLog) {
    appendLog(`[SYSTEM] ${currentMode}\n[AiQ愛<3] ${config.message}`);
  }
}

function manualMusic(cue) {
  ensureAudioOn();

  const v = musicVisualMap[cue] || musicVisualMap["427Hz"];

  currentMusic = cue;
  currentMode = v.mode;
  currentState = v.state;
  targetIntensity = v.intensity;

  bgGlow.style.opacity = String(v.glow);
  document.body.setAttribute("data-state", currentState);

  setAudioMode(cue);
  updateStatus();

  homeModeEl.textContent = `CURRENT MODE: ${currentMode}`;

  appendLog("[AUDIO TEST] " + cue);
}

function applyAIQPayload(data) {
  if (!data) return;

  if (data.suggestedState) {
    currentState = normalizeState(data.suggestedState);
  }

  targetIntensity =
    typeof data.visualIntensity === "number"
      ? Math.max(0.1, Math.min(1, data.visualIntensity))
      : stateMap[currentState].intensity;

  currentMode = data.suggestedMode || stateMap[currentState].mode;
  currentMusic = data.musicCue || stateMap[currentState].music;

  const glowByState = {
    baseline: 0.45,
    overloaded: 1,
    numb: 0.75,
    anxious: 0.55,
    focus: 0.3,
    void: 0.68
  };

  bgGlow.style.opacity = glowByState[currentState] || targetIntensity;

  document.body.setAttribute("data-state", currentState);

  setAudioMode(currentMusic);
  updateStatus();

  homeModeEl.textContent = `CURRENT MODE: ${currentMode}`;
}

function updateStatus() {
  statusEl.innerHTML =
    `STATE: ${currentState.toUpperCase()}<br>` +
    `MODE: ${currentMode}<br>` +
    `MUSIC: ${currentMusic}<br>` +
    `AUDIO: ${audioEnabled ? "ON" : "OFF"}`;
}

function appendLog(text) {
  logEl.textContent += "\n\n" + text;
  logEl.scrollTop = logEl.scrollHeight;
}

function pushHistory(role, content) {
  conversationHistory.push({ role, content });

  if (conversationHistory.length > 12) {
    conversationHistory = conversationHistory.slice(-12);
  }
}

function calculateInputTempo(value) {
  if (!typingStart) return 0;

  const seconds = Math.max((Date.now() - typingStart) / 1000, 1);
  return value.length / seconds;
}

/* =========================
   CHAT
========================= */

async function sendMessage(input) {
  const message = input.trim();
  if (!message) return;

  appendLog("> " + message);
  pushHistory("user", message);

  appendLog("[AiQ愛<3] thinking through rhythm...");

  metrics.dwellSeconds = Math.round((Date.now() - dwellStart) / 1000);
  metrics.inputTempo = calculateInputTempo(message);

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        state: currentState,
        metrics,
        history: conversationHistory
      })
    });

    const data = await response.json();

    if (data.reply) {
      appendLog("[AiQ愛<3] " + data.reply);
      pushHistory("assistant", data.reply);
      applyAIQPayload(data);
    } else if (data.error) {
      appendLog("[BACKEND ERROR] " + data.error);
    } else {
      appendLog("[BACKEND RAW] " + JSON.stringify(data));
    }
  } catch (error) {
    appendLog("[FRONTEND ERROR] " + error.message);
    console.error(error);
  }

  typingStart = null;
}

function handleInput(event) {
  const input = event.target;

  if (!typingStart && input.value.length > 0) {
    typingStart = Date.now();
  }

  if (event.key !== "Enter") return;

  const value = input.value;
  input.value = "";

  sendMessage(value);
}

function sendFromButton() {
  const input = document.getElementById("input");
  const value = input.value;

  input.value = "";

  sendMessage(value);
}

/* =========================
   BEHAVIOR METRICS
========================= */

addEventListener("click", () => {
  clicks++;
  metrics.clickDensity = clicks;

  if (clicks > 8 && currentState !== "anxious") {
    setState("anxious");
  }

  setTimeout(() => {
    clicks = Math.max(0, clicks - 1);
    metrics.clickDensity = clicks;
  }, 1200);
});

addEventListener("scroll", () => {
  const now = Date.now();
  const dy = Math.abs(scrollY - lastScroll);
  const dt = now - lastTime;
  const velocity = dy / Math.max(dt, 1);

  metrics.scrollVelocity = Number(velocity.toFixed(3));

  lastScroll = scrollY;
  lastTime = now;

  if (velocity > 3.8 && currentState !== "overloaded") {
    setState("overloaded");
  } else if (velocity < 0.03 && scrollY > 200 && currentState !== "focus") {
    setState("focus");
  }
});

setInterval(() => {
  metrics.dwellSeconds = Math.round((Date.now() - dwellStart) / 1000);
}, 1000);
