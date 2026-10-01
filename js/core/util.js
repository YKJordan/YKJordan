window.TJP = window.TJP || {};
(function (T) {
  const U = {};
  U.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.rand = (a, b) => a + Math.random() * (b - a);
  U.randInt = (a, b) => Math.floor(U.rand(a, b + 1));
  U.chance = p => Math.random() < p;
  U.pick = arr => arr[Math.floor(Math.random() * arr.length)];
  U.dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  U.dist2 = (a, b) => { const dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy; };
  U.angle = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
  U.angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
  U.weighted = obj => {
    let total = 0; for (const k in obj) total += obj[k];
    let r = Math.random() * total;
    for (const k in obj) { r -= obj[k]; if (r <= 0) return k; }
    return Object.keys(obj)[0];
  };
  // Seeded RNG (mulberry32) for map generation.
  U.seeded = seed => () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  U.cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
  U.shade = (hex, amt) => {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const n = parseInt(c, 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    if (amt < 0) { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
    else { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
    return '#' + [r, g, b].map(v => Math.round(U.clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
  };
  // Shiny palette: rotate hue.
  U.hueShift = (hex, deg) => {
    let c = hex.replace('#', '');
    const n = parseInt(c, 16);
    let r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0; const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > .5 ? d / (2 - max - min) : d / (max + min);
      h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h /= 6;
    }
    h = (h + deg / 360) % 1; if (h < 0) h += 1;
    const hue = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t; if (t < 1/2) return q; if (t < 2/3) return p + (q - p) * (2/3 - t) * 6; return p; };
    let rr, gg, bb;
    if (s === 0) rr = gg = bb = l; else {
      const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
      rr = hue(p, q, h + 1/3); gg = hue(p, q, h); bb = hue(p, q, h - 1/3);
    }
    return '#' + [rr, gg, bb].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
  };
  T.U = U;
})(window.TJP);
