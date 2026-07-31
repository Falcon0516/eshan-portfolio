// Shared CS/tech-themed aura VFX system.
// Pure functions operating on a plain state object + canvas ctx, so it can be
// dropped into the existing 2D render loop without touching physics.

const GLYPHS = "01".split("");
const HEX_GLYPHS = "0123456789ABCDEF".split("");
import { useGameStore } from "../../../state/gameStore";

export function createAuraState() {
  return {
    // binary/matrix rain columns, lazily built per-zone-type
    rainCols: null,
    rainKind: null,
    // git-graph trail: sampled points behind the player
    trail: [],
    lastTrailX: null,
    // transient burst particles (circuit-trace glow, neural-node bursts)
    bursts: [],
  };
}

// ---------- Binary / matrix rain (ambient layer, PROJECTS + CERTS + SKILLS zones) ----------
function ensureRain(state, W, kind) {
  if (state.rainCols && state.rainKind === kind && state._rainW === W) return;
  const tier = useGameStore.getState().graphicsTier;
  const spacing = tier === "high" ? 26 : (tier === "medium" ? 40 : 60);
  const cols = Math.ceil(W / spacing) + 2;
  state.rainCols = Array.from({ length: cols }, (_, i) => ({
    x: i * 26,
    y: Math.random() * 800 * (kind === "skills" ? 1 : -1),
    speed: 0.6 + Math.random() * 1.1,
    glyphs: Array.from({ length: 10 + Math.floor(Math.random() * 6) }, () =>
      kind === "hex" ? HEX_GLYPHS[Math.floor(Math.random() * 16)] : GLYPHS[Math.floor(Math.random() * 2)]
    ),
  }));
  state.rainKind = kind;
  state._rainW = W;
}

export function drawBinaryRainState(ctx, state, W, H, camera, time, zone) {
  const active = zone.name === "PROJECTS" || zone.name === "CERTS" || zone.name === "SKILLS";
  if (!active) return;
  
  let kind = "bin";
  if (zone.name === "PROJECTS") kind = "hex";
  else if (zone.name === "SKILLS") kind = "skills";
  else if (zone.name === "CERTS") kind = "certs";
  
  ensureRain(state, W, kind);
  ctx.save();
  ctx.font = '10px "Share Tech Mono", monospace';
  ctx.textAlign = "center";
  const color = zone.accent;
  
  for (const col of state.rainCols) {
    if (kind === "skills") {
      col.y -= col.speed * 1.4;
      if (col.y < -200) { col.y = H + Math.random() * 300 + 100; }
    } else {
      col.y += col.speed * 1.4;
      if (col.y > H + 200) { col.y = -Math.random() * 300 - 100; }
    }
    
    for (let i = 0; i < col.glyphs.length; i++) {
      const gy = kind === "skills" ? col.y + i * 16 : col.y - i * 16;
      if (gy < -16 || gy > H + 16) continue;
      
      const fade = 1 - i / col.glyphs.length;
      const opacityMultiplier = kind === "skills" ? 0.3 : 1; // Faint for SKILLS
      
      if (kind === "certs") {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.05 * fade})`;
        ctx.fillRect(col.x - 4, gy - 6, 8, 12); // Paper
        ctx.fillStyle = i === 0 ? `${color}66` : `rgba(255,255,255,${0.02 * fade})`;
        ctx.beginPath(); ctx.moveTo(col.x + 2, gy + 4); ctx.lineTo(col.x + 5, gy + 8); ctx.lineTo(col.x + 1, gy + 7); ctx.fill(); // Ribbon
      } else {
        ctx.fillStyle = i === 0
          ? (kind === "skills" ? `${color}${Math.floor(0.33 * 255 * opacityMultiplier).toString(16).padStart(2, '0')}` : `${color}33`)
          : `rgba(255,255,255,${0.03 * fade * opacityMultiplier})`;
        ctx.fillText(col.glyphs[i], col.x, gy);
      }
    }
    // occasionally mutate a glyph so it feels alive
    if (Math.random() < 0.02 && kind !== "certs") {
      const idx = Math.floor(Math.random() * col.glyphs.length);
      col.glyphs[idx] = kind === "hex" ? HEX_GLYPHS[Math.floor(Math.random() * 16)] : GLYPHS[Math.floor(Math.random() * 2)];
    }
  }
  ctx.restore();
}

// ---------- Git-graph trail: faint branching commit-line behind the player ----------
export function updateGitTrail(state, playerX, playerY, worldWidth) {
  if (state.lastTrailX === null || Math.abs(playerX - state.lastTrailX) > 34) {
    state.lastTrailX = playerX;
    const branch = Math.random() < 0.12 ? (Math.random() < 0.5 ? -1 : 1) : 0;
    state.trail.push({ x: playerX, y: playerY, branch });
    if (state.trail.length > 140) state.trail.shift();
  }
}

export function drawGitTrail(ctx, state, camera, W) {
  if (state.trail.length < 2) return;
  ctx.save();
  ctx.lineWidth = 1.5;
  ctx.setLineDash([]);
  let prev = null;
  let branchOffset = 0;
  for (const pt of state.trail) {
    const sx = pt.x - camera.x;
    if (sx < -50 || sx > W + 50) { prev = { ...pt, sx }; continue; }
    branchOffset += pt.branch * 6;
    branchOffset = Math.max(-18, Math.min(18, branchOffset));
    const sy = pt.y + 46 + branchOffset;
    if (prev) {
      ctx.strokeStyle = "rgba(0,255,180,0.18)";
      ctx.beginPath();
      ctx.moveTo(prev.sx, prev.sy ?? sy);
      ctx.lineTo(sx, sy);
      ctx.stroke();
    }
    if (pt.branch !== 0) {
      ctx.fillStyle = "rgba(0,255,180,0.4)";
      ctx.beginPath(); ctx.arc(sx, sy, 2.2, 0, Math.PI * 2); ctx.fill();
    }
    prev = { ...pt, sx, sy };
  }
  ctx.restore();
}

// ---------- Transient Burst Particles ----------
export function spawnCircuitBurst(state, x, y, color = "#ff0055") {
  const tier = useGameStore.getState().graphicsTier;
  const count = tier === "high" ? 12 : (tier === "medium" ? 6 : 3);
  for (let i = 0; i < count; i++) {
    state.bursts.push({
      type: "circuit",
      x, y,
      angle: (Math.PI * 2 * i) / count + Math.random() * 0.4,
      len: 0,
      maxLen: 26 + Math.random() * 30,
      turns: Math.random() < 0.5 ? 1 : -1,
      life: 1,
      color: color,
    });
  }
}

export function spawnNeuralBurst(state, x, y, color) {
  const tier = useGameStore.getState().graphicsTier;
  const maxNodes = tier === "high" ? 9 : (tier === "medium" ? 5 : 2);
  const nodes = Math.max(2, Math.floor(Math.random() * maxNodes));
  const pts = Array.from({ length: nodes }, () => ({
    dx: (Math.random() - 0.5) * 90,
    dy: (Math.random() - 0.5) * 60,
  }));
  state.bursts.push({ type: "neural", x, y, pts, life: 1, color: color || "#bf00ff" });
}

export function updateAuraBursts(state, dt) {
  for (let i = state.bursts.length - 1; i >= 0; i--) {
    const b = state.bursts[i];
    b.life -= 0.02 * dt;
    if (b.type === "circuit" && b.len < b.maxLen) b.len += 2.2 * dt;
    if (b.life <= 0) state.bursts.splice(i, 1);
  }
}

export function drawAuraBursts(ctx, state, camera) {
  ctx.save();
  for (const b of state.bursts) {
    const bx = b.x - camera.x;
    if (b.type === "circuit") {
      ctx.strokeStyle = `${b.color}${Math.max(0, Math.floor(b.life * 90)).toString(16).padStart(2, "0")}`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      const midX = bx + Math.cos(b.angle) * b.len * 0.6;
      const midY = b.y + Math.sin(b.angle) * b.len * 0.6;
      const endX = bx + Math.cos(b.angle) * b.len + b.turns * 8;
      const endY = b.y + Math.sin(b.angle) * b.len;
      ctx.moveTo(bx, b.y);
      ctx.lineTo(midX, midY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath(); ctx.arc(endX, endY, 1.5, 0, Math.PI * 2); ctx.fill();
    } else if (b.type === "neural") {
      ctx.strokeStyle = `${b.color}${Math.max(0, Math.floor(b.life * 70)).toString(16).padStart(2, "0")}`;
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = 1;
      for (let i = 0; i < b.pts.length; i++) {
        const p1 = b.pts[i];
        const p2 = b.pts[(i + 1) % b.pts.length];
        ctx.beginPath();
        ctx.moveTo(bx + p1.dx * b.life, b.y + p1.dy * b.life);
        ctx.lineTo(bx + p2.dx * b.life, b.y + p2.dy * b.life);
        ctx.stroke();
      }
      for (const p of b.pts) {
        ctx.beginPath();
        ctx.arc(bx + p.dx * b.life, b.y + p.dy * b.life, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

// ---------- Time-of-day drift (dawn -> midday -> dusk -> night across the run) ----------
// Returns an overlay { top, bottom, alpha } of colors to wash over the sky gradient.
export function getTimeOfDayOverlay(progressPct) {
  const stops = [
    { at: 0, top: "#fff4d6", bottom: "#ffb27a", alpha: 0.16 },   // dawn
    { at: 30, top: "#bfe9ff", bottom: "#ffffff", alpha: 0.05 },  // midday
    { at: 65, top: "#ff9d5c", bottom: "#7a3b6e", alpha: 0.14 },  // dusk
    { at: 100, top: "#02020a", bottom: "#0a0a2a", alpha: 0.24 }, // night
  ];
  let a = stops[0], b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (progressPct >= stops[i].at && progressPct <= stops[i + 1].at) {
      a = stops[i]; b = stops[i + 1]; break;
    }
  }
  const span = Math.max(1, b.at - a.at);
  const f = Math.min(1, Math.max(0, (progressPct - a.at) / span));
  const lerp = (x, y) => x + (y - x) * f;
  const lerpHex = (h1, h2) => {
    const c1 = parseInt(h1.slice(1), 16), c2 = parseInt(h2.slice(1), 16);
    const r = lerp((c1 >> 16) & 255, (c2 >> 16) & 255);
    const g = lerp((c1 >> 8) & 255, (c2 >> 8) & 255);
    const bl = lerp(c1 & 255, c2 & 255);
    return `rgb(${r | 0},${g | 0},${bl | 0})`;
  };
  return { top: lerpHex(a.top, b.top), bottom: lerpHex(a.bottom, b.bottom), alpha: lerp(a.alpha, b.alpha) };
}

// AGRICULTURE zone: sunrise -> full daylight as player crosses local x1..x2
export function getAgricultureLocalLight(playerX, zone) {
  const t = Math.min(1, Math.max(0, (playerX - zone.x1) / Math.max(1, zone.x2 - zone.x1)));
  // 0 = sunrise warm haze, 1 = bright daylight, clears out by mid-zone
  const clarity = Math.min(1, t * 1.8);
  return { warmth: 1 - clarity, clarity };
}
