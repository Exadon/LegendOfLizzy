import Phaser from 'phaser';

export class Fairy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, colorIndex = 0) {
    super(scene, x, y, 'butterfly', 0);

    scene.add.existing(this);
    scene.physics.add.existing(this, false);

    // Play butterfly animation based on color index
    const butterflyAnims = ['butterfly-blue', 'butterfly-green', 'butterfly-red', 'butterfly-yellow'];
    this.play(butterflyAnims[colorIndex % butterflyAnims.length]);

    this.body.setSize(10, 10);
    this.body.setOffset(3, 3);
    this.setCollideWorldBounds(true);

    // Float center
    this.homeX = x;
    this.homeY = y;
    this.floatRadius = 40;
    this.floatAngle = Math.random() * Math.PI * 2;
    this.floatSpeed = 0.5 + Math.random() * 0.5;
    this.vertBob = 0;

    // Buff types
    this.buffTypes = ['speed', 'shield', 'attack'];
    this.buffGiven = false;

    // Glow effect
    this.glowColors = [0xff88ff, 0x88ffff, 0xffff88, 0x88ff88];
    this.glowColor = this.glowColors[colorIndex % this.glowColors.length];
    this.glow = scene.add.circle(x, y, 8, this.glowColor, 0.25);
    this.glow.setDepth(this.depth - 1);

    // Sparkle timer
    this.sparkleTimer = 0;

    this.setScale(1);
  }

  update(time, delta) {
    if (this.buffGiven) return;

    // Float in gentle circles
    this.floatAngle += (delta / 1000) * this.floatSpeed;
    this.vertBob += delta / 1000 * 2;

    const targetX = this.homeX + Math.cos(this.floatAngle) * this.floatRadius;
    const targetY = this.homeY + Math.sin(this.floatAngle * 0.7) * (this.floatRadius * 0.5) + Math.sin(this.vertBob) * 4;

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    this.setVelocity(dx * 2, dy * 2);

    // Update glow position
    this.glow.setPosition(this.x, this.y);
    this.glow.setAlpha(0.2 + Math.sin(time / 200) * 0.1);
    this.glow.setRadius(7 + Math.sin(time / 300) * 2);

    // Sparkles
    this.sparkleTimer -= delta;
    if (this.sparkleTimer <= 0) {
      this.sparkleTimer = 300 + Math.random() * 200;
      this._spawnSparkle();
    }
  }

  giveBuff(player, scene) {
    if (this.buffGiven) return null;
    this.buffGiven = true;

    const buffType = this.buffTypes[Math.floor(Math.random() * this.buffTypes.length)];

    // Fairy flies away
    this.scene.tweens.add({
      targets: [this, this.glow],
      y: this.y - 60,
      alpha: 0,
      scale: 0.2,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        this.glow.destroy();
        this.destroy();
      },
    });

    // Apply buff
    if (buffType === 'speed') {
      const origSpeed = player.speed;
      player.speed = Math.round(origSpeed * 1.4);
      scene.time.delayedCall(10000, () => {
        player.speed = origSpeed;
      });
      return { type: 'speed', message: 'Fairy Blessing: Speed!' };
    } else if (buffType === 'shield') {
      player.invulnerable = true;
      player.invulnerableTimer = 8000;
      return { type: 'shield', message: 'Fairy Blessing: Shield!' };
    } else {
      scene._fairyAttackBuff = true;
      scene.time.delayedCall(10000, () => {
        scene._fairyAttackBuff = false;
      });
      return { type: 'attack', message: 'Fairy Blessing: Power!' };
    }
  }

  _spawnSparkle() {
    const sparkle = this.scene.add.circle(
      this.x + (Math.random() - 0.5) * 8,
      this.y + (Math.random() - 0.5) * 6,
      1,
      this.glowColor,
      0.7
    );
    sparkle.setDepth(this.y - 1);
    this.scene.tweens.add({
      targets: sparkle,
      alpha: 0,
      y: sparkle.y + 6,
      duration: 400,
      onComplete: () => sparkle.destroy(),
    });
  }
}
