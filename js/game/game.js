// The run: Tokyo Jungle's survival loop with Pokémon underneath.
// Years pass, hunger drains, you age. Eat, claim territory, find a mate, and pass your bloodline on.
window.TJP = window.TJP || {};
(function (T) {
  const U = T.U, I = T.Input;

  const RANKS = [
    { id: 'rookie', name: 'Rookie', kcal: 0 },
    { id: 'average', name: 'Average', kcal: 1200 },
    { id: 'prime', name: 'Prime', kcal: 3000 }
  ];
  const MATE_QUALITY = {
    desperate: { name: 'Desperate', rank: 0, litter: 1, ivs: [0, 15], levelFrac: .45, color: '#a0a0a0' },
    average:   { name: 'Average',   rank: 1, litter: 2, ivs: [10, 25], levelFrac: .55, color: '#7ec8e3' },
    prime:     { name: 'Prime',     rank: 2, litter: 3, ivs: [20, 31], levelFrac: .65, color: '#f7d02c' }
  };
  T.RANKS = RANKS; T.MATE_QUALITY = MATE_QUALITY;

  const WEATHER_WEIGHTS = { clear: 30, sun: 15, rain: 18, sand: 10, snow: 10, smog: 12 };

  class Game {
    constructor(cfg) {
      T.G = this;
      this.cfg = cfg;
      const m = cfg.mods || {};
      this.mods = {
        inverse: !!m.inverse,
        eternal: m.eternal || null,
        hungerMult: m.hunger ? 2 : 1,
        lifespan: m.shortLife ? 8 : 12,
        shinyRate: m.shinyCharm ? 1 / 32 : 1 / 256,
        legendYear: m.legendRush ? 3 : 10,
        frenzy: !!m.frenzy,
        packStart: !!m.packStart,
        wildDamage: .65,
        levelBonus: m.frenzy ? 5 : 0
      };
      this.scoreMult = 1 + (m.inverse ? .25 : 0) + (m.hunger ? .5 : 0) + (m.shortLife ? .25 : 0) + (m.frenzy ? .5 : 0)
        + (cfg.nature === 'random' ? .05 : 0) - (m.packStart ? .2 : 0) - (m.shinyCharm ? 0 : 0);
      this.yearLen = cfg.yearLen || 75;
      this.map = new T.TileMap(cfg.seed || Math.floor(Math.random() * 1e9));
      this.creatures = []; this.projectiles = []; this.particles = []; this.texts = []; this.carcasses = []; this.fxList = [];
      this.time = 0; this.year = 1; this.yearT = 0; this.age = 1; this.generation = 1;
      this.weather = this.mods.eternal || 'clear';
      this.kcalGen = 0; this.kcalTotal = 0; this.kos = 0; this.score = 0;
      this.hunger = 100; this.stamina = 100; this.staminaDelay = 0;
      this.challenges = []; this.toasts = []; this.log = [];
      this.pending = []; this.modal = null; this.paused = false; this.showMap = false;
      this.districtState = {};
      for (const d of T.DISTRICTS) this.districtState[d.id] = { claimed: false, alphaDefeated: false, alphaAlive: null, mateYear: 0 };
      this.mates = [];
      this.camera = { x: 0, y: 0, shake: 0 };
      this.lastDistrict = null;
      this.legendSpawned = false;
      this.listeners = {};
      this.spawnT = 0; this.capsuleT = 10; this.restCd = 0;
      this.over = false;
      this.fx = makeFx(this);
      this.overview = this.map.overview(2);

      // The player's Pokémon.
      const start = this.map.findOpenNear(20, T.DISTRICT_TILES + 30, 15);
      const nature = cfg.nature && cfg.nature !== 'random' ? cfg.nature : U.pick(T.NATURE_NAMES);
      this.player = new T.Creature(cfg.species, cfg.startLevel || 5, {
        faction: 'player', nature, heldItem: cfg.item || 'none',
        shiny: Math.random() < this.mods.shinyRate * 4,
        x: (start.tx + .5) * T.TILE, y: (start.ty + .5) * T.TILE
      });
      this.player.ai.state = 'player';
      this.creatures.push(this.player);
      if (this.mods.packStart) for (let i = 0; i < 2; i++) this.addAlly(new T.Creature(cfg.species, 4, { faction: 'player', nature: U.pick(T.NATURE_NAMES) }));
      T.Save.see(cfg.species);
      this.dealChallenges();
      this.toast(`Year 1 · ${T.WEATHER[this.weather].name}`, 4);
      this.toast(`${this.player.name} wakes up in the ruins of Shibuya.`, 4);
      this.message('Survive. Eat to stave off hunger. Claim all 4 markers of a district to build a nest, then find a mate.');
    }

    // ---------- events ----------
    on(k, fn) { (this.listeners[k] = this.listeners[k] || []).push(fn); }
    emit(key, data) {
      data = data || {};
      for (const ch of this.challenges) {
        if (ch.done || ch.key !== key) continue;
        const f = ch.filter;
        if (f && f.type && !(data.types || []).includes(f.type)) continue;
        if (f && f.district && data.district !== f.district) continue;
        ch.progress += key === 'kcal' ? data.amount : 1;
        if (ch.progress >= ch.target) this.completeChallenge(ch);
      }
      (this.listeners[key] || []).forEach(fn => fn(data));
    }
    dealChallenges() {
      const ctx = {
        year: this.year, districts: T.DISTRICTS,
        unclaimed: T.DISTRICTS.filter(d => !this.districtState[d.id].claimed),
        typesSeen: [...new Set(Object.values(T.DISTRICTS).flatMap(d => Object.keys(d.spawns)).flatMap(s => T.SPECIES[s].types))]
      };
      const pool = T.CHALLENGE_TEMPLATES.slice().sort(() => Math.random() - .5);
      this.challenges = [];
      for (const tpl of pool) {
        if (this.challenges.length >= 3) break;
        if (tpl.id === 'mate' && this.year < 3) continue;
        if (tpl.id === 'alpha' && this.year < 2) continue;
        if (tpl.id === 'rank' && RANKS[2].kcal <= this.kcalGen) continue;
        const ch = tpl.make(ctx);
        if (tpl.id === 'alpha' && this.districtState[ch.filter.district].alphaDefeated) continue;
        this.challenges.push(Object.assign(ch, { id: tpl.id, progress: 0, done: false }));
      }
    }
    completeChallenge(ch) {
      ch.done = true; ch.progress = ch.target;
      const r = U.pick(T.CHALLENGE_REWARDS);
      let text = '';
      const p = this.player;
      if (r.kind === 'vitamin') {
        const v = U.pick(Object.keys(T.VITAMINS)), vit = T.VITAMINS[v];
        p.evs[vit.stat] = Math.min(252, p.evs[vit.stat] + 80); p.recalc();
        text = `${vit.name}: ${T.STAT_LABEL[vit.stat]} up`;
      } else if (r.kind === 'item') {
        text = this.grantItem();
      } else if (r.kind === 'candy') {
        this.giveExp(p, Math.max(1, p.expToNext() - p.exp)); text = 'Rare Candy: level up';
      } else {
        this.hunger = 100; p.heal(p.maxHp); p.cureStatus(); text = 'A feast of berries: full hunger and HP';
      }
      this.score += 300 * this.year;
      this.toast(`Challenge complete: ${ch.text}`, 3.5, '#9be564');
      this.message(`Reward: ${text}`);
    }
    grantItem() {
      const keys = Object.keys(T.HELD_ITEMS).filter(k => k !== 'none');
      const locked = keys.filter(k => !T.Save.data.items.includes(k));
      const id = U.pick(locked.length ? locked : keys);
      const isNew = T.Save.unlockItem(id);
      const it = T.HELD_ITEMS[id];
      if (this.player.heldItem !== id) {
        this.ask(`Found ${it.name}`, `${it.desc}<br><br>Currently holding: <b>${T.HELD_ITEMS[this.player.heldItem].name}</b>. Swap?`, [
          { label: `Hold ${it.name}`, key: 'E', fn: () => { this.player.heldItem = id; this.message(`${this.player.name} is now holding ${it.name}.`); } },
          { label: 'Leave it', key: 'X', fn: () => {} }
        ]);
      }
      return `${it.name}${isNew ? ' (new: unlocked for future runs)' : ''}`;
    }

    // ---------- messages ----------
    toast(text, dur, color) { this.toasts.push({ text, t: dur || 2.5, max: dur || 2.5, color: color || '#fff' }); if (this.toasts.length > 4) this.toasts.shift(); }
    message(text) { this.log.push({ text, t: 8 }); if (this.log.length > 5) this.log.shift(); }
    floatText(x, y, text, color, size) { this.texts.push({ x, y, text, color: color || '#fff', life: 1.1, size: size || 14 }); }
    damageText(b, dmg, eff, crit, extra) {
      const col = eff > 1 ? '#ffcf3a' : eff < 1 ? '#9aa' : '#fff';
      this.floatText(b.x + U.rand(-8, 8), b.y - b.size * 1.6, String(dmg), col, crit ? 20 : 15);
      if (eff > 1) this.floatText(b.x, b.y - b.size * 2.6, 'Super effective!', '#ffcf3a', 12);
      else if (eff < 1) this.floatText(b.x, b.y - b.size * 2.6, 'Not very effective', '#9aa', 11);
      if (crit && !extra) this.floatText(b.x, b.y - b.size * 3.2, 'Critical hit!', '#ff7a5a', 12);
      if (extra) this.floatText(b.x, b.y - b.size * 3.4, extra, '#ff4d6d', 16);
    }
    statusText(c) {
      const n = { brn: ['Burned', '#ff7b3a'], psn: ['Poisoned', '#c069d6'], par: ['Paralyzed', '#f7d02c'], slp: ['Asleep', '#9aa7c7'], frz: ['Frozen', '#96d9d6'] }[c.status];
      if (n) this.floatText(c.x, c.y - c.size * 2.2, n[0] + '!', n[1], 13);
    }
    shake(n) { this.camera.shake = Math.max(this.camera.shake, n); }
    ask(title, html, options) { this.pending.push({ kind: 'modal', title, html, options }); }

    // ---------- helpers ----------
    weatherFor(c) { return c && c.ability === 'cloud_nine' ? 'clear' : this.weather; }
    nearby(c, r) { const r2 = r * r; return this.creatures.filter(o => !o.dead && U.dist2(c, o) < r2); }
    allies() { return this.creatures.filter(c => c.faction === 'player' && c !== this.player && !c.dead); }
    rank() { let r = 0; RANKS.forEach((k, i) => { if (this.kcalGen >= k.kcal) r = i; }); return r; }
    district() { return T.districtAt(Math.floor(this.player.x / T.TILE), Math.floor(this.player.y / T.TILE)); }
    wildBaseLevel(d) { return Math.round(3 + (d ? d.difficulty : 0) * 2.2 + (this.year - 1) * 2.4 + this.mods.levelBonus); }
    autoTarget(c, cone, range) {
      let best = null, bs = Infinity;
      for (const o of this.creatures) {
        if (!T.Combat.isFoe(c, o)) continue;
        const d = U.dist(c, o); if (d > range) continue;
        const da = Math.abs(U.angDiff(c.dir, U.angle(c, o)));
        if (da > cone) continue;
        const s = d * (1 + da);
        if (s < bs) { bs = s; best = o; }
      }
      return best;
    }
    addAlly(c) {
      const p = this.player;
      c.faction = 'player'; c.ai.state = 'ally';
      c.x = p.x + U.rand(-30, 30); c.y = p.y + U.rand(-30, 30);
      if (this.map.collides(c.x, c.y, c.radius, c)) { c.x = p.x; c.y = p.y; }
      this.creatures.push(c);
    }
    evolveSpecies(sp, level) {
      let id = sp;
      for (let i = 0; i < 3; i++) {
        const s = T.SPECIES[id];
        if (s.evo && level >= s.evo.level) id = s.evo.to;
        else if (s.evoWeather && level >= s.evoWeather.level) id = s.evoWeather[this.weather] || s.evoWeather.clear;
        else break;
      }
      return id;
    }

    // ---------- spawning ----------
    spawnWild(nearPlayer) {
      const p = this.player;
      for (let tries = 0; tries < 12; tries++) {
        const a = Math.random() * Math.PI * 2, dist = nearPlayer ? U.rand(700, 1050) : U.rand(300, 1000);
        const x = p.x + Math.cos(a) * dist, y = p.y + Math.sin(a) * dist;
        const tx = Math.floor(x / T.TILE), ty = Math.floor(y / T.TILE);
        const d = T.districtAt(tx, ty); if (!d) continue;
        const weights = Object.assign({}, d.spawns);
        if (this.weather === 'smog') weights.koffing = (weights.koffing || 0) + 8;
        if (this.weather === 'rain') { weights.psyduck = (weights.psyduck || 0) + 3; }
        if (this.weather === 'sand') weights.larvitar = (weights.larvitar || 0) + 3;
        const base = U.weighted(weights);
        const lvl = U.clamp(this.wildBaseLevel(d) + U.randInt(-2, 2), 2, 100);
        const sid = this.evolveSpecies(base, lvl);
        const sp = T.SPECIES[sid];
        const tile = this.map.get(tx, ty);
        if (sp.aquatic && tile !== T.TL.WATER) continue;
        const c = new T.Creature(sid, lvl, { x, y, shiny: Math.random() < this.mods.shinyRate });
        if (this.map.collides(x, y, c.radius, c)) continue;
        if (!sp.flies && !sp.swims && tile === T.TL.WATER) continue;
        c.ai.home = { x, y };
        this.creatures.push(c);
        return c;
      }
      return null;
    }
    spawnBoss(d, speciesId, level, opts) {
      const st = this.districtState[d.id];
      const n = T.DISTRICT_TILES;
      const center = this.map.findOpenNear(d.gx * n + 30, d.gy * n + 30, 14) || { tx: d.gx * n + 32, ty: d.gy * n + 32 };
      const c = new T.Creature(speciesId, level, { x: (center.tx + .5) * T.TILE, y: (center.ty + .5) * T.TILE, hpMult: opts.hpMult || 2.2 });
      c.isAlpha = true; c.title = opts.title; c.size *= 1.2; c.radius *= 1.15; c.district = d.id;
      c.ai.home = { x: c.x, y: c.y };
      if (speciesId === 'snorlax') c.ai.state = 'sleep_boss';
      if (c.ability === 'sand_stream') c.onEngage = () => { if (this.weather !== 'sand') { this.weatherBeforeStorm = this.weather; this.weather = 'sand'; this.stormT = 30; this.toast('Tyranitar\'s Sand Stream whipped up a sandstorm!', 3); } };
      this.creatures.push(c);
      if (!opts.legend) st.alphaAlive = c;
      return c;
    }
    manageSpawns(dt) {
      const p = this.player;
      this.spawnT -= dt;
      // Despawn far wildlife.
      for (const c of this.creatures) if (c.faction === 'wild' && !c.isAlpha && U.dist(c, p) > 1700) c.removed = true;
      // Alphas leave when you're far, and return when you come back.
      for (const d of T.DISTRICTS) {
        const st = this.districtState[d.id];
        if (st.alphaDefeated) continue;
        const n = T.DISTRICT_TILES, cx = (d.gx * n + 32) * T.TILE, cy = (d.gy * n + 32) * T.TILE;
        const near = Math.hypot(p.x - cx, p.y - cy) < 1500;
        if (near && !st.alphaAlive) this.spawnBoss(d, d.alpha.species, this.wildBaseLevel(d) + d.alpha.level, { title: d.alpha.title });
        if (!near && st.alphaAlive && U.dist(st.alphaAlive, p) > 2200) { st.alphaAlive.removed = true; st.alphaAlive = null; }
      }
      // Legendary.
      if (!this.legendSpawned && this.year >= this.mods.legendYear) {
        this.legendSpawned = true;
        const d = U.pick(T.DISTRICTS.filter(x => x.id !== 'harajuku'));
        const c = this.spawnBoss(d, 'mewtwo', this.wildBaseLevel(d) + 14, { title: 'The Genetic Pokémon', hpMult: 3, legend: true });
        c.isLegend = true;
        this.toast(`A terrifying presence stirs in ${d.name}...`, 5, '#d69cff');
      }
      if (this.spawnT > 0) return;
      this.spawnT = .4;
      const wild = this.creatures.filter(c => c.faction === 'wild' && !c.removed && U.dist(c, p) < 1300).length;
      const d = this.district();
      const target = 20 + (d ? d.difficulty * 2 : 0) + (this.mods.frenzy ? 8 : 0);
      if (wild < target) this.spawnWild(true);
    }
    initialPopulation() { for (let i = 0; i < 26; i++) this.spawnWild(false); }

    // ---------- main update ----------
    update(dt) {
      if (this.over) return;
      if (!this.modal && this.pending.length) this.openNext();
      if (this.modal || this.paused) return;
      dt = Math.min(dt, 1 / 30);
      this.time += dt;
      this.updateTime(dt);
      this.updatePlayer(dt);
      this.updateCreatures(dt);
      this.updateProjectiles(dt);
      this.updateWorld(dt);
      this.manageSpawns(dt);
      this.updateFx(dt);
      this.creatures = this.creatures.filter(c => !c.removed && !(c.dead && c !== this.player));
    }

    updateTime(dt) {
      this.yearT += dt;
      this.age += dt / this.yearLen;
      if (this.stormT > 0) { this.stormT -= dt; if (this.stormT <= 0 && this.weatherBeforeStorm) { this.weather = this.weatherBeforeStorm; this.toast('The sandstorm subsided.'); } }
      if (this.yearT >= this.yearLen) {
        this.yearT -= this.yearLen;
        this.year++;
        this.score += 1000;
        this.weather = this.mods.eternal || U.weighted(WEATHER_WEIGHTS);
        this.weatherBeforeStorm = null; this.stormT = 0;
        this.toast(`Year ${this.year} · ${T.WEATHER[this.weather].name}`, 4, '#ffd166');
        this.message(T.WEATHER[this.weather].desc);
        this.challenges.filter(c => !c.done).forEach(c => this.message(`Challenge failed: ${c.text}`));
        this.dealChallenges();
        if (this.weather === 'snow') this.map.bushes.forEach(b => { b.ripe = false; b.regrow = this.yearLen * .6; });
      }
      // Ageing.
      const p = this.player, L = this.mods.lifespan;
      if (this.age > L - 2 && !this.warnedOld) { this.warnedOld = true; this.toast('Your body is growing old. Find a mate to carry on your bloodline!', 5, '#ff9b6a'); }
      p.hpCap = this.age > L ? Math.max(0, 1 - (this.age - L) / 3) : 1;
      if (p.hp > p.maxHp * p.hpCap) p.hp = p.maxHp * p.hpCap;
      if (p.hpCap <= 0 && !p.dead) { this.deathCause = 'died of old age'; T.Combat.faint(this, p, null); }
    }

    updatePlayer(dt) {
      const p = this.player;
      if (p.dead) return;
      // Hunger.
      let drain = 100 / 95 * this.mods.hungerMult;
      if (p.sprinting) drain *= 1.6;
      if (this.weather === 'sun' && p.ability !== 'cloud_nine') drain *= 1.2;
      if (p.ability === 'thick_fat') drain *= .8;
      this.hunger = Math.max(0, this.hunger - drain * dt);
      if (this.hunger <= 0) {
        p.hp -= p.maxHp * .025 * dt;
        p.starveFlash = (p.starveFlash || 0) + dt;
        if (p.hp <= 0) { this.deathCause = 'starved to death'; T.Combat.faint(this, p, null); return; }
      }
      // Catch your breath: slow regeneration out of combat while fed.
      if (this.hunger > 30 && this.time - (this.lastHurtT || -99) > 5 && this.time - (this.lastCombatT || -99) > 5) p.heal(p.maxHp * .012 * dt);
      // Input.
      let ix = 0, iy = 0;
      if (I.held('left')) ix--; if (I.held('right')) ix++;
      if (I.held('up')) iy--; if (I.held('down')) iy++;
      const moving = ix || iy;
      if (I.hit('crouch')) p.crouching = !p.crouching;
      const wantSprint = I.held('sprint') && moving && this.stamina > 0 && !p.exhausted;
      if (wantSprint) p.crouching = false;
      p.sprinting = wantSprint;
      const runAway = p.ability === 'run_away';
      if (p.sprinting) { this.stamina -= (runAway ? 14 : 20) * dt; this.staminaDelay = .7; if (this.stamina <= 0) { this.stamina = 0; p.exhausted = true; } }
      else { this.staminaDelay -= dt; if (this.staminaDelay <= 0) this.stamina = Math.min(100, this.stamina + (runAway ? 30 : 20) * dt); }
      if (p.exhausted && this.stamina > 35) p.exhausted = false;

      if (p.eatT > 0) { p.eatT -= dt; p.vx = p.vy = 0; p.moving = false; return; }
      if (!p.canAct()) { p.vx = p.vy = 0; p.moving = false; return; }

      if (moving) {
        const a = Math.atan2(iy, ix);
        const sp = p.moveSpeed() * (p.sprinting ? 1.55 : p.crouching ? .5 : 1);
        p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp;
        p.dir = a;
        if (ix) p.facing = ix;
      } else { p.vx = p.vy = 0; }
      p.moving = !!moving;

      // Dodge roll.
      if (I.hit('dodge') && this.stamina >= 20 && !p.dash) {
        this.stamina -= 20; this.staminaDelay = .5;
        const a = moving ? p.dir : (p.facing > 0 ? 0 : Math.PI);
        p.dash = { t: .22, vx: Math.cos(a) * 560, vy: Math.sin(a) * 560, move: null, hit: new Set() };
        p.iframes = .3;
        p.crouching = false;
      }
      // Moves, with soft aim at the nearest foe in front.
      ['m1', 'm2', 'm3', 'm4'].forEach((k, i) => {
        if (!I.hit(k)) return;
        const t = this.autoTarget(p, 1.1, 460) || this.autoTarget(p, Math.PI, 90);
        if (t) { p.dir = U.angle(p, t); p.facing = Math.cos(p.dir) >= 0 ? 1 : -1; }
        if (T.Combat.useMove(this, p, i)) { p.crouching = false; this.lastCombatT = this.time; }
      });
      if (I.hit('call')) { // Rally the pack.
        this.allies().forEach(a => { a.ai.target = null; });
        this.lastCombatT = -99; this.lastPlayerTarget = null;
        this.floatText(p.x, p.y - 40, 'Heel!', '#9be564');
      }
      this.updateInteraction(dt);

      // District entry.
      const d = this.district();
      if (d && d !== this.lastDistrict) {
        this.lastDistrict = d;
        const st = this.districtState[d.id];
        this.toast(`${d.name}${st.claimed ? ' · your territory' : ''}`, 2.5, '#ffd166');
        this.emit('visit', { district: d.id });
      }
    }

    // ---------- interaction (E) ----------
    findInteractable() {
      const p = this.player, R = 46 + p.radius;
      let best = null, bd = Infinity;
      const consider = (o, kind, label, extra) => { const d = U.dist(p, o); if (d < R && d < bd) { bd = d; best = { o, kind, label, extra }; } };
      const canMeat = p.sp.diet !== 'grazer', canPlant = p.sp.diet !== 'predator';
      for (const c of this.carcasses) consider(c, 'carcass', canMeat ? `Eat ${c.name}${c.contaminated ? ' (contaminated!)' : ''} · ${c.kcal} kcal` : 'Grazers can\'t eat meat');
      for (const b of this.map.bushes) if (b.ripe) consider(b, 'bush', canPlant ? `Eat ${T.BERRIES[b.berry].name}${b.contaminated ? ' (contaminated!)' : ''}` : 'Predators can\'t eat berries');
      for (const m of this.map.markers) if (m.owner !== 'player') consider(m, 'marker', 'Hold to mark territory');
      for (const n of this.map.nests) if (n.active) consider(n, 'nest', this.mates.some(m => m.following) ? 'Raise a family here' : (this.restCd > 0 ? `Rest (${Math.ceil(this.restCd)}s)` : 'Rest in the nest'));
      for (const m of this.mates) if (!m.following && !m.dead) consider(m, 'mate', `Court this ${MATE_QUALITY[m.quality].name} mate`);
      for (const c of this.map.capsules) consider(c, 'capsule', 'Open the supply crate');
      return best;
    }
    updateInteraction(dt) {
      const p = this.player;
      this.restCd = Math.max(0, this.restCd - dt);
      const it = this.findInteractable();
      this.prompt = it;
      // Marking is a hold action.
      if (it && it.kind === 'marker' && I.held('interact')) {
        it.o.progress += dt / 1.6;
        this.marking = it.o;
        if (it.o.progress >= 1) this.claimMarker(it.o);
        return;
      } else if (this.marking) { this.marking.progress = 0; this.marking = null; }
      if (!it || !I.hit('interact')) return;
      const o = it.o;
      switch (it.kind) {
        case 'carcass': {
          if (p.sp.diet === 'grazer') { this.toast('Grazers can\'t eat meat. Look for berry bushes.'); return; }
          const eff = (p.sp.diet === 'omnivore' ? .75 : 1) * (p.heldItem === 'big_root' ? 1.3 : 1);
          this.eat(Math.round(o.kcal * eff), Math.min(70, o.kcal / 4.5) * eff, o.contaminated);
          o.eaten = true;
          this.carcasses = this.carcasses.filter(c => c !== o);
          break;
        }
        case 'bush': {
          if (p.sp.diet === 'predator') { this.toast('Predators can\'t live on berries. Hunt!'); return; }
          const b = T.BERRIES[o.berry], eff = (p.sp.diet === 'omnivore' ? .75 : 1) * (p.heldItem === 'big_root' ? 1.3 : 1);
          this.eat(Math.round(b.kcal * eff), b.hunger * eff * 1.4, o.contaminated);
          if (b.heal) p.heal(p.maxHp * b.heal);
          if (b.cure && p.status && b.cure.includes(p.status)) { p.cureStatus(); this.floatText(p.x, p.y - 40, 'Cured!', '#9be564'); }
          if (b.resetCd) p.cooldowns = [0, 0, 0, 0];
          o.ripe = false; o.regrow = 45; o.contaminated = false;
          this.emit('berry', {});
          this.message(`${p.name} ate a ${b.name}.`);
          break;
        }
        case 'nest': {
          const mate = this.mates.find(m => m.following);
          if (mate) { this.raiseFamily(mate, o); return; }
          if (this.restCd > 0) return;
          p.hp = p.maxHp * (p.hpCap || 1); p.cureStatus(); this.hunger = Math.max(0, this.hunger - 10);
          this.allies().forEach(a => { a.hp = a.maxHp; a.cureStatus(); });
          this.restCd = 30;
          this.toast('You rest in the nest. HP restored.');
          break;
        }
        case 'mate': {
          const q = MATE_QUALITY[o.quality];
          if (this.rank() < q.rank) { this.toast(`This ${q.name} mate isn't interested. You need ${RANKS[q.rank].name} rank (eat more!).`, 3.5, '#ff9b6a'); return; }
          if (this.mates.some(m => m.following)) { this.toast('You are already leading a mate.'); return; }
          o.following = true;
          this.toast(`The ${q.name} ${o.name} follows you. Lead them to a nest!`, 3.5, '#f6b6c8');
          break;
        }
        case 'capsule': {
          this.map.capsules = this.map.capsules.filter(c => c !== o);
          this.openCapsule();
          break;
        }
      }
    }
    eat(kcal, hunger, contaminated) {
      const p = this.player;
      p.eatT = .6;
      this.hunger = Math.min(100, this.hunger + hunger);
      this.kcalGen += kcal; this.kcalTotal += kcal;
      this.giveExp(p, Math.round(kcal / 8));
      const beforeRank = this.rankShown || 0;
      this.floatText(p.x, p.y - 36, `+${kcal} kcal`, '#ffd166', 15);
      this.fx.burst(p.x, p.y, '#ffd166', 8);
      this.emit('kcal', { amount: kcal });
      if (contaminated && p.setStatus('psn')) { this.statusText(p); this.message('The food was contaminated by the smog...'); }
      const r = this.rank();
      if (r > beforeRank) {
        this.rankShown = r;
        this.toast(`Rank up: ${RANKS[r].name}!`, 3, '#f7d02c');
        if (r === 2) this.emit('rank_prime', {});
      }
    }
    openCapsule() {
      const p = this.player;
      const roll = Math.random();
      if (roll < .35) {
        const id = U.pick(Object.keys(T.BERRIES)), b = T.BERRIES[id];
        if (p.sp.diet === 'predator') { this.eat(80, 12, false); this.message('The crate held some dried food.'); }
        else { this.eat(b.kcal, b.hunger, false); if (b.heal) p.heal(p.maxHp * b.heal); this.message(`The crate held a ${b.name}.`); }
      } else if (roll < .6) {
        const v = U.pick(Object.keys(T.VITAMINS)), vit = T.VITAMINS[v];
        p.evs[vit.stat] = Math.min(252, p.evs[vit.stat] + 80); p.recalc();
        this.toast(`Found ${vit.name}! ${T.STAT_LABEL[vit.stat]} rose.`, 3, '#9be564');
      } else if (roll < .72) {
        this.giveExp(p, Math.max(1, p.expToNext() - p.exp)); this.toast('Found a Rare Candy!', 3, '#9be564');
      } else {
        this.message(`Found: ${this.grantItem()}`);
      }
    }
    claimMarker(m) {
      m.owner = 'player'; m.progress = 0; this.marking = null;
      this.fx.ring(m.x, m.y, 60, '#5ab0ff');
      this.emit('mark', {});
      const d = T.DISTRICTS.find(x => x.id === m.district);
      const left = this.map.markers.filter(x => x.district === m.district && x.owner !== 'player').length;
      this.score += 100;
      if (left > 0) { this.toast(`Marked! ${left} marker${left > 1 ? 's' : ''} left in ${d.name}.`); }
      else this.claimDistrict(d);
      // The alpha takes offence.
      const st = this.districtState[d.id];
      if (st.alphaAlive && !st.alphaAlive.dead && U.dist(st.alphaAlive, this.player) < 1000 && st.alphaAlive.ai.state !== 'sleep_boss') {
        st.alphaAlive.ai.state = 'fight'; st.alphaAlive.ai.target = this.player; st.alphaAlive.ai.noticed = true;
      }
    }
    claimDistrict(d) {
      const st = this.districtState[d.id];
      st.claimed = true;
      this.map.nests.find(n => n.district === d.id).active = true;
      this.score += 1000;
      this.toast(`${d.name} is now your territory! A nest is ready.`, 4, '#5ab0ff');
      this.message('Mates will appear in your territory. Higher rank attracts better mates.');
      this.emit('claim', { district: d.id });
      this.spawnMates(d);
    }
    spawnMates(d) {
      const st = this.districtState[d.id];
      if (st.mateYear === this.year) return;
      st.mateYear = this.year;
      const p = this.player, n = T.DISTRICT_TILES;
      const qualities = ['desperate', 'average', 'prime'];
      for (const q of qualities) {
        if (Math.random() < .25 && q !== 'desperate') continue;
        const spot = this.map.findOpenNear(d.gx * n + U.randInt(8, 56), d.gy * n + U.randInt(8, 56), 10);
        if (!spot) continue;
        const lvl = Math.max(5, p.level + U.randInt(-4, 2));
        const sid = this.evolveSpecies(p.sp.root, lvl);
        const m = new T.Creature(sid, lvl, { x: (spot.tx + .5) * T.TILE, y: (spot.ty + .5) * T.TILE, faction: 'mate', gender: p.gender === 'm' ? 'f' : 'm' });
        m.quality = q; m.ai.state = 'mate'; m.district = d.id;
        this.creatures.push(m); this.mates.push(m);
      }
      this.message(`Potential mates appeared in ${d.name}.`);
    }

    // ---------- generations ----------
    raiseFamily(mate, nest) {
      const p = this.player, q = MATE_QUALITY[mate.quality];
      let litter = q.litter + (p.heldItem === 'soothe_bell' ? 1 : 0);
      const kids = [];
      for (let i = 0; i < litter; i++) {
        const ivs = {};
        for (const k of T.STAT_KEYS) ivs[k] = U.clamp(Math.max(p.ivs[k], U.randInt(q.ivs[0], q.ivs[1])) + U.randInt(0, 3), 0, 31);
        const evs = {}; for (const k of T.STAT_KEYS) evs[k] = Math.floor(p.evs[k] / 2);
        const keepNature = p.heldItem === 'everstone' || Math.random() < .5;
        const lvl = Math.max(5, Math.floor(p.level * q.levelFrac));
        const root = p.sp.root;
        const sid = this.evolveSpecies(root, Math.min(lvl, 1)); // babies hatch as the base form
        const kid = new T.Creature(sid, lvl, { faction: 'player', ivs, evs, nature: keepNature ? p.nature : U.pick(T.NATURE_NAMES),
          shiny: Math.random() < this.mods.shinyRate * (p.shiny ? 8 : 1), abilitySlot: p.abilitySlot });
        // Egg move.
        const egg = T.SPECIES[root].eggMoves.filter(m => !kid.moves.includes(m));
        if (egg.length) { const em = U.pick(egg); if (kid.moves.length < 4) kid.moves.push(em); else kid.moves[0] = em; }
        kids.push(kid);
      }
      const heir = kids[0];
      heir.heldItem = p.heldItem;
      // Retire the parent and the mate.
      p.removed = true; mate.removed = true;
      this.mates = this.mates.filter(m => m !== mate);
      heir.x = nest.x; heir.y = nest.y; heir.ai.state = 'player';
      this.creatures.push(heir);
      this.player = heir;
      for (const a of this.allies()) if (a.level < heir.level - 5) a.removed = true; // old pack wanders off
      for (const k of kids.slice(1)) this.addAlly(k);
      this.generation++;
      this.age = 1; this.warnedOld = false;
      this.kcalGen = 0; this.rankShown = 0;
      this.hunger = 100;
      this.score += 1500 * q.litter;
      this.emit('mate', {});
      T.Save.see(heir.species);
      this.ask(`Generation ${this.generation}`, `
        ${q.name} pairing: <b>${litter}</b> offspring.<br>
        You now play as <b>${heir.name}</b> (Lv ${heir.level}, ${heir.nature}).
        ${kids.length > 1 ? `<br>${kids.length - 1} sibling${kids.length > 2 ? 's' : ''} join${kids.length > 2 ? '' : 's'} your pack.` : ''}
        <br><br><small>IVs were inherited from the stronger parent. Half of your vitamins carried over.</small>`,
        [{ label: 'Continue the bloodline', key: 'E', fn: () => {} }]);
    }

    // ---------- creatures ----------
    updateCreatures(dt) {
      const map = this.map;
      this.auraT = (this.auraT || 0) - dt;
      if (this.auraT <= 0) {
        this.auraT = .3;
        for (const c of this.creatures) { c.intimidated = Math.max(0, (c.intimidated || 0) - .3); c.pressured = Math.max(0, (c.pressured || 0) - .3); }
        for (const c of this.creatures) {
          if (c.dead || (c.ability !== 'intimidate' && c.ability !== 'pressure' && c.ability !== 'magnet_pull')) continue;
          for (const o of this.nearby(c, 200)) {
            if (!T.Combat.isFoe(c, o) && !T.Combat.isFoe(o, c)) continue;
            if (c.faction === 'wild' && o.faction === 'wild') continue;
            if (c.ability === 'intimidate' && o.ability !== 'inner_focus') o.intimidated = .6;
            if (c.ability === 'pressure') o.pressured = .6;
            if (c.ability === 'magnet_pull' && o.types.includes('steel')) { const a = U.angle(o, c); o.kx = (o.kx || 0) + Math.cos(a) * 25; o.ky = (o.ky || 0) + Math.sin(a) * 25; }
          }
        }
      }
      for (const c of this.creatures) {
        if (c.dead) continue;
        for (let i = 0; i < 4; i++) if (c.cooldowns[i] > 0) c.cooldowns[i] -= dt;
        c.stun = Math.max(0, c.stun - dt); c.flash = Math.max(0, c.flash - dt); c.iframes = Math.max(0, c.iframes - dt);
        T.Combat.tickStatus(this, c, dt);
        if (c.dead) continue;
        if (c.hp <= 0) { T.Combat.faint(this, c, null); continue; }
        if (c !== this.player && c.faction !== 'player-ctl') T.AI.update(this, c, dt);
        if (c.isAlpha && c.ai.state === 'sleep_boss' && U.dist(c, this.player) < 70 && !this.player.crouching) { c.ai.state = 'fight'; c.ai.target = this.player; this.toast(`${c.name} woke up!`); }
        if (c.isAlpha && c.ai.state === 'fight' && !c.engaged) { c.engaged = true; if (c.onEngage) c.onEngage(); this.toast(`${c.title}: ${c.name} Lv ${c.level}!`, 3, '#ff6b6b'); }
        // Movement.
        let vx = c.vx, vy = c.vy;
        if (!c.canAct() && c !== this.player) { vx = 0; vy = 0; }
        if (c.dash) {
          vx = c.dash.vx; vy = c.dash.vy; c.dash.t -= dt;
          if (c.dash.move) for (const o of this.creatures) {
            if (!c.dash.hit.has(o) && T.Combat.isFoe(c, o) && U.dist(c, o) < c.radius + o.radius + 6) { c.dash.hit.add(o); T.Combat.hit(this, c, o, c.dash.move); }
          }
          if (c.dash.t <= 0) c.dash = null;
        }
        if (c.kx || c.ky) { vx += c.kx; vy += c.ky; c.kx *= Math.pow(.004, dt); c.ky *= Math.pow(.004, dt); if (Math.abs(c.kx) + Math.abs(c.ky) < 5) c.kx = c.ky = 0; }
        const nx = c.x + vx * dt, ny = c.y + vy * dt;
        let moved = false;
        if (!map.collides(nx, c.y, c.radius, c)) { c.x = nx; moved = true; } else if (c.dash) c.dash.t = Math.min(c.dash.t, .02);
        if (!map.collides(c.x, ny, c.radius, c)) { c.y = ny; moved = true; }
        c.stuckT = (!moved && (vx || vy)) ? (c.stuckT || 0) + dt : 0;
        if (c.stuckT > 1.2 && c.ai.dest) { c.ai.dest = null; c.ai.t = 0; }
        c.moving = Math.abs(vx) + Math.abs(vy) > 10;
        if (Math.abs(vx) > 5 && c !== this.player) c.facing = vx > 0 ? 1 : -1;
        if (c === this.player && c.dash) c.facing = c.dash.vx >= 0 ? 1 : -1;
      }
      // Soft separation.
      const list = this.creatures;
      for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j]; if (a.dead || b.dead) continue;
        const dx = b.x - a.x, dy = b.y - a.y, r = a.radius + b.radius;
        if (Math.abs(dx) > r || Math.abs(dy) > r) continue;
        const d = Math.hypot(dx, dy) || 1; if (d >= r) continue;
        const push = (r - d) / 2, ux = dx / d, uy = dy / d;
        if (!map.collides(a.x - ux * push, a.y - uy * push, a.radius, a)) { a.x -= ux * push; a.y -= uy * push; }
        if (!map.collides(b.x + ux * push, b.y + uy * push, b.radius, b)) { b.x += ux * push; b.y += uy * push; }
      }
    }

    updateProjectiles(dt) {
      for (const pr of this.projectiles) {
        pr.life -= dt;
        if (pr.homing && !pr.homing.dead) {
          const a = Math.atan2(pr.homing.y - pr.y, pr.homing.x - pr.x), cur = Math.atan2(pr.vy, pr.vx);
          const na = cur + U.clamp(U.angDiff(cur, a), -4 * dt, 4 * dt), sp = Math.hypot(pr.vx, pr.vy);
          pr.vx = Math.cos(na) * sp; pr.vy = Math.sin(na) * sp;
        }
        pr.x += pr.vx * dt; pr.y += pr.vy * dt;
        if (this.map.tileAtPx(pr.x, pr.y) === T.TL.BUILDING && !pr.owner.phases) { pr.life = 0; this.fx.burst(pr.x, pr.y, T.TYPE_COLORS[pr.move.type], 4); continue; }
        for (const o of this.creatures) {
          if (!T.Combat.isFoe(pr.owner, o)) continue;
          if (U.dist(pr, o) < o.radius + pr.r) {
            T.Combat.hit(this, pr.owner, o, pr.move);
            pr.life = 0; break;
          }
        }
        if (Math.random() < .5) this.particles.push({ x: pr.x, y: pr.y, vx: U.rand(-20, 20), vy: U.rand(-20, 20), life: .3, max: .3, color: T.TYPE_COLORS[pr.move.type], size: pr.r * .6 });
      }
      this.projectiles = this.projectiles.filter(p => p.life > 0);
    }

    updateWorld(dt) {
      for (const b of this.map.bushes) if (!b.ripe && this.weather !== 'snow') { b.regrow -= dt; if (b.regrow <= 0) { b.ripe = true; b.contaminated = this.weather === 'smog' && Math.random() < .5; } }
      for (const c of this.carcasses) c.t -= dt;
      this.carcasses = this.carcasses.filter(c => c.t > 0);
      // Supply crates.
      this.capsuleT -= dt * (this.player.ability === 'pickup' ? 2 : 1);
      if (this.capsuleT <= 0) {
        this.capsuleT = U.rand(25, 40);
        const near = this.map.capsules.filter(c => U.dist(c, this.player) < 1500);
        if (near.length < 4) {
          for (let i = 0; i < 10; i++) {
            const a = Math.random() * 7, d = U.rand(250, 650), x = this.player.x + Math.cos(a) * d, y = this.player.y + Math.sin(a) * d;
            const t = this.map.tileAtPx(x, y);
            if ((t === T.TL.RUBBLE || t === T.TL.WALK || t === T.TL.PLAZA) && !this.map.collides(x, y, 12, null)) { this.map.capsules.push({ x, y }); break; }
          }
        }
      }
      // Mates refresh yearly in claimed districts.
      const d = this.district();
      if (d && this.districtState[d.id].claimed) this.spawnMates(d);
    }

    giveExp(c, n) {
      if (c.heldItem === 'lucky_egg') n *= 1.5;
      const evs = c.gainExp(Math.round(n));
      if (c === this.player) for (const e of evs) this.pending.push(Object.assign({ kind: 'lvl', who: c }, e));
      else for (const e of evs) if (e.type === 'move') { if (c.moves.length < 4) c.moves.push(e.move); else c.moves[U.randInt(0, 3)] = e.move; }
      if (c !== this.player) { const evo = c.evolutionTarget(this.weather); if (evo) { c.setSpecies(evo); c.moves = T.learnsetUpTo(evo, c.level).slice(-4); this.floatText(c.x, c.y - 40, `Evolved into ${c.name}!`, '#fff'); } }
      else if (evs.length) this.pending.push({ kind: 'evocheck', who: c });
    }

    onFaint(v, killer) {
      this.fx.burst(v.x, v.y, '#ffffff', 14);
      if (v.faction === 'wild') {
        const kcal = Math.round((60 + v.sp.bst * .35 + v.level * 6) * (v.isAlpha ? 3 : 1));
        this.carcasses.push({ x: v.x, y: v.y, kcal, name: v.name, species: v.species, t: 50, contaminated: this.weather === 'smog' && Math.random() < .5, size: v.size });
        T.Save.see(v.species);
        const byPlayerSide = killer && killer.faction === 'player';
        if (byPlayerSide) {
          const p = this.player;
          this.kos++;
          this.score += 10 * v.level;
          const exp = v.expYield() * v.level / 7 * 2 * (v.isAlpha ? 2 : 1);
          this.giveExp(p, exp);
          for (const a of this.allies()) this.giveExp(a, exp * .5);
          if (killer.ability === 'moxie') killer.addStages({ atk: 1 });
          const d = T.districtAt(Math.floor(v.x / T.TILE), Math.floor(v.y / T.TILE));
          this.emit('ko', { types: v.types, district: d && d.id });
          if (v.level > p.level) this.emit('ko_up', {});
          const unlocked = T.Save.recordKO(v.species);
          if (unlocked) this.toast(`New Pokémon unlocked: ${T.SPECIES[unlocked].name}!`, 4, '#9be564');
          if (v.isAlpha) {
            const st = v.district && this.districtState[v.district];
            if (v.isLegend) this.toast(`You defeated ${v.name}! Legendary feat!`, 5, '#d69cff');
            else if (st) { st.alphaDefeated = true; st.alphaAlive = null; this.toast(`${v.title} ${v.name} has fallen!`, 4, '#ffd166'); this.emit('alpha', { district: v.district }); }
            this.score += 2500;
            if (!T.Save.data.beatenBosses.includes(v.species)) { T.Save.data.beatenBosses.push(v.species); T.Save.write(); }
            if (T.Save.unlock(v.sp.root)) this.toast(`New Pokémon unlocked: ${T.SPECIES[v.sp.root].name}!`, 4, '#9be564');
            this.message(`Reward: ${this.grantItem()}`);
          }
        } else if (v.isAlpha && v.district && this.districtState[v.district]) this.districtState[v.district].alphaAlive = null;
        return;
      }
      if (v === this.player) {
        const heirs = this.allies();
        if (heirs.length) {
          const h = heirs[0];
          h.ai.state = 'player';
          this.player = h;
          this.toast(`${v.name} has fallen... ${h.name} carries on the bloodline.`, 4, '#ff9b6a');
          v.removed = true;
          return;
        }
        this.gameOver(this.deathCause || (killer ? `was defeated by a wild ${killer.name}` : 'succumbed to its wounds'));
      } else if (v.faction === 'player') this.message(`${v.name} from your pack has fallen.`);
    }

    gameOver(cause) {
      this.over = true;
      const years = Math.floor(this.year - 1 + this.yearT / this.yearLen);
      this.finalScore = Math.round((this.score + this.kcalTotal / 4 + this.generation * 500 + this.kos * 15) * this.scoreMult);
      this.summary = { cause, years, score: this.finalScore, generations: this.generation, kos: this.kos, kcal: this.kcalTotal, species: this.player.species, level: this.player.level };
      T.Save.recordRun(this.cfg.species, years, this.finalScore);
      if (T.Menus) T.Menus.gameOver(this.summary);
    }

    // ---------- pending prompts (level ups, moves, evolution) ----------
    openNext() {
      const e = this.pending.shift();
      const p = this.player;
      if (e.who && e.who !== p) return;
      if (e.kind === 'modal') { this.modal = e; T.Menus.showModal(e); return; }
      if (e.kind === 'lvl' && e.type === 'level') {
        this.toast(`${p.name} grew to Lv ${e.level}!`, 2, '#9be564'); this.emit('level', {});
        this.fx.ring(p.x, p.y, 40, '#9be564');
        return;
      }
      if (e.kind === 'lvl' && e.type === 'move') return this.offerMove(e.move);
      if (e.kind === 'evocheck') {
        if (this.pending.some(x => x.kind === 'evocheck')) return;
        const to = p.evolutionTarget(this.weather);
        if (!to || this.declinedEvo === p.level) return;
        const from = p.name;
        this.modal = { title: 'What?', html: `<b>${from}</b> is evolving!<br><canvas data-portrait="${to}"></canvas>`, options: [
          { label: 'Evolve', key: 'E', fn: () => this.evolvePlayer(to, from) },
          { label: 'Stop it (B)', key: 'X', fn: () => { this.declinedEvo = p.level; } }
        ] };
        T.Menus.showModal(this.modal);
      }
    }
    offerMove(m) {
      const p = this.player, mv = T.MOVES[m];
      if (p.moves.includes(m)) return;
      if (p.moves.length < 4) { p.learnMove(m); this.toast(`${p.name} learned ${mv.name}!`, 2.5, '#9be564'); return; }
      this.modal = { title: `${p.name} wants to learn ${mv.name}`, html: T.Menus.moveCard(m) + '<p>Forget which move?</p>',
        options: p.moves.map((old, i) => ({ label: `${i + 1}. ${T.MOVES[old].name}`, key: String(i + 1), fn: () => { p.learnMove(m, i); this.toast(`Forgot ${T.MOVES[old].name}, learned ${mv.name}!`); } }))
          .concat([{ label: `Don't learn ${mv.name}`, key: 'X', fn: () => {} }]) };
      T.Menus.showModal(this.modal);
    }
    evolvePlayer(to, from) {
      const p = this.player;
      p.setSpecies(to);
      p.hp = Math.min(p.maxHp, p.hp + p.maxHp * .25);
      this.fx.ring(p.x, p.y, 80, '#ffffff'); this.fx.burst(p.x, p.y, '#ffffff', 30);
      this.toast(`Congratulations! ${from} evolved into ${p.name}!`, 4, '#ffffff');
      T.Save.see(to);
      this.emit('evolve', {});
      const ls = T.SPECIES[to].learn, fresh = [];
      for (const lv of Object.keys(ls).map(Number).sort((a, b) => a - b)) if (lv <= p.level) for (const m of ls[lv]) if (!p.moves.includes(m) && !fresh.includes(m)) fresh.push(m);
      fresh.reverse().forEach(m => this.pending.unshift({ kind: 'lvl', type: 'move', move: m, who: p }));
    }
    closeModal(opt) {
      const m = this.modal; this.modal = null;
      if (opt && opt.fn) opt.fn();
      return m;
    }

    updateFx(dt) {
      for (const p of this.particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .92; p.vy *= .92; }
      this.particles = this.particles.filter(p => p.life > 0);
      for (const t of this.texts) { t.life -= dt; t.y -= 30 * dt; }
      this.texts = this.texts.filter(t => t.life > 0);
      for (const f of this.fxList) f.life -= dt;
      this.fxList = this.fxList.filter(f => f.life > 0);
      for (const t of this.toasts) t.t -= dt;
      this.toasts = this.toasts.filter(t => t.t > 0);
      for (const l of this.log) l.t -= dt;
      this.log = this.log.filter(l => l.t > 0);
      for (const c of this.creatures) if (c.alertT > 0) c.alertT -= dt;
      this.camera.shake = Math.max(0, this.camera.shake - dt * 20);
    }

    // ---------- rendering ----------
    render(g, vw, vh) {
      const p = this.player, cam = this.camera;
      cam.x = U.clamp(p.x - vw / 2, 0, this.map.w * T.TILE - vw);
      cam.y = U.clamp(p.y - vh / 2, 0, this.map.h * T.TILE - vh);
      const sx = cam.shake ? U.rand(-cam.shake, cam.shake) : 0, sy = cam.shake ? U.rand(-cam.shake, cam.shake) : 0;
      const view = { x: cam.x + sx, y: cam.y + sy };
      g.fillStyle = '#111'; g.fillRect(0, 0, vw, vh);
      this.map.draw(g, view, vw, vh);
      g.save(); g.translate(-Math.round(view.x), -Math.round(view.y));
      const onScreen = (o, m) => o.x > view.x - m && o.x < view.x + vw + m && o.y > view.y - m && o.y < view.y + vh + m;
      const t = this.time;
      // Nests
      for (const n of this.map.nests) if (n.active && onScreen(n, 60)) drawNest(g, n, t);
      // Markers
      for (const m of this.map.markers) if (onScreen(m, 60)) drawMarker(g, m, t);
      // Bushes
      for (const b of this.map.bushes) if (onScreen(b, 40)) drawBush(g, b);
      // Crates
      for (const c of this.map.capsules) if (onScreen(c, 30)) drawCrate(g, c, t);
      // Carcasses
      for (const c of this.carcasses) if (onScreen(c, 40)) drawCarcass(g, c, t);
      // Creatures
      const list = this.creatures.filter(c => !c.dead && onScreen(c, 80)).sort((a, b) => a.y - b.y);
      for (const c of list) this.drawCreature(g, c, t);
      // Projectiles
      for (const pr of this.projectiles) {
        const col = T.TYPE_COLORS[pr.move.type];
        g.fillStyle = col; g.globalAlpha = .35; g.beginPath(); g.arc(pr.x, pr.y, pr.r * 2, 0, 7); g.fill();
        g.globalAlpha = 1; g.beginPath(); g.arc(pr.x, pr.y, pr.r, 0, 7); g.fill();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(pr.x, pr.y, pr.r * .4, 0, 7); g.fill();
      }
      // Effects
      for (const f of this.fxList) drawFx(g, f);
      for (const pa of this.particles) { g.globalAlpha = pa.life / pa.max; g.fillStyle = pa.color; g.fillRect(pa.x - pa.size / 2, pa.y - pa.size / 2, pa.size, pa.size); }
      g.globalAlpha = 1;
      for (const tx of this.texts) {
        g.globalAlpha = Math.min(1, tx.life * 2);
        g.font = `bold ${tx.size}px system-ui, sans-serif`; g.textAlign = 'center';
        g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.8)'; g.strokeText(tx.text, tx.x, tx.y); g.fillStyle = tx.color; g.fillText(tx.text, tx.x, tx.y);
      }
      g.globalAlpha = 1;
      // Interaction prompt
      if (this.prompt && !p.dead) {
        const o = this.prompt.o;
        g.font = 'bold 13px system-ui, sans-serif'; g.textAlign = 'center';
        const label = `[E] ${this.prompt.label}`, w = g.measureText(label).width + 16;
        g.fillStyle = 'rgba(10,12,18,.85)'; g.fillRect(o.x - w / 2, o.y - 62, w, 22);
        g.fillStyle = '#ffd166'; g.fillText(label, o.x, o.y - 46);
        if (this.prompt.kind === 'marker' && o.progress > 0) { g.fillStyle = '#333'; g.fillRect(o.x - 30, o.y - 36, 60, 6); g.fillStyle = '#5ab0ff'; g.fillRect(o.x - 30, o.y - 36, 60 * o.progress, 6); }
      }
      g.restore();
      drawWeather(g, this.weather, vw, vh, t, this);
      T.HUD.draw(this, g, vw, vh);
    }

    drawCreature(g, c, t) {
      const tile = this.map.tileAtPx(c.x, c.y + c.size * .4);
      const inGrass = tile === T.TL.TALL && !c.flies;
      c.aggro = c.faction === 'wild' && c.ai.noticed && c.ai.state === 'fight';
      c.alpha = (c === this.player || c.faction === 'player') && c.crouching ? .7 : undefined;
      if (c.faction === 'wild' && inGrass && !c.ai.noticed && this.player.ability !== 'keen_eye') c.alpha = .55;
      if (c.ai.state === 'sleep_boss' || c.status === 'slp') { g.font = 'bold 14px system-ui'; g.fillStyle = '#cfe'; g.fillText('z', c.x + c.size + Math.sin(t * 2) * 4, c.y - c.size * 1.8 - (t * 10 % 12)); }
      T.Art.draw(g, c, c.x, c.y, t);
      if (inGrass) { // Grass sways over the lower body.
        g.strokeStyle = '#5f9a38'; g.lineWidth = 2;
        for (let i = -2; i <= 2; i++) { const bx = c.x + i * c.size * .35; g.beginPath(); g.moveTo(bx, c.y + c.size * .7); g.lineTo(bx + Math.sin(t * 3 + i) * 3, c.y + c.size * .05); g.stroke(); }
      }
      const top = c.y - c.size * 1.9;
      // Labels.
      if (c.faction === 'wild') {
        const showHp = c.hp < c.maxHp || c.isAlpha || U.dist(c, this.player) < 220;
        if (showHp) {
          const w = c.isAlpha ? 64 : 36;
          g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(c.x - w / 2 - 1, top - 1, w + 2, 6);
          const f = c.hp / c.maxHp; g.fillStyle = f > .5 ? '#5bd36a' : f > .2 ? '#f7c948' : '#f25f5c'; g.fillRect(c.x - w / 2, top, w * f, 4);
          g.font = 'bold 10px system-ui'; g.textAlign = 'center';
          const lvlCol = c.level > this.player.level + 4 ? '#ff6b6b' : c.level < this.player.level - 4 ? '#9aa' : '#fff';
          g.fillStyle = lvlCol; g.fillText(`${c.isAlpha ? '♛ ' : ''}${c.name} Lv${c.level}${c.shiny ? ' ✦' : ''}`, c.x, top - 4);
          if (c.status) { g.fillStyle = statusColor(c.status); g.fillText(c.status.toUpperCase(), c.x + w / 2 + 12, top + 5); }
        }
        if (c.ai.noticed && c.ai.state === 'fight' && c.alertT > 0) { g.font = 'bold 20px system-ui'; g.fillStyle = '#ff4d4d'; g.fillText('!', c.x, top - 16); }
        else if (!c.ai.noticed && c.ai.aware > .3) { g.font = 'bold 16px system-ui'; g.fillStyle = '#ffd166'; g.fillText('?', c.x, top - 16); }
      } else if (c.faction === 'mate') {
        const q = MATE_QUALITY[c.quality];
        g.font = 'bold 11px system-ui'; g.textAlign = 'center'; g.fillStyle = q.color;
        g.fillText(`♥ ${q.name} ${c.gender === 'f' ? '♀' : '♂'}`, c.x, top - 2);
      } else if (c !== this.player) {
        g.fillStyle = '#5ab0ff'; g.beginPath(); g.moveTo(c.x, top - 2); g.lineTo(c.x - 5, top - 10); g.lineTo(c.x + 5, top - 10); g.fill();
        const f = c.hp / c.maxHp; g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(c.x - 16, top + 2, 32, 4); g.fillStyle = '#5ab0ff'; g.fillRect(c.x - 16, top + 2, 32 * f, 4);
      }
      if (c.shiny && Math.sin(t * 5 + c.id) > .8) { g.fillStyle = '#fff'; g.font = '12px system-ui'; g.fillText('✦', c.x + c.size, c.y - c.size); }
    }
  }

  function statusColor(s) { return { brn: '#ff7b3a', psn: '#c069d6', par: '#f7d02c', slp: '#9aa7c7', frz: '#96d9d6' }[s] || '#fff'; }
  T.statusColor = statusColor;

  function drawNest(g, n, t) {
    g.fillStyle = 'rgba(90,176,255,.15)'; g.beginPath(); g.arc(n.x, n.y, 34 + Math.sin(t * 2) * 3, 0, 7); g.fill();
    g.strokeStyle = '#8a6a3a'; g.lineWidth = 6; g.beginPath(); g.ellipse(n.x, n.y, 26, 16, 0, 0, 7); g.stroke();
    g.strokeStyle = '#a8844a'; g.lineWidth = 3; for (let i = 0; i < 8; i++) { const a = i * .8; g.beginPath(); g.moveTo(n.x + Math.cos(a) * 18, n.y + Math.sin(a) * 10); g.lineTo(n.x + Math.cos(a + .6) * 30, n.y + Math.sin(a + .6) * 18); g.stroke(); }
    g.fillStyle = '#3a2a1a'; g.beginPath(); g.ellipse(n.x, n.y, 18, 10, 0, 0, 7); g.fill();
  }
  function drawMarker(g, m, t) {
    const own = m.owner === 'player';
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(m.x, m.y + 6, 14, 5, 0, 0, 7); g.fill();
    g.fillStyle = '#777'; g.fillRect(m.x - 2, m.y - 30, 4, 36);
    const col = own ? '#5ab0ff' : '#e05555';
    g.fillStyle = col; g.beginPath(); g.moveTo(m.x + 2, m.y - 30); g.lineTo(m.x + 22 + Math.sin(t * 4) * 2, m.y - 24); g.lineTo(m.x + 2, m.y - 17); g.fill();
    g.strokeStyle = col; g.globalAlpha = .5 + .3 * Math.sin(t * 3); g.lineWidth = 2; g.beginPath(); g.arc(m.x, m.y, 18, 0, 7); g.stroke(); g.globalAlpha = 1;
  }
  function drawBush(g, b) {
    g.fillStyle = '#2f6a2a'; g.beginPath(); g.arc(b.x - 7, b.y, 10, 0, 7); g.arc(b.x + 7, b.y, 10, 0, 7); g.arc(b.x, b.y - 7, 11, 0, 7); g.fill();
    if (b.ripe) { const col = b.contaminated ? '#8e5bb8' : T.BERRIES[b.berry].color; g.fillStyle = col;
      for (const [dx, dy] of [[-7, -3], [5, -8], [6, 3], [-2, 4]]) { g.beginPath(); g.arc(b.x + dx, b.y + dy, 3.5, 0, 7); g.fill(); } }
  }
  function drawCrate(g, c, t) {
    const y = c.y + Math.sin(t * 3) * 1.5;
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(c.x - 11, c.y + 8, 22, 4);
    g.fillStyle = '#9a6a3a'; g.fillRect(c.x - 11, y - 10, 22, 18);
    g.strokeStyle = '#5a3a1a'; g.lineWidth = 2; g.strokeRect(c.x - 11, y - 10, 22, 18);
    g.fillStyle = '#ffd166'; g.font = 'bold 13px system-ui'; g.textAlign = 'center'; g.fillText('?', c.x, y + 4);
  }
  function drawCarcass(g, c, t) {
    const fade = Math.min(1, c.t / 8);
    g.globalAlpha = fade;
    g.fillStyle = c.contaminated ? 'rgba(142,91,184,.35)' : 'rgba(120,30,30,.25)'; g.beginPath(); g.ellipse(c.x, c.y + 4, c.size, c.size * .4, 0, 0, 7); g.fill();
    // A drumstick.
    g.fillStyle = c.contaminated ? '#9a6ab8' : '#b5562a';
    g.beginPath(); g.ellipse(c.x - 3, c.y - 2, 10, 7, -.5, 0, 7); g.fill();
    g.fillStyle = '#f2e6d0'; g.fillRect(c.x + 4, c.y + 1, 8, 3); g.beginPath(); g.arc(c.x + 13, c.y + 1, 2.5, 0, 7); g.arc(c.x + 13, c.y + 4, 2.5, 0, 7); g.fill();
    g.globalAlpha = 1;
  }
  function drawFx(g, f) {
    const k = f.life / f.max;
    if (f.kind === 'ring') { g.strokeStyle = f.color; g.globalAlpha = k; g.lineWidth = 4 * k + 1; g.beginPath(); g.arc(f.x, f.y, f.r * (1 - k * .7), 0, 7); g.stroke(); }
    if (f.kind === 'slash') {
      g.strokeStyle = f.color; g.globalAlpha = k; g.lineWidth = 5 * k + 1;
      g.beginPath(); g.arc(f.x, f.y, f.r, f.ang - 1, f.ang + 1); g.stroke();
      g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(f.x, f.y, f.r - 3, f.ang - .8, f.ang + .8); g.stroke();
    }
    g.globalAlpha = 1;
  }
  function drawWeather(g, w, vw, vh, t, G) {
    if (w === 'rain') {
      g.fillStyle = 'rgba(30,50,90,.18)'; g.fillRect(0, 0, vw, vh);
      g.strokeStyle = 'rgba(170,200,255,.45)'; g.lineWidth = 1.2; g.beginPath();
      for (let i = 0; i < 160; i++) { const x = (i * 97 + t * 260) % (vw + 40) - 20, y = (i * 53 + t * 900) % (vh + 40) - 20; g.moveTo(x, y); g.lineTo(x - 4, y + 14); }
      g.stroke();
    } else if (w === 'snow') {
      g.fillStyle = 'rgba(220,235,255,.14)'; g.fillRect(0, 0, vw, vh); g.fillStyle = 'rgba(255,255,255,.85)';
      for (let i = 0; i < 140; i++) { const x = (i * 131 + Math.sin(t + i) * 30 + t * 20) % vw, y = (i * 71 + t * 60) % vh; g.fillRect(x, y, 3, 3); }
    } else if (w === 'sand') {
      g.fillStyle = 'rgba(190,150,80,.32)'; g.fillRect(0, 0, vw, vh); g.fillStyle = 'rgba(230,200,140,.6)';
      for (let i = 0; i < 120; i++) { const x = (i * 131 + t * 500) % vw, y = (i * 71 + Math.sin(t * 2 + i) * 20) % vh; g.fillRect(x, y, 6, 1.5); }
    } else if (w === 'sun') {
      const gr = g.createRadialGradient(vw * .85, -50, 20, vw * .85, -50, vw * .9);
      gr.addColorStop(0, 'rgba(255,230,150,.35)'); gr.addColorStop(1, 'rgba(255,200,80,0)'); g.fillStyle = gr; g.fillRect(0, 0, vw, vh);
    } else if (w === 'smog') {
      g.fillStyle = 'rgba(120,80,140,.2)'; g.fillRect(0, 0, vw, vh);
      for (let i = 0; i < 9; i++) { const x = (i * 211 + t * 15) % (vw + 300) - 150, y = (i * 137 + Math.sin(t * .5 + i) * 40) % vh;
        const gr = g.createRadialGradient(x, y, 10, x, y, 160); gr.addColorStop(0, 'rgba(150,110,170,.25)'); gr.addColorStop(1, 'rgba(150,110,170,0)'); g.fillStyle = gr; g.fillRect(x - 160, y - 160, 320, 320); }
    }
    // Danger vignette.
    const p = G.player, low = Math.min(p.hp / p.maxHp, G.hunger / 100);
    if (low < .3 && !p.dead) {
      const a = (.3 - low) * 1.6 * (.7 + .3 * Math.sin(t * 6));
      const gr = g.createRadialGradient(vw / 2, vh / 2, vh * .3, vw / 2, vh / 2, vh * .8);
      gr.addColorStop(0, 'rgba(160,0,0,0)'); gr.addColorStop(1, `rgba(160,0,0,${a})`); g.fillStyle = gr; g.fillRect(0, 0, vw, vh);
    }
  }

  function makeFx(G) {
    return {
      burst(x, y, color, n) { for (let i = 0; i < n; i++) { const a = Math.random() * 7, s = U.rand(40, 180); G.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: .5, max: .5, color, size: U.rand(2, 5) }); } },
      ring(x, y, r, color) { G.fxList.push({ kind: 'ring', x, y, r, color, life: .45, max: .45 }); },
      slash(c, ang, mv) { G.fxList.push({ kind: 'slash', x: c.x, y: c.y, r: c.radius + mv.range * .7, ang, color: T.TYPE_COLORS[mv.type], life: .18, max: .18 }); },
      hit(b, mv, eff) { this.burst(b.x, b.y, T.TYPE_COLORS[mv.type], eff > 1 ? 14 : 7); if (eff > 1) G.shake(3); },
      cast(c, mv) { if (mv.shape === 'self') this.ring(c.x, c.y, 40, T.TYPE_COLORS[mv.type]); },
      alert(c) { c.alertT = 1.2; }
    };
  }

  T.Game = Game;
})(window.TJP);
