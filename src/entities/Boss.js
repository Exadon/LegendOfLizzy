import Phaser from 'phaser';

export class SkeletonKing extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'skeleton', 0);

    scene.add.existing(this);
    scene.physics.add.existing(this, false);

    this.body.setSize(20, 16);
    this.body.setOffset(6, 12);
    this.setCollideWorldBounds(true);
    this.setScale(2.5);
    this.setTint(0xff4444);

    // Stats
    this.health = 20;
    this.maxHealth = 20;
    this.damage = 3;
    this.speed = 25;
    this.enemyType = 'skeleton_king';

    // AI state
    this.phase = 1;
    this.actionTimer = 0;
    this.actionCooldown = 2000;
    this.isSlaming = false;
    this.slamCooldown = 0;
    this.summonCooldown = 0;
    this.hasSummoned = false;

    // Health bar
    this.healthBarBg = scene.add.rectangle(x, y - 30, 50, 5, 0x333333).setDepth(10000);
    this.healthBarFill = scene.add.rectangle(x, y - 30, 50, 5, 0xe74c3c).setDepth(10001);
    this.healthBarFill.setOrigin(0, 0.5);
    this.healthBarBg.setOrigin(0, 0.5);
    this.nameText = scene.add.text(x + 25, y - 38, 'SKELETON KING', {
      fontSize: '8px', fontFamily: 'CuteFantasy', color: '#ff6666',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(10002);

    this.play('skeleton-idle-down');
  }

  update(time, delta, player) {
    if (this.health <= 0) return;

    // Phase check
    if (this.health <= this.maxHealth / 2 && this.phase === 1) {
      this.phase = 2;
      this.setTint(0xff2222);
      this.speed = 35;
      // Phase 2 announcement
      const scene = this.scene;
      scene.showNotification('Skeleton King enrages!');
      scene.cameras.main.shake(200, 0.01);
    }

    this.actionTimer -= delta;
    this.slamCooldown -= delta;
    this.summonCooldown -= delta;

    if (this.isSlaming) return;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Phase 2: summon minions periodically
    if (this.phase === 2 && this.summonCooldown <= 0) {
      this.summonCooldown = 12000;
      this._summonMinions();
    }

    // AoE slam when player is close
    if (dist < 50 && this.slamCooldown <= 0) {
      this._aoeSLam();
      return;
    }

    // Chase player
    if (dist > 20) {
      const nx = dx / dist;
      const ny = dy / dist;
      this.setVelocity(nx * this.speed, ny * this.speed);

      // Animation direction
      if (Math.abs(dx) > Math.abs(dy)) {
        this.play('skeleton-walk-right', true);
        this.setFlipX(dx < 0);
      } else if (dy > 0) {
        this.play('skeleton-walk-down', true);
      } else {
        this.play('skeleton-walk-up', true);
      }
    } else {
      this.setVelocity(0, 0);
    }

    // Update health bar position
    this.healthBarBg.setPosition(this.x - 25, this.y - 30);
    this.healthBarFill.setPosition(this.x - 25, this.y - 30);
    const hpRatio = Math.max(0, this.health / this.maxHealth);
    this.healthBarFill.width = 50 * hpRatio;
    this.nameText.setPosition(this.x, this.y - 38);
  }

  _aoeSLam() {
    this.isSlaming = true;
    this.slamCooldown = 4000;
    this.setVelocity(0, 0);

    const scene = this.scene;

    // Wind-up
    scene.tweens.add({
      targets: this,
      y: this.y - 8,
      duration: 300,
      yoyo: true,
      onComplete: () => {
        // Slam impact
        scene.cameras.main.shake(150, 0.012);
        scene.sfx.play('chargedSwing');

        // AoE damage ring
        const ring = scene.add.circle(this.x, this.y, 5, 0xff4444, 0.6);
        ring.setDepth(9999);
        scene.tweens.add({
          targets: ring,
          radius: 55,
          alpha: 0,
          duration: 400,
          onComplete: () => ring.destroy(),
        });

        // Check if player is in range
        const dx = scene.player.x - this.x;
        const dy = scene.player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 55 && !scene.player.invulnerable) {
          scene.player.takeDamage(this.phase === 2 ? 3 : 2);
          scene.sfx.play('playerHurt');
        }

        this.isSlaming = false;
      },
    });
  }

  _summonMinions() {
    const scene = this.scene;
    scene.showNotification('Skeleton King summons minions!');

    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const sx = this.x + Math.cos(angle) * 40;
      const sy = this.y + Math.sin(angle) * 40;

      // Summon particle
      const poof = scene.add.circle(sx, sy, 8, 0x884488, 0.7);
      poof.setDepth(9999);
      scene.tweens.add({
        targets: poof,
        scale: 2,
        alpha: 0,
        duration: 300,
        onComplete: () => poof.destroy(),
      });

      scene.time.delayedCall(300, () => {
        if (this.health <= 0) return;
        const skel = scene.spawnSkeleton(sx, sy);
        skel.health = 2; // Weaker minions
      });
    }
  }

  takeDamage(amount, fromX, fromY) {
    if (this.health <= 0) return;

    this.health -= amount;

    // Knockback (reduced for boss)
    const dx = this.x - fromX;
    const dy = this.y - fromY;
    const mag = Math.sqrt(dx * dx + dy * dy) || 1;
    this.setVelocity((dx / mag) * 40, (dy / mag) * 40);

    // Flash
    this.setTint(0xffffff);
    this.scene.time.delayedCall(80, () => {
      if (this.active) {
        this.setTint(this.phase === 2 ? 0xff2222 : 0xff4444);
      }
    });

    if (this.health <= 0) {
      this._die();
    }
  }

  _die() {
    const scene = this.scene;
    this.setVelocity(0, 0);

    // Death sequence
    scene.cameras.main.shake(300, 0.015);
    scene.sfx.play('enemyDeath');

    // Big explosion
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const colors = [0xff4444, 0xffdd00, 0xffffff, 0xff8844];
      const particle = scene.add.circle(this.x, this.y, 3, colors[i % 4]);
      particle.setDepth(9999);
      scene.tweens.add({
        targets: particle,
        x: this.x + Math.cos(angle) * 40,
        y: this.y + Math.sin(angle) * 40,
        alpha: 0,
        scale: 0,
        duration: 600,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }

    // Rewards
    scene.addGold(100);
    scene.addXP(200);
    scene.showNotification('Skeleton King defeated! +100 Gold +200 XP');

    // Track quest
    const updated = scene.questManager.trackEvent('kill', { target: 'skeleton_king' });
    if (updated) scene.updateQuestTracker();
    if (scene.checkVictory) scene.checkVictory();

    // Cleanup
    this.healthBarBg.destroy();
    this.healthBarFill.destroy();
    this.nameText.destroy();

    scene.time.delayedCall(600, () => {
      this.destroy();
    });
  }
}
