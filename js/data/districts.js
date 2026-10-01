// Districts of abandoned Tokyo. The map is a 3x2 grid of districts, DISTRICT_TILES tiles each.
window.TJP = window.TJP || {};
(function (T) {
  T.DISTRICT_TILES = 64;
  T.TILE = 32;
  T.DISTRICTS = [
    { id:'shinjuku', name:'Shinjuku', gx:0, gy:0, difficulty:4,
      gen:{ building:.62, ruin:.22, park:.08, water:0, grassOver:.10 },
      tint:'#4a4f5c',
      spawns:{ poochyena:6, rattata:5, sneasel:4, riolu:3, larvitar:3, absol:2, houndour:4, meowth:3, gastly:2 },
      alpha:{ species:'tyranitar', level:8, title:'Shinjuku Tyrant' } },
    { id:'harajuku', name:'Harajuku & Yoyogi Park', gx:1, gy:0, difficulty:1,
      gen:{ building:.25, ruin:.15, park:.55, water:.03, grassOver:.30 },
      tint:'#3f5a3a',
      spawns:{ caterpie:6, oddish:6, deerling:5, skiddo:4, bulbasaur:3, pidgey:5, eevee:3, ekans:3, seviper:2, zangoose:2, clefairy:2 },
      alpha:{ species:'snorlax', level:6, title:'Yoyogi Sleeper' } },
    { id:'akihabara', name:'Akihabara', gx:2, gy:0, difficulty:3,
      gen:{ building:.58, ruin:.25, park:.07, water:0, grassOver:.12 },
      tint:'#3d4466',
      spawns:{ magnemite:6, pikachu:5, shinx:5, mareep:3, gastly:4, abra:3, meowth:4, koffing:3, rattata:3 },
      alpha:{ species:'luxray', level:6, title:'Neon Gleam Luxray' } },
    { id:'shibuya', name:'Shibuya', gx:0, gy:1, difficulty:0,
      gen:{ building:.50, ruin:.25, park:.15, water:0, grassOver:.20 },
      tint:'#55504a',
      spawns:{ rattata:7, pidgey:6, eevee:4, growlithe:4, pikachu:3, meowth:4, poochyena:4, caterpie:4, oddish:3, charmander:1 },
      alpha:{ species:'mightyena', level:4, title:'Hachiko\'s Heir' } },
    { id:'ginza', name:'Ginza', gx:1, gy:1, difficulty:2,
      gen:{ building:.66, ruin:.18, park:.08, water:.02, grassOver:.10 },
      tint:'#5a4f45',
      spawns:{ meowth:6, clefairy:4, abra:4, growlithe:4, houndour:3, zangoose:3, koffing:3, rattata:3, riolu:2 },
      alpha:{ species:'persian', level:6, title:'Ginza Socialite' } },
    { id:'odaiba', name:'Odaiba Bay', gx:2, gy:1, difficulty:3,
      gen:{ building:.30, ruin:.25, park:.10, water:.45, grassOver:.15 },
      tint:'#3a5266',
      spawns:{ magikarp:7, psyduck:6, squirtle:4, dratini:2, pidgey:4, koffing:3, ekans:2, charmander:2 },
      alpha:{ species:'gyarados', level:7, title:'Rainbow Bridge Serpent' } }
  ];
  T.districtAt = function (tx, ty) {
    const n = T.DISTRICT_TILES;
    const gx = Math.floor(tx / n), gy = Math.floor(ty / n);
    return T.DISTRICTS.find(d => d.gx === gx && d.gy === gy) || null;
  };

  // Year-long weather. Toxic Smog is Tokyo Jungle's pollution, as Koffing and Weezing smog.
  T.WEATHER = {
    clear: { name:'Clear Skies',     icon:'☀', desc:'Nothing unusual.' },
    sun:   { name:'Harsh Sunlight',  icon:'🔆', desc:'Fire +50%, Water -50%. Chlorophyll speeds up. Hunger drains faster.' },
    rain:  { name:'Heavy Rain',      icon:'🌧', desc:'Water +50%, Fire -50%. Swift Swim speeds up. Scent fades: stealth is easier.' },
    sand:  { name:'Sandstorm',       icon:'🌪', desc:'Chips non-Rock/Ground/Steel. Rock Sp. Def +50%. Vision shortened.' },
    snow:  { name:'Snow',            icon:'❄', desc:'Chips non-Ice. Ice Defense +50%. Berries stop regrowing.' },
    smog:  { name:'Toxic Smog',      icon:'☣', desc:'Polluted air poisons non-Poison/Steel types. Food may be contaminated.' }
  };
})(window.TJP);
