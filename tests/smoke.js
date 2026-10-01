// Headless smoke test. Run: NODE_PATH=$(npm root -g) node tests/smoke.js [outdir]
const { chromium } = require('playwright');
const path = require('path');
const out = process.argv[2] || path.join(__dirname, 'out');
require('fs').mkdirSync(out, { recursive: true });
const url = 'file://' + path.join(__dirname, '..', 'index.html');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 860 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + '\n' + e.stack));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  // 1. Title and setup wizard.
  await page.goto(url);
  await page.screenshot({ path: path.join(out, '01-title.png') });
  await page.click('#btn-play');
  await page.screenshot({ path: path.join(out, '02-setup-species.png') });
  for (let i = 0; i < 3; i++) { await page.click('#setup-next'); await sleep(100); }
  await page.screenshot({ path: path.join(out, '03-setup-mods.png') });
  await page.click('#setup-next');
  await sleep(1500);

  // 2. Play: move, sprint, stealth, attack.
  const kb = page.keyboard;
  await kb.down('KeyD'); await sleep(800); await kb.down('ShiftLeft'); await sleep(700); await kb.up('ShiftLeft'); await kb.up('KeyD');
  await kb.press('KeyC'); await kb.down('KeyS'); await sleep(600); await kb.up('KeyS'); await kb.press('KeyC');
  for (let i = 0; i < 6; i++) { await kb.press('KeyJ'); await sleep(250); await kb.press('KeyK'); await sleep(250); }
  await kb.press('Space'); await sleep(300);
  await page.screenshot({ path: path.join(out, '04-play.png') });

  // 3. Fight: drop the player next to a wild Pokémon and fight it.
  const fight = await page.evaluate(async () => {
    const G = window.TJP.G, p = G.player;
    const w = G.creatures.find(c => c.faction === 'wild' && !c.isAlpha);
    if (!w) return 'no wild';
    p.x = w.x - 40; p.y = w.y;
    if (G.map.collides(p.x, p.y, p.radius, p)) { w.x = p.x + 40; w.y = p.y; }
    p.dir = 0; p.facing = 1;
    return { wild: w.name, lvl: w.level };
  });
  for (let i = 0; i < 20; i++) { await kb.press('KeyJ'); await sleep(200); await kb.press('KeyK'); await sleep(200); }
  await page.screenshot({ path: path.join(out, '05-fight.png') });
  const afterFight = await page.evaluate(() => { const G = window.TJP.G; return { kos: G.kos, carcasses: G.carcasses.length, hp: G.player.hp, lvl: G.player.level, modal: !!G.modal }; });

  // 4. Exercise systems: eating, level up + evolution, years and weather, territory, mating.
  const sys = await page.evaluate(async () => {
    const T = window.TJP, G = T.G, res = {};
    G.player.hpMult = 50; G.player.recalc(); G.player.hp = G.player.maxHp;
    while (G.modal) T.Menus.chooseModal(G.modal.options[0]);
    G.carcasses.push({ x: G.player.x + 10, y: G.player.y, kcal: 300, name: 'Test', t: 30, size: 14 });
    G.eat(300, 40, false); res.kcal = G.kcalGen;
    G.giveExp(G.player, 30000);
    for (let i = 0; i < 40 && (G.pending.length || G.modal); i++) { G.update(1 / 60); if (G.modal) T.Menus.chooseModal(G.modal.options[0]); }
    res.level = G.player.level; res.species = G.player.species; res.moves = G.player.moves.slice();
    G.yearLen = 2;
    for (let i = 0; i < 300; i++) { G.player.hp = G.player.maxHp; G.update(1 / 30); while (G.modal) T.Menus.chooseModal(G.modal.options[G.modal.options.length - 1]); }
    res.year = G.year; res.weather = G.weather; res.age = G.age.toFixed(2);
    G.yearLen = 75;
    // Claim Shibuya.
    for (const m of G.map.markers.filter(m => m.district === 'shibuya')) G.claimMarker(m);
    res.claimed = G.districtState.shibuya.claimed;
    res.mates = G.mates.length;
    G.kcalGen = 5000;
    const mate = G.mates[0];
    mate.following = true;
    const nest = G.map.nests.find(n => n.district === 'shibuya');
    G.raiseFamily(mate, nest);
    for (let i = 0; i < 200 && (G.modal || G.pending.length); i++) { G.update(1 / 60); if (G.modal) T.Menus.chooseModal(G.modal.options[0]); }
    res.over = G.over;
    res.generation = G.generation; res.heir = G.player.species + ' Lv' + G.player.level; res.pack = G.allies().length;
    res.creatures = G.creatures.length;
    return res;
  });
  await sleep(1500);
  await page.screenshot({ path: path.join(out, '06-generation.png') });

  // 5. Map, pause tabs, other species and weathers.
  await kb.press('KeyM'); await sleep(200); await page.screenshot({ path: path.join(out, '07-map.png') }); await kb.press('KeyM');
  await kb.press('Escape'); await sleep(200); await page.screenshot({ path: path.join(out, '08-pause.png') });
  for (const tab of ['types', 'dex', 'help', 'status']) await page.click(`#pause .tabs button[data-tab="${tab}"]`);
  await kb.press('Escape');
  const wx = await page.evaluate(async () => {
    const T = window.TJP, G = T.G; const seen = [];
    for (const w of ['rain', 'sun', 'sand', 'snow', 'smog']) { G.weather = w; for (let i = 0; i < 120; i++) G.update(1 / 30); while (G.modal) T.Menus.chooseModal(G.modal.options[0]); seen.push(w); }
    return seen;
  });
  await page.screenshot({ path: path.join(out, '09-smog.png') });

  // 6. Alpha + every species' art and a brawl with each move.
  const brawl = await page.evaluate(async () => {
    const T = window.TJP, G = T.G, p = G.player;
    G.weather = 'clear';
    p.hp = p.maxHp = 99999;
    let used = 0;
    for (const id of Object.keys(T.SPECIES)) {
      const c = new T.Creature(id, 40, { x: p.x + 60, y: p.y });
      G.creatures.push(c);
      c.ai.state = 'fight'; c.ai.target = p; c.ai.noticed = true;
      for (let s = 0; s < c.moves.length; s++) { c.cooldowns[s] = 0; c.dir = Math.PI; if (T.Combat.useMove(G, c, s)) used++; }
      for (let i = 0; i < 10; i++) G.update(1 / 30);
      c.removed = true;
      while (G.modal) T.Menus.chooseModal(G.modal.options[0]);
    }
    // Every move from the player.
    for (const m of Object.keys(T.MOVES)) {
      p.moves = [m]; p.cooldowns = [0, 0, 0, 0];
      const t = new T.Creature('rattata', 30, { x: p.x + 30, y: p.y }); G.creatures.push(t);
      p.dir = 0; T.Combat.useMove(G, p, 0);
      for (let i = 0; i < 8; i++) G.update(1 / 30);
      while (G.modal) T.Menus.chooseModal(G.modal.options[0]);
    }
    return { used, creatures: G.creatures.length };
  });
  await page.screenshot({ path: path.join(out, '10-brawl.png') });

  // 7. Death → game over.
  await page.evaluate(() => { const G = window.TJP.G; for (const a of G.allies()) a.removed = true; G.update(1 / 60); G.player.hp = 0; G.player.maxHp = 100; G.update(1 / 60); });
  await sleep(400);
  await page.screenshot({ path: path.join(out, '11-gameover.png') });
  const over = await page.evaluate(() => ({ over: window.TJP.G.over, summary: window.TJP.G.summary }));

  // 8. Frame time with a busy screen.
  await page.click('#go-retry'); await sleep(500);
  const perf = await page.evaluate(async () => {
    const G = window.TJP.G; for (let i = 0; i < 30; i++) G.spawnWild(false);
    const t0 = performance.now(); let frames = 0;
    await new Promise(r => { const f = () => { frames++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else r(); }; requestAnimationFrame(f); });
    return { fps: Math.round(frames / 2), creatures: G.creatures.length };
  });

  console.log(JSON.stringify({ fight, afterFight, sys, wx, brawl, over, perf }, null, 1));
  if (errors.length) { console.error('ERRORS:\n' + errors.slice(0, 10).join('\n')); process.exitCode = 1; }
  else console.log('smoke OK');
  await browser.close();
})();
