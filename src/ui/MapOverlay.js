import Phaser from 'phaser';
import { MAPS } from '../data/Maps.js';

export class MapOverlay {
  constructor(scene, unlockedTeleports) {
    this.scene = scene;
    this.visible = false;
    this._pendingTeleport = null;
    this._teleportMenuActive = false;
    this._teleportButtons = [];

    const w = scene.cameras.main.width;
    const h = scene.cameras.main.height;

    this.container = scene.add.container(0, 0)
      .setScrollFactor(0)
      .setDepth(15000)
      .setVisible(false);

    // Dark overlay background
    const bg = scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.75);
    this.container.add(bg);

    // Map frame
    const mapW = 200;
    const mapH = 150;
    const mapX = w / 2 - mapW / 2;
    const mapY = h / 2 - mapH / 2 - 6;

    const frame = scene.add.nineslice(
      w / 2, h / 2 - 6, 'ui-frames', 'panel-green',
      mapW + 14, mapH + 14, 8, 8, 8, 8
    );
    this.container.add(frame);

    // Draw map using graphics
    this.mapGfx = scene.add.graphics();
    this.container.add(this.mapGfx);

    this.mapX = mapX;
    this.mapY = mapY;
    this.mapW = mapW;
    this.mapH = mapH;

    // Player dot (blinking red)
    this.playerDot = scene.add.circle(w / 2, h / 2, 3, 0xff0000);
    this.container.add(this.playerDot);

    // Blink the player dot
    scene.tweens.add({
      targets: this.playerDot,
      alpha: { from: 1, to: 0.2 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // NPC dots (yellow) - store for updating
    this.npcDots = [];

    // Dynamic text labels (re-created per show)
    this._labels = [];

    // Title
    this.titleText = scene.add.text(w / 2, mapY - 12, 'WORLD MAP', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffdd00',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.container.add(this.titleText);

    // Hint
    this.hintText = scene.add.text(w / 2, h - 14, 'Press M to close', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#aaaaaa',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    this.container.add(this.hintText);

    // Teleport hint (shown when teleports are available)
    this.teleportHint = scene.add.text(w / 2, h - 26, 'Press T to teleport', {
      fontSize: '10px',
      fontFamily: 'Arial, sans-serif',
      color: '#88aaff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setVisible(false);
    this.container.add(this.teleportHint);

    // T key for teleport
    this.tKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
    // Number keys for teleport selection
    this._numKeys = [
      scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
    ];
  }

  _clearLabels() {
    this._labels.forEach(l => l.destroy());
    this._labels = [];
    this._clearTeleportMenu();
  }

  _clearTeleportMenu() {
    this._teleportButtons.forEach(b => b.destroy());
    this._teleportButtons = [];
    this._teleportMenuActive = false;
  }

  // Shared label style helper
  _labelStyle(color, size) {
    return {
      fontSize: (size || 8) + 'px',
      fontFamily: 'Arial, sans-serif',
      color: color || '#ddccaa',
      stroke: '#000000',
      strokeThickness: 2,
    };
  }

  _addLabel(x, y, text, color, size) {
    const label = this.scene.add.text(x, y, text, this._labelStyle(color, size)).setOrigin(0.5);
    this.container.add(label);
    this._labels.push(label);
    return label;
  }

  _drawWorldMap(worldW, worldH) {
    const { mapGfx, mapX, mapY, mapW, mapH } = this;
    const wx = (px) => mapX + (px / worldW) * mapW;
    const wy = (py) => mapY + (py / worldH) * mapH;

    mapGfx.clear();

    // Base: green
    mapGfx.fillStyle(0x4a8c3f);
    mapGfx.fillRect(mapX, mapY, mapW, mapH);

    // Forest biomes (left side — dark green)
    mapGfx.fillStyle(0x2a5c2a);
    mapGfx.fillRect(mapX, wy(192), wx(288) - mapX, wy(704) - wy(192));
    mapGfx.fillRect(mapX, wy(640), wx(384) - mapX, mapY + mapH - wy(640));

    // Desert biome (top-right — sandy)
    mapGfx.fillStyle(0xccaa66);
    mapGfx.fillRect(wx(864), mapY, mapX + mapW - wx(864), wy(448) - mapY);

    // Sea/water (bottom strip at harbor)
    mapGfx.fillStyle(0x3366bb);
    mapGfx.fillRect(wx(480), wy(800), wx(800) - wx(480), mapY + mapH - wy(800));

    // Town cluster (center-right) — brown buildings
    mapGfx.fillStyle(0x8b5e3c);
    mapGfx.fillRect(wx(590), wy(150), 8, 6);
    mapGfx.fillRect(wx(710), wy(150), 8, 6);
    mapGfx.fillRect(wx(670), wy(230), 8, 6);
    mapGfx.fillRect(wx(750), wy(190), 8, 6);
    this._addLabel(wx(670), wy(160), 'Town', '#ddccaa', 8);

    // Farm
    mapGfx.fillRect(wx(470), wy(278), 8, 6);
    this._addLabel(wx(474), wy(269), 'Farm', '#ddccaa', 7);

    // Dungeon entrances (red triangles)
    const dungeons = [
      { x: 80,  y: 80,  label: 'Cave',    col: '#ff8888' },
      { x: 848, y: 80,  label: 'Temple',  col: '#ff8888' },
      { x: 320, y: 416, label: 'Forest',  col: '#88ff88' },
      { x: 512, y: 16,  label: 'Mountain',col: '#aaddff' },
      { x: 640, y: 848, label: 'Harbor',  col: '#88aaff' },
      { x: 80,  y: 832, label: 'Ruins',   col: '#aaaacc' },
      { x: 192, y: 832, label: 'Keep',    col: '#aaaacc' },
      { x: 1040,y: 288, label: 'Crypt',   col: '#cc88ff' },
    ];
    for (const d of dungeons) {
      const ex = wx(d.x), ey = wy(d.y);
      mapGfx.fillStyle(0xcc4444);
      mapGfx.fillTriangle(ex, ey - 4, ex - 4, ey + 3, ex + 4, ey + 3);
      this._addLabel(ex, ey + 6, d.label, d.col, 7);
    }

    // Sub-towns
    const towns = [
      { x: 640, y: 96,  label: 'Harbor Town', col: '#88aaff' },
      { x: 192, y: 384, label: 'Forest Town',  col: '#88ff88' },
      { x: 880, y: 224, label: 'Desert Town',  col: '#ffdd88' },
    ];
    mapGfx.fillStyle(0x8b5e3c);
    for (const t of towns) {
      mapGfx.fillRect(wx(t.x) - 4, wy(t.y) - 3, 8, 6);
      this._addLabel(wx(t.x), wy(t.y) - 8, t.label, t.col, 7);
    }

    // Lich Tower (center, purple)
    mapGfx.fillStyle(0x8800cc);
    const ltx = wx(624), lty = wy(448);
    mapGfx.fillTriangle(ltx, lty - 5, ltx - 4, lty + 4, ltx + 4, lty + 4);
    this._addLabel(ltx, lty + 7, 'Lich Tower', '#dd88ff', 7);

    // Shadow Citadel (left-center, dark)
    mapGfx.fillStyle(0x220033);
    const scx = wx(256), scy = wy(768);
    mapGfx.fillRect(scx - 4, scy - 4, 8, 8);
    this._addLabel(scx, scy - 8, 'Citadel', '#dd44ff', 7);

    // Teleport stone (blue diamond)
    const ts = { x: 480, y: 320, name: 'World Stone' };
    const tsx = wx(ts.x), tsy = wy(ts.y);
    mapGfx.fillStyle(0x4488ff);
    mapGfx.fillRect(tsx - 3, tsy - 3, 6, 6);
    this._addLabel(tsx, tsy + 7, ts.name, '#88aaff', 7);

    this.titleText.setText('WORLD MAP');
  }

  _drawOverworldMap(worldW, worldH) {
    const { mapGfx, mapX, mapY, mapW, mapH } = this;

    mapGfx.clear();
    mapGfx.fillStyle(0x4a8c3f); // green grass
    mapGfx.fillRect(mapX, mapY, mapW, mapH);

    // Pond (blue)
    mapGfx.fillStyle(0x4488cc);
    const pondMX = mapX + (560 / worldW) * mapW;
    const pondMY = mapY + (280 / worldH) * mapH;
    mapGfx.fillEllipse(pondMX, pondMY, 14, 10);

    // Paths (tan)
    mapGfx.fillStyle(0xc8a86e);
    const pathStartX = mapX + (192 / worldW) * mapW;
    const pathEndX = mapX + (464 / worldW) * mapW;
    const pathY = mapY + (120 / worldH) * mapH;
    mapGfx.fillRect(pathStartX, pathY - 2, pathEndX - pathStartX, 4);
    const vertX = mapX + (448 / worldW) * mapW;
    const vertTopY = mapY + (48 / worldH) * mapH;
    mapGfx.fillRect(vertX - 2, vertTopY, 4, pathY - vertTopY);

    // Trees (dark green dots)
    const treePositions = [
      [80, 60], [300, 80], [500, 150], [700, 100], [150, 300],
      [600, 350], [400, 450], [100, 500], [700, 480], [350, 200],
      [550, 500], [250, 450], [850, 120], [920, 300], [800, 450],
      [950, 500], [300, 650], [550, 680], [750, 620],
    ];
    mapGfx.fillStyle(0x2d5a1e);
    for (const [tx, ty] of treePositions) {
      const mx = mapX + (tx / worldW) * mapW;
      const my = mapY + (ty / worldH) * mapH;
      mapGfx.fillCircle(mx, my, 3);
    }

    // Buildings (brown rectangles with labels)
    const buildings = [
      { x: 500, y: 70, label: 'House' },
      { x: 300, y: 480, label: 'Shop' },
      { x: 720, y: 255, label: 'Inn' },
      { x: 850, y: 200, label: 'House' },
    ];
    mapGfx.fillStyle(0x8b5e3c);
    for (const b of buildings) {
      const bx = mapX + (b.x / worldW) * mapW;
      const by = mapY + (b.y / worldH) * mapH;
      mapGfx.fillRect(bx - 5, by - 4, 10, 8);
      this._addLabel(bx, by - 8, b.label, '#ddccaa', 8);
    }

    // Dungeon entrances (red triangles)
    const entrances = [
      { x: 48, y: 80, label: 'Cave' },
      { x: 680, y: 160, label: 'Temple' },
      { x: 80, y: 420, label: 'Forest' },
    ];
    mapGfx.fillStyle(0xcc4444);
    for (const e of entrances) {
      const ex = mapX + (e.x / worldW) * mapW;
      const ey = mapY + (e.y / worldH) * mapH;
      mapGfx.fillTriangle(ex, ey - 4, ex - 4, ey + 3, ex + 4, ey + 3);
      this._addLabel(ex, ey + 6, e.label, '#ff8888', 8);
    }

    // New Phase 12 entrances
    // Mountain (top, snow-blue)
    mapGfx.fillStyle(0x88aacc);
    { const ex = mapX + (520 / worldW) * mapW; const ey = mapY + 4;
      mapGfx.fillTriangle(ex, ey - 3, ex - 4, ey + 4, ex + 4, ey + 4);
      this._addLabel(ex, ey + 7, 'Mountain', '#aaddff', 8); }
    // Harbor (right side, blue)
    mapGfx.fillStyle(0x2255cc);
    { const ex = mapX + (920 / worldW) * mapW; const ey = mapY + (700 / worldH) * mapH;
      mapGfx.fillTriangle(ex, ey - 4, ex - 4, ey + 3, ex + 4, ey + 3);
      this._addLabel(ex, ey + 6, 'Harbor', '#88aaff', 8); }
    // Ruins (left side, grey)
    mapGfx.fillStyle(0x555566);
    { const ex = mapX + (40 / worldW) * mapW; const ey = mapY + (700 / worldH) * mapH;
      mapGfx.fillTriangle(ex, ey - 4, ex - 4, ey + 3, ex + 4, ey + 3);
      this._addLabel(ex, ey + 6, 'Ruins', '#aaaacc', 8); }
    // Lich Tower (center, purple)
    mapGfx.fillStyle(0x8800cc);
    { const ex = mapX + (520 / worldW) * mapW; const ey = mapY + (360 / worldH) * mapH;
      mapGfx.fillTriangle(ex, ey - 4, ex - 4, ey + 3, ex + 4, ey + 3);
      this._addLabel(ex, ey + 6, 'Lich Tower', '#dd88ff', 8); }

    // Teleport stone marker (blue diamond)
    const ts = MAPS.overworld.teleportStone;
    if (ts) {
      const sx = mapX + (ts.x / worldW) * mapW;
      const sy = mapY + (ts.y / worldH) * mapH;
      mapGfx.fillStyle(0x4488ff);
      mapGfx.fillRect(sx - 3, sy - 3, 6, 6);
      this._addLabel(sx, sy + 6, ts.name, '#88aaff', 7);
    }

    this.titleText.setText('GREENDALE');
  }

  _drawForestMap(worldW, worldH) {
    const { mapGfx, mapX, mapY, mapW, mapH } = this;

    mapGfx.clear();
    // Dark green forest background
    mapGfx.fillStyle(0x2a6a2a);
    mapGfx.fillRect(mapX, mapY, mapW, mapH);

    // Path through forest (lighter green)
    mapGfx.fillStyle(0x3a8a3a);
    const pathW = 10;
    // Vertical path from south entrance to north
    mapGfx.fillRect(mapX + mapW * 0.38, mapY + mapH * 0.05, pathW, mapH * 0.9);
    // Horizontal path to east exit
    mapGfx.fillRect(mapX + mapW * 0.38, mapY + mapH * 0.22, mapW * 0.58, pathW);

    // Exits
    mapGfx.fillStyle(0xcc4444);
    // South — to overworld
    const sx = mapX + mapW * 0.42;
    const sy = mapY + mapH - 4;
    mapGfx.fillTriangle(sx, sy + 3, sx - 4, sy - 3, sx + 4, sy - 3);
    this._addLabel(sx, sy - 8, 'To Town', '#ff8888', 8);

    // North — to boss
    const nx = mapX + mapW * 0.42;
    const ny = mapY + 4;
    mapGfx.fillTriangle(nx, ny - 3, nx - 4, ny + 3, nx + 4, ny + 3);
    this._addLabel(nx, ny + 8, 'Boss', '#ff8888', 8);

    // East — to town2
    const ex = mapX + mapW - 4;
    const ey = mapY + mapH * 0.25;
    mapGfx.fillTriangle(ex + 3, ey, ex - 3, ey - 4, ex - 3, ey + 4);
    this._addLabel(ex - 12, ey, 'Woodhaven', '#ff8888', 7);

    // Tree clusters
    mapGfx.fillStyle(0x1a4d1a);
    const treeClusters = [
      [0.1, 0.15], [0.25, 0.1], [0.7, 0.15], [0.85, 0.4],
      [0.1, 0.5], [0.7, 0.6], [0.15, 0.8], [0.6, 0.75],
      [0.3, 0.6], [0.8, 0.8],
    ];
    for (const [fx, fy] of treeClusters) {
      mapGfx.fillCircle(mapX + mapW * fx, mapY + mapH * fy, 5);
    }

    this.titleText.setText('WHISPERING WOODS');
  }

  _drawTown2Map(worldW, worldH) {
    const { mapGfx, mapX, mapY, mapW, mapH } = this;

    mapGfx.clear();
    mapGfx.fillStyle(0x4a8c3f); // green grass
    mapGfx.fillRect(mapX, mapY, mapW, mapH);

    // Paths
    mapGfx.fillStyle(0xc8a86e);
    mapGfx.fillRect(mapX, mapY + mapH * 0.45, mapW, 6); // East-west path

    // Buildings
    const buildings = [
      { x: 280, y: 100, label: 'Shop' },
      { x: 420, y: 180, label: 'Inn' },
    ];
    const wW = 560;
    const wH = 448;
    mapGfx.fillStyle(0x8b5e3c);
    for (const b of buildings) {
      const bx = mapX + (b.x / wW) * mapW;
      const by = mapY + (b.y / wH) * mapH;
      mapGfx.fillRect(bx - 6, by - 5, 12, 10);
      this._addLabel(bx, by - 8, b.label, '#ddccaa', 8);
    }

    // West exit — to forest
    mapGfx.fillStyle(0xcc4444);
    const ex = mapX + 4;
    const ey = mapY + mapH * 0.47;
    mapGfx.fillTriangle(ex - 3, ey, ex + 3, ey - 4, ex + 3, ey + 4);
    this._addLabel(ex + 14, ey, 'Forest', '#ff8888', 8);

    // Trees
    mapGfx.fillStyle(0x2d5a1e);
    const trees = [[60, 40], [480, 60], [500, 360], [60, 380], [250, 50]];
    for (const [tx, ty] of trees) {
      const mx = mapX + (tx / wW) * mapW;
      const my = mapY + (ty / wH) * mapH;
      mapGfx.fillCircle(mx, my, 3);
    }

    // Teleport stone marker
    const ts = MAPS.town2.teleportStone;
    if (ts) {
      const sx = mapX + (ts.x / wW) * mapW;
      const sy = mapY + (ts.y / wH) * mapH;
      mapGfx.fillStyle(0x4488ff);
      mapGfx.fillRect(sx - 3, sy - 3, 6, 6);
      this._addLabel(sx, sy + 6, ts.name, '#88aaff', 7);
    }

    this.titleText.setText('WOODHAVEN');
  }

  _drawMountainMap(worldW, worldH) {
    const { mapGfx, mapX, mapY, mapW, mapH } = this;
    mapGfx.clear();
    mapGfx.fillStyle(0xccddee); // Snow white-blue
    mapGfx.fillRect(mapX, mapY, mapW, mapH);
    // Peaks
    mapGfx.fillStyle(0x99aabb);
    mapGfx.fillTriangle(mapX + mapW * 0.3, mapY + mapH * 0.1, mapX + mapW * 0.1, mapY + mapH * 0.6, mapX + mapW * 0.5, mapY + mapH * 0.6);
    mapGfx.fillTriangle(mapX + mapW * 0.7, mapY + mapH * 0.05, mapX + mapW * 0.5, mapY + mapH * 0.5, mapX + mapW * 0.9, mapY + mapH * 0.5);
    // Cave entrance
    mapGfx.fillStyle(0x3a2a1a);
    mapGfx.fillRect(mapX + mapW * 0.4, mapY + 4, 12, 8);
    this._addLabel(mapX + mapW * 0.46, mapY + 15, 'Cave', '#aaddff', 8);
    // Exit
    mapGfx.fillStyle(0xcc4444);
    mapGfx.fillTriangle(mapX + mapW * 0.5, mapY + mapH - 3, mapX + mapW * 0.46, mapY + mapH - 9, mapX + mapW * 0.54, mapY + mapH - 9);
    this.titleText.setText('FROSTPEAK MOUNTAIN');
  }

  _drawHarborMap(worldW, worldH) {
    const { mapGfx, mapX, mapY, mapW, mapH } = this;
    mapGfx.clear();
    mapGfx.fillStyle(0xddbb88); // Sand
    mapGfx.fillRect(mapX, mapY, mapW, mapH);
    // Water at top and bottom
    mapGfx.fillStyle(0x3366bb);
    mapGfx.fillRect(mapX, mapY, mapW, mapH * 0.15);
    mapGfx.fillRect(mapX, mapY + mapH * 0.85, mapW, mapH * 0.15);
    // Dock
    mapGfx.fillStyle(0xaa8844);
    mapGfx.fillRect(mapX + mapW * 0.35, mapY + mapH * 0.1, 10, mapH * 0.3);
    // Cave entrance
    mapGfx.fillStyle(0x3a2a1a);
    mapGfx.fillRect(mapX + mapW * 0.55, mapY + mapH * 0.12, 10, 7);
    this._addLabel(mapX + mapW * 0.6, mapY + mapH * 0.12 + 10, 'Sea Cave', '#88aaff', 8);
    this.titleText.setText('SALTWIND HARBOR');
  }

  _drawRuinsMap(worldW, worldH) {
    const { mapGfx, mapX, mapY, mapW, mapH } = this;
    mapGfx.clear();
    mapGfx.fillStyle(0x555566); // Dark stone
    mapGfx.fillRect(mapX, mapY, mapW, mapH);
    // Ruined walls (darker rectangles)
    mapGfx.fillStyle(0x333344);
    mapGfx.fillRect(mapX + mapW * 0.1, mapY + mapH * 0.15, mapW * 0.25, 4);
    mapGfx.fillRect(mapX + mapW * 0.65, mapY + mapH * 0.3, mapW * 0.2, 4);
    mapGfx.fillRect(mapX + mapW * 0.3, mapY + mapH * 0.6, mapW * 0.15, 4);
    // Dungeon entrance
    mapGfx.fillStyle(0x3a2a1a);
    mapGfx.fillRect(mapX + mapW * 0.45, mapY + 4, 10, 7);
    this._addLabel(mapX + mapW * 0.5, mapY + 14, 'Dungeon', '#aaaacc', 8);
    this.titleText.setText('ANCIENT RUINS');
  }

  _drawLichTowerMap(worldW, worldH) {
    const { mapGfx, mapX, mapY, mapW, mapH } = this;
    mapGfx.clear();
    mapGfx.fillStyle(0x0a0010); // Void black
    mapGfx.fillRect(mapX, mapY, mapW, mapH);
    // Tower
    mapGfx.fillStyle(0x220033);
    mapGfx.fillRect(mapX + mapW * 0.35, mapY + mapH * 0.1, mapW * 0.3, mapH * 0.8);
    // Tower top
    mapGfx.fillStyle(0x440055);
    mapGfx.fillTriangle(mapX + mapW * 0.5, mapY + 4, mapX + mapW * 0.33, mapY + mapH * 0.15, mapX + mapW * 0.67, mapY + mapH * 0.15);
    // Purple glow
    mapGfx.fillStyle(0x9900cc, 0.3);
    mapGfx.fillCircle(mapX + mapW * 0.5, mapY + mapH * 0.5, 12);
    this._addLabel(mapX + mapW * 0.5, mapY + mapH * 0.5 + 16, '???', '#dd88ff', 8);
    this.titleText.setText('LICH TOWER');
  }

  _drawFogOfWar(mapName, worldW, worldH) {
    const visited = new Set(this.scene.visitedChunks?.[mapName] || []);
    if (visited.size === 0) return;

    const chunkSize = mapName === 'overworld' ? 128 : 64;
    const chunksX = Math.ceil(worldW / chunkSize);
    const chunksY = Math.ceil(worldH / chunkSize);
    const { mapGfx, mapX, mapY, mapW, mapH } = this;

    for (let cy = 0; cy < chunksY; cy++) {
      for (let cx = 0; cx < chunksX; cx++) {
        if (!visited.has(`${cx},${cy}`)) {
          const rx = mapX + (cx * chunkSize / worldW) * mapW;
          const ry = mapY + (cy * chunkSize / worldH) * mapH;
          const rw = (chunkSize / worldW) * mapW + 1;
          const rh = (chunkSize / worldH) * mapH + 1;
          mapGfx.fillStyle(0x111122, 0.55);
          mapGfx.fillRect(rx, ry, rw, rh);
        }
      }
    }
  }

  _drawGenericMap(mapName) {
    const { mapGfx, mapX, mapY, mapW, mapH } = this;
    mapGfx.clear();

    const floorColors = {
      cave: 0x3a2a1a, boss_room: 0x3a2a1a,
      desert_temple: 0xddcc88, pharaoh_chamber: 0xddcc88,
      forest_boss: 0x2a6a2a,
      mountain_cave: 0x3a2a1a, sea_cave: 0x001133,
      ruins_dungeon: 0x222233,
    };
    mapGfx.fillStyle(floorColors[mapName] || 0x555555);
    mapGfx.fillRect(mapX, mapY, mapW, mapH);

    const names = {
      cave: 'CAVE', boss_room: 'BOSS ROOM',
      desert_temple: 'DESERT TEMPLE', pharaoh_chamber: 'PHARAOH CHAMBER',
      forest_boss: 'FOREST BOSS', house_interior: 'HOUSE',
      shop_interior: 'SHOP', inn_interior: 'INN',
      town2_shop: 'SHOP', town2_inn: 'INN',
      mountain_cave: 'MOUNTAIN CAVE', sea_cave: 'SEA CAVE',
      ruins_dungeon: 'RUINS DUNGEON',
    };
    this.titleText.setText(names[mapName] || 'MAP');
  }

  show(playerX, playerY, worldW, worldH, npcs, questManager, mapName, unlockedTeleports) {
    this.visible = true;
    this.container.setVisible(true);
    this._clearLabels();
    this._currentMapName = mapName || 'overworld';
    this._unlockedTeleports = unlockedTeleports || [];

    // Draw the appropriate map
    if (mapName === 'world') {
      this._drawWorldMap(worldW, worldH);
    } else if (mapName === 'overworld') {
      this._drawOverworldMap(worldW, worldH);
    } else if (mapName === 'forest') {
      this._drawForestMap(worldW, worldH);
    } else if (mapName === 'town2') {
      this._drawTown2Map(worldW, worldH);
    } else if (mapName === 'mountain') {
      this._drawMountainMap(worldW, worldH);
    } else if (mapName === 'harbor') {
      this._drawHarborMap(worldW, worldH);
    } else if (mapName === 'ruins') {
      this._drawRuinsMap(worldW, worldH);
    } else if (mapName === 'lich_tower') {
      this._drawLichTowerMap(worldW, worldH);
    } else {
      this._drawGenericMap(mapName);
    }

    // Fog-of-war overlay for explored maps
    const fogMaps = ['world', 'overworld', 'forest', 'town2', 'mountain', 'harbor', 'ruins'];
    if (fogMaps.includes(mapName)) {
      this._drawFogOfWar(mapName, worldW, worldH);
    }

    // Update player position
    const px = this.mapX + (playerX / worldW) * this.mapW;
    const py = this.mapY + (playerY / worldH) * this.mapH;
    this.playerDot.setPosition(px, py);

    // Clear and redraw NPC dots
    this.npcDots.forEach(d => d.destroy());
    this.npcDots = [];
    if (npcs) {
      npcs.getChildren().forEach(npc => {
        const nx = this.mapX + (npc.x / worldW) * this.mapW;
        const ny = this.mapY + (npc.y / worldH) * this.mapH;
        const dot = this.scene.add.circle(nx, ny, 2, 0xffff00);
        this.container.add(dot);
        this.npcDots.push(dot);

        // Quest marker — show "!" for NPCs with available/ready quests
        if (questManager && npc.questId) {
          const q = questManager.getQuest(npc.questId);
          if (q && (q.state === 'available' || q.state === 'ready')) {
            const marker = this.scene.add.text(nx, ny - 6, '!', {
              fontSize: '10px', fontFamily: 'Arial, sans-serif',
              color: q.state === 'ready' ? '#44ff44' : '#ffdd00',
              fontStyle: 'bold', stroke: '#000000', strokeThickness: 2,
            }).setOrigin(0.5);
            this.container.add(marker);
            this.npcDots.push(marker);
          }
        }
      });
    }

    // Show teleport hint if there are unlocked teleports to travel to
    const canTeleport = this._getAvailableDestinations().length > 0;
    this.teleportHint.setVisible(canTeleport);
  }

  _getAvailableDestinations() {
    if (!this._unlockedTeleports || this._unlockedTeleports.length < 2) return [];
    return this._unlockedTeleports.filter(m => m !== this._currentMapName);
  }

  _showTeleportMenu() {
    this._clearTeleportMenu();
    const destinations = this._getAvailableDestinations();
    if (destinations.length === 0) return;

    this._teleportMenuActive = true;
    const w = this.scene.cameras.main.width;
    const startY = this.mapY + this.mapH + 10;

    const title = this.scene.add.text(w / 2, startY, 'Teleport to:', {
      fontSize: '10px', fontFamily: 'Arial, sans-serif',
      color: '#88aaff', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);
    this.container.add(title);
    this._teleportButtons.push(title);

    destinations.forEach((mapName, i) => {
      const map = MAPS[mapName];
      const name = map?.teleportStone?.name || mapName;
      const label = this.scene.add.text(w / 2, startY + 14 + i * 12, `${i + 1}. ${name}`, {
        fontSize: '10px', fontFamily: 'Arial, sans-serif',
        color: '#ffffff', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5);
      this.container.add(label);
      this._teleportButtons.push(label);
    });

    this._teleportDestinations = destinations;
    this.teleportHint.setText('Press 1-' + destinations.length + ' to select');
  }

  handleInput() {
    if (!this.visible) return;

    if (this._teleportMenuActive) {
      // Check number keys for selection
      for (let i = 0; i < this._numKeys.length && i < (this._teleportDestinations?.length || 0); i++) {
        if (Phaser.Input.Keyboard.JustDown(this._numKeys[i])) {
          this._pendingTeleport = this._teleportDestinations[i];
          this._clearTeleportMenu();
          return;
        }
      }
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.tKey)) {
      const dests = this._getAvailableDestinations();
      if (dests.length > 0) {
        this._showTeleportMenu();
      }
    }
  }

  hide() {
    this.visible = false;
    this.container.setVisible(false);
    this.npcDots.forEach(d => d.destroy());
    this.npcDots = [];
    this._clearLabels();
    this.teleportHint.setText('Press T to teleport');
  }

  toggle(playerX, playerY, worldW, worldH, npcs, questManager, mapName, unlockedTeleports) {
    if (this.visible) {
      this.hide();
    } else {
      this.show(playerX, playerY, worldW, worldH, npcs, questManager, mapName, unlockedTeleports);
    }
    return this.visible;
  }
}
