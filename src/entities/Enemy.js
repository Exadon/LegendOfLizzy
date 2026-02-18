import Phaser from 'phaser';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, config = {}) {
    super(scene, x, y, texture, 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.body.setSize(12, 12);
    this.body.setOffset(10, 18);

    this.health = config.health || 3;
    this.speed = config.speed || 30;
    this.damage = config.damage || 1;
    this.idleAnim = config.idleAnim || 'skeleton-idle-down';
    this.knockbackResist = config.knockbackResist || false;
    this.enemyType = config.enemyType || 'unknown';
    this.walkAnims = config.walkAnims || {
      right: 'skeleton-walk-right',
      down: 'skeleton-walk-down',
      up: 'skeleton-walk-up',
    };

    // AI state
    this.aiState = 'wander';
    this.detectRange = config.detectRange || 80;
    this.wanderTimer = 0;
    this.wanderDirection = { x: 0, y: 0 };

    this.isHurt = false;
    this.hurtTimer = 0;

    this.play(this.idleAnim);
  }

  update(time, delta, player) {
    if (this.isHurt) {
      this.hurtTimer -= delta;
      if (this.hurtTimer <= 0) {
        this.isHurt = false;
        this.clearTint();
      }
      return;
    }

    const distToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    if (distToPlayer < this.detectRange) {
      this.aiState = 'chase';
    } else {
      this.aiState = 'wander';
    }

    if (this.aiState === 'chase') {
      this.chasePlayer(player);
    } else {
      this.wander(time, delta);
    }
  }

  chasePlayer(player) {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    this.setVelocity(
      Math.cos(angle) * this.speed,
      Math.sin(angle) * this.speed
    );

    // Pick animation based on dominant movement axis
    const dx = player.x - this.x;
    const dy = player.y - this.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      this.play(this.walkAnims.right, true);
      this.setFlipX(dx < 0);
    } else if (dy > 0) {
      this.play(this.walkAnims.down, true);
      this.setFlipX(false);
    } else {
      this.play(this.walkAnims.up, true);
      this.setFlipX(false);
    }
  }

  wander(time, delta) {
    this.wanderTimer -= delta;
    if (this.wanderTimer <= 0) {
      // Pick a new random direction or stop
      if (Math.random() < 0.3) {
        this.wanderDirection = { x: 0, y: 0 };
      } else {
        const angle = Math.random() * Math.PI * 2;
        this.wanderDirection = {
          x: Math.cos(angle),
          y: Math.sin(angle),
        };
      }
      this.wanderTimer = 1000 + Math.random() * 2000;
    }

    const wx = this.wanderDirection.x * this.speed * 0.5;
    const wy = this.wanderDirection.y * this.speed * 0.5;
    this.setVelocity(wx, wy);

    if (wx === 0 && wy === 0) {
      this.play(this.idleAnim, true);
    } else {
      this.play(this.walkAnims.down, true);
    }
  }

  takeDamage(amount = 1, sourceX, sourceY) {
    this.health -= amount;
    this.isHurt = true;
    this.hurtTimer = 250;

    // White flash then red
    this.setTint(0xffffff);
    this.scene.time.delayedCall(60, () => {
      if (this.active && this.health > 0) this.setTint(0xff4444);
    });

    // Scale pop on hit
    this.setScale(1.15);
    this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      duration: 120,
      ease: 'Back.easeOut',
    });

    // Knockback away from damage source
    if (sourceX !== undefined && sourceY !== undefined) {
      const angle = Phaser.Math.Angle.Between(sourceX, sourceY, this.x, this.y);
      this.setVelocity(Math.cos(angle) * 150, Math.sin(angle) * 150);
    }

    if (this.health <= 0) {
      this.destroy();
    }
  }
}

export class Slime extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'slime-green', 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(12, 10);
    this.body.setOffset(10, 16);

    this.health = 2;
    this.speed = 20;
    this.damage = 1;
    this.enemyType = 'slime';

    this.wanderTimer = 0;
    this.wanderDirection = { x: 0, y: 0 };
    this.isHurt = false;
    this.hurtTimer = 0;

    this.play('slime-idle');
  }

  update(time, delta, player) {
    if (this.isHurt) {
      this.hurtTimer -= delta;
      if (this.hurtTimer <= 0) {
        this.isHurt = false;
        this.clearTint();
      }
      return;
    }

    // Chase player when close (60px range)
    const distToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (distToPlayer < 60) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
      this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
      return;
    }

    // Wander randomly when player is far
    this.wanderTimer -= delta;
    if (this.wanderTimer <= 0) {
      if (Math.random() < 0.4) {
        this.wanderDirection = { x: 0, y: 0 };
      } else {
        const angle = Math.random() * Math.PI * 2;
        this.wanderDirection = {
          x: Math.cos(angle),
          y: Math.sin(angle),
        };
      }
      this.wanderTimer = 800 + Math.random() * 1500;
    }

    this.setVelocity(
      this.wanderDirection.x * this.speed,
      this.wanderDirection.y * this.speed
    );
  }

  takeDamage(amount = 1, sourceX, sourceY) {
    this.health -= amount;
    this.isHurt = true;
    this.hurtTimer = 250;

    this.setTint(0xffffff);
    this.scene.time.delayedCall(60, () => {
      if (this.active && this.health > 0) this.setTint(0xff4444);
    });

    this.setScale(1.15);
    this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      duration: 120,
      ease: 'Back.easeOut',
    });

    if (sourceX !== undefined && sourceY !== undefined) {
      const angle = Phaser.Math.Angle.Between(sourceX, sourceY, this.x, this.y);
      this.setVelocity(Math.cos(angle) * 100, Math.sin(angle) * 100);
    }

    if (this.health <= 0) {
      this.destroy();
    }
  }
}
