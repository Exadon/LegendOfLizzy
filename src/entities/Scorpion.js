import Phaser from 'phaser';

export class Scorpion extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, null);

    scene.add.existing(this);
    scene.physics.add.existing(this, false);

    this.body.setSize(12, 10);
    this.body.setOffset(-6, -5);
    this.setCollideWorldBounds(true);
    this.setVisible(false);

    this.health = 3;
    this.damage = 2;
    this.speed = 40;
    this.enemyType = 'scorpion';
    this.isHurt = false;
    this.hurtTimer = 0;

    // Visuals: procedural scorpion
    this.scorpBody = scene.add.ellipse(x, y, 10, 8, 0xaa6622);
    this.scorpBody.setDepth(y);
    this.clawL = scene.add.circle(x - 6, y - 3, 3, 0xcc7733);
    this.clawL.setDepth(y + 1);
    this.clawR = scene.add.circle(x + 6, y - 3, 3, 0xcc7733);
    this.clawR.setDepth(y + 1);
    // Tail (curved line of circles)
    this.tail1 = scene.add.circle(x, y + 5, 2, 0xaa6622);
    this.tail1.setDepth(y);
    this.tail2 = scene.add.circle(x, y + 9, 2, 0xaa6622);
    this.tail2.setDepth(y);
    this.stinger = scene.add.circle(x, y + 12, 1.5, 0xff4444);
    this.stinger.setDepth(y + 1);

    this.detectRange = 70;
    this.wanderTimer = 0;
    this.wanderDirection = { x: 0, y: 0 };
  }

  update(time, delta, player) {
    if (this.isHurt) {
      this.hurtTimer -= delta;
      if (this.hurtTimer <= 0) this.isHurt = false;
      this._updateVisuals(time);
      return;
    }

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    if (dist < this.detectRange) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
      this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
    } else {
      this.wanderTimer -= delta;
      if (this.wanderTimer <= 0) {
        this.wanderTimer = 1000 + Math.random() * 2000;
        if (Math.random() < 0.3) {
          this.wanderDirection = { x: 0, y: 0 };
        } else {
          const a = Math.random() * Math.PI * 2;
          this.wanderDirection = { x: Math.cos(a), y: Math.sin(a) };
        }
      }
      this.setVelocity(this.wanderDirection.x * this.speed * 0.4, this.wanderDirection.y * this.speed * 0.4);
    }

    this._updateVisuals(time);
  }

  _updateVisuals(time) {
    const sway = Math.sin(time / 200) * 1;
    this.scorpBody.setPosition(this.x, this.y);
    this.scorpBody.setDepth(this.y);
    this.clawL.setPosition(this.x - 6 + sway, this.y - 3);
    this.clawL.setDepth(this.y + 1);
    this.clawR.setPosition(this.x + 6 - sway, this.y - 3);
    this.clawR.setDepth(this.y + 1);
    this.tail1.setPosition(this.x, this.y + 5);
    this.tail1.setDepth(this.y);
    this.tail2.setPosition(this.x + sway, this.y + 9);
    this.tail2.setDepth(this.y);
    this.stinger.setPosition(this.x + sway * 1.5, this.y + 12);
    this.stinger.setDepth(this.y + 1);
  }

  takeDamage(amount, fromX, fromY) {
    this.health -= amount;
    this.isHurt = true;
    this.hurtTimer = 250;

    this.scorpBody.setFillStyle(0xffffff);
    this.scene.time.delayedCall(60, () => {
      if (this.scorpBody.active) this.scorpBody.setFillStyle(0xaa6622);
    });

    if (fromX !== undefined) {
      const angle = Phaser.Math.Angle.Between(fromX, fromY, this.x, this.y);
      this.setVelocity(Math.cos(angle) * 120, Math.sin(angle) * 120);
    }

    if (this.health <= 0) {
      this._destroyVisuals();
      this.destroy();
    }
  }

  _destroyVisuals() {
    this.scorpBody.destroy();
    this.clawL.destroy();
    this.clawR.destroy();
    this.tail1.destroy();
    this.tail2.destroy();
    this.stinger.destroy();
  }
}
