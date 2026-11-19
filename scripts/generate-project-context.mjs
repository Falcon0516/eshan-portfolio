import fs from 'fs';
import path from 'path';
import vm from 'vm';

const ROOT = process.cwd();
const PROJECTS_DIR = path.join(ROOT, 'public', 'arcade', 'projects');
const OUT_FILE = path.join(ROOT, 'src', 'data', 'project-context.json');

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
console.log(`Generated ${OUT_FILE} for ${Object.keys(contextMap).length} projects.`);
