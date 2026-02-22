import Phaser from 'phaser';

export class LichKing extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'skeleton', 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.body.setSize(16, 24);
    this.body.setOffset(8, 4);
    this.setScale(3);
    this.setTint(0x220033); // Deep void purple

    this.health = 60;
    this.maxHealth = 60;
    this.speed = 25;
    this.damage = 2;
    this.enemyType = 'lich_king';
    this.weakness = null; // No elemental weakness
    this.knockbackResist = true;

    this.isHurt = false;
    this.hurtTimer = 0;
    this.phase = 1;
    this._phaseCount = 0;
    this._attackTimer = 0;
    this._spellCycle = 0; // alternates between fire/ice attacks
    this._dying = false;
    this._enraged = false;
    this._timers = [];

    // Health bar (wider for final boss)
    this.hpBarBg = scene.add.rectangle(x, y - 38, 64, 5, 0x333333);
    this.hpBarBg.setDepth(9998);
    this.hpBarFill = scene.add.rectangle(x, y - 38, 64, 5, 0x9900cc);
    this.hpBarFill.setOrigin(0, 0.5);
    this.hpBarFill.setDepth(9999);

    this.nameText = scene.add.text(x, y - 46, 'LICH KING', {
      fontSize: '11px', fontFamily: 'Arial, sans-serif',
      color: '#dd88ff', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(9999);

    // Pulsing aura effect
    this._auraTimer = 0;
  }

  update(time, delta, player) {
    if (this._dying) return;

    if (this.isHurt) {
      this.hurtTimer -= delta;
      if (this.hurtTimer <= 0) {
        this.isHurt = false;
        const tints = [0x220033, 0x440055, 0x660077];
        this.setTint(tints[this.phase - 1] || 0x220033);
      }
      return;
    }

    // Phase transitions at 40HP and 20HP
    if (this.health <= 20 && this.phase < 3) {
      this._enterPhase(3);
    } else if (this.health <= 40 && this.phase < 2) {
      this._enterPhase(2);
    }

    // Aura pulse visual
    this._auraTimer -= delta;
    if (this._auraTimer <= 0) {
      this._auraTimer = 400;
      this._spawnAuraParticle();
    }

    this._attackTimer -= delta;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const attackInterval = this._enraged ? 1000 : (this.phase === 3 ? 1400 : this.phase === 2 ? 1800 : 2500);

    if (this._attackTimer <= 0 && dist < 200) {
      this._attackTimer = attackInterval;
      this._doAttack(player);
    } else {
      this._chasePlayer(player);
    }

    this.hpBarBg.setPosition(this.x, this.y - 38);
    this.hpBarFill.setPosition(this.x - 32, this.y - 38);
    this.hpBarFill.width = 64 * (this.health / this.maxHealth);
    this.nameText.setPosition(this.x, this.y - 46);
    this.setDepth(this.y);
  }

  _enterPhase(phase) {
    this.phase = phase;
    const tints = [0x220033, 0x440055, 0x660077];
    this.setTint(tints[phase - 1]);
    this.scene.cameras.main.shake(500, 0.015);

    if (phase === 2) {
      this.speed = 38;
      this.damage = 3;
      // Show pre-battle dialogue
      this.scene.showNotification('Lich King: "You dare challenge Voleth the Undying?!"');
    } else if (phase === 3) {
      this.speed = 52;
      this.damage = 4;
      this._enraged = true;
      this.scene.showNotification('Lich King: ENRAGE! "ENOUGH!"');
    }
  }

  _doAttack(player) {
    if (this.phase === 1) {
      // Alternate fire and ice
      if (this._spellCycle % 2 === 0) {
        this._fireBlast(player);
      } else {
        this._iceFan(player);
      }
    } else if (this.phase === 2) {
      const roll = Math.random();
      if (roll < 0.3) {
        this._teleport(player);
      } else if (roll < 0.55) {
        this._chainBolt(player);
      } else if (this._spellCycle % 2 === 0) {
        this._fireBlast(player);
      } else {
        this._iceFan(player);
      }
    } else {
      // Phase 3 enrage: all attacks
      const roll = Math.random();
      if (roll < 0.25) this._teleport(player);
      else if (roll < 0.5) this._chainBolt(player);
      else if (roll < 0.75) this._fireBlast(player);
      else this._iceFan(player);
    }
    this._spellCycle++;
  }

  _chasePlayer(player) {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
  }

  _fireBlast(player) {
    this.setVelocity(0, 0);
    const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    const offsets = [-0.3, 0, 0.3];

    for (const offset of offsets) {
      const angle = baseAngle + offset;
      const bolt = this.scene.add.circle(this.x, this.y, 5, 0xff4400);
      bolt.setDepth(9990);
      this.scene.physics.add.existing(bolt, false);
      bolt.body.setVelocity(Math.cos(angle) * 140, Math.sin(angle) * 140);
      bolt.body.setAllowGravity(false);
      bolt.damage = this.damage;

      this.scene.physics.add.overlap(this.scene.player, bolt, () => {
        if (!bolt.active) return;
        if (!this.scene.player.invulnerable) {
          this.scene.player.takeDamage(1);
          if (this.scene.sfx) this.scene.sfx.play('playerHurt');
        }
        bolt.destroy();
      });

      this._addTimer(this.scene.time.delayedCall(1800, () => {
        if (bolt.active) bolt.destroy();
      }));
    }

    if (this.scene.sfx) this.scene.sfx.play('fireball');
  }

  _iceFan(player) {
    this.setVelocity(0, 0);
    const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    const offsets = [-0.5, -0.25, 0, 0.25, 0.5];

    for (const offset of offsets) {
      const angle = baseAngle + offset;
      const bolt = this.scene.add.rectangle(this.x, this.y, 7, 5, 0x88ccff, 0.9);
      bolt.setDepth(9990);
      bolt.setRotation(angle);
      this.scene.physics.add.existing(bolt, false);
      bolt.body.setVelocity(Math.cos(angle) * 100, Math.sin(angle) * 100);
      bolt.body.setAllowGravity(false);
      bolt.slow = true;
      bolt.damage = 1;

      this.scene.physics.add.overlap(this.scene.player, bolt, () => {
        if (!bolt.active) return;
        if (!this.scene.player.invulnerable) {
          this.scene.player.takeDamage(1);
          if (this.scene.sfx) this.scene.sfx.play('playerHurt');
          // Slow effect
          const origSpeed = this.scene.player.speed;
          this.scene.player.speed = Math.round(origSpeed * 0.5);
          this.scene.time.delayedCall(2000, () => {
            if (this.scene.player) this.scene.player.speed = origSpeed;
          });
        }
        bolt.destroy();
      });

      this._addTimer(this.scene.time.delayedCall(1500, () => {
        if (bolt.active) bolt.destroy();
      }));
    }
  }

  _teleport(player) {
    // Flash + teleport to random position nearby
    this.scene.tweens.add({
      targets: this, alpha: 0, duration: 150,
      onComplete: () => {
        if (this._dying) return;
        // Snap to a random position ~100-150px from player
        const angle = Math.random() * Math.PI * 2;
        const dist = 120 + Math.random() * 60;
        const nx = Phaser.Math.Clamp(player.x + Math.cos(angle) * dist, 20, (this.scene.worldWidth || 320) - 20);
        const ny = Phaser.Math.Clamp(player.y + Math.sin(angle) * dist, 20, (this.scene.worldHeight || 320) - 20);
        this.setPosition(nx, ny);
        this.scene.tweens.add({ targets: this, alpha: 1, duration: 150 });
        this.scene.cameras.main.shake(100, 0.005);
      },
    });
  }

  _chainBolt(player) {
    this.setVelocity(0, 0);

    // Find nearest enemy to player (not self) to chain to
    const enemies = this.scene.enemies ? this.scene.enemies.getChildren() : [];
    let chainTarget = null;
    let minDist = Infinity;
    for (const e of enemies) {
      if (e === this || !e.active) continue;
      const d = Phaser.Math.Distance.Between(player.x, player.y, e.x, e.y);
      if (d < minDist) { minDist = d; chainTarget = e; }
    }

    // Primary bolt toward player
    const angle1 = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    const bolt1 = this.scene.add.rectangle(this.x, this.y, 8, 4, 0xffee22, 0.9);
    bolt1.setDepth(9991);
    bolt1.setRotation(angle1);
    this.scene.physics.add.existing(bolt1, false);
    bolt1.body.setVelocity(Math.cos(angle1) * 160, Math.sin(angle1) * 160);
    bolt1.body.setAllowGravity(false);

    this.scene.physics.add.overlap(this.scene.player, bolt1, () => {
      if (!bolt1.active) return;
      if (!this.scene.player.invulnerable) {
        this.scene.player.takeDamage(this.damage);
        if (this.scene.sfx) this.scene.sfx.play('playerHurt');
      }
      // Chain to nearby enemy if any
      if (chainTarget && chainTarget.active) {
        const gx1 = player.x, gy1 = player.y;
        const gx2 = chainTarget.x, gy2 = chainTarget.y;
        this._drawLightningArc(gx1, gy1, gx2, gy2);
        if (chainTarget.takeDamage) chainTarget.takeDamage(2);
      }
      bolt1.destroy();
    });

    this._addTimer(this.scene.time.delayedCall(1500, () => {
      if (bolt1.active) bolt1.destroy();
    }));
  }

  _drawLightningArc(x1, y1, x2, y2) {
    const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * 30;
    const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * 30;
    const seg1 = this.scene.add.line(0, 0, x1, y1, midX, midY, 0xffee22, 0.9);
    const seg2 = this.scene.add.line(0, 0, midX, midY, x2, y2, 0xffee22, 0.9);
    seg1.setDepth(9992).setOrigin(0).setLineWidth(2);
    seg2.setDepth(9992).setOrigin(0).setLineWidth(2);
    this.scene.tweens.add({
      targets: [seg1, seg2], alpha: 0, duration: 200,
      onComplete: () => { seg1.destroy(); seg2.destroy(); },
    });
  }

  _spawnAuraParticle() {
    if (this._dying) return;
    const angle = Math.random() * Math.PI * 2;
    const r = 20 + Math.random() * 10;
    const p = this.scene.add.circle(
      this.x + Math.cos(angle) * r,
      this.y + Math.sin(angle) * r,
      2, 0xcc44ff, 0.7
    );
    p.setDepth(this.depth - 1);
    this.scene.tweens.add({
      targets: p, y: p.y - 15, alpha: 0, duration: 500,
      onComplete: () => p.destroy(),
    });
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

    // Pre-death dialogue
    this.scene.showNotification('Lich King: "Impossible... Greendale will never be free..."');

    this.scene.cameras.main.shake(700, 0.025);
    if (this.scene.sfx) this.scene.sfx.play('enemyDeath');

    // Void implosion particles
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const dist = 60 + Math.random() * 20;
      const p = this.scene.add.circle(
        this.x + Math.cos(angle) * dist,
        this.y + Math.sin(angle) * dist,
        5, [0x220033, 0x9900cc, 0xdd88ff, 0x440055][i % 4]
      );
      p.setDepth(10000);
      // Implode toward center then fade
      this.scene.tweens.add({
        targets: p,
        x: this.x, y: this.y,
        alpha: 0, duration: 800,
        delay: i * 20,
        onComplete: () => p.destroy(),
      });
    }

    this.scene.addGold(500);
    this.scene.addXP(1000);

    const quest = this.scene.questManager.getQuest('defeat_lich');
    if (quest && quest.state === 'active') {
      quest.progress = quest.objective.count;
      quest.state = 'ready';
      this.scene.updateQuestTracker();
    }

    this._timers = [];
    this.scene.events.emit('boss-defeated');

    // Trigger lich-specific victory (not regular checkVictory)
    this.scene.time.delayedCall(1000, () => {
      this.hpBarBg.destroy();
      this.hpBarFill.destroy();
      this.nameText.destroy();
      this.destroy();
      if (this.scene._triggerLichVictory) {
        this.scene._triggerLichVictory();
      } else {
        this.scene.checkVictory();
      }
    });
  }

  _destroyVisuals() {
    if (this.hpBarBg) this.hpBarBg.destroy();
    if (this.hpBarFill) this.hpBarFill.destroy();
    if (this.nameText) this.nameText.destroy();
  }
}
