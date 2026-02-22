import Phaser from 'phaser';

export class SeaSerpent extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'slime', 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.body.setSize(20, 20);
    this.body.setOffset(6, 6);
    this.setScale(3);
    this.setTint(0x004488); // Deep sea blue

    this.health = 40;
    this.maxHealth = 40;
    this.speed = 35;
    this.damage = 2;
    this.enemyType = 'sea_serpent';
    this.weakness = 'ice';
    this.knockbackResist = true;

    this.isHurt = false;
    this.hurtTimer = 0;
    this.phase = 1;
    this._phaseTransitioned = false;
    this._attackTimer = 0;
    this._dying = false;
    this._darkSealsFragment = 2;
    this._timers = [];

    // Health bar
    this.hpBarBg = scene.add.rectangle(x, y - 30, 48, 4, 0x333333);
    this.hpBarBg.setDepth(9998);
    this.hpBarFill = scene.add.rectangle(x, y - 30, 48, 4, 0x004488);
    this.hpBarFill.setOrigin(0, 0.5);
    this.hpBarFill.setDepth(9999);

    this.nameText = scene.add.text(x, y - 38, 'Sea Serpent', {
      fontSize: '10px', fontFamily: 'Arial, sans-serif',
      color: '#44aaff', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(9999);
  }

  update(time, delta, player) {
    if (this._dying) return;

    if (this.isHurt) {
      this.hurtTimer -= delta;
      if (this.hurtTimer <= 0) {
        this.isHurt = false;
        this.setTint(this.phase === 2 ? 0x002266 : 0x004488);
      }
      return;
    }

    // Phase transition at 50% HP
    if (this.health <= this.maxHealth / 2 && !this._phaseTransitioned) {
      this._phaseTransitioned = true;
      this.phase = 2;
      this.speed = 50;
      this.damage = 3;
      this.setTint(0x002266);
      this.scene.cameras.main.shake(400, 0.012);
      this.scene.showNotification('Sea Serpent rises from the depths!');
    }

    this._attackTimer -= delta;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const attackInterval = this.phase === 2 ? 1800 : 2800;

    if (this._attackTimer <= 0 && dist < 160) {
      this._attackTimer = attackInterval;
      if (this.phase === 2 && Math.random() < 0.45) {
        this._tidalSurge(player);
      } else {
        this._tailSweep(player);
      }
    } else {
      this._chasePlayer(player);
    }

    this.hpBarBg.setPosition(this.x, this.y - 30);
    this.hpBarFill.setPosition(this.x - 24, this.y - 30);
    this.hpBarFill.width = 48 * (this.health / this.maxHealth);
    this.nameText.setPosition(this.x, this.y - 38);
    this.setDepth(this.y);
  }

  _chasePlayer(player) {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
  }

  _tailSweep(player) {
    this.setVelocity(0, 0);

    // Telegraph: expanding teal circle
    const telegraph = this.scene.add.circle(this.x, this.y, 10, 0x44ccaa, 0.5);
    telegraph.setDepth(9985);
    this.scene.tweens.add({
      targets: telegraph,
      scaleX: 6, scaleY: 6,
      alpha: 0,
      duration: 500,
      onComplete: () => telegraph.destroy(),
    });

    // Deal damage after telegraph
    this._addTimer(this.scene.time.delayedCall(500, () => {
      if (this._dying) return;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      if (dist < 60 && !this.scene.player.invulnerable) {
        this.scene.player.takeDamage(this.damage);
        if (this.scene.sfx) this.scene.sfx.play('playerHurt');
        this.scene.cameras.main.shake(200, 0.008);
      }
    }));
  }

  _tidalSurge(player) {
    this.setVelocity(0, 0);

    // Visual: wave rings emanating outward
    for (let i = 0; i < 3; i++) {
      this._addTimer(this.scene.time.delayedCall(i * 150, () => {
        if (this._dying) return;
        const ring = this.scene.add.circle(this.x, this.y, 20, 0x4488ff, 0.4);
        ring.setDepth(9984);
        this.scene.tweens.add({
          targets: ring,
          scaleX: 5, scaleY: 5,
          alpha: 0,
          duration: 600,
          onComplete: () => ring.destroy(),
        });
      }));
    }

    // Knockback + damage after 300ms
    this._addTimer(this.scene.time.delayedCall(300, () => {
      if (this._dying) return;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      if (dist < 120) {
        if (!this.scene.player.invulnerable) {
          this.scene.player.takeDamage(1);
          if (this.scene.sfx) this.scene.sfx.play('playerHurt');
        }
        // Push player away 200px
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        this.scene.player.setVelocity(
          Math.cos(angle) * 400,
          Math.sin(angle) * 400
        );
        this._addTimer(this.scene.time.delayedCall(300, () => {
          if (this.scene.player) this.scene.player.setVelocity(0, 0);
        }));
      }
    }));
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

    this.setScale(3.2);
    this.scene.tweens.add({
      targets: this, scaleX: 3, scaleY: 3,
      duration: 120, ease: 'Back.easeOut',
    });

    if (this.health <= 0) this._die();
  }

  _die() {
    this._dying = true;
    this.setVelocity(0, 0);
    this.body.enable = false;

    this.scene.cameras.main.shake(500, 0.018);
    if (this.scene.sfx) this.scene.sfx.play('enemyDeath');

    // Water splash particles
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2;
      const p = this.scene.add.circle(this.x, this.y, 4, [0x004488, 0x4488ff, 0x44ccff, 0x002266][i % 4]);
      p.setDepth(10000);
      this.scene.tweens.add({
        targets: p,
        x: this.x + Math.cos(angle) * 50,
        y: this.y + Math.sin(angle) * 50,
        alpha: 0, duration: 600,
        onComplete: () => p.destroy(),
      });
    }

    this.scene.addGold(150);
    this.scene.addXP(300);
    this.scene.showNotification('Sea Serpent defeated!');

    // Dark seal fragment #2
    if (this.scene.darkSeals !== undefined) {
      this.scene.darkSeals = (this.scene.darkSeals || 0) | 2;
    }

    const quest = this.scene.questManager.getQuest('clear_harbor');
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
