import Phaser from 'phaser';

export class CoralBeast extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'miner-mike', 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.body.setSize(14, 20);
    this.body.setOffset(9, 8);
    this.setScale(2);
    this.setTint(0x22bbcc);

    this.health = 35;
    this.maxHealth = 35;
    this.speed = 28;
    this.damage = 2;
    this.enemyType = 'coral_beast';
    this.weakness = 'lightning';
    this.knockbackResist = true;

    this.isHurt = false;
    this.hurtTimer = 0;
    this.phase = 1;
    this._phaseTransitioned = false;
    this._attackTimer = 0;
    this._healSurgeDone = false;
    this._dying = false;
    this._timers = [];

    // Health bar
    this.hpBarBg = scene.add.rectangle(x, y - 24, 44, 4, 0x333333);
    this.hpBarBg.setDepth(9998);
    this.hpBarFill = scene.add.rectangle(x, y - 24, 44, 4, 0x22bbcc);
    this.hpBarFill.setOrigin(0, 0.5);
    this.hpBarFill.setDepth(9999);

    this.nameText = scene.add.text(x, y - 30, 'Coral Beast', {
      fontSize: '10px', fontFamily: 'Arial, sans-serif',
      color: '#88eeff', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(9999);
  }

  update(time, delta, player) {
    if (this._dying) return;

    if (this.isHurt) {
      this.hurtTimer -= delta;
      if (this.hurtTimer <= 0) {
        this.isHurt = false;
        this.setTint(this.phase === 2 ? 0x009988 : 0x22bbcc);
      }
      return;
    }

    // Phase 2 transition at 50% HP (≤ 17)
    if (this.health <= Math.floor(this.maxHealth / 2) && !this._phaseTransitioned) {
      this._phaseTransitioned = true;
      this.phase = 2;
      this.speed = 40;
      this.setTint(0x009988);
      this.scene.cameras.main.shake(300, 0.012);
      // Heal surge — one-time recovery
      if (!this._healSurgeDone) {
        this._healSurge();
      }
    }

    this._attackTimer -= delta;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const attackInterval = this.phase === 2 ? 2000 : 2500;
    const orbCount = this.phase === 2 ? 3 : 2;

    if (this._attackTimer <= 0 && dist < 220) {
      this._attackTimer = attackInterval;
      this._fireWaterOrbs(player, orbCount);
    } else {
      this._driftToward(player);
    }

    this.hpBarBg.setPosition(this.x, this.y - 24);
    this.hpBarFill.setPosition(this.x - 22, this.y - 24);
    this.hpBarFill.width = 44 * (this.health / this.maxHealth);
    this.nameText.setPosition(this.x, this.y - 30);
    this.setDepth(this.y);
  }

  _driftToward(player) {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
  }

  _fireWaterOrbs(player, count) {
    this.setVelocity(0, 0);
    const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    const spread = 0.3;
    const speed = 100;

    for (let i = 0; i < count; i++) {
      const offset = count === 1 ? 0 : (i - Math.floor(count / 2)) * spread;
      const angle = baseAngle + offset;
      const orb = this.scene.add.circle(this.x, this.y, 5, 0x33aaff, 0.9);
      orb.setDepth(9990);
      this.scene.physics.add.existing(orb, false);
      orb.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      orb.body.setAllowGravity(false);

      const ov = this.scene.physics.add.overlap(this.scene.player, orb, () => {
        if (!orb.active) return;
        if (!this.scene.player.invulnerable) {
          this.scene.player.takeDamage(1);
          this.scene.sfx.play('playerHurt');
        }
        this.scene.physics.world.removeCollider(ov);
        orb.destroy();
      });
      orb.on('destroy', () => this.scene.physics.world.removeCollider(ov));

      this._addTimer(this.scene.time.delayedCall(1600, () => {
        if (orb.active) orb.destroy();
      }));
    }

    this.scene.sfx.play('icebolt');
  }

  _healSurge() {
    this._healSurgeDone = true;
    this.health = Math.min(this.maxHealth, this.health + 3);
    this.scene.cameras.main.flash(300, 0, 200, 220);
    this.scene.showNotification('Coral Beast regenerates!');
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
    this.hurtTimer = 200;
    this.setTint(0xffffff);

    this.setScale(2.15);
    this.scene.tweens.add({
      targets: this, scaleX: 2, scaleY: 2,
      duration: 120, ease: 'Back.easeOut',
    });

    if (this.health <= 0) this._die();
  }

  _die() {
    this._dying = true;
    this.setVelocity(0, 0);
    this.body.enable = false;

    this.scene.cameras.main.shake(400, 0.015);
    this.scene.sfx.play('enemyDeath');

    // Water burst particles
    const colors = [0x22bbcc, 0x33aaff, 0x88eeff, 0x009988];
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2;
      const p = this.scene.add.circle(this.x, this.y, 3, colors[i % colors.length]);
      p.setDepth(10000);
      this.scene.tweens.add({
        targets: p,
        x: this.x + Math.cos(angle) * 45,
        y: this.y + Math.sin(angle) * 45,
        alpha: 0, duration: 550,
        onComplete: () => p.destroy(),
      });
    }

    this.scene.addGold(150);
    this.scene.addXP(200);
    this.scene.showNotification('Coral Beast defeated!');

    // Complete clear_beach_dungeon quest if active
    const quest = this.scene.questManager?.getQuest('clear_beach_dungeon');
    if (quest && quest.state === 'active') {
      quest.progress = quest.objective.count;
      quest.state = 'ready';
      this.scene.updateQuestTracker?.();
    }

    this._timers = [];
    this.scene.events.emit('boss-defeated');
    this.scene.time.delayedCall(500, () => {
      this.hpBarBg?.destroy();
      this.hpBarFill?.destroy();
      this.nameText?.destroy();
      this.destroy();
      this.scene.checkVictory?.();
    });
  }

  _destroyVisuals() {
    if (this.hpBarBg) this.hpBarBg.destroy();
    if (this.hpBarFill) this.hpBarFill.destroy();
    if (this.nameText) this.nameText.destroy();
  }
}
