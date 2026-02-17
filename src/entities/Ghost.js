import Phaser from 'phaser';

export class Ghost extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, null);

    scene.add.existing(this);
    scene.physics.add.existing(this, false);

    this.body.setSize(12, 12);
    this.body.setOffset(-6, -6);
    this.setCollideWorldBounds(true);
    this.setVisible(false);

    // Stats
    this.health = 2;
    this.damage = 2;
    this.speed = 30;
    this.enemyType = 'ghost';

    // Phase in/out
    this.phaseTimer = 0;
    this.phaseDuration = 2000; // 2s visible
    this.fadeOutDuration = 1500; // 1.5s invisible
    this.isPhased = false; // true = faded out (invulnerable)
    this.phaseAlpha = 1;

    // AI
    this.driftAngle = Math.random() * Math.PI * 2;
    this.homeX = x;
    this.homeY = y;

    // Visuals: ghostly circle with face
    this.ghostBody = scene.add.circle(x, y, 8, 0xccccff, 0.7);
    this.ghostBody.setDepth(y);
    this.ghostEyeL = scene.add.circle(x - 3, y - 2, 1.5, 0x222244);
    this.ghostEyeL.setDepth(y + 1);
    this.ghostEyeR = scene.add.circle(x + 3, y - 2, 1.5, 0x222244);
    this.ghostEyeR.setDepth(y + 1);
    this.ghostMouth = scene.add.circle(x, y + 2, 1, 0x222244);
    this.ghostMouth.setDepth(y + 1);

    // Tail effect
    this.ghostTail = scene.add.ellipse(x, y + 8, 10, 6, 0xccccff, 0.5);
    this.ghostTail.setDepth(y - 1);
  }

  update(time, delta, player) {
    if (this.health <= 0) return;

    // Phase cycling
    this.phaseTimer -= delta;
    if (this.phaseTimer <= 0) {
      this.isPhased = !this.isPhased;
      this.phaseTimer = this.isPhased ? this.fadeOutDuration : this.phaseDuration;
    }

    // Smooth alpha transition
    const targetAlpha = this.isPhased ? 0.1 : 0.7;
    this.phaseAlpha += (targetAlpha - this.phaseAlpha) * 0.05;

    // Drift toward player slowly
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 120 && dist > 10) {
      this.driftAngle = Math.atan2(dy, dx);
    } else {
      this.driftAngle += (Math.random() - 0.5) * 0.3;
    }

    // Leash to home
    const hx = this.homeX - this.x;
    const hy = this.homeY - this.y;
    const homeDist = Math.sqrt(hx * hx + hy * hy);
    if (homeDist > 100) {
      this.driftAngle = Math.atan2(hy, hx);
    }

    const spd = this.isPhased ? this.speed * 0.3 : this.speed;
    this.setVelocity(
      Math.cos(this.driftAngle) * spd + Math.sin(time / 800) * 8,
      Math.sin(this.driftAngle) * spd + Math.cos(time / 600) * 6
    );

    // Update visuals
    const bob = Math.sin(time / 400) * 2;
    this.ghostBody.setPosition(this.x, this.y + bob);
    this.ghostBody.setAlpha(this.phaseAlpha);
    this.ghostBody.setDepth(this.y);

    this.ghostEyeL.setPosition(this.x - 3, this.y - 2 + bob);
    this.ghostEyeL.setAlpha(this.phaseAlpha * 1.2);
    this.ghostEyeL.setDepth(this.y + 1);

    this.ghostEyeR.setPosition(this.x + 3, this.y - 2 + bob);
    this.ghostEyeR.setAlpha(this.phaseAlpha * 1.2);
    this.ghostEyeR.setDepth(this.y + 1);

    this.ghostMouth.setPosition(this.x, this.y + 2 + bob);
    this.ghostMouth.setAlpha(this.phaseAlpha * 1.2);
    this.ghostMouth.setDepth(this.y + 1);

    this.ghostTail.setPosition(this.x, this.y + 8 + bob);
    this.ghostTail.setAlpha(this.phaseAlpha * 0.5);
    this.ghostTail.setDepth(this.y - 1);
  }

  takeDamage(amount, fromX, fromY) {
    // Can't be hit while phased out
    if (this.isPhased) return;

    this.health -= amount;
    if (this.health <= 0) {
      this._destroyVisuals();
      this.destroy();
    } else {
      // Knockback
      const dx = this.x - fromX;
      const dy = this.y - fromY;
      const mag = Math.sqrt(dx * dx + dy * dy) || 1;
      this.setVelocity((dx / mag) * 80, (dy / mag) * 80);

      // Flash white
      this.ghostBody.setFillStyle(0xffffff);
      this.scene.time.delayedCall(80, () => {
        if (this.ghostBody.active) this.ghostBody.setFillStyle(0xccccff);
      });
    }
  }

  _destroyVisuals() {
    this.ghostBody.destroy();
    this.ghostEyeL.destroy();
    this.ghostEyeR.destroy();
    this.ghostMouth.destroy();
    this.ghostTail.destroy();
  }
}
