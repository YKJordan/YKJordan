# Pokémon Jungle: Tokyo

A **Tokyo Jungle × Pokémon** mashup that runs in the browser. You get Tokyo Jungle's survival loop: hunger, years, ageing, territory, rank, mating and generations. Underneath it are Pokémon's species, types, abilities, natures, moves, held items, status conditions, weather and evolution.

> Unofficial, non-commercial fan project. Pokémon © Nintendo / Creatures / GAME FREAK. Tokyo Jungle © Sony Interactive Entertainment. **No official art, audio or code is included.** All creature art is drawn procedurally. You can drop in your own sprites (see [`assets/README.md`](assets/README.md)).

## Play

No build step and no dependencies. Either:

- open `index.html` in a browser, or
- serve the folder: `python3 -m http.server 8000`, then go to <http://localhost:8000>.

Before each run the game asks for four choices:

1. **Pokémon.** You start with Eevee (grazer) and Growlithe (predator). 34 base forms can be unlocked.
2. **Nature.** One of the 25, or Random for a +5% score bonus.
3. **Held item.** More items unlock as you find them.
4. **Run modifiers.** Inverse Battle, Hunger Games, Fleeting Life, Wild Frenzy, Legendary Rush, Shiny Charm, Littermates, Eternal Weather. Most change the score multiplier.

### Controls

| Key | Action |
|---|---|
| `WASD` / arrows | Move |
| `Shift` | Sprint (uses stamina) |
| `C` | Stealth crouch (toggle). Crouch in tall grass to almost vanish |
| `Space` | Dodge roll (brief invulnerability) |
| `J` `K` `L` `;` or `1`–`4` | Use moves. Aim snaps to the nearest foe in front of you |
| `E` | Eat, hold to mark territory, rest in a nest, court a mate, open a crate |
| `Q` | Call your pack back |
| `M` / `Tab` | Full map |
| `Esc` / `P` | Pause: status, type chart, Pokédex, help |

## How Tokyo Jungle maps onto Pokémon

| Tokyo Jungle system | In this game |
|---|---|
| Survival mode in abandoned Tokyo | Six districts built procedurally: Shibuya (with its scramble crossing), Shinjuku, Harajuku/Yoyogi Park, Akihabara, Ginza and Odaiba Bay, plus a Yamanote rail line |
| Grazers vs carnivores | Each species has a **diet**. Grazers (Eevee, Pikachu, Bulbasaur, Deerling…) eat berries, run faster and hide well. Predators (Growlithe, Houndour, Absol, Sneasel…) eat what they knock out. Omnivores (Charmander, Squirtle, Rattata, Meowth…) eat both at 75% |
| Hunger meter, calories | Hunger drains constantly and faster when you sprint or it's sunny. At zero you lose HP. Calories (kcal) drive your rank |
| Years pass, the animal ages | A year lasts about 75 seconds. After 12 years the body declines and the Pokémon dies of old age unless it has bred |
| Marking territory | Each district has 4 rival markers. Hold `E` on all 4 to claim it, which opens a **nest** |
| Rank and mate quality | Rookie → Average → Prime by calories eaten this generation. Desperate, Average and Prime mates appear in your territory, and better mates need a higher rank |
| Generations and litters | Breeding in a nest gives 1 to 3 offspring. They hatch as the **base form**, inherit the better **IVs**, keep half your **EVs**, may get an **egg move**, and take on your nature 50% of the time. You play the first; siblings join your **pack** |
| Pack members take over | If you fall, a pack member carries the bloodline on |
| Stealth kills | Hit a Pokémon that hasn't noticed you (no `!` over it) for an **Ambush**: a guaranteed 2.25× crit. If that leaves the target below 40%, it's an instant **Takedown** |
| Toxic pollution | **Toxic Smog** weather poisons non-Poison/Steel types, contaminates half the food, and brings in Koffing |
| Yearly challenges | Three per year, such as "Knock out 3 Fire-type Pokémon" or "Claim Ginza". Rewards are vitamins, held items, Rare Candies and feasts |
| District bosses | Each district has an **alpha**: Mightyena, Snorlax (asleep, so sneak past), Tyranitar (summons a sandstorm), Luxray, Persian and Gyarados. Mewtwo appears in Year 10 |
| Unlocking animals | Knock out 3 of a species line, or beat its alpha, to unlock it |

## The Pokémon layer

- **79 species** with real base stats, typings and abilities. Evolution happens at the usual levels. **Eevee evolves by the year's weather**: rain → Vaporeon, sun → Flareon, clear → Jolteon, snow → Glaceon, sand or smog → Umbreon.
- **84 moves** adapted to real time as melee arcs, projectiles, area bursts, dashes or self-buffs. Each has a cooldown, status chance, flinch, drain, recoil and stat changes. When you learn a fifth move, the game asks which one to forget.
- **The real damage formula**: level, Attack vs Defense (physical) or Sp. Atk vs Sp. Def (special), STAB, the full **18-type chart**, crits with crit stages, ±15% random roll, weather, items and abilities.
- **42 abilities** with working effects: Intimidate, Static, Flash Fire, Levitate, Sturdy, Guts, Technician, Adaptability, Swift Swim / Chlorophyll / Sand Rush / Slush Rush, Moxie, Sand Stream, Cloud Nine, Synchronize, Magnet Pull and more.
- **25 natures**, IVs (0–31), EVs from vitamins (HP Up, Protein, Iron, Calcium, Zinc, Carbos).
- **Held items**: Leftovers, Choice Band/Specs, Life Orb, Focus Sash, Scope Lens, Shell Bell, Quick Claw, Everstone (doubles as Eviolite), Lucky Egg, Soothe Bell, Smoke Ball, Black Sludge, Big Root, Muscle Band.
- **Status conditions**: burn, poison, paralysis, sleep and freeze. Berries cure them (Oran, Sitrus, Pecha, Rawst, Cheri, Lum, Leppa).
- **Movement by type**: Flying types cross rooftops and water, Water types swim faster, Ghosts phase through walls, Magikarp flops on land.
- **Shinies** use a recoloured palette and are rarer still without the Shiny Charm.

## Project layout

```
index.html            screens and script order (plain scripts, so it works from file://)
css/style.css
js/core/              util, input, save (localStorage)
js/data/              types, natures, moves, abilities, items, species, districts, challenges
js/world/map.js       procedural Tokyo, collision, chunk-cached rendering
js/world/art.js       procedural creature renderer and optional sprite overrides
js/game/creature.js   stats, levels, evolution, status, stat stages
js/game/combat.js     damage formula, abilities, items, status ticks
js/game/ai.js         stealth detection, hunting, fleeing, pack and mate behaviour
js/game/game.js       the run: time, weather, hunger, territory, mating, spawning, rendering
js/ui/                canvas HUD and DOM menus
assets/sprites/       your own optional sprites (git-ignored)
tests/                data checks and a headless smoke test
```

Adding a species is one `sp(...)` line in `js/data/species.js`. Adding a move is one `mv(...)` line in `js/data/moves.js`. Then add the species to a district's `spawns` in `js/data/districts.js`.

## Tests

```bash
node tests/data.test.js                       # checks the type chart, natures, learnsets, evolutions and spawns
NODE_PATH=$(npm root -g) node tests/smoke.js  # headless Chromium plays a run (needs Playwright)
```

The smoke test steps through the setup screens, moves, fights and eats. It levels up and evolves, fast-forwards through years and every weather, claims Shibuya, breeds a new generation, fires every species' moves and every move in the game, dies, and checks frame rate. It fails on any page error.

## Why a rebuild and not a mod

This was built following the **mashup** guidance in [universal-modder](https://github.com/rehan-remade/universal-modder) (`skills/mashup-mods`). Tokyo Jungle only shipped on PS3/PS4 and has no PC build or mod loader, and the mainline Pokémon games run on Nintendo hardware. Neither has a practical route for a passthrough mod or a content port. That leaves pattern 4, *reimplement, then fuse*: rebuild the systems in one runtime and keep the original assets out of the repo, so players supply their own if they want them.
