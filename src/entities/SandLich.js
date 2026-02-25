import Phaser from 'phaser';

export class SandLich extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'miner-mike', 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.body.setSize(14, 20);
    this.body.setOffset(9, 8);
    this.setScale(2);
    this.setTint(0xddaa44);

    this.health = 40;
    this.maxHealth = 40;
    this.speed = 20;
    this.damage = 3;
    this.enemyType = 'sand_lich';
    this.weakness = 'fire';
    this.knockbackResist = true;

    this.isHurt = false;
    this.hurtTimer = 0;
    this.phase = 1;
    this._phaseTransitioned = false;
    this._attackTimer = 0;
    this._teleportTimer = 0;
    this._minionsSummoned = false;
    this._dying = false;
    this._timers = [];

    // Health bar
    this.hpBarBg = scene.add.rectangle(x, y - 28, 48, 5, 0x333333);
    this.hpBarBg.setDepth(9998);
    this.hpBarFill = scene.add.rectangle(x, y - 28, 48, 5, 0xddaa44);
    this.hpBarFill.setOrigin(0, 0.5);
    this.hpBarFill.setDepth(9999);

    this.nameText = scene.add.text(x, y - 36, 'Sand Lich', {
      fontSize: '10px', fontFamily: 'Arial, sans-serif',
      color: '#ffdd88', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(9999);
  }

  update(time, delta, player) {
    if (this._dying) return;

    if (this.isHurt) {
      this.hurtTimer -= delta;
      if (this.hurtTimer <= 0) {
        this.isHurt = false;
        this.setTint(this.phase === 2 ? 0xaa7700 : 0xddaa44);
      }
      return;
    }

    // Phase 2 transition at 50% HP (≤ 20)
    if (this.health <= Math.floor(this.maxHealth / 2) && !this._phaseTransitioned) {
      this._phaseTransitioned = true;
      this.phase = 2;
      this.setTint(0xaa7700);
      this.scene.cameras.main.shake(300, 0.012);
      // Summon undead minions
      if (!this._minionsSummoned) {
        this._minionsSummoned = true;
        this._summonMinions();
      }
    }

    this._attackTimer -= delta;
    this._teleportTimer -= delta;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const attackInterval = this.phase === 2 ? 2200 : 3000;
    const orbCount = this.phase === 2 ? 5 : 3;

    // Phase 1: teleport every 4s
    if (this.phase === 1 && this._teleportTimer <= 0) {
      this._teleportTimer = 4000;
      this._doTeleport(player);
      return;
    }

    if (this._attackTimer <= 0 && dist < 200) {
      this._attackTimer = attackInterval;
      this._fireBoneVolley(player, orbCount);
    } else {
      if (dist > 60) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
      } else {
        this.setVelocity(0, 0);
      }
    }

    this.hpBarBg.setPosition(this.x, this.y - 28);
    this.hpBarFill.setPosition(this.x - 24, this.y - 28);
    this.hpBarFill.width = 48 * (this.health / this.maxHealth);
    this.nameText.setPosition(this.x, this.y - 36);
    this.setDepth(this.y);
  }

  _doTeleport(player) {
    this.setTint(0xffffff);
    this.setVelocity(0, 0);

    this._addTimer(this.scene.time.delayedCall(150, () => {
      if (this._dying || !this.active) return;

      const angle = Math.random() * Math.PI * 2;
      const dist = 80 + Math.random() * 60;
      const newX = Phaser.Math.Clamp(player.x + Math.cos(angle) * dist, 20, this.scene.worldWidth - 20);
      const newY = Phaser.Math.Clamp(player.y + Math.sin(angle) * dist, 20, this.scene.worldHeight - 20);

      this.setPosition(newX, newY);
      this.setTint(0xddaa44);

      // Teleport flash effect
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const p = this.scene.add.circle(newX, newY, 3, 0xddaa44, 0.8);
        p.setDepth(10000);
        this.scene.tweens.add({
          targets: p,
          x: newX + Math.cos(a) * 24,
          y: newY + Math.sin(a) * 24,
          alpha: 0, duration: 350,
          onComplete: () => p.destroy(),
        });
      }
    }));
  }

  _fireBoneVolley(player, count) {
    this.setVelocity(0, 0);
    const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    const spread = 0.35;
    const speed = 115;

    for (let i = 0; i < count; i++) {
      const offset = (i - Math.floor(count / 2)) * spread;
      const angle = baseAngle + offset;
      const orb = this.scene.add.circle(this.x, this.y, 5, 0xddcc88, 0.9);
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

      this._addTimer(this.scene.time.delayedCall(1800, () => {
        if (orb.active) orb.destroy();
      }));
    }

    this.scene.sfx.play('fireball');
  }

  _summonMinions() {
    const offsets = [[-40, 0], [40, 0]];
    for (const [ox, oy] of offsets) {
      const sx = Phaser.Math.Clamp(this.x + ox, 20, this.scene.worldWidth - 20);
      const sy = Phaser.Math.Clamp(this.y + oy, 20, this.scene.worldHeight - 20);
      const skeletonData = { type: 'skeleton', x: sx, y: sy };
      if (this.scene._spawnEnemyFromData) {
        this.scene._spawnEnemyFromData(skeletonData);
      }
    }
    this.scene.showNotification('The Sand Lich calls upon the ancient dead!');
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

    this.scene.cameras.main.shake(500, 0.018);
    this.scene.sfx.play('enemyDeath');

    // Sand explosion particles
    const colors = [0xddaa44, 0xaa7700, 0xffdd88, 0xddcc88];
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const p = this.scene.add.circle(this.x, this.y, 4, colors[i % colors.length]);
      p.setDepth(10000);
      this.scene.tweens.add({
        targets: p,
        x: this.x + Math.cos(angle) * 55,
        y: this.y + Math.sin(angle) * 55,
        alpha: 0, duration: 600,
        onComplete: () => p.destroy(),
      });
    }

    this.scene.addGold(180);
    this.scene.addXP(250);
    this.scene.showNotification('Sand Lich defeated!');

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
