import Phaser from 'phaser';
import { ITEMS } from '../systems/Inventory.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super('UI');
  }

  create() {
    // High-resolution text: render at 2x so text is crisp at zoom level
    const _origText = this.add.text.bind(this.add);
    this.add.text = (x, y, content, style) => {
      return _origText(x, y, content, Object.assign({}, style, { resolution: 2 }));
    };

    // Hearts display
    this.hearts = [];
    this.maxHearts = 3;
    this.currentHealth = 6;
    this.drawHearts(6, 6);

    // Gold display
    this.goldText = this.add.text(8, 24, '', {
      fontSize: '9px',
      fontFamily: 'CuteFantasy',
      color: '#ffdd00',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(100);
    this.updateGold(0);

    // XP bar (styled frame)
    this.xpBarFrame = this.add.rectangle(8, 38, 52, 7, 0x5c3a1e);
    this.xpBarFrame.setOrigin(0, 0).setScrollFactor(0).setDepth(99);
    this.xpBarBg = this.add.rectangle(9, 39, 50, 5, 0x222211);
    this.xpBarBg.setOrigin(0, 0).setScrollFactor(0).setDepth(100);
    this.xpBarFill = this.add.rectangle(9, 39, 0, 5, 0x44bb44);
    this.xpBarFill.setOrigin(0, 0).setScrollFactor(0).setDepth(101);
    this.xpText = this.add.text(62, 37, 'Lv.1', {
      fontSize: '7px',
      fontFamily: 'CuteFantasy',
      color: '#44bb44',
      stroke: '#000000',
      strokeThickness: 1,
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(100);
    this.updateXP(0, 100, 1);

    // Listen for events from game scene
    const gameScene = this.scene.get('Game');
    gameScene.events.on('player-health-changed', (health, maxHealth) => {
      this.currentHealth = health;
      this.maxHearts = maxHealth / 2;
      this.drawHearts(health, maxHealth);
    });

    // Paul rescues the player now, no game over screen needed

    gameScene.events.on('gold-changed', (gold) => {
      this.updateGold(gold);
    });

    gameScene.events.on('xp-changed', (xp, xpToNext, level) => {
      this.updateXP(xp, xpToNext, level);
    });

    // Inventory hotbar
    this.inventorySlots = [];
    this.drawInventory([null, null, null]);

    gameScene.events.on('inventory-changed', (slots) => {
      this.drawInventory(slots);
    });

    // Mana bar (styled frame)
    this.manaBarFrame = this.add.rectangle(8, 48, 52, 6, 0x5c3a1e);
    this.manaBarFrame.setOrigin(0, 0).setScrollFactor(0).setDepth(99);
    this.manaBarBg = this.add.rectangle(9, 49, 50, 4, 0x111122);
    this.manaBarBg.setOrigin(0, 0).setScrollFactor(0).setDepth(100);
    this.manaBarFill = this.add.rectangle(9, 49, 50, 4, 0x4488ff);
    this.manaBarFill.setOrigin(0, 0).setScrollFactor(0).setDepth(101);

    gameScene.events.on('mana-changed', (mana, maxMana) => {
      this.manaBarFill.width = 50 * (mana / maxMana);
    });

    // Time of day indicator
    this.timeText = this.add.text(this.cameras.main.width - 8, 26, '', {
      fontSize: '7px',
      fontFamily: 'CuteFantasy',
      color: '#aaaacc',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);

    gameScene.events.on('time-changed', (label) => {
      this.timeText.setText(label);
    });

    // Auto-save indicator
    gameScene.events.on('auto-saved', () => {
      this.showSaveIcon();
    });
  }

  showSaveIcon() {
    const w = this.cameras.main.width;
    const icon = this.add.text(w - 6, 46, '\u{1F4BE}', {
      fontSize: '10px',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(200).setAlpha(0);
    this.tweens.add({
      targets: icon,
      alpha: { from: 0, to: 0.8 },
      duration: 300,
      yoyo: true,
      hold: 600,
      onComplete: () => icon.destroy(),
    });
  }

  drawHearts(health, maxHealth) {
    this.hearts.forEach((h) => h.destroy());
    this.hearts = [];

    const heartSize = 11;
    const padding = 1;
    const startX = 8;
    const startY = 8;
    const numHearts = maxHealth / 2;

    for (let i = 0; i < numHearts; i++) {
      const x = startX + i * (heartSize + padding);
      const heartValue = Math.max(0, Math.min(2, health - i * 2));

      // Use heart icon from UI_Icons spritesheet (frame 0 = full red heart)
      const heart = this.add.image(x, startY, 'ui-icons', 0);
      heart.setOrigin(0, 0).setScrollFactor(0).setDepth(100);
      heart.setDisplaySize(heartSize, heartSize);

      if (heartValue >= 2) {
        // Full heart - no modification
      } else if (heartValue >= 1) {
        // Half heart - reduce alpha
        heart.setAlpha(0.55);
      } else {
        // Empty heart - dark tint
        heart.setTint(0x333333);
        heart.setAlpha(0.6);
      }

      this.hearts.push(heart);
    }
  }

  updateGold(gold) {
    this.goldText.setText(`Gold: ${gold}`);
  }

  updateXP(xp, xpToNext, level) {
    const fill = Math.min(xp / xpToNext, 1) * 50;
    this.xpBarFill.width = fill;
    this.xpText.setText(`Lv.${level}`);
  }

  drawInventory(slots) {
    // Clean up old elements
    this.inventorySlots.forEach((el) => el.destroy());
    this.inventorySlots = [];

    const w = this.cameras.main.width;
    const slotSize = 16;
    const padding = 2;
    const startX = w - (slotSize + padding) * 3 - 4;
    const startY = 6;

    for (let i = 0; i < 3; i++) {
      const x = startX + i * (slotSize + padding);
      const slot = slots[i];

      // Slot background using UI_Frames NineSlice panel
      const bg = this.add.nineslice(
        x + slotSize / 2, startY + slotSize / 2,
        'ui-frames', 'panel-orange',
        slotSize, slotSize, 6, 6, 6, 6
      );
      bg.setScrollFactor(0).setDepth(100);
      this.inventorySlots.push(bg);

      // Key number label
      const keyLabel = this.add.text(x + 1, startY + 1, `${i + 1}`, {
        fontSize: '6px',
        fontFamily: 'CuteFantasy',
        color: '#666688',
      }).setOrigin(0, 0).setScrollFactor(0).setDepth(102);
      this.inventorySlots.push(keyLabel);

      if (slot) {
        const item = ITEMS[slot.itemId];
        if (item) {
          // Potion icon (colored circle)
          const icon = this.add.circle(x + slotSize / 2, startY + slotSize / 2 - 1, 5, item.color);
          icon.setScrollFactor(0).setDepth(101);
          this.inventorySlots.push(icon);

          // Count
          if (slot.count > 1) {
            const countText = this.add.text(x + slotSize - 2, startY + slotSize - 2, `${slot.count}`, {
              fontSize: '7px',
              fontFamily: 'CuteFantasy',
              color: '#ffffff',
              stroke: '#000000',
              strokeThickness: 2,
            }).setOrigin(1, 1).setScrollFactor(0).setDepth(102);
            this.inventorySlots.push(countText);
          }
        }
      }
    }
  }

  showGameOver() {
    const cx = this.cameras.main.width / 2;
    const cy = this.cameras.main.height / 2;
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Full screen dark overlay - fade in
    const overlay = this.add.rectangle(cx, cy, w, h, 0x000000, 0)
      .setScrollFactor(0).setDepth(2000);
    this.tweens.add({ targets: overlay, alpha: 0.7, duration: 800 });

    // Red panel for death screen
    const deathPanel = this.add.nineslice(
      cx, cy, 'ui-frames', 'panel-red',
      180, 100, 8, 8, 8, 8
    ).setScrollFactor(0).setDepth(2001).setAlpha(0);
    this.tweens.add({ targets: deathPanel, alpha: 1, duration: 600, delay: 300 });

    // "YOU DIED" text - slides in from above
    const diedText = this.add.text(cx, cy - 30, 'YOU DIED', {
      fontSize: '16px',
      fontFamily: 'CuteFantasy',
      color: '#3d1010',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2002).setAlpha(0);
    this.tweens.add({
      targets: diedText,
      alpha: 1,
      y: cy - 16,
      duration: 600,
      delay: 400,
      ease: 'Power2',
    });

    // Get game stats
    const gameScene = this.scene.get('Game');
    const level = gameScene.level || 1;
    const gold = gameScene.gold || 0;

    const statsText = this.add.text(cx, cy + 4, `Level ${level}  |  ${gold} Gold`, {
      fontSize: '9px',
      fontFamily: 'CuteFantasy',
      color: '#5a2a2a',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2002).setAlpha(0);
    this.tweens.add({ targets: statsText, alpha: 1, duration: 400, delay: 900 });

    // Options - appear after delay
    const hasSave = localStorage.getItem('legendoflizzy_save') !== null;
    const opt1 = this.add.text(cx, cy + 22, hasSave ? 'ENTER: Load Save' : 'ENTER: Restart', {
      fontSize: '9px', fontFamily: 'CuteFantasy', color: '#2a1a08',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2002).setAlpha(0);

    const opt2 = hasSave ? this.add.text(cx, cy + 34, 'N: New Game', {
      fontSize: '9px', fontFamily: 'CuteFantasy', color: '#7a5a5a',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2002).setAlpha(0) : null;

    this.tweens.add({ targets: opt1, alpha: 1, duration: 400, delay: 1200 });
    if (opt2) this.tweens.add({ targets: opt2, alpha: 1, duration: 400, delay: 1300 });

    // Pulse the main option
    this.time.delayedCall(1400, () => {
      this.tweens.add({
        targets: opt1,
        alpha: { from: 1, to: 0.4 },
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    });

    // Input handling after delay
    this.time.delayedCall(1200, () => {
      this.input.keyboard.once('keydown-ENTER', () => {
        this.scene.stop('UI');
        this.scene.stop('Game');
        if (hasSave) {
          this.scene.start('Title');
        } else {
          this.scene.start('Game');
        }
      });
      if (hasSave) {
        this.input.keyboard.once('keydown-N', () => {
          localStorage.removeItem('legendoflizzy_save');
          this.scene.stop('UI');
          this.scene.stop('Game');
          this.scene.start('Game');
        });
      }
    });
  }
}
