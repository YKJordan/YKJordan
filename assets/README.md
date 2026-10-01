# Custom sprites (optional)

The game draws every Pokémon procedurally. No Nintendo artwork ships with this project, and none should be committed to it.

If you want different sprites for your own copy:

1. Put a PNG per species in this folder, named by species id, for example `pikachu.png`, `eevee.png` or `growlithe.png`. The ids are the keys in `js/data/species.js`.
2. Sprites should face **right** and have a transparent background. They're scaled to the creature's size, and the game flips them when the creature faces left.
3. List the ids in `assets/sprites/sprites.js`:
   ```js
   window.TJP_SPRITES = ['pikachu', 'eevee', 'growlithe'];
   ```
4. Reload. Species you didn't list keep the procedural art.

`*.png` in this folder is ignored by git so your sprites stay local. If you use universal-modder's `fal-assets` skill to make original creature art, the same steps apply.
