// Held items (one per Pokémon, chosen before a run or found in the city),
// berries (food that grows on bushes) and vitamins (challenge rewards).
window.TJP = window.TJP || {};
(function (T) {
  T.HELD_ITEMS = {
    none:         { name:'No item', desc:'Travel light.', starter:true },
    leftovers:    { name:'Leftovers', desc:'Slowly restores HP over time.', starter:true },
    quick_claw:   { name:'Quick Claw', desc:'Moves recharge 20% faster.', starter:true },
    everstone:    { name:'Everstone', desc:'Prevents evolution. Unevolved Pokémon gain 25% defenses (Eviolite).', starter:true },
    choice_band:  { name:'Choice Band', desc:'Physical moves +50%, but move cooldowns +30%.' },
    choice_specs: { name:'Choice Specs', desc:'Special moves +50%, but move cooldowns +30%.' },
    life_orb:     { name:'Life Orb', desc:'All moves +30%; each hit costs 10% of the damage as HP.' },
    focus_sash:   { name:'Focus Sash', desc:'Survive one knockout blow per generation.' },
    scope_lens:   { name:'Scope Lens', desc:'Critical hits land more often.' },
    shell_bell:   { name:'Shell Bell', desc:'Heals 1/8 of the damage dealt.' },
    muscle_band:  { name:'Muscle Band', desc:'Melee and dash moves +20%.' },
    big_root:     { name:'Big Root', desc:'Draining moves and eating restore 30% more.' },
    lucky_egg:    { name:'Lucky Egg', desc:'Gain 50% more EXP.' },
    soothe_bell:  { name:'Soothe Bell', desc:'Mates are always at least Average quality. Litters +1.' },
    smoke_ball:   { name:'Smoke Ball', desc:'Stealth: foes detect you from half as far away.' },
    black_sludge: { name:'Black Sludge', desc:'Poison types regenerate HP; others are hurt. Smog-proof.' }
  };

  // effect: hunger restored, kcal, plus extra
  T.BERRIES = {
    oran:   { name:'Oran Berry',   color:'#3a7bd5', hunger:18, kcal:90,  heal:.15 },
    sitrus: { name:'Sitrus Berry', color:'#f5c542', hunger:24, kcal:130, heal:.30 },
    pecha:  { name:'Pecha Berry',  color:'#f49ac1', hunger:15, kcal:80,  cure:['psn'] },
    rawst:  { name:'Rawst Berry',  color:'#4ec9b0', hunger:15, kcal:80,  cure:['brn'] },
    cheri:  { name:'Cheri Berry',  color:'#e63946', hunger:15, kcal:80,  cure:['par'] },
    lum:    { name:'Lum Berry',    color:'#8bc34a', hunger:20, kcal:110, cure:['psn','brn','par','slp','frz'] },
    leppa:  { name:'Leppa Berry',  color:'#ff7f2a', hunger:16, kcal:90,  resetCd:true }
  };

  T.VITAMINS = {
    hp_up:   { name:'HP Up',   stat:'hp' },
    protein: { name:'Protein', stat:'atk' },
    iron:    { name:'Iron',    stat:'def' },
    calcium: { name:'Calcium', stat:'spa' },
    zinc:    { name:'Zinc',    stat:'spd' },
    carbos:  { name:'Carbos',  stat:'spe' }
  };
})(window.TJP);
