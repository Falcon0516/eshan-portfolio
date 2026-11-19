/* One stage, one moving camera. Scenes are camera targets over a 2560x1440 world. */
(function () {
  'use strict';
  var world = document.getElementById('world'), stageEl = document.getElementById('stage');
  var Stage = { vw: 1, vh: 1, s: 1, cam: { wx: 1280, wy: 720, z: 1, fx: 0.5, fy: 0.5 }, mobile: false, img: {} };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  Stage.reduce = reduce;
  function apply(instant) {
    var c = Stage.cam, z = c.z, fx = c.fx, fy = c.fy;
    if (Stage.mobile) { z = Math.min(z, 1.25); fx = 0.5; fy = 0.3; }
    var k = Stage.s * z, tx = fx * Stage.vw - c.wx * k, ty = fy * Stage.vh - c.wy * k;
    if (instant || reduce) {
      world.classList.add('instant'); world.style.opacity = reduce ? 0 : 1;
      world.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + k + ')';
      void world.offsetWidth; world.classList.remove('instant');
      if (reduce) requestAnimationFrame(function () { world.style.opacity = 1; });
    } else world.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + k + ')';
  }
  Stage.resize = function () {
    Stage.vw = window.innerWidth; Stage.vh = window.innerHeight; Stage.mobile = Stage.vw < 760;
    Stage.s = Math.max(Stage.vw / 2560, Stage.vh / 1440); apply(true);
  };
  Stage.go = function (cam, instant) { for (var k in cam) Stage.cam[k] = cam[k]; apply(instant); };
  /* Image fallbacks: never a broken icon. */
  function watch(id, cls) {
    var el = document.getElementById(id);
    function bad() { document.body.classList.add(cls); }
    el.addEventListener('error', bad); if (el.complete && el.naturalWidth === 0) bad();
  }
  watch('frame', 'noframe'); watch('sunimg', 'nosun'); watch('rovyimg', 'nororvy');
  function load(name, src) {
    var im = new Image(); Stage.img[name] = { el: im, ok: false };
    im.onload = function () { Stage.img[name].ok = true; }; im.onerror = function () { Stage.img[name].ok = false; }; im.src = src;
  }
  load('field', 'assets/mars_field_bg.webp'); load('crates', 'assets/crate_rock_set.png');
  window.addEventListener('resize', Stage.resize);
  window.Stage = Stage;
})();
