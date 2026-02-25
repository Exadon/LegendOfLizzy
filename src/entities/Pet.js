import Phaser from 'phaser';

export class Pet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, petType = 'slime') {
    super(scene, x, y, null);

    scene.add.existing(this);
    scene.physics.add.existing(this, false);

    this.body.setSize(8, 8);
    this.body.setOffset(-4, -4);
    this.setCollideWorldBounds(true);
    this.setVisible(false); // procedural visuals only

    this.petType = petType;
    this.followSpeed = 70;
    this.collectRadius = 30;
    this._bobTimer = 0;

    // Shared ability cooldown
    this._abilityCooldown = 0;
    this._abilityCooldownDuration = 8000; // default; overridden per type

    // Build procedural visuals
    this._buildVisuals(x, y);
  }

  _buildVisuals(x, y) {
    const scene = this.scene;
    this.body1 = null;
    this.body2 = null;
    this.wingL = null;
    this.wingR = null;

    if (this.petType === 'slime') {
      this.body1 = scene.add.circle(x, y, 5, 0x88ddff);
      this.body1.setDepth(y);
      scene.tweens.add({
        targets: this.body1,
        y: y - 3,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this._abilityCooldownDuration = 8000;

    } else if (this.petType === 'bat') {
      this.body1 = scene.add.circle(x, y, 3, 0x332244);
      this.body1.setDepth(y);
      this.wingL = scene.add.triangle(x - 4, y, 0, 0, -6, -4, -2, 4, 0x443355);
      this.wingL.setDepth(y);
      this.wingR = scene.add.triangle(x + 4, y, 0, 0, 6, -4, 2, 4, 0x443355);
      this.wingR.setDepth(y);
      this._flapTime = 0;
      this._abilityCooldownDuration = 6000;

    } else if (this.petType === 'mushroom') {
      this.body1 = scene.add.ellipse(x, y, 10, 7, 0xaa6633);
      this.body1.setDepth(y);
      this.body2 = scene.add.rectangle(x, y + 5, 4, 5, 0x886644);
      this.body2.setDepth(y);
      this._abilityCooldownDuration = 10000;

    } else if (this.petType === 'fairy') {
      this.body1 = scene.add.circle(x, y, 4, 0xffdd44, 0.9);
      this.body1.setDepth(y);
      scene.tweens.add({
        targets: this.body1,
        alpha: 0.5,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this._abilityCooldownDuration = 7000;
    }
  }

  _syncVisuals() {
    const x = this.x;
    const y = this.y;
    const yo = this._idleYOff || 0; // idle bob offset
    if (this.body1) {
      this.body1.setDepth(y);
      if (this.petType === 'slime') {
        this.body1.setX(x);
        // Y handled by tween, only override X
      } else {
        this.body1.setPosition(x, y + yo);
      }
    }
    if (this.body2) {
      this.body2.setPosition(x, y + 5 + yo);
      this.body2.setDepth(y);
    }
    if (this.wingL) {
      const flap = Math.sin((this._flapTime || 0) / 60) * 3;
      this.wingL.setPosition(x - 4, y + flap + yo);
      this.wingL.setDepth(y);
      this.wingR.setPosition(x + 4, y - flap + yo);
      this.wingR.setDepth(y);
    }
  }

  _destroyVisuals() {
    if (this.body1 && this.body1.active) this.body1.destroy();
    if (this.body2 && this.body2.active) this.body2.destroy();
    if (this.wingL && this.wingL.active) this.wingL.destroy();
    if (this.wingR && this.wingR.active) this.wingR.destroy();
    this.body1 = null;
    this.body2 = null;
    this.wingL = null;
    this.wingR = null;
  }

  update(time, delta, player) {
    // Cooldown tick
    if (this._abilityCooldown > 0) this._abilityCooldown -= delta;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Follow player with some lag
    if (dist > 28) {
      const nx = dx / dist;
      const ny = dy / dist;
      const spd = dist > 80 ? this.followSpeed * 1.5 : this.followSpeed;
      this.setVelocity(nx * spd, ny * spd);
      this._idleTime = 0;
      this._idleYOff = 0;
    } else {
      this.setVelocity(0, 0);
      // Idle gentle bob after 1.2s of stillness
      this._idleTime = (this._idleTime || 0) + delta;
      this._idleYOff = this._idleTime > 1200 ? Math.sin(time / 380) * 2.5 : 0;
    }

    if (this.petType === 'bat') {
      this._flapTime = (this._flapTime || 0) + delta;
    }

    this._syncVisuals();
    this.setDepth(this.y);
  }

  useAbility(scene) {
    if (this._abilityCooldown > 0) return false;
    if (this.petType === 'slime') return this._slimeStun(scene);
    if (this.petType === 'bat')   return this._echoPulse(scene);
    if (this.petType === 'mushroom') return this._sporeBurst(scene);
    if (this.petType === 'fairy')    return this._goldRush(scene);
    return false;
  }

  // --- Slime: stun AoE (was bark) ---
  _slimeStun(scene) {
    this._abilityCooldown = this._abilityCooldownDuration;
    if (scene.sfx) scene.sfx.play('petBark');

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const p = scene.add.circle(this.x, this.y, 2, 0x88ddff, 0.8);
      p.setDepth(9999);
      scene.tweens.add({
        targets: p,
        x: this.x + Math.cos(angle) * 36,
        y: this.y + Math.sin(angle) * 36,
        alpha: 0, scale: 0.3,
        duration: 300,
        onComplete: () => p.destroy(),
      });
    }
    const ring = scene.add.circle(this.x, this.y, 4, 0x88ddff, 0.3);
    ring.setDepth(9998);
    scene.tweens.add({
      targets: ring,
      scaleX: 15, scaleY: 15,
      alpha: 0,
      duration: 300,
      onComplete: () => ring.destroy(),
    });

    scene.enemies.getChildren().forEach((enemy) => {
      if (!enemy.active || enemy === scene.boss) return;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
      if (dist < 60) {
        enemy.isHurt = true;
        enemy.hurtTimer = 400;
        enemy.setVelocity(0, 0);
        enemy.setTint(0x88ddff);
      }
    });
    return true;
  }

  // --- Bat: echo pulse (reveals/tints enemies) ---
  _echoPulse(scene) {
    this._abilityCooldown = this._abilityCooldownDuration;
    if (scene.sfx) scene.sfx.play('fairyBuff');

    const ring = scene.add.circle(this.x, this.y, 4, 0xaaaaff, 0.4);
    ring.setDepth(9998);
    scene.tweens.add({
      targets: ring,
      scaleX: 25, scaleY: 25,
      alpha: 0,
      duration: 400,
      onComplete: () => ring.destroy(),
    });

    scene.enemies.getChildren().forEach((enemy) => {
      if (!enemy.active) return;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
      if (dist < 100) {
        enemy.setTint(0xffffff);
        scene.time.delayedCall(300, () => {
          if (enemy.active) enemy.clearTint();
        });
      }
    });
    return true;
  }

  // --- Mushroom: heal player 1 HP + spore particles ---
  _sporeBurst(scene) {
    this._abilityCooldown = this._abilityCooldownDuration;
    if (scene.sfx) scene.sfx.play('heal');

    if (scene.player.health < scene.player.maxHealth) {
      scene.player.health = Math.min(scene.player.maxHealth, scene.player.health + 1);
      if (scene.updateHealthBar) scene.updateHealthBar();
    }

    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const sx = this.x + Math.cos(angle) * 6;
      const sy = this.y + Math.sin(angle) * 6;
      const spore = scene.add.circle(sx, sy, 2, 0x88bb44, 0.9);
      spore.setDepth(9999);
      scene.tweens.add({
        targets: spore,
        x: sx + (Math.random() - 0.5) * 20,
        y: sy - 15 - Math.random() * 10,
        alpha: 0,
        duration: 600 + Math.random() * 300,
        onComplete: () => spore.destroy(),
      });
    }
    return true;
  }

  // --- Fairy: expand gold collect radius temporarily ---
  _goldRush(scene) {
    this._abilityCooldown = this._abilityCooldownDuration;
    if (scene.sfx) scene.sfx.play('fairyBuff');

    const origRadius = this.collectRadius;
    this.collectRadius = 80;

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const p = scene.add.circle(this.x, this.y, 2, 0xffdd44, 0.9);
      p.setDepth(9999);
      scene.tweens.add({
        targets: p,
        x: this.x + Math.cos(angle) * 20,
        y: this.y + Math.sin(angle) * 20,
        alpha: 0,
        duration: 500,
        onComplete: () => p.destroy(),
      });
    }

    scene.time.delayedCall(4000, () => {
      this.collectRadius = origRadius;
    });
    return true;
  }

  // Legacy bark() kept for compatibility
  bark(scene) {
    return this._slimeStun(scene);
  }

  // Attract nearby loot drops toward the player
  collectNearbyLoot(scene) {
    if (!scene.lootDrops) return;
    const children = scene.lootDrops.getChildren();
    for (const loot of children) {
      if (!loot.active) continue;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, loot.x, loot.y);
      if (dist < this.collectRadius) {
        if (!loot._magnetized) {
          loot._magnetized = true;
          scene.tweens.add({
            targets: loot,
            x: scene.player.x,
            y: scene.player.y,
            duration: 200,
            ease: 'Power2',
          });
        }
      }
    }
  }
}
