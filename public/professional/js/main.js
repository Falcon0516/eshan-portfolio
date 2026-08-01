// ============================================================
// main.js — scroll reveals, counters, level map modals,
// custom cursor, typewriter, HUD clock, nav progress
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Custom cursor ---------- */
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (dot && ring && window.matchMedia('(min-width: 861px)').matches) {
    let rx = 0, ry = 0, tx = 0, ty = 0;
    window.addEventListener('mousemove', (e) => {
      dot.style.left = e.clientX + 'px';
      dot.style.top = e.clientY + 'px';
      tx = e.clientX; ty = e.clientY;
    });
    (function loop() {
      rx += (tx - rx) * 0.18;
      ry += (ty - ry) * 0.18;
      ring.style.left = rx + 'px';
      ring.style.top = ry + 'px';
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll('a, button, .trophy-card, .level-node').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('hover'));
      el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
    });
  }

  /* ---------- HUD clock ---------- */
  const clockLine = document.getElementById('clockLine');
  if (clockLine) {
    function tick() {
      const now = new Date();
      const t = now.toLocaleTimeString('en-GB', { hour12: false });
      clockLine.textContent = `LOCAL TIME ${t}`;
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- Hero typewriter ---------- */
  const tw = document.getElementById('heroTypewriter');
  if (tw) {
    const lines = [
      'Builder. Innovator. Problem Solver.',
      'Final-Year CSE @ SJB Institute of Technology.',
      '10+ Hackathons. 5 Podiums. 2 Published Papers.',
      'Currently looking for the next hard problem.'
    ];
    let li = 0, ci = 0, deleting = false;
    function typeLoop() {
      const current = lines[li];
      if (!deleting) {
        ci++;
        tw.textContent = current.slice(0, ci);
        if (ci === current.length) {
          deleting = true;
          setTimeout(typeLoop, 1800);
          return;
        }
      } else {
        ci--;
        tw.textContent = current.slice(0, ci);
        if (ci === 0) {
          deleting = false;
          li = (li + 1) % lines.length;
        }
      }
      setTimeout(typeLoop, deleting ? 22 : 45);
    }
    typeLoop();
  }

  /* ---------- Progress rail ---------- */
  const progressFill = document.getElementById('progressFill');
  function updateProgress() {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const pct = h > 0 ? (window.scrollY / h) * 100 : 0;
    if (progressFill) progressFill.style.width = pct + '%';
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* ---------- Nav active state ---------- */
  const navLinks = document.querySelectorAll('[data-nav]');
  const navSections = Array.from(navLinks).map(a => document.querySelector(a.getAttribute('href')));
  function updateNav() {
    let current = null;
    navSections.forEach(sec => {
      if (!sec) return;
      const r = sec.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.4 && r.bottom > window.innerHeight * 0.4) current = sec;
    });
    navLinks.forEach(a => {
      a.classList.toggle('active', current && a.getAttribute('href') === '#' + current.id);
    });
  }
  window.addEventListener('scroll', updateNav, { passive: true });

  /* ---------- Scroll reveals ---------- */
  const revealTargets = document.querySelectorAll(
    '.section-kicker, .section-title, .section-lede, .origin-copy, .node-timeline, .level-map, .trophy-card, .project-row, .research-card, .beyond-card, .contact-links, .research-stat-strip'
  );
  revealTargets.forEach(el => el.classList.add('reveal'));

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  revealTargets.forEach(el => io.observe(el));

  /* ---------- Stat counters ---------- */
  const counters = document.querySelectorAll('[data-count]');
  const counterIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        counterIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });
  counters.forEach(el => counterIO.observe(el));

  function animateCount(el) {
    const target = parseFloat(el.getAttribute('data-count'));
    const dur = 1400;
    const start = performance.now();
    function step(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(eased * target);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }

  /* ---------- Trophy card flip ---------- */
  document.querySelectorAll('.trophy-card').forEach(card => {
    card.addEventListener('click', () => card.classList.toggle('flipped'));
  });

  /* ---------- Level map modals ---------- */
  const levelContent = {
    research: {
      kicker: 'LEVEL 01 // THE RESEARCH CHAPTER',
      title: 'Two papers. One stage. 300+ eyes.',
      body: `<p>Co-authored and presented <strong>"3D-Printed Medical Aids for Hemorrhage Control in Battlefield Conditions"</strong> at ICRIET-2025, held at KS Institute of Technology — it won <strong>Best Research Paper Award</strong> in its track, and was published in IJCRT, Vol. 13.</p>
      <p>Alongside it: <strong>SkillM</strong>, a gamified offline e-learning platform, co-developed and studied under the title "Transformative Reinforcement" — submitted to Educational Technology &amp; Society (ET&amp;S). It delivered a 63% academic score improvement across 54 underserved students in just one week (p &lt; 0.001).</p>
      <p>Both were presented on stage at SJBIT's Induction Program, to an audience of 300+ first-year students, faculty, and the Principal.</p>
      <a class="modal-link" href="https://www.ijcrt.org/papers/IJCRTBE02004.pdf" target="_blank" rel="noopener">Read the published paper ↗</a>`
    },
    builds: {
      kicker: 'LEVEL 02 // THE BUILDER ARC',
      title: 'Six systems. Two you can open right now.',
      body: `<ul>
      <li><strong>Project Argus</strong> — decentralized, multi-node AI surveillance platform. <a class="modal-link" href="https://argus-47.netlify.app" target="_blank" rel="noopener">Live demo ↗</a></li>
      <li><strong>SAATHI</strong> — voice-based AI health screening for feature phones. <a class="modal-link" href="https://saathi-presentation.netlify.app/" target="_blank" rel="noopener">Live demo ↗</a></li>
      <li><strong>AXIOM</strong> — on-chain safety layer for autonomous AI agents (3rd, HACK.ALGO 2026)</li>
      <li><strong>VeriFarm</strong> — blockchain traceability for agricultural supply chains (1st, ADVAYA 2.0)</li>
      <li><strong>Agronym Solutions</strong> — autonomous agricultural rover (2nd, InnovateX 2024)</li>
      <li><strong>AVANGARD</strong> — AI-driven threat intelligence engine</li>
      </ul>
      <p>Scroll to the Builds section below for the full breakdown of each.</p>`
    },
    streak: {
      kicker: 'LEVEL 03 // THE 30-DAY STREAK',
      title: '30 days. 3 competitions. 3 podiums.',
      body: `<p>A month that started as "just another engineering student trying to prove something" and turned into a run of five wins, back to back, across four different teams.</p>
      <p><strong>ADVAYA 2.0</strong> — 1st place, ₹50,000, as Team WARCRYPT.<br>
      <strong>Innovathon IMPULSE</strong> — 2nd place, as Team Reckoners.<br>
      <strong>Beam Build Battle</strong> — 1st place, a working IR laser-tag system built from scratch in 12 hours, as Team IntelNtag.<br>
      <strong>AI-STHETICA (AIVORA 2026)</strong> — 2nd place, 4th win, 3rd consecutive — won on my father's birthday, and gave it to him as his gift.<br>
      <strong>HACK.ALGO 2026</strong> — 3rd place among 60+ teams, tackling the hardest problem statement on the board.</p>
      <p>None of it happened alone. Every single one of these was a team effort.</p>`
    },
    beyond: {
      kicker: 'LEVEL 04 // BEYOND CODE',
      title: 'Off the leaderboard, still building.',
      body: `<p>A week spent volunteering at a Faculty Development Program on wildlife awareness and social responsibility — a reminder that not all learning happens within four walls.</p>
      <p>Active member of team CleverFyre, regular volunteer at tech community events, and someone who's stood on stage in front of 300+ first-year students to tell them: the research and the building you want to do — it starts right here, right now.</p>`
    },
    contact: {
      kicker: 'LEVEL 05 // NOW',
      title: "What's next",
      body: `<p>Actively looking for internship and entry-level opportunities to build meaningful technology, learn alongside people sharper than me, and keep solving problems — one puzzle at a time.</p>
      <p>Scroll to the bottom of the page for direct contact links, or just ask ARGUS.</p>`
    }
  };

  const modal = document.getElementById('levelModal');
  const modalBody = document.getElementById('levelModalBody');
  const modalClose = document.getElementById('levelModalClose');
  const modalBackdrop = document.getElementById('levelModalBackdrop');

  document.querySelectorAll('.level-node').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-level');
      const data = levelContent[key];
      if (!data) return;
      modalBody.innerHTML = `<span class="modal-kicker">${data.kicker}</span><h3>${data.title}</h3>${data.body}`;
      modal.classList.add('open');
    });
  });

  function closeModal() { modal.classList.remove('open'); }
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

});

/* =========================================
   NEW ADVANCED AESTHETICS & ANIMATIONS
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Preloader Logic
  const preloader = document.getElementById('preloaderOverlay');
  if (preloader) {
    // Simulate loading time for effect, then fade out
    setTimeout(() => {
      preloader.classList.add('hidden');
      setTimeout(() => {
        preloader.style.display = 'none';
      }, 1000); // match transition duration
    }, 1500);
  }

  // 2. Intersection Observer for Sections
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };

  const sectionObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        // Optional: unobserve if you only want it to animate once
        // observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.section-animate').forEach(section => {
    sectionObserver.observe(section);
  });
});
