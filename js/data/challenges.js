// Year challenges, like Tokyo Jungle's survival challenges. Three are dealt each year.
// make(ctx) returns {text, target, key, filter} where key is the event the challenge counts.
window.TJP = window.TJP || {};
(function (T) {
  const pick = a => a[Math.floor(Math.random() * a.length)];
  T.CHALLENGE_TEMPLATES = [
    { id:'kcal', make: c => { const n = 600 + c.year * 250; return { text:`Eat ${n} kcal this year`, target:n, key:'kcal' }; } },
    { id:'ko_type', make: c => { const t = pick(c.typesSeen); const n = 2 + Math.floor(c.year / 4);
      return { text:`Knock out ${n} ${t[0].toUpperCase() + t.slice(1)}-type Pokémon`, target:n, key:'ko', filter:{ type:t } }; } },
    { id:'ko_any', make: c => { const n = 4 + Math.floor(c.year / 2); return { text:`Knock out ${n} Pokémon`, target:n, key:'ko' }; } },
    { id:'super', make: c => { const n = 3 + Math.floor(c.year / 3); return { text:`Land ${n} super-effective hits`, target:n, key:'super' }; } },
    { id:'ambush', make: c => { const n = 2 + Math.floor(c.year / 5); return { text:`Ambush ${n} unaware Pokémon`, target:n, key:'ambush' }; } },
    { id:'claim', make: c => { const d = pick(c.unclaimed.length ? c.unclaimed : c.districts);
      return { text:`Claim territory in ${d.name}`, target:1, key:'claim', filter:{ district:d.id } }; } },
    { id:'mark', make: c => ({ text:'Mark 3 territory markers', target:3, key:'mark' }) },
    { id:'visit', make: c => { const d = pick(c.districts); return { text:`Reach ${d.name}`, target:1, key:'visit', filter:{ district:d.id } }; } },
    { id:'rank', make: c => ({ text:'Reach Prime rank', target:1, key:'rank_prime' }) },
    { id:'berries', make: c => { const n = 4 + Math.floor(c.year / 3); return { text:`Eat ${n} berries`, target:n, key:'berry' }; } },
    { id:'alpha', make: c => { const d = pick(c.districts); return { text:`Defeat the alpha of ${d.name}`, target:1, key:'alpha', filter:{ district:d.id } }; } },
    { id:'mate', make: c => ({ text:'Raise a new generation', target:1, key:'mate' }) },
    { id:'levels', make: c => ({ text:'Gain 3 levels', target:3, key:'level' }) },
    { id:'nodmg', make: c => ({ text:'Knock out a higher-level Pokémon', target:1, key:'ko_up' }) }
  ];
  T.CHALLENGE_REWARDS = [
    { kind:'vitamin' }, { kind:'vitamin' }, { kind:'item' }, { kind:'candy' }, { kind:'berries' }
  ];
})(window.TJP);
