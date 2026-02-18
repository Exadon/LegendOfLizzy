import Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'lizzy', 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    // The 64x64 frame has the character centered; body is ~16x20 pixels
    this.body.setSize(14, 14);
    this.body.setOffset(25, 40);

    this.speed = 80;
    this.direction = 'down';
    this.isAttacking = false;

    // Health
    this.maxHealth = 6; // 3 full hearts
    this.health = this.maxHealth;
    this.invulnerable = false;
    this.invulnerableTimer = 0;

    // Mana
    this.maxMana = 10;
    this.mana = this.maxMana;
    this.manaRegenRate = 1.5; // per second
    this.magicCost = 3;

    // Dodge roll
    this.isDodging = false;
    this.dodgeTimer = 0;
    this.dodgeDuration = 200; // ms
    this.dodgeSpeed = 200;
    this.dodgeCooldown = 0;
    this.dodgeCooldownDuration = 400; // ms

    // Combat - charge + combo
    this.attackPower = 1;
    this.chargeTime = 0;
    this.chargeThreshold = 500; // ms to fully charge
    this.isCharging = false;
    this.chargeGlow = null;
    this.comboCount = 0; // 0 = no combo, 1 = first hit done, can chain
    this.comboWindow = 0; // ms remaining to input combo
    this.comboWindowDuration = 350; // ms after first attack to chain

    // Input
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.attackKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.dodgeKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.wasd = {
      up: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // Sword hitbox (zone used as hitbox during attacks)
    this.swordHitbox = scene.add.zone(x, y, 20, 20);
    scene.physics.add.existing(this.swordHitbox, false);
    this.swordHitbox.body.enable = false;

    // Listen for attack animation completion
    this.on('animationcomplete', (anim) => {
      if (anim.key.includes('attack')) {
        this.isAttacking = false;
        this.swordHitbox.body.enable = false;

        // Start combo window after first hit (but not after combo hit)
        if (this.comboCount === 0) {
          this.comboCount = 1;
          this.comboWindow = this.comboWindowDuration;
          this._showComboWindowGlow();
        } else {
          this.comboCount = 0;
          this.comboWindow = 0;
        }
      }
    });

    this.play('lizzy-idle-down');
  }

  update(time, delta) {
    if (this.isDead) return;

    // Handle dodge roll
    if (this.isDodging) {
      this.dodgeTimer -= delta;
      // Flicker alpha for visual feedback
      this.setAlpha(Math.floor(time / 40) % 2 === 0 ? 0.4 : 0.8);
      if (this.dodgeTimer <= 0) {
        this.isDodging = false;
        this.invulnerable = false;
        this.setAlpha(1);
        this.setVelocity(0, 0);
      }
      return;
    }

    if (this.dodgeCooldown > 0) {
      this.dodgeCooldown -= delta;
    }

    // Combo window countdown
    if (this.comboWindow > 0) {
      this.comboWindow -= delta;
      if (this.comboWindow <= 0) {
        this.comboCount = 0;
      }
    }

    if (this.isAttacking) {
      this.setVelocity(0, 0);
      return;
    }

    // Mana regen
    if (this.mana < this.maxMana) {
      this.mana = Math.min(this.maxMana, this.mana + this.manaRegenRate * (delta / 1000));
      this.scene.events.emit('mana-changed', this.mana, this.maxMana);
    }

    // Handle invulnerability flicker
    if (this.invulnerable) {
      this.invulnerableTimer -= delta;
      this.setAlpha(Math.floor(time / 80) % 2 === 0 ? 0.3 : 1);
      if (this.invulnerableTimer <= 0) {
        this.invulnerable = false;
        this.setAlpha(1);
      }
    }

    // Charge attack: track hold time
    if (this.attackKey.isDown && !this.isAttacking) {
      this.chargeTime += delta;
      if (!this.isCharging && this.chargeTime > 80) {
        this.isCharging = true;
        this.setVelocity(0, 0);
      }
      // Visual charge feedback
      if (this.isCharging) {
        this._updateChargeGlow(time);
        // Slow down player while charging
        return;
      }
    }

    // Release attack key
    if (Phaser.Input.Keyboard.JustUp(this.attackKey) && this.isCharging) {
      const charged = this.chargeTime >= this.chargeThreshold;
      this._clearChargeGlow();
      this.chargeTime = 0;
      this.isCharging = false;
      this.attack(charged);
      return;
    }

    // Quick tap attack (or combo input)
    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      // If in combo window, do combo attack
      if (this.comboCount === 1 && this.comboWindow > 0) {
        this.comboCount = 2;
        this.comboWindow = 0;
        this.attack(false, true);
        return;
      }
      // Reset charge tracking
      this.chargeTime = 0;
      this.isCharging = false;
    }

    // If attack key was tapped briefly and released, do normal attack
    if (!this.attackKey.isDown && this.chargeTime > 0 && this.chargeTime < 80) {
      this._clearChargeGlow();
      this.chargeTime = 0;
      this.isCharging = false;
      this.attack(false);
      return;
    }

    if (this.isCharging) return;

    // Movement
    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const up = this.cursors.up.isDown || this.wasd.up.isDown;
    const down = this.cursors.down.isDown || this.wasd.down.isDown;

    let vx = 0;
    let vy = 0;

    if (left) {
      vx = -this.speed;
      this.direction = 'left';
    } else if (right) {
      vx = this.speed;
      this.direction = 'right';
    }

    if (up) {
      vy = -this.speed;
      if (vx === 0) this.direction = 'up';
    } else if (down) {
      vy = this.speed;
      if (vx === 0) this.direction = 'down';
    }

    // Normalize diagonal movement
    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }

    // Dodge roll
    if (Phaser.Input.Keyboard.JustDown(this.dodgeKey) && this.dodgeCooldown <= 0) {
      this.dodge(vx, vy);
      return;
    }

    this.setVelocity(vx, vy);

    // Animations
    if (vx !== 0 || vy !== 0) {
      const walkDir = this.direction === 'left' ? 'right' : this.direction;
      this.play(`lizzy-walk-${walkDir}`, true);
      this.setFlipX(this.direction === 'left');
    } else {
      const idleDir = this.direction === 'left' ? 'right' : this.direction;
      this.play(`lizzy-idle-${idleDir}`, true);
      this.setFlipX(this.direction === 'left');
    }
  }

  _updateChargeGlow(time) {
    const progress = Math.min(this.chargeTime / this.chargeThreshold, 1);
    const fullyCharged = progress >= 1;

    const weaponColor = this._getWeaponColor();
    const chargedColor = weaponColor === 0xff6644 ? 0xff4400 : (weaponColor === 0xccccee ? 0xaaaadd : 0xffaa00);

    if (!this.chargeGlow) {
      this.chargeGlow = this.scene.add.circle(this.x, this.y, 8, weaponColor, 0.15);
      this.chargeGlow.setDepth(this.depth - 1);
    }

    this.chargeGlow.setPosition(this.x, this.y);
    const baseRadius = 8 + progress * 10;
    const pulse = fullyCharged ? Math.sin(time / 60) * 3 : 0;
    this.chargeGlow.setRadius(baseRadius + pulse);
    this.chargeGlow.setAlpha(0.15 + progress * 0.3);
    this.chargeGlow.setFillStyle(fullyCharged ? chargedColor : weaponColor, this.chargeGlow.alpha);
  }

  _clearChargeGlow() {
    if (this.chargeGlow) {
      this.chargeGlow.destroy();
      this.chargeGlow = null;
    }
  }

  dodge(moveVx, moveVy) {
    this.isDodging = true;
    this.dodgeTimer = this.dodgeDuration;
    this.dodgeCooldown = this.dodgeCooldownDuration;
    this.invulnerable = true;

    // Use movement direction if moving, otherwise use facing direction
    let dx, dy;
    if (moveVx !== 0 || moveVy !== 0) {
      const mag = Math.sqrt(moveVx * moveVx + moveVy * moveVy);
      dx = (moveVx / mag) * this.dodgeSpeed;
      dy = (moveVy / mag) * this.dodgeSpeed;
    } else {
      const offsets = {
        down: { x: 0, y: 1 },
        up: { x: 0, y: -1 },
        right: { x: 1, y: 0 },
        left: { x: -1, y: 0 },
      };
      const off = offsets[this.direction];
      dx = off.x * this.dodgeSpeed;
      dy = off.y * this.dodgeSpeed;
    }

    this.setVelocity(dx, dy);

    // Play walk anim sped up during dodge
    const walkDir = this.direction === 'left' ? 'right' : this.direction;
    this.play(`lizzy-walk-${walkDir}`, true);
    this.setFlipX(this.direction === 'left');

    // SFX
    const sfx = this.scene.sfx;
    if (sfx) sfx.play('dodge');
  }

  attack(charged = false, combo = false) {
    this.isAttacking = true;
    this.setVelocity(0, 0);

    // Set attack power for GameScene to read
    if (charged) {
      this.attackPower = 2;
    } else if (combo) {
      this.attackPower = 2;
    } else {
      this.attackPower = 1;
    }

    const attackDir = this.direction === 'left' ? 'right' : this.direction;
    this.play(`lizzy-attack-${attackDir}`, true);
    this.setFlipX(this.direction === 'left');

    // SFX
    const sfx = this.scene.sfx;
    if (sfx) {
      if (charged) {
        sfx.play('chargedSwing');
      } else {
        sfx.play('swordSwing');
      }
    }

    // Position and size sword hitbox based on direction and charge
    const reach = charged ? 24 : 20;
    const size = charged ? 26 : 20;
    const offsets = {
      down: { x: 0, y: reach },
      up: { x: 0, y: -reach },
      right: { x: reach, y: 0 },
      left: { x: -reach, y: 0 },
    };
    const off = offsets[this.direction];
    this.swordHitbox.setPosition(this.x + off.x, this.y + off.y);
    this.swordHitbox.body.setSize(size, size);
    this.swordHitbox.body.enable = true;

    // Weapon slash visual
    this._slashEffect(off, size, charged);

    // Charged attack visual: screen flash + bigger particle burst
    if (charged) {
      this._chargedAttackEffect();
    }

    // Combo visual: quick spark
    if (combo) {
      this._comboSparkEffect();
    }
  }

  _slashEffect(off, size, charged) {
    const weaponColor = this._getWeaponColor();
    const equip = this.scene.equipment;
    const isFireSword = equip && equip.weapon === 'fire_sword';
    const slashW = charged ? 18 : 14;
    const slashH = charged ? 4 : 3;

    // Arc/rectangle slash
    const sx = this.x + off.x;
    const sy = this.y + off.y;
    let angle = 0;
    if (this.direction === 'right') angle = 0;
    else if (this.direction === 'left') angle = Math.PI;
    else if (this.direction === 'down') angle = Math.PI / 2;
    else angle = -Math.PI / 2;

    const slash = this.scene.add.rectangle(sx, sy, slashW, slashH, weaponColor, 0.7);
    slash.setRotation(angle);
    slash.setDepth(9999);
    this.scene.tweens.add({
      targets: slash,
      alpha: 0, scaleX: 1.5, scaleY: 0.3,
      duration: 150,
      onComplete: () => slash.destroy(),
    });

    // Fire sword: trailing flame particles
    if (isFireSword) {
      for (let i = 0; i < 3; i++) {
        const fx = sx + (Math.random() - 0.5) * 8;
        const fy = sy + (Math.random() - 0.5) * 8;
        const flame = this.scene.add.circle(fx, fy, 2, [0xff4400, 0xff8800, 0xffcc00][i], 0.8);
        flame.setDepth(9999);
        this.scene.tweens.add({
          targets: flame,
          y: fy - 8 - Math.random() * 6,
          alpha: 0, scale: 0.3,
          duration: 250 + Math.random() * 100,
          onComplete: () => flame.destroy(),
        });
      }
    }
  }

  _getWeaponColor() {
    const equip = this.scene.equipment;
    if (!equip) return 0xffdd00;
    const w = equip.weapon;
    if (w === 'fire_sword') return 0xff6644;
    if (w === 'iron_sword') return 0xccccee;
    return 0xffdd00;
  }

  _chargedAttackEffect() {
    const weaponColor = this._getWeaponColor();
    // Flash
    const flash = this.scene.add.rectangle(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height / 2,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      weaponColor, 0.15
    ).setScrollFactor(0).setDepth(9998);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 150,
      onComplete: () => flash.destroy(),
    });

    // Ring burst
    const offsets = {
      down: { x: 0, y: 20 },
      up: { x: 0, y: -20 },
      right: { x: 20, y: 0 },
      left: { x: -20, y: 0 },
    };
    const off = offsets[this.direction];
    const cx = this.x + off.x;
    const cy = this.y + off.y;

    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + Math.random() * 0.5;
      const spark = this.scene.add.circle(cx, cy, 2, weaponColor, 0.9);
      spark.setDepth(9999);
      this.scene.tweens.add({
        targets: spark,
        x: cx + Math.cos(angle) * 20,
        y: cy + Math.sin(angle) * 20,
        alpha: 0,
        scale: 0.2,
        duration: 250,
        onComplete: () => spark.destroy(),
      });
    }
  }

  _showComboWindowGlow() {
    const weaponColor = this._getWeaponColor();
    const glow = this.scene.add.circle(this.x, this.y, 14, weaponColor, 0.25);
    glow.setDepth(this.depth - 1);
    // Shrink over the combo window duration then disappear
    this.scene.tweens.add({
      targets: glow,
      radius: 2,
      alpha: 0,
      duration: this.comboWindowDuration,
      ease: 'Power2',
      onComplete: () => glow.destroy(),
    });
  }

  _comboSparkEffect() {
    const offsets = {
      down: { x: 0, y: 16 },
      up: { x: 0, y: -16 },
      right: { x: 16, y: 0 },
      left: { x: -16, y: 0 },
    };
    const off = offsets[this.direction];
    const cx = this.x + off.x;
    const cy = this.y + off.y;

    // Quick cross spark
    const colors = [0xffffff, 0xffdd00];
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const spark = this.scene.add.circle(cx, cy, 1.5, colors[i % 2], 0.9);
      spark.setDepth(9999);
      this.scene.tweens.add({
        targets: spark,
        x: cx + Math.cos(angle) * 12,
        y: cy + Math.sin(angle) * 12,
        alpha: 0,
        duration: 180,
        onComplete: () => spark.destroy(),
      });
    }
  }

  takeDamage(amount = 1) {
    if (this.invulnerable) return;

    this.health -= amount;
    this.invulnerable = true;
    this.invulnerableTimer = 1000;

    // White damage flash (100ms)
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(100, () => {
      if (this.active) this.clearTint();
    });

    // Camera shake on hit (not on death — death has its own)
    if (this.health > 0) {
      this.scene.cameras.main.shake(120, 0.009);
    }

    // Knockback away from current facing
    const knockback = 120;
    const dirs = {
      down: { x: 0, y: -knockback },
      up: { x: 0, y: knockback },
      left: { x: knockback, y: 0 },
      right: { x: -knockback, y: 0 },
    };
    const kb = dirs[this.direction];
    this.setVelocity(kb.x, kb.y);

    this.scene.events.emit('player-health-changed', this.health, this.maxHealth);

    if (this.health <= 0) {
      this.health = 0;
      this.setVelocity(0, 0);
      this.isAttacking = false;
      this.isDead = true;

      // Camera shake
      this.scene.cameras.main.shake(300, 0.015);
      if (this.scene.sfx) this.scene.sfx.play('playerHurt');

      // Paul the Wizard rescue sequence
      this.scene.events.emit('player-dying');
    }
  }
}
