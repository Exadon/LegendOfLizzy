import Phaser from 'phaser';

export class GoblinArcher extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'goblin-thief', 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.body.setSize(18, 18);
    this.body.setOffset(7, 7);
    this.setScale(2);
    this.setTint(0x88bb44); // Green tint

    this.health = 2;
    this.maxHealth = 2;
    this.speed = 30;
    this.damage = 1;
    this.enemyType = 'goblin_archer';
    this.weakness = 'fire';

    this.isHurt = false;
    this.hurtTimer = 0;
    this._dying = false;
    this._state = 'idle'; // idle, aim, fire, cooldown
    this._stateTimer = 0;
    this._timers = [];

    // Health bar
    this.hpBarBg = scene.add.rectangle(x, y - 20, 20, 3, 0x333333);
    this.hpBarBg.setDepth(9998);
    this.hpBarFill = scene.add.rectangle(x, y - 20, 20, 3, 0x44bb44);
    this.hpBarFill.setOrigin(0, 0.5);
    this.hpBarFill.setDepth(9999);
  }

  update(time, delta, player) {
    if (this._dying) return;

    if (this.isHurt) {
      this.hurtTimer -= delta;
      if (this.hurtTimer <= 0) {
        this.isHurt = false;
        this.setTint(0x88bb44);
      }
      this.setVelocity(0, 0);
      this.play('goblin-idle-down', true);
      this._updateBars();
      return;
    }

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    // Flee if player is too close
    if (dist < 40) {
      const angle = Phaser.Math.Angle.Between(player.x, player.y, this.x, this.y);
      const vx = Math.cos(angle) * this.speed * 1.5;
      const vy = Math.sin(angle) * this.speed * 1.5;
      this.setVelocity(vx, vy);
      this._playMoveAnim(vx, vy);
      this._state = 'idle';
      this._stateTimer = 0;
      this._updateBars();
      return;
    }

    this._stateTimer -= delta;

    switch (this._state) {
      case 'idle':
        // Within range: start aiming
        if (dist < 200) {
          this._state = 'aim';
          this._stateTimer = 1500;
          this.setVelocity(0, 0);
          this.play('goblin-idle-down', true);
        } else {
          // Wander slowly toward player
          const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
          const vx = Math.cos(angle) * this.speed * 0.5;
          const vy = Math.sin(angle) * this.speed * 0.5;
          this.setVelocity(vx, vy);
          this._playMoveAnim(vx, vy);
        }
        break;

      case 'aim':
        this.setVelocity(0, 0);
        this.play('goblin-idle-down', true);
        if (this._stateTimer <= 0) {
          this._fireArrow(player);
          this._state = 'cooldown';
          this._stateTimer = 2000;
        }
        break;

      case 'cooldown':
        this.setVelocity(0, 0);
        this.play('goblin-idle-down', true);
        if (this._stateTimer <= 0) {
          this._state = 'idle';
        }
        break;
    }

    this._updateBars();
    this.setDepth(this.y);
  }

  _playMoveAnim(vx, vy) {
    if (Math.abs(vx) > Math.abs(vy)) {
      this.play('goblin-walk-right', true);
      this.setFlipX(vx < 0);
    } else if (vy < 0) {
      this.play('goblin-walk-up', true);
      this.setFlipX(false);
    } else {
      this.play('goblin-walk-down', true);
      this.setFlipX(false);
    }
  }

  _fireArrow(player) {
    // Capture player position at time of fire
    const tx = player.x;
    const ty = player.y;
    const angle = Phaser.Math.Angle.Between(this.x, this.y, tx, ty);
    const speed = 128;

    const arrow = this.scene.add.rectangle(this.x, this.y, 8, 3, 0xddaa44);
    arrow.setDepth(9990);
    arrow.setRotation(angle);
    this.scene.physics.add.existing(arrow, false);
    arrow.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    arrow.body.setAllowGravity(false);
    arrow.damage = this.damage;

    // Add to enemies group so existing GameScene collision handling works
    if (this.scene.arrowGroup) {
      this.scene.arrowGroup.add(arrow);
    }

    // Player overlap
    this.scene.physics.add.overlap(this.scene.player, arrow, () => {
      if (!arrow.active) return;
      if (!this.scene.player.invulnerable) {
        this.scene.player.takeDamage(1);
        if (this.scene.sfx) this.scene.sfx.play('playerHurt');
      }
      arrow.destroy();
    });

    // Auto-destroy after 1500ms
    this._addTimer(this.scene.time.delayedCall(1500, () => {
      if (arrow.active) arrow.destroy();
    }));

    if (this.scene.sfx) this.scene.sfx.play('fireball'); // Reuse closest SFX
  }

  _updateBars() {
    this.hpBarBg.setPosition(this.x, this.y - 20);
    this.hpBarFill.setPosition(this.x - 10, this.y - 20);
    this.hpBarFill.width = 20 * (this.health / this.maxHealth);
    this.setDepth(this.y);
  }

  _addTimer(timer) {
    this._timers.push(timer);
    return timer;
  }

  pauseTimers() {
    for (const t of this._timers) {
      if (t && t.paused !== undefined) t.paused = true;
    }
  }

  resumeTimers() {
    for (const t of this._timers) {
      if (t && t.paused !== undefined) t.paused = false;
    }
  }

  takeDamage(amount = 1) {
    if (this._dying) return;
    this.health -= amount;
    this.isHurt = true;
    this.hurtTimer = 180;
    this.setTint(0xffffff);

    if (this.health <= 0) this._die();
  }

  _die() {
    this._dying = true;
    if (this._timers) { this._timers.forEach(t => { try { t.remove(); } catch (_) {} }); this._timers = []; }
    this.setVelocity(0, 0);
    this.body.enable = false;

    this.scene.tweens.add({
      targets: this,
      alpha: 0, scaleX: 0.5, scaleY: 0.5,
      duration: 250,
      onComplete: () => {
        this._destroyVisuals();
        this.destroy();
      },
    });
  }

  _destroyVisuals() {
    if (this.hpBarBg) this.hpBarBg.destroy();
    if (this.hpBarFill) this.hpBarFill.destroy();
  }
}
