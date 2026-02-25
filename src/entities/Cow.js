import Phaser from 'phaser';

export class Cow extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, null);

    scene.add.existing(this);
    scene.physics.add.existing(this, false);

    this.body.setSize(22, 13);
    this.body.setOffset(-11, -6);
    this.setCollideWorldBounds(true);
    this.setVisible(false);

    this.homeX = x;
    this.homeY = y;
    this.speed = 12;

    this.isFed = false;
    this.hasMilk = false;
    this._fedTimer = 0;
    this._wanderTimer = 0;
    this._wanderDir = { x: 0, y: 0 };

    // Procedural visuals
    this._bodyRect = scene.add.rectangle(x, y, 22, 13, 0x8b5a2b);
    this._bodyRect.setDepth(y);
    this._belly = scene.add.ellipse(x, y + 2, 16, 8, 0xfff8f0);
    this._belly.setDepth(y + 0.1);
    this._head = scene.add.rectangle(x + 13, y - 4, 10, 9, 0x7a4a20);
    this._head.setDepth(y);
    this._horn1 = scene.add.triangle(x + 10, y - 9, 0, 0, 4, -6, 8, 0, 0xd4aa70);
    this._horn2 = scene.add.triangle(x + 16, y - 9, 0, 0, 4, -6, 8, 0, 0xd4aa70);
    this._horn1.setDepth(y);
    this._horn2.setDepth(y);
    this._leg1 = scene.add.rectangle(x - 7, y + 9, 3, 6, 0x7a4a20);
    this._leg2 = scene.add.rectangle(x - 2, y + 9, 3, 6, 0x7a4a20);
    this._leg3 = scene.add.rectangle(x + 4, y + 9, 3, 6, 0x7a4a20);
    this._leg4 = scene.add.rectangle(x + 9, y + 9, 3, 6, 0x7a4a20);
    for (const l of [this._leg1, this._leg2, this._leg3, this._leg4]) l.setDepth(y - 1);

    this._prompt = null;
  }

  _syncVisuals() {
    const x = this.x, y = this.y;
    this._bodyRect.setPosition(x, y).setDepth(y);
    this._belly.setPosition(x, y + 2).setDepth(y + 0.1);
    this._head.setPosition(x + 13, y - 4).setDepth(y);
    this._horn1.setPosition(x + 10, y - 9).setDepth(y);
    this._horn2.setPosition(x + 16, y - 9).setDepth(y);
    this._leg1.setPosition(x - 7, y + 9).setDepth(y - 1);
    this._leg2.setPosition(x - 2, y + 9).setDepth(y - 1);
    this._leg3.setPosition(x + 4, y + 9).setDepth(y - 1);
    this._leg4.setPosition(x + 9, y + 9).setDepth(y - 1);
  }

  feed() {
    this.isFed = true;
    this._fedTimer = 7000;
  }

  harvest() {
    if (!this.hasMilk) return false;
    this.hasMilk = false;
    this.isFed = false;
    this._bodyRect.setFillStyle(0x8b5a2b);
    return true;
  }

  update(time, delta, player) {
    // Fed timer — milk ready after 7s
    if (this.isFed && !this.hasMilk) {
      this._fedTimer -= delta;
      if (this._fedTimer <= 0) {
        this.hasMilk = true;
        this._bodyRect.setFillStyle(0x6b8c4a);
      }
    }

    // Wander AI
    this._wanderTimer -= delta;
    if (this._wanderTimer <= 0) {
      this._wanderTimer = 800 + Math.random() * 1500;
      if (Math.random() < 0.4) {
        this._wanderDir = { x: 0, y: 0 };
      } else {
        const angle = Math.random() * Math.PI * 2;
        this._wanderDir = { x: Math.cos(angle), y: Math.sin(angle) };
      }
    }

    // Keep within home radius
    const dx = this.x - this.homeX;
    const dy = this.y - this.homeY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 48) {
      this._wanderDir = { x: -dx / dist, y: -dy / dist };
    }

    this.setVelocity(this._wanderDir.x * this.speed, this._wanderDir.y * this.speed);

    // Collect prompt
    const pd = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (this.hasMilk && pd < 32) {
      if (!this._prompt) {
        this._prompt = this.scene.add.text(this.x, this.y - 20, '[E] Collect', {
          fontSize: '8px', fontFamily: 'Arial, sans-serif',
          color: '#ffffff', stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(9999);
      }
      this._prompt.setPosition(this.x, this.y - 20).setVisible(true);
    } else {
      if (this._prompt) this._prompt.setVisible(false);
    }

    this._syncVisuals();
    this.setDepth(this.y);
  }

  _destroyVisuals() {
    for (const obj of [this._bodyRect, this._belly, this._head,
        this._horn1, this._horn2,
        this._leg1, this._leg2, this._leg3, this._leg4, this._prompt]) {
      if (obj && obj.active) obj.destroy();
    }
    this._bodyRect = this._belly = this._head = null;
    this._horn1 = this._horn2 = null;
    this._leg1 = this._leg2 = this._leg3 = this._leg4 = this._prompt = null;
  }
}
