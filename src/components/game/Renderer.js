import { PLAYER_W, PLAYER_H, BLOCK_SIZE, FINISH_X, WORLD_WIDTH, ZONES } from "../../data/gameContent";

// Helper function to get the current zone
export function getZone(x) {
  for (let i = ZONES.length - 1; i >= 0; i--) {
    if (x >= ZONES[i].x1) return ZONES[i];
  }
  return ZONES[0];
}

const imageCache = {};
function getImage(src) {
  if (!imageCache[src]) {
    const img = new Image();
    img.src = src;
    imageCache[src] = img;
  }
  return imageCache[src];
}

// Player rendering
export function drawPlayer(ctx, p, glowColor) {
  const glow = glowColor || "#00ffff";
  ctx.save();
  if (p.facing === -1) {
    ctx.translate(p.screenX + PLAYER_W, p.screenY);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(p.screenX, p.screenY);
  }
  
  const w = p.walking ? Math.floor(p.walkFrame) % 2 : 0, j = !p.grounded;
  
  ctx.save();
  // SQUASH AND STRETCH
  let scaleX = 1;
  let scaleY = 1;
  if (!p.grounded) {
    scaleX = 0.9 + Math.max(-0.1, Math.min(0.1, -p.vy * 0.015));
    scaleY = 1.1 + Math.max(-0.1, Math.min(0.2, Math.abs(p.vy) * 0.02));
  } else if (p.squash > 0) {
    scaleX = 1 + p.squash * 0.2;
    scaleY = 1 - p.squash * 0.2;
  }
  ctx.translate(0, PLAYER_H);
  ctx.scale(scaleX, scaleY);
  ctx.translate(0, -PLAYER_H);

  // Zone-tinted outer aura glow (matches the dominant aura motif of the current zone)
  ctx.save();
  ctx.shadowColor = glow;
  ctx.shadowBlur = 22;
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = glow;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-6, -4, PLAYER_W + 12, PLAYER_H + 8);
  ctx.restore();

  ctx.shadowColor = glow;
  ctx.shadowBlur = 14;
  ctx.fillStyle = `${glow}0f`;
  ctx.fillRect(-4, PLAYER_H - 4, PLAYER_W + 8, 8);
  ctx.shadowBlur = 0;
  
  ctx.fillStyle = "#e63946";
  if (j) {
    ctx.fillRect(4, 36, 10, 6); ctx.fillRect(16, 36, 10, 6);
  } else {
    ctx.fillRect(2 + w * 4, 36, 11, 6); ctx.fillRect(17 - w * 4, 36, 11, 6);
  }
  
  ctx.fillStyle = "#1e293b";
  if (j) {
    ctx.fillRect(6, 28, 8, 8); ctx.fillRect(16, 28, 8, 8);
  } else {
    ctx.fillRect(4 + w * 3, 28, 9, 8); ctx.fillRect(17 - w * 3, 28, 9, 8);
  }
  
  const hG = ctx.createLinearGradient(3, 13, 3, 28);
  hG.addColorStop(0, "#3b82f6"); hG.addColorStop(1, "#1d4ed8");
  ctx.fillStyle = hG;
  ctx.fillRect(3, 13, 24, 15);
  ctx.fillStyle = "#1e40af";
  ctx.fillRect(13, 16, 4, 10);
  
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.font = "bold 7px monospace";
  ctx.fillText("</>", 7, 24);
  
  ctx.fillStyle = "#3b82f6";
  const a1 = j ? 8 : 15 + w * 3, a2 = j ? 8 : 15 - w * 3;
  ctx.fillRect(-2, a1, 6, 11); ctx.fillRect(26, a2, 6, 11);
  ctx.fillStyle = "#f5d0a9";
  ctx.fillRect(-2, a1 + 9, 6, 4); ctx.fillRect(26, a2 + 9, 6, 4);
  
  ctx.fillStyle = "#f5d0a9";
  ctx.fillRect(5, 1, 20, 13);
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(3, -1, 24, 5); ctx.fillRect(2, 1, 4, 5); ctx.fillRect(24, 1, 4, 5);
  
  ctx.fillStyle = "#00e5ff";
  ctx.fillRect(7, 5, 6, 4); ctx.fillRect(17, 5, 6, 4);
  ctx.fillStyle = "#444";
  ctx.fillRect(13, 6, 4, 1);
  ctx.fillStyle = "#111";
  ctx.fillRect(9, 6, 2, 2); ctx.fillRect(19, 6, 2, 2);
  
  ctx.fillStyle = j ? "#ff6b6b" : "#d4a0a0";
  ctx.fillRect(12, 11, 6, j ? 3 : 2);
  ctx.restore();
  ctx.restore();
}

export function drawGuide(ctx, gx, gy, t) {
  const b = Math.sin(t * 3) * 5, x = Math.round(gx), y = Math.round(gy + b);
  const gl = ctx.createRadialGradient(x + 10, y + 10, 0, x + 10, y + 10, 22);
  gl.addColorStop(0, "rgba(0,255,255,0.25)");
  gl.addColorStop(1, "rgba(0,255,255,0)");
  ctx.fillStyle = gl;
  ctx.beginPath(); ctx.arc(x + 10, y + 10, 22, 0, Math.PI * 2); ctx.fill();
  
  ctx.fillStyle = "#00e5ff";
  ctx.beginPath(); ctx.arc(x + 10, y + 10, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#005f7f";
  ctx.beginPath(); ctx.arc(x + 10, y + 10, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(x + 12, y + 9, 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#000";
  ctx.beginPath(); ctx.arc(x + 13, y + 9, 1.5, 0, Math.PI * 2); ctx.fill();
  
  ctx.strokeStyle = "#00e5ff";
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x + 10, y + 1); ctx.lineTo(x + 10, y - 6 + Math.sin(t * 5) * 2); ctx.stroke();
  ctx.fillStyle = "#ff006e";
  ctx.beginPath(); ctx.arc(x + 10, y - 7 + Math.sin(t * 5) * 2, 2.5, 0, Math.PI * 2); ctx.fill();
}

export function drawCoin(ctx, cx, cy, t) {
  const s = Math.abs(Math.sin(t * 3 + cx * 0.01)), w = 8 * Math.max(s, 0.15);
  ctx.fillStyle = "#ffd700";
  ctx.beginPath(); ctx.ellipse(cx + 10, cy + 10, w, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ffea00";
  ctx.beginPath(); ctx.ellipse(cx + 10, cy + 10, w * 0.55, 5, 0, 0, Math.PI * 2); ctx.fill();
}

export function drawBlock(ctx, b, t) {
  const x = Math.round(b.screenX), y = Math.round(b.screenY + b.bounceY);
  
  if (b.type === "block") {
    if (b.hit) {
      ctx.fillStyle = "#2a2a3a"; ctx.fillRect(x, y, b.w, b.h);
      ctx.strokeStyle = "rgba(0,255,255,0.15)"; ctx.lineWidth = 1; ctx.strokeRect(x + 1, y + 1, b.w - 2, b.h - 2);
      ctx.fillStyle = "rgba(0,255,255,0.4)"; ctx.font = '12px monospace'; ctx.textAlign = "center"; ctx.fillText("🔄", x + b.w / 2, y + b.h / 2 + 4);
    } else {
      const pulse = 0.92 + 0.08 * Math.sin(t * 5);
      ctx.fillStyle = "#c89b1d"; ctx.fillRect(x, y, b.w, b.h);
      ctx.fillStyle = "#e8b52a"; ctx.fillRect(x + 3, y + 3, b.w - 6, b.h - 6);
      ctx.fillStyle = "#a07818"; const r = 4;
      ctx.fillRect(x + 3, y + 3, r, r); ctx.fillRect(x + b.w - 3 - r, y + 3, r, r);
      ctx.fillRect(x + 3, y + b.h - 3 - r, r, r); ctx.fillRect(x + b.w - 3 - r, y + b.h - 3 - r, r, r);
      ctx.fillStyle = "#7a5a10"; ctx.font = `bold ${Math.round(22 * pulse)}px "Press Start 2P",monospace`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("?", x + b.w / 2, y + b.h / 2 + 2);
      ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 10; ctx.fillStyle = "rgba(255,215,0,0.12)"; ctx.fillRect(x - 4, y - 4, b.w + 8, b.h + 8); ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.fillRect(x + 5, y + 5, 10, 5);
    }
  } else if (b.type === "portal") {
    // Galaxy Portal
    const pulse = 0.5 + 0.5 * Math.sin(t * 4);
    const rad = b.w / 2;
    const px = x + rad, py = y + rad;
    
    const grad = ctx.createRadialGradient(px, py, 0, px, py, rad);
    grad.addColorStop(0, "rgba(255,255,255,0.9)");
    grad.addColorStop(0.2, "rgba(0,255,255,0.8)");
    grad.addColorStop(0.8, "rgba(138,43,226,0.5)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(t);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, rad * (0.8 + 0.2 * pulse), 0, Math.PI * 2);
    ctx.fill();
    
    // Draw some rotating stars inside
    ctx.fillStyle = "#fff";
    for(let i=0; i<5; i++) {
      const a = (Math.PI*2/5) * i + t * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * rad * 0.5, Math.sin(a) * rad * 0.5, 2, 0, Math.PI*2);
      ctx.fill();
    }
    
    ctx.restore();
    
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = '10px "Press Start 2P",monospace';
    ctx.textAlign = "center";
    ctx.fillText("ENTER", x + b.w / 2, y - 10);
  } else if (b.type === "hover") {
    // Hover-Reveal Cert
    ctx.save();
    const hoverY = y + Math.sin(t * 2 + x) * 10;
    
    ctx.shadowColor = "#00ffa5";
    ctx.shadowBlur = b.hoverProgress * 20;
    ctx.fillStyle = `rgba(10,37,32,${0.8 + b.hoverProgress * 0.2})`;
    ctx.strokeStyle = "#00ffa5";
    ctx.lineWidth = 2;
    
    ctx.translate(x + b.w/2, hoverY + b.h/2);
    ctx.rotate((1 - b.hoverProgress) * 0.1 * Math.sin(t)); // idle tilt
    
    ctx.fillRect(-b.w/2, -b.h/2, b.w, b.h);
    ctx.strokeRect(-b.w/2, -b.h/2, b.w, b.h);
    
    ctx.fillStyle = "#00ffa5";
    ctx.font = '24px sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("📜", 0, -10 + b.hoverProgress * -10);
    
    if (b.hoverProgress > 0.1) {
      ctx.globalAlpha = b.hoverProgress;
      ctx.font = '8px "Press Start 2P",monospace';
      ctx.fillText("CERT", 0, 15);
    }
    
    ctx.restore();
  } else if (b.type === "photo") {
    if (!b.imgObj) return;
    
    ctx.save();
    // Scatter effect based on x position
    const rot = ((x % 40) - 20) * (Math.PI / 180); 
    const px = x + b.w/2;
    const py = y + b.h/2;
    
    ctx.translate(px, py);
    ctx.rotate(rot + Math.sin(t + x) * 0.02);
    
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;
    
    // Polaroid frame
    ctx.fillStyle = "#f8f9fa";
    ctx.fillRect(-b.w/2 - 4, -b.h/2 - 4, b.w + 8, b.h + 20);
    
    // The photo
    ctx.drawImage(b.imgObj, -b.w/2, -b.h/2, b.w, b.h);
    
    // Tape
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.rotate(-0.1);
    ctx.fillRect(-15, -b.h/2 - 12, 30, 10);
    
    ctx.restore();
  }
  
  ctx.textAlign = "start"; ctx.textBaseline = "alphabetic";
}

export function drawSign(ctx, s) {
  ctx.fillStyle = "rgba(0,255,255,0.6)";
  ctx.font = '8px "Press Start 2P",monospace';
  ctx.textAlign = "left";
  ctx.fillText(s.text, s.screenX, s.screenY);
}

export function drawImageFrame(ctx, f, t) {
  if (!f.imgObj) return;
  const hoverY = Math.sin(t * 1.5 + f.hoverOffset) * 5;
  const x = Math.round(f.screenX), y = Math.round(f.screenY + hoverY);
  
  ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 15;
  ctx.fillStyle = "#ffd700"; ctx.fillRect(x - 5, y - 5, f.w + 10, f.h + 10);
  ctx.shadowBlur = 0;
  
  ctx.fillStyle = "#0a0a15"; ctx.fillRect(x - 3, y - 3, f.w + 6, f.h + 6);
  
  const iw = f.imgObj.width, ih = f.imgObj.height;
  const scale = Math.min(f.w / iw, f.h / ih);
  const dw = iw * scale, dh = ih * scale;
  const dx = x + (f.w - dw) / 2, dy = y + (f.h - dh) / 2;
  
  ctx.drawImage(f.imgObj, dx, dy, dw, dh);
  
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = '6px "Press Start 2P",monospace';
  ctx.textAlign = "center";
  ctx.fillText(f.label, x + f.w / 2, y + f.h + 14);
  ctx.textAlign = "start";
}

export function drawFinishLine(ctx, fx, G, t) {
  const s = 20;
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 3; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? "#fff" : "#000";
      ctx.globalAlpha = 0.7 + 0.3 * Math.sin(t * 3);
      ctx.fillRect(fx + col * s, G - 120 + row * s, s, s);
    }
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#ffd700";
  ctx.font = 'bold 10px "Press Start 2P",monospace';
  ctx.textAlign = "center";
  ctx.fillText("🏁 FINISH", fx + 30, G - 130);
  ctx.textAlign = "start";
}

export function spawnBlockParticles(p, bx, by) {
  for (let i = 0; i < 12; i++) {
    p.push({ x: bx + BLOCK_SIZE / 2, y: by, vx: (Math.random() - 0.5) * 7, vy: -Math.random() * 7 - 2, life: 1, color: ["#ffd700", "#f0c040", "#ffea00", "#fff"][i % 4], size: 2 + Math.random() * 4 });
  }
}

export function spawnCoinParticles(p, cx, cy) {
  for (let i = 0; i < 6; i++) {
    p.push({ x: cx, y: cy, vx: (Math.random() - 0.5) * 4, vy: -Math.random() * 5 - 1, life: 1, color: "#ffd700", size: 2 + Math.random() * 2 });
  }
}

export function drawBackgroundElements(ctx, zone, W, H, camera, t, GROUND_Y, timeOfDay, agriLight) {
  // Common Sky
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, zone.sky1);
  sky.addColorStop(1, zone.sky2);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Time-of-day drift removed per user request (was causing an ugly grey overlay)

  // AGRICULTURE: local sunrise -> full daylight as the player crosses this zone's x-range
  if (agriLight && zone.name === "AGRICULTURE") {
    ctx.save();
    ctx.globalAlpha = agriLight.warmth * 0.3;
    ctx.fillStyle = "#ff8a3d";
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = agriLight.clarity * 0.12;
    ctx.fillStyle = "#fffbe0";
    ctx.fillRect(0, 0, W, H * 0.6);
    ctx.restore();
  }
  
  if (zone.stars) {
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    for (let i = 0; i < 80; i++) {
      const sx = ((i * 237 + 100) % (W + 300)) - (camera.x * 0.04) % (W + 300);
      const sy = (i * 137 + 30) % (H * 0.55);
      const ss = i % 3 === 0 ? 2 : 1;
      const nx = ((sx % (W + 300)) + W + 300) % (W + 300) - 150;
      if (nx >= 0 && nx <= W) ctx.fillRect(nx, sy, ss, ss);
    }
  }

  // Zone specific Parallax Layers
  if (zone.name === "AGRICULTURE") {
    // Rolling hills
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    for (let i = -100; i < W + 100; i += 20) {
      const hillY = H * 0.7 + Math.sin((i + camera.x * 0.1) * 0.005) * 50;
      if (i === -100) ctx.moveTo(i, hillY);
      else ctx.lineTo(i, hillY);
    }
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();

    // Windmills
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const wx = ((i * 400 + 300) - camera.x * 0.15) % (W + 400);
      const nx = ((wx % (W + 400)) + W + 400) % (W + 400) - 200;
      if (nx > -50 && nx < W + 50) {
        ctx.beginPath(); ctx.moveTo(nx, H * 0.7); ctx.lineTo(nx, H * 0.4); ctx.stroke();
        ctx.save(); ctx.translate(nx, H * 0.4); ctx.rotate(t * 0.5);
        ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(30, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(0, 30); ctx.stroke();
        ctx.restore();
      }
    }
  } else if (zone.name.includes("MEMORIES")) {
    // Floating bokeh particles
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    for (let i = 0; i < 15; i++) {
      const bx = ((i * 150) - camera.x * 0.05 + Math.sin(t + i) * 50) % (W + 200);
      const by = ((i * 100) - t * 10) % H;
      const nx = ((bx % (W + 200)) + W + 200) % (W + 200) - 100;
      const ny = ((by % H) + H) % H;
      ctx.beginPath(); ctx.arc(nx, ny, 10 + (i % 20), 0, Math.PI * 2); ctx.fill();
    }
  } else if (zone.name === "EDUCATION") {
    // Paper planes / notebook pages
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    for (let i = 0; i < 15; i++) {
      const bx = ((i * 150) - camera.x * 0.05 + Math.sin(t + i) * 50) % (W + 200);
      const by = ((i * 100) - t * 10) % H;
      const nx = ((bx % (W + 200)) + W + 200) % (W + 200) - 100;
      const ny = ((by % H) + H) % H;
      ctx.save();
      ctx.translate(nx, ny);
      ctx.rotate(Math.sin(t*0.5 + i) * 0.2 - 0.2);
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(-10, 10); ctx.lineTo(-5, 0); ctx.lineTo(-10, -10); ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  } else if (zone.name === "CONTACT") {
    // Constellation lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 20; i++) {
      const bx = ((i * 140) - camera.x * 0.03) % (W + 200);
      const by = (i * 80) % (H * 0.6);
      const nx = ((bx % (W + 200)) + W + 200) % (W + 200) - 100;
      if (i === 0) ctx.moveTo(nx, by);
      else {
        ctx.lineTo(nx, by);
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.fillRect(nx-1, by-1, 2, 2);
      }
    }
    ctx.stroke();

    // Fade in user's face after linkedin box (x = 18660)
    // camera.x is player.x - W/2 roughly
    // So camera.x > 18200 means player is around 18600+
    const triggerCameraX = 18000;
    if (camera.x > triggerCameraX) {
      const faceImg = getImage("/image.png");
      if (faceImg.complete && faceImg.width > 0) {
        ctx.save();
        const progress = Math.min((camera.x - triggerCameraX) / 800, 1); // 0 to 1 over 800px
        ctx.globalAlpha = progress * 0.5; // Max opacity 0.5 so it doesn't completely block the game
        // Scale up by 1.5 to allow panning without edge clipping
        const scale = Math.max(W / faceImg.width, H / faceImg.height) * 1.5;
        const dw = faceImg.width * scale;
        const dh = faceImg.height * scale;
        
        // Offset left and upwards to center the falcon/quote
        const dx = (W - dw) / 2 - W * 0.2;
        const dy = (H - dh) / 2 - H * 0.15;
        
        ctx.drawImage(faceImg, dx, dy, dw, dh);
        ctx.restore();
      }
    }
  } else {
    // Tech Buildings and Code Snippets (Default for Tech Zones: PROJECTS, SKILLS, HACKATHONS, CERTS)
    
    // Hackathons specific - Spotlights and confetti
    if (zone.name === "HACKATHONS") {
      // Spotlights
      for (let i=0; i<3; i++) {
        const sx = ((i*600 + 300) - camera.x*0.1) % (W+800) - 400;
        ctx.save();
        ctx.translate(sx, GROUND_Y);
        ctx.rotate(Math.sin(t*0.3 + i)*0.3);
        const grad = ctx.createLinearGradient(0, 0, 0, -H*0.8);
        grad.addColorStop(0, `${zone.accent}33`);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-150, -H*0.8); ctx.lineTo(150, -H*0.8); ctx.fill();
        ctx.restore();
      }
      // Confetti
      ctx.fillStyle = "rgba(255, 215, 0, 0.4)";
      for (let i = 0; i < 20; i++) {
        const bx = ((i * 80) - camera.x * 0.1 + Math.sin(t*2 + i)*10) % (W + 200);
        const by = ((i * 50) + t * 40) % H;
        const nx = ((bx % (W + 200)) + W + 200) % (W + 200) - 100;
        ctx.fillRect(nx, by, 3, 3);
      }
    }

    ctx.fillStyle = "rgba(0,255,255,0.025)";
    ctx.font = '10px "Share Tech Mono",monospace';
    const cs = ["if(ai)", "for(i=0;", "def train():", "npm run", "git push", "class Agent:", "async fn", "SELECT *", "docker run", "kubectl"];
    for (let i = 0; i < cs.length; i++) {
      const cx = ((i * 400 + 200) - camera.x * 0.08) % (W + 400);
      const cy = 50 + (i * 67) % (H * 0.4);
      const nx = ((cx % (W + 400)) + W + 400) % (W + 400) - 200;
      if (nx >= 0 && nx <= W) ctx.fillText(cs[i], nx, cy);
    }
    
    // Upgraded building silhouette pass with deterministic lit windows and beacons
    for (let i = 0; i < 25; i++) {
      const bx = ((i * 280) - camera.x * 0.12) % (W + 500) - 250;
      const bw = 50 + (i * 37) % 90, bh = 30 + (i * 53) % 140;
      const nx = ((bx % (W + 500)) + W + 500) % (W + 500) - 250;
      if (nx <= -bw || nx >= W+bw) continue;

      ctx.fillStyle = "rgba(255,255,255,0.025)";
      ctx.fillRect(nx, GROUND_Y - bh, bw, bh);

      ctx.fillStyle = `${zone.accent}22`;
      for (let wy = GROUND_Y - bh + 8; wy < GROUND_Y - 6; wy += 14)
        for (let wx = nx + 6; wx < nx + bw - 6; wx += 12)
          if ((Math.floor(wx)*7 + Math.floor(wy)*13 + i) % 5 === 0) ctx.fillRect(wx, wy, 4, 6);

      if (i % 4 === 0) {
        ctx.strokeStyle = "rgba(255,255,255,0.04)";
        ctx.beginPath(); ctx.moveTo(nx+bw/2, GROUND_Y-bh); ctx.lineTo(nx+bw/2, GROUND_Y-bh-18); ctx.stroke();
        ctx.fillStyle = "#ff006655";
        ctx.beginPath(); ctx.arc(nx+bw/2, GROUND_Y-bh-18, 1.5+Math.sin(t*3)*0.5, 0, Math.PI*2); ctx.fill();
      }
    }
  }

  // Foreground Silhouette Parallax
  const fgColor = zone.name === "AGRICULTURE" ? "#1a1505" : "#050a10";
  ctx.fillStyle = fgColor;
  for(let i=0; i<15; i++) {
    const px = ((i * 350) - camera.x * 1.4) % (W + 600);
    const nx = ((px % (W + 600)) + W + 600) % (W + 600) - 300;
    if(nx > -200 && nx < W + 100) {
      const h = 20 + (i * 47) % 60;
      const w = 40 + (i * 71) % 80;
      ctx.fillRect(nx, H - 30 - h, w, h);
    }
  }

  // Grid
  ctx.strokeStyle = "rgba(0,255,255,0.02)"; ctx.lineWidth = 1;
  const gO = (-camera.x * 0.25) % 50;
  for (let gx = gO - 50; gx < W + 50; gx += 50) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
  for (let gy = 0; gy < H; gy += 50) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
  
  // Ground
  const gG = ctx.createLinearGradient(0, GROUND_Y, 0, GROUND_Y + 6);
  gG.addColorStop(0, zone.grass); gG.addColorStop(1, zone.ground);
  ctx.fillStyle = gG; ctx.fillRect(0, GROUND_Y, W, 6);
  ctx.fillStyle = zone.ground; ctx.fillRect(0, GROUND_Y + 6, W, H - GROUND_Y - 6);
  
  ctx.fillStyle = "rgba(255,255,255,0.015)";
  const tO = (-camera.x * 0.5) % 40;
  for (let tx = tO - 40; tx < W + 40; tx += 40) {
    ctx.fillRect(tx, GROUND_Y + 14, 18, 2);
    ctx.fillRect(tx + 12, GROUND_Y + 30, 14, 2);
  }
}
