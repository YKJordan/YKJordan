// DOM menus: title, run setup (Pokémon → Nature → Held item → Modifiers), pause, Pokédex, modals, game over.
window.TJP = window.TJP || {};
(function (T) {
  const $ = s => document.querySelector(s);
  const U = T.U;
  const MODIFIERS = [
    { id: 'inverse',   name: 'Inverse Battle',   desc: 'The type chart is flipped: weaknesses become resistances and immunities become weaknesses.', score: '+25%' },
    { id: 'hunger',    name: 'Hunger Games',     desc: 'Hunger drains twice as fast.', score: '+50%' },
    { id: 'shortLife', name: 'Fleeting Life',    desc: 'Lifespan is 8 years instead of 12. Breed fast.', score: '+25%' },
    { id: 'frenzy',    name: 'Wild Frenzy',      desc: 'Wild Pokémon are 5 levels higher, more numerous and more aggressive.', score: '+50%' },
    { id: 'legendRush',name: 'Legendary Rush',   desc: 'The legendary appears in Year 3 instead of Year 10.', score: '±0' },
    { id: 'shinyCharm',name: 'Shiny Charm',      desc: 'Shiny Pokémon are 8x more common (shinies are recoloured; your own shiny chance rises too).', score: '±0' },
    { id: 'packStart', name: 'Littermates',      desc: 'Start with two siblings in your pack.', score: '-20%' }
  ];
  const ETERNAL = ['', 'sun', 'rain', 'sand', 'snow', 'smog'];
  let cfg = null, step = 0, lastCfg = null;

  function show(id) {
    for (const el of document.querySelectorAll('.screen')) el.classList.add('hidden');
    if (id) $(id).classList.remove('hidden');
  }
  function statBars(sp) {
    return Object.entries(sp.base).map(([k, v]) =>
      `<div class="stat"><span>${T.STAT_LABEL[k]}</span><div class="sbar"><i style="width:${Math.min(100, v / 1.6)}%;background:${v >= 100 ? '#5bd36a' : v >= 70 ? '#f7c948' : '#f39c4a'}"></i></div><b>${v}</b></div>`).join('')
      + `<div class="stat"><span>Total</span><div></div><b>${sp.bst}</b></div>`;
  }
  function typeTags(types) { return types.map(t => `<span class="type" style="background:${T.TYPE_COLORS[t]}">${t}</span>`).join(' '); }
  function lineOf(id) {
    const out = [];
    const label = s => { const sp = T.SPECIES[s];
      if (sp.evo) return ` (Lv ${sp.evo.level})`;
      if (sp.evoWeather) return ` (Lv ${sp.evoWeather.level}, by weather)`;
      return ''; };
    let s = id;
    while (s) {
      const sp = T.SPECIES[s];
      out.push(sp.name + label(s));
      if (sp.evoWeather) {
        const w = sp.evoWeather;
        out.push(`${T.SPECIES[w.rain].name} (rain) / ${T.SPECIES[w.sun].name} (sun) / ${T.SPECIES[w.clear].name} (clear) / ${T.SPECIES[w.snow].name} (snow) / ${T.SPECIES[w.sand].name} (sand, smog)`);
        break;
      }
      s = sp.evo ? sp.evo.to : null;
    }
    return out;
  }
  const DIET = { grazer: 'Grazer: eats berries, hides in tall grass, fast', predator: 'Predator: hunts and eats what it knocks out', omnivore: 'Omnivore: eats both at 75% value' };

  const Menus = {
    MODIFIERS,
    title() {
      show('#title');
      const s = T.Save.data;
      $('#title-stats').textContent = `${s.unlocked.length}/${T.PLAYABLE.length} Pokémon unlocked · ${s.seen.length} seen · ${s.runs} runs`;
    },
    startSetup() {
      cfg = { species: T.Save.data.unlocked[0], nature: 'random', item: 'none', mods: { eternal: '' } };
      if (lastCfg) cfg = JSON.parse(JSON.stringify(lastCfg));
      if (!T.Save.isUnlocked(cfg.species)) cfg.species = T.Save.data.unlocked[0];
      step = 0; show('#setup'); this.renderStep();
    },
    renderStep() {
      const body = $('#setup-body');
      const steps = ['Choose your Pokémon', 'Choose a Nature', 'Choose a held item', 'Run modifiers'];
      $('#setup-title').textContent = `${step + 1}/4 · ${steps[step]}`;
      $('#setup-back').textContent = step === 0 ? 'Title' : 'Back';
      $('#setup-next').textContent = step === 3 ? 'Begin survival ▶' : 'Next ▶';
      body.innerHTML = '';
      if (step === 0) this.stepSpecies(body);
      if (step === 1) this.stepNature(body);
      if (step === 2) this.stepItem(body);
      if (step === 3) this.stepMods(body);
    },
    stepSpecies(body) {
      const grid = document.createElement('div'); grid.className = 'grid';
      const detail = document.createElement('div'); detail.className = 'detail';
      const order = T.PLAYABLE.slice().sort((a, b) => (T.Save.isUnlocked(b) - T.Save.isUnlocked(a)) || T.SPECIES[a].bst - T.SPECIES[b].bst);
      for (const id of order) {
        const sp = T.SPECIES[id], un = T.Save.isUnlocked(id);
        const card = document.createElement('button'); card.className = 'card' + (cfg.species === id ? ' sel' : '') + (un ? '' : ' locked');
        card.appendChild(T.Art.portrait(id, 84, false, !un));
        const lbl = document.createElement('div'); lbl.textContent = un ? sp.name : '???'; card.appendChild(lbl);
        card.onclick = () => { if (!un) { this.speciesDetail(detail, id); return; } cfg.species = id; this.renderStep(); };
        grid.appendChild(card);
      }
      body.append(grid, detail);
      this.speciesDetail(detail, cfg.species);
    },
    speciesDetail(el, id) {
      const sp = T.SPECIES[id], un = T.Save.isUnlocked(id);
      if (!un) {
        const kos = T.Save.data.kos[id] || 0;
        el.innerHTML = `<h2>???</h2><p class="muted">Locked. ${T.UNLOCK_RULE}</p><p>Knocked out: <b>${kos}/3</b> of this line.</p>`;
        return;
      }
      const best = T.Save.data.best[id];
      const line = lineOf(id).join(' → ');
      const p = T.Art.portrait(id, 130);
      el.innerHTML = `<h2>${sp.name}</h2><div>${typeTags(sp.types)}</div>
        <p class="muted">${DIET[sp.diet]}</p>
        <div class="stats">${statBars(sp)}</div>
        <p><b>Abilities:</b> ${[...new Set(sp.abilities)].map(a => `<span title="${T.ABILITIES[a].desc}">${T.ABILITIES[a].name}</span>`).join(' / ')}</p>
        <p class="muted small">${[...new Set(sp.abilities)].map(a => T.ABILITIES[a].name + ': ' + T.ABILITIES[a].desc).join('<br>')}</p>
        <p><b>Evolution:</b> ${line}</p>
        <p><b>Starting moves:</b> ${T.learnsetUpTo(id, 5).slice(-4).map(m => T.MOVES[m].name).join(', ')}</p>
        ${sp.flies ? '<p class="muted">Flies over buildings and water.</p>' : ''}${sp.swims ? '<p class="muted">Swims fast through water.</p>' : ''}
        <p>${best ? `Best: <b>${best.years} years</b> · ${best.score} pts` : 'No runs yet.'}</p>`;
      el.prepend(p);
    },
    stepNature(body) {
      const wrap = document.createElement('div'); wrap.className = 'natures';
      const mk = (name, html) => { const b = document.createElement('button'); b.className = 'nat' + (cfg.nature === name ? ' sel' : ''); b.innerHTML = html;
        b.onclick = () => { cfg.nature = name; this.renderStep(); }; wrap.appendChild(b); };
      mk('random', '<b>Random</b><small>Leave it to fate (+5% score)</small>');
      for (const n of T.NATURE_NAMES) {
        const nt = T.NATURES[n];
        mk(n, `<b>${n}</b><small>${nt.up ? `<span class="up">+${T.STAT_LABEL[nt.up]}</span> <span class="down">−${T.STAT_LABEL[nt.down]}</span>` : 'Neutral'}</small>`);
      }
      body.appendChild(wrap);
    },
    stepItem(body) {
      const wrap = document.createElement('div'); wrap.className = 'items';
      for (const id of Object.keys(T.HELD_ITEMS)) {
        const it = T.HELD_ITEMS[id], un = T.Save.data.items.includes(id);
        const b = document.createElement('button'); b.className = 'item' + (cfg.item === id ? ' sel' : '') + (un ? '' : ' locked');
        b.innerHTML = `<b>${un ? it.name : '???'}</b><small>${un ? it.desc : 'Find it in supply crates, alpha drops or challenge rewards.'}</small>`;
        if (un) b.onclick = () => { cfg.item = id; this.renderStep(); };
        wrap.appendChild(b);
      }
      body.appendChild(wrap);
    },
    stepMods(body) {
      const wrap = document.createElement('div'); wrap.className = 'mods';
      for (const m of MODIFIERS) {
        const b = document.createElement('label'); b.className = 'mod' + (cfg.mods[m.id] ? ' sel' : '');
        b.innerHTML = `<input type="checkbox" ${cfg.mods[m.id] ? 'checked' : ''}> <b>${m.name}</b> <em>${m.score}</em><small>${m.desc}</small>`;
        b.querySelector('input').onchange = e => { cfg.mods[m.id] = e.target.checked; this.renderStep(); };
        wrap.appendChild(b);
      }
      const ew = document.createElement('div'); ew.className = 'mod';
      ew.innerHTML = `<b>Eternal Weather</b><small>Lock the weather for the whole run.</small>
        <select>${ETERNAL.map(w => `<option value="${w}" ${cfg.mods.eternal === w ? 'selected' : ''}>${w ? T.WEATHER[w].icon + ' ' + T.WEATHER[w].name : 'Off: changes every year'}</option>`).join('')}</select>`;
      ew.querySelector('select').onchange = e => { cfg.mods.eternal = e.target.value; };
      wrap.appendChild(ew);
      const sp = T.SPECIES[cfg.species];
      const summary = document.createElement('div'); summary.className = 'summary';
      summary.innerHTML = `<b>${sp.name}</b> · ${cfg.nature === 'random' ? 'Random nature' : cfg.nature} · ${T.HELD_ITEMS[cfg.item].name}`;
      body.append(wrap, summary);
    },
    next() {
      if (step < 3) { step++; this.renderStep(); return; }
      lastCfg = JSON.parse(JSON.stringify(cfg));
      T.startRun(cfg);
    },
    back() { if (step === 0) this.title(); else { step--; this.renderStep(); } },
    retry() { if (lastCfg) T.startRun(JSON.parse(JSON.stringify(lastCfg))); },

    moveCard(id) {
      const m = T.MOVES[id];
      return `<div class="movecard"><span class="type" style="background:${T.TYPE_COLORS[m.type]}">${m.type}</span>
        <b>${m.name}</b> · ${m.cat === 'status' ? 'Status' : `${m.power} power, ${m.cat}`} · ${m.shape} · ${m.cd}s cooldown
        ${m.status ? `<br><small>${Math.round(m.chance * 100)}% chance to ${{ brn: 'burn', psn: 'poison', par: 'paralyze', slp: 'put to sleep', frz: 'freeze' }[m.status]}</small>` : ''}
        ${m.drain ? '<br><small>Heals half the damage dealt</small>' : ''}${m.recoil ? '<br><small>Recoil damage</small>' : ''}</div>`;
    },
    showModal(m) {
      const el = $('#modal');
      el.querySelector('h2').textContent = m.title;
      el.querySelector('.body').innerHTML = m.html || '';
      for (const cv of el.querySelectorAll('canvas[data-portrait]')) cv.replaceWith(T.Art.portrait(cv.dataset.portrait, 120));
      const opts = el.querySelector('.opts'); opts.innerHTML = '';
      m.options.forEach(o => {
        const b = document.createElement('button');
        b.innerHTML = `<kbd>${o.key}</kbd> ${o.label}`;
        b.onclick = () => Menus.chooseModal(o);
        opts.appendChild(b);
      });
      el.classList.remove('hidden');
    },
    chooseModal(o) {
      $('#modal').classList.add('hidden');
      T.Input.endFrame();
      T.G.closeModal(o);
    },
    modalKey(code) {
      const m = T.G && T.G.modal; if (!m) return false;
      const key = code.replace('Key', '').replace('Digit', '');
      const map = { Escape: 'X', Backspace: 'X', Enter: 'E', Space: 'E' };
      const k = map[code] || key;
      const o = m.options.find(x => x.key === k);
      if (o) { this.chooseModal(o); return true; }
      return false;
    },
    pause(on) {
      const G = T.G; if (!G || G.over) return;
      G.paused = on;
      $('#pause').classList.toggle('hidden', !on);
      if (on) this.pauseTab('status');
    },
    pauseTab(tab) {
      const G = T.G, p = G.player, el = $('#pause-body');
      for (const b of document.querySelectorAll('#pause .tabs button')) b.classList.toggle('sel', b.dataset.tab === tab);
      if (tab === 'status') {
        const rows = T.STAT_KEYS.map(k => {
          const n = k === 'hp' ? '' : T.natureMult(p.nature, k) > 1 ? ' class="up"' : T.natureMult(p.nature, k) < 1 ? ' class="down"' : '';
          return `<tr><td${n}>${T.STAT_LABEL[k]}</td><td>${k === 'hp' ? p.maxHp : p.stats[k]}</td><td>${p.sp.base[k]}</td><td>${p.ivs[k]}</td><td>${p.evs[k]}</td></tr>`;
        }).join('');
        el.innerHTML = `<div class="detail-row"><div id="pp"></div><div>
          <h2>${p.name} ${p.shiny ? '✦' : ''} <small>Lv ${p.level}</small></h2>${typeTags(p.types)}
          <p><b>${T.ABILITIES[p.ability].name}</b>: ${T.ABILITIES[p.ability].desc}</p>
          <p><b>${T.HELD_ITEMS[p.heldItem].name}</b>: ${T.HELD_ITEMS[p.heldItem].desc}</p>
          <p><b>${p.nature}</b> nature · ${DIET[p.sp.diet]}</p></div></div>
          <table class="tbl"><tr><th>Stat</th><th>Value</th><th>Base</th><th>IV</th><th>EV</th></tr>${rows}</table>
          <h3>Moves</h3>${p.moves.map(m => Menus.moveCard(m)).join('')}
          <h3>Run</h3><p>Year ${G.year} · Generation ${G.generation} · ${G.kos} knockouts · ${G.kcalTotal} kcal eaten · Score ${Math.round(G.score)} × ${G.scoreMult.toFixed(2)}</p>`;
        $('#pp').appendChild(T.Art.portrait(p.species, 140, p.shiny));
      } else if (tab === 'dex') this.dex(el);
      else if (tab === 'help') el.innerHTML = $('#help-template').innerHTML;
      else if (tab === 'types') this.typeChart(el);
    },
    dex(el) {
      const s = T.Save.data;
      el.innerHTML = `<p class="muted">${s.seen.length}/${Object.keys(T.SPECIES).length} seen. Knock out 3 of a line to unlock it; alphas unlock theirs at once.</p><div class="dex"></div>`;
      const d = el.querySelector('.dex');
      for (const id of Object.keys(T.SPECIES)) {
        const seen = s.seen.includes(id), sp = T.SPECIES[id];
        const c = document.createElement('div'); c.className = 'dexcard' + (seen ? '' : ' locked');
        c.appendChild(T.Art.portrait(id, 64, false, !seen));
        c.insertAdjacentHTML('beforeend', `<div>${seen ? sp.name : '???'}</div>${seen ? `<div>${typeTags(sp.types)}</div>` : ''}`);
        d.appendChild(c);
      }
    },
    typeChart(el) {
      const ty = T.TYPES, inv = T.G && T.G.mods.inverse;
      let h = `<p class="muted">Attacking type (rows) vs defending type (columns)${inv ? ' · INVERSE BATTLE active' : ''}.</p><table class="chart"><tr><th></th>${ty.map(t => `<th style="background:${T.TYPE_COLORS[t]}">${t.slice(0, 3)}</th>`).join('')}</tr>`;
      for (const a of ty) {
        h += `<tr><th style="background:${T.TYPE_COLORS[a]}">${a.slice(0, 3)}</th>`;
        for (const d of ty) { const e = T.typeEffect(a, [d], inv); h += `<td class="e${String(e).replace('.', '')}">${e === 1 ? '' : e === .5 ? '½' : e}</td>`; }
        h += '</tr>';
      }
      el.innerHTML = h + '</table>';
    },
    gameOver(s) {
      show('#gameover');
      const sp = T.SPECIES[s.species];
      $('#go-body').innerHTML = `<h1>Survived ${s.years} year${s.years === 1 ? '' : 's'}</h1>
        <p>${sp.name} (Lv ${s.level}) ${s.cause}.</p>
        <table class="tbl"><tr><td>Generations</td><td>${s.generations}</td></tr><tr><td>Knockouts</td><td>${s.kos}</td></tr>
        <tr><td>Calories eaten</td><td>${s.kcal}</td></tr><tr><td>Score</td><td><b>${s.score}</b></td></tr></table>
        <p class="muted">Unlocked: ${T.Save.data.unlocked.map(id => T.SPECIES[id].name).join(', ')}</p>`;
    }
  };
  T.Menus = Menus;
})(window.TJP);
