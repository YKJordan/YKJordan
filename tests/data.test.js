// Data integrity checks. Run: node tests/data.test.js
const fs = require('fs'), vm = require('vm'), path = require('path');
const ctx = { window: {}, console, Math };
vm.createContext(ctx);
for (const f of ['core/util.js', 'data/types.js', 'data/natures.js', 'data/moves.js', 'data/abilities.js', 'data/items.js', 'data/species.js', 'data/districts.js', 'data/challenges.js'])
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f });
const T = ctx.window.TJP;
let fails = 0;
const check = (cond, msg) => { if (!cond) { fails++; console.error('FAIL:', msg); } };

check(T.TYPES.length === 18, '18 types');
for (const a of Object.keys(T.TYPE_CHART)) { check(T.TYPES.includes(a), 'chart attacker ' + a); for (const d of Object.keys(T.TYPE_CHART[a])) check(T.TYPES.includes(d), `chart defender ${a}->${d}`); }
check(T.typeEffect('electric', ['water', 'flying']) === 4, 'electric vs water/flying = 4');
check(T.typeEffect('ground', ['flying']) === 0, 'ground vs flying = 0');
check(T.typeEffect('ground', ['flying'], true) === 2, 'inverse: immunity -> 2');
check(T.typeEffect('fire', ['grass'], true) === .5, 'inverse: SE -> 0.5');
check(T.NATURE_NAMES.length === 25, '25 natures');
check(T.NATURES.Adamant.up === 'atk' && T.NATURES.Adamant.down === 'spa', 'Adamant +Atk -SpA');
check(T.NATURES.Timid.up === 'spe' && T.NATURES.Timid.down === 'atk', 'Timid +Spe -Atk');
check(T.NATURES.Modest.up === 'spa' && T.NATURES.Modest.down === 'atk', 'Modest +SpA -Atk');
check(T.NATURES.Jolly.up === 'spe' && T.NATURES.Jolly.down === 'spa', 'Jolly +Spe -SpA');
for (const [id, m] of Object.entries(T.MOVES)) {
  check(T.TYPES.includes(m.type), `move ${id} type`);
  check(['melee', 'proj', 'aoe', 'dash', 'self'].includes(m.shape), `move ${id} shape`);
  check(m.cd > 0, `move ${id} cooldown`);
}
for (const [id, s] of Object.entries(T.SPECIES)) {
  for (const t of s.types) check(T.TYPES.includes(t), `${id} type ${t}`);
  for (const a of s.abilities) check(T.ABILITIES[a], `${id} ability ${a}`);
  check(['grazer', 'predator', 'omnivore'].includes(s.diet), `${id} diet`);
  for (const lv in s.learn) for (const m of s.learn[lv]) check(T.MOVES[m], `${id} learns unknown move ${m}`);
  for (const m of s.eggMoves) check(T.MOVES[m], `${id} egg move ${m}`);
  if (s.evo) check(T.SPECIES[s.evo.to], `${id} evolves into unknown ${s.evo.to}`);
  check(s.art && s.art.body, `${id} has art body`);
  check(T.learnsetUpTo(id, 100).length > 0, `${id} has moves`);
  check(T.SPECIES[s.root], `${id} root`);
}
for (const id of T.PLAYABLE) check(T.learnsetUpTo(id, 5).length >= 1, `${id} has a move at Lv5`);
for (const id of T.STARTERS) check(T.PLAYABLE.includes(id), `starter ${id} playable`);
for (const d of T.DISTRICTS) {
  for (const s of Object.keys(d.spawns)) { check(T.SPECIES[s], `${d.id} spawns unknown ${s}`); check(T.SPECIES[s] && T.SPECIES[s].root === s, `${d.id} spawn ${s} should be a base form`); }
  check(T.SPECIES[d.alpha.species], `${d.id} alpha`);
}
for (const k of Object.keys(T.HELD_ITEMS)) check(T.HELD_ITEMS[k].name, 'item ' + k);
console.log(`${Object.keys(T.SPECIES).length} species, ${Object.keys(T.MOVES).length} moves, ${Object.keys(T.ABILITIES).length} abilities, ${T.PLAYABLE.length} playable`);
if (fails) { console.error(`${fails} failure(s)`); process.exit(1); }
console.log('data OK');
