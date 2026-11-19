window.EXPLAIN = {
 "theme": {
  "bg": "#FFF4E0",
  "ink": "#14101C",
  "accent": "#E8318A",
  "line": "#14101C",
  "font": "Impact,\"Arial Black\",Arial,sans-serif"
 },
 "title": "KAVACH",
 "line": "An AI-agent platform for emergencies: one trigger starts six agents at once.",
 "achievements": [
  {
   "k": "6.0",
   "t": "Built for Sentinel Hack 6.0",
   "s": "KSIT Bengaluru, April 2026"
  }
 ],
 "stack": [
  "Python",
  "LangGraph",
  "FastAPI",
  "PWA",
  "Groq",
  "Twilio",
  "YOLOv8",
  "Tailscale"
 ],
 "sections": [
  {
   "h": "THE PROBLEM",
   "pts": [
    "In danger, nobody can open five apps and make five calls.",
    "Feature-phone users have no app to open at all."
   ]
  },
  {
   "h": "WHAT I BUILT",
   "pts": [
    "Guardian, a phone app with five triggers: SOS button, the word \"kavach\", shake, triple volume press and an overdue SafeWalk timer.",
    "If the backend does not answer in 3 seconds, the app falls back to the phone's SMS.",
    "A keypad phone can trigger it with a normal call or SMS.",
    "A Command Center that shows each agent thinking live."
   ]
  },
  {
   "h": "HOW IT WORKS",
   "pts": [
    "A LangGraph supervisor fans out to six agents in parallel.",
    "Threat: scores severity with a 70B model.",
    "Family alert: WhatsApp messages through Twilio.",
    "FIR: drafts a police report with relevant IPC sections.",
    "Navigation: nearest police, hospital and safe house by Haversine distance.",
    "ARGUS agent: reads camera streams for people, faces and plates.",
    "NCRB agent: adds crime-hotspot context.",
    "A call bridge reads the call queue every 2 s and speaks the brief to police."
   ]
  },
  {
   "h": "CARE",
   "pts": [
    "Audio, location and CCTV are sensitive data.",
    "False triggers can waste emergency resources.",
    "AI-drafted FIRs must be reviewed by a human."
   ]
  }
 ],
 "links": [
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
