// In-game HUD drawn on the canvas.
window.TJP = window.TJP || {};
(function (T) {
  const U = T.U;
  const FONT = 'system-ui, -apple-system, Segoe UI, sans-serif';

  function panel(g, x, y, w, h, a) {
    g.fillStyle = `rgba(12,14,20,${a || .72})`;
    g.beginPath(); g.roundRect(x, y, w, h, 8); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 1; g.stroke();
  }
  function bar(g, x, y, w, h, f, col, label, back) {
    g.fillStyle = back || 'rgba(255,255,255,.1)'; g.fillRect(x, y, w, h);
    g.fillStyle = col; g.fillRect(x, y, w * U.clamp(f, 0, 1), h);
    if (label) { g.font = `bold 10px ${FONT}`; g.fillStyle = '#fff'; g.textAlign = 'left'; g.fillText(label, x + 4, y + h - 2); }
  }
  function typeBadge(g, x, y, type) {
    const w = 52;
    g.fillStyle = T.TYPE_COLORS[type]; g.beginPath(); g.roundRect(x, y, w, 14, 4); g.fill();
    g.fillStyle = '#fff'; g.font = `bold 9px ${FONT}`; g.textAlign = 'center'; g.fillText(type.toUpperCase(), x + w / 2, y + 10.5);
    return w + 4;
  }

  T.HUD = {
    draw(G, g, vw, vh) {
      const p = G.player;
      g.textBaseline = 'alphabetic';
      // ---------- Player panel ----------
      panel(g, 12, 12, 300, 128);
      g.textAlign = 'left'; g.font = `bold 16px ${FONT}`; g.fillStyle = '#fff';
      g.fillText(`${p.name}${p.shiny ? ' ✦' : ''} ${p.gender === 'f' ? '♀' : '♂'}`, 24, 34);
      g.font = `bold 13px ${FONT}`; g.fillStyle = '#ffd166'; g.textAlign = 'right'; g.fillText(`Lv ${p.level}`, 300, 34);
      let bx = 24; for (const t of p.types) bx += typeBadge(g, bx, 40, t);
      if (p.status) { g.fillStyle = T.statusColor(p.status); g.beginPath(); g.roundRect(bx, 40, 34, 14, 4); g.fill(); g.fillStyle = '#111'; g.font = `bold 9px ${FONT}`; g.textAlign = 'center'; g.fillText(p.status.toUpperCase(), bx + 17, 50.5); }
      const hpf = p.hp / p.maxHp, cap = p.hpCap === undefined ? 1 : p.hpCap;
      bar(g, 24, 60, 276, 14, hpf, hpf > .5 ? '#5bd36a' : hpf > .2 ? '#f7c948' : '#f25f5c', `HP ${Math.ceil(Math.max(0, p.hp))}/${p.maxHp}`);
      if (cap < 1) { g.fillStyle = 'rgba(80,0,0,.7)'; g.fillRect(24 + 276 * cap, 60, 276 * (1 - cap), 14); }
      const prev = Math.pow(p.level, 3), next = p.expToNext();
      bar(g, 24, 76, 276, 4, (p.exp - prev) / (next - prev), '#5ab0ff');
      bar(g, 24, 84, 276, 12, G.hunger / 100, G.hunger < 25 ? '#f25f5c' : '#f39c4a', `Hunger ${Math.ceil(G.hunger)}%`);
      bar(g, 24, 98, 276, 8, G.stamina / 100, p.exhausted ? '#7a5a5a' : '#b4e05a');
      g.font = `11px ${FONT}`; g.fillStyle = '#cbd2dc'; g.textAlign = 'left';
      const ab = T.ABILITIES[p.ability], it = T.HELD_ITEMS[p.heldItem];
      g.fillText(`${ab ? ab.name : p.ability} · ${p.nature} · ${it.name}`, 24, 122);
      const r = G.rank();
      g.fillStyle = ['#a0a0a0', '#7ec8e3', '#f7d02c'][r]; g.font = `bold 11px ${FONT}`;
      g.fillText(`${T.RANKS[r].name}  ${G.kcalGen} kcal`, 24, 135);
      if (p.crouching) { g.fillStyle = '#9be564'; g.textAlign = 'right'; g.fillText('STEALTH', 300, 135); }
      const stg = Object.entries(p.stages).filter(([k, v]) => v && k !== 'crit');
      if (stg.length) { g.textAlign = 'right'; g.fillStyle = '#9be564'; g.fillText(stg.map(([k, v]) => `${T.STAT_LABEL[k].replace('Sp. ', 'S')}${v > 0 ? '+' : ''}${v}`).join(' '), 300, 122); }

      // Pack
      const allies = G.allies();
      allies.forEach((a, i) => {
        const y = 150 + i * 24;
        panel(g, 12, y, 180, 20, .6);
        g.font = `bold 11px ${FONT}`; g.fillStyle = '#5ab0ff'; g.textAlign = 'left'; g.fillText(`${a.name} Lv${a.level}`, 20, y + 14);
        bar(g, 110, y + 7, 74, 6, a.hp / a.maxHp, '#5ab0ff');
      });

      // ---------- Time panel ----------
      const cw = 340, cx = vw / 2 - cw / 2;
      panel(g, cx, 12, cw, 52);
      const wx = T.WEATHER[G.weather];
      g.textAlign = 'center'; g.font = `bold 16px ${FONT}`; g.fillStyle = '#fff';
      const month = Math.floor(G.yearT / G.yearLen * 12) + 1;
      g.fillText(`Year ${G.year} · Month ${month}   ${wx.icon} ${wx.name}`, vw / 2, 34);
      g.font = `11px ${FONT}`; g.fillStyle = G.age > G.mods.lifespan - 2 ? '#ff9b6a' : '#cbd2dc';
      g.fillText(`Gen ${G.generation} · Age ${Math.floor(G.age)}/${G.mods.lifespan} yrs · Score ${Math.round(G.score)}`, vw / 2, 52);
      bar(g, cx + 10, 58, cw - 20, 3, G.yearT / G.yearLen, '#ffd166');

      // ---------- Minimap ----------
      const mm = 2, mw = G.map.w * mm * .6, mh = G.map.h * mm * .6;
      const mx = vw - mw - 14, my = 12;
      panel(g, mx - 6, my - 2, mw + 12, mh + 26);
      g.drawImage(G.overview, mx, my + 4, mw, mh);
      const n = T.DISTRICT_TILES * mm * .6;
      for (const d of T.DISTRICTS) {
        const st = G.districtState[d.id];
        g.strokeStyle = st.claimed ? '#5ab0ff' : 'rgba(255,255,255,.25)'; g.lineWidth = st.claimed ? 2 : 1;
        g.strokeRect(mx + d.gx * n, my + 4 + d.gy * n, n, n);
        if (st.claimed) { g.fillStyle = 'rgba(90,176,255,.18)'; g.fillRect(mx + d.gx * n, my + 4 + d.gy * n, n, n); }
        if (!st.alphaDefeated) { g.fillStyle = '#ff6b6b'; g.font = `10px ${FONT}`; g.textAlign = 'left'; g.fillText('♛', mx + d.gx * n + 3, my + 4 + d.gy * n + 11); }
      }
      const k = mm * .6 / T.TILE;
      for (const m of G.map.markers) { g.fillStyle = m.owner === 'player' ? '#5ab0ff' : '#e05555'; g.fillRect(mx + m.x * k - 1.5, my + 4 + m.y * k - 1.5, 3, 3); }
      for (const m of G.mates) { g.fillStyle = '#f6b6c8'; g.fillRect(mx + m.x * k - 1.5, my + 4 + m.y * k - 1.5, 3, 3); }
      g.fillStyle = '#fff'; g.beginPath(); g.arc(mx + p.x * k, my + 4 + p.y * k, 3, 0, 7); g.fill();
      const d = G.district();
      g.font = `bold 11px ${FONT}`; g.textAlign = 'center'; g.fillStyle = '#ffd166';
      g.fillText(d ? d.name : '', mx + mw / 2, my + mh + 18);

      // ---------- Challenges ----------
      const chY = my + mh + 34;
      panel(g, vw - 274, chY, 262, 22 + G.challenges.length * 34);
      g.textAlign = 'left'; g.font = `bold 12px ${FONT}`; g.fillStyle = '#ffd166'; g.fillText(`Year ${G.year} Challenges`, vw - 262, chY + 16);
      G.challenges.forEach((c, i) => {
        const y = chY + 24 + i * 34;
        g.font = `12px ${FONT}`; g.fillStyle = c.done ? '#9be564' : '#e8ecf2';
        g.fillText((c.done ? '✔ ' : '• ') + c.text, vw - 262, y + 12);
        bar(g, vw - 262, y + 18, 236, 4, c.progress / c.target, c.done ? '#9be564' : '#ffd166');
        g.font = `10px ${FONT}`; g.fillStyle = '#9aa'; g.textAlign = 'right'; g.fillText(`${Math.min(c.progress, c.target)}/${c.target}`, vw - 22, y + 12); g.textAlign = 'left';
      });

      // ---------- Moves ----------
      const keys = ['J/1', 'K/2', 'L/3', ';/4'];
      const sw = 150, gap = 8, tot = sw * 4 + gap * 3, sx = vw / 2 - tot / 2, sy = vh - 66;
      for (let i = 0; i < 4; i++) {
        const id = p.moves[i], x = sx + i * (sw + gap);
        panel(g, x, sy, sw, 54, .8);
        if (!id) { g.fillStyle = '#556'; g.font = `12px ${FONT}`; g.textAlign = 'center'; g.fillText('—', x + sw / 2, sy + 32); continue; }
        const mv = T.MOVES[id];
        g.fillStyle = T.TYPE_COLORS[mv.type]; g.fillRect(x, sy, 5, 54);
        g.textAlign = 'left'; g.font = `bold 13px ${FONT}`; g.fillStyle = '#fff'; g.fillText(mv.name, x + 12, sy + 20);
        g.font = `10px ${FONT}`; g.fillStyle = '#aab';
        g.fillText(`${mv.type.toUpperCase()} · ${mv.cat === 'status' ? 'STATUS' : mv.power + ' ' + (mv.cat === 'physical' ? 'PHYS' : 'SPEC')}`, x + 12, sy + 35);
        g.fillStyle = '#ffd166'; g.font = `bold 10px ${FONT}`; g.fillText(keys[i], x + 12, sy + 48);
        g.fillStyle = '#778'; g.textAlign = 'right'; g.fillText(mv.shape.toUpperCase(), x + sw - 8, sy + 48);
        const cd = p.cooldowns[i];
        if (cd > 0) {
          const full = mv.cd * T.Combat.cooldownMult(p);
          g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(x, sy, sw * U.clamp(cd / full, 0, 1), 54);
          g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = `bold 14px ${FONT}`; g.fillText(cd.toFixed(1), x + sw / 2, sy + 32);
        }
      }
      // Effectiveness hint vs current soft target.
      const tgt = G.autoTarget(p, 1.1, 460);
      if (tgt) {
        for (let i = 0; i < p.moves.length; i++) {
          const mv = T.MOVES[p.moves[i]]; if (mv.power <= 0) continue;
          const e = T.typeEffect(mv.type, tgt.types, G.mods.inverse);
          if (e === 1) continue;
          const x = sx + i * (sw + gap);
          g.font = `bold 10px ${FONT}`; g.textAlign = 'right';
          g.fillStyle = e > 1 ? '#ffcf3a' : e === 0 ? '#888' : '#9aa';
          g.fillText(e === 0 ? 'NO EFFECT' : `×${e}`, x + sw - 8, sy + 20);
        }
      }

      // ---------- Toasts & log ----------
      G.toasts.forEach((t, i) => {
        const a = Math.min(1, t.t * 2, (t.max - t.t) * 6 + .2);
        g.globalAlpha = a; g.font = `bold 18px ${FONT}`; g.textAlign = 'center';
        const y = 104 + i * 30, w = g.measureText(t.text).width + 30;
        panel(g, vw / 2 - w / 2, y - 21, w, 28, .7);
        g.fillStyle = t.color; g.fillText(t.text, vw / 2, y);
      });
      g.globalAlpha = 1;
      G.log.forEach((l, i) => {
        g.globalAlpha = Math.min(1, l.t); g.font = `12px ${FONT}`; g.textAlign = 'left';
        const y = vh - 90 - (G.log.length - 1 - i) * 18;
        g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(12, y - 13, g.measureText(l.text).width + 12, 17);
        g.fillStyle = '#e8ecf2'; g.fillText(l.text, 18, y);
      });
      g.globalAlpha = 1;
      g.font = `10px ${FONT}`; g.fillStyle = 'rgba(255,255,255,.45)'; g.textAlign = 'left';
      g.fillText('WASD move · Shift sprint · C stealth · Space dodge · J K L ; moves · E interact · Q call pack · M map · Esc pause', 12, vh - 8);

      if (G.showMap) this.bigMap(G, g, vw, vh);
    },

    bigMap(G, g, vw, vh) {
      g.fillStyle = 'rgba(5,6,10,.85)'; g.fillRect(0, 0, vw, vh);
      const scale = Math.min((vw - 80) / (G.map.w * T.TILE), (vh - 120) / (G.map.h * T.TILE));
      const w = G.map.w * T.TILE * scale, h = G.map.h * T.TILE * scale, ox = (vw - w) / 2, oy = (vh - h) / 2 + 10;
      g.imageSmoothingEnabled = false; g.drawImage(G.overview, ox, oy, w, h); g.imageSmoothingEnabled = true;
      const n = T.DISTRICT_TILES * T.TILE * scale;
      for (const d of T.DISTRICTS) {
        const st = G.districtState[d.id];
        g.strokeStyle = st.claimed ? '#5ab0ff' : 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.strokeRect(ox + d.gx * n, oy + d.gy * n, n, n);
        g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(ox + d.gx * n + 6, oy + d.gy * n + 6, 190, 40);
        g.font = `bold 14px ${FONT}`; g.textAlign = 'left'; g.fillStyle = st.claimed ? '#5ab0ff' : '#fff';
        g.fillText(d.name, ox + d.gx * n + 12, oy + d.gy * n + 24);
        g.font = `11px ${FONT}`; g.fillStyle = st.alphaDefeated ? '#9be564' : '#ff8a8a';
        g.fillText(st.alphaDefeated ? 'Alpha defeated' : `Alpha: ${T.SPECIES[d.alpha.species].name}`, ox + d.gx * n + 12, oy + d.gy * n + 40);
      }
      for (const m of G.map.markers) { g.fillStyle = m.owner === 'player' ? '#5ab0ff' : '#e05555'; g.beginPath(); g.arc(ox + m.x * scale, oy + m.y * scale, 5, 0, 7); g.fill(); }
      for (const ne of G.map.nests) if (ne.active) { g.fillStyle = '#c8a060'; g.beginPath(); g.arc(ox + ne.x * scale, oy + ne.y * scale, 6, 0, 7); g.fill(); }
      for (const m of G.mates) { g.fillStyle = '#f6b6c8'; g.font = `bold 13px ${FONT}`; g.fillText('♥', ox + m.x * scale - 4, oy + m.y * scale + 4); }
      const p = G.player;
      g.fillStyle = '#fff'; g.beginPath(); g.arc(ox + p.x * scale, oy + p.y * scale, 6, 0, 7); g.fill();
      g.font = `bold 18px ${FONT}`; g.textAlign = 'center'; g.fillStyle = '#ffd166'; g.fillText('Tokyo — press M to close', vw / 2, 36);
      g.font = `12px ${FONT}`; g.fillStyle = '#ccc'; g.fillText('Red flags: rival markers · Blue: yours · Brown: nests · ♥: mates', vw / 2, vh - 20);
    }
  };
})(window.TJP);
