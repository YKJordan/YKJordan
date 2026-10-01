// Real-time Pokémon combat: the damage formula, STAB, the type chart, crits, abilities, items, status.
window.TJP = window.TJP || {};
(function (T) {
  const U = T.U;
  const C = {};

  // Who may `a` hurt?
  C.isFoe = function (a, b) {
    if (!a || !b || a === b || b.dead || b.faction === 'mate') return false;
    if (a.faction === 'player') return b.faction !== 'player';
    return b.faction === 'player' || a.ai.target === b || b.ai.target === a;
  };

  C.cooldownMult = function (c) {
    let m = 1;
    if (c.heldItem === 'quick_claw') m *= .8;
    if (c.heldItem === 'choice_band' || c.heldItem === 'choice_specs') m *= 1.3;
    if (c.status === 'par') m *= 1.25;
    if (c.pressured > 0) m *= 1.25;
    return m;
  };

  // Try to use move in slot. Returns true if it fired.
  C.useMove = function (G, c, slot) {
    const id = c.moves[slot];
    if (!id || c.cooldowns[slot] > 0 || !c.canAct() || c.dash) return false;
    const mv = T.MOVES[id];
    if (c.status === 'par' && Math.random() < .12) {
      c.cooldowns[slot] = .6;
      G.floatText(c.x, c.y - c.size * 2, 'Paralyzed!', '#f7d02c');
      return false;
    }
    c.cooldowns[slot] = mv.cd * C.cooldownMult(c);
    c.lastMoveT = G.time;
    const aim = c.dir;
    G.fx.cast(c, mv);
    switch (mv.shape) {
      case 'melee': {
        for (const o of G.creatures) {
          if (!C.isFoe(c, o)) continue;
          const d = U.dist(c, o);
          if (d > mv.range + c.radius + o.radius) continue;
          if (Math.abs(U.angDiff(aim, U.angle(c, o))) > 1.25 && d > c.radius + o.radius + 4) continue;
          C.hit(G, c, o, mv);
        }
        G.fx.slash(c, aim, mv);
        break;
      }
      case 'proj': {
        const sp = mv.speed;
        G.projectiles.push({ x: c.x + Math.cos(aim) * c.radius, y: c.y + Math.sin(aim) * c.radius,
          vx: Math.cos(aim) * sp, vy: Math.sin(aim) * sp, owner: c, move: mv, life: mv.range / sp, r: mv.radius,
          homing: mv.homing ? (c.faction === 'player' ? G.autoTarget(c, 1.2, 420) : c.ai.target) : null });
        break;
      }
      case 'aoe': {
        for (const o of G.creatures) if (C.isFoe(c, o) && U.dist(c, o) < mv.range + o.radius) C.hit(G, c, o, mv);
        G.fx.ring(c.x, c.y, mv.range, T.TYPE_COLORS[mv.type]);
        if (mv.type === 'ground') G.shake(6);
        break;
      }
      case 'dash': {
        const dur = .2;
        c.dash = { t: dur, vx: Math.cos(aim) * mv.range / dur, vy: Math.sin(aim) * mv.range / dur, move: mv, hit: new Set() };
        c.iframes = Math.max(c.iframes, .12);
        break;
      }
      case 'self': {
        if (mv.self) { c.addStages(mv.self); G.floatText(c.x, c.y - c.size * 2, Object.keys(mv.self).map(k => T.STAT_LABEL[k] + ' ↑').join(' '), '#9be564'); }
        if (mv.heal) { c.heal(c.maxHp * mv.heal); G.floatText(c.x, c.y - c.size * 2, 'Recovered!', '#9be564'); }
        if (mv.teleport) {
          for (let i = 0; i < 20; i++) {
            const nx = c.x + U.rand(-260, 260), ny = c.y + U.rand(-260, 260);
            if (!G.map.collides(nx, ny, c.radius, c)) { G.fx.ring(c.x, c.y, 30, '#f95587'); c.x = nx; c.y = ny; break; }
          }
          if (c.ai) { c.ai.noticed = false; c.ai.aware = 0; }
        }
        break;
      }
    }
    return true;
  };

  C.critChance = function (a, mv, ambush) {
    if (ambush) return 1;
    let st = (mv.crit || 0) + (a.stages.crit || 0);
    if (a.heldItem === 'scope_lens') st++;
    if (a.ability === 'super_luck') st++;
    return [1 / 24, 1 / 8, 1 / 2, 1][Math.min(3, st)];
  };

  // Apply move `mv` from a to b.
  C.hit = function (G, a, b, mv, opts) {
    opts = opts || {};
    if (b.dead || b.iframes > 0) return null;
    const inverse = G.mods.inverse;
    const wa = G.weatherFor(a), wb = G.weatherFor(b);
    const ambush = a.faction === 'player' && b.faction !== 'player' && !b.ai.noticed && mv.power > 0;
    // Evasion abilities.
    if ((b.ability === 'sand_veil' && wb === 'sand') || (b.ability === 'snow_cloak' && wb === 'snow')) {
      if (Math.random() < .2) { G.floatText(b.x, b.y - b.size * 2, 'Evaded!', '#ddd'); return null; }
    }
    // Ability immunities.
    const ab = b.ability;
    if (ab === 'levitate' && mv.type === 'ground') return C.immune(G, b, 'Levitate');
    if (ab === 'flash_fire' && mv.type === 'fire') { b.flashFire = true; return C.immune(G, b, 'Flash Fire'); }
    if (ab === 'volt_absorb' && mv.type === 'electric') { b.heal(b.maxHp * .25); return C.immune(G, b, 'Volt Absorb'); }
    if (ab === 'water_absorb' && mv.type === 'water') { b.heal(b.maxHp * .25); return C.immune(G, b, 'Water Absorb'); }
    if (ab === 'sap_sipper' && mv.type === 'grass') { b.addStages({ atk: 1 }); return C.immune(G, b, 'Sap Sipper'); }

    const eff = T.typeEffect(mv.type, b.types, inverse);
    if (eff === 0) { G.floatText(b.x, b.y - b.size * 2, 'No effect', '#aaa'); C.aggro(G, a, b); return null; }

    let dmg = 0, crit = false;
    if (mv.power > 0) {
      const phys = mv.cat === 'physical';
      let A = phys ? a.stat('atk') : a.stat('spa');
      const D = phys ? b.stat('def') : b.stat('spd');
      if (phys && a.status === 'brn' && a.ability !== 'guts') A *= .5;
      let power = mv.power;
      if (a.ability === 'technician' && power <= 60) power *= 1.5;
      let mod = 1;
      const stab = a.types.includes(mv.type) ? (a.ability === 'adaptability' ? 2 : 1.5) : 1;
      mod *= stab * eff;
      crit = Math.random() < C.critChance(a, mv, ambush);
      if (crit) mod *= ambush ? 2.25 : 1.5;
      mod *= U.rand(.85, 1);
      const w = (a.ability === 'cloud_nine' || b.ability === 'cloud_nine') ? 'clear' : wa;
      if (w === 'sun') { if (mv.type === 'fire') mod *= 1.5; if (mv.type === 'water') mod *= .5; }
      if (w === 'rain') { if (mv.type === 'water') mod *= 1.5; if (mv.type === 'fire') mod *= .5; }
      if (a.hp < a.maxHp / 3) {
        const pinch = { overgrow: 'grass', blaze: 'fire', torrent: 'water', swarm: 'bug' }[a.ability];
        if (pinch === mv.type) mod *= 1.5;
      }
      if (a.flashFire && mv.type === 'fire') mod *= 1.5;
      if (a.ability === 'rivalry' && a.sp.root === b.sp.root) mod *= 1.25;
      if (b.ability === 'thick_fat' && (mv.type === 'fire' || mv.type === 'ice')) mod *= .5;
      const item = a.heldItem;
      if (item === 'choice_band' && phys) mod *= 1.5;
      if (item === 'choice_specs' && !phys) mod *= 1.5;
      if (item === 'life_orb') mod *= 1.3;
      if (item === 'muscle_band' && (mv.shape === 'melee' || mv.shape === 'dash')) mod *= 1.2;
      // Difficulty: wild hits on the player's side are softened a little.
      if (a.faction !== 'player' && b.faction === 'player') mod *= G.mods.wildDamage;
      dmg = Math.max(1, Math.floor(((2 * a.level / 5 + 2) * power * A / D / 50 + 2) * mod));
      // Ambush takedown: Tokyo Jungle's kill move.
      let takedown = false;
      if (ambush && b.level <= a.level + 3 && !b.isAlpha && (b.hp - dmg) / b.maxHp < .4) { dmg = b.hp; takedown = true; }
      // Sturdy / Focus Sash.
      if (dmg >= b.hp && b.hp >= b.maxHp * (b.hpCap || 1) - .5) {
        if (b.ability === 'sturdy' && !b.sturdyUsed) { dmg = b.hp - 1; b.sturdyUsed = true; G.floatText(b.x, b.y - b.size * 2.4, 'Sturdy!', '#fff'); }
        else if (b.heldItem === 'focus_sash' && !b.sashUsed) { dmg = b.hp - 1; b.sashUsed = true; G.floatText(b.x, b.y - b.size * 2.4, 'Focus Sash!', '#fff'); }
      }
      b.hp -= dmg;
      b.flash = .15;
      G.fx.hit(b, mv, eff, crit);
      G.damageText(b, dmg, eff, crit, takedown ? 'Takedown!' : ambush ? 'Ambush!' : null);
      if (ambush) G.emit('ambush', { by: a, target: b });
      if (eff > 1 && a.faction === 'player') G.emit('super', { by: a, target: b });
      // Knockback.
      const ang = U.angle(a, b), kb = Math.min(260, 40 + power * 1.2) * (b.isAlpha ? .3 : 1);
      b.kx = (b.kx || 0) + Math.cos(ang) * kb; b.ky = (b.ky || 0) + Math.sin(ang) * kb;
      // Drain / recoil / items.
      if (mv.drain) a.heal(dmg * mv.drain * (a.heldItem === 'big_root' ? 1.3 : 1));
      if (mv.recoil) a.hp -= Math.max(1, Math.floor(dmg * mv.recoil));
      if (item === 'life_orb') a.hp -= Math.max(1, Math.floor(dmg * .1));
      if (item === 'shell_bell') a.heal(dmg / 8);
      if (a.hp <= 0 && !a.dead) C.faint(G, a, b);
      // Sleep is lighter in real time.
      if (b.status === 'slp') b.statusT -= .8;
      if (b.status === 'frz' && mv.type === 'fire') b.cureStatus();
      // Contact abilities.
      if (mv.contact && Math.random() < .3) {
        const contact = { static: 'par', flame_body: 'brn', poison_point: 'psn' }[b.ability];
        if (contact && a.setStatus(contact)) G.statusText(a);
        if (b.ability === 'cute_charm' && a.gender !== b.gender) { a.stun = Math.max(a.stun, 1.2); G.floatText(a.x, a.y - a.size * 2, 'Infatuated!', '#f6b6c8'); }
      }
      if (mv.flinch && Math.random() < mv.flinch && b.ability !== 'inner_focus') b.stun = Math.max(b.stun, .45);
    }
    // Secondary effects.
    if (mv.status && Math.random() < mv.chance) {
      if (b.setStatus(mv.status)) {
        G.statusText(b);
        if (b.ability === 'synchronize' && ['brn', 'par', 'psn'].includes(mv.status) && a.setStatus(mv.status)) G.statusText(a);
      }
    }
    if (mv.stat && Math.random() < (mv.statChance || 1)) b.addStages(mv.stat);
    if (mv.self && mv.shape !== 'self' && Math.random() < (mv.selfChance || 1)) a.addStages(mv.self);

    C.aggro(G, a, b);
    if (b.hp <= 0 && !b.dead) C.faint(G, b, a);
    return { dmg, eff, crit };
  };

  C.immune = function (G, b, label) { G.floatText(b.x, b.y - b.size * 2, label + '!', '#9be564'); return null; };

  C.aggro = function (G, a, b) {
    if (b.faction === 'wild' && b.ai.state !== 'sleep_boss') {
      b.ai.noticed = true; b.ai.aware = 1; b.ai.target = a; b.ai.state = b.sp.diet === 'grazer' && !b.isAlpha && b.level < a.level + 3 && Math.random() < .5 ? 'flee' : 'fight';
      b.ai.t = 8;
    }
    if (b.ai.state === 'sleep_boss') { b.ai.state = 'fight'; b.ai.target = a; b.ai.noticed = true; G.toast(`${b.name} woke up!`); }
    if (b.faction === 'player') { b.lastAttacker = a; G.lastHurtT = G.time; }
    if (a.faction === 'player') G.lastPlayerTarget = b;
  };

  C.faint = function (G, victim, killer) {
    victim.dead = true;
    victim.hp = 0;
    G.onFaint(victim, killer);
  };

  // Damage-over-time: status and weather. Called every frame.
  C.tickStatus = function (G, c, dt) {
    if (c.status) {
      c.statusT -= dt;
      c.dotT = (c.dotT || 0) + dt;
      if ((c.status === 'brn' || c.status === 'psn') && c.dotT >= 3) {
        c.dotT = 0;
        if (!(c.status === 'psn' && c.ability === 'toxic_boost')) {
          const frac = c.status === 'psn' ? 1 / 10 : 1 / 14;
          c.hp -= Math.max(1, Math.floor(c.maxHp * frac * (c.faction === 'player' ? .7 : 1)));
          c.flash = .1;
          if (c.hp <= 0) C.faint(G, c, null);
        }
      }
      if (c.ability === 'shed_skin' && Math.random() < dt * .1) c.cureStatus();
      if (c.statusT <= 0) c.cureStatus();
    }
    const w = G.weatherFor(c);
    c.wxT = (c.wxT || 0) + dt;
    if (c.wxT >= 6) {
      c.wxT = 0;
      const ty = c.types, ab = c.ability;
      if (w === 'sand' && !ty.some(t => ['rock', 'ground', 'steel'].includes(t)) && ab !== 'sand_veil' && ab !== 'sand_rush' && ab !== 'sand_stream') { c.hp -= Math.max(1, Math.floor(c.maxHp / 20)); c.flash = .1; }
      if (w === 'snow' && !ty.includes('ice') && ab !== 'snow_cloak' && ab !== 'slush_rush') { c.hp -= Math.max(1, Math.floor(c.maxHp / 20)); c.flash = .1; }
      if (w === 'smog' && c.heldItem !== 'black_sludge' && Math.random() < .35 && c.setStatus('psn')) G.statusText(c);
      if (c.hp <= 0 && !c.dead) C.faint(G, c, null);
    }
    if (c.heldItem === 'leftovers') c.heal(c.maxHp / 16 / 4 * dt);
    if (c.heldItem === 'black_sludge') { if (c.types.includes('poison')) c.heal(c.maxHp / 16 / 4 * dt); else c.hp -= c.maxHp / 16 / 8 * dt; }
    if (c.stageTimer > 0) { c.stageTimer -= dt; if (c.stageTimer <= 0) for (const k in c.stages) c.stages[k] = 0; }
  };

  T.Combat = C;
})(window.TJP);
