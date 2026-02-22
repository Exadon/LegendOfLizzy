import Phaser from 'phaser';

const FISH_TYPES = [
  { name: 'Minnow', gold: 3, xp: 5, difficulty: 0.6, color: 0xaabbcc },
  { name: 'Trout', gold: 8, xp: 12, difficulty: 0.45, color: 0x88aa66 },
  { name: 'Bass', gold: 15, xp: 20, difficulty: 0.35, color: 0x558844 },
  { name: 'Golden Carp', gold: 40, xp: 50, difficulty: 0.2, color: 0xffcc00 },
];

const HARBOR_FISH = [
  { name: 'Minnow', gold: 3, xp: 5, difficulty: 0.5, color: 0xaabbcc },
  { name: 'Trout', gold: 8, xp: 12, difficulty: 0.4, color: 0x88aa66 },
  { name: 'Bass', gold: 15, xp: 20, difficulty: 0.32, color: 0x558844 },
  { name: 'Golden Carp', gold: 40, xp: 50, difficulty: 0.2, color: 0xffcc00 },
  { name: 'Mackerel', gold: 5, xp: 8, difficulty: 0.5, color: 0x88aacc },
  { name: 'Swordfish', gold: 60, xp: 80, difficulty: 0.15, color: 0x4477aa },
  { name: 'Pearl Oyster', gold: 100, xp: 150, difficulty: 0.08, color: 0xeeddff },
];

export class FishingMinigame {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this.container = null;
  }

  start(playerLevel = 1, isHarbor = false) {
    if (this.active) return;
    this.active = true;
    this._isHarbor = isHarbor;

    const scene = this.scene;
    const cam = scene.cameras.main;
    const cx = cam.width / 2;
    const cy = cam.height / 2;

    // Pick fish from appropriate pool (weighted by difficulty)
    const pool = isHarbor ? HARBOR_FISH : FISH_TYPES;
    const roll = Math.random();
    let cumulative = 0;
    this.fish = pool[0];
    for (const f of pool) {
      cumulative += f.difficulty;
      if (roll < cumulative) {
        this.fish = f;
        break;
      }
    }

    this.container = scene.add.container(0, 0)
      .setScrollFactor(0).setDepth(12000);

    // Semi-transparent backdrop
    const backdrop = scene.add.rectangle(cx, cy, cam.width, cam.height, 0x000000, 0.4);
    this.container.add(backdrop);

    // Fishing bar
    const barW = 120;
    const barH = 12;
    const barX = cx - barW / 2;
    const barY = cy - 24;

    const barBg = scene.add.rectangle(cx, barY + barH / 2, barW, barH, 0x333333);
    barBg.setStrokeStyle(1, 0x888888);
    this.container.add(barBg);

    // Level-scaled target zone (larger zone = easier)
    let zoneW = Math.min(50, 28 + playerLevel * 2);
    if (scene._fishLuckBonus) zoneW = Math.min(58, zoneW + 8);
    const zoneX = barX + Math.random() * (barW - zoneW);
    const zone = scene.add.rectangle(
      zoneX + zoneW / 2, barY + barH / 2, zoneW, barH - 2, 0x44cc44, 0.6
    );
    this.container.add(zone);

    // Moving indicator
    this.indicator = scene.add.rectangle(barX + 2, barY + barH / 2, 4, barH - 2, 0xffffff);
    this.container.add(this.indicator);

    // 12-second countdown bar (red bar below main bar)
    const timerBarY = barY + barH + 4;
    const timerBg = scene.add.rectangle(cx, timerBarY + 2, barW, 4, 0x333333);
    this._timerBarFg = scene.add.rectangle(barX, timerBarY + 2, barW, 4, 0xff4444).setOrigin(0, 0.5);
    this.container.add(timerBg);
    this.container.add(this._timerBarFg);

    // Text
    const title = scene.add.text(cx, barY - 14, 'FISHING! Press SPACE', {
      fontSize: '12px', fontFamily: 'Arial, sans-serif', color: '#88ccff',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);
    this.container.add(title);

    const harborTag = isHarbor ? ' [Harbor]' : '';
    const fishLabel = scene.add.text(cx, timerBarY + 10, `${this.fish.name} spotted!${harborTag}`, {
      fontSize: '12px', fontFamily: 'Arial, sans-serif', color: '#ffdd00',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);
    this.container.add(fishLabel);

    // State
    this.barX = barX;
    this.barW = barW;
    this.zoneLeft = zoneX;
    this.zoneRight = zoneX + zoneW;
    this.indicatorX = barX + 2;
    this.speed = 80 + (1 - this.fish.difficulty) * 60; // harder fish = faster
    this.direction = 1;
    this.resolved = false;
    this._countdown = 12000; // 12-second limit

    // Space key listener
    this._spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Fish cast SFX
    scene.sfx.play('fishCast');
  }

  update(delta) {
    if (!this.active || this.resolved) return;

    // Update countdown
    this._countdown -= delta;
    if (this._countdown <= 0) {
      this.resolved = true;
      this._timeout();
      return;
    }

    // Shrink countdown bar
    if (this._timerBarFg) {
      const pct = Math.max(0, this._countdown / 12000);
      this._timerBarFg.setSize(this.barW * pct, 4);
      this._timerBarFg.setFillStyle(pct < 0.33 ? 0xff2222 : 0xff4444);
    }

    // Move indicator
    this.indicatorX += this.direction * this.speed * (delta / 1000);
    if (this.indicatorX >= this.barX + this.barW - 4) {
      this.direction = -1;
    } else if (this.indicatorX <= this.barX + 2) {
      this.direction = 1;
    }
    this.indicator.setX(this.indicatorX + 2);

    // Check for space press
    if (Phaser.Input.Keyboard.JustDown(this._spaceKey)) {
      this.resolved = true;
      const center = this.indicatorX + 2;
      if (center >= this.zoneLeft && center <= this.zoneRight) {
        this._catchSuccess();
      } else {
        this._catchFail();
      }
    }
  }

  _timeout() {
    this.scene.showNotification('Got away!');
    this.scene.sfx.play('menuCancel');
    this.scene.time.delayedCall(600, () => this.close());
  }

  _catchSuccess() {
    const scene = this.scene;
    scene.sfx.play('fishCatch');

    let gold = this.fish.gold;
    let xp = this.fish.xp;
    let bonusText = '';

    if (this._isHarbor) {
      gold = Math.round(gold * 1.5);
      xp = Math.round(xp * 1.5);
      bonusText = ' Harbor bonus!';
    }

    scene.showNotification(`Caught a ${this.fish.name}! +${gold}g +${xp}XP${bonusText}`);
    scene.addGold(gold);
    scene.addXP(xp);

    // Track fish count for achievements
    scene._fishCount = (scene._fishCount || 0) + 1;
    if (scene._checkAchievements) scene._checkAchievements();

    // Track fishing quest
    const updated = scene.questManager.trackEvent('fish', { target: 'any' });
    if (updated) scene.updateQuestTracker();

    this.scene.time.delayedCall(600, () => this.close());
  }

  _catchFail() {
    this.scene.sfx.play('menuCancel');
    this.scene.showNotification('The fish got away...');
    this.scene.time.delayedCall(600, () => this.close());
  }

  close() {
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
    this.active = false;
  }
}
