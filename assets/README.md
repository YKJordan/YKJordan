# Custom sprites (optional)

The game draws every Pokémon procedurally. No Nintendo artwork ships with this project, and none should be committed to it. Sprites you add stay on your machine: `*.png`, `*.gif` and `*.webp` in `assets/sprites/` are git-ignored.

## Download them automatically

```bash
node tools/fetch-sprites.js                        # all 79 species, normal + shiny
node tools/fetch-sprites.js --only pikachu,eevee   # a few
node tools/fetch-sprites.js --no-shiny
```

By default this pulls Project Pokémon's animated 3D-model sprites (`projectpokemon.org/images/normal-sprite/<name>.gif` and `shiny-sprite/<name>.gif`). It needs Node 18 or newer and nothing else. For each species it:

1. downloads the GIF,
2. decodes every frame,
3. crops all frames to the same box, shrinks them to at most 128 px and lines up the feet,
4. saves a strip of square frames as `<id>.png` (and `<id>-shiny.png`),
5. records the frame rate in `assets/sprites/sprites.js`.

Re-running only adds or replaces the species you fetch. Anything that 404s or isn't an image is listed at the end, and those species keep the built-in art.

**Other sources.** Point the script at any site with one GIF or PNG per Pokémon. Templates take `{name}` (the species id, like `pikachu`), `{Name}` (`Pikachu`), `{dex}` (`25`) and `{dex3}` (`025`):

```bash
node tools/fetch-sprites.js --normal "https://example.org/sprites/{dex}.gif" --shiny "https://example.org/sprites/shiny/{dex}.gif" --facing right
```

`--facing` says which way the art looks: `front` (the default; never mirrored), `right` or `left`. Side-view sprites are mirrored when the Pokémon turns.

**Behind a proxy:** Node 22+ ignores `HTTPS_PROXY` unless you also set `NODE_USE_ENV_PROXY=1`.

## Add them by hand

1. Put `<id>.png` in this folder. The ids are the keys in `js/data/species.js`. A strip of square frames (width = frames × height) animates; any other shape is a still image.
2. Optionally add `<id>-shiny.png`.
3. List them in `assets/sprites/sprites.js`:
   ```js
   window.TJP_SPRITES = ['pikachu', 'eevee'];
   window.TJP_SPRITE_META = { pikachu: { fps: 12, shiny: true } };
   window.TJP_SPRITE_FACING = 'right';
   ```

## Going back to the built-in art

Run `git checkout assets/sprites/sprites.js`. The image files can stay; they're only used when listed.
