// ============================================================
// three-bg.js — constellation particle field + connecting lines
// A quiet "circuit sky" that drifts and reacts subtly to scroll
// and mouse position. Deliberately restrained: this is atmosphere,
// not the main event.
// ============================================================
(function () {
  if (typeof THREE === 'undefined') return;

  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.z = 620;

  // ---- Particle field ----
  const COUNT = window.innerWidth < 700 ? 260 : 560;
  const positions = new Float32Array(COUNT * 3);
  const speeds = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 1800;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 1200;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 900;
    speeds[i] = 0.15 + Math.random() * 0.35;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const sprite = makeDotTexture();
  const mat = new THREE.PointsMaterial({
    size: 3.4,
    map: sprite,
    transparent: true,
    opacity: 0.55,
    color: 0x6fe9dc,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  // A handful of larger "amber" beacon particles for contrast
  const BEACONS = 14;
  const bpos = new Float32Array(BEACONS * 3);
  for (let i = 0; i < BEACONS; i++) {
    bpos[i * 3] = (Math.random() - 0.5) * 1600;
    bpos[i * 3 + 1] = (Math.random() - 0.5) * 1000;
    bpos[i * 3 + 2] = (Math.random() - 0.5) * 700;
  }
  const bgeo = new THREE.BufferGeometry();
  bgeo.setAttribute('position', new THREE.BufferAttribute(bpos, 3));
  const bmat = new THREE.PointsMaterial({
    size: 6,
    map: sprite,
    transparent: true,
    opacity: 0.85,
    color: 0xf5a623,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const beacons = new THREE.Points(bgeo, bmat);
  scene.add(beacons);

  function makeDotTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const grd = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.4, 'rgba(255,255,255,0.5)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  // ---- Mouse parallax ----
  let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // ---- Scroll-driven camera drift ----
  let scrollProgress = 0;
  window.addEventListener('scroll', () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress = h > 0 ? window.scrollY / h : 0;
  }, { passive: true });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  let raf;
  function animate() {
    raf = requestAnimationFrame(animate);

    targetX += (mouseX - targetX) * 0.02;
    targetY += (mouseY - targetY) * 0.02;

    points.rotation.y = scrollProgress * 0.7 + targetX * 0.06;
    points.rotation.x = scrollProgress * 0.15 + targetY * 0.04;
    beacons.rotation.y = points.rotation.y * 0.7;
    beacons.rotation.x = points.rotation.x * 0.7;

    camera.position.x = targetX * 30;
    camera.position.y = -targetY * 20;
    camera.lookAt(0, 0, 0);

    if (!reduceMotion) {
      points.rotation.z += 0.00015;
    }

    renderer.render(scene, camera);
  }

  if (!reduceMotion) {
    animate();
  } else {
    renderer.render(scene, camera);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else if (!reduceMotion) animate();
  });
})();
