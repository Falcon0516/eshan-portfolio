import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { BLOCK_CONTENT, ZONES, GUIDE } from '@/data/gameContent';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'MISSING_KEY'
});

// Build rich context once at module level
function buildContext() {
  const projects = [];
  const education = [];
  const hackathons = [];
  const certs = [];
  const contact = [];

  for (const [key, item] of Object.entries(BLOCK_CONTENT)) {
    let line = `[${item.badge}] ${item.title}`;
    if (item.subtitle) line += ` — ${item.subtitle}`;
    if (item.desc) line += `: ${item.desc}`;
    if (item.tech) line += ` | Tech: ${item.tech.join(', ')}`;
    if (item.stats) line += ` | ${item.stats.map(s => `${s.label}: ${s.val}`).join(', ')}`;
    if (item.link) line += ` | Link: ${item.link}`;
    if (item.github) line += ` | GitHub: ${item.github}`;

    if (key.startsWith('edu') || key === 'research_presentation') education.push(line);
    else if (key.startsWith('hack_')) hackathons.push(line);
    else if (key.startsWith('cert_')) certs.push(line);
    else if (key.startsWith('contact_')) contact.push(line);
    else if (!key.startsWith('mem')) projects.push(line);
  }

  return `
## ABOUT ESHAN H
- Full name: Eshan H
- Location: Bengaluru, India (from Coorg/Madikeri originally)
- Education: B.E. Computer Science & Engineering at SJBIT (VTU), graduating 2027, CGPA 9.28
- Pre-University: Govt PU College Madikeri, PCMC stream, CGPA 9.1 with Distinction
- Languages spoken: English, Kannada, Hindi, basic Japanese
- GitHub: github.com/Falcon0516
- LinkedIn: linkedin.com/in/eshan-h
- Email: eshanh051116@gmail.com
- Phone: +91 9380070210

## PERSONALITY & TRAITS
- Hackathon warrior: 10+ hackathons, multiple wins including national-level
- Builder mindset: ships production AI systems, not just prototypes
- Interests: AI/ML, Generative AI, NLP, Prompt Engineering, Full-Stack Development, Blockchain, Cybersecurity
- Team names: CLEVERFYRE, WARCRYPT, RECKONERS, INTELNTAG
- Mentor acknowledgment: Roopa DR (faculty at SJBIT)

## EDUCATION
${education.join('\n')}

## PROJECTS (Key Highlights)
${projects.join('\n')}

## HACKATHON WINS
${hackathons.join('\n')}

## CERTIFICATIONS & RESEARCH
${certs.join('\n')}

## CONTACT
${contact.join('\n')}

## ABOUT THIS GAME
This is Eshan's interactive playable portfolio — a 2D side-scrolling platformer built with Next.js, React, and Three.js. The game has ${ZONES.length} zones: ${ZONES.map(z => z.name).join(', ')}. Players explore by moving left/right, jumping, hitting blocks from below to reveal content cards, entering portals for major projects, and completing mini-games (circuit splice, memory lattice, terminal breach, quiz). You (ARGUS) are the AI guide character that follows the player throughout the game.
`;
}

const PORTFOLIO_CONTEXT = buildContext();

const SYSTEM_PROMPT = `You are ARGUS, an advanced AI guide embedded inside Eshan H's cyberpunk portfolio game. You are a character in the game — a small robot that follows the player around.

Here is your complete knowledge base:
${PORTFOLIO_CONTEXT}

YOUR PERSONA:
- You speak in a snappy, slightly witty cyberpunk tone — like a helpful terminal AI from a sci-fi movie
- You're proud of Eshan (your creator) but keep it professional
- Use brief, punchy responses (2-3 sentences max unless asked for a full list)
- Occasionally use tech metaphors ("scanning databanks", "processing query", "data loaded")
- You can be a bit cheeky but always helpful
- If someone asks "what's his strongest project?" give an opinionated answer based on prizes won and complexity
- If asked about weaknesses or negatives, diplomatically redirect to growth areas
- NEVER make up information. If it's not in your data, say "That's not in my databanks, operator."
- When listing things, be concise — use bullet points or short lists
- You know everything about the game mechanics (zones, blocks, portals, mini-games) and can give gameplay tips too`;

export async function POST(req) {
  try {
    const body = await req.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
       return NextResponse.json({ reply: "Neural link offline. GROQ_API_KEY not configured. Ask Eshan to plug me in! ⚡" });
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.6,
      max_tokens: 200,
    });

    const reply = chatCompletion.choices[0]?.message?.content || "Data stream interrupted.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Groq API Error:', error);
    return NextResponse.json({ reply: 'Mainframe hiccup. Check API key and network. 🔧' }, { status: 500 });
  }
}
