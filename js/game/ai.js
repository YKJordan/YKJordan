// Wild behaviour: wander, graze, notice (stealth), hunt, flee, fight. Plus pack allies and mates.
window.TJP = window.TJP || {};
(function (T) {
  const U = T.U, C = () => T.Combat;
  const AI = {};

  // How far away can `c` notice the player?
  AI.detectRange = function (G, c, p) {
    let r = 240 * (c.isAlpha ? 1.3 : 1);
    const w = G.weather;
    if (w === 'sand') r *= .6;
    if (w === 'rain') r *= .8;
    const tile = G.map.tileAtPx(p.x, p.y);
    const inGrass = tile === T.TL.TALL;
    if (p.crouching) r *= inGrass ? (c.ability === 'keen_eye' ? .6 : .28) : .55;
    else if (inGrass) r *= .75;
    if (p.sprinting) r *= 1.45;
    if (p.heldItem === 'smoke_ball') r *= .5;
    // Facing away: a blind spot behind.
    const facingAng = c.facing > 0 ? 0 : Math.PI;
    if (Math.abs(U.angDiff(c.dir !== undefined ? c.dir : facingAng, U.angle(c, p))) > 1.9) r *= .5;
    if (c.status === 'slp' || c.ai.state === 'sleep_boss') r *= .15;
    return r;
  };

  function steerTo(G, c, tx, ty, speedMul) {
    const a = Math.atan2(ty - c.y, tx - c.x);
    const s = c.moveSpeed() * (speedMul || 1);
    c.vx = Math.cos(a) * s; c.vy = Math.sin(a) * s;
    c.dir = a;
  }
  function stop(c) { c.vx = 0; c.vy = 0; }

  function pickMove(G, c, target, dist) {
    let best = -1, bestScore = 0;
    c.moves.forEach((id, i) => {
      if (c.cooldowns[i] > 0) return;
      const mv = T.MOVES[id];
      let inRange;
      if (mv.shape === 'melee') inRange = dist < mv.range + c.radius + target.radius;
      else if (mv.shape === 'aoe') inRange = dist < mv.range * .9;
      else if (mv.shape === 'dash') inRange = dist < mv.range * .9 && dist > 40;
      else if (mv.shape === 'proj') inRange = dist < mv.range * .9;
      else inRange = true;
      if (!inRange) return;
      let score;
      if (mv.power > 0) {
        const eff = T.typeEffect(mv.type, target.types, G.mods.inverse);
        const stab = c.types.includes(mv.type) ? 1.5 : 1;
        score = mv.power * eff * stab;
      } else if (mv.self) score = c.stageTimer > 0 ? 0 : 50;
      else if (mv.heal) score = c.hp < c.maxHp * .45 ? 200 : 0;
      else if (mv.teleport) score = c.hp < c.maxHp * .6 ? 150 : 0;
      else score = target.status ? 0 : 40;
      score *= U.rand(.7, 1.3);
      if (score > bestScore) { bestScore = score; best = i; }
    });
    return best;
  }
  function preferredRange(c) {
    const ranged = c.moves.filter(id => T.MOVES[id].shape === 'proj').length;
    return ranged >= 2 && c.sp.base.spa > c.sp.base.atk ? 190 : 30;
  }

  function fight(G, c, dt, t) {
    if (!t || t.dead) { c.ai.state = 'wander'; c.ai.target = null; return; }
    // Alphas don't chase you out of their territory.
    if (c.isAlpha && c.ai.home && U.dist(c, c.ai.home) > 720) {
      c.ai.state = 'wander'; c.ai.target = null; c.ai.noticed = false; c.ai.aware = 0; c.ai.dest = { x: c.ai.home.x, y: c.ai.home.y }; c.ai.t = 6;
      return;
    }
    const d = U.dist(c, t);
    const pref = preferredRange(c);
    const aim = U.angle(c, t);
    if (d > pref + c.radius + t.radius + 10) steerTo(G, c, t.x, t.y, c.isAlpha ? 1.15 : 1.2);
    else if (pref > 60 && d < pref * .6) { steerTo(G, c, c.x - (t.x - c.x), c.y - (t.y - c.y), .8); }
    else {
      // Circle-strafe a little.
      const side = (c.id % 2 ? 1 : -1);
      c.vx = Math.cos(aim + Math.PI / 2 * side) * c.moveSpeed() * .35; c.vy = Math.sin(aim + Math.PI / 2 * side) * c.moveSpeed() * .35;
    }
    c.dir = aim;
    c.attackDelay = (c.attackDelay || 0) - dt;
    if (c.attackDelay <= 0) {
      const slot = pickMove(G, c, t, d);
      if (slot >= 0) { C().useMove(G, c, slot); c.attackDelay = c.faction === 'player' ? U.rand(.3, .7) : c.isAlpha ? U.rand(.5, 1.1) : U.rand(.8, 1.6); }
    }
    if (d > 750) { c.ai.state = 'wander'; c.ai.target = null; c.ai.noticed = false; c.ai.aware = 0; }
  }

  AI.update = function (G, c, dt) {
    const ai = c.ai, p = G.player;
    if (!c.canAct()) { stop(c); return; }
    ai.t -= dt;
    ai.think = (ai.think || 0) - dt;

    if (ai.state === 'ally') return AI.ally(G, c, dt);
    if (ai.state === 'mate') return AI.mate(G, c, dt);
    if (ai.state === 'sleep_boss') { stop(c); return; }

    // Perception of the player.
    if (ai.think <= 0 && p && !p.dead) {
      ai.think = .2;
      const d = U.dist(c, p);
      const range = AI.detectRange(G, c, p);
      const sees = d < range && (c.flies || G.map.lineOfSight(c, p));
      ai.aware = U.clamp(ai.aware + (sees ? (d < range * .5 ? 1.2 : .5) : -.15), 0, 1.2);
      if (ai.aware >= 1 && !ai.noticed) { ai.noticed = true; G.fx.alert(c); }
      if (ai.aware <= 0) ai.noticed = false;
      if (ai.noticed && (ai.state === 'wander' || ai.state === 'graze' || ai.state === 'hunt')) {
        AI.reactToPlayer(G, c, p);
      }
      // Wild predators hunt wild prey.
      if (ai.state === 'wander' && c.sp.diet !== 'grazer' && Math.random() < .04) {
        let best = null, bd = 260;
        for (const o of G.nearby(c, 260)) {
          if (o === c || o.faction !== 'wild' || o.dead || o.isAlpha) continue;
          if (o.sp.diet !== 'grazer' || o.level > c.level + 2) continue;
          const od = U.dist(c, o); if (od < bd) { bd = od; best = o; }
        }
        if (best) { ai.state = 'fight'; ai.target = best; ai.t = 10; best.ai.state = 'flee'; best.ai.target = c; best.ai.t = 5; }
      }
    }

    switch (ai.state) {
      case 'wander': case 'graze': {
        if (ai.t <= 0 || !ai.dest) {
          ai.t = U.rand(1.5, 4);
          const home = ai.home || c;
          if (Math.random() < .35) ai.dest = null;
          else ai.dest = { x: home.x + U.rand(-220, 220), y: home.y + U.rand(-220, 220) };
        }
        if (ai.dest && U.dist(c, ai.dest) > 12) steerTo(G, c, ai.dest.x, ai.dest.y, .45);
        else stop(c);
        if (c.isAlpha && ai.home && U.dist(c, ai.home) > 500) ai.dest = { x: ai.home.x, y: ai.home.y };
        break;
      }
      case 'flee': {
        const t = ai.target;
        if (!t || t.dead || ai.t <= 0 || U.dist(c, t) > 520) { ai.state = 'wander'; ai.target = null; break; }
        steerTo(G, c, c.x - (t.x - c.x), c.y - (t.y - c.y), 1.35);
        // Abra-style escape.
        const tp = c.moves.indexOf('teleport');
        if (tp >= 0 && U.dist(c, t) < 120) C().useMove(G, c, tp);
        // Cornered: fight back.
        if (c.stuckT > .6 && U.dist(c, t) < 80) { ai.state = 'fight'; ai.t = 6; }
        break;
      }
      case 'fight': fight(G, c, dt, ai.target); break;
    }
  };

  AI.reactToPlayer = function (G, c, p) {
    const ai = c.ai;
    const pThreat = p.sp.diet !== 'grazer' || p.level > c.level + 4;
    const fight = () => { ai.state = 'fight'; ai.target = p; ai.t = 12; G.emit('hunted', { by: c }); };
    const flee = t => { ai.state = 'flee'; ai.target = p; ai.t = t; };
    if (c.sp.diet === 'grazer' && !c.isAlpha) { if (pThreat || p.level > c.level) flee(5); return; }
    if (G.time < G.graceT) return; // you just woke up: nobody starts a fight yet
    // Alphas defend their own turf only.
    if (c.isAlpha) { if (!ai.home || U.dist(p, ai.home) < 560) { fight(); ai.t = 20; } return; }
    if (G.mods.frenzy) return fight();
    if (p.level > c.level + 6) return flee(4);
    // Predators hunt anything they can take on.
    if (c.sp.diet === 'predator') { if (p.level <= c.level + 2) fight(); return; }
    // Small omnivores scavenge: they only jump the weak and shy away from hunters.
    if (p.level < c.level - 1 || p.hp < p.maxHp * .35) fight();
    else if (p.sp.diet !== 'grazer' && Math.random() < .5) flee(3);
  };

  // Pack member: follow the player, join fights.
  AI.ally = function (G, c, dt) {
    const p = G.player;
    if (!p || p.dead) { stop(c); return; }
    let t = c.ai.target;
    const pt = G.lastPlayerTarget, pa = p.lastAttacker;
    if ((!t || t.dead || U.dist(t, p) > 420) && G.time - (G.lastCombatT || -9) < 6) t = (pt && !pt.dead && U.dist(pt, p) < 380) ? pt : (pa && !pa.dead && U.dist(pa, p) < 380 ? pa : null);
    if (t && (t.dead || U.dist(t, p) > 420)) t = null;
    c.ai.target = t;
    if (t) return fight(G, c, dt, t);
    const d = U.dist(c, p);
    if (d > 520) { // Catch up instantly if left far behind.
      const spot = G.map.findOpenNear(Math.floor(p.x / T.TILE), Math.floor(p.y / T.TILE), 3);
      if (spot) { c.x = (spot.tx + .5) * T.TILE; c.y = (spot.ty + .5) * T.TILE; }
    } else if (d > 80) steerTo(G, c, p.x - Math.cos(p.dir) * 40 + (c.id % 3 - 1) * 30, p.y - Math.sin(p.dir) * 40, d > 200 ? 1.5 : 1.05);
    else stop(c);
    c.crouching = p.crouching;
  };

  // Courted mate: follows to the nest.
  AI.mate = function (G, c, dt) {
    const p = G.player;
    if (!c.following) { stop(c); c.dir = Math.sin(G.time) > 0 ? 0 : Math.PI; return; }
    const d = U.dist(c, p);
    if (d > 600) { c.x = p.x - 30; c.y = p.y; }
    if (d > 60) steerTo(G, c, p.x, p.y, d > 200 ? 1.5 : 1.05); else stop(c);
  };

  T.AI = AI;
})(window.TJP);
