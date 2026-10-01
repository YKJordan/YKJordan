// Creature art. Procedural vector drawings of each species, built from its `art` descriptor.
// If assets/sprites/<speciesId>.png exists it is used instead. Sprites are not shipped: see assets/README.md.
window.TJP = window.TJP || {};
(function (T) {
  const U = T.U;
  const sprites = {};
  T.Sprites = {
    // Only species listed in assets/sprites/sprites.js are requested, so missing files never spam 404s.
    load(ids) {
      const wanted = window.TJP_SPRITES || [];
      for (const id of ids.filter(i => wanted.includes(i))) {
        const img = new Image();
        img.onload = () => { sprites[id] = img; };
        img.onerror = () => {};
        img.src = 'assets/sprites/' + id + '.png';
      }
    },
    get: id => sprites[id] || null,
    count: () => Object.keys(sprites).length
  };

  function ell(g, x, y, rx, ry, fill, rot) { g.fillStyle = fill; g.beginPath(); g.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot || 0, 0, Math.PI * 2); g.fill(); }
  function tri(g, a, b, c, fill) { g.fillStyle = fill; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.closePath(); g.fill(); }
  function line(g, x1, y1, x2, y2, col, w) { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }

  function palette(sp, shiny) {
    const a = sp.art; let c1 = a.c1 || '#999', c2 = a.c2 || c1, c3 = a.c3 || '#fff';
    if (shiny) { c1 = U.hueShift(c1, 140); c2 = U.hueShift(c2, 140); c3 = U.hueShift(c3, 60); }
    return { c1, c2, c3, dark: U.shade(c1, -.35), out: 'rgba(20,16,24,.85)' };
  }

  function eye(g, x, y, s, angry) {
    ell(g, x, y, s * .13, s * .15, '#1b1b22');
    ell(g, x + s * .04, y - s * .05, s * .045, s * .045, '#fff');
    if (angry) line(g, x - s * .16, y - s * .2, x + s * .1, y - s * .12, '#1b1b22', s * .06);
  }

  function ears(g, kind, hx, hy, s, P) {
    const c = P.c1, d = P.dark;
    switch (kind) {
      case 'point': tri(g, [hx - s * .25, hy - s * .25], [hx - s * .05, hy - s * .7], [hx + s * .1, hy - s * .3], c);
        tri(g, [hx + s * .05, hy - s * .3], [hx + s * .3, hy - s * .7], [hx + s * .35, hy - s * .2], d); break;
      case 'long': ell(g, hx - s * .15, hy - s * .55, s * .12, s * .38, c, -.25); ell(g, hx + s * .2, hy - s * .55, s * .12, s * .38, d, .25); break;
      case 'long_tip': ell(g, hx - s * .12, hy - s * .6, s * .1, s * .42, c, -.3);
        ell(g, hx - s * .25, hy - s * .92, s * .08, s * .12, '#1b1b22', -.3); ell(g, hx + s * .22, hy - s * .6, s * .1, s * .42, c, .3);
        ell(g, hx + s * .35, hy - s * .92, s * .08, s * .12, '#1b1b22', .3); break;
      case 'round': ell(g, hx - s * .2, hy - s * .38, s * .16, s * .16, d); ell(g, hx + s * .18, hy - s * .4, s * .16, s * .16, d);
        ell(g, hx - s * .2, hy - s * .38, s * .08, s * .08, P.c3); ell(g, hx + s * .18, hy - s * .4, s * .08, s * .08, P.c3); break;
      case 'cat': tri(g, [hx - s * .3, hy - s * .2], [hx - s * .2, hy - s * .6], [hx - s * .02, hy - s * .3], c);
        tri(g, [hx + s * .05, hy - s * .3], [hx + s * .25, hy - s * .62], [hx + s * .32, hy - s * .18], d); break;
      case 'fin': tri(g, [hx - s * .2, hy - s * .2], [hx - s * .35, hy - s * .7], [hx + s * .05, hy - s * .3], P.c2);
        tri(g, [hx + s * .1, hy - s * .3], [hx + s * .3, hy - s * .75], [hx + s * .35, hy - s * .2], P.c2); break;
      case 'horn1': tri(g, [hx - s * .05, hy - s * .3], [hx + s * .05, hy - s * .7], [hx + s * .15, hy - s * .28], P.c3 === '#ffffff' ? '#ddd' : U.shade(c, -.2)); break;
      case 'horn2': tri(g, [hx - s * .2, hy - s * .25], [hx - s * .35, hy - s * .65], [hx - s * .05, hy - s * .3], '#d8d0c0');
        tri(g, [hx + s * .1, hy - s * .3], [hx + s * .05, hy - s * .7], [hx + s * .28, hy - s * .3], '#c8c0b0'); break;
      case 'antler': line(g, hx - s * .1, hy - s * .3, hx - s * .35, hy - s * .9, '#6b4a2a', s * .08); line(g, hx - s * .25, hy - s * .6, hx - s * .5, hy - s * .7, '#6b4a2a', s * .07);
        line(g, hx + s * .1, hy - s * .3, hx + s * .3, hy - s * .9, '#6b4a2a', s * .08); break;
      case 'feather': tri(g, [hx - s * .1, hy - s * .25], [hx - s * .45, hy - s * .55], [hx + s * .05, hy - s * .35], P.c3); break;
      case 'blade': tri(g, [hx - s * .1, hy - s * .25], [hx - s * .6, hy - s * .75], [hx + s * .1, hy - s * .38], '#3a3f55'); break;
      case 'small': ell(g, hx - s * .2, hy - s * .3, s * .1, s * .08, d); ell(g, hx + s * .2, hy - s * .3, s * .1, s * .08, d); break;
      case 'tuft': line(g, hx, hy - s * .3, hx - s * .05, hy - s * .55, '#222', s * .04); line(g, hx + s * .05, hy - s * .3, hx + s * .12, hy - s * .55, '#222', s * .04); break;
      case 'antenna': line(g, hx - s * .05, hy - s * .3, hx - s * .2, hy - s * .65, c, s * .05); ell(g, hx - s * .2, hy - s * .65, s * .06, s * .06, c); break;
      case 'nub': ell(g, hx - s * .15, hy - s * .3, s * .08, s * .1, c); ell(g, hx + s * .15, hy - s * .3, s * .08, s * .1, c); break;
    }
  }

  function tail(g, kind, tx, ty, s, P, t) {
    const sw = Math.sin(t * 6) * s * .06;
    switch (kind) {
      case 'bolt': g.fillStyle = P.c1; g.beginPath(); g.moveTo(tx, ty); g.lineTo(tx - s * .35, ty - s * .25 + sw); g.lineTo(tx - s * .2, ty - s * .35 + sw);
        g.lineTo(tx - s * .55, ty - s * .75 + sw); g.lineTo(tx - s * .3, ty - s * .55 + sw); g.lineTo(tx - s * .4, ty - s * .45 + sw); g.lineTo(tx - s * .05, ty - s * .1); g.fill();
        ell(g, tx - s * .05, ty - s * .05, s * .07, s * .07, '#8a5a2b'); break;
      case 'bolt_long': line(g, tx, ty, tx - s * .8, ty - s * .5 + sw, '#222', s * .06); tri(g, [tx - s * .8, ty - s * .7 + sw], [tx - s * 1.05, ty - s * .45 + sw], [tx - s * .75, ty - s * .35 + sw], P.c3); break;
      case 'flame': ell(g, tx - s * .25, ty - s * .05, s * .3, s * .1, P.c1, -.4);
        ell(g, tx - s * .5, ty - s * .3 + sw, s * .14, s * .22, '#ff9b2a'); ell(g, tx - s * .5, ty - s * .27 + sw, s * .08, s * .13, '#ffe45a'); break;
      case 'fluffy': ell(g, tx - s * .3, ty - s * .25 + sw, s * .3, s * .2, P.c2 !== P.c1 ? P.c2 : P.dark, -.6); break;
      case 'thin': line(g, tx, ty, tx - s * .45, ty - s * .25 + sw, P.c1, s * .08); break;
      case 'curl': g.strokeStyle = P.c1; g.lineWidth = s * .08; g.beginPath(); g.arc(tx - s * .3, ty - s * .2 + sw, s * .2, 0, Math.PI * 1.6); g.stroke(); break;
      case 'fin': tri(g, [tx, ty], [tx - s * .55, ty - s * .45 + sw], [tx - s * .5, ty + s * .1], P.c2); break;
      case 'spiky': tri(g, [tx, ty], [tx - s * .5, ty - s * .5 + sw], [tx - s * .15, ty + s * .05], P.c2); break;
      case 'star': line(g, tx, ty, tx - s * .45, ty - s * .3 + sw, '#262a36', s * .06);
        g.fillStyle = P.c3; g.save(); g.translate(tx - s * .5, ty - s * .35 + sw); g.beginPath();
        for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? s * .07 : s * .17; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.fill(); g.restore(); break;
      case 'blade': ell(g, tx - s * .3, ty - s * .25 + sw, s * .32, s * .1, P.c2, -.7); break;
      case 'orb': line(g, tx, ty, tx - s * .45, ty - s * .1, P.c2, s * .07); ell(g, tx - s * .5, ty - s * .12, s * .1, s * .1, '#ff6a3a'); break;
      case 'thick': ell(g, tx - s * .35, ty + s * .05, s * .4, s * .16, P.c1, .3); break;
    }
  }

  function extras(g, list, s, P, t, head) {
    const hx = head.x, hy = head.y;
    for (const x of list) switch (x) {
      case 'cheeks': ell(g, hx + s * .12, hy + s * .1, s * .09, s * .09, '#e63946'); break;
      case 'ruff': ell(g, hx - s * .25, hy + s * .3, s * .25, s * .18, P.c2); break;
      case 'mane': ell(g, hx - s * .2, hy + s * .05, s * .35, s * .38, P.c2 === P.c1 ? P.dark : P.c2); break;
      case 'mane_small': ell(g, hx - s * .2, hy, s * .25, s * .25, P.c2); break;
      case 'stripes': for (let i = 0; i < 3; i++) line(g, -s * .3 + i * s * .25, -s * .25, -s * .35 + i * s * .25, s * .05, '#2a2a2a', s * .05); break;
      case 'spots': ell(g, -s * .2, -s * .1, s * .08, s * .06, P.dark); ell(g, s * .15, s * .05, s * .07, s * .05, P.dark); break;
      case 'bulb': ell(g, -s * .1, -s * .45, s * .38, s * .35, '#4c9a3a'); line(g, -s * .1, -s * .75, -s * .1, -s * .45, '#2f6e2a', s * .04); break;
      case 'bud': ell(g, -s * .1, -s * .5, s * .3, s * .28, '#e86a9a'); tri(g, [-s * .5, -s * .3], [-s * .1, -s * .9], [s * .3, -s * .3], '#3f8a3a'); break;
      case 'flower': for (let i = 0; i < 5; i++) { const a = i * 1.26 + t * .2; ell(g, -s * .1 + Math.cos(a) * s * .35, -s * .55 + Math.sin(a) * s * .15, s * .28, s * .14, P.c3, a); }
        ell(g, -s * .1, -s * .58, s * .14, s * .1, '#f7d02c'); break;
      case 'shell': ell(g, -s * .15, -s * .05, s * .5, s * .45, P.c3); ell(g, -s * .1, 0, s * .38, s * .33, U.shade(P.c3, .25)); break;
      case 'cannons': line(g, -s * .2, -s * .45, s * .3, -s * .6, '#9a9aa8', s * .14); break;
      case 'wings': tri(g, [-s * .1, -s * .3], [-s * .9, -s * 1.0 + Math.sin(t * 8) * s * .15], [-s * .5, -s * .1], P.c3); break;
      case 'wings_tiny': tri(g, [-s * .2, -s * .2], [-s * .5, -s * .5], [-s * .4, -s * .05], P.c1); break;
      case 'wings_bug': ell(g, -s * .2, -s * .55 + Math.sin(t * 14) * s * .1, s * .45, s * .3, P.c2, -.4); ell(g, -s * .25, -s * .55, s * .2, s * .1, P.c3, -.4); break;
      case 'collar': for (let i = 0; i < 3; i++) ell(g, hx - s * .2 + i * s * .12, hy + s * .32, s * .07, s * .05, '#d9d9d9'); break;
      case 'teeth': tri(g, [hx + s * .3, hy + s * .1], [hx + s * .38, hy + s * .32], [hx + s * .42, hy + s * .1], '#fff'); break;
      case 'whiskers': line(g, hx + s * .25, hy + s * .05, hx + s * .55, hy, '#222', s * .025); line(g, hx + s * .25, hy + s * .1, hx + s * .55, hy + s * .15, '#222', s * .025); break;
      case 'coin': ell(g, hx, hy - s * .35, s * .12, s * .12, '#f2c94c'); break;
      case 'gem': ell(g, hx + s * .05, hy - s * .3, s * .08, s * .08, P.c3); break;
      case 'scar': line(g, hx - s * .05, hy - s * .25, hx + s * .2, hy + s * .2, '#c0392b', s * .07); break;
      case 'claws': for (let i = 0; i < 3; i++) line(g, s * .35 + i * s * .06, s * .2, s * .45 + i * s * .06, s * .38, '#f0f0f0', s * .035); break;
      case 'crest': tri(g, [hx - s * .1, hy - s * .3], [hx - s * .35, hy - s * .75], [hx + s * .1, hy - s * .35], P.c3); break;
      case 'plume': tri(g, [hx - s * .2, hy - s * .2], [hx - s * .8, hy - s * .4], [hx - s * .1, hy - s * .4], '#f2c94c'); break;
      case 'mask': ell(g, hx + s * .1, hy - s * .02, s * .25, s * .1, '#262a36'); break;
      case 'spikes': for (let i = 0; i < 3; i++) tri(g, [-s * .4 + i * s * .3, -s * .35], [-s * .3 + i * s * .3, -s * .7], [-s * .2 + i * s * .3, -s * .35], P.c2 === P.c1 ? P.dark : '#e8e8f0'); break;
      case 'rings': ell(g, hx, hy - s * .1, s * .08, s * .08, P.c3); ell(g, -s * .2, -s * .1, s * .1, s * .1, P.c3); break;
      case 'diamonds': tri(g, [-s * .1, -s * .3], [s * .0, -s * .45], [s * .1, -s * .3], P.c3); break;
      case 'hood': ell(g, hx - s * .05, hy + s * .2, s * .32, s * .4, P.c1); ell(g, hx - s * .05, hy + s * .2, s * .15, s * .2, P.c3); break;
      case 'blade': tri(g, [-s * .8, s * .2], [-s * 1.2, -s * .1], [-s * .75, -s * .05], '#c0392b'); break;
      case 'mustache': line(g, hx + s * .2, hy + s * .15, hx + s * .1, hy + s * .55, '#8a5a2b', s * .05); break;
      case 'spoon': line(g, s * .45, s * .1, s * .65, -s * .35, '#c0c0c0', s * .05); ell(g, s * .67, -s * .4, s * .07, s * .1, '#d0d0d0'); break;
      case 'sleepy': line(g, hx + s * .05, hy - s * .05, hx + s * .25, hy - s * .05, '#1b1b22', s * .05); break;
      case 'tube': line(g, hx - s * .15, hy + s * .15, -s * .3, -s * .3, P.c2, s * .07); break;
      case 'belly_hole': ell(g, s * .05, s * .05, s * .12, s * .1, '#3a6aa8'); break;
      case 'big_belly': ell(g, s * .1, s * .1, s * .55, s * .5, P.c2); break;
      case 'bill': ell(g, hx + s * .32, hy + s * .1, s * .2, s * .09, '#f6e7c8'); break;
      case 'leafback': ell(g, -s * .1, -s * .35, s * .45, s * .18, P.c3); break;
      case 'flower_head': ell(g, hx, hy - s * .35, s * .1, s * .1, '#ff9ac0'); break;
      case 'antlers': for (const dx of [-s * .15, s * .1]) { line(g, hx + dx, hy - s * .3, hx + dx - s * .2, hy - s * .9, '#6b4a2a', s * .06);
        ell(g, hx + dx - s * .2, hy - s * .9, s * .16, s * .1, P.c3); } break;
      case 'wool': ell(g, -s * .05, -s * .1, s * .65, s * .45, P.c1); ell(g, hx, hy - s * .22, s * .2, s * .15, P.c1); break;
      case 'wool_small': ell(g, hx - s * .1, hy + s * .25, s * .2, s * .15, P.c2); break;
      case 'leaves_top': for (const a of [-.6, 0, .6]) ell(g, Math.sin(a) * s * .3, -s * .7, s * .12, s * .32, P.c3, a); break;
      case 'petals_top': for (const a of [-.9, -.3, .3, .9]) ell(g, Math.sin(a) * s * .45, -s * .65, s * .22, s * .14, P.c3, a); break;
      case 'big_flower': ell(g, 0, -s * .65, s * .75, s * .25, P.c3); ell(g, 0, -s * .65, s * .25, s * .1, '#f6e7c8'); break;
      case 'drool': ell(g, s * .25, s * .25, s * .05, s * .1, '#f2c94c'); break;
      case 'curl_top': g.strokeStyle = P.c1; g.lineWidth = s * .07; g.beginPath(); g.arc(s * .05, -s * .65, s * .12, Math.PI, Math.PI * 2.5); g.stroke(); break;
      case 'antenna': line(g, hx + s * .1, hy - s * .25, hx + s * .3, hy - s * .55, '#222', s * .04); line(g, hx, hy - s * .25, hx + s * .05, hy - s * .6, '#222', s * .04); break;
      case 'segments': for (let i = 0; i < 3; i++) ell(g, -s * .3 + i * s * .25, s * .05, s * .05, s * .05, P.c2); break;
      case 'ear_fins': ell(g, hx - s * .1, hy - s * .25, s * .12, s * .06, '#fff', -.6); break;
      case 'ear_wings': tri(g, [hx - s * .1, hy - s * .2], [hx - s * .35, hy - s * .45], [hx - s * .15, hy - s * .05], '#fff'); break;
      case 'horn': tri(g, [hx + s * .05, hy - s * .25], [hx + s * .1, hy - s * .55], [hx + s * .18, hy - s * .25], '#fff'); break;
      case 'orbs': ell(g, hx - s * .1, hy + s * .3, s * .08, s * .08, '#5aa6f0'); break;
      case 'fangs': tri(g, [hx + s * .25, hy + s * .15], [hx + s * .3, hy + s * .38], [hx + s * .35, hy + s * .15], '#fff'); break;
      case 'shell_plates': line(g, -s * .4, -s * .1, s * .4, -s * .1, P.c3, s * .05); line(g, -s * .35, s * .15, s * .35, s * .15, P.c3, s * .05); break;
      case 'feet': ell(g, -s * .25, s * .55, s * .14, s * .08, P.dark); ell(g, s * .25, s * .55, s * .14, s * .08, P.dark); break;
    }
  }

  // Draw a creature at (0,0) facing right; feet at y = s*.6.
  function drawBody(g, sp, s, t, moving, P, angry) {
    const a = sp.art, list = a.x || [];
    const step = moving ? Math.sin(t * 14) : 0;
    const bob = moving ? Math.abs(step) * s * .06 : Math.sin(t * 2) * s * .02;
    g.translate(0, -bob);
    const behind = ['wings','wings_bug','bulb','bud','flower','shell','leafback','wool','spikes','blade','cannons','wings_tiny','tube'];
    const front = list.filter(x => !behind.includes(x));
    const back = list.filter(x => behind.includes(x));
    let head = { x: s * .45, y: -s * .35 };
    switch (a.body) {
      case 'quad': {
        tail(g, a.tail, -s * .55, -s * .05, s, P, t);
        extras(g, back.filter(x => !['shell','wool'].includes(x)), s, P, t, head);
        for (const [lx, ph] of [[-s * .35, 1], [s * .25, -1]]) {
          line(g, lx, s * .1, lx + step * ph * s * .12, s * .55, P.dark, s * .16);
        }
        ell(g, 0, 0, s * .62, s * .36, P.c1);
        ell(g, s * .05, s * .12, s * .45, s * .18, P.c2);
        if (list.includes('wool')) extras(g, ['wool'], s, P, t, head);
        for (const [lx, ph] of [[-s * .25, -1], [s * .35, 1]]) {
          line(g, lx, s * .12, lx + step * ph * s * .12, s * .58, P.c1, s * .16);
        }
        head = { x: s * .55, y: -s * .35 };
        ears(g, a.ears, head.x, head.y, s, P);
        ell(g, head.x, head.y, s * .36, s * .32, P.c1);
        ell(g, head.x + s * .26, head.y + s * .1, s * .16, s * .12, P.c2 !== P.c1 ? P.c2 : U.shade(P.c1, .15));
        ell(g, head.x + s * .4, head.y + s * .06, s * .05, s * .04, '#1b1b22');
        eye(g, head.x + s * .12, head.y - s * .05, s, angry);
        break;
      }
      case 'biped': {
        tail(g, a.tail, -s * .35, s * .25, s, P, t);
        extras(g, back, s, P, t, head);
        line(g, -s * .15, s * .2, -s * .15 + step * s * .1, s * .6, P.dark, s * .18);
        line(g, s * .15, s * .2, s * .15 - step * s * .1, s * .6, P.c1, s * .18);
        ell(g, 0, s * .05, s * .38, s * .45, P.c1);
        ell(g, s * .08, s * .12, s * .25, s * .3, P.c2);
        line(g, s * .1, -s * .1, s * .42, s * .12 + step * s * .05, P.c1, s * .13);
        head = { x: s * .1, y: -s * .55 };
        ears(g, a.ears, head.x, head.y, s, P);
        ell(g, head.x, head.y, s * .36, s * .33, P.c1);
        ell(g, head.x + s * .24, head.y + s * .08, s * .14, s * .1, U.shade(P.c1, .1));
        eye(g, head.x + s * .12, head.y - s * .04, s, angry);
        break;
      }
      case 'serpent': {
        const n = 6;
        for (let i = n; i >= 0; i--) {
          const px = -s * .9 + i * s * .25, py = s * .3 + Math.sin(t * 6 + i * .9) * s * (moving ? .12 : .04);
          ell(g, px, py, s * .2, s * .17, i % 2 ? P.c1 : U.shade(P.c1, -.08));
          ell(g, px, py + s * .08, s * .14, s * .06, P.c2);
        }
        head = { x: s * .55, y: -s * .1 };
        extras(g, back, s, P, t, head);
        ell(g, head.x, head.y, s * .3, s * .26, P.c1);
        eye(g, head.x + s * .1, head.y - s * .06, s, angry);
        line(g, head.x + s * .25, head.y + s * .1, head.x + s * .4, head.y + s * .12, '#e63946', s * .03);
        break;
      }
      case 'blob': case 'pupa': {
        extras(g, back, s, P, t, head);
        if (a.body === 'pupa') { g.save(); g.rotate(-.2); ell(g, 0, 0, s * .4, s * .6, P.c1); ell(g, s * .12, -s * .1, s * .2, s * .35, P.c2); g.restore(); }
        else { ell(g, 0, s * .05, s * .55, s * .5, P.c1); }
        head = { x: s * .15, y: -s * .15 };
        if (a.ears) ears(g, a.ears, head.x, head.y - s * .15, s, P);
        if (a.tail) tail(g, a.tail, -s * .45, s * .15, s, P, t);
        eye(g, s * .25, -s * .05, s * .8, angry);
        break;
      }
      case 'bird': {
        const flap = Math.sin(t * (moving ? 18 : 4)) * s * .25;
        tri(g, [-s * .3, s * .05], [-s * .75, s * .1], [-s * .4, s * .3], P.dark);
        ell(g, 0, 0, s * .45, s * .35, P.c1);
        ell(g, s * .08, s * .1, s * .3, s * .2, P.c2);
        tri(g, [-s * .1, -s * .05], [-s * .5, -s * .4 - flap], [-s * .4, s * .1], P.dark);
        head = { x: s * .35, y: -s * .3 };
        ell(g, head.x, head.y, s * .25, s * .23, P.c1);
        tri(g, [head.x + s * .2, head.y - s * .02], [head.x + s * .45, head.y + s * .06], [head.x + s * .2, head.y + s * .12], '#e8a03a');
        eye(g, head.x + s * .08, head.y - s * .04, s * .8, angry);
        line(g, -s * .05, s * .3, -s * .05, s * .55, '#e8a03a', s * .05); line(g, s * .1, s * .3, s * .1, s * .55, '#e8a03a', s * .05);
        break;
      }
      case 'fish': {
        const wag = Math.sin(t * 10) * s * .15;
        tri(g, [-s * .4, 0], [-s * .8, -s * .3 + wag], [-s * .8, s * .3 + wag], P.c2);
        ell(g, 0, 0, s * .5, s * .4, P.c1);
        tri(g, [-s * .1, -s * .35], [s * .1, -s * .7], [s * .2, -s * .3], P.c3);
        head = { x: s * .2, y: -s * .1 };
        ell(g, s * .25, -s * .1, s * .12, s * .12, '#fff'); ell(g, s * .27, -s * .1, s * .05, s * .05, '#1b1b22');
        ell(g, s * .45, s * .1, s * .08, s * .06, '#f6e7c8');
        break;
      }
      case 'ghost': {
        const wob = Math.sin(t * 5) * s * .05;
        g.globalAlpha *= .9;
        ell(g, 0, wob, s * .75, s * .7, P.c2 + '66');
        ell(g, 0, wob, s * .45, s * .45, P.c1);
        head = { x: 0, y: wob };
        eye(g, s * .1, wob - s * .12, s, true); eye(g, s * .3, wob - s * .1, s * .9, true);
        break;
      }
      case 'orb': {
        const hover = Math.sin(t * 4) * s * .08;
        g.translate(0, -s * .2 + hover);
        ell(g, 0, s * .9, s * .4, s * .1, 'rgba(0,0,0,.25)');
        extras(g, back, s, P, t, head);
        ell(g, 0, 0, s * .5, s * .5, P.c1);
        ell(g, -s * .15, -s * .18, s * .12, s * .1, 'rgba(255,255,255,.35)');
        head = { x: s * .1, y: 0 };
        if (list.includes('eye')) { ell(g, s * .15, 0, s * .2, s * .2, '#fff'); ell(g, s * .2, 0, s * .08, s * .08, '#1b1b22'); }
        else { eye(g, s * .1, -s * .1, s * .9, true); eye(g, s * .3, -s * .1, s * .9, true); }
        if (list.includes('magnets')) { line(g, -s * .5, -s * .1, -s * .8, -s * .1, '#b7b7ce', s * .1); line(g, s * .5, -s * .1, s * .8, -s * .1, '#b7b7ce', s * .1);
          ell(g, -s * .85, -s * .1, s * .06, s * .12, '#e63946'); ell(g, s * .85, -s * .1, s * .06, s * .12, '#5a7fd0'); }
        if (list.includes('skull')) { ell(g, -s * .05, s * .25, s * .1, s * .08, P.c2); }
        if (list.includes('crater')) { ell(g, -s * .3, -s * .3, s * .07, s * .07, U.shade(P.c1, -.25)); ell(g, s * .3, s * .3, s * .06, s * .06, U.shade(P.c1, -.25)); }
        if (list.includes('smoke')) { ell(g, -s * .55, -s * .35 + hover, s * .14, s * .1, 'rgba(180,170,120,.45)'); }
        g.translate(0, s * .2 - hover);
        break;
      }
      case 'bug': {
        extras(g, back, s, P, t, head);
        ell(g, 0, 0, s * .2, s * .38, P.c1);
        head = { x: s * .1, y: -s * .4 };
        ell(g, head.x, head.y, s * .2, s * .18, P.c1);
        ell(g, head.x + s * .1, head.y, s * .1, s * .12, '#e63946');
        break;
      }
    }
    extras(g, front, s, P, t, head);
  }

  T.Art = {
    // Draw creature `c` centred at screen (x, y).
    draw(g, c, x, y, time) {
      const sp = T.SPECIES[c.species];
      const s = c.size * 1.55;
      g.save();
      g.translate(x, y);
      // Shadow
      if (!(sp.art.body === 'orb' || sp.art.body === 'ghost')) ell(g, 0, s * .58, s * .55, s * .14, 'rgba(0,0,0,.28)');
      else ell(g, 0, s * .75, s * .4, s * .1, 'rgba(0,0,0,.2)');
      if (c.facing < 0) g.scale(-1, 1);
      if (c.flash > 0) g.globalAlpha = .5 + .5 * Math.sin(time * 60);
      if (c.alpha !== undefined) g.globalAlpha *= c.alpha;
      const img = T.Sprites.get(c.species);
      if (img) {
        const h = s * 1.7, w = h * img.width / img.height;
        const bob = c.moving ? Math.abs(Math.sin(time * 14)) * s * .06 : 0;
        if (c.shiny) g.filter = 'hue-rotate(140deg)';
        g.drawImage(img, -w / 2, s * .6 - h - bob, w, h);
        g.filter = 'none';
      } else {
        const P = palette(sp, c.shiny);
        drawBody(g, sp, s, time + (c.animSeed || 0), c.moving, P, c.aggro);
      }
      g.restore();
    },
    // Portrait for menus: draw into a small canvas.
    portrait(speciesId, size, shiny, silhouette) {
      const cv = document.createElement('canvas'); cv.width = cv.height = size;
      const g = cv.getContext('2d');
      const sp = T.SPECIES[speciesId];
      const c = { species: speciesId, size: Math.min(size * .32, sp.size * 1.6 > size * .32 ? size * .32 : size * .28), facing: 1, shiny, moving: false };
      c.size = size * .3;
      T.Art.draw(g, c, size / 2, size * .55, 0.3);
      if (silhouette) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = '#15171d'; g.fillRect(0, 0, size, size); }
      return cv;
    }
  };
})(window.TJP);
