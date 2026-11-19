/* Pure JS synchronous SHA-256 (no crypto.subtle). Returns lowercase hex. */
(function () {
  var K = new Uint32Array([
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
  function utf8(s) {
    var o = [], i, c;
    for (i = 0; i < s.length; i++) {
      c = s.charCodeAt(i);
      if (c < 128) o.push(c);
      else if (c < 2048) o.push(192 | (c >> 6), 128 | (c & 63));
      else if (c >= 0xd800 && c < 0xdc00 && i + 1 < s.length) {
        c = 0x10000 + ((c & 0x3ff) << 10) + (s.charCodeAt(++i) & 0x3ff);
        o.push(240 | (c >> 18), 128 | ((c >> 12) & 63), 128 | ((c >> 6) & 63), 128 | (c & 63));
      } else o.push(224 | (c >> 12), 128 | ((c >> 6) & 63), 128 | (c & 63));
    }
    return o;
  }
  function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }
  window.sha256 = function (str) {
    var b = utf8(str), l = b.length, i, j;
    b.push(0x80);
    while (b.length % 64 !== 56) b.push(0);
    var hi = Math.floor(l / 0x20000000), lo = (l << 3) >>> 0;
    b.push((hi >>> 24) & 255, (hi >>> 16) & 255, (hi >>> 8) & 255, hi & 255, (lo >>> 24) & 255, (lo >>> 16) & 255, (lo >>> 8) & 255, lo & 255);
    var H = new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);
    var w = new Uint32Array(64);
    for (i = 0; i < b.length; i += 64) {
      for (j = 0; j < 16; j++) w[j] = (b[i + 4*j] << 24) | (b[i + 4*j + 1] << 16) | (b[i + 4*j + 2] << 8) | b[i + 4*j + 3];
      for (j = 16; j < 64; j++) {
        var s0 = rotr(w[j-15],7) ^ rotr(w[j-15],18) ^ (w[j-15] >>> 3);
        var s1 = rotr(w[j-2],17) ^ rotr(w[j-2],19) ^ (w[j-2] >>> 10);
        w[j] = (w[j-16] + s0 + w[j-7] + s1) | 0;
      }
      var a = H[0], bb = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (j = 0; j < 64; j++) {
        var S1 = rotr(e,6) ^ rotr(e,11) ^ rotr(e,25), ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + K[j] + w[j]) | 0;
        var S0 = rotr(a,2) ^ rotr(a,13) ^ rotr(a,22), mj = (a & bb) ^ (a & c) ^ (bb & c);
        var t2 = (S0 + mj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0;
      }
      H[0] += a; H[1] += bb; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
    }
    var out = '';
    for (i = 0; i < 8; i++) out += ('00000000' + H[i].toString(16)).slice(-8);
    return out;
  };
})();
