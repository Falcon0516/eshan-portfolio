import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const PROJECTS_DIR = path.join(ROOT, 'public', 'arcade', 'projects');
const OUT_FILE = path.join(ROOT, 'src', 'data', 'project-context.json');
const ARGUS_OUT = path.join(ROOT, 'src', 'data', 'argus-prompt.json');

const SLUGS = [
  'saathi',
  'argus',
  'soil-and-toil',
  'axiom',
  'personaforge',
  'kavach',
  'pro-rover',
  'usb-tcp-bridge',
  'verifarm',
];

function evalWindowFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: filePath });
  return sandbox.window;
}

const contextMap = {};

for (const slug of SLUGS) {
  const explainPath = path.join(PROJECTS_DIR, slug, 'data', 'explain.js');
  const chatPath = path.join(PROJECTS_DIR, slug, 'data', 'chat.js');

  const explainWin = evalWindowFile(explainPath);
  const chatWin = fs.existsSync(chatPath) ? evalWindowFile(chatPath) : {};
  const E = explainWin.EXPLAIN || {};
  const C = chatWin.CHAT || {};

  contextMap[slug] = {
    slug,
    title: E.title || slug.toUpperCase(),
    line: E.line || '',
    achievements: (E.achievements || []).map((a) => ({
      t: a.t || '',
      s: a.s || '',
    })),
    stack: E.stack || [],
    sections: (E.sections || []).map((sec) => ({
      h: sec.h || '',
      pts: sec.pts || [],
    })),
    character: {
      name: C.name || E.title || slug,
      persona: C.persona || '',
    },
  };
}

fs.writeFileSync(OUT_FILE, JSON.stringify(contextMap, null, 2) + '\n', 'utf8');

const kbPath = path.join(ROOT, 'ARGUS_KNOWLEDGE_BASE.md');
const promptPath = path.join(ROOT, 'ARGUS_SYSTEM_PROMPT.md');
const hasSources = fs.existsSync(kbPath) && fs.existsSync(promptPath);
let blockCount = 0;

if (hasSources) {
  const knowledgeBase = fs.readFileSync(kbPath, 'utf8').trim();
  const systemPrompt = fs.readFileSync(promptPath, 'utf8').trim();

  // Extract ### 7.x ... [slug] sections from ARGUS_KNOWLEDGE_BASE.md
  const kbProjectBlocks = {};
  const chunks = knowledgeBase.split(/^### /m);
  for (const chunk of chunks) {
    const m = /^7\.\d+[^\n]*\[([a-z0-9-]+)\]/i.exec(chunk);
    if (m) {
      kbProjectBlocks[m[1]] = '### ' + chunk.trim();
    }
  }
  blockCount = Object.keys(kbProjectBlocks).length;

  fs.writeFileSync(
    ARGUS_OUT,
    JSON.stringify({ systemPrompt, knowledgeBase, kbProjectBlocks }, null, 2) + '\n',
    'utf8'
  );
} else if (fs.existsSync(ARGUS_OUT)) {
  const existing = JSON.parse(fs.readFileSync(ARGUS_OUT, 'utf8'));
  blockCount = Object.keys(existing.kbProjectBlocks || {}).length;
}

console.log(
  `Generated ${OUT_FILE} (${Object.keys(contextMap).length} projects) and ${hasSources ? 'updated' : 'preserved'} ${ARGUS_OUT} (${blockCount} KB project blocks).`
);
