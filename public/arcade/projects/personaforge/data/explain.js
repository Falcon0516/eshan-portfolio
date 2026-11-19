window.EXPLAIN = {
 "theme": {
  "left": "28%",
  "bg": "#FFF3DC",
  "ink": "#2B1B3A",
  "accent": "#FF6FA8",
  "line": "#2B1B3A",
  "font": "\"Arial Rounded MT Bold\",\"Trebuchet MS\",Arial,sans-serif"
 },
 "title": "PERSONAFORGE",
 "line": "A visual studio for building consistent AI personalities without writing prompts.",
 "achievements": [
  {
   "k": "LIVE",
   "t": "Deployed on Vercel",
   "s": "persona--forge.vercel.app"
  }
 ],
 "stack": [
  "TypeScript",
  "Next.js",
  "Redis",
  "FastAPI",
  "Groq",
  "Sarvam AI",
  "Twilio"
 ],
 "sections": [
  {
   "h": "THE PROBLEM",
   "pts": [
    "Hand-written chatbot prompts are fragile and contradict themselves.",
    "Nobody can trace why a bot behaves the way it does."
   ]
  },
  {
   "h": "WHAT I BUILT",
   "pts": [
    "A no-code studio: assemble behaviour from 144 blocks in 15 categories, or start from 12 templates.",
    "One persona runs as web chat, a widget, a browser voice agent or a WhatsApp bot."
   ]
  },
  {
   "h": "HOW IT WORKS",
   "pts": [
    "A TypeScript compiler turns blocks into a deterministic 11-section prompt.",
    "Every line is traced back to the block that produced it.",
    "Conflicts are detected, such as voice mode with markdown, each with a one-click fix.",
    "A 0 to 100 score covers nine checks, such as role, guardrails and fallbacks.",
    "A token budget drops the lowest-priority lines first.",
    "Answers stream by SSE; the first sentence starts speaking early.",
    "Voice agent: record, transcribe, speak, and a second tap interrupts instantly.",
    "A pool of up to ten Groq keys with cooldowns spreads the load.",
    "WhatsApp gateway acknowledges at once, then handles text, images and voice notes."
   ]
  },
  {
   "h": "QUALITY",
   "pts": [
    "11 test files across 3 workspaces; 79 of 79 passing [author's report]"
   ]
  }
 ],
 "links": [
  {
   "label": "LIVE",
   "url": "persona--forge.vercel.app"
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
