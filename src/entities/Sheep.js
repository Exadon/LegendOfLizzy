import Phaser from 'phaser';

export class Sheep extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, null);

    scene.add.existing(this);
    scene.physics.add.existing(this, false);

    this.body.setSize(14, 10);
    this.body.setOffset(-7, -5);
    this.setCollideWorldBounds(true);
    this.setVisible(false);

    this.homeX = x;
    this.homeY = y;
    this.speed = 15;

    this.isFed = false;
    this.hasWool = false;
    this._fedTimer = 0;
    this._wanderTimer = 0;
    this._wanderDir = { x: 0, y: 0 };

    // Procedural visuals
    this._bodyEll = scene.add.ellipse(x, y, 18, 12, 0xffffff);
    this._bodyEll.setDepth(y);
    this._head = scene.add.circle(x + 10, y - 3, 4, 0xdddddd);
    this._head.setDepth(y);
    this._leg1 = scene.add.rectangle(x - 5, y + 7, 3, 5, 0x888888);
    this._leg2 = scene.add.rectangle(x,     y + 7, 3, 5, 0x888888);
    this._leg3 = scene.add.rectangle(x + 5, y + 7, 3, 5, 0x888888);
    this._leg4 = scene.add.rectangle(x + 9, y + 7, 3, 5, 0x888888);
    for (const l of [this._leg1, this._leg2, this._leg3, this._leg4]) l.setDepth(y - 1);

    this._prompt = null;
  }

  _syncVisuals() {
    const x = this.x, y = this.y;
    this._bodyEll.setPosition(x, y).setDepth(y);
    this._head.setPosition(x + 10, y - 3).setDepth(y);
    this._leg1.setPosition(x - 5, y + 7).setDepth(y - 1);
    this._leg2.setPosition(x,     y + 7).setDepth(y - 1);
    this._leg3.setPosition(x + 5, y + 7).setDepth(y - 1);
    this._leg4.setPosition(x + 9, y + 7).setDepth(y - 1);
  }

  feed() {
    this.isFed = true;
    this._fedTimer = 5000;
  }

  harvest() {
    if (!this.hasWool) return false;
    this.hasWool = false;
    this.isFed = false;
    this._bodyEll.setFillStyle(0xffffff);
    return true;
  }

  update(time, delta, player) {
    // Fed timer — wool ready after 5s
    if (this.isFed && !this.hasWool) {
      this._fedTimer -= delta;
      if (this._fedTimer <= 0) {
        this.hasWool = true;
        this._bodyEll.setFillStyle(0xddffcc);
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
    if (this.hasWool && pd < 32) {
      if (!this._prompt) {
        this._prompt = this.scene.add.text(this.x, this.y - 18, '[E] Collect', {
          fontSize: '8px', fontFamily: 'Arial, sans-serif',
          color: '#ffffff', stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(9999);
      }
      this._prompt.setPosition(this.x, this.y - 18).setVisible(true);
    } else {
      if (this._prompt) this._prompt.setVisible(false);
    }

    this._syncVisuals();
    this.setDepth(this.y);
  }

  _destroyVisuals() {
    for (const obj of [this._bodyEll, this._head,
        this._leg1, this._leg2, this._leg3, this._leg4, this._prompt]) {
      if (obj && obj.active) obj.destroy();
    }
    this._bodyEll = this._head = null;
    this._leg1 = this._leg2 = this._leg3 = this._leg4 = this._prompt = null;
  }
}
