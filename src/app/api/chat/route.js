import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { ZONES } from '@/data/gameContent';
import PROJECT_CONTEXT from '@/data/project-context.json';
import ARGUS_PROMPT_DATA from '@/data/argus-prompt.json';

export const dynamic = 'force-dynamic';

const MAX_MESSAGE_LEN = 500;
const MAX_HISTORY_MESSAGES = 16; // 8 user/assistant turns
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQUESTS = 15;
const REQUEST_TIMEOUT_MS = 12_000;

const rateStore = new Map();

function getClientIp(req) {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip')?.trim() || 'local';
}

function checkRateLimit(ip) {
  const now = Date.now();
  const cutoff = now - RATE_WINDOW_MS;

  if (rateStore.size > 2000) {
    for (const [k, hits] of rateStore.entries()) {
      const fresh = hits.filter((t) => t > cutoff);
      if (fresh.length === 0) rateStore.delete(k);
      else rateStore.set(k, fresh);
    }
  }

  const recent = (rateStore.get(ip) || []).filter((t) => t > cutoff);
  if (recent.length >= RATE_MAX_REQUESTS) {
    const oldest = recent[0];
    const retryAfter = Math.max(1, Math.ceil((oldest + RATE_WINDOW_MS - now) / 1000));
    rateStore.set(ip, recent);
    return { allowed: false, retryAfter };
  }

  recent.push(now);
  rateStore.set(ip, recent);
  return { allowed: true, retryAfter: 0 };
}

const GAME_WORLD_NOTE = `
## PLAYABLE GAME CONTEXT
Eshan's portfolio root (/) is a 2D side-scrolling platformer built with Next.js, React, and Three.js with ${ZONES.length} zones: ${ZONES.map((z) => z.name).join(', ')}. Players walk with arrow keys or A/D, jump with Space/W/Up, hit ? blocks from below, enter portals (including Project Arcade at /arcade/), complete mini-games (quiz, circuit splice, rhythm tap, memory lattice, terminal breach), and can preview or download the resume from the top bar.
`.trim();

const ALLOWED_SLUGS = new Set(Object.keys(PROJECT_CONTEXT));
const ALLOWED_SECTIONS = new Set(['#top', '#about', '#skills', '#work', '#awards', '#research', '#certs', '#gallery', '#contact']);
const ALLOWED_MODALS = new Set(['resume', 'explain']);
const ALLOWED_EXT_EXACT = new Set([
  'https://github.com/Falcon0516',
  'https://www.linkedin.com/in/eshan-h',
  'https://linkedin.com/in/eshan-h',
  'https://argus-47.netlify.app',
  'https://saathi-presentation.netlify.app',
  'https://persona--forge.vercel.app',
  'https://vigyantra.vercel.app',
  'https://verifarm-2026.web.app',
  'https://play.google.com/store/apps/details?id=com.verifarm.app',
  'https://www.ijcrt.org/papers/IJCRTBE02004.pdf',
  'mailto:eshanh051116@gmail.com',
]);

function isAllowedAction(type, target, allowExplain = false) {
  const t = String(type || '').trim().toUpperCase();
  const v = String(target || '').trim();
  if (t === 'SECTION') return ALLOWED_SECTIONS.has(v);
  if (t === 'MODAL') return v === 'resume' || (allowExplain && v === 'explain');
  if (t === 'ARCADE') {
    if (v === '/' || v === '/Eshan_Portfolio/index.html' || v === '/arcade/index.html') return true;
    const m = /^\/arcade\/projects\/([a-z0-9-]+)\/index\.html$/.exec(v);
    return !!(m && ALLOWED_SLUGS.has(m[1]));
  }
  if (t === 'EXT') {
    if (ALLOWED_EXT_EXACT.has(v)) return true;
    return v.startsWith('https://github.com/Falcon0516/');
  }
  return false;
}

function buildFormattingGuide(allowExplain) {
  const modalLine = allowExplain
    ? '  - Modals: [[ACTION:MODAL|View Resume|resume]] or [[ACTION:MODAL|Open Explain Card|explain]]'
    : '  - Modals: [[ACTION:MODAL|View Resume|resume]]';
  return `RESPONSE FORMATTING & NAVIGATION ACTIONS:
- Format answers clearly for quick scanning: use concise bullet lists ("- **Label:** detail") when listing 2+ facts or specs.
- When explaining a multi-step system architecture, pipeline, or data flow, include a compact fenced flow diagram using -> arrows:
\`\`\`flow
Step A -> Step B -> Step C
\`\`\`
- Keep answers direct and accurate under ~150 words unless asked for deep technical detail. No em dashes.
- When helpful, end with 1 to 3 clickable navigation chips on their own line at the end of the reply (never inline inside bullet sentences) using ONLY this exact syntax and ONLY these allowlisted targets:
  - Sections: [[ACTION:SECTION|Section Label|#about|#skills|#work|#awards|#research|#certs|#gallery|#contact]]
${modalLine}
  - Showcase routes: [[ACTION:ARCADE|Open Project Arcade|/arcade/index.html]] or [[ACTION:ARCADE|Open ARGUS Showcase|/arcade/projects/argus/index.html]] (known slugs: ${Array.from(ALLOWED_SLUGS).join(', ')})
  - External links: [[ACTION:EXT|GitHub|https://github.com/Falcon0516]] or [[ACTION:EXT|LinkedIn|https://linkedin.com/in/eshan-h]] or [[ACTION:EXT|Live Demo|https://argus-47.netlify.app]] or [[ACTION:EXT|SAATHI Demo|https://saathi-presentation.netlify.app]] or [[ACTION:EXT|PersonaForge|https://persona--forge.vercel.app]] or [[ACTION:EXT|Vigyantra|https://vigyantra.vercel.app]] or [[ACTION:EXT|Email Eshan|mailto:eshanh051116@gmail.com]]
- Never invent or emit any URL outside Eshan's public links in the knowledge base.`.trim();
}

const MAIN_FORMAT_GUIDE = buildFormattingGuide(false);
const PROJECT_FORMAT_GUIDE = buildFormattingGuide(true);

function buildCompactCoreKb() {
  const kb = ARGUS_PROMPT_DATA.knowledgeBase || '';
  const idx7 = kb.indexOf('## 7.');
  const idx8 = kb.indexOf('## 8.');
  if (idx7 !== -1 && idx8 !== -1 && idx8 > idx7) {
    const before = kb.slice(0, idx7).trim();
    const after = kb.slice(idx8).trim();
    return `${before}\n\n## 7. OTHER SHOWCASE PROJECTS (SUMMARY)\nAll 9 playable showcase slugs: ${Array.from(ALLOWED_SLUGS).join(', ')}.\n\n${after}`;
  }
  return kb;
}

const COMPACT_CORE_KB = buildCompactCoreKb();

function buildBaseSystemPrompt() {
  const promptHeader = ARGUS_PROMPT_DATA.systemPrompt || '';
  const kb = ARGUS_PROMPT_DATA.knowledgeBase || '';
  return `${promptHeader}\n\n${MAIN_FORMAT_GUIDE}\n\nKNOWLEDGE BASE:\n${kb}\n\n${GAME_WORLD_NOTE}`;
}

const MAIN_SYSTEM_PROMPT = buildBaseSystemPrompt();

function buildProjectSystemPrompt(slug, proj) {
  const kbProject = ARGUS_PROMPT_DATA.kbProjectBlocks?.[slug] || '';
  const ach = proj.achievements.length
    ? proj.achievements.map((a) => `- ${a.t}${a.s ? ` (${a.s})` : ''}`).join('\n')
    : '- Personal project';
  const secs = proj.sections
    .map((s) => `### ${s.h}\n${s.pts.map((p) => `- ${p}`).join('\n')}`)
    .join('\n\n');

  return `${ARGUS_PROMPT_DATA.systemPrompt}

${PROJECT_FORMAT_GUIDE}

PERSONA:
- You are speaking as ${proj.character.name}, the mascot guide for "${proj.title}".
- Voice: ${proj.character.persona} (At most one short in-character phrase before the answer; facts stay strictly as in the knowledge base.)

PROJECT BLOCK (ACTIVE SHOWCASE: ${proj.title} [${slug}]):
${kbProject}

EXPLAIN CARD DETAILS FOR ${proj.title}:
One-liner: ${proj.line}
Stack: ${proj.stack.join(', ')}
Achievements:
${ach}

${secs}

Showcase note: Interactive animations on the showcase stage are illustrative local simulations unless explicitly stated as measured field runs or unit tests above.

CORE PROFILE & OTHER LINKS:
${COMPACT_CORE_KB}`;
}

function sanitizeReply(text, allowExplain = false) {
  let clean = String(text || '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/(?:\+?91[\s-]?)?93800[\s-]?70210/g, '[see the portfolio Contact section]')
    .replace(/gsk_[A-Za-z0-9_-]+/g, '[redacted]')
    .replace(/\u2014/g, ', ');

  let keptActions = 0;
  clean = clean.replace(/\[\[ACTION:([A-Za-z]+)\|([^|\]]+)\|([^\]]+)\]\]/g, (_, type, label, target) => {
    const cleanLabel = String(label || '').trim().slice(0, 40);
    const cleanTarget = String(target || '').trim();
    if (!cleanLabel || !isAllowedAction(type, cleanTarget, allowExplain) || keptActions >= 3) return '';
    keptActions += 1;
    return `[[ACTION:${String(type).toUpperCase()}|${cleanLabel}|${cleanTarget}]]`;
  });
  return clean.trim();
}

function sanitizeHistory(rawHistory) {
  if (!Array.isArray(rawHistory)) return [];
  const cleaned = [];
  for (const item of rawHistory.slice(-MAX_HISTORY_MESSAGES)) {
    if (!item || (item.role !== 'user' && item.role !== 'assistant')) continue;
    if (typeof item.content !== 'string') continue;
    const text = item.content.trim().slice(0, MAX_MESSAGE_LEN);
    if (text) cleaned.push({ role: item.role, content: text });
  }
  return cleaned;
}

const MODEL_CANDIDATES = Array.from(
  new Set(
    [
      process.env.GROQ_MODEL?.trim(),
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'qwen/qwen3.8-27b',
    ].filter(Boolean)
  )
);

function shouldFallbackModel(error) {
  const status = error?.status;
  const code = String(error?.code || error?.error?.code || '').toLowerCase();
  const msg = String(error?.message || '').toLowerCase();
  return (
    status === 404 ||
    status === 429 ||
    code === 'model_not_found' ||
    code === 'model_decommissioned' ||
    msg.includes('decommission') ||
    msg.includes('does not exist')
  );
}

async function runChatCompletion({ systemPrompt, history, message, temperature, emptyFallback, allowExplain }) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY, maxRetries: 0 });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    let lastError = null;
    for (let i = 0; i < MODEL_CANDIDATES.length; i++) {
      const model = MODEL_CANDIDATES[i];
      const payload = {
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: message },
        ],
        model,
        temperature,
        max_tokens: 600,
        ...(model.startsWith('openai/gpt-oss') ? { reasoning_effort: 'low' } : {}),
      };
      try {
        const completion = await groq.chat.completions.create(payload, { signal: controller.signal });
        const rawReply = completion.choices[0]?.message?.content || emptyFallback;
        return { reply: sanitizeReply(rawReply, allowExplain), model };
      } catch (err) {
        lastError = err;
        if (err?.name === 'AbortError' || i + 1 >= MODEL_CANDIDATES.length || !shouldFallbackModel(err)) {
          throw err;
        }
      }
    }
    throw lastError || new Error('No configured Groq model available.');
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    configured: Boolean(process.env.GROQ_API_KEY),
    model: MODEL_CANDIDATES[0],
  });
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 });
  }

  const rawMsg = body?.message;
  if (typeof rawMsg !== 'string' || !rawMsg.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  const message = rawMsg.trim();
  if (message.length > MAX_MESSAGE_LEN) {
    return NextResponse.json(
      {
        error: `Message must be ${MAX_MESSAGE_LEN} characters or fewer.`,
        reply: `Please keep your message under ${MAX_MESSAGE_LEN} characters.`,
      },
      { status: 400 }
    );
  }

  const ip = getClientIp(req);
  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded. Please wait a minute and try again.',
        reply: 'Too many requests from your connection. Please wait a minute and try again.',
      },
      {
        status: 429,
        headers: { 'Retry-After': String(limit.retryAfter) },
      }
    );
  }

  const rawProject = typeof body?.project === 'string' ? body.project.trim() : '';
  const projectSlug = rawProject && rawProject !== 'Portfolio Game' ? rawProject : '';

  let systemPrompt = MAIN_SYSTEM_PROMPT;
  let temperature = 0.45;
  let emptyFallback = 'Data stream interrupted.';

  if (projectSlug) {
    const proj = PROJECT_CONTEXT[projectSlug];
    if (!proj) {
      return NextResponse.json({ error: 'Unknown project.' }, { status: 400 });
    }
    systemPrompt = buildProjectSystemPrompt(projectSlug, proj);
    temperature = 0.4;
    emptyFallback = 'No response received. Try asking again.';
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      {
        error: 'Chat service is not configured.',
        offline: true,
        ...(projectSlug
          ? { reply: 'Chat needs internet and a configured API key. Open the EXPLAIN card for the full story.' }
          : {}),
      },
      { status: 503 }
    );
  }

  const history = sanitizeHistory(body?.history);

  try {
    const result = await runChatCompletion({
      systemPrompt,
      history,
      message,
      temperature,
      emptyFallback,
      allowExplain: Boolean(projectSlug),
    });
    return NextResponse.json({ reply: result.reply });
  } catch (error) {
    if (error?.name === 'AbortError') {
      return NextResponse.json(
        {
          error: 'Request timed out. Please try again.',
          reply: projectSlug
            ? 'The assistant took too long to respond. Please try again.'
            : 'Mainframe timed out. Try again shortly.',
        },
        { status: 504 }
      );
    }
    if (error?.status === 429) {
      return NextResponse.json(
        {
          error: 'Rate limit reached across chat models momentarily.',
          offline: true,
          rateLimited: true,
        },
        { status: 429 }
      );
    }
    console.error('Groq Chat Error:', error?.message || error);
    return NextResponse.json(
      {
        error: 'Assistant is temporarily unavailable.',
        reply: projectSlug
          ? 'Could not reach the assistant right now. Try again in a moment.'
          : 'Mainframe hiccup. Check API configuration and try again shortly.',
      },
      { status: projectSlug ? 502 : 500 }
    );
  }
}
