import Phaser from 'phaser';

export class IceWitch extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'miner-mike', 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.body.setSize(14, 20);
    this.body.setOffset(9, 8);
    this.setScale(2);
    this.setTint(0x4488ff); // Ice blue tint

    this.health = 35;
    this.maxHealth = 35;
    this.speed = 30;
    this.damage = 2;
    this.enemyType = 'ice_witch';
    this.weakness = 'lightning';
    this.knockbackResist = true;

    this.isHurt = false;
    this.hurtTimer = 0;
    this.phase = 1;
    this._phaseTransitioned = false;
    this._attackTimer = 0;
    this._dying = false;
    this._darkSealsFragment = 1;
    this._timers = [];

    // Health bar
    this.hpBarBg = scene.add.rectangle(x, y - 24, 40, 4, 0x333333);
    this.hpBarBg.setDepth(9998);
    this.hpBarFill = scene.add.rectangle(x, y - 24, 40, 4, 0x4488ff);
    this.hpBarFill.setOrigin(0, 0.5);
    this.hpBarFill.setDepth(9999);

    this.nameText = scene.add.text(x, y - 30, 'Ice Witch', {
      fontSize: '10px', fontFamily: 'Arial, sans-serif',
      color: '#88ccff', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(9999);
  }

  update(time, delta, player) {
    if (this._dying) return;

    if (this.isHurt) {
      this.hurtTimer -= delta;
      if (this.hurtTimer <= 0) {
        this.isHurt = false;
        this.setTint(this.phase === 2 ? 0x0044cc : 0x4488ff);
      }
      return;
    }

    // Phase transition at 50% HP
    if (this.health <= this.maxHealth / 2 && !this._phaseTransitioned) {
      this._phaseTransitioned = true;
      this.phase = 2;
      this.speed = 45;
      this.damage = 3;
      this.setTint(0x0044cc);
      this.scene.cameras.main.shake(300, 0.01);
      this.scene.showNotification('Ice Witch grows stronger!');
    }

    this._attackTimer -= delta;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const attackInterval = this.phase === 2 ? 2000 : 3000;

    if (this._attackTimer <= 0 && dist < 150) {
      this._attackTimer = attackInterval;
      if (this.phase === 2 && Math.random() < 0.4) {
        this._iceWallHazard(player);
      } else {
        this._iceBoltFan(player);
      }
    } else {
      this._chasePlayer(player);
    }

    this.hpBarBg.setPosition(this.x, this.y - 24);
    this.hpBarFill.setPosition(this.x - 20, this.y - 24);
    this.hpBarFill.width = 40 * (this.health / this.maxHealth);
    this.nameText.setPosition(this.x, this.y - 30);
    this.setDepth(this.y);
  }

  _chasePlayer(player) {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
  }

  _iceBoltFan(player) {
    this.setVelocity(0, 0);
    const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    const offsets = [-0.35, 0, 0.35];
    const speed = 120;

    for (const offset of offsets) {
      const angle = baseAngle + offset;
      const bolt = this.scene.add.rectangle(this.x, this.y, 6, 6, 0x44aaff, 0.9);
      bolt.setDepth(9990);
      bolt.setRotation(angle);
      this.scene.physics.add.existing(bolt, false);
      bolt.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      bolt.body.setAllowGravity(false);
      bolt.slow = true;
      bolt.damage = this.damage;

      this.scene.physics.add.overlap(this.scene.player, bolt, () => {
        if (!bolt.active) return;
        if (!this.scene.player.invulnerable) {
          this.scene.player.takeDamage(1);
          this.scene.sfx.play('playerHurt');
          // Slow player briefly
          const origSpeed = this.scene.player.speed;
          this.scene.player.speed = Math.round(origSpeed * 0.5);
          this.scene.time.delayedCall(1500, () => {
            if (this.scene.player) this.scene.player.speed = origSpeed;
          });
        }
        bolt.destroy();
      });

      this._addTimer(this.scene.time.delayedCall(1500, () => {
        if (bolt.active) bolt.destroy();
      }));
    }

    this.scene.sfx.play('icebolt');
  }

  _iceWallHazard(player) {
    // Spawn 4 static ice blocks around the player
    const offsets = [[-20, 0], [20, 0], [0, -20], [0, 20]];
    for (const [ox, oy] of offsets) {
      const block = this.scene.add.rectangle(player.x + ox, player.y + oy, 16, 16, 0x88ccff, 0.8);
      block.setDepth(9985);
      this.scene.tweens.add({
        targets: block,
        alpha: 0,
        duration: 2000,
        onComplete: () => block.destroy(),
      });
      // Damage on touch
      this.scene.physics.add.existing(block, true);
      this.scene.physics.add.overlap(this.scene.player, block, () => {
        if (!block.active) return;
        if (!this.scene.player.invulnerable) {
          this.scene.player.takeDamage(1);
          this.scene.sfx.play('playerHurt');
        }
      });
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

    // Ice shatter particles
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const p = this.scene.add.circle(this.x, this.y, 3, [0x4488ff, 0x88ccff, 0xffffff, 0x0044cc][i % 4]);
      p.setDepth(10000);
      this.scene.tweens.add({
        targets: p,
        x: this.x + Math.cos(angle) * 40,
        y: this.y + Math.sin(angle) * 40,
        alpha: 0, duration: 500,
        onComplete: () => p.destroy(),
      });
    }

    this.scene.addGold(150);
    this.scene.addXP(300);
    this.scene.showNotification('Ice Witch defeated!');

    // Dark seal fragment
    if (this.scene.darkSeals !== undefined) {
      this.scene.darkSeals = (this.scene.darkSeals || 0) | 1;
    }

    const quest = this.scene.questManager.getQuest('clear_mountain');
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
