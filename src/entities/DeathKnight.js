import Phaser from 'phaser';

export class DeathKnight extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'orc', 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.body.setSize(20, 24);
    this.body.setOffset(6, 4);
    this.setScale(2.5);
    this.setTint(0x553377); // Dark purple

    this.health = 45;
    this.maxHealth = 45;
    this.speed = 28;
    this.damage = 2;
    this.enemyType = 'death_knight';
    this.weakness = 'fire';
    this.knockbackResist = true;

    this.isHurt = false;
    this.hurtTimer = 0;
    this.phase = 1;
    this._phaseCount = 0;
    this._attackTimer = 0;
    this._dying = false;
    this._darkSealsFragment = 4;
    this._timers = [];
    this._summonedMinions = [];

    // Health bar
    this.hpBarBg = scene.add.rectangle(x, y - 32, 52, 4, 0x333333);
    this.hpBarBg.setDepth(9998);
    this.hpBarFill = scene.add.rectangle(x, y - 32, 52, 4, 0x553377);
    this.hpBarFill.setOrigin(0, 0.5);
    this.hpBarFill.setDepth(9999);

    this.nameText = scene.add.text(x, y - 40, 'Death Knight', {
      fontSize: '10px', fontFamily: 'Arial, sans-serif',
      color: '#bb88ff', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(9999);
  }

  update(time, delta, player) {
    if (this._dying) return;

    if (this.isHurt) {
      this.hurtTimer -= delta;
      if (this.hurtTimer <= 0) {
        this.isHurt = false;
        const tints = [0x553377, 0x331166, 0x220044];
        this.setTint(tints[this.phase - 1] || 0x553377);
      }
      return;
    }

    // Phase transitions at 67% and 33% HP
    const phase2Threshold = this.maxHealth * 0.67;
    const phase3Threshold = this.maxHealth * 0.33;
    if (this.health <= phase3Threshold && this.phase < 3) {
      this._enterPhase(3);
    } else if (this.health <= phase2Threshold && this.phase < 2) {
      this._enterPhase(2);
    }

    this._attackTimer -= delta;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const attackInterval = this.phase === 3 ? 1500 : this.phase === 2 ? 2000 : 2500;

    if (this._attackTimer <= 0 && dist < 180) {
      this._attackTimer = attackInterval;
      const roll = Math.random();
      if (this.phase >= 2 && roll < 0.3) {
        this._darkAura(player);
      } else if (this.phase >= 2 && roll < 0.55) {
        this._summonMinions();
      } else {
        this._swordRush(player);
      }
    } else if (this._attackTimer > 0 || dist >= 180) {
      this._chasePlayer(player);
    }

    this.hpBarBg.setPosition(this.x, this.y - 32);
    this.hpBarFill.setPosition(this.x - 26, this.y - 32);
    this.hpBarFill.width = 52 * (this.health / this.maxHealth);
    this.nameText.setPosition(this.x, this.y - 40);
    this.setDepth(this.y);
  }

  _enterPhase(phase) {
    this.phase = phase;
    const tints = [0x553377, 0x331166, 0x220044];
    const msgs = ['', 'Death Knight: "You cannot stop me!"', 'Death Knight: "DARKNESS ETERNAL!"'];
    this.setTint(tints[phase - 1]);
    this.speed += 8;
    this.damage = phase;
    this.scene.cameras.main.shake(350, 0.012);
    this.scene.showNotification(msgs[phase - 1] || '');
  }

  _chasePlayer(player) {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
  }

  _swordRush(player) {
    this.setVelocity(0, 0);
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);

    // Visual slash telegraph
    const slash = this.scene.add.rectangle(this.x, this.y, 40, 6, 0xcc44ff, 0.7);
    slash.setDepth(9990);
    slash.setRotation(angle);
    this.scene.tweens.add({
      targets: slash, alpha: 0, duration: 300,
      onComplete: () => slash.destroy(),
    });

    // Dash toward player
    this.setVelocity(Math.cos(angle) * 220, Math.sin(angle) * 220);
    this._addTimer(this.scene.time.delayedCall(250, () => {
      if (!this._dying) this.setVelocity(0, 0);
    }));

    // Damage if close during dash
    this._addTimer(this.scene.time.delayedCall(150, () => {
      if (this._dying) return;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      if (dist < 40 && !this.scene.player.invulnerable) {
        this.scene.player.takeDamage(this.damage);
        if (this.scene.sfx) this.scene.sfx.play('playerHurt');
        this.scene.cameras.main.shake(150, 0.006);
      }
    }));
  }

  _summonMinions() {
    this.setVelocity(0, 0);

    // Summon 2 skeleton-like minions (using Enemy class pattern — simple rectangles)
    const offsets = [[-40, 0], [40, 0]];
    for (const [ox, oy] of offsets) {
      const mx = this.x + ox;
      const my = this.y + oy;

      // Simple visual minion indicator (GameScene will handle actual enemy spawn)
      const summonFlash = this.scene.add.circle(mx, my, 12, 0x8844cc, 0.8);
      summonFlash.setDepth(9988);
      this.scene.tweens.add({
        targets: summonFlash, alpha: 0, scaleX: 2, scaleY: 2, duration: 400,
        onComplete: () => summonFlash.destroy(),
      });

      // Notify scene to spawn a zombie minion
      this._addTimer(this.scene.time.delayedCall(200, () => {
        if (!this._dying && this.scene._spawnDeathKnightMinion) {
          this.scene._spawnDeathKnightMinion(mx, my);
        }
      }));
    }

    this.scene.showNotification('Death Knight summons minions!');
  }

  _darkAura(player) {
    this.setVelocity(0, 0);

    // Pulsing dark circle AoE
    const aura = this.scene.add.circle(this.x, this.y, 30, 0x441166, 0.6);
    aura.setDepth(9987);
    this.scene.tweens.add({
      targets: aura,
      scaleX: 2.7, scaleY: 2.7,
      alpha: 0,
      duration: 600,
      onComplete: () => aura.destroy(),
    });

    // Damage if player in AoE radius
    this._addTimer(this.scene.time.delayedCall(300, () => {
      if (this._dying) return;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      if (dist < 80 && !this.scene.player.invulnerable) {
        this.scene.player.takeDamage(1);
        if (this.scene.sfx) this.scene.sfx.play('playerHurt');
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

    this.setScale(2.7);
    this.scene.tweens.add({
      targets: this, scaleX: 2.5, scaleY: 2.5,
      duration: 120, ease: 'Back.easeOut',
    });

    if (this.health <= 0) this._die();
  }

  _die() {
    this._dying = true;
    this.setVelocity(0, 0);
    this.body.enable = false;

    this.scene.cameras.main.shake(500, 0.02);
    if (this.scene.sfx) this.scene.sfx.play('enemyDeath');

    // Dark explosion particles
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const p = this.scene.add.circle(this.x, this.y, 4, [0x553377, 0xbb44ff, 0x221133, 0x8800cc][i % 4]);
      p.setDepth(10000);
      this.scene.tweens.add({
        targets: p,
        x: this.x + Math.cos(angle) * 55,
        y: this.y + Math.sin(angle) * 55,
        alpha: 0, duration: 600,
        onComplete: () => p.destroy(),
      });
    }

    this.scene.addGold(160);
    this.scene.addXP(320);
    this.scene.showNotification('Death Knight defeated!');

    // Dark seal fragment #3 (bit 4)
    if (this.scene.darkSeals !== undefined) {
      this.scene.darkSeals = (this.scene.darkSeals || 0) | 4;
    }

    const quest = this.scene.questManager.getQuest('clear_ruins');
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
