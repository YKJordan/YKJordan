// Moves, adapted to real-time play.
// shape: melee (arc in front) | proj (projectile) | aoe (burst around self) | dash (lunge) | self (buff)
// cd = cooldown in seconds. Effects: status/chance, flinch, stat (target stages), self (user stages),
// drain (fraction of damage healed), recoil (fraction of damage taken), crit (extra crit stages), heal.
window.TJP = window.TJP || {};
(function (T) {
  const M = {};
  function mv(id, name, type, cat, power, shape, o) {
    o = o || {};
    M[id] = Object.assign({
      id, name, type, cat, power, shape,
      range: shape === 'melee' ? 44 : shape === 'aoe' ? 110 : shape === 'dash' ? 170 : 340,
      cd: 1.0, contact: shape === 'melee' || shape === 'dash', speed: 420, radius: 7
    }, o);
  }
  // Normal
  mv('tackle','Tackle','normal','physical',40,'melee',{cd:.45});
  mv('scratch','Scratch','normal','physical',40,'melee',{cd:.45});
  mv('quick_attack','Quick Attack','normal','physical',40,'dash',{cd:1.6});
  mv('body_slam','Body Slam','normal','physical',85,'melee',{cd:2.5,status:'par',chance:.3});
  mv('take_down','Take Down','normal','physical',90,'dash',{cd:3,recoil:.25});
  mv('extreme_speed','Extreme Speed','normal','physical',80,'dash',{cd:2,range:240});
  mv('hyper_beam','Hyper Beam','normal','special',150,'proj',{cd:10,speed:700,radius:12});
  mv('swords_dance','Swords Dance','normal','status',0,'self',{cd:14,self:{atk:2}});
  mv('recover','Recover','normal','status',0,'self',{cd:16,heal:.5});
  mv('hyper_fang','Hyper Fang','normal','physical',80,'melee',{cd:2,flinch:.1});
  mv('slam','Slam','normal','physical',80,'melee',{cd:2.4,range:56});
  // Fire
  mv('ember','Ember','fire','special',40,'proj',{cd:.8,status:'brn',chance:.1});
  mv('flamethrower','Flamethrower','fire','special',90,'proj',{cd:3.5,status:'brn',chance:.1,radius:10});
  mv('flame_wheel','Flame Wheel','fire','physical',60,'dash',{cd:2,status:'brn',chance:.1});
  mv('fire_fang','Fire Fang','fire','physical',65,'melee',{cd:1.6,status:'brn',chance:.1,flinch:.1});
  mv('flare_blitz','Flare Blitz','fire','physical',120,'dash',{cd:5,recoil:.33,status:'brn',chance:.1});
  // Water
  mv('water_gun','Water Gun','water','special',40,'proj',{cd:.8});
  mv('aqua_jet','Aqua Jet','water','physical',40,'dash',{cd:1.6});
  mv('water_pulse','Water Pulse','water','special',60,'proj',{cd:1.8,flinch:.2});
  mv('surf','Surf','water','special',90,'aoe',{cd:4.5,range:130});
  mv('waterfall','Waterfall','water','physical',80,'dash',{cd:2.5,flinch:.2});
  // Electric
  mv('thunder_shock','Thunder Shock','electric','special',40,'proj',{cd:.8,status:'par',chance:.1});
  mv('spark','Spark','electric','physical',65,'dash',{cd:2,status:'par',chance:.3});
  mv('thunderbolt','Thunderbolt','electric','special',90,'proj',{cd:3.5,status:'par',chance:.1,speed:620});
  mv('discharge','Discharge','electric','special',80,'aoe',{cd:4,status:'par',chance:.3});
  mv('thunder_fang','Thunder Fang','electric','physical',65,'melee',{cd:1.6,status:'par',chance:.1,flinch:.1});
  mv('thunder_wave','Thunder Wave','electric','status',0,'proj',{cd:9,status:'par',chance:1});
  mv('wild_charge','Wild Charge','electric','physical',90,'dash',{cd:3,recoil:.25});
  // Grass
  mv('vine_whip','Vine Whip','grass','physical',45,'melee',{cd:.6,range:70});
  mv('razor_leaf','Razor Leaf','grass','physical',55,'proj',{cd:1.2,crit:1});
  mv('giga_drain','Giga Drain','grass','special',75,'proj',{cd:3,drain:.5});
  mv('solar_beam','Solar Beam','grass','special',120,'proj',{cd:9,speed:700,radius:12});
  mv('sleep_powder','Sleep Powder','grass','status',0,'aoe',{cd:12,status:'slp',chance:.75,range:90});
  mv('horn_leech','Horn Leech','grass','physical',75,'melee',{cd:2.2,drain:.5});
  mv('petal_dance','Petal Dance','grass','special',120,'aoe',{cd:7});
  // Ice
  mv('ice_shard','Ice Shard','ice','physical',40,'proj',{cd:.9,speed:640});
  mv('ice_fang','Ice Fang','ice','physical',65,'melee',{cd:1.6,status:'frz',chance:.1,flinch:.1});
  mv('ice_beam','Ice Beam','ice','special',90,'proj',{cd:3.5,status:'frz',chance:.1,speed:600});
  // Fighting
  mv('force_palm','Force Palm','fighting','physical',60,'melee',{cd:1.2,status:'par',chance:.3});
  mv('aura_sphere','Aura Sphere','fighting','special',80,'proj',{cd:2.8,homing:true});
  mv('close_combat','Close Combat','fighting','physical',120,'melee',{cd:4.5,self:{def:-1,spd:-1}});
  // Poison
  mv('poison_sting','Poison Sting','poison','physical',15,'proj',{cd:.7,status:'psn',chance:.3});
  mv('poison_fang','Poison Fang','poison','physical',50,'melee',{cd:1.4,status:'psn',chance:.5});
  mv('sludge_bomb','Sludge Bomb','poison','special',90,'proj',{cd:3.5,status:'psn',chance:.3,radius:11});
  mv('poison_jab','Poison Jab','poison','physical',80,'melee',{cd:2,status:'psn',chance:.3});
  mv('smog','Smog','poison','special',30,'aoe',{cd:2.5,status:'psn',chance:.4});
  // Ground
  mv('mud_slap','Mud-Slap','ground','special',20,'proj',{cd:.8});
  mv('bulldoze','Bulldoze','ground','physical',60,'aoe',{cd:3,stat:{spe:-1},statChance:1});
  mv('earthquake','Earthquake','ground','physical',100,'aoe',{cd:6,range:150});
  // Flying
  mv('gust','Gust','flying','special',40,'proj',{cd:.8});
  mv('wing_attack','Wing Attack','flying','physical',60,'melee',{cd:1,range:56});
  mv('aerial_ace','Aerial Ace','flying','physical',60,'dash',{cd:1.8});
  mv('brave_bird','Brave Bird','flying','physical',120,'dash',{cd:5,recoil:.33});
  // Psychic
  mv('confusion','Confusion','psychic','special',50,'proj',{cd:1});
  mv('psychic','Psychic','psychic','special',90,'proj',{cd:3.5,stat:{spd:-1},statChance:.1,homing:true});
  mv('psystrike','Psystrike','psychic','special',100,'aoe',{cd:5,range:170});
  mv('agility','Agility','psychic','status',0,'self',{cd:14,self:{spe:2}});
  mv('teleport','Teleport','psychic','status',0,'self',{cd:8,teleport:true});
  // Bug
  mv('bug_bite','Bug Bite','bug','physical',60,'melee',{cd:1.2});
  mv('x_scissor','X-Scissor','bug','physical',80,'melee',{cd:2});
  mv('bug_buzz','Bug Buzz','bug','special',90,'aoe',{cd:4.5});
  // Rock
  mv('rock_throw','Rock Throw','rock','physical',50,'proj',{cd:1.2});
  mv('rock_slide','Rock Slide','rock','physical',75,'aoe',{cd:3.5,flinch:.3});
  mv('stone_edge','Stone Edge','rock','physical',100,'proj',{cd:4,crit:1,radius:10});
  // Ghost
  mv('lick','Lick','ghost','physical',30,'melee',{cd:.7,status:'par',chance:.3});
  mv('shadow_ball','Shadow Ball','ghost','special',80,'proj',{cd:2.8,stat:{spd:-1},statChance:.2});
  mv('hypnosis','Hypnosis','psychic','status',0,'proj',{cd:12,status:'slp',chance:.6});
  // Dragon
  mv('dragon_rage','Dragon Breath','dragon','special',60,'proj',{cd:1.6,status:'par',chance:.3});
  mv('dragon_claw','Dragon Claw','dragon','physical',80,'melee',{cd:1.8});
  mv('dragon_pulse','Dragon Pulse','dragon','special',85,'proj',{cd:3});
  mv('outrage','Outrage','dragon','physical',120,'aoe',{cd:6});
  // Dark
  mv('bite','Bite','dark','physical',60,'melee',{cd:1,flinch:.3});
  mv('crunch','Crunch','dark','physical',80,'melee',{cd:2,stat:{def:-1},statChance:.2});
  mv('night_slash','Night Slash','dark','physical',70,'melee',{cd:1.6,crit:1});
  mv('sucker_punch','Sucker Punch','dark','physical',70,'dash',{cd:2});
  mv('dark_pulse','Dark Pulse','dark','special',80,'proj',{cd:2.8,flinch:.2});
  mv('nasty_plot','Nasty Plot','dark','status',0,'self',{cd:14,self:{spa:2}});
  // Steel
  mv('metal_claw','Metal Claw','steel','physical',50,'melee',{cd:1,self:{atk:1},selfChance:.1});
  mv('iron_tail','Iron Tail','steel','physical',100,'melee',{cd:3.5,stat:{def:-1},statChance:.3,range:58});
  mv('flash_cannon','Flash Cannon','steel','special',80,'proj',{cd:2.8});
  mv('bullet_punch','Bullet Punch','steel','physical',40,'dash',{cd:1.4});
  // Fairy
  mv('fairy_wind','Fairy Wind','fairy','special',40,'proj',{cd:.8});
  mv('play_rough','Play Rough','fairy','physical',90,'melee',{cd:2.6,stat:{atk:-1},statChance:.1});
  mv('moonblast','Moonblast','fairy','special',95,'proj',{cd:3.5,stat:{spa:-1},statChance:.3});

  T.MOVES = M;
})(window.TJP);
