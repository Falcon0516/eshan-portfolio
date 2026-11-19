/* VERIFARM facts. ALL on-screen text, numbers, notes and tooltips live here.
   Source tags: [code] = rule written in the project code. [placeholder] = invented demo value, NOT a real price.
   [sim] = illustrative simulation. Nothing here is a measured result. */
window.VF = {
  author: "Eshan H",
  win: "1st place, ADVAYA Hackathon 2.0",

  /* Rules from the Truth Sheet [code] */
  rules: {
    routeWarnKm: 50, routeHighKm: 100,
    trustStart: 5.0, trustMin: 0, trustMax: 10,
    trustDeltas: { delivery: 0.2, routeDeviation: -1.0, mspCompliance: 0.5, belowMsp: -2.0, yieldAnomaly: -1.5 },
    bandHigh: { ragi: true, rice: true, turmeric: true },      /* [MSP, avg x 1.10] */
    bandPerish: { tomato: true, mango: true },                  /* [avg x 0.85, avg x 1.15] */
    yields: { ragi: [82, 88], rice: [65, 70], turmeric: [20, 25], tomato: [35, 45], mango: [55, 65] },
    iso: { contamination: 0.05, score: -0.7, minSamples: 10 }
  },

  /* PLACEHOLDER prices, Rs per quintal. Not real government values. */
  crops: {
    ragi:     { en: "Ragi",     hi: "रागी",     kn: "ರಾಗಿ",     msp: 3000, avg: 3300, kind: "high" },
    rice:     { en: "Rice",     hi: "चावल",     kn: "ಅಕ್ಕಿ",     msp: 2200, avg: 2500, kind: "high" },
    turmeric: { en: "Turmeric", hi: "हल्दी",    kn: "ಅರಿಶಿನ",   msp: 8000, avg: 9000, kind: "high" },
    tomato:   { en: "Tomato",   hi: "टमाटर",    kn: "ಟೊಮೆಟೊ",   msp: 0,    avg: 1800, kind: "perish" },
    mango:    { en: "Mango",    hi: "आम",       kn: "ಮಾವು",     msp: 0,    avg: 4000, kind: "perish" }
  },
  placeholderTag: "placeholder price",

  ids: { farmer: "KA-TMK-20345", token: "RAGI-TK-2026-001", qty: "qty + season", season: "" },

  orgs: [
    { id: "gov",  color: "#2B3A67", en: "Government",  hi: "सरकार",       kn: "ಸರ್ಕಾರ",
      role: "Watches alerts. Sets the rules." },
    { id: "mandi", color: "#C65D3B", en: "Mandi",      hi: "मंडी",        kn: "ಮಂಡಿ",
      role: "Records the sale and the price." },
    { id: "fpo",  color: "#2E8B57", en: "FPO",         hi: "एफपीओ",      kn: "ಎಫ್‌ಪಿಒ",
      role: "Farmer cooperative. Speaks for farmers." },
    { id: "trans", color: "#F4A300", en: "Transporter", hi: "ट्रांसपोर्टर", kn: "ಸಾಗಣೆದಾರ",
      role: "Moves the load. Logs GPS." },
    { id: "proc", color: "#8C4A2F", en: "Processor",   hi: "प्रोसेसर",    kn: "ಸಂಸ್ಕರಣೆ",
      role: "Mills the grain. Yield is checked." },
    { id: "retail", color: "#FFC93C", en: "Retailer",  hi: "खुदरा",       kn: "ಚಿಲ್ಲರೆ",
      role: "Sells the packet to the consumer." }
  ],

  /* Scene copy deck: headline max 4 words, caption max 12, takeaway max 8 */
  scenes: [
    { id: "token",  head: "THE TOKEN",    cap: "A harvest becomes a token.",            take: "Identity stored as a hash",
      note: "I start at the farm. The harvest becomes a token and the farmer's Aadhaar is stored only as a hash. Nothing personal goes on the chain." },
    { id: "gate",   head: "MANDI GATE",   cap: "Below the support price is refused.",   take: "Rule in chaincode",
      note: "Drag the price down yourself. The chaincode refuses anything under the support price. The price numbers here are placeholders." },
    { id: "truck",  head: "THE TRUCK",    cap: "Over 50 km off is flagged.",            take: "Haversine route check",
      note: "The transporter records load and delivery GPS. More than 50 km off route is a deviation, more than 100 km is high." },
    { id: "mill",   head: "THE MILL",     cap: "Yield must be realistic.",              take: "Ragi 82 to 88%",
      note: "Each crop has a realistic yield range. Ragi is 82 to 88 percent. Outside that, the bell rings." },
    { id: "flags",  head: "SIX FLAGS",    cap: "Six organisations, one ledger.",        take: "Permissioned chain",
      note: "Six known organisations share one Hyperledger Fabric ledger. Every hand-off adds a block. The hashes here are computed locally." },
    { id: "fraud",  head: "FRAUD EYE",    cap: "Outliers isolate fast.",                take: "Illustrative model",
      note: "The real engine uses Isolation Forest plus rules. This picture is a toy to show the idea. It is not the real model." },
    { id: "scan",   head: "SCAN TO TRACE", cap: "Replay the journey.",                  take: "Demo runs on mock data",
      note: "A consumer scans a QR code and sees the journey. The mobile demo runs on mock data." },
    { id: "reality", head: "REALITY",     cap: "Chaincodes written, demo is mock.",     take: "Integration was next",
      note: "The architecture, chaincodes and data model are designed and written. The working demo was the mobile app with mock data. Full integration was the next step." }
  ],

  reality: {
    real:    ["Six Go chaincodes written", "Fabric network configuration", "Prisma data model, 13 tables", "AI engine detectors", "Notification design"],
    partial: ["No live Fabric boot log", "Mobile app runs on mock data", "Backend calls chaincode for registration only", "Some queues are stubs", "Two known bugs"],
  },
  realityTitles: { real: "REAL", partial: "PARTIAL" },
  plain: "The architecture, chaincodes and data model are written. The demo was the mobile app with mock data.",

  /* Tooltips: full form + plain meaning, max 14 words */
  terms: {
    "APMC": "Agricultural Produce Market Committee. The body that runs regulated mandis.",
    "mandi": "A regulated wholesale market where farmers sell produce.",
    "MSP": "Minimum Support Price. The lowest price a sale should reach.",
    "FPO": "Farmer Producer Organisation. A cooperative owned by farmers.",
    "Hyperledger Fabric": "A permissioned blockchain framework for known organisations.",
    "chaincode": "Fabric's name for smart contract code that enforces rules.",
    "Raft": "A protocol that lets ordering nodes agree on one leader.",
    "CouchDB": "A document database that stores the current ledger state.",
    "channel": "A private ledger shared only by chosen organisations.",
    "world state": "The latest value of every record on the ledger.",
    "Haversine": "A formula for distance between two GPS points on Earth.",
    "IsolationForest": "A model that finds outliers because they split off quickly.",
    "SHA-256": "A hash function. Any change to the input changes the output.",
    "QR code": "A square pattern a phone camera reads as a link or ID.",
    "oracle problem": "A chain cannot check that real world data entered was true."
  },

  /* UI strings with EN/HI/KN */
  ui: {
    arcade: { en: "ARCADE", hi: "आर्केड", kn: "ಆರ್ಕೇಡ್" },
    present: { en: "PRESENT", hi: "प्रस्तुति", kn: "ಪ್ರಸ್ತುತಿ" },
    explore: { en: "EXPLORE", hi: "खोजें", kn: "ಅನ್ವೇಷಿಸಿ" },
    price: { en: "Price", hi: "कीमत", kn: "ಬೆಲೆ" },
    crop: { en: "Crop", hi: "फसल", kn: "ಬೆಳೆ" },
    route: { en: "Route", hi: "मार्ग", kn: "ಮಾರ್ಗ" },
    yield: { en: "Yield", hi: "उपज", kn: "ಇಳುವರಿ" },
    trust: { en: "Trust", hi: "भरोसा", kn: "ನಂಬಿಕೆ" },
    run: { en: "Send the bag", hi: "बोरी भेजें", kn: "ಚೀಲ ಕಳುಹಿಸಿ" },
    blocked: { en: "BLOCKED", hi: "रोका गया", kn: "ತಡೆಯಲಾಗಿದೆ" },
    flagged: { en: "FLAGGED", hi: "चिह्नित", kn: "ಗುರುತಿಸಲಾಗಿದೆ" },
    belowMsp: { en: "BELOW MSP", hi: "MSP से कम", kn: "MSP ಗಿಂತ ಕಡಿಮೆ" },
    approved: { en: "CLEAR", hi: "ठीक", kn: "ಸರಿ" },
    normal: { en: "Normal", hi: "सामान्य", kn: "ಸಾಮಾನ್ಯ" },
    off60: { en: "60 km off", hi: "60 किमी दूर", kn: "60 ಕಿಮೀ ದೂರ" },
    off120: { en: "120 km off", hi: "120 किमी दूर", kn: "120 ಕಿಮೀ ದೂರ" },
    tamper: { en: "Click a block to tamper", hi: "ब्लॉक पर क्लिक करें", kn: "ಬ್ಲಾಕ್ ಒತ್ತಿ" },
    sim: "SIMULATION · illustrative",
    localSim: "local simulation",
    placeholder: "placeholder prices",
    stations: {
      farm:  { en: "FARM",   hi: "खेत",   kn: "ಹೊಲ" },
      mandi: { en: "MANDI",  hi: "मंडी",  kn: "ಮಂಡಿ" },
      truck: { en: "TRUCK",  hi: "ट्रक",  kn: "ಲಾರಿ" },
      mill:  { en: "MILL",   hi: "मिल",   kn: "ಗಿರಣಿ" },
      shop:  { en: "SHOP",   hi: "दुकान", kn: "ಅಂಗಡಿ" }
    },
    raja: ["Namaste!", "Watch the stamp.", "Good load.", "Check the yield.", "Six flags, one book.", "Outlier spotted.", "Scan it.", "Honest board."]
  },

  /* Notification fallback order [code] */
  notify: ["Voice", "WhatsApp", "SMS"],

  /* Explore mode strings */
  ex: {
    tabs: [
      { en: "Town journey", hi: "शहर यात्रा", kn: "ಪಟ್ಟಣ ಪ್ರಯಾಣ" }, { en: "MSP gate", hi: "MSP द्वार", kn: "MSP ಗೇಟ್" },
      { en: "Haversine route", hi: "हेवरसाइन मार्ग", kn: "ಹ್ಯಾವರ್ಸೈನ್ ಮಾರ್ಗ" }, { en: "Trust score", hi: "भरोसा अंक", kn: "ನಂಬಿಕೆ ಅಂಕ" },
      { en: "Isolation toy", hi: "आइसोलेशन खिलौना", kn: "ಐಸೋಲೇಶನ್ ಆಟ" }, { en: "Notify fallback", hi: "सूचना क्रम", kn: "ಸೂಚನೆ ಕ್ರಮ" },
      { en: "Six organisations", hi: "छह संगठन", kn: "ಆರು ಸಂಸ್ಥೆಗಳು" }
    ],
    events: {
      delivery: { en: "Delivery", hi: "डिलीवरी", kn: "ವಿತರಣೆ" }, routeDeviation: { en: "Route deviation", hi: "मार्ग विचलन", kn: "ಮಾರ್ಗ ವಿಚಲನ" },
      mspCompliance: { en: "MSP compliance", hi: "MSP पालन", kn: "MSP ಪಾಲನೆ" }, belowMsp: { en: "Below MSP", hi: "MSP से कम", kn: "MSP ಗಿಂತ ಕಡಿಮೆ" },
      yieldAnomaly: { en: "Yield anomaly", hi: "उपज विसंगति", kn: "ಇಳುವರಿ ವ್ಯತ್ಯಾಸ" }
    },
    notifyMsg: { en: "Price below MSP", hi: "कीमत MSP से कम", kn: "ಬೆಲೆ MSP ಗಿಂತ ಕಡಿಮೆ" },
    allFailed: { en: "All channels failed", hi: "सभी माध्यम विफल", kn: "ಎಲ್ಲಾ ಮಾರ್ಗ ವಿಫಲ" },
    via: { en: "Sent by", hi: "भेजा गया", kn: "ಕಳುಹಿಸಲಾಗಿದೆ" },
    reset: { en: "Reset", hi: "रीसेट", kn: "ರೀಸೆಟ್" }, addOut: { en: "Add outlier", hi: "बाहरी बिंदु", kn: "ಹೊರಗಿನ ಬಿಂದು" },
    stopped: { en: "Stopped at", hi: "रुका", kn: "ನಿಂತಿತು" }, clean: { en: "Clean journey", hi: "साफ यात्रा", kn: "ಸ್ವಚ್ಛ ಪ್ರಯಾಣ" },
    mspMin: { en: "MSP (placeholder)", hi: "MSP (नमूना)", kn: "MSP (ಮಾದರಿ)" }, avg: { en: "Mandi average (placeholder)", hi: "मंडी औसत (नमूना)", kn: "ಮಂಡಿ ಸರಾಸರಿ (ಮಾದರಿ)" },
    pickFlag: { en: "Click a flag", hi: "झंडे पर क्लिक करें", kn: "ಧ್ವಜ ಒತ್ತಿ" }
  },

  keysHint: "← → move · P explore · R reality · T notes · M sound · F full",
  hubLink: "../../index.html?from=verifarm"
};
