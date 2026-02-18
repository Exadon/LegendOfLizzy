import Phaser from 'phaser';

export class Pet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'slime-green', 0);

    scene.add.existing(this);
    scene.physics.add.existing(this, false);

    this.body.setSize(8, 8);
    this.body.setOffset(12, 18);
    this.setScale(0.7);
    this.setTint(0x88ddff); // Light blue tint to distinguish from enemy slime
    this.setCollideWorldBounds(true);

    this.play('slime-idle');

    this.followSpeed = 70;
    this.collectRadius = 30;
    this._bobTimer = 0;
    this._barkCooldown = 0;
    this.barkRadius = 60;
    this.barkStunDuration = 400;
    this.barkCooldownDuration = 8000;
  }

  update(time, delta, player) {
    // Bark cooldown
    if (this._barkCooldown > 0) this._barkCooldown -= delta;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Follow player with some lag
    if (dist > 28) {
      const nx = dx / dist;
      const ny = dy / dist;
      const spd = dist > 80 ? this.followSpeed * 1.5 : this.followSpeed;
      this.setVelocity(nx * spd, ny * spd);
      this.setFlipX(dx < 0);
    } else {
      this.setVelocity(0, 0);
    }

    // Gentle bob (apply to base position to prevent drift)
    this._bobTimer += delta;
    if (!this._baseY) this._baseY = this.y;
    if (dist > 20) this._baseY = this.y; // update base while moving
    const bob = Math.sin(this._bobTimer / 300) * 1.5;
    if (dist <= 20) this.setY(this._baseY + bob * 0.3);

    this.setDepth(this.y);
  }

  bark(scene) {
    if (this._barkCooldown > 0) return false;
    this._barkCooldown = this.barkCooldownDuration;

    // SFX
    if (scene.sfx) scene.sfx.play('petBark');

    // Visual: 8 outward particles
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const p = scene.add.circle(this.x, this.y, 2, 0x88ddff, 0.8);
      p.setDepth(9999);
      scene.tweens.add({
        targets: p,
        x: this.x + Math.cos(angle) * this.barkRadius * 0.6,
        y: this.y + Math.sin(angle) * this.barkRadius * 0.6,
        alpha: 0, scale: 0.3,
        duration: 300,
        onComplete: () => p.destroy(),
      });
    }

    // Stun ring visual
    const ring = scene.add.circle(this.x, this.y, 4, 0x88ddff, 0.3);
    ring.setDepth(9998);
    scene.tweens.add({
      targets: ring,
      radius: this.barkRadius,
      alpha: 0,
      duration: 300,
      onComplete: () => ring.destroy(),
    });

    // Stun nearby enemies (not bosses)
    scene.enemies.getChildren().forEach((enemy) => {
      if (!enemy.active || enemy === scene.boss) return;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
      if (dist < this.barkRadius) {
        enemy.isHurt = true;
        enemy.hurtTimer = this.barkStunDuration;
        enemy.setVelocity(0, 0);
        enemy.setTint(0x88ddff);
      }
    });

    return true;
  }

  // Attract nearby loot drops toward the player
  collectNearbyLoot(scene) {
    if (!scene.lootDrops) return;
    const children = scene.lootDrops.getChildren();
    for (const loot of children) {
      if (!loot.active) continue;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, loot.x, loot.y);
      if (dist < this.collectRadius) {
        // Tween loot toward the player
        if (!loot._magnetized) {
          loot._magnetized = true;
          scene.tweens.add({
            targets: loot,
            x: scene.player.x,
            y: scene.player.y,
            duration: 200,
            ease: 'Power2',
          });
        }
      }
    }
  }
}
