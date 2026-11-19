/* All hub text lives here. Source: 04_PROJECT_PROMPT.md Truth Sheet (hub-level). */
window.A = window.A || {};
A.DATA = {
  owner: 'ESHAN H',
  boot: { os: 'ESHAN H OS v2027', logo: 'PROJECT ARCADE', start: 'PRESS START', hud: 'PLAYER ESHAN H', level: 'LEVEL SELECT', projects: 'PROJECTS 9', toast: 'WELCOME BACK. PICK ANOTHER LEVEL.' },
  about: 'B.E. Computer Science, SJBIT Bengaluru (VTU), batch of 2027. Team CleverFyre.',
  portfolio: { url: 'https://eshan-portfolio.streyeke.cloud', label: 'PORTFOLIO', note: 'NEEDS INTERNET' },
  /* Order is also the guided tour order. c = [main, second, dark] */
  cards: [
    { slug: 'saathi', title: 'SAATHI', tag: 'A voice AI that answers real phone calls', stat: '3 languages: English, Hindi, Kannada', c: ['#FFB000', '#19C3B1', '#1B120B'] },
    { slug: 'argus', title: 'ARGUS', tag: 'Cameras that only call the cloud when they must', stat: '99.8% fewer cloud calls', c: ['#35E0FF', '#FFB020', '#0A0F14'] },
    { slug: 'soil-and-toil', title: 'SOIL & TOIL', tag: 'A soil lab in your pocket', stat: 'NPK, pH and soil type from one photo', c: ['#5DBB63', '#7A5230', '#FFD9A0'] },
    { slug: 'axiom', title: 'AXIOM', tag: 'A bouncer for AI agents that spend money', stat: '6 contracts on Algorand Testnet', c: ['#2CFFB8', '#8B5CFF', '#FFC857'] },
    { slug: 'personaforge', title: 'PERSONAFORGE', tag: 'Build an AI personality from blocks', stat: '144 blocks, 12 templates', c: ['#FF6B9A', '#FFD166', '#6BCBFF'] },
    { slug: 'kavach', title: 'KAVACH', tag: 'One trigger, six AI agents, in parallel', stat: '6 agents at once', c: ['#FF2E93', '#FFC700', '#1B1464'] },
    { slug: 'pro-rover', title: 'PRO-ROVER', tag: 'A cheap rover that stops before it hits', stat: 'Emergency stop under 15 cm', c: ['#C1440E', '#F2C894', '#1A0F0A'] },
    { slug: 'usb-tcp-bridge', title: 'USB-TCP BRIDGE', tag: 'A phone that turns wires into Wi-Fi', stat: '4 TCP ports', c: ['#FFD54A', '#BEE3FF', '#0B3A6B'] },
    { slug: 'verifarm', title: 'VERIFARM', tag: 'From farm to fork, on a blockchain', stat: '1st place, ADVAYA 2.0', c: ['#F4A300', '#2E8B57', '#C65D3B'] }
  ],
  /* Exact award wording from the Truth Sheet. rank is a display chip only. */
  awards: [
    { rank: '1ST', text: '1st place, ADVAYA Hackathon 2.0 (BGSCET, national) with VeriFarm' },
    { rank: '1ST', text: '1st place, Beam Build Battle (embedded project)' },
    { rank: '3RD', text: '3rd place, HACK.ALGO 2026 (national) with AXIOM' },
    { rank: '2ND', text: '2nd place, AI-STHETICA AIVORA 2026 and Innovathon IMPULSE 2026 (SJBIT) with SAATHI' },
    { rank: '2ND', text: '2nd place, InnovateX (70+ teams) with the Agronym rover' },
    { rank: 'TOP5', text: 'Top 5, Sentinel Hack 5.0 (90+ teams)' },
    { rank: 'PAPER', text: 'Best Paper Award, ICRIET-2025' },
    { rank: 'DESIGN', text: 'Indian Design Registration, Application No. 515509-001, "Law Enforcement Monitoring Digital Device", filed for ARGUS, accepted and published in Patent Office Journal 41/2026' }
  ],
  reg: { head: 'DESIGN REGISTRATION', body: 'Indian Design Registration, Application No. 515509-001, "Law Enforcement Monitoring Digital Device", filed for ARGUS, accepted and published in Patent Office Journal 41/2026' },
  hof: { head: 'HALL OF FAME' },
  ui: { coming: 'THIS LEVEL IS STILL LOADING', hint: 'ARROWS WALK  SHIFT RUN  ENTER OPEN  L LIST  P TOUR', tourHint: 'SPACE NEXT  ENTER DIVE  ESC EXIT' },
  /* Tooltips: full form + plain meaning, max 14 words. */
  terms: {
    'NPK': 'Nitrogen, phosphorus, potassium: the three main plant nutrients in soil.',
    'pH': 'A scale from acidic to alkaline that measures soil chemistry.',
    'TCP': 'Transmission Control Protocol: the reliable way devices send data over networks.',
    'USB': 'Universal Serial Bus: the standard wired plug for phones and devices.',
    'AI': 'Artificial intelligence: software that learns patterns to answer or decide.',
    'Algorand Testnet': 'A practice blockchain where apps run without real money.',
    'VTU': 'Visvesvaraya Technological University, the university SJBIT is affiliated to.',
    'SJBIT': 'SJB Institute of Technology, Bengaluru.'
  }
};
