import Phaser from 'phaser';
import { ITEMS } from '../systems/Inventory.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super('UI');
  }

  create() {
    const w = this.cameras.main.width;
    const BAR_H = 38;

    // --- HUD bar background ---
    this.add.rectangle(w / 2, BAR_H / 2, w, BAR_H, 0x111122)
      .setScrollFactor(0).setDepth(98);
    // Bottom border
    this.add.rectangle(w / 2, BAR_H, w, 1, 0x333366)
      .setScrollFactor(0).setDepth(99);

    // --- Row 1 (y:3) : Hearts | Gold | Time center | Inventory right ---

    // Hearts display
    this.hearts = [];
    this.maxHearts = 3;
    this.currentHealth = 6;
    this.drawHearts(6, 6);

    // Gold coin icon + number (right of hearts with 12px gap)
    this.goldCoin = this.add.circle(52, 9, 4, 0xffdd00);
    this.goldCoin.setScrollFactor(0).setDepth(100);
    this.goldText = this.add.text(60, 4, '', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffdd00',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(100);
    this.updateGold(0);

    // Level display (right of gold with 12px gap)
    this.xpText = this.add.text(104, 4, 'Lv.1', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#44bb44',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(100);

    // Time of day (centered)
    this.timeText = this.add.text(w / 2, 4, '', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#aaaacc',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);

    // Inventory hotbar (right side, row 1)
    this.inventorySlots = [];
    this.drawInventory([null, null, null]);

    // --- Row 2 (y:20) : XP bar | Mana bar ---

    // XP bar
    this.xpBarFrame = this.add.rectangle(4, 20, 68, 6, 0x5c3a1e);
    this.xpBarFrame.setOrigin(0, 0).setScrollFactor(0).setDepth(99);
    this.xpBarBg = this.add.rectangle(5, 21, 66, 4, 0x222211);
    this.xpBarBg.setOrigin(0, 0).setScrollFactor(0).setDepth(100);
    this.xpBarFill = this.add.rectangle(5, 21, 0, 4, 0x44bb44);
    this.xpBarFill.setOrigin(0, 0).setScrollFactor(0).setDepth(101);
    this.updateXP(0, 100, 1);

    // Mana bar
    this.manaBarFrame = this.add.rectangle(4, 28, 68, 6, 0x5c3a1e);
    this.manaBarFrame.setOrigin(0, 0).setScrollFactor(0).setDepth(99);
    this.manaBarBg = this.add.rectangle(5, 29, 66, 4, 0x111122);
    this.manaBarBg.setOrigin(0, 0).setScrollFactor(0).setDepth(100);
    this.manaBarFill = this.add.rectangle(5, 29, 66, 4, 0x4488ff);
    this.manaBarFill.setOrigin(0, 0).setScrollFactor(0).setDepth(101);

    // Spell indicator (next to mana bar)
    this.spellIcon = this.add.circle(78, 31, 3, 0x2266ff);
    this.spellIcon.setScrollFactor(0).setDepth(101);
    this.spellLabel = this.add.text(84, 28, 'F', {
      fontSize: '8px', fontFamily: 'Arial, sans-serif', color: '#cccccc',
      stroke: '#000000', strokeThickness: 2,
    }).setScrollFactor(0).setDepth(101);

    // --- Events ---
    const gameScene = this.scene.get('Game');

    gameScene.events.on('player-health-changed', (health, maxHealth) => {
      this.currentHealth = health;
      this.maxHearts = maxHealth / 2;
      this.drawHearts(health, maxHealth);
    });

    gameScene.events.on('gold-changed', (gold) => {
      this.updateGold(gold);
    });

    gameScene.events.on('xp-changed', (xp, xpToNext, level) => {
      this.updateXP(xp, xpToNext, level);
    });

    gameScene.events.on('inventory-changed', (slots) => {
      this.drawInventory(slots);
    });

    gameScene.events.on('mana-changed', (mana, maxMana) => {
      this.manaBarFill.width = 66 * (mana / maxMana);
    });

    gameScene.events.on('time-changed', (label) => {
      this.timeText.setText(label);
      // Color the time text based on time of day
      const TIME_COLORS = {
        Night: '#8899ff', Dawn: '#ffcc66', Morning: '#ffffcc',
        Afternoon: '#ffffff', Dusk: '#ffaa44', Evening: '#ff8877',
      };
      this.timeText.setColor(TIME_COLORS[label] || '#ffffff');
    });

    gameScene.events.on('spell-changed', (index, spell) => {
      this.spellIcon.setFillStyle(spell.color);
      // Show abbreviated spell name next to keybind (e.g. "F: Ice")
      const abbr = spell.name ? spell.name.split(' ')[0].substring(0, 5) : 'F';
      this.spellLabel.setText(`F:${abbr}`);
    });

    gameScene.events.on('auto-saved', () => {
      this.showSaveIcon();
    });

    // Boss HP bar events
    gameScene.events.on('boss-ui-update', ({ name, hp, maxHp }) => {
      if (!this._bossBarBg) this._createBossBar();
      this._bossBarBg.setVisible(true);
      this._bossBarFill.setVisible(true);
      this._bossNameText.setVisible(true);
      const pct = Math.max(0, hp / maxHp);
      this._bossBarFill.setSize(Math.round(160 * pct), 5);
      this._bossNameText.setText(name);
    }, this);

    gameScene.events.on('boss-ui-hide', () => {
      if (this._bossBarBg) {
        this._bossBarBg.setVisible(false);
        this._bossBarFill.setVisible(false);
        this._bossNameText.setVisible(false);
      }
    }, this);
  }

  _createBossBar() {
    const cx = 160; // center of 320px viewport
    this._bossNameText = this.add.text(cx, 39, '', {
      fontSize: '8px', fontFamily: 'Arial, sans-serif',
      color: '#ffddaa', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(200);
    this._bossBarBg = this.add.rectangle(cx, 48, 160, 5, 0x330000)
      .setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(200);
    this._bossBarFill = this.add.rectangle(cx - 80, 48, 160, 5, 0xdd2222)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(201);
    this._bossBarBg.setVisible(false);
    this._bossBarFill.setVisible(false);
    this._bossNameText.setVisible(false);
  }

  showSaveIcon() {
    const w = this.cameras.main.width;
    const icon = this.add.text(w - 4, 20, '\u{1F4BE}', {
      fontSize: '12px',
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
    const startX = 4;
    const startY = 4;
    const numHearts = maxHealth / 2;

    for (let i = 0; i < numHearts; i++) {
      const x = startX + i * (heartSize + padding);
      const heartValue = Math.max(0, Math.min(2, health - i * 2));

      const heart = this.add.image(x, startY, 'ui-icons', 0);
      heart.setOrigin(0, 0).setScrollFactor(0).setDepth(100);
      heart.setDisplaySize(heartSize, heartSize);

      if (heartValue >= 2) {
        // Full heart — no tint
      } else if (heartValue >= 1) {
        // Half heart — yellow tint so it's clearly different from full (red) or empty (grey)
        heart.setTint(0xffdd44);
        heart.setAlpha(0.85);
      } else {
        // Empty heart — grey, dim
        heart.setTint(0x444444);
        heart.setAlpha(0.45);
      }

      this.hearts.push(heart);
    }
  }

  updateGold(gold) {
    this.goldText.setText(`${gold}`);
  }

  updateXP(xp, xpToNext, level) {
    const fill = Math.min(xp / xpToNext, 1) * 66;
    this.xpBarFill.width = fill;
    this.xpText.setText(`Lv.${level}`);
  }

  drawInventory(slots) {
    this.inventorySlots.forEach((el) => el.destroy());
    this.inventorySlots = [];

    const w = this.cameras.main.width;
    const slotSize = 18;
    const padding = 2;
    const startX = w - (slotSize + padding) * 3 - 2;
    const startY = 3;

    for (let i = 0; i < 3; i++) {
      const x = startX + i * (slotSize + padding);
      const slot = slots[i];

      // Slot background
      const bg = this.add.nineslice(
        x + slotSize / 2, startY + slotSize / 2,
        'ui-frames', 'panel-orange',
        slotSize, slotSize, 6, 6, 6, 6
      );
      bg.setScrollFactor(0).setDepth(100);
      this.inventorySlots.push(bg);

      // Key number label (top-left corner, small)
      const keyLabel = this.add.text(x + 2, startY + 1, `${i + 1}`, {
        fontSize: '8px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0, 0).setScrollFactor(0).setDepth(103);
      this.inventorySlots.push(keyLabel);

      if (slot) {
        const item = ITEMS[slot.itemId];
        if (item) {
          const icon = this.add.circle(x + slotSize / 2, startY + slotSize / 2, 5, item.color);
          icon.setScrollFactor(0).setDepth(101);
          this.inventorySlots.push(icon);

          if (slot.count > 1) {
            const countText = this.add.text(x + slotSize - 2, startY + slotSize - 2, `${slot.count}`, {
              fontSize: '12px',
              fontFamily: 'Arial, sans-serif',
              color: '#ffffff',
              stroke: '#000000',
              strokeThickness: 2,
            }).setOrigin(1, 1).setScrollFactor(0).setDepth(103);
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

    const overlay = this.add.rectangle(cx, cy, w, h, 0x000000, 0)
      .setScrollFactor(0).setDepth(2000);
    this.tweens.add({ targets: overlay, alpha: 0.7, duration: 800 });

    const deathPanel = this.add.nineslice(
      cx, cy, 'ui-frames', 'panel-red',
      180, 100, 8, 8, 8, 8
    ).setScrollFactor(0).setDepth(2001).setAlpha(0);
    this.tweens.add({ targets: deathPanel, alpha: 1, duration: 600, delay: 300 });

    const diedText = this.add.text(cx, cy - 30, 'YOU DIED', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#ff6666',
      stroke: '#220000',
      strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2002).setAlpha(0);
    this.tweens.add({
      targets: diedText,
      alpha: 1,
      y: cy - 16,
      duration: 600,
      delay: 400,
      ease: 'Power2',
    });

    const gameScene = this.scene.get('Game');
    const level = gameScene.level || 1;
    const gold = gameScene.gold || 0;

    const statsText = this.add.text(cx, cy + 4, `Level ${level}  |  ${gold} Gold`, {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#ddbbbb',
      stroke: '#220000',
      strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2002).setAlpha(0);
    this.tweens.add({ targets: statsText, alpha: 1, duration: 400, delay: 900 });

    const opt1 = this.add.text(cx, cy + 22, 'ENTER: Continue', {
      fontSize: '12px', fontFamily: 'Arial, sans-serif', color: '#ffdd88',
      stroke: '#220000', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2002).setAlpha(0);

    this.tweens.add({ targets: opt1, alpha: 1, duration: 400, delay: 1200 });

    this.time.delayedCall(1400, () => {
      this.tweens.add({
        targets: opt1,
        alpha: { from: 1, to: 0.4 },
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    });

    this.time.delayedCall(1200, () => {
      this.input.keyboard.once('keydown-ENTER', () => {
        this.scene.stop('UI');
        this.scene.stop('Game');
        this.scene.start('Title');
      });
    });
  }
}
