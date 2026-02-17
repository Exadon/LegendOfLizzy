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
    this.collectRadius = 40;
    this._bobTimer = 0;
  }

  update(time, delta, player) {
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

    // Gentle bob
    this._bobTimer += delta;
    const bob = Math.sin(this._bobTimer / 300) * 1.5;
    this.setY(this.y + bob * 0.05); // subtle

    this.setDepth(this.y);
  }

  // Check for nearby loot drops and auto-collect
  collectNearbyLoot(scene) {
    // Hearts and potion drops are physics objects with overlap handlers
    // The pet just moves toward them and the player's overlap handler picks them up
    // So we'll attract drops toward the player instead
  }
}
