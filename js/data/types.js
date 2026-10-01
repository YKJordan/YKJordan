// Pokémon type chart (Gen 6+). TJP.typeEffect(atk, [def...], inverse) -> multiplier.
window.TJP = window.TJP || {};
(function (T) {
  const TYPES = ['normal','fire','water','electric','grass','ice','fighting','poison','ground',
    'flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'];

  const COLORS = {
    normal:'#A8A77A', fire:'#EE8130', water:'#6390F0', electric:'#F7D02C', grass:'#7AC74C',
    ice:'#96D9D6', fighting:'#C22E28', poison:'#A33EA1', ground:'#E2BF65', flying:'#A98FF3',
    psychic:'#F95587', bug:'#A6B91A', rock:'#B6A136', ghost:'#735797', dragon:'#6F35FC',
    dark:'#705746', steel:'#B7B7CE', fairy:'#D685AD'
  };

  // attacker -> { defender: multiplier } (only non-1 entries)
  const CHART = {
    normal:   { rock:.5, ghost:0, steel:.5 },
    fire:     { fire:.5, water:.5, grass:2, ice:2, bug:2, rock:.5, dragon:.5, steel:2 },
    water:    { fire:2, water:.5, grass:.5, ground:2, rock:2, dragon:.5 },
    electric: { water:2, electric:.5, grass:.5, ground:0, flying:2, dragon:.5 },
    grass:    { fire:.5, water:2, grass:.5, poison:.5, ground:2, flying:.5, bug:.5, rock:2, dragon:.5, steel:.5 },
    ice:      { fire:.5, water:.5, grass:2, ice:.5, ground:2, flying:2, dragon:2, steel:.5 },
    fighting: { normal:2, ice:2, poison:.5, flying:.5, psychic:.5, bug:.5, rock:2, ghost:0, dark:2, steel:2, fairy:.5 },
    poison:   { grass:2, poison:.5, ground:.5, rock:.5, ghost:.5, steel:0, fairy:2 },
    ground:   { fire:2, electric:2, grass:.5, poison:2, flying:0, bug:.5, rock:2, steel:2 },
    flying:   { electric:.5, grass:2, fighting:2, bug:2, rock:.5, steel:.5 },
    psychic:  { fighting:2, poison:2, psychic:.5, dark:0, steel:.5 },
    bug:      { fire:.5, grass:2, fighting:.5, poison:.5, flying:.5, psychic:2, ghost:.5, dark:2, steel:.5, fairy:.5 },
    rock:     { fire:2, ice:2, fighting:.5, ground:.5, flying:2, bug:2, steel:.5 },
    ghost:    { normal:0, psychic:2, ghost:2, dark:.5 },
    dragon:   { dragon:2, steel:.5, fairy:0 },
    dark:     { fighting:.5, psychic:2, ghost:2, dark:.5, fairy:.5 },
    steel:    { fire:.5, water:.5, electric:.5, ice:2, rock:2, steel:.5, fairy:2 },
    fairy:    { fire:.5, fighting:2, poison:.5, dragon:2, dark:2, steel:.5 }
  };

  function single(atk, def, inverse) {
    const m = (CHART[atk] && CHART[atk][def] !== undefined) ? CHART[atk][def] : 1;
    if (!inverse) return m;
    // Inverse Battle: weaknesses and resistances swap, immunities become resistances.
    if (m === 0) return 2;
    if (m === .5) return 2;
    if (m === 2) return .5;
    return 1;
  }

  T.TYPES = TYPES;
  T.TYPE_COLORS = COLORS;
  T.TYPE_CHART = CHART;
  T.typeEffect = function (atk, defTypes, inverse) {
    let m = 1;
    for (const d of defTypes) m *= single(atk, d, inverse);
    return m;
  };
})(window.TJP);
