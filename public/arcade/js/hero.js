/* Hero: sprite sheet (128px cells, 4x3) with a full procedural fallback. */
(function (A) {
  var CELL = 128, K = 1.7, FEET = 124, img = new Image(), ready = false;
  img.onload = function () { ready = true; };
  img.onerror = function () { ready = false; };
  img.src = 'assets/hero_spritesheet.png';
  var shadowC = 'rgba(0,0,0,.35)';
  function proc(c, f, back, bob, moving) {
    /* 4-frame procedural walk cycle, drawn at ~170 px tall, origin at feet center */
    var ph = f * 1.5708, lg = moving ? Math.sin(ph) * 14 : 0;
    c.fillStyle = '#23262e'; c.fillRect(-22 + lg, -62, 18, 62); c.fillRect(4 - lg, -62, 18, 62);          /* legs */
    c.fillStyle = '#e9e9ee'; c.fillRect(-26 + lg, -8, 24, 8); c.fillRect(2 - lg, -8, 24, 8);              /* shoes */
    c.fillStyle = '#7b8190'; c.fillRect(-34, -128 + bob, 68, 72);                                         /* hoodie */
    c.fillStyle = '#5e6472'; c.fillRect(-34, -64 + bob, 68, 8);
    if (!back) { c.fillStyle = '#3b4a7a'; c.fillRect(-44, -118 + bob, 14, 54); c.fillStyle = '#FFB000'; c.fillRect(-40, -104 + bob, 6, 6); }  /* backpack + sticker */
    else { c.fillStyle = '#3b4a7a'; c.fillRect(-28, -120 + bob, 56, 56); c.fillStyle = '#FFB000'; c.fillRect(-4, -100 + bob, 10, 10); }
    c.fillStyle = back ? '#15131a' : '#b8845b'; c.fillRect(-20, -176 + bob, 40, 46);                      /* head */
    c.fillStyle = '#15131a'; c.fillRect(-22, -180 + bob, 44, 18);
    if (!back) { c.fillStyle = '#111'; c.fillRect(6, -154 + bob, 5, 7); c.fillRect(-4, -154 + bob, 5, 7); }
  }
  A.hero = {
    ready: function () { return ready; },
    /* kind: walk | idle | look | back */
    draw: function (c, x, fy, o) {
      var sc = o.scale, a = o.alpha, sq = o.squash || 1, dir = o.dir, bob = o.bob || 0;
      c.save();
      c.globalAlpha = a * 0.9; c.fillStyle = shadowC;
      c.beginPath(); c.ellipse(x, fy + 2, 62 * sc * (1 - bob / 80), 11 * sc, 0, 0, 6.283); c.fill();
      c.globalAlpha = a;
      c.translate(x, fy + bob * -0.4); c.scale(sc * (2 - sq) * (dir < 0 && o.kind !== 'back' ? -1 : 1), sc * sq);
      if (ready) {
        var row = o.kind === 'walk' ? 0 : o.kind === 'back' ? 2 : 1, col = o.frame & 3;
        c.drawImage(img, col * CELL, row * CELL, CELL, CELL, -CELL * K / 2, -FEET * K, CELL * K, CELL * K);
      } else proc(c, o.frame, o.kind === 'back', o.kind === 'walk' ? Math.abs(Math.sin(o.frame * 1.5708)) * -5 : 0, o.kind === 'walk');
      c.restore();
    }
  };
})(window.A = window.A || {});
