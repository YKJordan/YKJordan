// Minimal animated-GIF decoder: returns fully composited RGBA frames.
// Handles global/local palettes, transparency, interlacing and disposal methods 0-3.
'use strict';

function lzw(minCodeSize, data, pixelCount) {
  const out = new Uint8Array(pixelCount);
  const clear = 1 << minCodeSize, eoi = clear + 1;
  const prefix = new Uint16Array(4096), suffix = new Uint8Array(4096), stack = new Uint8Array(4097);
  for (let i = 0; i < clear; i++) suffix[i] = i;
  let codeSize = minCodeSize + 1, mask = (1 << codeSize) - 1, available = clear + 2;
  let bits = 0, datum = 0, pos = 0, outPos = 0, old = -1, first = 0;
  while (outPos < pixelCount) {
    while (bits < codeSize) {
      if (pos >= data.length) return out; // truncated stream: leave the rest as index 0
      datum |= data[pos++] << bits; bits += 8;
    }
    let code = datum & mask;
    datum >>>= codeSize; bits -= codeSize;
    if (code === clear) { codeSize = minCodeSize + 1; mask = (1 << codeSize) - 1; available = clear + 2; old = -1; continue; }
    if (code === eoi) break;
    if (old === -1) { out[outPos++] = suffix[code]; old = first = code; continue; }
    const inCode = code;
    let top = 0;
    if (code >= available) { stack[top++] = first; code = old; }
    while (code > clear) { stack[top++] = suffix[code]; code = prefix[code]; }
    first = suffix[code];
    stack[top++] = first;
    if (available < 4096) {
      prefix[available] = old; suffix[available] = first; available++;
      if ((available & mask) === 0 && available < 4096) { codeSize++; mask += available; }
    }
    old = inCode;
    while (top > 0 && outPos < pixelCount) out[outPos++] = stack[--top];
  }
  return out;
}

function readPalette(buf, pos, size) {
  const pal = new Uint8Array(size * 3);
  buf.copy ? buf.copy(pal, 0, pos, pos + size * 3) : pal.set(buf.subarray(pos, pos + size * 3));
  return pal;
}

function decodeGif(buf) {
  buf = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  const sig = buf.toString('ascii', 0, 6);
  if (sig !== 'GIF87a' && sig !== 'GIF89a') throw new Error('not a GIF');
  const width = buf.readUInt16LE(6), height = buf.readUInt16LE(8);
  const packed = buf[10];
  let pos = 13, gct = null;
  if (packed & 0x80) { const n = 1 << ((packed & 7) + 1); gct = readPalette(buf, pos, n); pos += n * 3; }

  const canvas = new Uint8Array(width * height * 4); // transparent background, as browsers render sprites
  const frames = [];
  let gce = { disposal: 0, delay: 0, transparent: -1 };
  let pendingDisposal = null;

  const readSubBlocks = () => {
    const parts = [];
    while (pos < buf.length) {
      const n = buf[pos++];
      if (n === 0) break;
      parts.push(buf.subarray(pos, pos + n)); pos += n;
    }
    return Buffer.concat(parts);
  };

  while (pos < buf.length) {
    const b = buf[pos++];
    if (b === 0x3B) break; // trailer
    if (b === 0x21) {
      const label = buf[pos++];
      if (label === 0xF9) {
        const data = readSubBlocks();
        const p = data[0];
        gce = { disposal: (p >> 2) & 7, delay: data.readUInt16LE(1) * 10, transparent: (p & 1) ? data[3] : -1 };
      } else readSubBlocks();
      continue;
    }
    if (b !== 0x2C) break; // unknown block: stop rather than misread
    const fx = buf.readUInt16LE(pos), fy = buf.readUInt16LE(pos + 2);
    const fw = buf.readUInt16LE(pos + 4), fh = buf.readUInt16LE(pos + 6);
    const ip = buf[pos + 8]; pos += 9;
    let pal = gct;
    if (ip & 0x80) { const n = 1 << ((ip & 7) + 1); pal = readPalette(buf, pos, n); pos += n * 3; }
    const interlaced = !!(ip & 0x40);
    const minCode = buf[pos++];
    const indices = lzw(minCode, readSubBlocks(), fw * fh);

    // Apply the previous frame's disposal before drawing this one.
    if (pendingDisposal) {
      const d = pendingDisposal;
      if (d.mode === 2) {
        for (let y = d.y; y < d.y + d.h && y < height; y++) canvas.fill(0, (y * width + d.x) * 4, (y * width + Math.min(width, d.x + d.w)) * 4);
      } else if (d.mode === 3 && d.saved) canvas.set(d.saved);
      pendingDisposal = null;
    }
    const saved = gce.disposal === 3 ? canvas.slice() : null;

    // Row order for interlaced images.
    let rows;
    if (interlaced) { rows = []; for (const [start, step] of [[0, 8], [4, 8], [2, 4], [1, 2]]) for (let r = start; r < fh; r += step) rows.push(r); }
    for (let i = 0; i < fh; i++) {
      const row = interlaced ? rows[i] : i, y = fy + row;
      if (y >= height) continue;
      for (let x = 0; x < fw; x++) {
        const cx = fx + x; if (cx >= width) continue;
        const idx = indices[i * fw + x];
        if (idx === gce.transparent || !pal) continue;
        const o = (y * width + cx) * 4;
        canvas[o] = pal[idx * 3]; canvas[o + 1] = pal[idx * 3 + 1]; canvas[o + 2] = pal[idx * 3 + 2]; canvas[o + 3] = 255;
      }
    }
    frames.push({ rgba: canvas.slice(), delay: gce.delay });
    pendingDisposal = { mode: gce.disposal, x: fx, y: fy, w: fw, h: fh, saved };
    gce = { disposal: 0, delay: 0, transparent: -1 };
  }
  return { width, height, frames };
}

module.exports = { decodeGif };
