export const GRAVITY = 0.5, JUMP_FORCE = -12.5, MOVE_SPEED = 4.5, FRICTION = 0.82, MAX_FALL = 13;
export const PLAYER_W = 30, PLAYER_H = 42, BLOCK_SIZE = 42, COIN_SIZE = 20, WORLD_WIDTH = 20000;
export const FINISH_X = 19600;

export const ZONES = [
  { name: "START", label: "PRESS START", x1: 0, x2: 1200, sky1: "#050510", sky2: "#0e1530", ground: "#0d2b0d", grass: "#1a8a2a", accent: "#00ffff", stars: true },
  { name: "EDUCATION", label: "THE ORIGIN", x1: 1200, x2: 3200, sky1: "#081525", sky2: "#122848", ground: "#0d250d", grass: "#1a7a1a", accent: "#39ff14", stars: true },
  { name: "MEMORIES I", label: "HUMBLE BEGINNINGS", x1: 3200, x2: 4400, sky1: "#10081a", sky2: "#201035", ground: "#150a20", grass: "#4a2a6a", accent: "#ff00ff", stars: true },
  { name: "SKILLS", label: "SKILL TREE", x1: 4400, x2: 6400, sky1: "#150828", sky2: "#2a1050", ground: "#1a0d2a", grass: "#6a2a8a", accent: "#bf00ff", stars: true },
  { name: "PROJECTS", label: "THE ARSENAL", x1: 6400, x2: 9600, sky1: "#1a0808", sky2: "#351515", ground: "#2a0d0d", grass: "#8a4a2a", accent: "#ff6600", stars: false },
  { name: "AGRICULTURE", label: "VERIFARM BIOME", x1: 9600, x2: 12000, sky1: "#ff7e5f", sky2: "#feb47b", ground: "#3a2a0d", grass: "#d4a017", accent: "#ffb703", stars: false },
  { name: "MEMORIES II", label: "THE GRIND", x1: 12000, x2: 13200, sky1: "#0a1a2a", sky2: "#152535", ground: "#0d1a25", grass: "#2a4a6a", accent: "#00bfff", stars: true },
  { name: "HACKATHONS", label: "HALL OF FAME", x1: 13200, x2: 15400, sky1: "#1a1508", sky2: "#352a10", ground: "#25200a", grass: "#8a7a10", accent: "#ffd700", stars: false },
  { name: "MEMORIES III", label: "VICTORY LAP", x1: 15400, x2: 16600, sky1: "#1a0a1a", sky2: "#351535", ground: "#2a0d2a", grass: "#8a2a8a", accent: "#ff1493", stars: true },
  { name: "CERTS", label: "LOOT DROPS", x1: 16600, x2: 18400, sky1: "#081a15", sky2: "#103530", ground: "#0a2520", grass: "#1a7a6a", accent: "#00ffa5", stars: true },
  { name: "CONTACT", label: "FINAL BOSS", x1: 18400, x2: 20000, sky1: "#08081a", sky2: "#151040", ground: "#100d25", grass: "#4a2a8a", accent: "#ff006e", stars: true },
];

export const VEHICLES = ["🚗", "✈️", "🚀", "🏎️", "🛸", "🚁", "🏍️", "🛩️"];

export const CLI_COMMANDS = [
  "$ git clone falcon0516/portfolio.git", "Cloning into 'portfolio'...", "$ npm install", "added 847 packages in 12s",
  "$ python train_model.py --epochs 100", "[INFO] Loading dataset... 50,000 samples", "[INFO] Epoch 1/100 — loss: 0.342 acc: 0.89",
  "$ docker build -t argus-core .", "Step 1/12 : FROM python:3.11-slim", "Successfully built a3f8b2c1d4e5",
  "$ kubectl apply -f deployment.yaml", "deployment.apps/argus created", "service/argus-api created",
  "$ groq inference --model llama3 --prompt '...'", "[200 OK] Latency: 187ms | Tokens: 342",
  "$ nats sub 'surveillance.>'", "Subscribing on surveillance.>", "[#1] Received on [surveillance.node.1]",
  "$ algorand goal clerk send --amount 1000", "Txn ID: 4R7X...committed in round 38291",
  "$ pytest tests/ -v --cov=src", "===== 47 passed, 0 failed in 3.21s =====",
  "$ next build", "✓ Compiled successfully", "○ / — Static — prerendered",
  "$ whisper transcribe --model medium", "[00:00.000 --> 00:03.500] Hello, namaste!",
  "$ yolo detect --source rtsp://cam1", "[INFO] Detected: person (0.94), car (0.87)",
  "$ fastapi dev main.py", "INFO: Uvicorn running on http://0.0.0.0:8000",
  "$ mongosh argus_db", "Enterprise> db.detections.countDocuments()", "→ 142,857",
];

// Content Types: "block" (hop-to-hit), "portal" (walk-in), "hover" (proximity), "photo" (polaroid)
export const BLOCK_CONTENT = {
  // Education
  edu1: { type: "block", badge: "🎓 EDUCATION", title: "B.E. Computer Science & Engineering", subtitle: "SJB Institute of Technology, Bengaluru (VTU)", desc: "Pursuing CS Engineering with focus on AI/ML, NLP, prompt engineering, and full-stack development. Graduating 2027.", narration: "From the hills of Coorg to the tech hub of Bengaluru — Eshan chose Computer Science to build systems that solve real problems. At SJBIT under VTU, he discovered his passion for Generative AI and never looked back.", image: "/preview.webp", hint: "🎓 EDUCATION", vehicle: "🚗", stats: [{ val: "9.28", label: "CGPA" }, { val: "2027", label: "GRAD YEAR" }, { val: "VTU", label: "UNIVERSITY" }], quiz: { q: "What year does Eshan graduate?", options: ["2027", "2025", "2029"], answer: "2027" } },
  edu2: { type: "block", badge: "⭐ ACADEMIC EXCELLENCE", title: "CGPA: 9.28", subtitle: "SJB Institute of Technology", desc: "Maintaining a stellar 9.28 CGPA while competing in 10+ hackathons and shipping production AI systems.", narration: "Most students pick one path — academics OR hackathons. Eshan chose both. A 9.28 CGPA alongside 10+ hackathon wins proves that consistency beats talent when talent doesn't work hard.", hint: "⭐ GPA SCORE", vehicle: "✈️", stats: [{ val: "9.28", label: "CGPA" }, { val: "10+", label: "HACKATHONS" }, { val: "8+", label: "PROJECTS" }], quiz: { q: "What was the CGPA?", options: ["9.28", "8.42", "7.95"], answer: "9.28" } },
  edu3: { type: "block", badge: "📚 PRE-UNIVERSITY", title: "Pre-University Course (PCMC)", subtitle: "Govt PU College, Madikeri", desc: "CGPA: 9.1 with Distinction. Physics, Chemistry, Math, Computer Science — the scientific foundation.", narration: "Madikeri, the Scotland of India. In this hill town, young Eshan scored 9.1 CGPA in PCMC. The quiet discipline built the work ethic that would later win hackathons.", hint: "📚 PU COLLEGE", vehicle: "🏍️", stats: [{ val: "9.1", label: "CGPA" }, { val: "PCMC", label: "STREAM" }, { val: "DISTINCTION", label: "GRADE" }], quiz: { q: "Which stream did Eshan study in PU college?", options: ["PCMC", "PCMB", "Commerce"], answer: "PCMC" } },
  research_presentation: { type: "block", badge: "🎤 RESEARCH & LEADERSHIP", title: "Inspiring the Next Generation", subtitle: "Research Presentation — SJBIT Induction", desc: "Showcased award-winning 3D-Printed Medical Aids and SkillM platform to students and faculty.", narration: "Standing on stage in front of incoming students and faculty. Showcased research on 3D-Printed Medical Aids and SkillM offline e-learning. A moment dedicated to mentor Roopa DR for quietly shaping the journey.", images: ["/preview-7.webp", "/preview-9.webp", "/preview-5-2.jpeg"], hint: "🎤 PRESENTATION", vehicle: "🚀", stats: [{ val: "BEST PAPER", label: "AWARD" }, { val: "63%", label: "IMPACT" }] },
  
  // Memories I
  mem1_1: { type: "photo", revealStyle: "scroll", image: "/WhatsApp Image 2026-07-30 at 19.51.43.webp", title: "The Early Days", desc: "Building the foundation. Every expert was once a beginner." },
  mem1_2: { type: "photo", revealStyle: "scroll", image: "/WhatsApp Image 2026-07-30 at 19.51.44.webp", title: "First Achievements", desc: "The taste of victory that started the hackathon streak." },

  // Projects
  saathi: { type: "portal", badge: "🥈 2ND PLACE", title: "SAATHI", subtitle: "Real-Time Multilingual Voice-AI Phone Assistant", desc: "Auto-answers calls via ADB in caller's language using Groq LLM. Whisper/Piper pipeline with <300ms latency.", narration: "Imagine a phone that understands every caller's language. SAATHI answers calls in English, Hindi, or Kannada using a local speech pipeline. The Groq LLM processes intent in under 300ms.", tech: ["Python", "Groq LLM", "mlx-whisper", "Piper TTS", "ADB"], image: "/generated/saathi-tree.png", hint: "📱 VOICE AI", vehicle: "🚀", link: "https://saathi-presentation.netlify.app", stats: [{ val: "<300ms", label: "LATENCY" }, { val: "3", label: "LANGUAGES" }, { val: "2", label: "WINS" }], codeSnippet: { template: "const res = await ___.chat.completions.___({", blanks: ["groq", "create"], bank: ["groq", "create", "fetch", "axios", "then"] } },
  axiom: { type: "portal", badge: "🥉 3RD — HACK.ALGO", title: "AXIOM", subtitle: "Agentic Payment Protocol on Algorand", desc: "On-chain safety layer using smart contracts to enforce spending limits and multi-sig approval for AI agent payments.", narration: "AI agents that spend money need guardrails. AXIOM builds them on Algorand — smart contracts enforce spending limits, multi-sig approvals, and flag anomalous behavior. 3rd at HACK.ALGO 2026.", tech: ["Python", "FastAPI", "Algorand", "TEAL", "Node.js"], image: "/generated/axiom-crystal.png", hint: "💎 BLOCKCHAIN", vehicle: "🛸", github: "https://github.com/Falcon0516/CleverFyre", stats: [{ val: "$100", label: "PRIZE" }, { val: "ALGORAND", label: "CHAIN" }, { val: "3RD", label: "PLACE" }], codeSnippet: { template: "const tx = ___.makePaymentTxnWithSuggestedParams(___)", blanks: ["algosdk", "params"], bank: ["algosdk", "params", "web3", "ethers", "sign"] } },
  argus: { type: "portal", badge: "🎯 CAPSTONE", revealStyle: "crystal", title: "PROJECT ARGUS", subtitle: "Decentralized Agentic AI Surveillance", desc: "Multi-node distributed surveillance with dynamic agent spawning for real-time YOLO detection and cross-camera tracking.", narration: "PROJECT ARGUS — distributed systems, real-time AI, and agentic architecture. Multiple nodes spawn AI agents dynamically to detect and track across cameras. React dashboard + FastAPI WebSocket + NATS messaging.", tech: ["Python", "FastAPI", "React", "NATS", "WebSocket", "YOLO"], image: "/generated/argus-eye.png", hint: "👁️ SURVEILLANCE", vehicle: "🚁", codeSnippet: { template: "await nc.___(subject, jc.___({ agent_id }))", blanks: ["publish", "encode"], bank: ["publish", "encode", "send", "stringify", "emit"] } },
  avangard: { type: "block", badge: "🛡️ SECURITY", title: "AVANGARD", subtitle: "AI-Driven Threat Intelligence Engine", desc: "Aggregates VirusTotal and Shodan data to automate CVE scanning and risk assessment.", narration: "Cybersecurity analysts spend hours checking threat databases. AVANGARD automates this by aggregating VirusTotal and Shodan intelligence into a single API.", tech: ["Python", "FastAPI", "Next.js", "MongoDB", "VirusTotal API"], image: "/generated/digital-solver.png", hint: "🛡️ THREAT INTEL", vehicle: "🏎️", github: "https://github.com/Falcon0516/Avangard_POWERED_TICE_FOR-_SECURITY" },
  kavach: { type: "block", badge: "🛡️ SAFETY", title: "KAVACH", subtitle: "AI-Agentic Women's Safety Platform", desc: "AI-powered safety platform with real-time threat detection and emergency response coordination.", narration: "Safety shouldn't be a privilege. KAVACH uses AI agents to detect threats in real-time and coordinate emergency responses.", tech: ["Python", "AI Agents", "Real-time"], hint: "🛡️ SAFETY AI", vehicle: "🚗" },
  prashasan: { type: "block", badge: "🏛️ INDIA INNOVATES", title: "PRASHASAN", subtitle: "Offline-First Multilingual AI for Rural Officials", desc: "Offline AI assistant using quantized local LLMs. Multilingual without internet dependency.", narration: "700 million Indians lack reliable internet. PRASHASAN brings AI to rural officials using quantized LLMs that run entirely offline.", tech: ["Python", "Local LLMs", "Quantization", "Multilingual"], hint: "🏛️ OFFLINE AI", vehicle: "✈️" },

  // Verifarm (Agriculture Biome)
  verifarm: { type: "portal", badge: "🥇 1ST — ₹50,000", revealStyle: "crystal", title: "VERIFARM", subtitle: "Blockchain & AI for Agricultural Supply Chain", desc: "Blockchain traceability for farm-to-fork. AI anomaly detection. Won 1st Place at ADVAYA 2.0 National.", narration: "Food fraud is a $40 billion problem. VERIFARM tackles it with blockchain traceability — every transaction recorded immutably. AI detects anomalies. 1st place and ₹50,000 at ADVAYA 2.0.", tech: ["Blockchain", "Python", "AI/ML", "REST APIs"], image: "/preview-14.webp", hint: "🌾 BLOCKCHAIN", vehicle: "🚀", github: "https://github.com/Falcon0516/VERIFARM_BLOCKCHAIN_AND_AI_FOR_SUPPLYCHAIN_MANAGEMENT_AGRICULTURE", stats: [{ val: "₹50K", label: "PRIZE" }, { val: "1ST", label: "PLACE" }, { val: "NATIONAL", label: "LEVEL" }], codeSnippet: { template: "function create_asset(___, ___) {", blanks: ["sender", "total"], bank: ["sender", "total", "amount", "owner", "asset"] } },

  // Memories II
  mem2_1: { type: "photo", revealStyle: "scroll", image: "/WhatsApp Image 2026-07-30 at 19.51.45 (1).webp", title: "Hackathon Nights", desc: "Coffee, code, and 3 AM debugging sessions." },
  mem2_2: { type: "photo", revealStyle: "scroll", image: "/WhatsApp Image 2026-07-30 at 19.51.46 (1).webp", title: "Team Strategy", desc: "Planning the architecture that led to victory." },

  // Hackathons
  hack_advaya: { type: "portal", badge: "🥇 1ST — ₹50,000", revealStyle: "crystal", title: "ADVAYA Hackathon 2.0", subtitle: "BGSCET National Level", desc: "Won 1st with VeriFarm. Competed against teams from across India. Team WARCRYPT.", narration: "24 hours. National competition. Team WARCRYPT stood on top. VeriFarm's blockchain traceability won the judges. Prize: ₹50,000.", image: "/preview-14.webp", hint: "🏆 1ST PLACE", vehicle: "🏎️", stats: [{ val: "₹50K", label: "PRIZE" }, { val: "24HR", label: "DURATION" }, { val: "NATIONAL", label: "LEVEL" }] },
  hack_beam: { type: "block", badge: "🥇 1ST PLACE", title: "Beam-Build-Battle", subtitle: "BNMIT / IEEE", desc: "Won 1st with IR Laser Tag embedded system. Team INTELNTAG.", narration: "Not just software — hardware too. Team INTELNTAG built an IR Laser Tag system from scratch.", image: "/preview-13.webp", hint: "🏆 1ST PLACE", vehicle: "🛩️" },
  hack_aisthetica: { type: "portal", badge: "🥈 2ND — ₹20,000", title: "AI-STHETICA AIVORA 2026", subtitle: "AIVORA 2026", desc: "2nd with SAATHI voice-AI. Sub-300ms latency impressed judges.", narration: "SAATHI impressed judges with blazing-fast multilingual voice pipeline. Under 300ms. Team CLEVERFYRE earned ₹20,000.", image: "/preview-11.webp", hint: "🥈 2ND PLACE", vehicle: "🚀", stats: [{ val: "₹20K", label: "PRIZE" }, { val: "<300ms", label: "LATENCY" }] },
  hack_impulse: { type: "block", badge: "🥈 2ND PLACE", title: "Innovathon IMPULSE 2026", subtitle: "SJBIT ECE", desc: "2nd with SAATHI health screening tool. Team RECKONERS.", narration: "SAATHI repositioned as health screening for feature phones. No smartphone needed. Team RECKONERS proved AI reaches the last mile.", image: "/preview-4.webp", hint: "🥈 2ND PLACE", vehicle: "🚗" },
  hack_algo: { type: "portal", badge: "🥉 3RD — $100", title: "HACK.ALGO 2026", subtitle: "GDG / AlgoBharat National", desc: "3rd with AXIOM on Algorand. Team CLEVERFYRE.", narration: "HACK.ALGO 2026 at REVA University. AXIOM's novel approach to AI agent payment safety earned 3rd and $100 USD.", image: "/preview-12.webp", hint: "🥉 3RD PLACE", vehicle: "🛸", stats: [{ val: "$100", label: "PRIZE" }, { val: "NATIONAL", label: "LEVEL" }] },
  hack_sentinel: { type: "block", badge: "🏆 TOP 5", title: "Sentinel Hack 5.0", subtitle: "KSIT — 90+ teams", desc: "Top 5 among 90+ teams in cybersecurity innovation.", narration: "90+ teams. Cybersecurity focus. Top 5 finish proved CleverFyre competes at the highest level.", image: "/preview-8.webp", hint: "🏆 TOP 5", vehicle: "🚁" },
  hack_innovatex: { type: "block", badge: "🥈 2ND PLACE", title: "InnovateX 2024", subtitle: "State Level — 70+ teams", desc: "2nd with Agronym Solutions autonomous agri-rover.", narration: "The first major victory. InnovateX 2024 — an autonomous agri-rover placed 2nd among 70+ teams. The hackathon warrior was born.", hint: "🥈 2ND PLACE", vehicle: "🏍️", image: "/WhatsApp Image 2026-07-30 at 19.51.45.webp" },

  // Memories III
  mem3_1: { type: "photo", revealStyle: "scroll", image: "/WhatsApp Image 2026-07-30 at 19.51.46 (2).webp", title: "The Stage", desc: "Presenting to the judges, the culmination of 24 hours of work." },
  mem3_2: { type: "photo", revealStyle: "scroll", image: "/WhatsApp Image 2026-07-30 at 19.51.46.webp", title: "AXIOM Hackathon", desc: "State Level Hackathon. Built AVANGARD, a cyber security threat intelligence system." },
  mem3_3: { type: "photo", revealStyle: "scroll", image: "/WhatsApp Image 2026-07-30 at 19.51.44 (1).webp", title: "The Winning Team", desc: "Together everyone achieves more." },

  // Certs
  cert_holo: { type: "portal", badge: "🏆 CERTIFICATIONS", title: "Certification Holocron", subtitle: "Access all unlocked tech certificates", desc: "A centralized repository of all verified skills, achievements, and certifications earned through rigorous coursework and hackathons.", narration: "Why list certificates when you can explore them in a 3D holocron? Step inside to view the proof of work.", image: "/preview-8.webp", hint: "🏆 ENTER HOLOCRON", vehicle: "🛸" },
  cert_ibm: { type: "hover", badge: "🤖 IBM", title: "AI Fundamentals", subtitle: "IBM Certification", desc: "Certified in AI Fundamentals by IBM.", narration: "IBM's AI Fundamentals — the entry into neural networks, NLP, and computer vision.", hint: "🤖 IBM CERT", vehicle: "🚗", image: "/preview-6.webp", matchIcons: ["🧠", "🤖", "📊", "👁️"] },
  cert_ethical: { type: "hover", badge: "🔐 NPTEL ELITE", title: "Ethical Hacking — 81%", subtitle: "IIT Kharagpur", desc: "Elite certification in Ethical Hacking from IIT KGP.", narration: "To build secure systems, think like an attacker. 81% in NPTEL's Ethical Hacking. Elite earned.", hint: "🔐 HACKING", vehicle: "🛸", stats: [{ val: "81%", label: "SCORE" }, { val: "ELITE", label: "GRADE" }], image: "/certs/Ethical_Hacking.webp", matchIcons: ["🔐", "🛡️", "💻", "🔍"] },
  cert_aihr: { type: "hover", badge: "🧠 NPTEL ELITE", title: "AI in HR — 83%", subtitle: "IIT Guwahati", desc: "Elite certification in AI for HR Management.", narration: "AI transforming HR. 83% exploring AI-driven recruitment, performance analysis, workforce optimization.", hint: "🧠 AI IN HR", vehicle: "✈️", stats: [{ val: "83%", label: "SCORE" }, { val: "ELITE", label: "GRADE" }], image: "/certs/AI_IN_HRM.webp", matchIcons: ["🧠", "👥", "📈", "🤖"] },
  cert_algo: { type: "hover", badge: "📐 NPTEL", title: "Design & Analysis of Algorithms", subtitle: "IIT Madras", desc: "Certified in DAA from IIT Madras.", narration: "The backbone of CS — algorithms. Sorting, searching, DP, graphs. NPTEL from IIT Madras.", hint: "📐 ALGORITHMS", vehicle: "🚗", image: "/certs/Design_and_analysis_of_algorithms.webp", matchIcons: ["📐", "🔢", "🌳", "⚡"] },
  cert_hackerrank: { type: "hover", badge: "💻 VERIFIED", title: "SQL, Problem Solving, Java, Python", subtitle: "HackerRank Certified", desc: "Multiple HackerRank certifications.", narration: "Verified skills across SQL, algorithmic problem solving, Java, and Python.", hint: "💻 HACKERRANK", vehicle: "🏎️", image: "/certs/problem_solving_basic_certificate.webp", matchIcons: ["💻", "🐍", "☕", "🗄️"] },
  cert_paper: { type: "hover", badge: "📄 BEST PAPER", title: "3D-Printed Medical Aids", subtitle: "ICRIET-2025", desc: "Best Paper Award for hemorrhage control research.", narration: "When engineering meets life-saving medicine. 3D-printed hemorrhage control devices won Best Paper at ICRIET-2025.", image: "/WhatsApp Image 2026-07-30 at 19.51.45 (2).webp", hint: "📄 RESEARCH", vehicle: "🚀", matchIcons: ["📄", "🖨️", "🏥", "🔬"] },
  cert_skillm: { type: "hover", badge: "📝 CO-AUTHORED", title: "SkillM — Gamified E-Learning", subtitle: "Submitted to ET&S", desc: "Co-authored research on gamified offline e-learning.", narration: "Gamification meets education. SkillM is an offline e-learning platform. Co-authored and submitted to ET&S journal.", hint: "📝 PUBLICATION", vehicle: "✈️", matchIcons: ["📝", "🎮", "📚", "🌐"] },

  // Contact
  contact_linkedin: { type: "block", badge: "💼", title: "LinkedIn", subtitle: "linkedin.com/in/eshan-h", desc: "Let's connect!", narration: "The professional gateway. Connect with Eshan on LinkedIn.", link: "https://linkedin.com/in/eshan-h", hint: "💼 LINKEDIN", vehicle: "🚗", image: "/preview.webp" },
  contact_github: { type: "block", badge: "⟨/⟩", title: "GitHub — Falcon0516", subtitle: "github.com/Falcon0516", desc: "Open-source repos.", narration: "Where the code lives. Explore repositories spanning AI agents to blockchain.", link: "https://github.com/Falcon0516", hint: "⟨/⟩ GITHUB", vehicle: "🚀" },
  contact_email: { type: "block", badge: "✉", title: "eshanh051116@gmail.com", subtitle: "Always open", desc: "Drop a line.", narration: "The inbox is always open for opportunities, collabs, or AI conversations.", link: "mailto:eshanh051116@gmail.com", hint: "✉ EMAIL", vehicle: "✈️" },
  contact_phone: { type: "block", badge: "📞", title: "+91 9380070210", subtitle: "Bengaluru, India", desc: "Available for calls.", narration: "Sometimes a conversation beats an email. Based in Bengaluru. Fluent in English, Kannada, Hindi, basic Japanese.", hint: "📞 PHONE", vehicle: "🏎️" },
};

export const ALL_KEYS = Object.keys(BLOCK_CONTENT);

// Which mini-game (if any) should precede a hop-block's card reveal.
// "block" type triggers only — portals/hovers/photos are untouched.
const CIRCUIT_KEYS = new Set(["avangard", "kavach", "prashasan"]);
const RHYTHM_KEYS = new Set(["hack_beam", "hack_impulse", "hack_sentinel", "hack_innovatex", "hack_aisthetica", "hack_advaya", "hack_algo"]);
const DECRYPT_KEYS = new Set(["argus", "saathi", "axiom", "verifarm"]);

export function getMinigameCategory(contentKey) {
  if (!contentKey) return null;
  if (contentKey.startsWith("edu") || contentKey === "research_presentation") return "quiz";
  if (CIRCUIT_KEYS.has(contentKey)) return "circuit";
  if (RHYTHM_KEYS.has(contentKey)) return "rhythm";
  if (DECRYPT_KEYS.has(contentKey)) return "decrypt";
  if (contentKey.startsWith("cert_")) {
    if (contentKey === "cert_holo") return "holocron";
    return "lattice";
  }
  return null; // contact blocks & everything else: instant open, no mini-game
}

export const GUIDE = [
  { x: 50, msg: "Hey! I'm ARGUS 🤖 Use ← → to move, SPACE to jump!" },
  { x: 400, msg: "Hit ? blocks from below! Click them anytime to re-read! 🔄" },
  { x: 1250, msg: "📚 EDUCATION zone! Hit those golden blocks!" },
  { x: 3300, msg: "📸 Memories Wall... The journey begins here." },
  { x: 4450, msg: "🎮 SKILL TREE! Higher platforms = advanced skills!" },
  { x: 6450, msg: "⚔️ PROJECTS! Enter the Portals for legendary projects!" },
  { x: 9650, msg: "🌾 Welcome to VERIFARM... The Agriculture Biome! 🚜" },
  { x: 12050, msg: "📸 Another memory wall... The hackathon grind." },
  { x: 13250, msg: "🏆 HALL OF FAME! 5 wins in 30 days!" },
  { x: 15450, msg: "📸 The Victory Lap! The final memory wall." },
  { x: 16650, msg: "📜 CERTIFICATIONS — Just walk near them to reveal!" },
  { x: 18450, msg: "🎯 Final zone! Contact links. Almost at the finish line!" },
  { x: 19550, msg: "🏁 Cross the finish line for the GRAND GALLERY! 🎉" },
];
