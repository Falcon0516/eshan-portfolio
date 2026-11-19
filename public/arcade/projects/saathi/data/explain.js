window.EXPLAIN = {
 "theme": {
  "bg": "#1B120B",
  "ink": "#F3E6CC",
  "accent": "#FFB000",
  "line": "#6B4A2A",
  "font": "Georgia,\"Times New Roman\",serif"
 },
 "title": "SAATHI",
 "line": "A voice-AI phone assistant that answers real calls in English, Hindi and Kannada.",
 "achievements": [
  {
   "k": "2",
   "t": "2nd Place, AI-STHETICA AIVORA 2026",
   "s": "SJBIT"
  },
  {
   "k": "2",
   "t": "2nd Place, Innovathon IMPULSE 6.0",
   "s": "SJBIT"
  }
 ],
 "stack": [
  "Python",
  "Rust",
  "Tauri",
  "React",
  "Kotlin",
  "Swift",
  "Groq",
  "Sarvam AI",
  "Whisper",
  "Piper",
  "SQLite"
 ],
 "sections": [
  {
   "h": "THE PROBLEM",
   "pts": [
    "Small businesses and individuals miss calls or serve callers in different languages.",
    "Telephony APIs cost money; the aim was real calls without paid telephony.",
    "First target: health screening for feature-phone users."
   ]
  },
  {
   "h": "WHAT I BUILT",
   "pts": [
    "An agent that answers a real phone call and replies in the caller's own language: English, Hindi or Kannada.",
    "Version 1 in Python: controls an Android phone with ADB and Scrcpy, using Groq with Whisper and Piper.",
    "Version 2 in Rust and Tauri: a desktop app (VoidRelay) with Android and iOS companion apps (VoidCaller).",
    "Offline mode with local Whisper, Ollama and Piper."
   ]
  },
  {
   "h": "HOW IT WORKS",
   "pts": [
    "Phone connects to the PC over WebSocket on port 7331 with a 10 s heartbeat.",
    "Audio is captured into a lock-free ring buffer.",
    "Voice activity detection: speech of 300 ms or more starts an utterance; 800 ms of silence ends it.",
    "The mic is muted while the AI speaks, so it never hears itself.",
    "Speech to text: Sarvam online, or whisper-rs offline.",
    "LLM: Groq Llama 3.3 70B streaming, or Ollama Llama 3.2 3B offline.",
    "Text to speech: Sarvam Bulbul (Hindi, Kannada) or local Piper.",
    "Each finished sentence goes to speech at once, so the caller hears the first sentence early.",
    "An engine router picks online or offline and checks Groq reachability every 30 s."
   ]
  },
  {
   "h": "HIGHLIGHTS",
   "pts": [
    "Version 1 responded in around 300 ms [author tests, not an audited benchmark]",
    "Call state machine from Idle to Ended with eight states.",
    "SQLite call history and an optional Telegram bot (/call, /hangup, /mode, /say).",
    "Registry of 18 models with a hardware profiler that recommends downloads.",
    "The call and voice pipeline was reused in KAVACH and VeriFarm."
   ]
  }
 ],
 "links": [
  {
   "label": "LIVE DEMO",
   "url": "saathi-presentation.netlify.app"
  },
  {
   "label": "PORTFOLIO",
   "url": "eshan-portfolio.streyeke.cloud"
  },
  {
   "label": "GITHUB",
   "url": "github.com/Falcon0516"
  },
  {
   "label": "LINKEDIN",
   "url": "linkedin.com/in/eshan-h"
  }
 ]
};
