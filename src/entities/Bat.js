import Phaser from 'phaser';

export class Bat extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    // Create as a generic sprite — we'll draw bat visuals procedurally
    super(scene, x, y, null);

    scene.add.existing(this);
    scene.physics.add.existing(this, false);

    this.body.setSize(10, 8);
    this.body.setOffset(-5, -4);
    this.setCollideWorldBounds(true);
    this.setVisible(false); // We draw our own visuals

    // Stats
    this.health = 1;
    this.damage = 1;
    this.speed = 60;
    this.enemyType = 'bat';

    // AI
    this.homeX = x;
    this.homeY = y;
    this.aggroRange = 80;
    this.deaggroRange = 140;
    this.isAggro = false;
    this.swoopTimer = 0;
    this.swoopDir = { x: 0, y: 0 };

    // Visual: bat body + wings drawn as graphics
    this.batBody = scene.add.circle(x, y, 3, 0x332244);
    this.batBody.setDepth(y);
    this.wingL = scene.add.triangle(x - 4, y, 0, 0, -6, -4, -2, 4, 0x443355);
    this.wingL.setDepth(y);
    this.wingR = scene.add.triangle(x + 4, y, 0, 0, 6, -4, 2, 4, 0x443355);
    this.wingR.setDepth(y);

    // Wing flap
    this.flapTime = 0;
  }

  update(time, delta, player) {
    if (this.health <= 0) return;

    this.flapTime += delta;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (!this.isAggro && dist < this.aggroRange) {
      this.isAggro = true;
    } else if (this.isAggro && dist > this.deaggroRange) {
      this.isAggro = false;
    }

    if (this.isAggro) {
      // Erratic swooping toward player
      this.swoopTimer -= delta;
      if (this.swoopTimer <= 0) {
        this.swoopTimer = 300 + Math.random() * 400;
        const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.5;
        this.swoopDir = { x: Math.cos(angle), y: Math.sin(angle) };
      }
      this.setVelocity(this.swoopDir.x * this.speed, this.swoopDir.y * this.speed);
    } else {
      // Hover near home
      const hx = this.homeX - this.x;
      const hy = this.homeY - this.y;
      const homeDist = Math.sqrt(hx * hx + hy * hy);
      if (homeDist > 30) {
        this.setVelocity((hx / homeDist) * 20, (hy / homeDist) * 20);
      } else {
        this.setVelocity(
          Math.sin(time / 500) * 10,
          Math.cos(time / 400) * 8
        );
      }
    }

    // Update visuals
    this.batBody.setPosition(this.x, this.y);
    this.batBody.setDepth(this.y);

    const wingFlap = Math.sin(this.flapTime / 60) * 3;
    this.wingL.setPosition(this.x - 4, this.y + wingFlap);
    this.wingL.setDepth(this.y);
    this.wingR.setPosition(this.x + 4, this.y - wingFlap);
    this.wingR.setDepth(this.y);
  }

  takeDamage(amount, fromX, fromY) {
    this.health -= amount;
    if (this.health <= 0) {
      this.batBody.destroy();
      this.wingL.destroy();
      this.wingR.destroy();
      this.destroy();
    } else {
      // Knockback
      const dx = this.x - fromX;
      const dy = this.y - fromY;
      const mag = Math.sqrt(dx * dx + dy * dy) || 1;
      this.setVelocity((dx / mag) * 100, (dy / mag) * 100);

      // Flash
      this.batBody.setFillStyle(0xffffff);
      this.scene.time.delayedCall(80, () => {
        if (this.active && this.batBody && this.batBody.active) this.batBody.setFillStyle(0x332244);
      });
    }
  }
}
