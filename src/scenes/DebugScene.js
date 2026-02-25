import Phaser from 'phaser';

// Characters with spritesheet animations defined in PreloadScene
const CHARACTERS = [
  { key: 'lizzy', prefix: 'lizzy', frameSize: 64 },
  { key: 'farmer-bob', prefix: 'npc-bob', frameSize: 64 },
  { key: 'farmer-buba', prefix: 'npc-buba', frameSize: 64 },
  { key: 'chef-chloe', prefix: 'npc-chloe', frameSize: 64 },
  { key: 'fisherman-fin', prefix: 'npc-fin', frameSize: 64 },
  { key: 'lumberjack-jack', prefix: 'npc-jack', frameSize: 64 },
  { key: 'miner-mike', prefix: 'npc-mike', frameSize: 64 },
  { key: 'chicken', prefix: 'chicken', frameSize: 32 },
  { key: 'skeleton', prefix: 'skeleton', frameSize: 32 },
  { key: 'slime-green', prefix: 'slime', frameSize: 32 },
  { key: 'horse', prefix: 'horse', frameSize: 32 },
  { key: 'desert-person-1', prefix: null, frameSize: 32 },
  { key: 'pharaoh', prefix: 'pharaoh', frameSize: 32 },
  { key: 'swordman', prefix: null, frameSize: 48 },
  { key: 'goblin-thief', prefix: 'goblin', frameSize: 32 },
  { key: 'orc-grunt', prefix: 'orc', frameSize: 32 },
  { key: 'butterfly', prefix: 'butterfly', frameSize: 8 },
];

export class DebugScene extends Phaser.Scene {
  constructor() {
    super('Debug');
  }

  create() {
    this.mode = 'sprite'; // 'sprite' or 'ui'
    this.charIndex = 0;
    this.animIndex = 0;
    this.currentAnims = [];
    this.uiSelectedIndex = 0;
    this.animPaused = false;

    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Dark overlay background
    this.overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.85)
      .setScrollFactor(0).setDepth(10000);

    // Mode label (top center)
    this.modeLabel = this.add.text(w / 2, 4, '', {
      fontSize: '10px', fontFamily: 'Arial, sans-serif',
      color: '#ffdd00', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(10001);

    // Info text (left side)
    this.infoText = this.add.text(8, 18, '', {
      fontSize: '10px', fontFamily: 'Arial, sans-serif',
      color: '#ffffff', stroke: '#000000', strokeThickness: 1,
      lineSpacing: 2,
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(10001);

    // Output panel (bottom)
    this.outputText = this.add.text(8, h - 8, '', {
      fontSize: '10px', fontFamily: 'Arial, sans-serif',
      color: '#aaffaa', stroke: '#000000', strokeThickness: 1,
      lineSpacing: 1,
    }).setOrigin(0, 1).setScrollFactor(0).setDepth(10001);

    // Sprite for sprite viewer
    this.previewSprite = null;

    // Drag markers for UI tweaker
    this.dragMarkers = [];
    this.dragging = null; // { index, offsetX, offsetY }

    // Setup keyboard
    this.keys = {
      left: this.input.keyboard.addKey('LEFT'),
      right: this.input.keyboard.addKey('RIGHT'),
      up: this.input.keyboard.addKey('UP'),
      down: this.input.keyboard.addKey('DOWN'),
      tab: this.input.keyboard.addKey('TAB'),
      esc: this.input.keyboard.addKey('ESC'),
      plus: this.input.keyboard.addKey('PLUS'),
      minus: this.input.keyboard.addKey('MINUS'),
      shift: this.input.keyboard.addKey('SHIFT'),
      one: this.input.keyboard.addKey('ONE'),
      two: this.input.keyboard.addKey('TWO'),
      three: this.input.keyboard.addKey('THREE'),
      four: this.input.keyboard.addKey('FOUR'),
      five: this.input.keyboard.addKey('FIVE'),
      six: this.input.keyboard.addKey('SIX'),
      seven: this.input.keyboard.addKey('SEVEN'),
      eight: this.input.keyboard.addKey('EIGHT'),
      nine: this.input.keyboard.addKey('NINE'),
      space: this.input.keyboard.addKey('SPACE'),
      period: this.input.keyboard.addKey('PERIOD'),
    };

    // Prevent keys from propagating to game scene
    this.input.keyboard.manager.preventDefault = true;

    this._buildSpriteViewer();
  }

  _buildSpriteViewer() {
    this.mode = 'sprite';
    this.modeLabel.setText('SPRITE VIEWER  [TAB: UI Tweaker]  [ESC/F9: Close]');
    this.overlay.setVisible(true).setAlpha(0.85);
    this.infoText.setVisible(true);
    this.outputText.setVisible(true);
    this.modeLabel.setVisible(true);

    if (this.previewSprite) {
      this.previewSprite.destroy();
      this.previewSprite = null;
    }

    this._clearDragMarkers();
    this._destroyUITweakerPanel();
    this._loadCharacter();
  }

  _buildUITweaker() {
    this.mode = 'ui';

    // Hide all sprite viewer / debug overlay elements
    this.overlay.setVisible(false);
    this.infoText.setVisible(false);
    this.outputText.setVisible(false);
    this.modeLabel.setVisible(false);

    if (this.previewSprite) {
      this.previewSprite.destroy();
      this.previewSprite = null;
    }

    this._buildUIElements();
    this._createDragMarkers();
    this._createUITweakerPanel();
  }

  _createUITweakerPanel() {
    this._destroyUITweakerPanel();
    this.uiPanel = [];

    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Compact bar at top
    const barBg = this.add.rectangle(w / 2, 0, w, 14, 0x000000, 0.75)
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(10010);
    this.uiPanel.push(barBg);

    this.uiPanelTitle = this.add.text(4, 1, 'UI TWEAKER | TAB: Sprites | ESC: Close | Drag markers or Arrows/+/-', {
      fontSize: '10px', fontFamily: 'Arial, sans-serif',
      color: '#ffdd00', stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(10011);
    this.uiPanel.push(this.uiPanelTitle);

    // Compact status line at bottom showing selected element + all positions
    const bottomBg = this.add.rectangle(w / 2, h, w, 26, 0x000000, 0.75)
      .setOrigin(0.5, 1).setScrollFactor(0).setDepth(10010);
    this.uiPanel.push(bottomBg);

    this.uiPanelSelected = this.add.text(4, h - 24, '', {
      fontSize: '10px', fontFamily: 'Arial, sans-serif',
      color: '#ffffff', stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(10011);
    this.uiPanel.push(this.uiPanelSelected);

    this.uiPanelValues = this.add.text(4, h - 12, '', {
      fontSize: '10px', fontFamily: 'Arial, sans-serif',
      color: '#aaffaa', stroke: '#000000', strokeThickness: 1,
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(10011);
    this.uiPanel.push(this.uiPanelValues);

    this._refreshUITweakerPanel();
  }

  _destroyUITweakerPanel() {
    if (this.uiPanel) {
      this.uiPanel.forEach((el) => el.destroy());
    }
    this.uiPanel = null;
    this.uiPanelSelected = null;
    this.uiPanelValues = null;
  }

  _refreshUITweakerPanel() {
    if (!this.uiPanelSelected) return;

    const el = this.uiElements[this.uiSelectedIndex];
    if (el) {
      const t = el.target;
      this.uiPanelSelected.setText(
        `[${this.uiSelectedIndex + 1}] ${el.label}: x=${Math.round(t.x)} y=${Math.round(t.y)} scale=${(t.scaleX || 1).toFixed(1)}`
      );
    }

    // Compact all positions
    const vals = this.uiElements.map((e) => {
      const t = e.target;
      return `${e.label}(${Math.round(t.x)},${Math.round(t.y)})`;
    });
    this.uiPanelValues.setText(vals.join('  '));
  }

  _loadCharacter() {
    const char = CHARACTERS[this.charIndex];

    // Destroy old sprite
    if (this.previewSprite) {
      this.previewSprite.destroy();
      this.previewSprite = null;
    }

    // Find animations for this character
    this.currentAnims = [];
    const allAnims = this.anims.anims;
    allAnims.each((animKey) => {
      if (char.prefix && animKey.startsWith(char.prefix + '-')) {
        this.currentAnims.push(animKey);
      }
    });

    // If no prefix-based anims found, check for texture-key-based anims
    if (this.currentAnims.length === 0) {
      allAnims.each((animKey) => {
        if (animKey.startsWith(char.key + '-') || animKey === char.key) {
          this.currentAnims.push(animKey);
        }
      });
    }

    this.currentAnims.sort();
    this.animIndex = Math.min(this.animIndex, Math.max(0, this.currentAnims.length - 1));

    // Create preview sprite centered
    const cx = this.cameras.main.width / 2;
    const cy = this.cameras.main.height / 2 + 10;
    const scale = Math.max(2, Math.floor(64 / char.frameSize) * 2);

    this.previewSprite = this.add.sprite(cx, cy, char.key, 0)
      .setScrollFactor(0).setDepth(10001).setScale(scale);

    this.animPaused = false;
    if (this.currentAnims.length > 0) {
      this.previewSprite.play(this.currentAnims[this.animIndex]);
    }

    this._refreshSpriteInfo();
  }

  _refreshSpriteInfo() {
    const char = CHARACTERS[this.charIndex];
    const animKey = this.currentAnims[this.animIndex] || '(none)';
    const frame = this.previewSprite ? this.previewSprite.frame.name : '?';
    const totalAnims = this.currentAnims.length;

    const pauseLabel = this.animPaused ? '  [PAUSED]' : '';
    const lines = [
      `Texture: ${char.key}`,
      `Frame size: ${char.frameSize}x${char.frameSize}`,
      `Anim prefix: ${char.prefix || '(none)'}`,
      `Animation: ${animKey}  [${this.animIndex + 1}/${totalAnims}]${pauseLabel}`,
      `Frame: ${frame}`,
      '',
      'Left/Right: cycle character',
      'Up/Down: cycle animation',
      'SPACE: pause/resume',
      '.: next frame (when paused)',
    ];
    this.infoText.setText(lines.join('\n'));
    this.outputText.setText(`Character ${this.charIndex + 1}/${CHARACTERS.length}: ${char.key}`);
  }

  _buildUIElements() {
    // Gather references to UI scene + game scene elements
    this.uiElements = [];

    const uiScene = this.scene.get('UI');
    const gameScene = this.scene.get('Game');

    if (uiScene) {
      if (uiScene.hearts && uiScene.hearts.length > 0) {
        this.uiElements.push({ label: 'Hearts', target: uiScene.hearts[0], scene: 'UI' });
      }
      if (uiScene.goldText) {
        this.uiElements.push({ label: 'Gold Text', target: uiScene.goldText, scene: 'UI' });
      }
      if (uiScene.xpBarFrame) {
        this.uiElements.push({ label: 'XP Bar', target: uiScene.xpBarFrame, scene: 'UI' });
      }
      if (uiScene.xpText) {
        this.uiElements.push({ label: 'XP Level Text', target: uiScene.xpText, scene: 'UI' });
      }
      if (uiScene.manaBarFrame) {
        this.uiElements.push({ label: 'Mana Bar', target: uiScene.manaBarFrame, scene: 'UI' });
      }
      if (uiScene.timeText) {
        this.uiElements.push({ label: 'Time Text', target: uiScene.timeText, scene: 'UI' });
      }
    }

    if (gameScene) {
      if (gameScene.questTrackerText) {
        this.uiElements.push({ label: 'Quest Tracker', target: gameScene.questTrackerText, scene: 'Game' });
      }
      if (gameScene.hintsBarText) {
        this.uiElements.push({ label: 'Hints Bar', target: gameScene.hintsBarText, scene: 'Game' });
      }
    }
  }

  _clearDragMarkers() {
    this.dragMarkers.forEach((m) => m.destroy());
    this.dragMarkers = [];
    this.dragging = null;
  }

  _createDragMarkers() {
    this._clearDragMarkers();

    const colors = [0xff4444, 0x44ff44, 0x4488ff, 0xffff44, 0xff44ff, 0x44ffff, 0xff8844, 0x8844ff, 0xffffff];

    this.uiElements.forEach((el, i) => {
      const t = el.target;
      const color = colors[i % colors.length];
      const marker = this.add.rectangle(t.x, t.y, 8, 8, color, 0.8)
        .setScrollFactor(0).setDepth(10002).setInteractive({ draggable: true, useHandCursor: true });

      // Label inside marker
      const label = this.add.text(t.x, t.y, `${i + 1}`, {
        fontSize: '10px', fontFamily: 'Arial, sans-serif',
        color: '#000000',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(10003);

      marker._debugIndex = i;
      marker._debugLabel = label;

      marker.on('pointerdown', () => {
        this.uiSelectedIndex = i;
        this._refreshUIInfo();
      });

      marker.on('drag', (pointer, dragX, dragY) => {
        el.target.x = Math.round(dragX);
        el.target.y = Math.round(dragY);
        marker.setPosition(Math.round(dragX), Math.round(dragY));
        label.setPosition(Math.round(dragX), Math.round(dragY));
        this.uiSelectedIndex = i;
        this._refreshUIInfo();
      });

      this.dragMarkers.push(marker);
      this.dragMarkers.push(label);
    });

    // Enable drag input
    this.input.setDraggable(this.dragMarkers.filter((m) => m._debugIndex !== undefined));
  }

  _updateDragMarkerPositions() {
    // Sync markers to current element positions
    this.dragMarkers.forEach((m) => {
      if (m._debugIndex !== undefined) {
        const el = this.uiElements[m._debugIndex];
        if (el) {
          m.setPosition(el.target.x, el.target.y);
          m._debugLabel.setPosition(el.target.x, el.target.y);
        }
      }
    });
  }

  _refreshUIInfo() {
    if (this.mode !== 'ui') return;
    this._refreshUITweakerPanel();
  }

  update() {
    // TAB: toggle mode
    if (Phaser.Input.Keyboard.JustDown(this.keys.tab)) {
      if (this.mode === 'sprite') {
        this._buildUITweaker();
      } else {
        this._buildSpriteViewer();
      }
      return;
    }

    // ESC: close
    if (Phaser.Input.Keyboard.JustDown(this.keys.esc)) {
      this._close();
      return;
    }

    if (this.mode === 'sprite') {
      this._updateSpriteViewer();
    } else {
      this._updateUITweaker();
    }
  }

  _updateSpriteViewer() {
    let changed = false;

    // Left/Right: cycle character
    if (Phaser.Input.Keyboard.JustDown(this.keys.left)) {
      this.charIndex = (this.charIndex - 1 + CHARACTERS.length) % CHARACTERS.length;
      this.animIndex = 0;
      this._loadCharacter();
      changed = true;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.right)) {
      this.charIndex = (this.charIndex + 1) % CHARACTERS.length;
      this.animIndex = 0;
      this._loadCharacter();
      changed = true;
    }

    // Up/Down: cycle animation
    if (this.currentAnims.length > 0) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.up)) {
        this.animIndex = (this.animIndex - 1 + this.currentAnims.length) % this.currentAnims.length;
        this.animPaused = false;
        this.previewSprite.play(this.currentAnims[this.animIndex]);
        changed = true;
      }
      if (Phaser.Input.Keyboard.JustDown(this.keys.down)) {
        this.animIndex = (this.animIndex + 1) % this.currentAnims.length;
        this.animPaused = false;
        this.previewSprite.play(this.currentAnims[this.animIndex]);
        changed = true;
      }
    }

    // SPACE: pause/resume animation
    if (Phaser.Input.Keyboard.JustDown(this.keys.space) && this.previewSprite) {
      if (this.animPaused) {
        this.previewSprite.anims.resume();
        this.animPaused = false;
      } else {
        this.previewSprite.anims.pause();
        this.animPaused = true;
      }
      changed = true;
    }

    // PERIOD: step to next frame (while paused)
    if (Phaser.Input.Keyboard.JustDown(this.keys.period) && this.previewSprite && this.currentAnims.length > 0) {
      if (!this.animPaused) {
        this.previewSprite.anims.pause();
        this.animPaused = true;
      }
      this.previewSprite.anims.nextFrame();
      changed = true;
    }

    if (changed) {
      this._refreshSpriteInfo();
    }

    // Update frame number live
    if (this.previewSprite) {
      const frame = this.previewSprite.frame.name;
      const char = CHARACTERS[this.charIndex];
      const animKey = this.currentAnims[this.animIndex] || '(none)';
      const totalAnims = this.currentAnims.length;
      const pauseLabel = this.animPaused ? '  [PAUSED]' : '';
      const lines = [
        `Texture: ${char.key}`,
        `Frame size: ${char.frameSize}x${char.frameSize}`,
        `Anim prefix: ${char.prefix || '(none)'}`,
        `Animation: ${animKey}  [${this.animIndex + 1}/${totalAnims}]${pauseLabel}`,
        `Frame: ${frame}`,
        '',
        'Left/Right: cycle character',
        'Up/Down: cycle animation',
        'SPACE: pause/resume',
        '.: next frame (when paused)',
      ];
      this.infoText.setText(lines.join('\n'));
    }
  }

  _updateUITweaker() {
    if (this.uiElements.length === 0) return;

    // Number keys 1-9 to select
    const numKeys = [this.keys.one, this.keys.two, this.keys.three, this.keys.four,
      this.keys.five, this.keys.six, this.keys.seven, this.keys.eight, this.keys.nine];
    for (let i = 0; i < numKeys.length; i++) {
      if (Phaser.Input.Keyboard.JustDown(numKeys[i]) && i < this.uiElements.length) {
        this.uiSelectedIndex = i;
        this._refreshUIInfo();
        return;
      }
    }

    const el = this.uiElements[this.uiSelectedIndex];
    if (!el) return;

    const step = this.keys.shift.isDown ? 5 : 1;
    let changed = false;

    // Arrow keys nudge position
    if (Phaser.Input.Keyboard.JustDown(this.keys.left)) {
      el.target.x -= step;
      changed = true;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.right)) {
      el.target.x += step;
      changed = true;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.up)) {
      el.target.y -= step;
      changed = true;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.down)) {
      el.target.y += step;
      changed = true;
    }

    // +/- adjust scale
    if (Phaser.Input.Keyboard.JustDown(this.keys.plus)) {
      el.target.setScale((el.target.scaleX || 1) + 0.1);
      changed = true;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.minus)) {
      const newScale = Math.max(0.1, (el.target.scaleX || 1) - 0.1);
      el.target.setScale(newScale);
      changed = true;
    }

    if (changed) {
      this._updateDragMarkerPositions();
      this._refreshUIInfo();
    }
  }

  _close() {
    this._clearDragMarkers();
    this._destroyUITweakerPanel();
    this.input.keyboard.removeAllKeys(true);
    this.scene.stop('Debug');
  }
}
