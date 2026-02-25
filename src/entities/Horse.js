import Phaser from 'phaser';

export class Horse extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, null);

    scene.add.existing(this);
    scene.physics.add.existing(this, false);

    this.body.setSize(26, 14);
    this.body.setOffset(-13, -7);
    this.setCollideWorldBounds(true);
    this.setVisible(false);

    this.isMounted = false;

    // Procedural visuals — chestnut horse
    this._bodyRect = scene.add.rectangle(x, y, 26, 14, 0x8b4513);
    this._bodyRect.setDepth(y);
    this._neck = scene.add.rectangle(x + 12, y - 8, 7, 10, 0x7a3a10);
    this._neck.setDepth(y);
    this._head = scene.add.rectangle(x + 17, y - 13, 9, 8, 0x7a3a10);
    this._head.setDepth(y);
    this._mane = scene.add.rectangle(x + 13, y - 12, 3, 12, 0x3a1a00);
    this._mane.setDepth(y + 0.1);
    this._leg1 = scene.add.rectangle(x - 8,  y + 10, 4, 7, 0x7a3a10);
    this._leg2 = scene.add.rectangle(x - 2,  y + 10, 4, 7, 0x7a3a10);
    this._leg3 = scene.add.rectangle(x + 4,  y + 10, 4, 7, 0x7a3a10);
    this._leg4 = scene.add.rectangle(x + 10, y + 10, 4, 7, 0x7a3a10);
    for (const l of [this._leg1, this._leg2, this._leg3, this._leg4]) l.setDepth(y - 1);
    this._tail = scene.add.ellipse(x - 14, y, 6, 10, 0x3a1a00);
    this._tail.setDepth(y - 0.5);
    this._rider = scene.add.circle(x, y - 18, 5, 0xff9966);
    this._rider.setDepth(y + 1).setVisible(false);

    this._prompt = null;
  }

  _syncVisuals() {
    const x = this.x, y = this.y;
    this._bodyRect.setPosition(x, y).setDepth(y);
    this._neck.setPosition(x + 12, y - 8).setDepth(y);
    this._head.setPosition(x + 17, y - 13).setDepth(y);
    this._mane.setPosition(x + 13, y - 12).setDepth(y + 0.1);
    this._leg1.setPosition(x - 8,  y + 10).setDepth(y - 1);
    this._leg2.setPosition(x - 2,  y + 10).setDepth(y - 1);
    this._leg3.setPosition(x + 4,  y + 10).setDepth(y - 1);
    this._leg4.setPosition(x + 10, y + 10).setDepth(y - 1);
    this._tail.setPosition(x - 14, y).setDepth(y - 0.5);
    this._rider.setPosition(x, y - 18).setDepth(y + 1);
    if (this._prompt) this._prompt.setPosition(x, y - 28).setDepth(9999);
  }

  mount() {
    this.isMounted = true;
    this.body.enable = false;
    this._rider.setVisible(true);
    if (!this._prompt) {
      this._prompt = this.scene.add.text(this.x, this.y - 28, '[E] Dismount', {
        fontSize: '8px', fontFamily: 'Arial, sans-serif',
        color: '#ffdd44', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(9999);
    } else {
      this._prompt.setText('[E] Dismount').setVisible(true);
    }
  }

  dismount(px, py) {
    this.isMounted = false;
    this.body.enable = true;
    this._rider.setVisible(false);
    this.setPosition(px + 24, py);
    if (this._prompt) this._prompt.setVisible(false);
  }

  update(time, delta, player) {
    if (this.isMounted) {
      this.setPosition(player.x, player.y + 8);
      this._syncVisuals();
      this.setDepth(player.y + 1);
      // Keep dismount prompt visible while mounted
      if (this._prompt) {
        this._prompt.setPosition(player.x, player.y - 20).setVisible(true);
      }
      return;
    }

    // Show mount prompt when nearby
    const pd = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (pd < 36) {
      if (!this._prompt) {
        this._prompt = this.scene.add.text(this.x, this.y - 28, '[E] Mount', {
          fontSize: '8px', fontFamily: 'Arial, sans-serif',
          color: '#ffdd44', stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(9999);
      } else {
        this._prompt.setText('[E] Mount');
      }
      this._prompt.setPosition(this.x, this.y - 28).setVisible(true);
    } else {
      if (this._prompt) this._prompt.setVisible(false);
    }

    this._syncVisuals();
    this.setDepth(this.y);
  }

  _destroyVisuals() {
    for (const obj of [this._bodyRect, this._neck, this._head, this._mane,
        this._leg1, this._leg2, this._leg3, this._leg4,
        this._tail, this._rider, this._prompt]) {
      if (obj && obj.active) obj.destroy();
    }
    this._bodyRect = this._neck = this._head = this._mane = null;
    this._leg1 = this._leg2 = this._leg3 = this._leg4 = null;
    this._tail = this._rider = this._prompt = null;
  }
}
