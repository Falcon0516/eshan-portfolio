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

function buildBaseSystemPrompt() {
  const promptHeader = ARGUS_PROMPT_DATA.systemPrompt || '';
  const kb = ARGUS_PROMPT_DATA.knowledgeBase || '';
  return `${promptHeader}\n\nKNOWLEDGE BASE:\n${kb}\n\n${GAME_WORLD_NOTE}`;
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

FULL KNOWLEDGE BASE (ESHAN H & OTHER WORK):
${ARGUS_PROMPT_DATA.knowledgeBase}`;
}

function sanitizeReply(text) {
  return String(text || '')
    .replace(/(?:\+?91[\s-]?)?93800[\s-]?70210/g, '[see the portfolio Contact section]')
    .replace(/gsk_[A-Za-z0-9_-]+/g, '[redacted]')
    .replace(/\u2014/g, ', ');
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

export async function GET() {
  return NextResponse.json({
    ok: true,
    configured: Boolean(process.env.GROQ_API_KEY),
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

  const projectSlug = typeof body?.project === 'string' ? body.project.trim() : '';

  // Arcade per-character chat branch
  if (projectSlug) {
    const proj = PROJECT_CONTEXT[projectSlug];
    if (!proj) {
      return NextResponse.json({ error: 'Unknown project.' }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        {
          error: 'Chat service is not configured.',
          offline: true,
          reply: 'Chat needs internet and a configured API key. Open the EXPLAIN card for the full story.',
        },
        { status: 503 }
      );
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const history = sanitizeHistory(body?.history);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const chatCompletion = await groq.chat.completions.create(
        {
          messages: [
            { role: 'system', content: buildProjectSystemPrompt(projectSlug, proj) },
            ...history,
            { role: 'user', content: message },
          ],
          model: 'llama-3.1-8b-instant',
          temperature: 0.4,
          max_tokens: 320,
        },
        { signal: controller.signal }
      );

      const rawReply = chatCompletion.choices[0]?.message?.content || 'No response received. Try asking again.';
      return NextResponse.json({ reply: sanitizeReply(rawReply) });
    } catch (error) {
      if (error?.name === 'AbortError') {
        return NextResponse.json(
          {
            error: 'Request timed out. Please try again.',
            reply: 'The assistant took too long to respond. Please try again.',
          },
          { status: 504 }
        );
      }
      console.error('Groq Project Chat Error:', error?.message || error);
      return NextResponse.json(
        {
          error: 'Assistant is temporarily unavailable.',
          reply: 'Could not reach the assistant right now. Try again in a moment.',
        },
        { status: 502 }
      );
    } finally {
      clearTimeout(timer);
    }
  }

  // Main portfolio ARGUS assistant (professional + game modes)
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      {
        error: 'Chat service is not configured.',
        offline: true,
      },
      { status: 503 }
    );
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const history = sanitizeHistory(body?.history);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const chatCompletion = await groq.chat.completions.create(
      {
        messages: [
          { role: 'system', content: MAIN_SYSTEM_PROMPT },
          ...history,
          { role: 'user', content: message },
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.45,
        max_tokens: 320,
      },
      { signal: controller.signal }
    );

    const rawReply = chatCompletion.choices[0]?.message?.content || 'Data stream interrupted.';
    return NextResponse.json({ reply: sanitizeReply(rawReply) });
  } catch (error) {
    if (error?.name === 'AbortError') {
      return NextResponse.json({ reply: 'Mainframe timed out. Try again shortly.' }, { status: 504 });
    }
    console.error('Groq API Error:', error?.message || error);
    return NextResponse.json(
      { reply: 'Mainframe hiccup. Check API key and network.' },
      { status: 500 }
    );
  } finally {
    clearTimeout(timer);
  }
}
