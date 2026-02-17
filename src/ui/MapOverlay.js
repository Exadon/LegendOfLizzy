import Phaser from 'phaser';

export class MapOverlay {
  constructor(scene) {
    this.scene = scene;
    this.visible = false;

    const w = scene.cameras.main.width;
    const h = scene.cameras.main.height;

    this.container = scene.add.container(0, 0)
      .setScrollFactor(0)
      .setDepth(15000)
      .setVisible(false);

    // Dark overlay background
    const bg = scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7);
    this.container.add(bg);

    // Map frame
    const mapW = 180;
    const mapH = 140;
    const mapX = w / 2 - mapW / 2;
    const mapY = h / 2 - mapH / 2 - 8;

    const frame = scene.add.nineslice(
      w / 2, h / 2 - 8, 'ui-frames', 'panel-green',
      mapW + 12, mapH + 12, 8, 8, 8, 8
    );
    this.container.add(frame);

    // Draw map using graphics
    this.mapGfx = scene.add.graphics();
    this.container.add(this.mapGfx);

    this.mapGfx.fillStyle(0x4a8c3f); // green grass
    this.mapGfx.fillRect(mapX, mapY, mapW, mapH);

    // Pond (blue)
    this.mapGfx.fillStyle(0x4488cc);
    const pondMX = mapX + (560 / 800) * mapW;
    const pondMY = mapY + (280 / 608) * mapH;
    this.mapGfx.fillEllipse(pondMX, pondMY, 14, 10);

    // Paths (tan)
    this.mapGfx.fillStyle(0xc8a86e);
    const pathStartX = mapX + (192 / 800) * mapW;
    const pathEndX = mapX + (464 / 800) * mapW;
    const pathY = mapY + (120 / 608) * mapH;
    this.mapGfx.fillRect(pathStartX, pathY - 2, pathEndX - pathStartX, 4);
    // Vertical path to house
    const vertX = mapX + (448 / 800) * mapW;
    const vertTopY = mapY + (48 / 608) * mapH;
    this.mapGfx.fillRect(vertX - 2, vertTopY, 4, pathY - vertTopY);

    // Trees (dark green dots)
    const treePositions = [
      [80, 60], [300, 80], [500, 150], [700, 100], [150, 300],
      [600, 350], [400, 450], [100, 500], [700, 480], [350, 200],
      [550, 500], [250, 450],
    ];
    this.mapGfx.fillStyle(0x2d5a1e);
    for (const [tx, ty] of treePositions) {
      const mx = mapX + (tx / 800) * mapW;
      const my = mapY + (ty / 608) * mapH;
      this.mapGfx.fillCircle(mx, my, 3);
    }

    // House (brown)
    this.mapGfx.fillStyle(0x8b5e3c);
    const houseX = mapX + (500 / 800) * mapW;
    const houseY = mapY + (70 / 608) * mapH;
    this.mapGfx.fillRect(houseX - 6, houseY - 5, 12, 10);

    // Player dot (blinking red)
    this.playerDot = scene.add.circle(w / 2, h / 2, 3, 0xff0000);
    this.container.add(this.playerDot);

    this.mapX = mapX;
    this.mapY = mapY;
    this.mapW = mapW;
    this.mapH = mapH;

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

    // Title
    const title = scene.add.text(w / 2, mapY - 10, 'WORLD MAP', {
      fontSize: '8px',
      fontFamily: 'CuteFantasy',
      color: '#ffdd00',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    this.container.add(title);

    // Hint
    const hint = scene.add.text(w / 2, h - 16, 'Press M to close', {
      fontSize: '8px',
      fontFamily: 'CuteFantasy',
      color: '#aaaaaa',
    }).setOrigin(0.5);
    this.container.add(hint);
  }

  show(playerX, playerY, worldW, worldH, npcs) {
    this.visible = true;
    this.container.setVisible(true);

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
      });
    }
  }

  hide() {
    this.visible = false;
    this.container.setVisible(false);
    this.npcDots.forEach(d => d.destroy());
    this.npcDots = [];
  }

  toggle(playerX, playerY, worldW, worldH, npcs) {
    if (this.visible) {
      this.hide();
    } else {
      this.show(playerX, playerY, worldW, worldH, npcs);
    }
    return this.visible;
  }
}
