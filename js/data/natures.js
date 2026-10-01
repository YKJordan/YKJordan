// The 25 natures: +10% to one stat, -10% to another (neutral when they match).
window.TJP = window.TJP || {};
(function (T) {
  // Standard nature table, rows = raised stat, columns = lowered stat.
  const AXIS = ['atk','def','spe','spa','spd'];
  const TABLE = [
    ['Hardy','Lonely','Brave','Adamant','Naughty'],
    ['Bold','Docile','Relaxed','Impish','Lax'],
    ['Timid','Hasty','Serious','Jolly','Naive'],
    ['Modest','Mild','Quiet','Bashful','Rash'],
    ['Calm','Gentle','Sassy','Careful','Quirky']
  ];
  const NATURES = {};
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
    const name = TABLE[r][c];
    NATURES[name] = r === c ? { name, up: null, down: null } : { name, up: AXIS[r], down: AXIS[c] };
  }
  T.NATURES = NATURES;
  T.NATURE_NAMES = Object.keys(NATURES);
  T.natureMult = function (nature, stat) {
    const n = NATURES[nature];
    if (!n || !n.up) return 1;
    if (n.up === stat) return 1.1;
    if (n.down === stat) return 0.9;
    return 1;
  };
  T.STAT_LABEL = { hp:'HP', atk:'Attack', def:'Defense', spa:'Sp. Atk', spd:'Sp. Def', spe:'Speed' };
})(window.TJP);
