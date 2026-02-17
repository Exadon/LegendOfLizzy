import Phaser from 'phaser';

const LOOT_TABLE = [
  { type: 'gold', amount: 20, weight: 30, label: '+20 Gold' },
  { type: 'gold', amount: 50, weight: 15, label: '+50 Gold' },
  { type: 'potion', id: 'health_potion', weight: 25, label: '+1 Health Potion' },
  { type: 'potion', id: 'speed_potion', weight: 15, label: '+1 Speed Potion' },
  { type: 'potion', id: 'shield_potion', weight: 10, label: '+1 Shield Potion' },
  { type: 'xp', amount: 50, weight: 5, label: '+50 XP' },
];

export class Chest extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'chest');

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static body

    this.setOrigin(0.5, 1);
    this.setDepth(y);

    this.opened = false;
    this.chestId = `chest_${Math.round(x)}_${Math.round(y)}`;

    // Prompt
    this.prompt = scene.add.text(x, y - 24, '[E]', {
      fontSize: '9px',
      fontFamily: 'CuteFantasy',
      color: '#ffdd00',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setVisible(false).setDepth(9999);

    // Sparkle hint
    this._sparkleTimer = 0;
  }

  update(time, delta, player) {
    if (this.opened) return;

    const dist = Phaser.Math.Distance.Between(this.x, this.y - 8, player.x, player.y);
    this.prompt.setVisible(dist < 30);

    // Periodic sparkle
    this._sparkleTimer -= delta;
    if (this._sparkleTimer <= 0) {
      this._sparkleTimer = 1500 + Math.random() * 1000;
      const spark = this.scene.add.circle(
        this.x + (Math.random() - 0.5) * 10,
        this.y - 8 + (Math.random() - 0.5) * 6,
        1, 0xffdd00, 0.8
      );
      spark.setDepth(this.y + 1);
      this.scene.tweens.add({
        targets: spark,
        alpha: 0,
        y: spark.y - 8,
        duration: 500,
        onComplete: () => spark.destroy(),
      });
    }
  }

  open(scene) {
    if (this.opened) return null;
    this.opened = true;
    this.prompt.destroy();

    // Pop-open animation
    this.setTint(0xffdd00);
    scene.tweens.add({
      targets: this,
      scaleX: 1.3,
      scaleY: 0.7,
      duration: 100,
      yoyo: true,
      onComplete: () => {
        this.setTint(0x888888);
        this.setAlpha(0.6);
      },
    });

    // Loot burst particles
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const colors = [0xffdd00, 0xffffff, 0xffaa00];
      const p = scene.add.circle(this.x, this.y - 8, 2, colors[i % 3], 0.9);
      p.setDepth(9999);
      scene.tweens.add({
        targets: p,
        x: this.x + Math.cos(angle) * 20,
        y: this.y - 8 + Math.sin(angle) * 20,
        alpha: 0,
        scale: 0,
        duration: 400,
        ease: 'Power2',
        onComplete: () => p.destroy(),
      });
    }

    // Roll loot
    const totalWeight = LOOT_TABLE.reduce((s, l) => s + l.weight, 0);
    let roll = Math.random() * totalWeight;
    let loot = LOOT_TABLE[0];
    for (const item of LOOT_TABLE) {
      roll -= item.weight;
      if (roll <= 0) { loot = item; break; }
    }

    return loot;
  }
}
