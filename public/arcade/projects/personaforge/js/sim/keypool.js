/* Key pool simulation (SIMULATION, illustrative). Round robin that skips keys in cooldown or dead. */
(function () {
  function KeyPool(n) {
    this.keys = []; for (var i = 0; i < n; i++) this.keys.push({ i: i, st: 'live', cool: 0, max: 0, hits: 0 });
    this.ptr = 0; this.seed = 7; this.last = -1;
  }
  KeyPool.prototype.rnd = function () { this.seed = (this.seed * 16807) % 2147483647; return this.seed / 2147483647; };
  KeyPool.prototype.next = function () { // returns key index or -1 when everything is resting
    var n = this.keys.length;
    for (var k = 0; k < n; k++) { var i = (this.ptr + k) % n; if (this.keys[i].st === 'live') { this.ptr = (i + 1) % n; this.last = i; this.keys[i].hits++; return i; } }
    this.last = -1; return -1;
  };
  KeyPool.prototype.rateLimit = function (i, sec) { var k = this.keys[i]; if (k.st === 'dead') return; k.st = 'cool'; k.cool = sec; k.max = sec; };
  KeyPool.prototype.kill = function (i) { this.keys[i].st = 'dead'; this.keys[i].cool = 0; };
  KeyPool.prototype.revive = function (i) { this.keys[i].st = 'live'; };
  KeyPool.prototype.reset = function () { var s = this; this.keys.forEach(function (k) { k.st = 'live'; k.cool = 0; k.hits = 0; }); this.ptr = 0; this.seed = 7; };
  KeyPool.prototype.tick = function (dt) { this.keys.forEach(function (k) { if (k.st === 'cool') { k.cool -= dt; if (k.cool <= 0) { k.st = 'live'; k.cool = 0; } } }); };
  KeyPool.prototype.liveCount = function () { return this.keys.filter(function (k) { return k.st === 'live'; }).length; };
  KeyPool.prototype.coolCount = function () { return this.keys.filter(function (k) { return k.st === 'cool'; }).length; };
  PF.KeyPool = KeyPool;
})();
