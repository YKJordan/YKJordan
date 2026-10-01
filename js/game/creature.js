// A Pokémon living in the jungle: stats, level, moves, status, stat stages.
window.TJP = window.TJP || {};
(function (T) {
  const U = T.U;
  let NEXT_ID = 1;
  const STAGE = s => s >= 0 ? (2 + s) / 2 : 2 / (2 - s);
  T.STAT_KEYS = ['hp','atk','def','spa','spd','spe'];

  class Creature {
    constructor(speciesId, level, o) {
      o = o || {};
      this.id = NEXT_ID++;
      this.species = speciesId;
      this.level = level;
      this.exp = Math.pow(level, 3);
      this.nature = o.nature || U.pick(T.NATURE_NAMES);
      this.ivs = o.ivs || Object.fromEntries(T.STAT_KEYS.map(k => [k, U.randInt(0, 31)]));
      this.evs = o.evs || Object.fromEntries(T.STAT_KEYS.map(k => [k, 0]));
      this.gender = o.gender || (Math.random() < .5 ? 'm' : 'f');
      this.shiny = !!o.shiny;
      this.abilitySlot = o.abilitySlot !== undefined ? o.abilitySlot : (Math.random() < .5 ? 0 : 1);
      this.faction = o.faction || 'wild';
      this.heldItem = o.heldItem || 'none';
      this.x = o.x || 0; this.y = o.y || 0;
      this.vx = 0; this.vy = 0;
      this.facing = 1; this.dir = 0;
      this.stages = { atk:0, def:0, spa:0, spd:0, spe:0, crit:0 };
      this.stageTimer = 0;
      this.status = null; this.statusT = 0;
      this.stun = 0; this.flash = 0; this.iframes = 0;
      this.moving = false; this.animSeed = Math.random() * 10;
      this.dash = null;
      this.dead = false;
      this.hpMult = o.hpMult || (this.faction === 'player' ? 1.5 : 1);
      this.alpha = undefined;
      this.cooldowns = [0, 0, 0, 0];
      this.ai = { state: 'wander', t: 0, aware: 0, noticed: false, target: null, home: null };
      this.flashFire = false;
      this.sashUsed = false; this.sturdyUsed = false;
      this.intimidated = 0;
      this.setSpecies(speciesId, true);
      this.moves = o.moves || T.learnsetUpTo(speciesId, level).slice(-4);
      this.hp = this.maxHp;
    }
    get sp() { return T.SPECIES[this.species]; }
    get types() { return this.sp.types; }
    get ability() { const a = this.sp.abilities; return a[this.abilitySlot] || a[0]; }
    get name() { return this.nickname || this.sp.name; }
    setSpecies(id, initial) {
      const frac = initial ? 1 : this.hp / this.maxHp;
      this.species = id;
      const sp = T.SPECIES[id];
      this.size = sp.size;
      this.radius = Math.max(9, sp.size * .8);
      this.flies = !!sp.flies; this.swims = !!sp.swims; this.phases = !!sp.phases;
      this.levitates = this.ability === 'levitate';
      this.recalc();
      if (!initial) this.hp = Math.max(1, Math.round(this.maxHp * frac));
    }
    rawStat(k) {
      const B = this.sp.base[k], I = this.ivs[k], E = Math.floor(this.evs[k] / 4), L = this.level;
      if (k === 'hp') return Math.floor((2 * B + I + E) * L / 100) + L + 10;
      return Math.floor((Math.floor((2 * B + I + E) * L / 100) + 5) * T.natureMult(this.nature, k));
    }
    recalc() {
      this.stats = {};
      for (const k of T.STAT_KEYS) this.stats[k] = this.rawStat(k);
      const old = this.maxHp;
      this.maxHp = Math.round(this.stats.hp * 1.6 * this.hpMult);
      if (old && this.hp !== undefined) this.hp = Math.min(this.maxHp, this.hp + Math.max(0, this.maxHp - old));
    }
    // Effective battle stat with stages, weather, items and abilities.
    stat(k) {
      let v = this.stats[k] * STAGE(this.stages[k] || 0);
      const w = T.G ? T.G.weatherFor(this) : 'clear';
      if (k === 'spd' && w === 'sand' && this.types.includes('rock')) v *= 1.5;
      if (k === 'def' && w === 'snow' && this.types.includes('ice')) v *= 1.5;
      if ((k === 'def' || k === 'spd') && this.heldItem === 'everstone' && (this.sp.evo || this.sp.evoWeather)) v *= 1.25;
      if (k === 'atk') {
        if (this.status && this.ability === 'guts') v *= 1.5;
        if (this.status === 'psn' && this.ability === 'toxic_boost') v *= 1.5;
        if (this.intimidated > 0) v *= .67;
      }
      return Math.max(1, v);
    }
    moveSpeed() {
      let s = 95 + this.sp.base.spe * .75 * T.natureMult(this.nature, 'spe');
      if (this.sp.diet === 'grazer') s *= 1.08;
      s *= Math.sqrt(STAGE(this.stages.spe));
      const w = T.G ? T.G.weatherFor(this) : 'clear', a = this.ability;
      if ((a === 'chlorophyll' && w === 'sun') || (a === 'swift_swim' && w === 'rain') || (a === 'sand_rush' && w === 'sand') || (a === 'slush_rush' && w === 'snow')) s *= 1.35;
      if (this.status && a === 'quick_feet') s *= 1.4;
      else if (this.status === 'par') s *= .6;
      if (T.G) {
        const t = T.G.map.tileAtPx(this.x, this.y);
        if (!this.flies && !this.phases) {
          if (t === T.TL.RUBBLE) s *= .85;
          if (t === T.TL.TALL) s *= .92;
          if (t === T.TL.WATER) s *= this.swims ? 1.25 : .8;
          if (this.sp.aquatic && t !== T.TL.WATER) s *= .35;
        }
      }
      return s;
    }
    canAct() { return !this.dead && this.stun <= 0 && this.status !== 'slp' && this.status !== 'frz'; }
    setStatus(kind, dur) {
      if (this.status || this.dead) return false;
      const ty = this.types;
      if (kind === 'brn' && ty.includes('fire')) return false;
      if (kind === 'par' && ty.includes('electric')) return false;
      if (kind === 'psn' && (ty.includes('poison') || ty.includes('steel') || this.ability === 'immunity')) return false;
      if (kind === 'frz' && ty.includes('ice')) return false;
      this.status = kind;
      this.statusT = dur || (kind === 'slp' ? U.rand(3, 5) : kind === 'frz' ? U.rand(2.5, 4) : 30);
      if (kind === 'slp' && this.ability === 'early_bird') this.statusT /= 2;
      return true;
    }
    cureStatus() { this.status = null; this.statusT = 0; }
    addStages(obj) {
      for (const k in obj) this.stages[k] = U.clamp((this.stages[k] || 0) + obj[k], -6, 6);
      this.stageTimer = 20;
    }
    heal(n) { this.hp = Math.min(this.maxHp * (this.hpCap || 1), this.hp + n); }
    expToNext() { return Math.pow(this.level + 1, 3); }
    expYield() { return Math.round(this.sp.bst / 5); }
    // Returns list of events: {type:'level'|'move'|'evolve', ...}
    gainExp(n) {
      const out = [];
      if (this.level >= 100) return out;
      this.exp += n;
      while (this.level < 100 && this.exp >= this.expToNext()) {
        this.level++;
        this.recalc();
        this.hp = Math.min(this.maxHp, this.hp + Math.round(this.maxHp * .15));
        out.push({ type: 'level', level: this.level });
        for (const m of T.movesLearnedAt(this.species, this.level)) if (!this.moves.includes(m)) out.push({ type: 'move', move: m });
      }
      return out;
    }
    evolutionTarget(weather) {
      if (this.heldItem === 'everstone') return null;
      const sp = this.sp;
      if (sp.evo && this.level >= sp.evo.level) return sp.evo.to;
      if (sp.evoWeather && this.level >= sp.evoWeather.level) return sp.evoWeather[weather] || sp.evoWeather.clear;
      return null;
    }
    learnMove(m, replaceSlot) {
      if (this.moves.includes(m)) return;
      if (this.moves.length < 4) this.moves.push(m);
      else if (replaceSlot !== undefined && replaceSlot >= 0) { this.moves[replaceSlot] = m; this.cooldowns[replaceSlot] = 0; }
    }
  }
  T.Creature = Creature;
  T.STAGE = STAGE;
})(window.TJP);
