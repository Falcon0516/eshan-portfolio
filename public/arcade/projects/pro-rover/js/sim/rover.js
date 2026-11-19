/* Rover physics, PID heading hold, safety ladder. All thresholds from FACTS (configured, not measured). */
(function () {
  'use strict';
  var N = window.FACTS.nums;
  var TRACK = 0.5, TAU = 0.25, V0 = 1.4, DT = 1 / N.loopHz.v;
  function wrap(a) { while (a > Math.PI) a -= 6.2832; while (a < -Math.PI) a += 6.2832; return a; }
  function gauss() { return (Math.random() + Math.random() + Math.random() - 1.5) / 0.75; }

  /* Safety ladder: CLEAR, SLOW (0.5x to 1.0x under 50), STOP (under 15, latched until 25), WATCHDOG (1 s silence). */
  function Safety() { this.latched = false; this.state = 'CLEAR'; this.scale = 1; this.manual = false; }
  Safety.prototype.update = function (cm, ageS) {
    if (this.manual) { this.state = 'STOP'; this.scale = 0; return this.state; }
    if (ageS > N.watchdogS.v) { this.state = 'WATCHDOG'; this.scale = 0; return this.state; }
    if (this.latched && cm >= N.clearCm.v) this.latched = false;
    if (!this.latched && cm < N.estopCm.v) this.latched = true;
    if (this.latched) { this.state = 'STOP'; this.scale = 0; }
    else if (cm < N.slowCm.v) {
      this.state = 'SLOW';
      this.scale = Math.min(1, Math.max(0.5, 0.5 + 0.5 * (cm - N.estopCm.v) / (N.slowCm.v - N.estopCm.v)));
    } else { this.state = 'CLEAR'; this.scale = 1; }
    return this.state;
  };

  /* Field sim, metres. Scaled field: 20 m wide so the cones stay visible. */
  function Sim() {
    this.W = 20; this.H = 16.6; this.safety = new Safety();
    this.kp = 0.6; this.ki = 0.02; this.kd = 0.12; this.noise = 0.02;
    this.errHist = new Float32Array(180); this.hi = 0; this.sonar = [400, 400, 400]; this.sonarFire = [0, 0, 0];
    this.trace = new Float32Array(600); this.tn = 0; this.obs = []; this.wp = []; this.reset();
  }
  Sim.prototype.reset = function (x, y, th) {
    this.x = x === undefined ? 3 : x; this.y = y === undefined ? 12 : y; this.th = th === undefined ? -0.9 : th;
    this.wl = 0; this.wr = 0; this.I = 0; this.pe = 0; this.acc = 0; this.sacc = 0; this.sonarAge = 0;
    this.state = 'IDLE'; this.wpi = 0; this.err = 0; this.dist = 0; this.bearing = 0; this.cmdl = 0; this.cmdr = 0;
    this.spoke = 0; this.tn = 0; this.errHist.fill(0); this.cut = false; this.gust = 0;
    this.safety.latched = false; this.safety.manual = false; this.safety.state = 'CLEAR'; this.safety.scale = 1;
  };
  Sim.prototype.setWaypoints = function (list) { this.wp = list.slice(); this.wpi = 0; this.state = list.length ? 'DRIVE' : 'IDLE'; this.I = 0; this.pe = 0; };
  Sim.prototype.cast = function (off) {
    var a = this.th + off, c = Math.cos(a), s = Math.sin(a);
    for (var d = 0.1; d < 4; d += 0.04) {
      var px = this.x + c * d, py = this.y + s * d;
      if (px < 0 || py < 0 || px > this.W || py > this.H) return d * 100;
      for (var i = 0; i < this.obs.length; i++) { var o = this.obs[i], dx = px - o.x, dy = py - o.y; if (dx * dx + dy * dy < o.r * o.r) return d * 100; }
    }
    return 400;
  };
  Sim.prototype.pingSonar = function () {
    var offs = [-0.785, 0, 0.785];
    for (var k = 0; k < 3; k++) { var c = this.cast(offs[k]); this.sonar[k] = c >= 400 ? 400 : Math.max(2, c + gauss() * 1.2); }
    this.sonarAge = 0;
  };
  Sim.prototype.control = function () {
    var minCm = Math.min(this.sonar[0], this.sonar[1], this.sonar[2]);
    this.safety.update(minCm, this.sonarAge);
    var l = 0, r = 0;
    if (this.state === 'DRIVE' && this.wp.length) {
      var w = this.wp[this.wpi], dx = w[0] - this.x, dy = w[1] - this.y;
      this.dist = Math.hypot(dx, dy); this.bearing = Math.atan2(dy, dx);
      if (this.dist < N.arriveM.v) { this.wpi++; this.I = 0; if (this.wpi >= this.wp.length) { this.state = 'ARRIVED'; } }
      var err = wrap(this.bearing - (this.th + gauss() * this.noise));
      this.err = err; this.I = Math.max(-1, Math.min(1, this.I + err * DT));
      var d = (err - this.pe) / DT; this.pe = err;
      var u = this.kp * err + this.ki * this.I + this.kd * d;
      var v = V0 * Math.max(0.25, 1 - Math.abs(err) / 1.6) * this.safety.scale;
      if (this.safety.scale === 0) { v = 0; u = 0; }
      l = Math.max(-2, Math.min(2, v - u)); r = Math.max(-2, Math.min(2, v + u));
    } else if (this.safety.scale === 0) { l = 0; r = 0; }
    this.cmdl = l; this.cmdr = r;
    this.errHist[this.hi++ % this.errHist.length] = this.state === 'DRIVE' ? this.err : 0;
  };
  Sim.prototype.step = function (dt) {
    if (dt > 0.1) dt = 0.1;
    this.sacc += dt; this.acc += dt;
    if (!this.cut) { this.sonarAge += dt; }
    else this.sonarAge += dt;
    while (this.sacc >= 0.15) { this.sacc -= 0.15; if (!this.cut) { this.pingSonar(); this.pinged = true; } }
    while (this.acc >= DT) { this.acc -= DT; this.control(); }
    this.wl += (this.cmdl - this.wl) * Math.min(1, dt / TAU); this.wr += (this.cmdr - this.wr) * Math.min(1, dt / TAU);
    var v = (this.wl + this.wr) / 2, w = (this.wr - this.wl) / TRACK + this.gust;
    this.gust *= Math.pow(0.2, dt);
    this.th = wrap(this.th + w * dt); this.x += Math.cos(this.th) * v * dt; this.y += Math.sin(this.th) * v * dt;
    this.x = Math.max(0.3, Math.min(this.W - 0.3, this.x)); this.y = Math.max(0.3, Math.min(this.H - 0.3, this.y));
    this.spoke += v * dt * 6; this.v = v;
    if (this.state === 'DRIVE' && ((this.tn & 3) === 0 || true)) { if (this.tn < 598) { this.trace[this.tn++] = this.x; this.trace[this.tn++] = this.y; } }
  };
  Sim.prototype.preset = function (name) {
    var P = { aggressive: [3.2, 0.0, 0.0], sleepy: [0.12, 0.0, 0.05], right: [0.6, 0.02, 0.12] }[name];
    this.kp = P[0]; this.ki = P[1]; this.kd = P[2];
  };
  window.Sim = Sim; window.Safety = Safety; window.wrapAngle = wrap;
})();
