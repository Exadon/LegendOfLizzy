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

  _drawGenericMap(mapName) {
    const { mapGfx, mapX, mapY, mapW, mapH } = this;
    mapGfx.clear();

    const floorColors = {
      cave: 0x3a2a1a, boss_room: 0x3a2a1a,
      desert_temple: 0xddcc88, pharaoh_chamber: 0xddcc88,
      forest_boss: 0x2a6a2a,
    };
    mapGfx.fillStyle(floorColors[mapName] || 0x555555);
    mapGfx.fillRect(mapX, mapY, mapW, mapH);

    const names = {
      cave: 'CAVE', boss_room: 'BOSS ROOM',
      desert_temple: 'DESERT TEMPLE', pharaoh_chamber: 'PHARAOH CHAMBER',
      forest_boss: 'FOREST BOSS', house_interior: 'HOUSE',
      shop_interior: 'SHOP', inn_interior: 'INN',
      town2_shop: 'SHOP', town2_inn: 'INN',
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
    if (mapName === 'overworld') {
      this._drawOverworldMap(worldW, worldH);
    } else if (mapName === 'forest') {
      this._drawForestMap(worldW, worldH);
    } else if (mapName === 'town2') {
      this._drawTown2Map(worldW, worldH);
    } else {
      this._drawGenericMap(mapName);
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
