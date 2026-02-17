import Phaser from 'phaser';

const FISH_TYPES = [
  { name: 'Minnow', gold: 3, xp: 5, difficulty: 0.6, color: 0xaabbcc },
  { name: 'Trout', gold: 8, xp: 12, difficulty: 0.45, color: 0x88aa66 },
  { name: 'Bass', gold: 15, xp: 20, difficulty: 0.35, color: 0x558844 },
  { name: 'Golden Carp', gold: 40, xp: 50, difficulty: 0.2, color: 0xffcc00 },
];

export class FishingMinigame {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this.container = null;
  }

  start() {
    if (this.active) return;
    this.active = true;

    const scene = this.scene;
    const cam = scene.cameras.main;
    const cx = cam.width / 2;
    const cy = cam.height / 2;

    // Pick a random fish (weighted by difficulty)
    const roll = Math.random();
    let cumulative = 0;
    this.fish = FISH_TYPES[0];
    for (const f of FISH_TYPES) {
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
    const barY = cy - 20;

    const barBg = scene.add.rectangle(cx, barY + barH / 2, barW, barH, 0x333333);
    barBg.setStrokeStyle(1, 0x888888);
    this.container.add(barBg);

    // Target zone (green)
    const zoneW = barW * (0.15 + this.fish.difficulty * 0.15);
    const zoneX = cx - barW / 2 + Math.random() * (barW - zoneW);
    const zone = scene.add.rectangle(
      zoneX + zoneW / 2, barY + barH / 2, zoneW, barH - 2, 0x44cc44, 0.6
    );
    this.container.add(zone);

    // Moving indicator
    this.indicator = scene.add.rectangle(barX + 2, barY + barH / 2, 4, barH - 2, 0xffffff);
    this.container.add(this.indicator);

    // Text
    const title = scene.add.text(cx, barY - 14, 'FISHING! Press SPACE', {
      fontSize: '7px', fontFamily: 'CuteFantasy', color: '#88ccff',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);
    this.container.add(title);

    const fishLabel = scene.add.text(cx, barY + barH + 8, `${this.fish.name} spotted!`, {
      fontSize: '6px', fontFamily: 'CuteFantasy', color: '#ffdd00',
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

    // Space key listener
    this._spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  update(delta) {
    if (!this.active || this.resolved) return;

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

  _catchSuccess() {
    const scene = this.scene;
    scene.sfx.play('pickup');
    scene.showNotification(`Caught a ${this.fish.name}! +${this.fish.gold}g +${this.fish.xp}XP`);
    scene.addGold(this.fish.gold);
    scene.addXP(this.fish.xp);

    // Track fishing quest if any
    const updated = scene.questManager.trackEvent('fish', { target: 'any' });
    if (updated) scene.updateQuestTracker();

    this.scene.time.delayedCall(600, () => this.close());
  }

  _catchFail() {
    this.scene.sfx.play('playerHurt');
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
