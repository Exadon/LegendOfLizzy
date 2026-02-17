import Phaser from 'phaser';

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super('Victory');
  }

  init(data) {
    this.stats = data || {};
  }

  create() {
    const _origText = this.add.text.bind(this.add);
    this.add.text = (x, y, content, style) => {
      return _origText(x, y, content, Object.assign({}, style, { resolution: 2 }));
    };

    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const sfx = this.registry.get('sfx');

    this.cameras.main.setBackgroundColor('#0a0a1a');
    this.cameras.main.fadeIn(1000, 0, 0, 0);

    // Starfield
    for (let i = 0; i < 40; i++) {
      const sx = Math.random() * w;
      const sy = Math.random() * h;
      const star = this.add.circle(sx, sy, Math.random() < 0.3 ? 1.5 : 0.8, 0xffffff, 0.3 + Math.random() * 0.5);
      this.tweens.add({
        targets: star,
        alpha: { from: star.alpha, to: 0.1 },
        duration: 1000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
      });
    }

    // Victory particles (gold sparkles falling)
    this.time.addEvent({
      delay: 200,
      callback: () => {
        const px = Math.random() * w;
        const colors = [0xffdd00, 0xffaa00, 0xffffff, 0xff8844];
        const p = this.add.circle(px, -4, 1.5, colors[Math.floor(Math.random() * 4)], 0.8);
        p.setDepth(1);
        this.tweens.add({
          targets: p,
          y: h + 10,
          x: px + (Math.random() - 0.5) * 40,
          alpha: 0,
          duration: 3000 + Math.random() * 2000,
          onComplete: () => p.destroy(),
        });
      },
      loop: true,
    });

    let yOff = 0;

    // "VICTORY" text
    this.time.delayedCall(500, () => {
      const victory = this.add.text(w / 2, 20, 'VICTORY', {
        fontSize: '18px',
        fontFamily: 'CuteFantasy',
        color: '#ffdd00',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({
        targets: victory,
        alpha: 1,
        y: 28,
        duration: 800,
        ease: 'Power2',
      });
      this.tweens.add({
        targets: victory,
        y: 25,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: 800,
      });
    });

    // Lizzy sprite
    this.time.delayedCall(1200, () => {
      const lizzy = this.add.sprite(w / 2, 64, 'lizzy');
      lizzy.play('lizzy-idle-down');
      lizzy.setScale(1.5).setAlpha(0);
      this.tweens.add({ targets: lizzy, alpha: 1, duration: 600 });
    });

    // Story text
    this.time.delayedCall(2000, () => {
      const storyLines = [
        'With the Skeleton King slain',
        'and the Pharaoh\'s curse lifted,',
        'peace returns to the land.',
        '',
        'Lizzy, the legendary warrior,',
        'has saved everyone.',
      ];
      const story = this.add.text(w / 2, 90, storyLines.join('\n'), {
        fontSize: '6px',
        fontFamily: 'CuteFantasy',
        color: '#ccccdd',
        align: 'center',
        lineSpacing: 4,
      }).setOrigin(0.5, 0).setAlpha(0);
      this.tweens.add({ targets: story, alpha: 1, duration: 800 });
    });

    // Stats
    this.time.delayedCall(4000, () => {
      const level = this.stats.level || 1;
      const gold = this.stats.gold || 0;
      const quests = this.stats.questsCompleted || 0;

      const statsText = this.add.text(w / 2, 148, [
        `Level: ${level}`,
        `Gold Earned: ${gold}`,
        `Quests Completed: ${quests}`,
      ].join('\n'), {
        fontSize: '6px',
        fontFamily: 'CuteFantasy',
        color: '#aabbcc',
        align: 'center',
        lineSpacing: 3,
      }).setOrigin(0.5, 0).setAlpha(0);
      this.tweens.add({ targets: statsText, alpha: 1, duration: 600 });
    });

    // Credits
    this.time.delayedCall(5500, () => {
      const credits = this.add.text(w / 2, 186, [
        '- CREDITS -',
        '',
        'Art: Kenmi Art',
        'Built with Phaser 3',
        'Made with love',
      ].join('\n'), {
        fontSize: '5px',
        fontFamily: 'CuteFantasy',
        color: '#888899',
        align: 'center',
        lineSpacing: 3,
      }).setOrigin(0.5, 0).setAlpha(0);
      this.tweens.add({ targets: credits, alpha: 1, duration: 600 });
    });

    // Return to title prompt
    this.time.delayedCall(7000, () => {
      const prompt = this.add.text(w / 2, h - 14, 'Press ENTER to return', {
        fontSize: '7px',
        fontFamily: 'CuteFantasy',
        color: '#ffffff',
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({
        targets: prompt,
        alpha: 1,
        duration: 400,
      });
      this.tweens.add({
        targets: prompt,
        alpha: { from: 1, to: 0.3 },
        duration: 600,
        yoyo: true,
        repeat: -1,
        delay: 400,
      });

      this.input.keyboard.once('keydown-ENTER', () => {
        if (sfx) sfx.play('select');
        this.cameras.main.fadeOut(800, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('Title');
        });
      });
    });
  }
}
