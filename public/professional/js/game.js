// ============================================================
// game.js — the "playable" layer on top of the portfolio:
// XP/achievement tracking (persisted via localStorage), toast
// pop-ups, 3D card tilt, keyboard navigation, and a Konami-code
// easter egg with a confetti payoff at 100% exploration.
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  /* ============ ACHIEVEMENT / XP SYSTEM ============ */
  const ACHIEVEMENTS = [
    { id: 'origin', sectionId: 'origin', title: 'Origin Story Discovered', xp: 100, icon: '🌱' },
    { id: 'journey', sectionId: 'journey', title: 'Found the Level Map', xp: 100, icon: '🗺️' },
    { id: 'trophies', sectionId: 'trophies', title: 'Trophy Hunter', xp: 150, icon: '🏆' },
    { id: 'certifications', sectionId: 'certifications', title: 'Certified', xp: 100, icon: '🎓' },
    { id: 'builds', sectionId: 'builds', title: 'Builder Arc Unlocked', xp: 150, icon: '⚙️' },
    { id: 'research', sectionId: 'research', title: 'Read the Research', xp: 150, icon: '📄' },
    { id: 'beyond', sectionId: 'beyond', title: 'Beyond Code Explored', xp: 100, icon: '🌍' },
    { id: 'contact', sectionId: 'contact', title: 'Reached the End of the Log', xp: 150, icon: '🚀' },
  ];
  const TOTAL_XP = ACHIEVEMENTS.reduce((s, a) => s + a.xp, 0);
  const STORAGE_KEY = 'eshan_portfolio_achievements_v1';

  let unlocked = {};
  try { unlocked = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch (e) { unlocked = {}; }

  const xpRingFg = document.getElementById('xpRingFg');
  const xpPercentLabel = document.getElementById('xpPercentLabel');
  const xpPointsLabel = document.getElementById('xpPointsLabel');
  const achieveList = document.getElementById('achieveList');
  const achieveCount = document.getElementById('achieveCount');
  const toastStack = document.getElementById('toastStack');
  const RING_CIRC = 106.8;

  function currentXP() {
    return ACHIEVEMENTS.filter(a => unlocked[a.id]).reduce((s, a) => s + a.xp, 0);
  }
  function currentCount() {
    return ACHIEVEMENTS.filter(a => unlocked[a.id]).length;
  }

  function renderHud(animateRing) {
    const xp = currentXP();
    const pct = Math.round((xp / TOTAL_XP) * 100);
    if (xpPercentLabel) xpPercentLabel.textContent = pct + '%';
    if (xpPointsLabel) xpPointsLabel.textContent = xp + ' XP';
    if (xpRingFg) xpRingFg.style.strokeDashoffset = RING_CIRC - (RING_CIRC * pct / 100);
    if (achieveCount) achieveCount.textContent = `${currentCount()}/${ACHIEVEMENTS.length}`;
    renderAchieveList();
  }

  function renderAchieveList() {
    if (!achieveList) return;
    achieveList.innerHTML = ACHIEVEMENTS.map(a => `
      <div class="achieve-item ${unlocked[a.id] ? 'unlocked' : ''}">
        <span class="achieve-dot"></span>
        <span>${a.icon} ${a.title}${unlocked[a.id] ? '' : ' — locked'}</span>
      </div>
    `).join('');
  }

  function showToast(icon, title, sub) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span class="toast-icon">${icon}</span><div><div class="toast-title">${title}</div><div class="toast-sub">${sub}</div></div>`;
    toastStack.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 500);
    }, 3600);
  }

  function unlock(id) {
    if (unlocked[id]) return;
    const a = ACHIEVEMENTS.find(x => x.id === id);
    if (!a) return;
    unlocked[id] = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocked));
    renderHud(true);
    showToast(a.icon, 'Achievement Unlocked', `${a.title} · +${a.xp} XP`);

    if (currentCount() === ACHIEVEMENTS.length) {
      setTimeout(() => {
        showToast('🎉', '100% Explored', `All ${TOTAL_XP} XP collected — you actually read the whole thing.`);
        launchConfetti();
      }, 700);
    }
  }

  renderHud(false);

  // Watch each section, unlock on first real view
  ACHIEVEMENTS.forEach(a => {
    const sec = document.getElementById(a.sectionId);
    if (!sec) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          unlock(a.id);
          obs.unobserve(sec);
        }
      });
    }, { threshold: 0.35 });
    obs.observe(sec);
  });

  // Toggle achievement panel from HUD
  const xpHud = document.getElementById('xpHud');
  const achievePanel = document.getElementById('achievePanel');
  if (xpHud && achievePanel) {
    xpHud.addEventListener('click', () => achievePanel.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (!achievePanel.contains(e.target) && !xpHud.contains(e.target)) {
        achievePanel.classList.remove('open');
      }
    });
  }

  /* ============ 3D CARD TILT ============ */
  // Trophy cards: tilt the outer wrapper subtly, flip stays on the inner (handled in main.js)
  document.querySelectorAll('.trophy-card').forEach(card => {
    let raf = null;
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.transform = `perspective(1200px) rotateX(${-py * 10}deg) rotateY(${px * 10}deg)`;
      });
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });

  document.querySelectorAll('.project-row').forEach(row => {
    let raf = null;
    row.addEventListener('mousemove', (e) => {
      const r = row.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        row.style.transform = `perspective(1600px) rotateX(${-py * 2.4}deg) rotateY(${px * 2.4}deg)`;
      });
    });
    row.addEventListener('mouseleave', () => { row.style.transform = ''; });
  });

  /* ============ KEYBOARD NAVIGATION ============ */
  const sectionOrder = ['hero', 'origin', 'journey', 'trophies', 'certifications', 'builds', 'research', 'beyond', 'contact'];
  const kbdHint = document.getElementById('kbdHint');

  if (kbdHint) {
    setTimeout(() => kbdHint.classList.add('show'), 1600);
    setTimeout(() => kbdHint.classList.remove('show'), 6000);
  }

  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key >= '1' && e.key <= '8') {
      const idx = parseInt(e.key, 10);
      const target = document.getElementById(sectionOrder[idx]);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }
    if (e.key === '?') {
      kbdHint.classList.add('show');
      setTimeout(() => kbdHint.classList.remove('show'), 3000);
    }
  });

  /* ============ KONAMI CODE EASTER EGG ============ */
  const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let konamiProgress = 0;
  const eggModal = document.getElementById('eggModal');
  const eggBackdrop = document.getElementById('eggBackdrop');
  const eggClose = document.getElementById('eggClose');

  document.addEventListener('keydown', (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === KONAMI[konamiProgress]) {
      konamiProgress++;
      if (konamiProgress === KONAMI.length) {
        konamiProgress = 0;
        eggModal.classList.add('open');
        launchConfetti();
      }
    } else {
      konamiProgress = (key === KONAMI[0]) ? 1 : 0;
    }
  });
  function closeEgg() { eggModal.classList.remove('open'); }
  if (eggClose) eggClose.addEventListener('click', closeEgg);
  if (eggBackdrop) eggBackdrop.addEventListener('click', closeEgg);

  /* ============ CURSOR TRAIL (desktop only, throttled) ============ */
  if (window.matchMedia('(min-width: 861px)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let lastTrail = 0;
    window.addEventListener('mousemove', (e) => {
      const now = performance.now();
      if (now - lastTrail < 45) return;
      lastTrail = now;
      const dot = document.createElement('div');
      dot.className = 'trail-dot';
      dot.style.left = e.clientX + 'px';
      dot.style.top = e.clientY + 'px';
      document.body.appendChild(dot);
      requestAnimationFrame(() => {
        dot.style.opacity = '0';
        dot.style.transform = 'translate(-50%,-50%) scale(2.4)';
      });
      setTimeout(() => dot.remove(), 650);
    });
  }

  /* ============ CONFETTI BURST ============ */
  function launchConfetti() {
    const colors = ['#4CE0D2', '#F5A623', '#EAF1F8'];
    const count = 70;
    for (let i = 0; i < count; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      const size = 5 + Math.random() * 7;
      piece.style.width = size + 'px';
      piece.style.height = size * 0.5 + 'px';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.left = Math.random() * 100 + 'vw';
      const duration = 2.4 + Math.random() * 1.8;
      const rotate = Math.random() * 720 - 360;
      const drift = (Math.random() - 0.5) * 200;
      piece.animate([
        { transform: `translate(0,0) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${drift}px, 100vh) rotate(${rotate}deg)`, opacity: 0.2 }
      ], { duration: duration * 1000, easing: 'cubic-bezier(.4,.1,.6,.9)' });
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), duration * 1000 + 100);
    }
  }

});
