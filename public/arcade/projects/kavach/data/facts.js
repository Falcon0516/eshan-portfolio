/* ALL on-screen text, numbers, notes and tooltips live here. Edit freely.
   Source of every fact: the KAVACH Truth Sheet (code audit). Durations are RELATIVE and ILLUSTRATIVE. */
window.FACTS = {
  meta: { title: 'KAVACH', alt: 'N.I.D.A.R', author: 'Eshan H', event: 'Sentinel Hack 6.0, KSIT Bengaluru, April 2026' },

  ui: {
    arcade: '\u25C0 ARCADE', sim: 'SIMULATION \u00B7 illustrative', illustrative: 'ILLUSTRATIVE',
    hint: ['\u2190 \u2192 move', 'P explore', 'R reality', 'T notes', 'M sound', 'F full'],
    explore: 'Explore', present: 'Present', tabs: ['Emergency', 'Trigger lab', 'Keypad', 'Agents', 'Haversine', 'Failover'],
    runPar: 'Run in parallel', runSeq: 'Run one by one', standby: 'STANDBY', done: 'DONE',
    audit: 'audit', auditTip: 'Config value from the code audit of this project.',
    illusNote: 'illustrative, not measured'
  },

  scenes: [
    { head: 'QUIET NIGHT', cap: 'Help should take one tap.', tk: 'Cannot open five apps',
      note: 'In an emergency you cannot open five apps. I wanted help to take one tap. So everything starts from a single trigger.' },
    { head: 'FIVE WAYS', cap: 'Plus a basic keypad phone.', tk: 'A call or SMS works',
      note: 'Anyone can trigger it, even with a basic phone. A call or SMS starts the same pipeline. Hover each panel to try a way.' },
    { head: 'POW', cap: 'Six agents start together.', tk: 'Fan-out in parallel',
      note: 'Six agents run in parallel, so the total time is the slowest, not the sum. Everything animated here is a simulation. The tap starts all six at once.' },
    { head: 'SLOWEST WINS', cap: 'Parallel beats one by one.', tk: 'Illustrative, not measured',
      note: 'Parallel fan-out is the reason I used LangGraph. These bars are relative lengths, not measured seconds. The slowest agent sets the finish line.' },
    { head: 'COMMAND', cap: 'Watch the agents think.', tk: 'Live reasoning stream',
      note: 'The dashboard shows each agent\u2019s reasoning live. Places and distances here are placeholders. Distances use the Haversine formula.' },
    { head: 'NO SMARTPHONE', cap: 'A missed call starts it.', tk: 'Call bridge polls every 2 s',
      note: 'A missed call or SMS can start the same pipeline. The call bridge polls the queue every 2 seconds. It speaks the brief through a virtual audio cable.' },
    { head: 'BACK PAGE', cap: 'A human reviews every FIR.', tk: 'Ethics and care',
      note: 'The headline speed numbers in my pitch were not measured. Here is what is real and what is partial. Measuring latency is the next job.' }
  ],

  /* five phone triggers + keypad path (Scene 2, Explore S2) */
  triggers: [
    { id: 'sos', label: 'SOS', sub: 'Press' },
    { id: 'voice', label: 'Say kavach', sub: 'Voice' },
    { id: 'shake', label: 'Shake', sub: 'Phone' },
    { id: 'vol', label: 'Volume x3', sub: 'Triple press' },
    { id: 'walk', label: 'SafeWalk', sub: 'Overdue timer' },
    { id: 'keypad', label: 'Keypad phone', sub: 'Call or SMS' }
  ],
  pwaTag: 'Guardian PWA',
  fallback: { secs: 3, label: 'No answer in 3 s: SMS link', src: 'audit' },

  /* six agents: names are the real agent ids */
  agents: [
    { id: 'threat', color: '#FF2E93', chips: ['Groq 70B'],
      does: 'Scores severity with a 70B Groq model.', uses: 'Groq', watch: 'Level is model output, not measured accuracy.' },
    { id: 'family_alert', color: '#3FE0FF', chips: ['WhatsApp', 'Twilio'],
      does: 'Sends WhatsApp alerts through Twilio.', uses: 'Twilio, Cerebras for text', watch: 'Needs the messaging service to answer.' },
    { id: 'fir', color: '#FFC700', chips: ['FIR', 'IPC'],
      does: 'Drafts a police First Information Report with IPC sections.', uses: 'OpenRouter', watch: 'AI drafts must be reviewed by humans.' },
    { id: 'navigation', color: '#FFF4E0', chips: ['Haversine'],
      does: 'Finds nearest police stations, hospitals and safe houses.', uses: 'Haversine over static JSON', watch: 'Static JSON points can be out of date.' },
    { id: 'argus', color: '#8C7BFF', chips: ['YOLOv8n', 'Haar cascade', 'OCR'],
      does: 'Reads IP-camera streams: people, faces, plates.', uses: 'YOLOv8n, Haar cascade, EasyOCR', watch: 'Adapted from the ARGUS project.' },
    { id: 'ncrb', color: '#FF2E93', chips: ['NCRB data'],
      does: 'Adds crime-hotspot context from crime data.', uses: 'NCRB crime data', watch: 'Context only. It does not decide anything.' }
  ],
  /* RELATIVE, ILLUSTRATIVE bar lengths (no seconds anywhere) */
  dur: [0.45, 0.6, 1.0, 0.5, 0.85, 0.35],

  panelText: {
    family: ['Help needed.', 'Live location attached.', 'Sent.'],
    fir: { head: 'FIR', mark: '[DRAFT]', ipc: 'IPC: [to review]', stamp: 'HUMAN REVIEW' },
    argus: { person: 'person', face: 'face', plate: 'plate' },
    ncrb: { low: 'low', high: 'high' },
    threat: ['LOW', 'MEDIUM', 'HIGH']
  },

  /* placeholder places, made-up names and coordinates */
  map: { lat0: 12.000, lon0: 77.000, dLat: 0.025, dLon: 0.060, user: { lat: 12.0112, lon: 77.0185 } },
  places: {
    police: [['Marigold Post', 12.0140, 77.0236], ['Neem Road Post', 12.0049, 77.0120], ['Jasmine Post', 12.0182, 77.0410], ['Banyan Post', 12.0033, 77.0490]],
    hospital: [['Lotus Clinic', 12.0087, 77.0272], ['Peepal Hospital', 12.0201, 77.0098], ['Saffron Hospital', 12.0061, 77.0382], ['Kite Hospital', 12.0165, 77.0510]],
    safe: [['Tulsi House', 12.0129, 77.0151], ['Mango House', 12.0071, 77.0222], ['Kadamba House', 12.0206, 77.0305], ['Champa House', 12.0028, 77.0430]]
  },
  placeKinds: { police: 'Police', hospital: 'Hospital', safe: 'Safe house' },

  thoughts: [
    'supervisor: fan out to six agents',
    'threat: scoring severity',
    'navigation: nearest police found',
    'navigation: nearest hospital found',
    'navigation: nearest safe house found',
    'family_alert: message queued',
    'fir: draft ready, needs review'
  ],
  commandChips: ['WebSocket', 'Tailscale VPN', 'Firebase sync'],

  keypad: {
    labels: { missed: 'Missed call', queue: 'Call queue', bridge: 'Poll every 2 s', voice: 'Robot voice', link: 'Phone Link' },
    brief: 'Brief: help needed, location attached.',
    pollSecs: 2, pollSrc: 'audit',
    incoming: ['Caller ID: OCR', 'Record 20 s', 'STT: Sarvam AI'],
    route: 'POST /api/sms_trigger', twilioNote: 'Twilio number'
  },

  providers: ['Groq key 1', 'Groq key 2', 'Groq key 3', 'Groq key 4', 'Cerebras', 'OpenRouter'],

  reality: {
    title: 'REALITY CHECK',
    real: ['Guardian PWA triggers', 'LangGraph pipeline, six parallel agents', 'Command Center dashboard', 'Call bridge, as a prototype', 'WebSocket thoughts stream'],
    partial: ['Police, hospital, safe-house points: static JSON', 'Call bridge uses fragile Windows GUI automation', 'Five API routes defined twice, later ones dead', 'Some field names differ: WebSocket versus UI', '/api/audio_chunk is synthetic'],
    ethics: ['Audio, location and CCTV are highly sensitive.', 'False triggers can waste emergency resources.', 'Humans must review AI-drafted FIRs.'],
    stamp: 'AI DRAFTS. HUMANS DECIDE.',
    cols: ['REAL', 'PARTIAL']
  },

  terms: {
    'LangGraph': 'A framework that runs AI steps as a graph, with branches in parallel.',
    'agent': 'A small AI program with one job, working on its own.',
    'supervisor': 'The controller that hands work to the agents and collects results.',
    'fan-out': 'One trigger starts many tasks at the same moment.',
    'PWA': 'Progressive Web App: a website that installs and runs like an app.',
    'SOS': 'The big help button. One press starts the emergency flow.',
    'SafeWalk': 'A timer you start for a walk. If it runs out, help starts.',
    'FIR': 'First Information Report: the police record that begins a criminal case.',
    'IPC': 'Indian Penal Code: the law list that FIR drafts cite.',
    'NCRB': 'National Crime Records Bureau: India\u2019s national crime statistics agency.',
    'Haversine': 'A formula for distance between two points on a sphere like Earth.',
    'YOLOv8n': 'A small, fast model that spots objects like people in video.',
    'Haar cascade': 'A classic, light method for finding faces in an image.',
    'OCR': 'Optical Character Recognition: reading text from pictures, like number plates.',
    'WebSocket': 'A live two-way connection between browser and server.',
    'MJPEG': 'A camera video stream sent as a series of JPEG pictures.',
    'Twilio': 'A service that sends calls, SMS and WhatsApp messages by code.',
    'Tailscale': 'A private VPN that links phones, laptops and cameras securely.',
    'VPN': 'Virtual Private Network: a private, encrypted link across the internet.',
    'Firebase': 'A Google cloud service for syncing app data in real time.',
    'Phone Link': 'A Windows app that connects to your phone for calls and texts.',
    'audit': 'Config value from the code audit of this project.',
    'STT': 'Speech-to-text: turning spoken audio into written words.'
  },

  haversine: { title: 'Haversine', formula: ['a = sin\u00B2(\u0394\u03C6/2) + cos \u03C61 \u00B7 cos \u03C62 \u00B7 sin\u00B2(\u0394\u03BB/2)', 'd = 2R \u00B7 asin(\u221Aa)'], note: 'Distance over a curved Earth.', R: 6371 }
};
