// Turns decoded GIF frames into a horizontal strip of square frames that the game can draw.
// Frames are cropped to the union of their visible pixels, optionally shrunk, and bottom-aligned
// so the Pokémon's feet sit on the same line in every frame.
'use strict';
const { encodePng } = require('./png');

function bbox(frames, w, h) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (const f of frames) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (f.rgba[(y * w + x) * 4 + 3] === 0) continue;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

// Area-average resample of a region, done on premultiplied alpha so edges don't go dark.
function resample(src, sw, box, dw, dh) {
  const out = new Uint8Array(dw * dh * 4), sx = box.w / dw, sy = box.h / dh;
  for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
    const ax = box.x + x * sx, bx = box.x + (x + 1) * sx, ay = box.y + y * sy, by = box.y + (y + 1) * sy;
    let r = 0, g = 0, b = 0, a = 0, wsum = 0;
    for (let yy = Math.floor(ay); yy < Math.ceil(by); yy++) {
      const wy = Math.min(by, yy + 1) - Math.max(ay, yy);
      for (let xx = Math.floor(ax); xx < Math.ceil(bx); xx++) {
        const wgt = wy * (Math.min(bx, xx + 1) - Math.max(ax, xx));
        const o = (yy * sw + xx) * 4, al = src[o + 3] / 255;
        r += src[o] * al * wgt; g += src[o + 1] * al * wgt; b += src[o + 2] * al * wgt; a += al * wgt; wsum += wgt;
      }
    }
    const o = (y * dw + x) * 4;
    if (a > 0) { out[o] = Math.round(r / a); out[o + 1] = Math.round(g / a); out[o + 2] = Math.round(b / a); }
    out[o + 3] = Math.round(a / wsum * 255);
  }
  return out;
}

function buildSheet(gif, opts) {
  opts = Object.assign({ maxFrames: 48, maxSize: 128 }, opts);
  const { width: w, height: h } = gif;
  // Browsers treat delays under 20ms as 100ms; match them.
  let frames = gif.frames.map(f => ({ rgba: f.rgba, delay: f.delay < 20 ? 100 : f.delay }));
  if (frames.length > opts.maxFrames) {
    const step = Math.ceil(frames.length / opts.maxFrames), kept = [];
    for (let i = 0; i < frames.length; i += step) {
      const group = frames.slice(i, i + step);
      kept.push({ rgba: group[0].rgba, delay: group.reduce((s, f) => s + f.delay, 0) });
    }
    frames = kept;
  }
  const box = bbox(frames, w, h);
  if (!box) throw new Error('sprite is fully transparent');
  const scale = Math.min(1, opts.maxSize / Math.max(box.w, box.h));
  const dw = Math.max(1, Math.round(box.w * scale)), dh = Math.max(1, Math.round(box.h * scale));
  const side = Math.max(dw, dh) + 2;
  const ox = Math.floor((side - dw) / 2), oy = side - 1 - dh;
  const sheet = new Uint8Array(side * frames.length * side * 4), stride = side * frames.length * 4;
  frames.forEach((f, i) => {
    const px = scale < 1 ? resample(f.rgba, w, box, dw, dh) : null;
    for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
      const s = px ? (y * dw + x) * 4 : ((box.y + y) * w + box.x + x) * 4, src = px || f.rgba;
      const d = (oy + y) * stride + (i * side + ox + x) * 4;
      sheet[d] = src[s]; sheet[d + 1] = src[s + 1]; sheet[d + 2] = src[s + 2]; sheet[d + 3] = src[s + 3];
    }
  });
  const avgDelay = frames.reduce((s, f) => s + f.delay, 0) / frames.length;
  return { png: encodePng(side * frames.length, side, sheet), frames: frames.length, side, fps: Math.round(10000 / avgDelay) / 10 };
}

module.exports = { buildSheet, bbox };
