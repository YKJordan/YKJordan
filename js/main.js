// Boot, main loop, global key handling.
window.TJP = window.TJP || {};
(function (T) {
  const cv = document.getElementById('game');
  const g = cv.getContext('2d');
  let last = performance.now(), running = false;

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.floor(innerWidth * dpr); cv.height = Math.floor(innerHeight * dpr);
    cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener('resize', resize); resize();

  T.startRun = function (cfg) {
    for (const el of document.querySelectorAll('.screen')) el.classList.add('hidden');
    document.getElementById('modal').classList.add('hidden');
    const G = new T.Game(cfg);
    G.initialPopulation();
    running = true;
    last = performance.now();
    return G;
  };

  addEventListener('keydown', e => {
    const G = T.G;
    if (!G || !running) return;
    if (G.modal) { if (T.Menus.modalKey(e.code)) e.preventDefault(); return; }
    if (G.over) return;
    if (e.code === 'Escape' || e.code === 'KeyP') { T.Menus.pause(!G.paused); return; }
    if (e.code === 'KeyM' || e.code === 'Tab') G.showMap = !G.showMap;
  });

  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (running && T.G) {
      if (!T.G.showMap) T.G.update(dt);
      T.G.render(g, innerWidth, innerHeight);
      if (T.G.over) running = false;
    }
    T.Input.endFrame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Wire up menus.
  const on = (id, fn) => document.getElementById(id).addEventListener('click', fn);
  on('btn-play', () => T.Menus.startSetup());
  on('btn-dex', () => { document.getElementById('dex-screen').classList.remove('hidden'); T.Menus.dex(document.getElementById('dex-body')); });
  on('btn-help', () => { document.getElementById('help-screen').classList.remove('hidden'); });
  on('btn-reset', () => { if (confirm('Erase all unlocks and records?')) { T.Save.reset(); T.Menus.title(); } });
  on('setup-next', () => T.Menus.next());
  on('setup-back', () => T.Menus.back());
  on('go-retry', () => T.Menus.retry());
  on('go-title', () => { T.G = null; T.Menus.title(); });
  on('pause-resume', () => T.Menus.pause(false));
  on('pause-quit', () => { T.Menus.pause(false); T.G.gameOver('retired from the jungle'); });
  for (const b of document.querySelectorAll('[data-close]')) b.addEventListener('click', () => b.closest('.screen').classList.add('hidden'));
  for (const b of document.querySelectorAll('#pause .tabs button')) b.addEventListener('click', () => T.Menus.pauseTab(b.dataset.tab));

  T.Sprites.load(Object.keys(T.SPECIES));
  T.Menus.title();
  // Test hook: ?autostart=growlithe starts a run immediately.
  const q = new URLSearchParams(location.search);
  if (q.get('autostart')) T.startRun({ species: q.get('autostart'), nature: 'random', item: q.get('item') || 'none', seed: Number(q.get('seed')) || 1234, mods: {} });
})(window.TJP);
