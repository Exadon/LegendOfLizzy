import Phaser from 'phaser';

export class Chicken extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'chicken', 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(10, 8);
    this.body.setOffset(11, 18);
    this.setCollideWorldBounds(true);

    this.collected = false;
    this.speed = 12;
    this.wanderTimer = 0;
    this.wanderDirection = { x: 0, y: 0 };

    this.play('chicken-idle');
  }

  update(time, delta) {
    if (this.collected) return;

    this.wanderTimer -= delta;
    if (this.wanderTimer <= 0) {
      if (Math.random() < 0.4) {
        this.wanderDirection = { x: 0, y: 0 };
      } else {
        // Bias toward horizontal/diagonal so side-view sprite always faces travel direction
        const angle = Math.random() * Math.PI * 2;
        let dx = Math.cos(angle);
        let dy = Math.sin(angle);
        // If nearly vertical, add horizontal bias so chicken faces a direction
        if (Math.abs(dx) < 0.3) {
          dx = (Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.3);
        }
        this.wanderDirection = { x: dx, y: dy };
      }
      this.wanderTimer = 800 + Math.random() * 1500;
    }

    const vx = this.wanderDirection.x * this.speed;
    const vy = this.wanderDirection.y * this.speed;
    this.setVelocity(vx, vy);

    if (vx === 0 && vy === 0) {
      this.play('chicken-idle', true);
    } else {
      this.play('chicken-walk', true);
      // Always update facing direction when moving
      this.setFlipX(vx < 0);
    }

    this.setDepth(this.y);
  }

  collect() {
    if (this.collected) return false;
    this.collected = true;
    this.body.enable = false;
    this.setVelocity(0, 0);

    this.scene.tweens.add({
      targets: this,
      y: this.y - 16,
      alpha: 0,
      scale: 0.2,
      duration: 300,
      ease: 'Power2',
      onComplete: () => this.destroy(),
    });

    return true;
  }
}
