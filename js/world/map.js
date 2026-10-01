// Procedural ruined Tokyo: tile grid, generation, collision and cached chunk rendering.
window.TJP = window.TJP || {};
(function (T) {
  const U = T.U;
  const TL = { ROAD:0, WALK:1, BUILDING:2, GRASS:3, TALL:4, WATER:5, TREE:6, RUBBLE:7, PLAZA:8, SAND:9, RAIL:10 };
  T.TL = TL;
  const CHUNK = 16;

  class TileMap {
    constructor(seed) {
      const n = T.DISTRICT_TILES;
      this.w = n * 3; this.h = n * 2;
      this.tiles = new Uint8Array(this.w * this.h);
      this.meta = new Uint8Array(this.w * this.h);
      this.rng = U.seeded(seed);
      this.chunks = new Map();
      this.markers = []; this.nests = []; this.bushes = []; this.capsules = [];
      for (const d of T.DISTRICTS) this.genDistrict(d);
      this.genBorder();
      this.placeFeatures();
    }
    idx(x, y) { return y * this.w + x; }
    get(x, y) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return TL.BUILDING; return this.tiles[y * this.w + x]; }
    set(x, y, t, m) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; this.tiles[y * this.w + x] = t; if (m !== undefined) this.meta[y * this.w + x] = m; }
    r() { return this.rng(); }

    genDistrict(d) {
      const n = T.DISTRICT_TILES, ox = d.gx * n, oy = d.gy * n, g = d.gen;
      // Street grid.
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const mx = x % 16, my = y % 16;
        let t = TL.WALK;
        if (mx < 3 || my < 3) t = TL.ROAD;
        this.set(ox + x, oy + y, t, 0);
      }
      // Rail line through Shinjuku/Shibuya/Akihabara (Yamanote).
      if (['shinjuku', 'shibuya', 'akihabara'].includes(d.id)) {
        const rx = ox + 33;
        for (let y = 0; y < n; y++) { this.set(rx, oy + y, TL.RAIL); this.set(rx + 1, oy + y, TL.RAIL); }
      }
      // Blocks.
      for (let by = 0; by < 4; by++) for (let bx = 0; bx < 4; bx++) {
        const x0 = ox + bx * 16 + 3, y0 = oy + by * 16 + 3, x1 = x0 + 12, y1 = y0 + 12; // interior inclusive [x0+1, x1-1]
        let kind;
        if (d.id === 'odaiba' && (bx + by >= 4 || (bx === 3) || (by === 3 && bx >= 1))) kind = 'water';
        else {
          const roll = this.r();
          kind = roll < g.building ? 'building' : roll < g.building + g.ruin ? 'ruin' : roll < g.building + g.ruin + g.park ? 'park' : 'plaza';
          if (g.water > 0 && this.r() < g.water * .4) kind = 'water';
        }
        // Harajuku: the big Yoyogi park in the middle.
        if (d.id === 'harajuku' && bx >= 1 && bx <= 2 && by <= 2) kind = 'park';
        this.fillBlock(kind, x0, y0, x1, y1, d);
      }
      // Odaiba: water swallows the roads between water blocks, keep bridges.
      if (d.id === 'odaiba') {
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
          const t = this.get(ox + x, oy + y);
          if (t === TL.ROAD) {
            const nearWater = [[1,0],[-1,0],[0,1],[0,-1],[2,0],[-2,0],[0,2],[0,-2]].filter(([a, b]) => this.get(ox + x + a, oy + y + b) === TL.WATER).length;
            const bridge = (y >= 32 && y < 35) || (x >= 16 && x < 19);
            if (nearWater >= 3 && !bridge) this.set(ox + x, oy + y, TL.WATER);
          }
        }
        // Beach edge.
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
          const tx = ox + x, ty = oy + y, t = this.get(tx, ty);
          if ((t === TL.WALK || t === TL.PLAZA) && [[1,0],[-1,0],[0,1],[0,-1]].some(([a, b]) => this.get(tx + a, ty + b) === TL.WATER)) this.set(tx, ty, TL.SAND);
        }
      }
      // Nature reclaims the streets.
      const blobs = Math.floor(30 * g.grassOver) + 3;
      for (let i = 0; i < blobs; i++) {
        const cx = ox + Math.floor(this.r() * n), cy = oy + Math.floor(this.r() * n), rad = 2 + this.r() * 4;
        for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) {
          const t = this.get(cx + x, cy + y);
          if (Math.hypot(x, y) < rad + this.r() * 1.5 && (t === TL.ROAD || t === TL.WALK || t === TL.PLAZA || t === TL.RUBBLE))
            this.set(cx + x, cy + y, this.r() < .65 ? TL.TALL : TL.GRASS);
        }
      }
      // Rubble and crashed debris on roads.
      for (let i = 0; i < 40; i++) {
        const x = ox + Math.floor(this.r() * n), y = oy + Math.floor(this.r() * n);
        if (this.get(x, y) === TL.ROAD) this.set(x, y, TL.RUBBLE);
      }
    }

    fillBlock(kind, x0, y0, x1, y1) {
      const inner = (fn) => { for (let y = y0 + 1; y < y1; y++) for (let x = x0 + 1; x < x1; x++) fn(x, y); };
      if (kind === 'building' || kind === 'ruin') {
        // Split into 1-4 buildings separated by alleys.
        const splitX = this.r() < .5, splitY = this.r() < .5;
        const ax = x0 + 6, ay = y0 + 6;
        const shade = Math.floor(this.r() * 200) + 20;
        inner((x, y) => {
          if ((splitX && x === ax) || (splitY && y === ay)) { this.set(x, y, TL.WALK); return; }
          const quad = (x > ax ? 1 : 0) + (y > ay ? 2 : 0);
          let t = TL.BUILDING;
          if (kind === 'ruin') {
            const r = this.r();
            t = r < .35 ? TL.RUBBLE : r < .55 ? TL.TALL : r < .62 ? TL.GRASS : TL.BUILDING;
          }
          this.set(x, y, t, (shade + quad * 37) & 255);
        });
      } else if (kind === 'park') {
        inner((x, y) => {
          const r = this.r();
          this.set(x, y, r < .45 ? TL.TALL : r < .53 ? TL.TREE : TL.GRASS);
        });
        // Pond.
        if (this.r() < .3) {
          const cx = x0 + 6, cy = y0 + 6;
          for (let y = -2; y <= 2; y++) for (let x = -3; x <= 3; x++) if (Math.hypot(x * .8, y) < 2.4) this.set(cx + x, cy + y, TL.WATER);
        }
      } else if (kind === 'plaza') {
        inner((x, y) => this.set(x, y, this.r() < .08 ? TL.TREE : this.r() < .1 ? TL.TALL : TL.PLAZA));
      } else if (kind === 'water') {
        for (let y = y0 - 1; y <= y1 + 1; y++) for (let x = x0 - 1; x <= x1 + 1; x++) this.set(x, y, TL.WATER);
      }
    }

    genBorder() {
      for (let x = 0; x < this.w; x++) { this.set(x, 0, TL.BUILDING, 60); this.set(x, this.h - 1, TL.BUILDING, 60); }
      for (let y = 0; y < this.h; y++) { this.set(0, y, TL.BUILDING, 60); this.set(this.w - 1, y, TL.BUILDING, 60); }
    }

    isOpen(tx, ty) {
      const t = this.get(tx, ty);
      return t !== TL.BUILDING && t !== TL.TREE && t !== TL.WATER;
    }
    findOpenNear(tx, ty, maxR) {
      for (let r = 0; r <= (maxR || 10); r++)
        for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
          if (Math.max(Math.abs(x), Math.abs(y)) !== r) continue;
          if (this.isOpen(tx + x, ty + y) && this.isOpen(tx + x + 1, ty + y) && this.isOpen(tx + x, ty + y + 1)) return { tx: tx + x, ty: ty + y };
        }
      return null;
    }

    placeFeatures() {
      const n = T.DISTRICT_TILES, S = T.TILE;
      for (const d of T.DISTRICTS) {
        const ox = d.gx * n, oy = d.gy * n;
        // 4 territory markers, one per quadrant, on intersections-ish.
        const quads = [[14, 14], [50, 14], [14, 50], [50, 50]];
        quads.forEach(([qx, qy], i) => {
          let jx = qx, jy = qy;
          if (d.id === 'odaiba') { jx = [10, 34, 10, 34][i]; jy = [10, 10, 34, 33][i]; }
          const p = this.findOpenNear(ox + jx, oy + jy, 12);
          if (p) this.markers.push({ district: d.id, x: (p.tx + .5) * S, y: (p.ty + .5) * S, owner: 'rival', progress: 0, idx: i });
        });
        // Nest (hidden until the district is claimed).
        const np = this.findOpenNear(ox + (d.id === 'odaiba' ? 20 : 32), oy + (d.id === 'odaiba' ? 20 : 30), 12);
        this.nests.push({ district: d.id, x: (np.tx + .5) * S, y: (np.ty + .5) * S, active: false });
        // Berry bushes on grass.
        let placed = 0, tries = 0;
        const want = 14 + Math.round(d.gen.park * 30);
        while (placed < want && tries++ < 4000) {
          const tx = ox + Math.floor(this.r() * n), ty = oy + Math.floor(this.r() * n);
          const t = this.get(tx, ty);
          if ((t === TL.GRASS || t === TL.TALL) && this.isOpen(tx, ty)) {
            const kinds = ['oran','oran','oran','sitrus','pecha','rawst','cheri','leppa','lum'];
            this.bushes.push({ x: (tx + .5) * S, y: (ty + .5) * S, berry: kinds[Math.floor(this.r() * kinds.length)], ripe: true, regrow: 0, district: d.id });
            placed++;
          }
        }
      }
    }

    // ---------- collision ----------
    solidFor(tx, ty, c) {
      const t = this.get(tx, ty);
      if (tx <= 0 || ty <= 0 || tx >= this.w - 1 || ty >= this.h - 1) return true;
      if (c && c.phases) return false;
      if (c && c.flies) return false;
      if (t === TL.BUILDING || t === TL.TREE) return true;
      if (t === TL.WATER) return !(c && (c.swims || c.levitates));
      return false;
    }
    collides(x, y, r, c) {
      const S = T.TILE;
      const x0 = Math.floor((x - r) / S), x1 = Math.floor((x + r) / S);
      const y0 = Math.floor((y - r) / S), y1 = Math.floor((y + r) / S);
      for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
        if (!this.solidFor(tx, ty, c)) continue;
        // circle vs box
        const cx = U.clamp(x, tx * S, tx * S + S), cy = U.clamp(y, ty * S, ty * S + S);
        if ((x - cx) ** 2 + (y - cy) ** 2 < r * r) return true;
      }
      return false;
    }
    tileAtPx(x, y) { return this.get(Math.floor(x / T.TILE), Math.floor(y / T.TILE)); }
    lineOfSight(a, b) {
      const steps = Math.ceil(U.dist(a, b) / 16);
      for (let i = 1; i < steps; i++) {
        const t = this.tileAtPx(U.lerp(a.x, b.x, i / steps), U.lerp(a.y, b.y, i / steps));
        if (t === TL.BUILDING) return false;
      }
      return true;
    }

    // ---------- rendering ----------
    hash(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
    renderChunk(cx, cy) {
      const S = T.TILE, cv = document.createElement('canvas');
      cv.width = cv.height = CHUNK * S;
      const g = cv.getContext('2d');
      for (let y = 0; y < CHUNK; y++) for (let x = 0; x < CHUNK; x++) this.drawTile(g, cx * CHUNK + x, cy * CHUNK + y, x * S, y * S);
      return cv;
    }
    drawTile(g, tx, ty, px, py) {
      const S = T.TILE, t = this.get(tx, ty), h = this.hash(tx, ty), m = this.meta[this.idx(tx, ty)] || 0;
      const d = T.districtAt(tx, ty);
      switch (t) {
        case TL.ROAD: {
          g.fillStyle = h < .5 ? '#3b3d42' : '#383a3f'; g.fillRect(px, py, S, S);
          // Lane markings in the middle lane of the 3-wide roads.
          const lx = tx % 16, ly = ty % 16;
          g.fillStyle = 'rgba(230,220,170,.55)';
          if (lx === 1 && ly >= 3 && ty % 2 === 0) g.fillRect(px + S / 2 - 2, py + 4, 4, S - 8);
          if (ly === 1 && lx >= 3 && tx % 2 === 0) g.fillRect(px + 4, py + S / 2 - 2, S - 8, 4);
          // Crosswalk stripes (Shibuya scramble!).
          if (lx < 3 && ly < 3 && d && d.id === 'shibuya') { g.fillStyle = 'rgba(240,240,240,.5)'; for (let i = 0; i < 4; i++) g.fillRect(px + i * 8 + 1, py + 2, 4, S - 4); }
          if (h > .9) { g.strokeStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.moveTo(px + h * 20, py + 4); g.lineTo(px + 14, py + 18); g.lineTo(px + 26, py + 28); g.stroke(); }
          break;
        }
        case TL.WALK: g.fillStyle = h < .5 ? '#77736b' : '#7d7970'; g.fillRect(px, py, S, S);
          g.strokeStyle = 'rgba(0,0,0,.12)'; g.strokeRect(px + .5, py + .5, S - 1, S - 1); break;
        case TL.PLAZA: g.fillStyle = (tx + ty) % 2 ? '#8a8378' : '#857e73'; g.fillRect(px, py, S, S); break;
        case TL.SAND: g.fillStyle = h < .5 ? '#d8c99a' : '#d2c290'; g.fillRect(px, py, S, S); break;
        case TL.RAIL: g.fillStyle = '#4a4038'; g.fillRect(px, py, S, S);
          g.fillStyle = '#6b5a48'; for (let i = 0; i < 4; i++) g.fillRect(px + 2, py + i * 8 + 2, S - 4, 3);
          g.fillStyle = '#a0a0a8'; g.fillRect(px + 6, py, 3, S); g.fillRect(px + S - 9, py, 3, S); break;
        case TL.GRASS: g.fillStyle = h < .5 ? '#5d8a3a' : '#588536'; g.fillRect(px, py, S, S);
          g.fillStyle = '#6d9c44'; for (let i = 0; i < 4; i++) g.fillRect(px + this.hash(tx + i, ty) * 28, py + this.hash(tx, ty + i) * 28, 2, 4); break;
        case TL.TALL: {
          g.fillStyle = '#3f6e2a'; g.fillRect(px, py, S, S);
          g.strokeStyle = '#5f9a38'; g.lineWidth = 2;
          for (let i = 0; i < 7; i++) {
            const bx = px + 3 + this.hash(tx * 7 + i, ty) * 26, by = py + 8 + this.hash(tx, ty * 7 + i) * 22;
            g.beginPath(); g.moveTo(bx, by); g.lineTo(bx - 3, by - 9); g.moveTo(bx, by); g.lineTo(bx + 3, by - 10); g.stroke();
          }
          g.lineWidth = 1; break;
        }
        case TL.WATER: g.fillStyle = h < .5 ? '#2c5d86' : '#2a5880'; g.fillRect(px, py, S, S);
          g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(px + h * 18, py + 10 + h * 10, 10, 2); break;
        case TL.TREE: g.fillStyle = '#4e7a32'; g.fillRect(px, py, S, S);
          g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(px + 18, py + 22, 13, 8, 0, 0, 7); g.fill();
          g.fillStyle = '#2f5d24'; g.beginPath(); g.arc(px + 16, py + 14, 13, 0, 7); g.fill();
          g.fillStyle = '#3f7a2e'; g.beginPath(); g.arc(px + 13, py + 11, 8, 0, 7); g.fill(); break;
        case TL.RUBBLE: g.fillStyle = '#5e5850'; g.fillRect(px, py, S, S);
          for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? '#7a7268' : '#4a453f'; const s = 4 + this.hash(tx + i, ty - i) * 8;
            g.fillRect(px + this.hash(tx - i, ty + i) * (S - s), py + this.hash(tx + i * 3, ty) * (S - s), s, s * .7); }
          break;
        case TL.BUILDING: {
          const base = d ? d.tint : '#555';
          const roof = U.shade(base, (m / 255) * .5 - .15);
          g.fillStyle = roof; g.fillRect(px, py, S, S);
          // Façade where the street is south of the building.
          if (this.get(tx, ty + 1) !== TL.BUILDING) {
            g.fillStyle = U.shade(base, -.45); g.fillRect(px, py + S - 12, S, 12);
            g.fillStyle = 'rgba(255,230,150,.18)'; g.fillRect(px + 4, py + S - 9, 6, 5); g.fillRect(px + 18, py + S - 9, 6, 5);
          }
          if (this.get(tx, ty - 1) !== TL.BUILDING) { g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(px, py, S, 3); }
          if (h > .93) { g.fillStyle = '#9a9a9a'; g.fillRect(px + 8, py + 8, 10, 8); } // AC unit
          else if (h < .05) { g.fillStyle = '#3f6e2a'; g.beginPath(); g.arc(px + 16, py + 14, 7, 0, 7); g.fill(); } // rooftop weeds
          break;
        }
      }
    }
    draw(g, cam, vw, vh) {
      const S = T.TILE, size = CHUNK * S;
      const cx0 = Math.max(0, Math.floor(cam.x / size)), cy0 = Math.max(0, Math.floor(cam.y / size));
      const cx1 = Math.min(Math.ceil(this.w / CHUNK) - 1, Math.floor((cam.x + vw) / size));
      const cy1 = Math.min(Math.ceil(this.h / CHUNK) - 1, Math.floor((cam.y + vh) / size));
      for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
        const k = cx + ',' + cy;
        let c = this.chunks.get(k);
        if (!c) { c = this.renderChunk(cx, cy); this.chunks.set(k, c); }
        g.drawImage(c, Math.round(cx * size - cam.x), Math.round(cy * size - cam.y));
      }
    }
    // Small overview image for the minimap / big map.
    overview(scale) {
      const cv = document.createElement('canvas'); cv.width = this.w * scale; cv.height = this.h * scale;
      const g = cv.getContext('2d');
      const col = { 0:'#3b3d42', 1:'#77736b', 2:'#262830', 3:'#5d8a3a', 4:'#3f6e2a', 5:'#2c5d86', 6:'#2f5d24', 7:'#5e5850', 8:'#857e73', 9:'#d8c99a', 10:'#5a4a40' };
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { g.fillStyle = col[this.get(x, y)]; g.fillRect(x * scale, y * scale, scale, scale); }
      return cv;
    }
  }
  T.TileMap = TileMap;
})(window.TJP);
