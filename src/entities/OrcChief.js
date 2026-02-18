import Phaser from 'phaser';

export class OrcChief extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'orc-grunt', 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.body.setSize(16, 16);
    this.body.setOffset(8, 12);
    this.setScale(2); // Bigger than normal orcs
    this.setTint(0x44aa44); // Dark green tint

    this.health = 30;
    this.maxHealth = 30;
    this.speed = 45;
    this.damage = 2;
    this.enemyType = 'orc_chief';
    this.knockbackResist = true;

    this.isHurt = false;
    this.hurtTimer = 0;
    this.phase = 1;
    this._phaseTransitioned = false;
    this._attackTimer = 0;
    this._chargeTarget = null;
    this._isCharging = false;
    this._slamCooldown = 0;
    this._summonedAdds = false;
    this._dying = false;
    this._timers = [];

    // Health bar
    this.hpBarBg = scene.add.rectangle(x, y - 24, 40, 4, 0x333333);
    this.hpBarBg.setDepth(9998);
    this.hpBarFill = scene.add.rectangle(x, y - 24, 40, 4, 0x44cc44);
    this.hpBarFill.setOrigin(0, 0.5);
    this.hpBarFill.setDepth(9999);

    this.nameText = scene.add.text(x, y - 30, 'Orc Chief', {
      fontSize: '10px', fontFamily: 'Arial, sans-serif',
      color: '#44cc44', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(9999);

    this.play('orc-idle-down');
  }

  update(time, delta, player) {
    if (this._dying) return;

    if (this.isHurt) {
      this.hurtTimer -= delta;
      if (this.hurtTimer <= 0) {
        this.isHurt = false;
        this.clearTint();
        this.setTint(this.phase === 2 ? 0xff4444 : 0x44aa44);
      }
      return;
    }

    // Phase transition at 50% HP
    if (this.health <= this.maxHealth / 2 && !this._phaseTransitioned) {
      this._phaseTransitioned = true;
      this.phase = 2;
      this.speed = 60;
      this.damage = 3;
      this.setTint(0xff4444);
      this.scene.cameras.main.shake(300, 0.01);
      this.scene.showNotification('Orc Chief enrages!');
      // Summon goblin adds
      if (!this._summonedAdds) {
        this._summonedAdds = true;
        this._summonAdds();
      }
    }

    this._attackTimer -= delta;
    this._slamCooldown -= delta;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    if (this._isCharging) {
      // Continue charge dash
      return;
    }

    // Phase 2: faster attacks
    const attackInterval = this.phase === 2 ? 2000 : 3000;

    if (this._attackTimer <= 0 && dist < 120) {
      this._attackTimer = attackInterval;
      // Choose attack: charge dash or ground slam
      if (this._slamCooldown <= 0 && dist < 50) {
        this._groundSlam(player);
      } else {
        this._chargeDash(player);
      }
    } else {
      // Chase player
      this._chasePlayer(player);
    }

    // Update UI positions
    this.hpBarBg.setPosition(this.x, this.y - 24);
    this.hpBarFill.setPosition(this.x - 20, this.y - 24);
    this.hpBarFill.width = 40 * (this.health / this.maxHealth);
    this.nameText.setPosition(this.x, this.y - 30);
    this.setDepth(this.y);
  }

  _chasePlayer(player) {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    this.setVelocity(
      Math.cos(angle) * this.speed,
      Math.sin(angle) * this.speed
    );
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      this.play('orc-walk-right', true);
      this.setFlipX(dx < 0);
    } else if (dy > 0) {
      this.play('orc-walk-down', true);
    } else {
      this.play('orc-walk-up', true);
    }
  }

  _chargeDash(player) {
    // Telegraph: flash red, pause
    this.setTint(0xff0000);
    this.setVelocity(0, 0);

    // Warning indicator
    const warn = this.scene.add.text(this.x, this.y - 36, '!', {
      fontSize: '14px', fontFamily: 'Arial, sans-serif',
      color: '#ff0000', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10000);
    this.scene.tweens.add({
      targets: warn, alpha: 0, y: this.y - 44,
      duration: 400, onComplete: () => warn.destroy(),
    });

    this._isCharging = true;
    this._addTimer(this.scene.time.delayedCall(500, () => {
      if (!this.active || this._dying) return;
      // Dash toward player position
      const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
      const dashSpeed = 200;
      this.setVelocity(Math.cos(angle) * dashSpeed, Math.sin(angle) * dashSpeed);
      this.scene.cameras.main.shake(100, 0.005);

      this._addTimer(this.scene.time.delayedCall(400, () => {
        if (!this.active) return;
        this._isCharging = false;
        this.setVelocity(0, 0);
        this.clearTint();
        this.setTint(this.phase === 2 ? 0xff4444 : 0x44aa44);
      }));
    }));
  }

  _groundSlam(player) {
    this._slamCooldown = 5000;
    this.setVelocity(0, 0);
    this.setTint(0xffaa00);

    // Jump up animation
    this.scene.tweens.add({
      targets: this, y: this.y - 16,
      duration: 300, yoyo: true,
      onComplete: () => {
        if (!this.active || this._dying) return;
        // AoE damage around boss
        this.scene.cameras.main.shake(200, 0.012);
        // Create shockwave ring
        const ring = this.scene.add.circle(this.x, this.y, 8, 0xffaa00, 0.5);
        ring.setDepth(9999);
        this.scene.tweens.add({
          targets: ring, radius: 50, alpha: 0,
          duration: 300, onComplete: () => ring.destroy(),
        });
        // Damage player if close
        const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        if (dist < 50 && !player.invulnerable) {
          player.takeDamage(this.damage + 1);
          this.scene.sfx.play('playerHurt');
          if (this.scene.hitFreeze) this.scene.hitFreeze(50);
        }
        this.clearTint();
        this.setTint(this.phase === 2 ? 0xff4444 : 0x44aa44);
      },
    });
  }

  _summonAdds() {
    const scene = this.scene;
    for (let i = 0; i < 2; i++) {
      const gx = this.x + (i === 0 ? -40 : 40);
      const gy = this.y + 20;
      this._addTimer(scene.time.delayedCall(300 * i, () => {
        if (!this.active) return;
        // Spawn effect
        const flash = scene.add.circle(gx, gy, 6, 0x44aa44, 0.8);
        flash.setDepth(10000);
        scene.tweens.add({
          targets: flash, radius: 15, alpha: 0,
          duration: 300, onComplete: () => flash.destroy(),
        });
        scene.spawnGoblin(gx, gy);
      }));
    }
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

  takeDamage(amount = 1, sourceX, sourceY) {
    if (this._dying) return;
    this.health -= amount;
    this.isHurt = true;
    this.hurtTimer = 200;
    this.setTint(0xffffff);
    this._addTimer(this.scene.time.delayedCall(60, () => {
      if (this.active && this.health > 0) this.setTint(0xff4444);
    }));

    this.setScale(2.15);
    this.scene.tweens.add({
      targets: this, scaleX: 2, scaleY: 2,
      duration: 120, ease: 'Back.easeOut',
    });

    if (this.health <= 0) {
      this._die();
    }
  }

  _die() {
    this._dying = true;
    this.setVelocity(0, 0);
    this.body.enable = false;

    // Death sequence
    this.scene.cameras.main.shake(400, 0.015);
    this.scene.sfx.play('enemyDeath');

    // Flash and explode
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const p = this.scene.add.circle(this.x, this.y, 3, [0x44aa44, 0xffaa00, 0xff4444, 0xffffff][i % 4]);
      p.setDepth(10000);
      this.scene.tweens.add({
        targets: p,
        x: this.x + Math.cos(angle) * 40,
        y: this.y + Math.sin(angle) * 40,
        alpha: 0, duration: 500,
        onComplete: () => p.destroy(),
      });
    }

    // Rewards
    this.scene.addGold(200);
    this.scene.addXP(500);
    this.scene.showNotification('Orc Chief defeated!');

    // Complete quest
    const quest = this.scene.questManager.getQuest('clear_forest');
    if (quest && quest.state === 'active') {
      quest.progress = quest.objective.count;
      quest.state = 'ready';
      this.scene.updateQuestTracker();
    }

    this._timers = [];
    this.scene.events.emit('boss-defeated');
    this.scene.time.delayedCall(500, () => {
      this.hpBarBg.destroy();
      this.hpBarFill.destroy();
      this.nameText.destroy();
      this.destroy();
      this.scene.checkVictory();
    });
  }

  _destroyVisuals() {
    if (this.hpBarBg) this.hpBarBg.destroy();
    if (this.hpBarFill) this.hpBarFill.destroy();
    if (this.nameText) this.nameText.destroy();
  }
}
