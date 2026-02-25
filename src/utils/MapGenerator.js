// src/utils/MapGenerator.js
// Seeded deterministic map generator for Phase 18: World Rebuild
// All output is static data computed once at module load time.

class SeededRNG {
  constructor(seed) {
    this.s = (seed ^ 0xdeadbeef) >>> 0;
  }
  next() {
    this.s ^= this.s << 13;
    this.s ^= this.s >> 17;
    this.s ^= this.s << 5;
    return (this.s >>> 0) / 0xffffffff;
  }
  int(lo, hi)  { return Math.floor(this.next() * (hi - lo + 1)) + lo; }
  bool(p = 0.5) { return this.next() < p; }
}

// ALTTP-style BSP room + corridor dungeon generator
function dungeon(w, h, seed) {
  const rng = new SeededRNG(seed);

  // Fill with solid walls
  const grid = [];
  for (let y = 0; y < h; y++) {
    grid.push(new Array(w).fill(1));
  }

  const rooms = [];
  const N = Math.floor(w * h / 18);

  // Attempt to place rooms
  for (let attempt = 0; attempt < N * 4; attempt++) {
    const rw = rng.int(5, 9);
    const rh = rng.int(4, 7);
    const rx = rng.int(2, w - rw - 3);
    const ry = rng.int(2, h - rh - 3);

    // Check overlap (with 1px padding)
    let overlap = false;
    for (const r of rooms) {
      if (rx < r.x + r.w + 1 && rx + rw + 1 > r.x &&
          ry < r.y + r.h + 1 && ry + rh + 1 > r.y) {
        overlap = true;
        break;
      }
    }
    if (overlap) continue;

    // Carve interior
    for (let y = ry; y < ry + rh; y++) {
      for (let x = rx; x < rx + rw; x++) {
        grid[y][x] = 0;
      }
    }
    rooms.push({ x: rx, y: ry, w: rw, h: rh,
      cx: Math.floor(rx + rw / 2), cy: Math.floor(ry + rh / 2) });

    if (rooms.length >= N) break;
  }

  // If no rooms generated, make at least one central room
  if (rooms.length === 0) {
    const cx = Math.floor(w / 2) - 3;
    const cy = Math.floor(h / 2) - 2;
    for (let y = cy; y < cy + 5; y++) {
      for (let x = cx; x < cx + 7; x++) {
        if (y > 0 && y < h - 1 && x > 0 && x < w - 1) grid[y][x] = 0;
      }
    }
    rooms.push({ x: cx, y: cy, w: 7, h: 5, cx: cx + 3, cy: cy + 2 });
  }

  // Sort by distance from first room to create natural progression
  if (rooms.length > 1) {
    const first = rooms[0];
    rooms.sort((a, b) => {
      const da = Math.hypot(a.cx - first.cx, a.cy - first.cy);
      const db = Math.hypot(b.cx - first.cx, b.cy - first.cy);
      return da - db;
    });
  }

  // Connect consecutive rooms with 2-wide L-shaped corridors
  function carveCorridor(x1, y1, x2, y2) {
    // Horizontal then vertical
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let x = x1;
    while (x !== x2) {
      if (x > 0 && x < w - 1 && y1 > 0 && y1 < h - 1) grid[y1][x] = 0;
      if (x > 0 && x < w - 1 && y1 + 1 > 0 && y1 + 1 < h - 1) grid[y1 + 1] && (grid[y1 + 1][x] = 0);
      x += sx;
    }
    let y = y1;
    while (y !== y2) {
      if (x2 > 0 && x2 < w - 1 && y > 0 && y < h - 1) grid[y][x2] = 0;
      if (x2 + 1 > 0 && x2 + 1 < w - 1 && y > 0 && y < h - 1) grid[y][x2 + 1] && (grid[y][x2 + 1] = 0);
      y += sy;
    }
  }

  for (let i = 1; i < rooms.length; i++) {
    carveCorridor(rooms[i - 1].cx, rooms[i - 1].cy, rooms[i].cx, rooms[i].cy);
  }

  // Keep outer 1-tile border as wall
  for (let x = 0; x < w; x++) { grid[0][x] = 1; grid[h - 1][x] = 1; }
  for (let y = 0; y < h; y++) { grid[y][0] = 1; grid[y][w - 1] = 1; }

  return { collision: grid, rooms };
}

// Grid-street town generator
function town(w, h, seed) {
  const rng = new SeededRNG(seed);

  // Fill with walls
  const grid = [];
  for (let y = 0; y < h; y++) {
    grid.push(new Array(w).fill(1));
  }

  function carve(x1, y1, x2, y2) {
    for (let y = Math.max(0, y1); y <= Math.min(h - 1, y2); y++) {
      for (let x = Math.max(0, x1); x <= Math.min(w - 1, x2); x++) {
        grid[y][x] = 0;
      }
    }
  }

  const hw = Math.floor(w / 2);
  const hh = Math.floor(h / 2);

  // Main roads (2-wide)
  carve(0, hh - 1, w - 1, hh);           // horizontal center road
  carve(hw - 1, 0, hw, h - 1);           // vertical center road
  carve(0, 1, w - 1, 2);                  // north border road
  carve(0, h - 3, w - 1, h - 2);         // south border road
  carve(1, 0, 2, h - 1);                  // west border road
  carve(w - 3, 0, w - 2, h - 1);         // east border road

  // Central plaza (6×4 open area)
  carve(hw - 3, hh - 2, hw + 3, hh + 2);

  // Place buildings in each quadrant
  const buildingDoors = [];
  const quadrants = [
    { x1: 4,    y1: 4,    x2: hw - 2, y2: hh - 2 },  // NW
    { x1: hw + 2, y1: 4,  x2: w - 4, y2: hh - 2 },   // NE
    { x1: 4,    y1: hh + 2, x2: hw - 2, y2: h - 4 },  // SW
    { x1: hw + 2, y1: hh + 2, x2: w - 4, y2: h - 4 }, // SE
  ];

  for (const q of quadrants) {
    const qw = q.x2 - q.x1;
    const qh = q.y2 - q.y1;
    if (qw < 8 || qh < 6) continue;

    const numBuildings = rng.int(1, 2);
    for (let b = 0; b < numBuildings; b++) {
      // Building footprint: 6×5
      const bx = q.x1 + rng.int(1, Math.max(1, qw - 7));
      const by = q.y1 + rng.int(1, Math.max(1, qh - 6));
      const bw = 6, bh = 5;

      if (bx + bw > q.x2 || by + bh > q.y2) continue;

      // Solid walls — carve interior (walls stay solid around edges)
      // Interior: (bx+1, by+1) to (bx+bw-2, by+bh-2)
      carve(bx + 1, by + 1, bx + bw - 2, by + bh - 2);

      // 2-wide south door gap (bottom row)
      grid[by + bh - 1][bx + 2] = 0;
      grid[by + bh - 1][bx + 3] = 0;

      buildingDoors.push({
        x: (bx + 2) * 16 + 16,
        y: (by + bh) * 16,
      });
    }
  }

  // South-edge exit: 8-wide gap near center bottom
  const exitX = Math.floor(w / 2) - 4;
  for (let x = exitX; x < exitX + 8; x++) {
    if (x > 0 && x < w - 1) {
      grid[h - 1][x] = 0;
      grid[h - 2][x] = 0;
      grid[h - 3][x] = 0;
    }
  }

  return { collision: grid, buildingDoors };
}

// Outdoor biome scatter generator
function outdoor(w, h, seed, biome) {
  const rng = new SeededRNG(seed);
  const objects = [];

  if (biome === 'beach') {
    // Top 8 rows = water (no walking). Sparse palm trees in lower portion.
    const numPalms = rng.int(4, 8);
    for (let i = 0; i < numPalms; i++) {
      objects.push({
        type: 'oak-tree-small',
        x: rng.int(2, w - 3) * 16 + 8,
        y: rng.int(9, h - 3) * 16 + 8,
      });
    }
    return { objects, collision: null };
  }

  if (biome === 'desert_valley') {
    const grid = [];
    for (let y = 0; y < h; y++) grid.push(new Array(w).fill(0));

    // 20% boulder clusters
    const numClusters = Math.floor(w * h * 0.04);
    for (let i = 0; i < numClusters; i++) {
      const cx = rng.int(2, w - 3);
      const cy = rng.int(2, h - 3);
      const r = rng.int(1, 2);
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const nx = cx + dx, ny = cy + dy;
          if (nx > 0 && nx < w - 1 && ny > 0 && ny < h - 1) {
            if (rng.bool(0.6)) grid[ny][nx] = 1;
          }
        }
      }
    }

    // Horizontal dune ridges
    const numRidges = rng.int(2, 4);
    for (let i = 0; i < numRidges; i++) {
      const ry = rng.int(4, h - 5);
      const startX = rng.int(2, w / 3);
      const endX = startX + rng.int(4, 8);
      for (let x = startX; x < Math.min(endX, w - 2); x++) {
        grid[ry][x] = 1;
      }
    }

    // Keep borders clear
    for (let x = 0; x < w; x++) { grid[0][x] = 0; grid[h - 1][x] = 0; }
    for (let y = 0; y < h; y++) { grid[y][0] = 0; grid[y][w - 1] = 0; }

    // Add 8-wide south entry gap (clear path)
    const entryX = Math.floor(w / 2) - 4;
    for (let x = entryX; x < entryX + 8; x++) {
      for (let y = h - 4; y < h; y++) grid[y][x] = 0;
    }

    return { objects: [], collision: grid };
  }

  if (biome === 'wizard_island') {
    const grid = [];
    for (let y = 0; y < h; y++) grid.push(new Array(w).fill(0));

    // Dense rock border ring (3 tiles wide)
    const ringW = 3;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (x < ringW || x >= w - ringW || y < ringW || y >= h - ringW) {
          if (rng.bool(0.75)) grid[y][x] = 1;
        }
      }
    }

    // Clear centre path (cross shape)
    const midX = Math.floor(w / 2);
    const midY = Math.floor(h / 2);
    for (let x = ringW; x < w - ringW; x++) grid[midY][x] = 0;
    for (let y = ringW; y < h - ringW; y++) grid[y][midX] = 0;

    // West entry gap (boat arrival)
    for (let y = midY - 2; y <= midY + 2; y++) {
      for (let x = 0; x < ringW + 2; x++) grid[y][x] = 0;
    }

    return { objects: [], collision: grid };
  }

  // Generic: scatter obstacle clusters
  const grid = [];
  for (let y = 0; y < h; y++) grid.push(new Array(w).fill(0));

  const numClusters = Math.floor(w * h * 0.03);
  for (let i = 0; i < numClusters; i++) {
    const cx = rng.int(3, w - 4);
    const cy = rng.int(3, h - 4);
    const r = rng.int(1, 2);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const nx = cx + dx, ny = cy + dy;
        if (nx > 0 && nx < w - 1 && ny > 0 && ny < h - 1) {
          if (rng.bool(0.5)) grid[ny][nx] = 1;
        }
      }
    }
  }

  return { objects, collision: grid };
}

export const MapGenerator = { dungeon, town, outdoor };
