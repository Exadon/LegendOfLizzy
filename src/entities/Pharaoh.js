import Phaser from 'phaser';

export class Pharaoh extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'pharaoh', 0);

    scene.add.existing(this);
    scene.physics.add.existing(this, false);

    this.body.setSize(20, 16);
    this.body.setOffset(6, 12);
    this.setCollideWorldBounds(true);
    this.setScale(2.5);

    // Stats
    this.health = 25;
    this.maxHealth = 25;
    this.damage = 3;
    this.speed = 30;
    this.enemyType = 'pharaoh';

    // AI state
    this.phase = 1;
    this.actionTimer = 0;
    this.isSlaming = false;
    this.slamCooldown = 0;
    this.summonCooldown = 0;
    this.sandstormCooldown = 0;
    this._timers = [];

    // Health bar
    this.healthBarBg = scene.add.rectangle(x, y - 30, 50, 5, 0x333333).setDepth(10000);
    this.healthBarFill = scene.add.rectangle(x, y - 30, 50, 5, 0xffcc00).setDepth(10001);
    this.healthBarFill.setOrigin(0, 0.5);
    this.healthBarBg.setOrigin(0, 0.5);
    this.nameText = scene.add.text(x + 25, y - 38, 'THE PHARAOH', {
      fontSize: '12px', fontFamily: 'Arial, sans-serif', color: '#ffcc00',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5, 1).setDepth(10002);

    this.play('pharaoh-idle-down');
  }

  update(time, delta, player) {
    if (this.health <= 0) return;

    // Phase check
    if (this.health <= this.maxHealth / 2 && this.phase === 1) {
      this.phase = 2;
      this.speed = 40;
      const scene = this.scene;
      scene.showNotification('The Pharaoh\'s curse intensifies!');
      scene.cameras.main.shake(300, 0.015);

      // 1s invulnerability during transition
      this._phaseInvuln = true;
      this._addTimer(scene.time.delayedCall(1000, () => { this._phaseInvuln = false; }));

      // Screen color flash
      const flash = scene.add.rectangle(
        scene.cameras.main.width / 2, scene.cameras.main.height / 2,
        scene.cameras.main.width, scene.cameras.main.height,
        0xffcc00, 0.35
      ).setScrollFactor(0).setDepth(9998);
      scene.tweens.add({ targets: flash, alpha: 0, duration: 500, onComplete: () => flash.destroy() });

      // Scale pulse 1.3→1.0
      this.setScale(3.25);
      scene.tweens.add({ targets: this, scale: 2.5, duration: 600, ease: 'Bounce.easeOut' });

      // Ring burst of 16 particles
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const colors = [0xffcc00, 0xff8800, 0xffdd00, 0xffffff];
        const p = scene.add.circle(this.x, this.y, 3, colors[i % 4], 0.9);
        p.setDepth(9999);
        scene.tweens.add({
          targets: p,
          x: this.x + Math.cos(angle) * 35,
          y: this.y + Math.sin(angle) * 35,
          alpha: 0, scale: 0.2, duration: 500, ease: 'Power2',
          onComplete: () => p.destroy(),
        });
      }

      this._addTimer(scene.time.delayedCall(100, () => { if (this.active) this.setTint(0xff8800); }));
    }

    this.slamCooldown -= delta;
    this.summonCooldown -= delta;
    this.sandstormCooldown -= delta;

    if (this.isSlaming) return;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Phase 2: sandstorm attack
    if (this.phase === 2 && this.sandstormCooldown <= 0) {
      this.sandstormCooldown = 8000;
      this._sandstorm();
    }

    // Summon scorpions periodically
    if (this.summonCooldown <= 0) {
      this.summonCooldown = this.phase === 2 ? 10000 : 15000;
      this._summonScorpions();
    }

    // AoE slam when close
    if (dist < 50 && this.slamCooldown <= 0) {
      this._aoeSLam();
      return;
    }

    // Chase
    if (dist > 20) {
      const nx = dx / dist;
      const ny = dy / dist;
      this.setVelocity(nx * this.speed, ny * this.speed);
      if (Math.abs(dx) > Math.abs(dy)) {
        this.play('pharaoh-walk-right', true);
        this.setFlipX(dx < 0);
      } else if (dy > 0) {
        this.play('pharaoh-walk-down', true);
      } else {
        this.play('pharaoh-walk-up', true);
      }
    } else {
      this.setVelocity(0, 0);
    }

    // Update health bar
    this.healthBarBg.setPosition(this.x - 25, this.y - 30);
    this.healthBarFill.setPosition(this.x - 25, this.y - 30);
    this.healthBarFill.width = 50 * Math.max(0, this.health / this.maxHealth);
    this.nameText.setPosition(this.x, this.y - 38);
  }

  _aoeSLam() {
    this.isSlaming = true;
    this.slamCooldown = 4000;
    this.setVelocity(0, 0);
    const scene = this.scene;
    const slamX = this.x;
    const slamY = this.y;

    // Telegraph: warning ring expanding over 500ms BEFORE damage
    const warn = scene.add.circle(slamX, slamY, 0, 0xffcc00, 0.0);
    warn.setStrokeStyle(1.5, 0xffcc00, 0.6);
    warn.setDepth(9998);
    scene.tweens.add({
      targets: warn,
      radius: 55,
      alpha: 0.15,
      duration: 500,
      onComplete: () => {
        warn.destroy();

        scene.tweens.add({
          targets: this,
          y: this.y - 8,
          duration: 300,
          yoyo: true,
          onComplete: () => {
            scene.cameras.main.shake(150, 0.012);
            scene.sfx.play('bossSlam');

            const ring = scene.add.circle(this.x, this.y, 5, 0xffcc00, 0.6);
            ring.setDepth(9999);
            scene.tweens.add({
              targets: ring, radius: 55, alpha: 0, duration: 400,
              onComplete: () => ring.destroy(),
            });

            const dx = scene.player.x - this.x;
            const dy = scene.player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 55 && !scene.player.invulnerable) {
              scene.player.takeDamage(this.phase === 2 ? 4 : 2);
              scene.sfx.play('playerHurt');
              if (scene.hitFreeze) scene.hitFreeze(50);
            }

            this.isSlaming = false;
          },
        });
      },
    });
  }

  _summonScorpions() {
    const scene = this.scene;
    scene.showNotification('The Pharaoh summons scorpions!');

    for (let i = 0; i < 2; i++) {
      const angle = (i / 2) * Math.PI * 2 + Math.random();
      const sx = this.x + Math.cos(angle) * 40;
      const sy = this.y + Math.sin(angle) * 40;

      const poof = scene.add.circle(sx, sy, 8, 0xffcc00, 0.7);
      poof.setDepth(9999);
      scene.tweens.add({
        targets: poof,
        scale: 2,
        alpha: 0,
        duration: 300,
        onComplete: () => poof.destroy(),
      });

      this._addTimer(scene.time.delayedCall(300, () => {
        if (this.health <= 0) return;
        if (scene.spawnScorpion) {
          scene.spawnScorpion(sx, sy);
        }
      }));
    }
  }

  _sandstorm() {
    const scene = this.scene;
    scene.showNotification('Sandstorm!');

    // Create sand particles across the screen
    for (let i = 0; i < 20; i++) {
      this._addTimer(scene.time.delayedCall(i * 100, () => {
        const sx = this.x + (Math.random() - 0.5) * 120;
        const sy = this.y + (Math.random() - 0.5) * 120;
        const sand = scene.add.circle(sx, sy, 2, 0xddbb66, 0.6);
        sand.setDepth(9999);
        scene.tweens.add({
          targets: sand,
          x: sand.x + 30,
          alpha: 0,
          duration: 400,
          onComplete: () => sand.destroy(),
        });

        // Damage check
        const dx = scene.player.x - sx;
        const dy = scene.player.y - sy;
        if (Math.sqrt(dx * dx + dy * dy) < 12 && !scene.player.invulnerable) {
          scene.player.takeDamage(1);
          if (scene.hitFreeze) scene.hitFreeze(30);
        }
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

  takeDamage(amount, fromX, fromY) {
    if (this.health <= 0) return;
    if (this._phaseInvuln) return;
    this.health -= amount;

    const dx = this.x - fromX;
    const dy = this.y - fromY;
    const mag = Math.sqrt(dx * dx + dy * dy) || 1;
    this.setVelocity((dx / mag) * 30, (dy / mag) * 30);

    this.setTint(0xffffff);
    this._addTimer(this.scene.time.delayedCall(80, () => {
      if (this.active) {
        this.setTint(this.phase === 2 ? 0xff8800 : 0xffcc00);
      }
    }));

    if (this.health <= 0) this._die();
  }

  _die() {
    const scene = this.scene;
    this.setVelocity(0, 0);
    scene.cameras.main.shake(300, 0.015);
    scene.sfx.play('enemyDeath');

    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const colors = [0xffcc00, 0xffdd00, 0xffffff, 0xff8844];
      const p = scene.add.circle(this.x, this.y, 3, colors[i % 4]);
      p.setDepth(9999);
      scene.tweens.add({
        targets: p,
        x: this.x + Math.cos(angle) * 40,
        y: this.y + Math.sin(angle) * 40,
        alpha: 0,
        scale: 0,
        duration: 600,
        ease: 'Power2',
        onComplete: () => p.destroy(),
      });
    }

    scene.addGold(150);
    scene.addXP(300);
    scene.showNotification('The Pharaoh is defeated! +150 Gold +300 XP');

    const updated = scene.questManager.trackEvent('kill', { target: 'pharaoh' });
    if (updated) scene.updateQuestTracker();
    scene.events.emit('boss-defeated');
    if (scene.checkVictory) scene.checkVictory();

    // Crystal drop
    const _bx = this.x, _by = this.y;
    scene.time.delayedCall(600, () => {
      if (scene._dropCrystal) scene._dropCrystal(_bx, _by + 20, 0xff9922, 'crystal_orange');
    });

    this.healthBarBg.destroy();
    this.healthBarFill.destroy();
    this.nameText.destroy();

    this._timers = [];
    scene.time.delayedCall(600, () => this.destroy());
  }
}
