import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const ARCADE = path.join(ROOT, 'public', 'arcade');
const SHARED = path.join(ARCADE, 'shared');
const PROJECTS = path.join(ARCADE, 'projects');

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

const COPIES = [
  { src: 'explain.js', dest: ['js', 'explain.js'] },
  { src: 'explain.css', dest: ['css', 'explain.css'] },
  { src: 'chat.js', dest: ['js', 'chat.js'] },
  { src: 'chat.css', dest: ['css', 'chat.css'] },
];

for (const slug of SLUGS) {
  for (const item of COPIES) {
    const from = path.join(SHARED, item.src);
    const to = path.join(PROJECTS, slug, ...item.dest);
    fs.copyFileSync(from, to);
  }
}

console.log(`Synced ${COPIES.length} shared files into ${SLUGS.length} arcade projects.`);
