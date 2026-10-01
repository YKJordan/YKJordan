// Persistent progress: unlocked species and items, Pokédex, best runs.
window.TJP = window.TJP || {};
(function (T) {
  const KEY = 'tjp_save_v1';
  const fresh = () => ({ unlocked: T.STARTERS.slice(), items: Object.keys(T.HELD_ITEMS).filter(k => T.HELD_ITEMS[k].starter),
    seen: [], kos: {}, best: {}, runs: 0, beatenBosses: [] });
  let data = fresh();
  try { const raw = localStorage.getItem(KEY); if (raw) data = Object.assign(fresh(), JSON.parse(raw)); } catch (e) { /* private mode */ }
  const write = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* ignore */ } };
  T.Save = {
    get data() { return data; },
    write,
    isUnlocked: id => data.unlocked.includes(id),
    unlock(id) { if (!data.unlocked.includes(id)) { data.unlocked.push(id); write(); return true; } return false; },
    unlockItem(id) { if (!data.items.includes(id)) { data.items.push(id); write(); return true; } return false; },
    see(id) { if (!data.seen.includes(id)) { data.seen.push(id); write(); } },
    // Knocking out 3 of a line unlocks its base form.
    recordKO(speciesId) {
      const root = T.SPECIES[speciesId].root;
      data.kos[root] = (data.kos[root] || 0) + 1;
      write();
      if (data.kos[root] >= 3 && T.PLAYABLE.includes(root)) return T.Save.unlock(root) ? root : null;
      return null;
    },
    recordRun(species, years, score) {
      data.runs++;
      const b = data.best[species];
      if (!b || score > b.score) data.best[species] = { years, score };
      write();
    },
    reset() { data = fresh(); write(); }
  };
})(window.TJP);
