// Sprite pipeline checks: the GIF decoder against Pillow's decoding of the same files, PNG round
// trips, and the sprite-strip builder. Run: node tests/sprites.test.js
// Fixtures in tests/fixtures/gif are synthetic shapes made with Pillow; <name>.ref/NNN.png are Pillow's frames.
'use strict';
const fs = require('fs'), path = require('path');
const { decodeGif } = require('../tools/lib/gif');
const { encodePng, decodePng } = require('../tools/lib/png');
const { buildSheet, bbox } = require('../tools/lib/sheet');
const { urlFor } = require('../tools/fetch-sprites');

let fails = 0;
const check = (cond, msg) => { if (!cond) { fails++; console.error('FAIL:', msg); } };
const dir = path.join(__dirname, 'fixtures', 'gif');

for (const name of fs.readdirSync(dir).filter(f => f.endsWith('.gif')).sort()) {
  const gif = decodeGif(fs.readFileSync(path.join(dir, name)));
  const refDir = path.join(dir, name.replace(/\.gif$/, '.ref'));
  const refs = fs.readdirSync(refDir).sort();
  check(gif.frames.length === refs.length, `${name}: ${gif.frames.length} frames, Pillow has ${refs.length}`);
  let worst = 0;
  refs.forEach((r, i) => {
    const ref = decodePng(fs.readFileSync(path.join(refDir, r)));
    const ours = gif.frames[i] && gif.frames[i].rgba;
    if (!ours) return;
    check(ref.width === gif.width && ref.height === gif.height, `${name} frame ${i} size`);
    let bad = 0;
    for (let p = 0; p < ref.rgba.length; p += 4) {
      const ra = ref.rgba[p + 3] > 0, oa = ours[p + 3] > 0;
      if (ra !== oa || (ra && (ref.rgba[p] !== ours[p] || ref.rgba[p + 1] !== ours[p + 1] || ref.rgba[p + 2] !== ours[p + 2]))) bad++;
    }
    worst = Math.max(worst, bad);
  });
  check(worst === 0, `${name}: up to ${worst} pixels differ from Pillow`);

  // Sprite strip: square frames, bottom-aligned, within the size cap, nothing lost at the edges.
  const sheet = buildSheet(gif, { maxFrames: 16, maxSize: 64 });
  const png = decodePng(sheet.png);
  check(png.height === sheet.side && png.width === sheet.side * sheet.frames, `${name}: strip is ${sheet.frames} square frames`);
  check(sheet.side <= 66, `${name}: frame size ${sheet.side} within cap`);
  check(sheet.frames <= 16 && sheet.frames === Math.min(gif.frames.length, sheet.frames), `${name}: frame count capped`);
  check(sheet.frames === 1 || sheet.fps > 0, `${name}: has a frame rate`);
  const b = bbox([{ rgba: png.rgba }], png.width, png.height);
  check(b && b.y + b.h === png.height - 1, `${name}: sprite sits on the bottom edge (1px margin)`);
  console.log(`ok  ${name.padEnd(22)} ${String(gif.frames.length).padStart(2)} frames → strip ${sheet.frames}×${sheet.side}px @ ${sheet.fps} fps`);
}

// PNG round trip.
const w = 7, h = 5, px = new Uint8Array(w * h * 4).map((_, i) => (i * 37) & 255);
const rt = decodePng(encodePng(w, h, px));
check(rt.width === w && rt.height === h && rt.rgba.every((v, i) => v === px[i]), 'PNG round trip');

// URL templates.
const sp = { id: 'pikachu', name: 'Pikachu', dex: 25 };
check(urlFor('https://x/{name}.gif', sp) === 'https://x/pikachu.gif', 'url {name}');
check(urlFor('https://x/{dex3}-{dex}/{Name}', sp) === 'https://x/025-25/Pikachu', 'url {dex3} {dex} {Name}');

if (fails) { console.error(`${fails} failure(s)`); process.exit(1); }
console.log('sprites OK');
