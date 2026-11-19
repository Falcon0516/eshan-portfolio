/* PersonaForge: ALL on-screen text, numbers, notes and tooltips live here.
   [[term]] or [[shown|key]] marks a hover tooltip (see TIPS). Every number has a src tag. */
window.PF = window.PF || {};
PF.FACTS = {
  author: 'Eshan H',
  url: 'persona--forge.vercel.app',
  /* Numbers from the Truth Sheet. src tags: audit = author code audit, report = author's own report. */
  N: {
    blocks:     { v: 144, src: 'code audit' },
    categories: { v: 15,  src: 'code audit' },
    templates:  { v: 12,  src: 'code audit' },
    sections:   { v: 11,  src: 'code audit' },
    keys:       { v: 10,  src: 'code audit' },
    tests:      { v: 79,  src: "author's report" },
    scoreMax:   { v: 100, src: 'code audit' }
  },
  badge: 'SIMULATION · illustrative',
  benchLabel: 'DEMO BLOCKS (the real library has 144)',
  layoutLabel: 'demo layout',

  /* Scenes: head max 4 words, cap max 12, take max 8 */
  scenes: [
    { id: 'wobbly', head: 'WOBBLY',    cap: 'Hand-written prompts contradict.', take: 'Nobody can trace why',
      note: 'Long prompts contradict themselves. Nobody can trace why. That is the problem I wanted to fix.' },
    { id: 'snap',   head: 'SNAP ON',   cap: 'Blocks, not paragraphs.',          take: 'Behaviour you can reuse',
      note: 'Instead of writing a prompt I assemble behaviour from reusable blocks. Each block changes his face and his reply.' },
    { id: 'belt',   head: 'THE BELT',  cap: 'Every line has a source.',         take: 'Deterministic [[compiler|compiler]]',
      note: 'Blocks ride the belt into the compiler. Every line of the final prompt traces back to a block. Same blocks, same prompt.' },
    { id: 'zap',    head: 'ZAP',       cap: 'Conflicts get a one-click fix.',   take: '[[Linter|linter]] for prompts',
      note: 'Formal plus slang cannot both be true. The linter catches it and proposes a patch. One click and it is fixed.' },
    { id: 'score',  head: 'SCORE',     cap: 'Nine checks, 100 points.',         take: 'Quality you can see',
      note: 'Quality is scored out of 100 on nine concrete checks. Add the missing block and the light turns on.' },
    { id: 'brain',  head: 'ONE BRAIN', cap: 'Web, voice, WhatsApp.',            take: 'Voice drops markdown',
      note: 'One persona, three channels. Web, voice and WhatsApp compile differently. Voice can be interrupted mid-sentence.' },
    { id: 'wheel',  head: 'KEY WHEEL', cap: 'Cooling keys are skipped.',        take: 'Rate-limit safety',
      note: 'A [[Redis|redis]]-backed pool rotates keys. It cools the rate-limited ones and skips them. This part is a simulation.' },
    { id: 'real',   head: 'REALITY',   cap: 'Database not wired yet.',          take: 'Analytics are sample data',
      note: 'Custom bots live in the browser for now. The database layer is the next step. Analytics are sample data.' }
  ],

  reality: {
    title: 'REALITY CHECK',
    real: ['Core engine: blocks, templates, compiler', 'Trace, conflicts and the scorer', 'Studio UI, key pool, streaming',
           'Voice agent and WhatsApp gateway code', '79 of 79 tests pass, per author'],
    partial: ['Custom bots live in [[localStorage|localstorage]] only', 'Database layer designed, not wired in',
              'WhatsApp uses a standalone farmer prompt', 'Bot switching there is cosmetic', 'Daily quota counts requests, not tokens'],
    not: ['Real analytics: page shows sample data', 'One model name across all files']
  },

  /* Tooltips: full form + plain meaning, max 14 words */
  TIPS: {
    'prompt':        ['Prompt', 'Instructions that tell an AI how to behave.'],
    'system prompt': ['System prompt', 'Hidden instructions that set a chatbot’s role and rules.'],
    'compiler':      ['Compiler', 'Turns blocks into one final prompt, identical every time.'],
    'trace map':     ['Trace map', 'Lookup from each prompt line back to its source block.'],
    'token':         ['Token', 'A chunk of text, about a short word, that models count.'],
    'token budget':  ['Token budget', 'Maximum prompt size. Lowest-priority lines get cut to fit.'],
    'conflict':      ['Conflict detection', 'Spots blocks that contradict each other.'],
    'linter':        ['Linter', 'A checker that flags problems before anything runs.'],
    'sse':           ['SSE', 'Server-Sent Events: the server streams text as it is written.'],
    'sentence':      ['Sentence detector', 'Spots each finished sentence so speech can start early.'],
    'bargein':       ['Barge-in', 'Interrupting the voice bot mid-sentence stops it at once.'],
    'stt':           ['STT', 'Speech-to-text: turns your voice into words.'],
    'tts':           ['TTS', 'Text-to-speech: turns words into a voice.'],
    'keypool':       ['Key pool', 'Several API keys used in turns to spread the load.'],
    'cooldown':      ['Cooldown', 'A rest period for a key after a rate-limit reply.'],
    'http429':       ['HTTP 429', 'Error code meaning too many requests, slow down.'],
    'fastack':       ['FastAck', 'Answer 200 OK instantly, then do the slow work in the background.'],
    'webhook':       ['Webhook', 'A URL another service calls when something happens.'],
    'twilio':        ['Twilio', 'Messaging service that connects the bot to WhatsApp.'],
    'redis':         ['Redis', 'A fast store that keeps counters and cooldown timers.'],
    'localstorage':  ['localStorage', 'Browser storage that stays on this device only.'],
    'tests':         ['Vitest / Pytest', 'Test runners for JavaScript and Python code.']
  },

  /* Short in-world labels (max 3 words) */
  L: {
    pegHint: '15 colours, 15 categories', hat: 'blocks', rail: 'SOURCES', receipt: 'COMPILED PROMPT',
    tube: 'PRINT TUBE', valve: 'HOLD TO PINCH', meterTitle: 'QUALITY', weights: 'weights: code audit',
    web: 'WEB', voice: 'VOICE', wa: 'WHATSAPP', fmtWeb: 'markdown ok', fmtVoice: 'plain speech', fmtWa: 'short, light',
    interrupt: 'INTERRUPT', speaking: 'speaking', stopped: 'stopped',
    wheel: 'KEY POOL', redis: 'redis state', cooling: 'COOLING', dead: 'DEAD 401', live: 'LIVE',
    traffic: 'TRAFFIC', lever: 'PULL', retry: 'retry-after',
    notes: 'sticky notes', formal: 'FORMAL', slang: 'SLANG', fix: 'FIX IT', clash: 'TONE CLASH'
  },

  SECTIONS: ['Identity', 'Role', 'Tone', 'Language policy', 'Knowledge', 'Guardrails', 'Refusals', 'Fallback', 'Format', 'Channel rules', 'Examples'],

  /* 15 categories (demo names), brick index 0..14 matches sprite order, section = where its lines land */
  CATS: [
    { k: 'identity',  n: 'Identity',  sec: 0,  col: '#C8283F' },
    { k: 'role',      n: 'Role',      sec: 1,  col: '#F28C28' },
    { k: 'tone',      n: 'Tone',      sec: 2,  col: '#F5C518' },
    { k: 'language',  n: 'Language',  sec: 3,  col: '#3FA23F' },
    { k: 'knowledge', n: 'Knowledge', sec: 4,  col: '#2F55C8' },
    { k: 'guardrail', n: 'Guardrail', sec: 5,  col: '#7A33B8' },
    { k: 'refusal',   n: 'Refusal',   sec: 6,  col: '#C21F8E' },
    { k: 'fallback',  n: 'Fallback',  sec: 7,  col: '#28C2C8' },
    { k: 'format',    n: 'Format',    sec: 8,  col: '#9ED52E' },
    { k: 'channel',   n: 'Channel',   sec: 9,  col: '#E8801E' },
    { k: 'example',   n: 'Example',   sec: 10, col: '#3AA8E8' },
    { k: 'length',    n: 'Length',    sec: 8,  col: '#A98BE0' },
    { k: 'empathy',   n: 'Empathy',   sec: 2,  col: '#EE3C9A' },
    { k: 'humour',    n: 'Humour',    sec: 2,  col: '#1FB8A0' },
    { k: 'domain',    n: 'Domain',    sec: 4,  col: '#F2D21C' }
  ],

  /* Scorer: weights from the Truth Sheet, sum 100 */
  CHECKS: [
    { k: 'role',   n: 'Role',        w: 15 }, { k: 'guard', n: 'Guardrails', w: 15 },
    { k: 'fb',     n: 'Fallback',    w: 10 }, { k: 'lang',  n: 'Language',   w: 10 },
    { k: 'domain', n: 'Domain',      w: 10 }, { k: 'len',   n: 'Length',     w: 10 },
    { k: 'refuse', n: 'Refusals',    w: 10 }, { k: 'halu',  n: 'No guessing', w: 10 },
    { k: 'contra', n: 'No clashes',  w: 10 }
  ],

  /* Demo blocks. mode: both|chat|voice. md = produces markdown. alt = lines used once patched. */
  BLOCKS: [
    { id: 'id_forge',  c: 0, n: 'Identity: Forge',        p: 10, l: ['You are Forge, a friendly robot helper.'] },
    { id: 'id_pal',    c: 0, n: 'Identity: Lab pal',      p: 9,  l: ['You are Lab Pal, a curious science helper.'] },
    { id: 'id_trail',  c: 0, n: 'Identity: Trail guide',  p: 9,  l: ['You are Trail, a calm travel guide.'] },
    { id: 'role_study',c: 1, n: 'Role: Study buddy',      p: 10, l: ['Help students learn step by step.'] },
    { id: 'role_farm', c: 1, n: 'Role: Farm helper',      p: 10, l: ['Help farmers with crop questions.'] },
    { id: 'role_shop', c: 1, n: 'Role: Shop support',     p: 10, l: ['Help customers with their orders.'] },
    { id: 'tone_play', c: 2, n: 'Tone: Playful',          p: 8,  l: ['Be warm and a little silly.'], style: 'play' },
    { id: 'tone_formal',c: 2, n: 'Tone: Formal',          p: 8,  l: ['Be formal and precise.', 'Avoid contractions.'], formality: 0.9, style: 'formal',
      alt: { l: ['Be polite and clear.'], formality: 0.4 } },
    { id: 'tone_slang',c: 2, n: 'Tone: Slang',            p: 7,  l: ['Use casual slang and short words.'], slang: true, style: 'slang' },
    { id: 'emp_high',  c: 12, n: 'Empathy: High',         p: 8,  l: ['Acknowledge feelings before advice.'], empathy: 0.9, style: 'empathy' },
    { id: 'emp_light', c: 12, n: 'Empathy: Light',        p: 6,  l: ['Stay kind and brief.'], empathy: 0.3 },
    { id: 'hum_sarc',  c: 13, n: 'Humour: Sarcasm',       p: 6,  l: ['Use dry sarcasm for jokes.'], sarcasm: true, style: 'sarcasm',
      alt: { l: ['Keep jokes gentle.'], sarcasm: false } },
    { id: 'hum_puns',  c: 13, n: 'Humour: Puns',          p: 5,  l: ['Add one pun when it fits.'] },
    { id: 'lang_user', c: 3, n: 'Language: Match user',   p: 8,  l: ['Reply in the user’s language.'] },
    { id: 'lang_en',   c: 3, n: 'Language: English only', p: 8,  l: ['Reply in English only.'] },
    { id: 'lang_mix',  c: 3, n: 'Language: Hinglish ok',  p: 7,  l: ['Mixing Hindi and English is fine.'] },
    { id: 'kn_faq',    c: 4, n: 'Knowledge: School FAQ',  p: 7,  l: ['Use the school FAQ as the source.'], faq: true },
    { id: 'kn_notes',  c: 4, n: 'Knowledge: Class notes', p: 6,  l: ['Use the class notes for facts.'], faq: true },
    { id: 'dom_school',c: 14, n: 'Domain: School',        p: 7,  l: ['Context: high school science.'] },
    { id: 'dom_farm',  c: 14, n: 'Domain: Farming',       p: 7,  l: ['Context: small farms.'] },
    { id: 'dom_shop',  c: 14, n: 'Domain: Retail',        p: 7,  l: ['Context: an online shop.'] },
    { id: 'g_ground',  c: 5, n: 'Guardrail: Grounded',    p: 9,  l: ['Answer only from the given facts.'], grounding: true, style: 'ground' },
    { id: 'g_nomed',   c: 5, n: 'Guardrail: No medical',  p: 9,  l: ['Never give medical advice.'] },
    { id: 'g_priv',    c: 5, n: 'Guardrail: Privacy',     p: 9,  l: ['Never share personal data.'] },
    { id: 'ref_harm',  c: 6, n: 'Refusal: Harmful asks',  p: 8,  l: ['Politely refuse harmful requests.'] },
    { id: 'ref_off',   c: 6, n: 'Refusal: Off topic',     p: 6,  l: ['Decline off topic asks kindly.'] },
    { id: 'fb_idk',    c: 7, n: 'Fallback: Say unsure',   p: 8,  l: ['If unsure, say you do not know.'], style: 'idk' },
    { id: 'fb_ask',    c: 7, n: 'Fallback: Ask back',     p: 6,  l: ['If unclear, ask one question.'] },
    { id: 'fmt_md',    c: 8, n: 'Format: Markdown',       p: 6,  l: [{ t: 'Use **bold** and - bullet lists.', md: 1 }], md: true },
    { id: 'fmt_plain', c: 8, n: 'Format: Plain text',     p: 6,  l: ['Use plain sentences only.'] },
    { id: 'fmt_steps', c: 8, n: 'Format: Numbered steps', p: 5,  l: [{ t: 'Use 1. 2. 3. step lists.', md: 1 }], md: true },
    { id: 'len_short', c: 11, n: 'Length: Short',         p: 7,  l: ['Keep replies short.'] },
    { id: 'len_long',  c: 11, n: 'Length: Detailed',      p: 5,  l: ['Give detailed answers.'] },
    { id: 'ch_chat',   c: 9, n: 'Channel: Chat style',    p: 5,  mode: 'chat',  l: ['Short paragraphs for chat.'] },
    { id: 'ch_speak',  c: 9, n: 'Channel: Spoken style',  p: 5,  mode: 'voice', l: ['Speak in short sentences.'] },
    { id: 'ex_hi',     c: 10, n: 'Example: Greeting',     p: 4,  l: ['Ex: hi -> Hi! Ready to learn?'] },
    { id: 'ex_unk',    c: 10, n: 'Example: Unknown',      p: 4,  l: ['Ex: ??? -> I am not sure, sorry.'] }
  ],
  /* Which block hangs on the pegboard for each of the 15 categories (Present Mode) */
  PEG: ['id_forge', 'role_study', 'tone_play', 'lang_user', 'kn_faq', 'g_ground', 'ref_harm', 'fb_idk', 'fmt_md', 'ch_chat', 'ex_hi', 'len_short', 'emp_high', 'hum_puns', 'dom_school'],

  CONFLICTS: {
    voicemd: { n: 'Voice + markdown', fix: 'Switch to plain text' },
    faq:     { n: 'Grounded, empty FAQ', fix: 'Add a FAQ block' },
    formal:  { n: 'Formal + slang', fix: 'Ease the formality' },
    sarc:    { n: 'Empathy + sarcasm', fix: 'Soften the jokes' }
  },

  /* Canned persona replies (SIMULATION, no model calls) */
  PROMPTS: [
    { k: 'hi',   q: 'Say hi' },
    { k: 'loop', q: 'What is a loop?' },
    { k: 'sad',  q: 'I failed my test' },
    { k: 'rain', q: 'Rain tomorrow?' }
  ],
  REPLY: {
    hi:   { role_study: 'Hi! What shall we learn today?', role_farm: 'Namaste! Which crop today?', role_shop: 'Hello! What is your order about?', d: 'Hi! How can I help?' },
    loop: { role_study: 'A loop repeats steps until a rule says stop.', role_farm: 'Like watering each row, again and again.', role_shop: 'It repeats a task. Like re-checking a parcel.', d: 'A loop repeats steps until told to stop.' },
    sad:  { role_study: 'Tests happen. Let us find what to fix.', role_farm: 'Bad seasons happen. Let us plan the next one.', role_shop: 'Sorry about that. Let me look at your order.', d: 'That is tough. Want to talk it through?' },
    rain: { guess: 'Sunny with a light breeze!', safe: 'I do not know that. I only use my notes.', safeNoIdk: 'I only have my notes, and they do not say.' }
  },
  STYLE: {
    play:   { pre: 'Ooh! ', suf: ' Let’s go!' },
    formal: { pre: 'Good day. ', suf: '' },
    slang:  { pre: 'Yo, ', suf: ' No cap.' },
    empathy:{ pre: 'I hear you. ', suf: '' },
    sarcasm:{ pre: '', suf: ' Obviously.' }
  },

  SAY: {
    wobbly: ['Good day, madam.', 'yo what is up fam', 'Be short! Be long!', 'Who said that?'],
    lang: 'Namaste! Hello! Namaskara!',
    hi: 'Hi!',
    patch: 'Fixed: ease the formality',
    perfect: 'Perfect score!',
    chatQ: 'Say hi',
    sentTo: 'sent'
  },
  UI: {
    arcade: '\u25c0 ARCADE', present: 'PRESENT', explore: 'EXPLORE',
    hint: '\u2190 \u2192 move \u00b7 P explore \u00b7 R reality \u00b7 T notes \u00b7 M sound \u00b7 F full',
    exploreNote: 'Free play. Everything here runs the same mini compiler. Try a clash, then fix it.',
    tabs: { build: 'BUILD', chan: 'CHANNEL', keys: 'KEYS' },
    budget: 'maxTokenBudget', dropped: 'dropped', none: 'nothing dropped', empty: 'Drop a block on Forge',
    chips: { web: 'WEB', voice: 'VOICE', wa: 'WHATSAPP' },
    reset: 'RESET', fix: 'FIX IT', tokens: 'tokens', score: 'SCORE', conflicts: 'CLASHES', worn: 'ON FORGE',
    keyhint: 'click a key: 429. double click: 401.', pull: 'Pull the lever'
  }
};
