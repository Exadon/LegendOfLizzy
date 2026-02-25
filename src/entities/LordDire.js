import Phaser from 'phaser';

export class LordDire extends Phaser.Physics.Arcade.Image {
  constructor(scene, x, y) {
    // Use a 1×1 transparent placeholder; visuals are entirely procedural
    super(scene, x, y, '__DEFAULT');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setVisible(false); // hide the Image; we draw with Graphics
    this.body.setSize(28, 28);
    this.body.setOffset(-14, -14);
    this.setCollideWorldBounds(true);

    this.health = 90;
    this.maxHealth = 90;
    this.speed = 28;
    this.damage = 2;
    this.enemyType = 'lord_dire';
    this.weakness = null;
    this.knockbackResist = true;

    this._phase = 1;
    this._dying = false;
    this.isHurt = false;
    this._hurtTimer = 0;
    this._attackTimer = 0;
    this._auraTimer = 0;
    this._timers = [];

    // --- Procedural visuals ---
    this._gfx = scene.add.graphics();
    this._gfx.setDepth(500);

    // Pulsing outer shadow ring
    this._ring = scene.add.graphics();
    this._ring.setDepth(499);

    // HP bar
    this._hpBg   = scene.add.rectangle(x, y - 32, 72, 5, 0x111111).setDepth(9998);
    this._hpFill  = scene.add.rectangle(x - 36, y - 32, 72, 5, 0x6600aa).setOrigin(0, 0.5).setDepth(9999);
    this._nameText = scene.add.text(x, y - 40, 'LORD DIRE', {
      fontSize: '11px', fontFamily: 'Arial, sans-serif',
      color: '#cc44ff', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(9999);

    this._ringAngle = 0;
  }

  update(time, delta, player) {
    if (this._dying) return;

    // Hurt flash
    if (this.isHurt) {
      this._hurtTimer -= delta;
      if (this._hurtTimer <= 0) this.isHurt = false;
    }

    // Phase 2 at ≤45 HP
    if (this._phase === 1 && this.health <= 45) {
      this._enterPhase2();
    }

    // Redraw procedural visuals
    this._redrawGfx();

    // Aura particles
    this._auraTimer -= delta;
    if (this._auraTimer <= 0) {
      this._auraTimer = 300;
      this._spawnAuraParticle();
    }

    // Attack AI
    this._attackTimer -= delta;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const interval = this._phase === 2 ? 1600 : 2500;

    if (this._attackTimer <= 0 && dist < 220) {
      this._attackTimer = interval;
      if (this._phase === 2) {
        this._shadowBurst(player);
      } else {
        this._shadowVolley(player, 3);
      }
    } else {
      this._chasePlayer(player, delta);
    }

    // Sync HP bar + name
    const hx = this.x, hy = this.y;
    this._hpBg.setPosition(hx, hy - 32);
    this._hpFill.setPosition(hx - 36, hy - 32);
    this._hpFill.width = 72 * (this.health / this.maxHealth);
    this._nameText.setPosition(hx, hy - 40);
    this._gfx.setPosition(0, 0);
  }

  _enterPhase2() {
    this._phase = 2;
    this.speed = 45;
    this.damage = 3;
    this.scene.cameras.main.shake(600, 0.02);
    this.scene.showNotification('Lord Dire: "Seven seals broken... you will pay for this!"');
    if (this.scene.sfx) this.scene.sfx.play('voidExplosion');
    // Burst of shadow particles
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const p = this.scene.add.circle(
        this.x + Math.cos(angle) * 50, this.y + Math.sin(angle) * 50,
        4, [0x220033, 0x6600aa, 0xcc44ff][i % 3]
      ).setDepth(510);
      this.scene.tweens.add({
        targets: p, x: this.x, y: this.y, alpha: 0, duration: 500, delay: i * 20,
        onComplete: () => p.destroy(),
      });
    }
  }

  _redrawGfx() {
    this._gfx.clear();
    this._ring.clear();
    const x = this.x, y = this.y;
    const hurt = this.isHurt;

    // Outer pulsing shadow ring
    this._ringAngle = (this._ringAngle || 0) + 0.04;
    const ringR = 20 + Math.sin(this._ringAngle) * 3;
    this._ring.lineStyle(2, hurt ? 0xffffff : (this._phase === 2 ? 0xcc44ff : 0x6600aa), 0.5);
    this._ring.strokeCircle(x, y, ringR);

    // Shadow tendrils (4 spokes)
    for (let i = 0; i < 4; i++) {
      const a = this._ringAngle + (i / 4) * Math.PI * 2;
      const tx = x + Math.cos(a) * (ringR + 8);
      const ty = y + Math.sin(a) * (ringR + 8);
      this._ring.lineStyle(1, 0x440066, 0.6);
      this._ring.lineBetween(x, y, tx, ty);
    }

    // Core body: dark purple filled circle
    const bodyColor = hurt ? 0xffffff : (this._phase === 2 ? 0x440066 : 0x220033);
    this._gfx.fillStyle(bodyColor, 1);
    this._gfx.fillCircle(x, y, 14);

    // Inner glowing core
    this._gfx.fillStyle(hurt ? 0xffffff : (this._phase === 2 ? 0xcc44ff : 0x9900cc), 0.8);
    this._gfx.fillCircle(x, y, 7);

    // Eye (single void eye)
    this._gfx.fillStyle(hurt ? 0xff0000 : 0x000000, 1);
    this._gfx.fillCircle(x + 3, y - 2, 3);
    this._gfx.fillStyle(0xff44ff, 0.9);
    this._gfx.fillCircle(x + 4, y - 3, 1);
  }

  _spawnAuraParticle() {
    if (this._dying) return;
    const angle = Math.random() * Math.PI * 2;
    const r = 18 + Math.random() * 8;
    const p = this.scene.add.circle(
      this.x + Math.cos(angle) * r,
      this.y + Math.sin(angle) * r,
      2, [0x6600aa, 0xcc44ff, 0x220033][Math.floor(Math.random() * 3)], 0.7
    ).setDepth(498);
    this.scene.tweens.add({
      targets: p, y: p.y - 12, alpha: 0, duration: 600,
      onComplete: () => p.destroy(),
    });
  }

  _chasePlayer(player) {
    if (this.isHurt) return;
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
    if (this.scene.sfx && Math.random() < 0.02) this.scene.sfx.play('shadowStep');
  }

  // Phase 1: 3 shadow bolts aimed at player
  _shadowVolley(player, count) {
    this.setVelocity(0, 0);
    const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    const spread = count === 3 ? [-0.25, 0, 0.25] : [-0.4, -0.2, 0, 0.2, 0.4];
    if (this.scene.sfx) this.scene.sfx.play('darkShot');

    for (const offset of spread) {
      const angle = baseAngle + offset;
      const bolt = this.scene.add.circle(this.x, this.y, 5, 0x6600aa).setDepth(505);
      this.scene.physics.add.existing(bolt, false);
      bolt.body.setVelocity(Math.cos(angle) * 130, Math.sin(angle) * 130);
      bolt.body.setAllowGravity(false);

      const ov = this.scene.physics.add.overlap(this.scene.player, bolt, () => {
        if (!bolt.active) return;
        if (!this.scene.player.invulnerable) {
          this.scene.player.takeDamage(this.damage);
          if (this.scene.sfx) this.scene.sfx.play('playerHurt');
        }
        this.scene.physics.world.removeCollider(ov);
        bolt.destroy();
      });
      bolt.on('destroy', () => this.scene.physics.world.removeCollider(ov));

      this._addTimer(this.scene.time.delayedCall(2000, () => {
        if (bolt.active) bolt.destroy();
      }));
    }
  }

  // Phase 2: 5 bolts + a void wave ring
  _shadowBurst(player) {
    this.setVelocity(0, 0);
    this._shadowVolley(player, 5);
    if (this.scene.sfx) this.scene.sfx.play('voidExplosion');

    // Expanding void wave ring
    this.scene.time.delayedCall(300, () => {
      if (this._dying) return;
      const wave = this.scene.add.circle(this.x, this.y, 10, 0x440066, 0).setDepth(504);
      wave.setStrokeStyle(3, 0xcc44ff, 0.8);
      this.scene.tweens.add({
        targets: wave, radius: 80, alpha: 0, duration: 700,
        onUpdate: () => {
          if (!wave.active) return;
          // Check overlap manually (wave is a visual, not physics)
          if (!this.scene.player || !this.scene.player.active) return;
          const d = Phaser.Math.Distance.Between(wave.x, wave.y, this.scene.player.x, this.scene.player.y);
          if (!wave._hit && d < wave.radius + 12 && d > wave.radius - 14) {
            wave._hit = true;
            if (!this.scene.player.invulnerable) {
              this.scene.player.takeDamage(1);
              if (this.scene.sfx) this.scene.sfx.play('playerHurt');
            }
          }
        },
        onComplete: () => wave.destroy(),
      });
    });
  }

  _addTimer(timer) {
    this._timers.push(timer);
    return timer;
  }

  pauseTimers() {
    for (const t of this._timers) { if (t && t.paused !== undefined) t.paused = true; }
  }

  resumeTimers() {
    for (const t of this._timers) { if (t && t.paused !== undefined) t.paused = false; }
  }

  takeDamage(amount = 1) {
    if (this._dying) return;
    this.health -= amount;
    this.isHurt = true;
    this._hurtTimer = 180;
    if (this.health <= 0) this._die();
  }

  _die() {
    this._dying = true;
    this.setVelocity(0, 0);
    this.body.enable = false;

    this.scene.showNotification('Lord Dire: "The... light... it burns... no..."');
    this.scene.cameras.main.shake(800, 0.025);
    if (this.scene.sfx) this.scene.sfx.play('voidExplosion');

    // Implosion burst — rainbow colours (the crystals returning)
    const crystalColors = [0xff4444, 0xff9922, 0xffee00, 0x44ee44, 0x44aaff, 0xcc44ff, 0xff88cc];
    for (let i = 0; i < 28; i++) {
      const angle = (i / 28) * Math.PI * 2;
      const dist = 50 + Math.random() * 20;
      const p = this.scene.add.circle(
        this.x + Math.cos(angle) * dist,
        this.y + Math.sin(angle) * dist,
        4, crystalColors[i % crystalColors.length]
      ).setDepth(10000);
      this.scene.tweens.add({
        targets: p, x: this.x, y: this.y, alpha: 0, duration: 900, delay: i * 15,
        onComplete: () => p.destroy(),
      });
    }

    this.scene.addGold(500);
    this.scene.addXP(1500);

    this._timers = [];
    this.scene.events.emit('boss-defeated');

    this.scene.time.delayedCall(1200, () => {
      this._destroyVisuals();
      this.destroy();
      if (this.scene._triggerDireVictory) {
        this.scene._triggerDireVictory();
      }
    });
  }

  _destroyVisuals() {
    if (this._gfx)      this._gfx.destroy();
    if (this._ring)     this._ring.destroy();
    if (this._hpBg)     this._hpBg.destroy();
    if (this._hpFill)   this._hpFill.destroy();
    if (this._nameText) this._nameText.destroy();
  }
}
