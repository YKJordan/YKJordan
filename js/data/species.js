// Species: real base stats, types, abilities, evolution levels and learnsets.
// diet: 'grazer' eats berries and must hide; 'predator' eats what it knocks out; 'omnivore' does both at 75%.
// art: description for the procedural renderer (js/world/art.js). Drop your own PNG into
// assets/sprites/<id>.png to replace it (see assets/README.md).
window.TJP = window.TJP || {};
(function (T) {
  const S = {};
  function sp(id, name, types, base, abilities, diet, o) {
    const [hp, atk, def, spa, spd, spe] = base;
    S[id] = Object.assign({
      id, name, types, abilities, diet,
      base: { hp, atk, def, spa, spd, spe },
      size: 16, learn: {}, eggMoves: [], art: {}, evo: null
    }, o);
  }

  // ---------- Starters of the jungle ----------
  sp('eevee','Eevee',['normal'],[55,55,50,45,65,55],['run_away','adaptability'],'grazer',{
    size:14, evoWeather:{ level:25, rain:'vaporeon', sun:'flareon', sand:'umbreon', snow:'glaceon', clear:'jolteon', smog:'umbreon' },
    learn:{1:['tackle'],5:['quick_attack'],9:['bite'],15:['swords_dance'],20:['take_down'],24:['body_slam']},
    eggMoves:['play_rough','agility'],
    art:{ body:'quad', c1:'#b07a45', c2:'#f3dfb5', c3:'#f3dfb5', ears:'long', tail:'fluffy', x:['ruff'] }});
  sp('vaporeon','Vaporeon',['water'],[130,65,60,110,95,65],['water_absorb','swift_swim'],'grazer',{size:18,
    learn:{25:['water_pulse'],30:['aqua_jet'],36:['surf'],44:['ice_beam']},
    art:{ body:'quad', c1:'#5fb4e6', c2:'#e8f3ff', c3:'#ffe27a', ears:'fin', tail:'fin', x:['ruff'] }});
  sp('flareon','Flareon',['fire'],[65,130,60,95,110,65],['flash_fire','guts'],'grazer',{size:17,
    learn:{25:['fire_fang'],30:['flame_wheel'],36:['flamethrower'],44:['flare_blitz']},
    art:{ body:'quad', c1:'#f06a2a', c2:'#ffe08a', c3:'#ffe08a', ears:'long', tail:'fluffy', x:['ruff'] }});
  sp('jolteon','Jolteon',['electric'],[65,65,60,110,95,130],['volt_absorb','quick_feet'],'grazer',{size:16,
    learn:{25:['thunder_shock'],30:['thunder_fang'],36:['thunderbolt'],44:['discharge']},
    art:{ body:'quad', c1:'#f7d02c', c2:'#ffffff', c3:'#ffffff', ears:'long', tail:'spiky', x:['spikes'] }});
  sp('umbreon','Umbreon',['dark'],[95,65,110,60,130,65],['synchronize','inner_focus'],'grazer',{size:17,
    learn:{25:['bite'],30:['sucker_punch'],36:['dark_pulse'],44:['crunch']},
    art:{ body:'quad', c1:'#2b2b33', c2:'#2b2b33', c3:'#f4d03f', ears:'long', tail:'thin', x:['rings'] }});
  sp('glaceon','Glaceon',['ice'],[65,60,110,130,95,65],['snow_cloak','slush_rush'],'grazer',{size:16,
    learn:{25:['ice_shard'],30:['ice_fang'],36:['ice_beam'],44:['moonblast']},
    art:{ body:'quad', c1:'#9fe0f0', c2:'#d8f6ff', c3:'#2f6f9f', ears:'long', tail:'thin', x:['diamonds'] }});

  sp('growlithe','Growlithe',['fire'],[55,70,45,70,50,60],['intimidate','flash_fire'],'predator',{
    size:15, evo:{ to:'arcanine', level:30 },
    learn:{1:['scratch','ember'],6:['bite'],12:['flame_wheel'],18:['fire_fang'],24:['crunch'],28:['flamethrower']},
    eggMoves:['close_combat','iron_tail'],
    art:{ body:'quad', c1:'#f08a2a', c2:'#f8e3b0', c3:'#2a2a2a', ears:'point', tail:'fluffy', x:['stripes','ruff'] }});
  sp('arcanine','Arcanine',['fire'],[90,110,80,100,80,95],['intimidate','flash_fire'],'predator',{size:24,
    learn:{30:['extreme_speed'],38:['flare_blitz'],46:['close_combat']},
    art:{ body:'quad', c1:'#f08a2a', c2:'#f8e3b0', c3:'#2a2a2a', ears:'point', tail:'fluffy', x:['stripes','mane'] }});

  // ---------- Predators ----------
  sp('houndour','Houndour',['dark','fire'],[45,60,30,80,50,65],['early_bird','flash_fire'],'predator',{
    size:15, evo:{ to:'houndoom', level:24 },
    learn:{1:['ember','bite'],8:['quick_attack'],14:['fire_fang'],19:['crunch'],22:['flamethrower']},
    eggMoves:['nasty_plot','sucker_punch'],
    art:{ body:'quad', c1:'#2b2b33', c2:'#c25b3a', c3:'#d9d9d9', ears:'point', tail:'thin', x:['collar'] }});
  sp('houndoom','Houndoom',['dark','fire'],[75,90,50,110,80,95],['early_bird','flash_fire'],'predator',{size:20,
    learn:{24:['dark_pulse'],32:['nasty_plot'],40:['flare_blitz']},
    art:{ body:'quad', c1:'#2b2b33', c2:'#c25b3a', c3:'#d9d9d9', ears:'horn2', tail:'thin', x:['collar'] }});

  sp('shinx','Shinx',['electric'],[45,65,34,40,34,45],['intimidate','rivalry'],'predator',{
    size:13, evo:{ to:'luxio', level:15 },
    learn:{1:['tackle'],5:['thunder_shock'],9:['bite'],13:['spark'],18:['thunder_fang'],26:['crunch'],30:['wild_charge']},
    eggMoves:['ice_fang','fire_fang'],
    art:{ body:'quad', c1:'#5aa6d8', c2:'#262a36', c3:'#f7d02c', ears:'round', tail:'star', x:['mane_small'] }});
  sp('luxio','Luxio',['electric'],[60,85,49,60,49,60],['intimidate','rivalry'],'predator',{
    size:16, evo:{ to:'luxray', level:30 },
    art:{ body:'quad', c1:'#5aa6d8', c2:'#262a36', c3:'#f7d02c', ears:'round', tail:'star', x:['mane'] }});
  sp('luxray','Luxray',['electric'],[80,120,79,95,79,70],['intimidate','rivalry'],'predator',{size:21,
    learn:{34:['discharge'],40:['crunch'],46:['wild_charge']},
    art:{ body:'quad', c1:'#5aa6d8', c2:'#262a36', c3:'#f7d02c', ears:'round', tail:'star', x:['mane'] }});

  sp('poochyena','Poochyena',['dark'],[35,55,35,30,30,35],['run_away','quick_feet'],'predator',{
    size:13, evo:{ to:'mightyena', level:18 },
    learn:{1:['tackle'],5:['bite'],12:['sucker_punch'],16:['crunch']},
    eggMoves:['poison_fang','play_rough'],
    art:{ body:'quad', c1:'#5b5b63', c2:'#2a2a2e', c3:'#f2c94c', ears:'point', tail:'fluffy', x:[] }});
  sp('mightyena','Mightyena',['dark'],[70,90,70,60,60,70],['intimidate','quick_feet'],'predator',{size:19,
    learn:{18:['night_slash'],26:['take_down'],34:['play_rough']},
    art:{ body:'quad', c1:'#5b5b63', c2:'#2a2a2e', c3:'#f2c94c', ears:'point', tail:'fluffy', x:['mane'] }});

  sp('zangoose','Zangoose',['normal'],[73,115,60,60,60,90],['immunity','toxic_boost'],'predator',{size:18,
    learn:{1:['scratch','quick_attack'],10:['night_slash'],18:['swords_dance'],24:['x_scissor'],34:['close_combat']},
    eggMoves:['poison_jab'],
    art:{ body:'biped', c1:'#f2f2f2', c2:'#f2f2f2', c3:'#c0392b', ears:'cat', tail:'fluffy', x:['scar','claws'] }});

  sp('ekans','Ekans',['poison'],[35,60,44,40,54,55],['intimidate','shed_skin'],'predator',{
    size:14, evo:{ to:'arbok', level:22 },
    learn:{1:['poison_sting'],6:['bite'],12:['poison_fang'],20:['sludge_bomb']},
    eggMoves:['sucker_punch'],
    art:{ body:'serpent', c1:'#8e5bb8', c2:'#f2d14b', c3:'#f2d14b', x:[] }});
  sp('arbok','Arbok',['poison'],[60,95,69,65,79,80],['intimidate','shed_skin'],'predator',{size:20,
    learn:{22:['crunch'],30:['poison_jab'],38:['earthquake']},
    art:{ body:'serpent', c1:'#7b4fa8', c2:'#f2d14b', c3:'#c0392b', x:['hood'] }});
  sp('seviper','Seviper',['poison'],[73,100,60,100,60,65],['shed_skin','poison_point'],'predator',{size:19,
    learn:{1:['poison_sting','bite'],12:['poison_fang'],20:['night_slash'],28:['sludge_bomb'],36:['poison_jab']},
    art:{ body:'serpent', c1:'#262a36', c2:'#f2d14b', c3:'#c0392b', x:['blade'] }});

  sp('sneasel','Sneasel',['dark','ice'],[55,95,55,35,75,115],['inner_focus','keen_eye'],'predator',{
    size:14, evo:{ to:'weavile', level:34 },
    learn:{1:['scratch'],6:['quick_attack'],10:['ice_shard'],16:['night_slash'],24:['ice_fang'],30:['x_scissor']},
    art:{ body:'biped', c1:'#2a3a4f', c2:'#f2c94c', c3:'#c0392b', ears:'feather', tail:'none', x:['claws'] }});
  sp('weavile','Weavile',['dark','ice'],[70,120,65,45,85,125],['pressure','keen_eye'],'predator',{size:17,
    learn:{34:['ice_beam'],40:['swords_dance']},
    art:{ body:'biped', c1:'#2a3a4f', c2:'#f2c94c', c3:'#c0392b', ears:'feather', tail:'none', x:['claws','crest'] }});

  sp('absol','Absol',['dark'],[65,130,60,75,60,75],['pressure','super_luck'],'predator',{size:19,
    learn:{1:['scratch','quick_attack'],10:['bite'],16:['night_slash'],24:['swords_dance'],32:['sucker_punch'],40:['play_rough']},
    art:{ body:'quad', c1:'#f4f4f4', c2:'#2d3142', c3:'#c0392b', ears:'blade', tail:'blade', x:['mane'] }});

  sp('riolu','Riolu',['fighting'],[40,70,40,35,40,60],['inner_focus','synchronize'],'predator',{
    size:13, evo:{ to:'lucario', level:28 },
    learn:{1:['quick_attack'],6:['force_palm'],12:['bite'],18:['metal_claw'],24:['swords_dance']},
    eggMoves:['bullet_punch','iron_tail'],
    art:{ body:'biped', c1:'#3b7dd8', c2:'#262a36', c3:'#f2c94c', ears:'point', tail:'thin', x:['mask'] }});
  sp('lucario','Lucario',['fighting','steel'],[70,110,70,115,70,90],['inner_focus','adaptability'],'predator',{size:18,
    learn:{28:['aura_sphere'],34:['dragon_pulse'],40:['close_combat'],46:['flash_cannon']},
    art:{ body:'biped', c1:'#3b7dd8', c2:'#262a36', c3:'#f2c94c', ears:'point', tail:'thin', x:['mask','spikes'] }});

  // ---------- Omnivores / scavengers ----------
  sp('rattata','Rattata',['normal'],[30,56,35,25,35,72],['run_away','guts'],'omnivore',{
    size:11, evo:{ to:'raticate', level:20 },
    learn:{1:['tackle'],4:['quick_attack'],10:['bite'],16:['hyper_fang'],22:['crunch']},
    eggMoves:['sucker_punch','swords_dance'],
    art:{ body:'quad', c1:'#9b6fbf', c2:'#f3e6c0', c3:'#ffffff', ears:'round', tail:'curl', x:['teeth'] }});
  sp('raticate','Raticate',['normal'],[55,81,60,50,70,97],['run_away','guts'],'omnivore',{size:15,
    learn:{20:['swords_dance'],28:['take_down']},
    art:{ body:'quad', c1:'#b58652', c2:'#f3e6c0', c3:'#ffffff', ears:'round', tail:'curl', x:['teeth','whiskers'] }});

  sp('meowth','Meowth',['normal'],[40,45,35,40,40,90],['pickup','technician'],'omnivore',{
    size:13, evo:{ to:'persian', level:28 },
    learn:{1:['scratch'],6:['bite'],12:['quick_attack'],20:['night_slash'],26:['play_rough']},
    eggMoves:['iron_tail'],
    art:{ body:'biped', c1:'#f3e6c0', c2:'#f3e6c0', c3:'#f2c94c', ears:'cat', tail:'curl', x:['coin','whiskers'] }});
  sp('persian','Persian',['normal'],[65,70,60,65,65,115],['technician','pickup'],'omnivore',{size:18,
    learn:{28:['swords_dance'],34:['dark_pulse']},
    art:{ body:'quad', c1:'#f3e6c0', c2:'#f3e6c0', c3:'#c0392b', ears:'cat', tail:'curl', x:['gem','whiskers'] }});

  sp('charmander','Charmander',['fire'],[39,52,43,60,50,65],['blaze','blaze'],'omnivore',{
    size:13, evo:{ to:'charmeleon', level:16 },
    learn:{1:['scratch','ember'],8:['metal_claw'],12:['fire_fang'],17:['dragon_rage'],24:['flamethrower'],30:['dragon_claw']},
    eggMoves:['dragon_pulse','bite'],
    art:{ body:'biped', c1:'#f08a3a', c2:'#f7dc8a', c3:'#f7dc8a', ears:'none', tail:'flame', x:[] }});
  sp('charmeleon','Charmeleon',['fire'],[58,64,58,80,65,80],['blaze','blaze'],'omnivore',{size:16,
    evo:{ to:'charizard', level:36 },
    art:{ body:'biped', c1:'#d9542b', c2:'#f7dc8a', c3:'#f7dc8a', ears:'horn1', tail:'flame', x:['claws'] }});
  sp('charizard','Charizard',['fire','flying'],[78,84,78,109,85,100],['blaze','blaze'],'omnivore',{size:24,
    flies:true, learn:{36:['wing_attack'],42:['flare_blitz'],50:['dragon_pulse']},
    art:{ body:'biped', c1:'#f08a3a', c2:'#f7dc8a', c3:'#3a8fb7', ears:'horn2', tail:'flame', x:['wings'] }});

  sp('squirtle','Squirtle',['water'],[44,48,65,50,64,43],['torrent','torrent'],'omnivore',{
    size:13, evo:{ to:'wartortle', level:16 },
    learn:{1:['tackle','water_gun'],8:['bite'],13:['aqua_jet'],18:['water_pulse'],24:['iron_tail'],30:['surf']},
    eggMoves:['ice_beam','aura_sphere'],
    art:{ body:'biped', c1:'#7cc4e8', c2:'#f3dfa0', c3:'#a0662b', ears:'none', tail:'curl', x:['shell'] }});
  sp('wartortle','Wartortle',['water'],[59,63,80,65,80,58],['torrent','torrent'],'omnivore',{size:16,
    evo:{ to:'blastoise', level:36 },
    art:{ body:'biped', c1:'#6a8fd8', c2:'#f3dfa0', c3:'#a0662b', ears:'feather', tail:'fluffy', x:['shell'] }});
  sp('blastoise','Blastoise',['water'],[79,83,100,85,105,78],['torrent','torrent'],'omnivore',{size:23,
    learn:{36:['flash_cannon'],42:['waterfall'],50:['ice_beam']},
    art:{ body:'biped', c1:'#5a7fd0', c2:'#f3dfa0', c3:'#7a4a22', ears:'none', tail:'curl', x:['shell','cannons'] }});

  sp('psyduck','Psyduck',['water'],[50,52,48,65,50,55],['cloud_nine','swift_swim'],'omnivore',{
    size:13, evo:{ to:'golduck', level:33 }, swims:true,
    learn:{1:['scratch','water_gun'],6:['confusion'],12:['water_pulse'],20:['aqua_jet'],28:['surf']},
    eggMoves:['psychic'],
    art:{ body:'biped', c1:'#f7d468', c2:'#f7d468', c3:'#f3e6c0', ears:'tuft', tail:'none', x:['bill'] }});
  sp('golduck','Golduck',['water'],[80,82,78,95,80,85],['cloud_nine','swift_swim'],'omnivore',{size:18, swims:true,
    learn:{33:['psychic'],40:['ice_beam'],46:['waterfall']},
    art:{ body:'biped', c1:'#3a7bd5', c2:'#3a7bd5', c3:'#e63946', ears:'none', tail:'none', x:['bill','gem'] }});

  sp('pidgey','Pidgey',['normal','flying'],[40,45,40,35,35,56],['keen_eye','run_away'],'omnivore',{
    size:11, evo:{ to:'pidgeotto', level:18 }, flies:true,
    learn:{1:['tackle','gust'],7:['quick_attack'],13:['wing_attack'],21:['aerial_ace'],30:['agility']},
    eggMoves:['brave_bird'],
    art:{ body:'bird', c1:'#a87b4b', c2:'#f3e2c0', c3:'#ffb3a0', x:[] }});
  sp('pidgeotto','Pidgeotto',['normal','flying'],[63,60,55,50,50,71],['keen_eye','run_away'],'omnivore',{
    size:15, evo:{ to:'pidgeot', level:36 }, flies:true,
    art:{ body:'bird', c1:'#a87b4b', c2:'#f3e2c0', c3:'#e63946', x:['crest'] }});
  sp('pidgeot','Pidgeot',['normal','flying'],[83,80,75,70,70,101],['keen_eye','run_away'],'omnivore',{size:21, flies:true,
    learn:{36:['brave_bird'],44:['hyper_beam']},
    art:{ body:'bird', c1:'#a87b4b', c2:'#f3e2c0', c3:'#e63946', x:['crest','plume'] }});

  // ---------- Grazers ----------
  sp('pikachu','Pikachu',['electric'],[35,55,40,50,50,90],['static','static'],'grazer',{
    size:12, evo:{ to:'raichu', level:26 },
    learn:{1:['thunder_shock','quick_attack'],6:['thunder_wave'],10:['spark'],16:['iron_tail'],20:['thunderbolt'],24:['discharge']},
    eggMoves:['wild_charge','play_rough'],
    art:{ body:'quad', c1:'#f7d02c', c2:'#f7d02c', c3:'#e63946', ears:'long_tip', tail:'bolt', x:['cheeks'] }});
  sp('raichu','Raichu',['electric'],[60,90,55,90,80,110],['static','static'],'grazer',{size:16,
    learn:{26:['wild_charge'],34:['agility']},
    art:{ body:'quad', c1:'#e98b2a', c2:'#f7dc8a', c3:'#f7d02c', ears:'long_tip', tail:'bolt_long', x:['cheeks'] }});

  sp('bulbasaur','Bulbasaur',['grass','poison'],[45,49,49,65,65,45],['overgrow','chlorophyll'],'grazer',{
    size:13, evo:{ to:'ivysaur', level:16 },
    learn:{1:['tackle','vine_whip'],7:['poison_sting'],12:['razor_leaf'],15:['sleep_powder'],20:['giga_drain'],27:['sludge_bomb']},
    eggMoves:['petal_dance'],
    art:{ body:'quad', c1:'#6fc5a8', c2:'#4c9a80', c3:'#4c9a3a', ears:'small', tail:'none', x:['bulb','spots'] }});
  sp('ivysaur','Ivysaur',['grass','poison'],[60,62,63,80,80,60],['overgrow','chlorophyll'],'grazer',{
    size:16, evo:{ to:'venusaur', level:32 },
    art:{ body:'quad', c1:'#5fb3a2', c2:'#4c9a80', c3:'#e86a9a', ears:'small', tail:'none', x:['bud','spots'] }});
  sp('venusaur','Venusaur',['grass','poison'],[80,82,83,100,100,80],['overgrow','chlorophyll'],'grazer',{size:24,
    learn:{32:['petal_dance'],40:['solar_beam'],48:['earthquake']},
    art:{ body:'quad', c1:'#5fb3a2', c2:'#4c9a80', c3:'#e85a6a', ears:'small', tail:'none', x:['flower','spots'] }});

  sp('oddish','Oddish',['grass','poison'],[45,50,55,75,65,30],['chlorophyll','run_away'],'grazer',{
    size:11, evo:{ to:'gloom', level:21 },
    learn:{1:['vine_whip'],5:['poison_sting'],10:['sleep_powder'],15:['giga_drain'],20:['sludge_bomb']},
    art:{ body:'blob', c1:'#3a5fbf', c2:'#3a5fbf', c3:'#4c9a3a', x:['leaves_top','feet'] }});
  sp('gloom','Gloom',['grass','poison'],[60,65,70,85,75,40],['chlorophyll','run_away'],'grazer',{
    size:14, evo:{ to:'vileplume', level:32 },
    art:{ body:'blob', c1:'#3a5fbf', c2:'#3a5fbf', c3:'#c0392b', x:['petals_top','feet','drool'] }});
  sp('vileplume','Vileplume',['grass','poison'],[75,80,85,110,90,50],['chlorophyll','run_away'],'grazer',{size:18,
    learn:{32:['petal_dance'],40:['moonblast'],46:['solar_beam']},
    art:{ body:'blob', c1:'#3a5fbf', c2:'#3a5fbf', c3:'#e63946', x:['big_flower','feet'] }});

  sp('deerling','Deerling',['normal','grass'],[60,60,50,40,50,75],['chlorophyll','sap_sipper'],'grazer',{
    size:14, evo:{ to:'sawsbuck', level:34 },
    learn:{1:['tackle'],5:['vine_whip'],10:['quick_attack'],16:['razor_leaf'],22:['take_down'],28:['horn_leech']},
    eggMoves:['agility','play_rough'],
    art:{ body:'quad', c1:'#e88aa8', c2:'#f6e7c8', c3:'#f6e7c8', ears:'long', tail:'none', x:['flower_head','spots'] }});
  sp('sawsbuck','Sawsbuck',['normal','grass'],[80,100,70,60,70,95],['chlorophyll','sap_sipper'],'grazer',{size:22,
    learn:{34:['horn_leech'],40:['swords_dance'],46:['solar_beam']},
    art:{ body:'quad', c1:'#8b5a3c', c2:'#f6e7c8', c3:'#e88aa8', ears:'long', tail:'none', x:['antlers'] }});

  sp('skiddo','Skiddo',['grass'],[66,65,48,62,57,52],['sap_sipper','run_away'],'grazer',{
    size:15, evo:{ to:'gogoat', level:32 },
    learn:{1:['tackle','vine_whip'],7:['razor_leaf'],12:['bulldoze'],18:['take_down'],26:['horn_leech']},
    eggMoves:['earthquake'],
    art:{ body:'quad', c1:'#a87b4b', c2:'#f3e6c0', c3:'#5aa84a', ears:'horn2', tail:'none', x:['leafback'] }});
  sp('gogoat','Gogoat',['grass'],[123,100,62,97,81,68],['sap_sipper','run_away'],'grazer',{size:23,
    learn:{32:['earthquake'],40:['solar_beam'],48:['close_combat']},
    art:{ body:'quad', c1:'#a87b4b', c2:'#f3e6c0', c3:'#5aa84a', ears:'antler', tail:'none', x:['leafback'] }});

  sp('mareep','Mareep',['electric'],[55,40,40,65,45,35],['static','static'],'grazer',{
    size:13, evo:{ to:'flaaffy', level:15 },
    learn:{1:['tackle','thunder_shock'],4:['thunder_wave'],11:['spark'],18:['discharge'],26:['thunderbolt']},
    eggMoves:['body_slam'],
    art:{ body:'quad', c1:'#f6f0d8', c2:'#5aa6d8', c3:'#f7d02c', ears:'small', tail:'orb', x:['wool'] }});
  sp('flaaffy','Flaaffy',['electric'],[70,55,55,80,60,45],['static','static'],'grazer',{
    size:15, evo:{ to:'ampharos', level:30 },
    art:{ body:'biped', c1:'#f2a7c0', c2:'#f6f0d8', c3:'#5aa6d8', ears:'long', tail:'orb', x:['wool_small'] }});
  sp('ampharos','Ampharos',['electric'],[90,75,85,115,90,55],['static','static'],'grazer',{size:20,
    learn:{30:['dragon_pulse'],38:['flash_cannon'],46:['thunderbolt']},
    art:{ body:'biped', c1:'#f7d02c', c2:'#ffffff', c3:'#e63946', ears:'long', tail:'orb', x:['stripes','gem'] }});

  sp('caterpie','Caterpie',['bug'],[45,30,35,20,20,45],['run_away','run_away'],'grazer',{
    size:10, evo:{ to:'metapod', level:7 },
    learn:{1:['tackle','bug_bite'],9:['quick_attack']},
    art:{ body:'serpent', c1:'#7ac74c', c2:'#f3e6a0', c3:'#e63946', x:['antenna','segments'] }});
  sp('metapod','Metapod',['bug'],[50,20,55,25,25,30],['sturdy','sturdy'],'grazer',{
    size:12, evo:{ to:'butterfree', level:10 },
    art:{ body:'pupa', c1:'#6fbf3a', c2:'#5aa84a', c3:'#ffffff', x:[] }});
  sp('butterfree','Butterfree',['bug','flying'],[60,45,50,90,80,70],['run_away','run_away'],'grazer',{size:15, flies:true,
    learn:{10:['confusion','gust'],13:['sleep_powder'],18:['bug_buzz'],26:['psychic']},
    art:{ body:'bug', c1:'#4a4a8a', c2:'#ffffff', c3:'#e63946', x:['wings_bug','antenna'] }});

  sp('magikarp','Magikarp',['water'],[20,10,55,15,20,80],['swift_swim','swift_swim'],'grazer',{
    size:12, evo:{ to:'gyarados', level:20 }, swims:true, aquatic:true,
    learn:{1:['tackle'],15:['tackle']},
    art:{ body:'fish', c1:'#e8582a', c2:'#f6e7c8', c3:'#f7d02c', x:['whiskers'] }});
  sp('gyarados','Gyarados',['water','flying'],[95,125,79,60,100,81],['intimidate','moxie'],'predator',{
    size:28, swims:true, flies:true,
    learn:{20:['bite','waterfall'],26:['crunch'],32:['dragon_rage'],40:['outrage'],48:['hyper_beam']},
    art:{ body:'serpent', c1:'#3a7bd5', c2:'#f6e7c8', c3:'#f7f7f7', x:['crest','fangs','whiskers'] }});

  sp('clefairy','Clefairy',['fairy'],[70,45,48,60,65,35],['cute_charm','cute_charm'],'grazer',{
    size:13, evo:{ to:'clefable', level:30 },
    learn:{1:['tackle','fairy_wind'],8:['body_slam'],14:['psychic'],20:['moonblast']},
    eggMoves:['recover'],
    art:{ body:'blob', c1:'#f6b6c8', c2:'#f6b6c8', c3:'#7a4a22', ears:'point', tail:'curl', x:['curl_top','feet','wings_tiny'] }});
  sp('clefable','Clefable',['fairy'],[95,70,73,95,90,60],['cute_charm','cute_charm'],'grazer',{size:18,
    learn:{30:['play_rough'],38:['recover']},
    art:{ body:'blob', c1:'#f6b6c8', c2:'#f6b6c8', c3:'#7a4a22', ears:'point', tail:'curl', x:['curl_top','feet','wings_tiny'] }});

  sp('abra','Abra',['psychic'],[25,20,15,105,55,90],['synchronize','inner_focus'],'grazer',{
    size:13, evo:{ to:'kadabra', level:16 },
    learn:{1:['teleport','confusion'],10:['agility'],14:['psychic']},
    art:{ body:'biped', c1:'#f2c94c', c2:'#8a5a2b', c3:'#8a5a2b', ears:'point', tail:'fluffy', x:['sleepy'] }});
  sp('kadabra','Kadabra',['psychic'],[40,35,30,120,70,105],['synchronize','inner_focus'],'grazer',{
    size:16, evo:{ to:'alakazam', level:36 },
    learn:{16:['shadow_ball'],24:['recover']},
    art:{ body:'biped', c1:'#f2c94c', c2:'#8a5a2b', c3:'#c0c0c0', ears:'point', tail:'fluffy', x:['spoon','mustache'] }});
  sp('alakazam','Alakazam',['psychic'],[55,50,45,135,95,120],['synchronize','inner_focus'],'grazer',{size:18,
    learn:{36:['psystrike'],44:['nasty_plot']},
    art:{ body:'biped', c1:'#f2c94c', c2:'#8a5a2b', c3:'#c0c0c0', ears:'point', tail:'none', x:['spoon','mustache'] }});

  // ---------- City dwellers ----------
  sp('magnemite','Magnemite',['electric','steel'],[25,35,70,95,55,45],['magnet_pull','sturdy'],'grazer',{
    size:11, evo:{ to:'magneton', level:30 }, flies:true,
    learn:{1:['tackle','thunder_shock'],8:['thunder_wave'],14:['spark'],20:['flash_cannon'],26:['discharge']},
    art:{ body:'orb', c1:'#b7b7ce', c2:'#ffffff', c3:'#e63946', x:['magnets','eye'] }});
  sp('magneton','Magneton',['electric','steel'],[50,60,95,120,70,70],['magnet_pull','sturdy'],'grazer',{size:18, flies:true,
    learn:{30:['thunderbolt'],40:['hyper_beam']},
    art:{ body:'orb', c1:'#b7b7ce', c2:'#ffffff', c3:'#e63946', x:['magnets','eye','triple'] }});

  sp('koffing','Koffing',['poison'],[40,65,95,60,45,35],['levitate','levitate'],'grazer',{
    size:14, evo:{ to:'weezing', level:35 }, flies:true,
    learn:{1:['tackle','smog'],9:['poison_sting'],16:['sludge_bomb'],24:['shadow_ball']},
    art:{ body:'orb', c1:'#8e5bb8', c2:'#f3e6a0', c3:'#f3e6a0', x:['crater','skull','smoke'] }});
  sp('weezing','Weezing',['poison'],[65,90,120,85,70,60],['levitate','levitate'],'grazer',{size:20, flies:true,
    learn:{35:['dark_pulse']},
    art:{ body:'orb', c1:'#8e5bb8', c2:'#f3e6a0', c3:'#f3e6a0', x:['crater','skull','smoke','twin'] }});

  sp('gastly','Gastly',['ghost','poison'],[30,35,30,100,35,80],['levitate','levitate'],'predator',{
    size:13, evo:{ to:'haunter', level:25 }, phases:true, flies:true,
    learn:{1:['lick','hypnosis'],8:['smog'],15:['shadow_ball'],22:['dark_pulse']},
    art:{ body:'ghost', c1:'#262a36', c2:'#8e5bb8', c3:'#ffffff', x:['grin','gas'] }});
  sp('haunter','Haunter',['ghost','poison'],[45,50,45,115,55,95],['levitate','levitate'],'predator',{
    size:16, evo:{ to:'gengar', level:40 }, phases:true, flies:true,
    learn:{25:['sludge_bomb'],32:['nasty_plot']},
    art:{ body:'ghost', c1:'#7b4fa8', c2:'#7b4fa8', c3:'#ffffff', x:['grin','hands','spikes'] }});
  sp('gengar','Gengar',['ghost','poison'],[60,65,60,130,75,110],['levitate','levitate'],'predator',{size:19, phases:true,
    learn:{40:['psychic'],46:['moonblast']},
    art:{ body:'biped', c1:'#6a4a9a', c2:'#6a4a9a', c3:'#e63946', ears:'point', tail:'none', x:['grin','spikes'] }});

  sp('larvitar','Larvitar',['rock','ground'],[50,64,50,45,50,41],['guts','guts'],'predator',{
    size:13, evo:{ to:'pupitar', level:30 },
    learn:{1:['bite','rock_throw'],8:['mud_slap'],14:['rock_slide'],20:['crunch'],26:['bulldoze']},
    eggMoves:['dragon_claw','iron_tail'],
    art:{ body:'biped', c1:'#8bbf4a', c2:'#8bbf4a', c3:'#c0392b', ears:'horn1', tail:'none', x:['belly_hole'] }});
  sp('pupitar','Pupitar',['rock','ground'],[70,84,70,65,70,51],['sturdy','sturdy'],'predator',{
    size:15, evo:{ to:'tyranitar', level:55 },
    art:{ body:'pupa', c1:'#7aa0c8', c2:'#5a7fa8', c3:'#2a2a2e', x:['shell_plates'] }});
  sp('tyranitar','Tyranitar',['rock','dark'],[100,134,110,95,100,61],['sand_stream','sand_stream'],'predator',{size:30,
    learn:{30:['stone_edge','crunch','earthquake'],40:['dark_pulse'],55:['outrage','hyper_beam']},
    art:{ body:'biped', c1:'#6f9a4a', c2:'#7aa0c8', c3:'#2a2a2e', ears:'horn1', tail:'thick', x:['spikes','belly_hole'] }});

  sp('dratini','Dratini',['dragon'],[41,64,45,50,50,50],['shed_skin','shed_skin'],'grazer',{
    size:12, evo:{ to:'dragonair', level:30 }, swims:true,
    learn:{1:['tackle','dragon_rage'],8:['thunder_wave'],14:['aqua_jet'],20:['dragon_pulse'],26:['slam']},
    art:{ body:'serpent', c1:'#6fa0e8', c2:'#f6f0f0', c3:'#ffffff', x:['ear_fins'] }});
  sp('dragonair','Dragonair',['dragon'],[61,84,65,70,70,70],['shed_skin','shed_skin'],'grazer',{
    size:17, evo:{ to:'dragonite', level:55 }, swims:true,
    learn:{30:['dragon_claw'],38:['ice_beam'],46:['outrage']},
    art:{ body:'serpent', c1:'#5a8ae0', c2:'#f6f0f0', c3:'#5aa6f0', x:['ear_wings','horn','orbs'] }});
  sp('dragonite','Dragonite',['dragon','flying'],[91,134,95,100,100,80],['inner_focus','inner_focus'],'predator',{size:26, flies:true,
    learn:{55:['extreme_speed','hyper_beam']},
    art:{ body:'biped', c1:'#f0a040', c2:'#f6e0a0', c3:'#3a8f8f', ears:'antenna', tail:'thick', x:['wings'] }});

  // ---------- Kings of Tokyo ----------
  sp('snorlax','Snorlax',['normal'],[160,110,65,65,110,30],['thick_fat','immunity'],'omnivore',{size:32,
    learn:{1:['tackle','body_slam'],20:['crunch'],30:['earthquake'],40:['hyper_beam']},
    eggMoves:['recover'],
    art:{ body:'blob', c1:'#2f5a6a', c2:'#f3e6c0', c3:'#ffffff', ears:'cat', tail:'none', x:['big_belly','feet','sleepy','claws'] }});
  sp('mewtwo','Mewtwo',['psychic'],[106,110,90,154,90,130],['pressure','pressure'],'predator',{size:24, legendary:true,
    learn:{1:['confusion','psychic','aura_sphere','recover'],50:['psystrike','shadow_ball','ice_beam','nasty_plot']},
    art:{ body:'biped', c1:'#d8cfe0', c2:'#9b6fbf', c3:'#9b6fbf', ears:'nub', tail:'thick', x:['tube'] }});

  // Derived data: line root, prevo links, BST.
  for (const id in S) {
    const s = S[id];
    s.bst = Object.values(s.base).reduce((a, b) => a + b, 0);
    if (s.evo) S[s.evo.to].prevo = id;
    if (s.evoWeather) for (const k of ['rain','sun','sand','snow','clear','smog']) S[s.evoWeather[k]].prevo = id;
  }
  for (const id in S) {
    let r = id; while (S[r].prevo) r = S[r].prevo;
    S[id].root = r;
  }
  // Playable = every base form. Starters are unlocked from the beginning.
  T.SPECIES = S;
  T.STARTERS = ['eevee','growlithe'];
  T.PLAYABLE = Object.keys(S).filter(id => S[id].root === id);
  // Unlock hints shown on locked species.
  T.UNLOCK_RULE = 'Knock out 3 of its evolution line, or beat its challenge.';

  // All moves this species can know at a level, inheriting from earlier forms.
  T.learnsetUpTo = function (id, level) {
    const chain = [];
    let c = id; while (c) { chain.unshift(c); c = S[c].prevo; }
    const out = [];
    for (const sid of chain) {
      const ls = S[sid].learn;
      for (const lv of Object.keys(ls).map(Number).sort((a, b) => a - b)) {
        if (lv <= level) for (const m of ls[lv]) if (!out.includes(m)) out.push(m);
      }
    }
    return out;
  };
  T.movesLearnedAt = function (id, level) {
    const ls = S[id].learn; return (ls[level] || []).slice();
  };
})(window.TJP);
