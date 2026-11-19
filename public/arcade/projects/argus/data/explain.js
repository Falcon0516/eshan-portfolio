window.EXPLAIN = {
 "theme": {
  "bg": "#0E1216",
  "ink": "#DDE8EE",
  "accent": "#35E0FF",
  "line": "#3A4B5A",
  "font": "\"Arial Narrow\",\"Helvetica Neue\",Arial,sans-serif"
 },
 "title": "ARGUS",
 "line": "A multi-camera AI surveillance platform that runs on an 8 GB MacBook.",
 "achievements": [
  {
   "k": "D",
   "t": "Indian Design Registration 515509-001",
   "s": "Accepted and published, Patent Office Journal 41/2026. Filed jointly with five co-applicants."
  },
  {
   "k": "FY",
   "t": "Final Year Project",
   "s": "SJB Institute of Technology"
  }
 ],
 "stack": [
  "Python",
  "FastAPI",
  "Next.js",
  "YOLOv8",
  "Groq vision models",
  "InsightFace",
  "SQLite",
  "WebSocket"
 ],
 "sections": [
  {
   "h": "THE PROBLEM",
   "pts": [
    "Security teams and law enforcement cannot watch dozens of camera feeds at once.",
    "Sending every frame to a cloud model is far too costly and slow."
   ]
  },
  {
   "h": "WHAT I BUILT",
   "pts": [
    "Operators search every camera by description, face photo or number plate instead of scrubbing footage.",
    "Up to six camera slots: phones, IP cameras, RTSP, USB and video files.",
    "A Next.js dashboard with live frames, events and system telemetry."
   ]
  },
  {
   "h": "HOW IT WORKS",
   "pts": [
    "A worker per camera keeps only the newest frame, downscaled to 640x360.",
    "One shared YOLOv8n watches every feed and counts people and vehicles.",
    "Four triggers wake the cloud: count change, scene change, 20 s heartbeat, active search.",
    "Stage 1: a vision-language model names up to three specialist detectors for the scene.",
    "Specialists load on demand: three in memory, least recently used leaves.",
    "Stage 2: the cropped detection is checked again by a second model call to cut false alarms.",
    "Events are de-duplicated within 10 s, saved with two evidence images, and stored in SQLite.",
    "Search by face (ArcFace), by clothing fingerprint when the face is hidden, or by plate OCR.",
    "A router spreads load across 20 API keys with cooldown and failover."
   ]
  },
  {
   "h": "RESULTS",
   "pts": [
    "971 cloud calls instead of 466,523 for per-frame streaming, 99.8% fewer [2-hour field run, 3 phone cameras]",
    "Peak backend memory 1,078 MB against about 5,650 MB for loading every model [same run]",
    "Stage 2 suppressed 2 of 4 specialist triggers as false alarms [same run]",
    "Edge detector: 19.9 ms per frame, about 50 FPS [M1, 8 GB]",
    "Cross-camera search followed one suspect through 31 transitions in 10 min 58 s [same run]"
   ]
  }
 ],
 "links": [
  {
   "label": "LIVE DEMO",
   "url": "argus-47.netlify.app"
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
