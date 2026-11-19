"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { BLOCK_CONTENT, ALL_KEYS, GUIDE, CLI_COMMANDS, GRAVITY, JUMP_FORCE, MOVE_SPEED, FRICTION, MAX_FALL, PLAYER_W, PLAYER_H, WORLD_WIDTH, FINISH_X, ZONES, getMinigameCategory } from "../data/gameContent";
import { buildWorld } from "./game/Engine";
import { getZone, drawPlayer, drawGuide, drawCoin, drawBlock, drawSign, drawImageFrame, drawFinishLine, spawnBlockParticles, spawnCoinParticles, drawBackgroundElements } from "./game/Renderer";
import { createAuraState, updateGitTrail, drawGitTrail, drawBinaryRainState, spawnCircuitBurst, spawnNeuralBurst, updateAuraBursts, drawAuraBursts, getTimeOfDayOverlay, getAgricultureLocalLight } from "./game/aura/AuraSystem";
import GlobeGallery from "./game/GlobeGallery";
import MagicalPortal from "./game/MagicalPortal";
import SkillTree from "./game/SkillTree";
import GuideBubble from "./game/GuideBubble";
import { MINIGAME_REGISTRY } from "./minigames/registry";
import { useGameStore } from "../state/gameStore";
import { detectGraphicsTier } from "../lib/detectGraphicsTier";
import CrateReveal from "./game/reveal/CrateReveal";
import HolographicCard from "./game/reveal/HolographicCard";
import CrystalShatterReveal from "./game/reveal/CrystalShatterReveal";
import TerminalBreach from "./minigames/terminalBreach/TerminalBreach";
import CylinderCarousel from "./ui/CylinderCarousel";
import ImageWithLoader from "./ui/ImageWithLoader";

// Accessibility & Preferences
const prefersReducedMotion = typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;

// Audio System (Upgraded to authored synths)
let audioCtx = null;
function getAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); return audioCtx; }
function playLayeredTone(f1, f2, d, type1="sine", type2="square", v=0.04) {
  try {
    const c = getAudio();
    const g = c.createGain();
    g.gain.value = v;
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + d);
    g.connect(c.destination);

    const o1 = c.createOscillator(); o1.type = type1; o1.frequency.value = f1; o1.connect(g); o1.start(); o1.stop(c.currentTime + d);
    const o2 = c.createOscillator(); o2.type = type2; o2.frequency.value = f2; o2.connect(g); o2.start(); o2.stop(c.currentTime + d);
  } catch (e) {}
}
function sfxJump() { playLayeredTone(300, 350, 0.15, "triangle", "sine", 0.05); setTimeout(() => playLayeredTone(500, 600, 0.1, "sine", "sine", 0.05), 30); }
let lastCoinSfx = 0;
function sfxCoin() {
  const now = performance.now();
  if (now - lastCoinSfx < 55) return;
  lastCoinSfx = now;
  playLayeredTone(988, 1046, 0.1, "sine", "triangle", 0.03); setTimeout(() => playLayeredTone(1319, 1396, 0.15, "sine", "triangle", 0.03), 40);
  if (!prefersReducedMotion && navigator.vibrate) try { navigator.vibrate(20); } catch(e){}
}
function sfxBlock() { 
  playLayeredTone(150, 180, 0.1, "square", "triangle", 0.05); setTimeout(() => playLayeredTone(300, 350, 0.2, "square", "sine", 0.05), 40); 
  if (!prefersReducedMotion && navigator.vibrate) try { navigator.vibrate(40); } catch(e){}
}
function sfxPortal() { playLayeredTone(150, 155, 0.4, "sine", "sawtooth", 0.06); setTimeout(() => playLayeredTone(300, 310, 0.5, "sine", "sawtooth", 0.06), 100); }
function sfxFinish() { playLayeredTone(523, 659, 0.2); setTimeout(() => playLayeredTone(659, 784, 0.2), 150); setTimeout(() => playLayeredTone(784, 1047, 0.4), 300); }
function sfxToast() { playLayeredTone(880, 890, 0.1); setTimeout(() => playLayeredTone(1760, 1780, 0.2), 80); }
function sfxZone() { playLayeredTone(220, 222, 0.3, "sine", "triangle"); setTimeout(() => playLayeredTone(440, 444, 0.4, "sine", "triangle"), 150); }

// Error Boundary for WebGL Fallback
import React from 'react';
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <div style={{padding:'20px', color:'cyan', background:'#111', border:'1px solid cyan'}}>WebGL Render Error (Fallen back to 2D)</div>;
    return this.props.children;
  }
}

// TypeWriter Component
function TypeWriter({ text }) {
  const [d, setD] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setD(""); setDone(false); let i = 0;
    const iv = setInterval(() => {
      i++; setD(text.slice(0, i));
      if (i >= text.length) { clearInterval(iv); setDone(true); }
    }, 18);
    return () => clearInterval(iv);
  }, [text]);
  return <>{d}{!done && <span className="cursor-blink" />}</>;
}

export default function PortfolioGame() {
  const canvasRef = useRef(null), musicRef = useRef(null), gameRef = useRef(null);
  const stateRef = useRef({
    cardShowing: false,
    minigameShowing: false,
  });
  
  const minigamePlayCounts = useRef({
    lattice: 0,
    rhythm: 0,
    circuit: 0
  });

  const [started, setStarted] = useState(false);
  const [preloading, setPreloading] = useState(true);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [titleHidden, setTitleHidden] = useState(false);
  const [activeCard, setActiveCard] = useState(null);
  const [score, setScore] = useState(0);
  const [coinCount, setCoinCount] = useState(0);
  const [zoneName, setZoneName] = useState("START");
  const [zoneLabel, setZoneLabel] = useState("");
  const [progress, setProgress] = useState(0);
  const [guideMsg, setGuideMsg] = useState(null);
  const [guideBubblePos, setGuideBubblePos] = useState({ x: 60, y: 60 });
  const [blockHint, setBlockHint] = useState(null);
  const [blockHintPos, setBlockHintPos] = useState({ x: 0, y: 0 });
  const [musicOn, setMusicOn] = useState(true);
  const [sfxOn, setSfxOn] = useState(true);
  const [cliLines, setCliLines] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [showFinish, setShowFinish] = useState(false);
  const [finishShown, setFinishShown] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [skillTreeActive, setSkillTreeActive] = useState(false);
  const [skillTreeDismissed, setSkillTreeDismissed] = useState(false);
  const [minigame, setMinigame] = useState(null); // { category, content, block }
  const [playTime, setPlayTime] = useState(0);
  const bestTime = useGameStore((s) => s.bestTime);
  const setBestTime = useCallback((t) => useGameStore.getState().bestTime !== t && useGameStore.setState({ bestTime: t }), []);

  // Reveal state machine (idle -> impact -> crate -> card)
  const [revealStage, setRevealStage] = useState("idle");
  const [revealAnchor, setRevealAnchor] = useState(null);
  const [revealAccent, setRevealAccent] = useState("#00ffff");
  const [revealContent, setRevealContent] = useState(null);
  const [revealContentKey, setRevealContentKey] = useState(null);

  // Graphics tier (resolved once)
  const [graphicsTier] = useState(() => {
    if (typeof window === "undefined") return "medium";
    const stored = useGameStore.getState().graphicsTier;
    return stored === "auto" ? detectGraphicsTier() : stored;
  });
  
  const auraStateRef = useRef(createAuraState());

  // Mobile Controls State mapped to keys object
  const keysRef = useRef({});

  const showToast = useCallback((msg) => {
    if(sfxOn) sfxToast();
    const id = Date.now();
    setToasts(t => [...t, { id, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, [sfxOn]);
  
  // Rolling score counter
  const scoreSpring = useSpring(0, { bounce: 0, duration: 800 });
  const scoreDisplay = useTransform(scoreSpring, v => Math.round(v));
  
  useEffect(() => {
    scoreSpring.set(score);
  }, [score, scoreSpring]);

  // Show tutorial overlay for touch / mobile users
  useEffect(() => {
    if (!started) return;
    // Detect touch: use matchMedia + ontouchstart for reliability
    const isTouch = typeof window !== "undefined" && (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(pointer: coarse)").matches
    );
    if (isTouch) {
      // Small delay so the UI is settled
      const delay = setTimeout(() => {
        setShowTutorial(true);
        const hide = setTimeout(() => setShowTutorial(false), 6000);
        return () => clearTimeout(hide);
      }, 500);
      return () => clearTimeout(delay);
    }
  }, [started]);

  const toggleMusic = useCallback(() => {
    setMusicOn(p => {
      const n = !p;
      if (musicRef.current) { if (n) musicRef.current.play().catch(() => { }); else musicRef.current.pause(); }
      return n;
    });
  }, []);
  const toggleSfx = useCallback(() => setSfxOn(p => !p), []);

  const skipToHighlights = useCallback(() => {
    setStarted(true); setTimeout(() => setTitleHidden(true), 1000);
    try { getAudio().resume(); } catch (e) {}
    if(sfxOn && !musicRef.current) {
      const a = new Audio("/Happy and Fun Pop Background Music For Videos.mp3");
      a.loop = true; a.volume = 0.15; a.play().catch(() => {}); musicRef.current = a;
    }
    showToast("Recruiter Mode: Skipping to Projects");
    if (gameRef.current && gameRef.current.camera) {
      // 6400 is the PROJECTS zone
      gameRef.current.camera.x = 6200;
      // We also need to move the player! But player is scoped inside useEffect.
      // We can pass a hint via stateRef
      stateRef.current.recruiterSkip = true;
    }
  }, [showToast, sfxOn]);

  const startGame = useCallback(() => {
    setStarted(true); setTimeout(() => setTitleHidden(true), 1000);
    try { getAudio().resume(); } catch (e) { }
    const a = new Audio("/Happy and Fun Pop Background Music For Videos.mp3");
    a.loop = true; a.volume = 0.15; a.play().catch(() => { }); musicRef.current = a;
    showToast("System Boot Sequence Initiated");
  }, [showToast]);

  const openCard = useCallback((content) => {
    setActiveCard(content);
    stateRef.current.cardShowing = true;
  }, []);

  const onCrateDone = useCallback(() => {
    setRevealStage("card");
    stateRef.current.cardShowing = true;
  }, []);

  const closeCard = useCallback(() => {
    setActiveCard(null);
    setRevealStage("idle");
    setRevealContent(null);
    setRevealContentKey(null);
    setRevealAnchor(null);
    stateRef.current.cardShowing = false;
  }, []);

  // Mini-games are a skippable pre-step before the existing card+takeover flow —
  // they never fork the card system, just delay it by a few seconds at most.
  const minigameRef = useRef(null);
  const finishMinigame = useCallback((bonus) => {
    const mg = minigameRef.current;
    minigameRef.current = null;
    stateRef.current.minigameShowing = false;
    setMinigame(null);
    if (mg) {
      const g = gameRef.current;
      if (g && g.proceedToCard) g.proceedToCard(mg.block, mg.content, bonus);
    }
  }, []);
  const skipMinigame = useCallback(() => finishMinigame(0), [finishMinigame]);

  // CLI terminal effect

  useEffect(() => {
    const dummyWorld = buildWorld(500);
    const { imageFrames } = dummyWorld;
    const imgKeys = Object.keys(BLOCK_CONTENT).filter(k => BLOCK_CONTENT[k].image);
    let loadedCount = 0;
    const totalToLoad = imageFrames.length + imgKeys.length;
    
    if (totalToLoad === 0) {
      setPreloading(false);
      return;
    }
    
    const onLoadStep = () => {
      loadedCount++;
      setPreloadProgress(Math.floor((loadedCount / totalToLoad) * 100));
      if (loadedCount >= totalToLoad) setPreloading(false);
    };

    imageFrames.forEach(f => { const im = new Image(); im.onload = onLoadStep; im.onerror = onLoadStep; im.src = f.src; });
    imgKeys.forEach(key => { const im = new Image(); im.onload = onLoadStep; im.onerror = onLoadStep; im.src = BLOCK_CONTENT[key].image; });
  }, []);

  useEffect(() => {
    if (!started) return;
    let idx = 0;
    const iv = setInterval(() => {
      setCliLines(prev => { const next = [...prev, CLI_COMMANDS[idx % CLI_COMMANDS.length]]; return next.slice(-8); });
      idx++;
    }, 1800);
    return () => clearInterval(iv);
  }, [started]);

  // Remove expired vehicles
  useEffect(() => {
    if (vehicles.length === 0) return;
    const t = setTimeout(() => setVehicles(v => v.filter(x => Date.now() - x.t < 2500)), 2600);
    return () => clearTimeout(t);
  }, [vehicles]);

  // Unified content trigger — replaces 4 duplicated trigger patterns.
  // Called from: canvas click, block-hit collision, Enter-key, portal/photo overlap.
  const triggerContent = useCallback((b, content, sourceType = "2d", ignoreMinigame = false) => {
    const category = getMinigameCategory(b.contentKey);
    const anchor = b.screenX != null
      ? { x: b.screenX + b.w / 2, y: b.screenY, accent: getZone(b.x).accent }
      : null; // null = 3D-sourced trigger, reveal anchors to screen-center

    const zone = getZone(b.x);
    setRevealAccent(zone.accent);
    setRevealContent(content);
    setRevealContentKey(b.contentKey);

    if (content.vehicle) setVehicles(v => [...v, { emoji: content.vehicle, y: Math.random()*200+100, t: Date.now() }]);

    // Activate the background takeover image
    if (gameRef.current) {
      const { takeover: tk, preloadedImages: pi } = gameRef.current;
      const ti = pi?.[b.contentKey] || b.imgObj;
      if (tk && ti) {
        tk.active = true; tk.img = ti; tk.targetOpacity = 0.65;
        tk.scale = 1; tk.scaleDir = 0.0003; tk.triggerX = b.x;
        tk.tintColor = zone.accent + "25";
      }
    }

    let shouldPlayMinigame = category && !stateRef.current.cardShowing && !ignoreMinigame;
    
    if (shouldPlayMinigame && (category === "lattice" || category === "rhythm" || category === "circuit")) {
      const maxPlays = category === "rhythm" ? 2 : 1;
      if (minigamePlayCounts.current[category] >= maxPlays) {
        shouldPlayMinigame = false;
      } else {
        minigamePlayCounts.current[category]++;
      }
    }

    if (shouldPlayMinigame) {
      stateRef.current.minigameShowing = true;
      minigameRef.current = { category, content, block: b };
      setMinigame({ category, content, block: b });
    } else {
      // No minigame — go straight to reveal
      setRevealAnchor(anchor);
      setRevealStage(prefersReducedMotion ? "card" : "crate");
      stateRef.current.cardShowing = true;
    }
  }, []);

  // Canvas click handler
  const handleCanvasClick = useCallback((e) => {
    if (!gameRef.current || stateRef.current.cardShowing || stateRef.current.minigameShowing) return;
    const { blocks, camera } = gameRef.current;
    const rect = e.target.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;

    for (const b of blocks) {
      if(b.type === "hover") continue;
      const bx = b.x - camera.x, by = b.y + b.bounceY;
      if (mx >= bx && mx <= bx + b.w && my >= by && my <= by + b.h) {
        const content = BLOCK_CONTENT[b.contentKey];
        if (content) {
          triggerContent(b, content, "2d");
          return;
        }
      }
    }
  }, [triggerContent]);

  useEffect(() => {
    if (!started) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = window.innerWidth, H = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, graphicsTier === "low" ? 1 : 2);
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let GROUND_Y = H - 90;
    
    const world = buildWorld(GROUND_Y);
    const { platforms, blocks, coins, signs, imageFrames, particles } = world;


    const preloadedImages = {};
    const imgKeys = Object.keys(BLOCK_CONTENT).filter(k => BLOCK_CONTENT[k].image);
    // Because they were preloaded on mount, these will hit cache and trigger onload instantly.
    imgKeys.forEach(key => {
      const img = new Image();
      img.onload = () => { preloadedImages[key] = img; };
      img.src = BLOCK_CONTENT[key].image;
    });

    
    blocks.forEach(b => {
      if(b.type === "photo") {
        const c = BLOCK_CONTENT[b.contentKey];
        if(c && c.image) {
           const im = new Image();
           im.onload = () => { b.imgObj = im; };
           im.src = c.image;
        }
      }
    });

    let startX = 80;
    if (stateRef.current.recruiterSkip) startX = 6350;
    else if (typeof window !== "undefined" && window.location.search.includes("zone=projects")) startX = 6350;
    const player = { x: startX, y: GROUND_Y - PLAYER_H, vx: 0, vy: 0, facing: 1, grounded: false, walking: false, walkFrame: 0, screenX: 0, screenY: 0, squash: 0, coyoteFrames: 0, jumpBuffer: 0 };
    const camera = { x: 0, targetX: 0, targetY: 0 };
    const guide = { x: 40, y: GROUND_Y - 55 };
    let time = 0, currentZoneName = "START", scoreVal = 0, coinVal = 0, lastGuideIdx = -1;
    let hitStop = 0, shakeTimer = 0;

    const takeover = { active: false, img: null, opacity: 0, targetOpacity: 0, scale: 1, scaleDir: 0.0003, tintColor: "rgba(0,255,255,0.12)", triggerX: 0 };

    gameRef.current = { blocks, imageFrames, camera, takeover, preloadedImages, hitStop: 0, shakeTimer: 0 };

    // Shared "open this block's card" step — used directly for blocks with no
    // mini-game, and as the completion step once a mini-game finishes/is skipped.
    function proceedToCard(b, content, bonus) {
      if (bonus) { scoreVal += bonus; setScore(scoreVal); }
      triggerContent(b, content, "2d", true);
    }
    gameRef.current.proceedToCard = proceedToCard;

    const keys = keysRef.current;
    const onKeyDown = (e) => { 
      keys[e.code] = true; 
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter"].includes(e.code)) e.preventDefault(); 
      if (stateRef.current.cardShowing) { 
        if (e.code === "Escape") closeCard();
        else if (e.code === "Enter" && !(e.target && e.target.closest && e.target.closest("a, button"))) closeCard();
      } else if (stateRef.current.minigameShowing) {
        // mini-game components handle their own key input; ignore global shortcuts here
      } else {
        if (e.code === "Enter") {
          // Open closest block if near
          let closest = null, minDist = 200;
          for (const b of blocks) {
            if (b.type === "block" || b.type === "portal" || b.type === "photo" || b.type === "hover") {
              const dist = Math.abs((player.x + PLAYER_W/2) - (b.x + b.w/2));
              if (dist < minDist) { minDist = dist; closest = b; }
            }
          }
          if (closest && closest.contentKey && minDist < 150) {
            const content = BLOCK_CONTENT[closest.contentKey];
            if (content) {
              triggerContent(closest, content, "2d");
            }
          }
        }
      }
    };
    const onKeyUp = (e) => { keys[e.code] = false; };
    window.addEventListener("keydown", onKeyDown); window.addEventListener("keyup", onKeyUp);
    const onResize = () => { 
      W = window.innerWidth; H = window.innerHeight; 
      const dpr = Math.min(window.devicePixelRatio || 1, graphicsTier === "low" ? 1 : 2);
      canvas.width = W * dpr; canvas.height = H * dpr; 
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); 

      // Shift world vertically to match new GROUND_Y
      const newGround = H - 90;
      const diffY = newGround - GROUND_Y;
      if (diffY !== 0) {
        GROUND_Y = newGround;
        player.y += diffY;
        guide.y += diffY;
        platforms.forEach(p => p.y += diffY);
        blocks.forEach(b => b.y += diffY);
        coins.forEach(c => c.y += diffY);
        signs.forEach(s => s.y += diffY);
        imageFrames.forEach(f => f.y += diffY);
        particles.forEach(p => p.y += diffY);
      }
    };
    window.addEventListener("resize", onResize);

    let animId, lastTime = performance.now();

    function update(dt) {
      if (stateRef.current.cardShowing || stateRef.current.minigameShowing) return;
      if (gameRef.current.hitStop > 0) {
        gameRef.current.hitStop -= dt;
        return;
      }
      if (gameRef.current.shakeTimer > 0) {
        gameRef.current.shakeTimer -= dt;
      }
      
      const p = player;
      p.walking = false;
      
      const left = keys.ArrowLeft || keys.KeyA || keys.TouchLeft;
      const right = keys.ArrowRight || keys.KeyD || keys.TouchRight;
      const jump = keys.Space || keys.ArrowUp || keys.KeyW || keys.TouchJump;

      if (left) { p.vx = -MOVE_SPEED; p.facing = -1; p.walking = true; }
      else if (right) { p.vx = MOVE_SPEED; p.facing = 1; p.walking = true; }
      else { p.vx *= FRICTION; if (Math.abs(p.vx) < 0.2) p.vx = 0; }
      
      if (p.grounded) { p.coyoteFrames = 5; } else { p.coyoteFrames -= dt; }
      if (jump) { p.jumpBuffer = 5; } else { p.jumpBuffer -= dt; }
      
      if (p.jumpBuffer > 0 && p.coyoteFrames > 0 && p.vy >= -4) { 
        p.vy = JUMP_FORCE; p.grounded = false; p.coyoteFrames = 0; p.jumpBuffer = 0; p.squash = 1; if(sfxOn) sfxJump(); 
      }
      if (!jump && p.vy < -4) p.vy = -4;
      
      if (p.squash > 0) p.squash -= 0.1 * dt;
      
      p.vy += GRAVITY * dt; if (p.vy > MAX_FALL) p.vy = MAX_FALL;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < 0) p.x = 0; if (p.x > WORLD_WIDTH - PLAYER_W) p.x = WORLD_WIDTH - PLAYER_W;
      
      p.grounded = false;
      if (p.y + PLAYER_H >= GROUND_Y) { p.y = GROUND_Y - PLAYER_H; p.vy = 0; p.grounded = true; }
      
      for (const pl of platforms) {
        if (p.x + PLAYER_W > pl.x && p.x < pl.x + pl.w && p.y + PLAYER_H >= pl.y && p.y + PLAYER_H <= pl.y + pl.h + 10 && p.vy >= 0) {
          p.y = pl.y - PLAYER_H; p.vy = 0; p.grounded = true;
        }
      }

      for (const b of blocks) {
        if (b.type === "block" && p.x + PLAYER_W > b.x && p.x < b.x + b.w && p.y + PLAYER_H >= b.y + b.bounceY && p.y + PLAYER_H <= b.y + b.bounceY + b.h + 10 && p.vy >= 0) {
          p.y = b.y + b.bounceY - PLAYER_H; p.vy = 0; p.grounded = true;
        }

        const content = BLOCK_CONTENT[b.contentKey];

        if (b.type === "block") {
          if (!b.hit && p.x + PLAYER_W > b.x + 4 && p.x < b.x + b.w - 4 && p.y <= b.y + b.h + b.bounceY && p.y >= b.y + b.h + b.bounceY - 14 && p.vy < 0) {
            b.hit = true; b.bounceV = -6; p.vy = 2; if(sfxOn) sfxBlock(); spawnBlockParticles(particles, b.x, b.y);
            if (!prefersReducedMotion) { gameRef.current.hitStop = 2; gameRef.current.shakeTimer = 8; }
            const zAccent = getZone(b.x).accent;
            spawnCircuitBurst(auraStateRef.current, b.x + 21, b.y, zAccent);
            scoreVal += 500; setScore(scoreVal);
            if (content) {
              triggerContent(b, content, "2d");
            }
          }
        } else if (b.type === "portal" || b.type === "photo") {
          const isPhoto = b.type === "photo";
          const overlap = isPhoto 
            ? Math.abs((p.x + PLAYER_W/2) - (b.x + b.w/2)) < 60
            : p.x + PLAYER_W > b.x && p.x < b.x + b.w && p.y + PLAYER_H > b.y && p.y < b.y + b.h;
          
          if (overlap && !b.triggerActive) {
            b.triggerActive = true;
            if(sfxOn) { if(b.type === "portal") sfxPortal(); else sfxBlock(); }
            if (!prefersReducedMotion) { gameRef.current.hitStop = 3; gameRef.current.shakeTimer = 10; }
            spawnCircuitBurst(auraStateRef.current, b.x + b.w / 2, b.y, getZone(b.x).accent);
            scoreVal += b.type === "portal" ? 1000 : 300; setScore(scoreVal);
            if (content) {
              triggerContent(b, content, "2d");
            }
          } else if (!overlap && b.triggerActive) {
            b.triggerActive = false;
          }
        } else if (b.type === "hover") {
          const dist = Math.abs(p.x + PLAYER_W/2 - (b.x + b.w/2));
          if(dist < 150) {
            b.hoverProgress += (1 - b.hoverProgress) * 0.1 * dt;
            if(dist < 50 && !b.triggerActive) {
              b.triggerActive = true; sfxBlock();
              if (content) openCard(content);
            }
          } else {
            b.hoverProgress += (0 - b.hoverProgress) * 0.1 * dt;
            b.triggerActive = false;
          }
        }
      }

      for (const b of blocks) { if (b.bounceV) { b.bounceY += b.bounceV; b.bounceV += 0.6; if (b.bounceY >= 0) { b.bounceY = 0; b.bounceV = 0; } } }
      
      for (const c of coins) {
        if (c.collected) continue;
        const dx = (p.x + PLAYER_W / 2) - (c.x + 10);
        const dy = (p.y + PLAYER_H / 2) - (c.y + 10);
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 40) {
          c.x += (dx / dist) * 8 * dt;
          c.y += (dy / dist) * 8 * dt;
        }
        if (dist < 22) {
          c.collected = true; if(sfxOn) sfxCoin(); coinVal++; scoreVal += 100; setScore(scoreVal); setCoinCount(coinVal); spawnCoinParticles(particles, c.x, c.y);
        }
      }

      if (p.walking && p.grounded) p.walkFrame += 0.15 * dt;
      const tcx = p.x - W * 0.33; camera.x += (tcx - camera.x) * 0.08 * dt; camera.x = Math.max(0, Math.min(WORLD_WIDTH - W, camera.x));
      
      p.screenX = p.x - camera.x; p.screenY = p.y;
      platforms.forEach(pl => { pl.screenX = pl.x - camera.x; pl.screenY = pl.y; });
      blocks.forEach(b => { b.screenX = b.x - camera.x; b.screenY = b.y; });
      coins.forEach(c => { c.screenX = c.x - camera.x; c.screenY = c.y; });
      signs.forEach(s => { s.screenX = s.x - camera.x; s.screenY = s.y; });
      imageFrames.forEach(f => { f.screenX = f.x - camera.x; f.screenY = f.y; });
      
      for (let i = particles.length - 1; i >= 0; i--) {
        const pr = particles[i]; pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.vy += 0.3 * dt; pr.life -= 0.025 * dt;
        if (pr.life <= 0) particles.splice(i, 1);
      }

      updateGitTrail(auraStateRef.current, p.x, p.y, WORLD_WIDTH);
      updateAuraBursts(auraStateRef.current, dt);

      const z = getZone(p.x);
      if (z.name !== currentZoneName) {
        currentZoneName = z.name; setZoneName(z.name); setZoneLabel(z.label);
        sfxZone(); scoreVal += 2000; setScore(scoreVal); showToast(`Entered ${z.name}`);
        setTimeout(() => setZoneLabel(""), 3000);
        
        if (z.name === "SKILLS") {
          setSkillTreeDismissed(false); // Reset dismissal on entry
          setSkillTreeActive(true);
          spawnNeuralBurst(auraStateRef.current, p.x + PLAYER_W / 2, p.y - 20, z.accent);
        } else {
          setSkillTreeActive(false);
        }
      }
      
      setProgress(Math.min(100, Math.round((p.x / WORLD_WIDTH) * 100)));
      guide.x += ((p.x - 45) - guide.x) * 0.035 * dt; guide.y += ((p.y - 35) - guide.y) * 0.035 * dt;
      
      for (let i = 0; i < GUIDE.length; i++) {
        if (p.x >= GUIDE[i].x - 50 && p.x <= GUIDE[i].x + 120 && i !== lastGuideIdx) {
          lastGuideIdx = i; setGuideMsg(GUIDE[i].msg);
          setGuideBubblePos({ x: Math.min(W - 360, Math.max(20, guide.x - camera.x)), y: Math.max(20, guide.y + 50) });
          setTimeout(() => setGuideMsg(null), 6000); break;
        }
      }

      let fh = false;
      for (const b of blocks) {
        if(b.type !== "block" && b.type !== "hover") continue;
        const dist = Math.abs(p.x + PLAYER_W / 2 - (b.x + b.w / 2));
        if (dist < 100) {
          const c = BLOCK_CONTENT[b.contentKey];
          if (c && c.hint) { setBlockHint(b.hit ? `${c.hint} (click to re-open)` : c.hint); setBlockHintPos({ x: b.screenX + b.w / 2 - 50, y: b.screenY - 24 }); fh = true; break; }
        }
      }
      if (!fh) setBlockHint(null);

      if (p.x >= FINISH_X && !finishShown) {
        setFinishShown(true); if(sfxOn) sfxFinish(); showToast("Odyssey Complete!");
        if (!prefersReducedMotion) { gameRef.current.hitStop = 5; gameRef.current.shakeTimer = 20; }
        const finalTime = (time / 60).toFixed(2); // approximate seconds
        const currentBest = useGameStore.getState().bestTime;
        if (!currentBest || parseFloat(finalTime) < parseFloat(currentBest)) {
          setBestTime(finalTime);
        }
        setTimeout(() => setShowFinish(true), 1500);
      }

      if (takeover.active) {
        takeover.opacity += (takeover.targetOpacity - takeover.opacity) * 0.04 * dt;
        takeover.scale += takeover.scaleDir * dt;
        if (takeover.scale > 1.15 || takeover.scale < 1) takeover.scaleDir *= -1;
        
        const distToTrigger = Math.abs(p.x - takeover.triggerX);
        if(distToTrigger > 400 && !stateRef.current.cardShowing) {
           takeover.targetOpacity = 0;
        }

        if (takeover.opacity < 0.01 && takeover.targetOpacity === 0) { takeover.active = false; takeover.opacity = 0; }
      }
      time += 0.016 * dt;
    }

    function render() {
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      if (gameRef.current && gameRef.current.shakeTimer > 0) {
        const amt = gameRef.current.shakeTimer * 0.5;
        ctx.translate((Math.random()-0.5)*amt, (Math.random()-0.5)*amt);
      }
      const zone = getZone(player.x);
      const progressPct = Math.min(100, (player.x / WORLD_WIDTH) * 100);
      const timeOfDay = getTimeOfDayOverlay(progressPct);
      const agriLight = zone.name === "AGRICULTURE" ? getAgricultureLocalLight(player.x, zone) : null;

      drawBackgroundElements(ctx, zone, W, H, camera, time, GROUND_Y, timeOfDay, agriLight);
      drawBinaryRainState(ctx, auraStateRef.current, W, H, camera, time, zone);
      drawGitTrail(ctx, auraStateRef.current, camera, W);

      if (takeover.active && takeover.opacity > 0 && takeover.img) {
        ctx.save(); ctx.globalAlpha = takeover.opacity;
        const sc = takeover.scale, iw = takeover.img.width, ih = takeover.img.height;
        const coverScale = Math.max(W / iw, H / ih) * sc, dw = iw * coverScale, dh = ih * coverScale;
        const dx = (W - dw) / 2, dy = (H - dh) / 2;
        ctx.drawImage(takeover.img, dx, dy, dw, dh);
        ctx.fillStyle = takeover.tintColor; ctx.fillRect(0, 0, W, H);
        const vig = ctx.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, W * 0.7);
        vig.addColorStop(0, "rgba(0,0,0,0)"); vig.addColorStop(1, "rgba(0,0,0,0.7)");
        ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }

      for (const pl of platforms) {
        if (pl.screenX > W + 50 || pl.screenX + pl.w < -50) continue;
        const pG = ctx.createLinearGradient(0, pl.screenY, 0, pl.screenY + pl.h);
        pG.addColorStop(0, "#4a8a4a"); pG.addColorStop(1, "#2a5a2a");
        ctx.fillStyle = pG; ctx.fillRect(pl.screenX, pl.screenY, pl.w, pl.h);
        ctx.fillStyle = "#5aaa5a"; ctx.fillRect(pl.screenX, pl.screenY, pl.w, 3);
        ctx.strokeStyle = "rgba(0,0,0,0.12)"; ctx.lineWidth = 1;
        for (let bx = pl.screenX; bx < pl.screenX + pl.w; bx += 22) { ctx.beginPath(); ctx.moveTo(bx, pl.screenY); ctx.lineTo(bx, pl.screenY + pl.h); ctx.stroke(); }
      }

      const flx = FINISH_X - camera.x; if (flx > -100 && flx < W + 100) drawFinishLine(ctx, flx, GROUND_Y, time);
      for (const f of imageFrames) { if (f.screenX > W + 50 || f.screenX + f.w < -50) continue; drawImageFrame(ctx, f, time); }
      for (const b of blocks) { if (b.screenX > W + 100 || b.screenX + b.w < -100) continue; drawBlock(ctx, b, time); }
      for (const c of coins) { if (c.collected || c.screenX > W + 30 || c.screenX < -30) continue; drawCoin(ctx, c.screenX, c.screenY, time); }
      for (const s of signs) { if (s.screenX > W + 300 || s.screenX < -300) continue; drawSign(ctx, s); }
      
      drawGuide(ctx, guide.x - camera.x, guide.y, time);
      drawPlayer(ctx, player, zone.accent);
      
      for (const pr of particles) {
        ctx.globalAlpha = pr.life; ctx.fillStyle = pr.color; ctx.fillRect(pr.x - camera.x, pr.y, pr.size, pr.size);
      }
      ctx.globalAlpha = 1;
      drawAuraBursts(ctx, auraStateRef.current, camera);

      for (const z of ZONES) {
        const lx = z.x1 - camera.x;
        if (lx > 10 && lx < W - 10 && z.x1 > 0) {
          ctx.strokeStyle = `${z.accent}40`; ctx.lineWidth = 2; ctx.setLineDash([5, 10]);
          ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, H); ctx.stroke(); ctx.setLineDash([]);
        }
      }
      ctx.restore();
    }

    function loop(ts) {
      const dt = Math.min((ts - lastTime) / 16.67, 3); lastTime = ts;
      update(dt); render(); animId = requestAnimationFrame(loop);
    }
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); window.removeEventListener("resize", onResize);
      if (musicRef.current) { musicRef.current.pause(); musicRef.current = null; }
    };
  }, [started, openCard, closeCard]);

  // Mobile touch handlers
  const handleTouchStart = (dir) => { keysRef.current[dir] = true; };
  const handleTouchEnd = (dir) => { keysRef.current[dir] = false; };
  
  const swipeRef = useRef({ y: 0 });
  const onTouchStart = (e) => { swipeRef.current.y = e.touches[0].clientY; };
  const onTouchEnd = (e) => { 
    if(swipeRef.current.y - e.changedTouches[0].clientY > 40) {
      keysRef.current['TouchJump'] = true;
      setTimeout(() => keysRef.current['TouchJump'] = false, 150);
    }
  };

  return (
    <div className="game-wrap" style={{ userSelect: 'none' }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {started && zoneName !== "AGRICULTURE" && (
        <div className="cli-terminal">
          {cliLines.map((l, i) => <div key={i} className="cli-line">{l.startsWith("$") ? <><span className="cli-prompt">falcon@argus</span> {l}</> : l}</div>)}
        </div>
      )}
      {started && zoneName === "AGRICULTURE" && (
        <div className="cli-terminal agri-terminal">
          <div className="cli-line"><span className="cli-prompt">verifarm</span> [SYS] Monitoring soil moisture... 42%</div>
          <div className="cli-line"><span className="cli-prompt">verifarm</span> [SYS] Crop yield optimization active</div>
          <div className="cli-line"><span className="cli-prompt">verifarm</span> [SYS] Drone fleet: Standby</div>
        </div>
      )}
      <canvas ref={canvasRef} onClick={handleCanvasClick} />
      <div className="crt-overlay" />

      {preloading && (
        <div className="title-screen">
          <p className="title-sub" style={{color: 'cyan'}}>INITIALIZING SYSTEMS... {preloadProgress}%</p>
          <div style={{width: '200px', height: '4px', background: '#333', margin: '20px auto', position: 'relative'}}>
            <div style={{width: `${preloadProgress}%`, height: '100%', background: 'cyan', transition: 'width 0.2s'}}/>
          </div>
        </div>
      )}

      {!preloading && !titleHidden && (
        <div className={`title-screen ${started ? "hidden" : ""}`}>
          <img src="/preview.webp" alt="Eshan H" className="title-avatar" />
          <pre className="title-ascii" style={{ lineHeight: '1.2' }}>{`
  _____  _____  _   _  ___   _   _ 
 |  ___|/  ___|| | | |/ _ \\ | \\ | |
 | |__  \\ \`--. | |_| / /_\\ \\|  \\| |
 |  __|  \`--. \\|  _  |  _  || . \` |
 | |___ /\\__/ /| | | | | | || |\\  |
 \\____/ \\____/ \\_| |_\\_| |_/\\_| \\_/`}</pre>
          <p className="title-sub">A PLAYABLE PORTFOLIO</p>
          <p className="title-desc">Explore portals, memory walls, and biomes in this interactive odyssey.</p>
          <div style={{display:'flex', gap:'20px', justifyContent:'center', marginTop: '20px', flexWrap: 'wrap'}}>
            
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                style={{ position: 'absolute', top: '-40px', fontSize: '10px', color: '#00ffff', background: 'rgba(0,0,0,0.8)', padding: '5px 10px', borderRadius: '4px', border: '1px solid #00ffff', whiteSpace: 'nowrap' }}
              >
                Want to explore and play?
                <div style={{ position: 'absolute', bottom: '-5px', left: '50%', transform: 'translateX(-50%)', borderTop: '5px solid #00ffff', borderLeft: '5px solid transparent', borderRight: '5px solid transparent' }} />
              </motion.div>
              <button className="title-start" onClick={startGame}>▶ PRESS START</button>
            </div>

            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
               <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                style={{ position: 'absolute', top: '-40px', fontSize: '10px', color: '#ff006e', background: 'rgba(0,0,0,0.8)', padding: '5px 10px', borderRadius: '4px', border: '1px solid #ff006e', whiteSpace: 'nowrap' }}
              >
                Are you a recruiter? View professional version
                <div style={{ position: 'absolute', bottom: '-5px', left: '50%', transform: 'translateX(-50%)', borderTop: '5px solid #ff006e', borderLeft: '5px solid transparent', borderRight: '5px solid transparent' }} />
              </motion.div>
              <button className="title-start" style={{background:'transparent', border:'1px solid #ff006e', color:'#ff006e'}} onClick={() => window.open('/Eshan_Portfolio/index.html', '_blank')}>▶ RECRUITER SKIP</button>
            </div>

            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3, duration: 0.5 }}
                style={{ position: 'absolute', top: '-40px', fontSize: '10px', color: '#ffd700', background: 'rgba(0,0,0,0.8)', padding: '5px 10px', borderRadius: '4px', border: '1px solid #ffd700', whiteSpace: 'nowrap' }}
              >
                Play 9 interactive project showcases
                <div style={{ position: 'absolute', bottom: '-5px', left: '50%', transform: 'translateX(-50%)', borderTop: '5px solid #ffd700', borderLeft: '5px solid transparent', borderRight: '5px solid transparent' }} />
              </motion.div>
              <a className="title-start" style={{background:'transparent', border:'1px solid #ffd700', color:'#ffd700', textDecoration:'none', display:'inline-flex', alignItems:'center'}} href="/arcade/index.html?from=portfolio">🕹️ PROJECT ARCADE</a>
            </div>

          </div>
          <div className="title-controls"><kbd>←</kbd> <kbd>→</kbd> Move &bull; <kbd>SPACE</kbd> Jump &bull; <kbd>ENTER</kbd> Open Card</div>
        </div>
      )}

      {started && (
        <div className="minimap-container">
          <div className="minimap-track">
            <div className="minimap-player" style={{ left: `${progress}%` }}></div>
            {ZONES.map(z => <div key={z.name} className="minimap-zone-marker" style={{ left: `${(z.x1/WORLD_WIDTH)*100}%`, backgroundColor: z.accent }}></div>)}
          </div>
        </div>
      )}

      {started && (
        <div className="game-hud">
          <div className="hud-left"><span className="hud-zone">{zoneName}</span></div>
          <div className="hud-center">
             <motion.span className="hud-score" style={{marginRight: 15}}>★ <motion.span>{scoreDisplay}</motion.span></motion.span>
             {bestTime && <span className="hud-score" style={{color: '#ff006e', fontSize: '10px'}}>BEST: {bestTime}s</span>}
          </div>
          <div className="hud-right">
            <motion.span 
              className="hud-coins"
              key={`coin-${coinCount}`}
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 0.3 }}
            >
              🪙 {coinCount} / 115
            </motion.span>
          </div>
        </div>
      )}

      <AnimatePresence>
        {zoneLabel && (
          <motion.div 
            key={`pulse-${zoneLabel}`}
            initial={{ boxShadow: `inset 0 0 0px 0px ${ZONES.find(z => z.name === zoneName)?.accent || '#00ffff'}00` }}
            animate={{ boxShadow: `inset 0 0 100px 20px ${ZONES.find(z => z.name === zoneName)?.accent || '#00ffff'}66` }}
            exit={{ boxShadow: `inset 0 0 0px 0px ${ZONES.find(z => z.name === zoneName)?.accent || '#00ffff'}00` }}
            transition={{ duration: 1, repeat: 1, repeatType: "reverse" }}
            style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10 }}
          />
        )}
      </AnimatePresence>

      {zoneLabel && <div className="zone-enter" key={zoneLabel}><div className="zone-num">{zoneName}</div><div className="zone-name">{zoneLabel}</div></div>}
      <GuideBubble initialMsg={guideMsg} x={guideBubblePos.x} y={guideBubblePos.y} keepOpen={started} hidden={!!activeCard || revealStage !== "idle" || skillTreeActive || !!minigame || showFinish} />
      {blockHint && <div className="block-hint" style={{ left: blockHintPos.x, top: blockHintPos.y }}>{blockHint}</div>}

      <div className="toast-container">
        {toasts.map(t => <div key={t.id} className="toast">{t.msg}</div>)}
      </div>

      {vehicles.map((v, i) => <div key={v.t + i} className="vehicle-popup" style={{ top: v.y }}>{v.emoji}</div>)}


      {minigame && MINIGAME_REGISTRY[minigame.category] && (() => {
        const MinigameComponent = MINIGAME_REGISTRY[minigame.category].view2d;
        return <MinigameComponent 
                 content={minigame.content} 
                 onComplete={finishMinigame} 
                 onSkip={skipMinigame}
                 onOpenCard={(key) => {
                   triggerContent({ contentKey: key, w: 0 }, BLOCK_CONTENT[key], "3d");
                 }}
               />;
      })()}

      <SkillTree 
        active={skillTreeActive && !skillTreeDismissed} 
        onClose={() => {
          setSkillTreeActive(false);
          setSkillTreeDismissed(true);
        }} 
      />

      {/* REVEAL STATE MACHINE: crate/crystal → card */}
      {revealStage === "crate" && revealContent && (
        (revealContent.revealStyle === "crystal" && graphicsTier !== "low")
          ? <ErrorBoundary><CrystalShatterReveal accent={revealAccent} onDone={onCrateDone} /></ErrorBoundary>
          : <CrateReveal accent={revealAccent} anchor={revealAnchor} onDone={onCrateDone} reducedMotion={prefersReducedMotion} />
      )}

      {revealStage === "card" && revealContent && (
        <div className="card-overlay" onClick={closeCard}>
          <button className="card-close" onClick={closeCard}>✕</button>
          <HolographicCard content={revealContent} contentKey={revealContentKey} accent={revealAccent} onClose={closeCard}>
            <div onClick={e => e.stopPropagation()}>
              {revealContent.images && <CylinderCarousel images={revealContent.images} />}
              {revealContent.image && !revealContent.images && revealContent.type !== "portal" && <ImageWithLoader className="card-hero-img" src={revealContent.image} alt={revealContent.title} />}
              <div className="card-content">
                {revealContent.badge && <div className="card-badge">{revealContent.badge}</div>}
                <div className="card-title">{revealContent.title}</div>
                {revealContent.subtitle && <div className="card-subtitle">{revealContent.subtitle}</div>}
                {revealContent.stats && <div className="card-stats">{revealContent.stats.map((s, i) => <div key={i} className="card-stat"><div className="card-stat-val">{s.val}</div><div className="card-stat-label">{s.label}</div></div>)}</div>}
                <div className="card-desc">{revealContent.desc}</div>
                {revealContent.narration && <div className="card-narration"><TypeWriter text={revealContent.narration} /></div>}
                {revealContent.tech && <div className="card-tech">{revealContent.tech.map(t => <span key={t}>{t}</span>)}</div>}
                <div className="card-links">
                  {revealContent.arcadePortal && <a href={revealContent.arcadePortal}>ENTER PROJECT ARCADE →</a>}
                  {revealContent.showcase && <a href={revealContent.showcase}>PLAY SHOWCASE →</a>}
                  {revealContent.link && <a href={revealContent.link} target="_blank" rel="noopener noreferrer">OPEN →</a>}
                  {revealContent.github && <a href={revealContent.github} target="_blank" rel="noopener noreferrer" className="secondary">GITHUB →</a>}
                </div>
              </div>
            </div>
          </HolographicCard>
        </div>
      )}

      {/* Legacy activeCard fallback for any path that still uses openCard directly */}
      {activeCard && revealStage === "idle" && (
        <div className="card-overlay" onClick={closeCard}>
          <button className="card-close" onClick={closeCard}>✕</button>
          <HolographicCard content={activeCard} contentKey={Object.keys(BLOCK_CONTENT).find(k => BLOCK_CONTENT[k] === activeCard)} accent={revealAccent} onClose={closeCard}>
            <div onClick={e => e.stopPropagation()}>
              {activeCard.images && <CylinderCarousel images={activeCard.images} />}
              {activeCard.image && !activeCard.images && activeCard.type !== "portal" && <ImageWithLoader className="card-hero-img" src={activeCard.image} alt={activeCard.title} />}
              <div className="card-content">
                {activeCard.badge && <div className="card-badge">{activeCard.badge}</div>}
                <div className="card-title">{activeCard.title}</div>
                {activeCard.subtitle && <div className="card-subtitle">{activeCard.subtitle}</div>}
                {activeCard.stats && <div className="card-stats">{activeCard.stats.map((s, i) => <div key={i} className="card-stat"><div className="card-stat-val">{s.val}</div><div className="card-stat-label">{s.label}</div></div>)}</div>}
                <div className="card-desc">{activeCard.desc}</div>
                {activeCard.narration && <div className="card-narration"><TypeWriter text={activeCard.narration} /></div>}
                {activeCard.tech && <div className="card-tech">{activeCard.tech.map(t => <span key={t}>{t}</span>)}</div>}
                <div className="card-links">
                  {activeCard.arcadePortal && <a href={activeCard.arcadePortal}>ENTER PROJECT ARCADE →</a>}
                  {activeCard.showcase && <a href={activeCard.showcase}>PLAY SHOWCASE →</a>}
                  {activeCard.link && <a href={activeCard.link} target="_blank" rel="noopener noreferrer">OPEN →</a>}
                  {activeCard.github && <a href={activeCard.github} target="_blank" rel="noopener noreferrer" className="secondary">GITHUB →</a>}
                </div>
              </div>
            </div>
          </HolographicCard>
        </div>
      )}

      {showFinish && (
        <GlobeGallery 
          keys={ALL_KEYS} 
          onOpenCard={(key) => {
            setShowFinish(false);
            triggerContent({ contentKey: key, w: 0 }, BLOCK_CONTENT[key], "3d");
          }}
          onClose={() => setShowFinish(false)}
        />
      )}

      {started && revealStage === "idle" && !activeCard && !minigame && !(skillTreeActive && !skillTreeDismissed) && !showFinish && (
        <div style={{position: 'absolute', top: 20, right: 20, zIndex: 10000, display: 'flex', gap: '10px'}}>
           <button className="music-toggle" style={{position:'static', fontSize:'10px'}} onClick={toggleMusic}>BGM: {musicOn ? "ON" : "OFF"}</button>
           <button className="music-toggle" style={{position:'static', fontSize:'10px'}} onClick={toggleSfx}>SFX: {sfxOn ? "ON" : "OFF"}</button>
        </div>
      )}
      
      {/* MOBILE CONTROLS */}
      {started && (
        <div className="mobile-controls">
          <div className="d-pad" style={{ position: 'relative' }}>
            {showTutorial && (
              <div style={{
                position: 'absolute', top: '-38px', left: '50%', transform: 'translateX(-50%)',
                whiteSpace: 'nowrap', fontSize: '12px', color: '#00ffff',
                textShadow: '0 0 8px cyan, 0 0 16px rgba(0,255,255,0.4)',
                animation: 'pulse-glow 1.5s ease-in-out infinite',
                pointerEvents: 'none', fontFamily: '"Share Tech Mono", monospace',
                fontWeight: 'bold', letterSpacing: '1px',
                background: 'rgba(0,10,20,0.8)', padding: '4px 12px', borderRadius: '12px',
                border: '1px solid rgba(0,255,255,0.3)',
              }}>
                ◀ ▶ MOVE
              </div>
            )}
            <button className="d-btn left" onTouchStart={(e) => { e.preventDefault(); handleTouchStart('TouchLeft'); }} onTouchEnd={(e) => { e.preventDefault(); handleTouchEnd('TouchLeft'); }} onMouseDown={() => handleTouchStart('TouchLeft')} onMouseUp={() => handleTouchEnd('TouchLeft')} onMouseLeave={() => handleTouchEnd('TouchLeft')}>◀</button>
            <button className="d-btn right" onTouchStart={(e) => { e.preventDefault(); handleTouchStart('TouchRight'); }} onTouchEnd={(e) => { e.preventDefault(); handleTouchEnd('TouchRight'); }} onMouseDown={() => handleTouchStart('TouchRight')} onMouseUp={() => handleTouchEnd('TouchRight')} onMouseLeave={() => handleTouchEnd('TouchRight')}>▶</button>
          </div>
          <div style={{ position: 'relative' }}>
            {showTutorial && (
              <div style={{
                position: 'absolute', top: '-38px', left: '50%', transform: 'translateX(-50%)',
                whiteSpace: 'nowrap', fontSize: '12px', color: '#39ff14',
                textShadow: '0 0 8px #39ff14, 0 0 16px rgba(57,255,20,0.4)',
                animation: 'pulse-glow 1.5s ease-in-out infinite',
                pointerEvents: 'none', fontFamily: '"Share Tech Mono", monospace',
                fontWeight: 'bold', letterSpacing: '1px',
                background: 'rgba(0,10,20,0.8)', padding: '4px 12px', borderRadius: '12px',
                border: '1px solid rgba(57,255,20,0.3)',
              }}>
                ↑ JUMP
              </div>
            )}
            <button className="jump-btn" onTouchStart={(e) => { e.preventDefault(); handleTouchStart('TouchJump'); }} onTouchEnd={(e) => { e.preventDefault(); handleTouchEnd('TouchJump'); }} onMouseDown={() => handleTouchStart('TouchJump')} onMouseUp={() => handleTouchEnd('TouchJump')} onMouseLeave={() => handleTouchEnd('TouchJump')}>JUMP</button>
          </div>
        </div>
      )}
    </div>
  );
}
