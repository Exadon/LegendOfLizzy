import Phaser from 'phaser';

export class Unicorn extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'horse', 0);

    scene.add.existing(this);
    scene.physics.add.existing(this, false);

    this.body.setSize(14, 10);
    this.body.setOffset(9, 18);
    this.setCollideWorldBounds(true);

    // Wandering
    this.homeX = x;
    this.homeY = y;
    this.wanderSpeed = 18;
    this.wanderRadius = 80;
    this.wanderTimer = 0;
    this.wanderDir = { x: 0, y: 0 };
    this.direction = 'down';

    // Interaction
    this.canHeal = true;
    this.healCooldown = 0;
    this.healCooldownDuration = 15000; // 15s between heals

    // Sparkle trail timer
    this.sparkleTimer = 0;

    this.play('horse-idle-down');

    // Tint white/pastel for unicorn look
    this.setTint(0xeeddff);
  }

  update(time, delta) {
    // Heal cooldown
    if (this.healCooldown > 0) {
      this.healCooldown -= delta;
      if (this.healCooldown <= 0) this.canHeal = true;
    }

    // Sparkle trail
    this.sparkleTimer -= delta;
    if (this.sparkleTimer <= 0 && (this.body.velocity.x !== 0 || this.body.velocity.y !== 0)) {
      this.sparkleTimer = 200;
      this._spawnSparkle();
    }

    // Wandering AI
    this.wanderTimer -= delta;
    if (this.wanderTimer <= 0) {
      this.wanderTimer = 2000 + Math.random() * 3000;

      if (Math.random() < 0.35) {
        // Stop and idle
        this.wanderDir = { x: 0, y: 0 };
        this.setVelocity(0, 0);
        const idleDir = this.direction === 'left' ? 'right' : this.direction;
        this.play(`horse-idle-${idleDir}`, true);
        this.setFlipX(this.direction === 'left');
        return;
      }

      // Pick direction, leash to home
      const dx = this.homeX - this.x;
      const dy = this.homeY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let angle;
      if (dist > this.wanderRadius) {
        angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1;
      } else {
        angle = Math.random() * Math.PI * 2;
      }

      this.wanderDir = { x: Math.cos(angle), y: Math.sin(angle) };
      const vx = this.wanderDir.x * this.wanderSpeed;
      const vy = this.wanderDir.y * this.wanderSpeed;
      this.setVelocity(vx, vy);

      // Direction and animation
      if (Math.abs(vx) > Math.abs(vy)) {
        this.direction = vx > 0 ? 'right' : 'left';
      } else {
        this.direction = vy > 0 ? 'down' : 'up';
      }
      const walkDir = this.direction === 'left' ? 'right' : this.direction;
      this.play(`horse-walk-${walkDir}`, true);
      this.setFlipX(this.direction === 'left');
    }
  }

  tryHeal(player) {
    if (!this.canHeal) return false;
    if (player.health >= player.maxHealth) return false;

    this.canHeal = false;
    this.healCooldown = this.healCooldownDuration;

    // Heal player fully
    const healed = player.maxHealth - player.health;
    player.health = player.maxHealth;

    // Rainbow burst effect
    this._rainbowBurst();

    return healed;
  }

  _spawnSparkle() {
    const colors = [0xffaaff, 0xaaffff, 0xffffaa, 0xffaaaa, 0xaaaaff];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const sparkle = this.scene.add.circle(
      this.x + (Math.random() - 0.5) * 10,
      this.y + (Math.random() - 0.5) * 6,
      1 + Math.random(),
      color,
      0.8
    );
    sparkle.setDepth(this.y - 1);
    this.scene.tweens.add({
      targets: sparkle,
      alpha: 0,
      y: sparkle.y - 8,
      scale: 0.2,
      duration: 500 + Math.random() * 300,
      onComplete: () => sparkle.destroy(),
    });
  }

  _rainbowBurst() {
    const rainbowColors = [0xff0000, 0xff8800, 0xffff00, 0x00ff00, 0x0088ff, 0x8800ff, 0xff00ff];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const color = rainbowColors[i % rainbowColors.length];
      const particle = this.scene.add.circle(this.x, this.y, 2.5, color, 0.9);
      particle.setDepth(9999);
      this.scene.tweens.add({
        targets: particle,
        x: this.x + Math.cos(angle) * 28,
        y: this.y + Math.sin(angle) * 28,
        alpha: 0,
        scale: 0.3,
        duration: 500,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }
}
