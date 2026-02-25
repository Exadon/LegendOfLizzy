import Phaser from 'phaser';
import { Music } from '../systems/Music.js';

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super('Victory');
  }

  init(data) {
    this.stats = data || {};
    this.trueEnding = data && data.trueEnding ? true : false;
    this.lichEnding = data && data.lichEnding ? true : false;
    this.direEnding = data && data.direEnding ? true : false;
    this.achievements = data && data.achievements ? data.achievements : {};
    this.petType = data && data.petType ? data.petType : null;
    this.petAffection = data && data.petAffection ? data.petAffection : 0;
    this.petName = data && data.petName ? data.petName : null;
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const sfx = this.registry.get('sfx');

    const bgColor = this.direEnding ? '#05000a' : (this.lichEnding ? '#0a0010' : '#0a0a1a');
    this.cameras.main.setBackgroundColor(bgColor);
    this.cameras.main.fadeIn(1000, 0, 0, 0);

    // Play victory music
    const music = this.registry.get('music');
    if (music) {
      music.play('victory', sfx);
    }

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

    // Victory particles (gold sparkles falling, or rainbow for dire ending)
    const DIRE_COLORS = [0xff4466, 0xff8844, 0xffdd00, 0x44ff88, 0x44aaff, 0xcc44ff, 0xff88cc];
    const GOLD_COLORS = [0xffdd00, 0xffaa00, 0xffffff, 0xff8844];
    this.time.addEvent({
      delay: this.direEnding ? 120 : 200,
      callback: () => {
        const px = Math.random() * w;
        const colors = this.direEnding ? DIRE_COLORS : GOLD_COLORS;
        const p = this.add.circle(px, -4, 1.5, colors[Math.floor(Math.random() * colors.length)], 0.9);
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
      const victoryLabel = this.direEnding ? 'LORD DIRE VANQUISHED!' : (this.lichEnding ? 'LICH KING DEFEATED!' : 'VICTORY');
      const victoryColor = this.direEnding ? '#ff88cc' : (this.lichEnding ? '#dd88ff' : '#ffdd00');
      const victory = this.add.text(w / 2, 20, victoryLabel, {
        fontSize: '18px',
        fontFamily: 'Arial, sans-serif',
        color: victoryColor,
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

    // Lizzy sprite + pet companion
    this.time.delayedCall(1200, () => {
      const lizzy = this.add.sprite(w / 2, 64, 'lizzy');
      lizzy.play('lizzy-idle-down');
      lizzy.setScale(1.5).setAlpha(0);
      this.tweens.add({ targets: lizzy, alpha: 1, duration: 600 });

      // Draw pet companion beside Lizzy
      if (this.petType) {
        const px = w / 2 + 28;
        const py = 64;
        if (this.petType === 'slime') {
          const petBody = this.add.circle(px, py, 5, 0x88ddff).setAlpha(0);
          this.tweens.add({ targets: petBody, alpha: 1, duration: 600 });
          this.tweens.add({ targets: petBody, y: py - 3, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 600 });
        } else if (this.petType === 'bat') {
          const petBody = this.add.circle(px, py, 3, 0x332244).setAlpha(0);
          this.tweens.add({ targets: petBody, alpha: 1, duration: 600 });
          this.add.triangle(px - 4, py, 0, 0, -6, -4, -2, 4, 0x443355).setAlpha(0.8);
          this.add.triangle(px + 4, py, 0, 0, 6, -4, 2, 4, 0x443355).setAlpha(0.8);
        } else if (this.petType === 'mushroom') {
          const cap = this.add.ellipse(px, py, 10, 7, 0xaa6633).setAlpha(0);
          const stem = this.add.rectangle(px, py + 5, 4, 5, 0x886644).setAlpha(0);
          this.tweens.add({ targets: [cap, stem], alpha: 1, duration: 600 });
        } else if (this.petType === 'fairy') {
          const petBody = this.add.circle(px, py, 4, 0xffdd44, 0.9).setAlpha(0);
          this.tweens.add({ targets: petBody, alpha: 1, duration: 600 });
          this.tweens.add({ targets: petBody, alpha: 0.5, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 600 });
        }
      }
    });

    // Story text
    this.time.delayedCall(2000, () => {
      let storyLines;
      let storyColor;
      if (this.direEnding) {
        storyLines = [
          'Lord Dire has fallen.',
          'The darkness that fed on fear,',
          'on shadow and despair —',
          'is gone.',
          '',
          'Seven crystals of light,',
          'one for each champion before you,',
          'now shine free.',
          '',
          'Lizzy — Light Bringer.',
          'Savior of the World.',
        ];
        storyColor = '#ff88cc';
      } else if (this.lichEnding) {
        storyLines = [
          'Six dungeons cleared.',
          'Six bosses defeated:',
          'Skeleton King. Pharaoh.',
          'Orc Chief. Ice Witch.',
          'Sea Serpent. Death Knight.',
          '',
          'And then... the Lich King.',
          'Magister Voleth, Undying No More.',
          '',
          'Greendale is free at last.',
        ];
        storyColor = '#dd88ff';
        if (this.trueEnding) {
          storyLines.push('', 'Three Star Fragments gathered.', 'The ancient seal crumbles.', 'A legend is born.', 'True Hero of Greendale.');
          storyColor = '#ffdd88';
        }
      } else {
        storyLines = [
          'With the Skeleton King slain,',
          'the Pharaoh\'s curse lifted,',
          'and the Orc Chief vanquished,',
          'peace returns to the land.',
          '',
          'Lizzy, the legendary warrior,',
          'has saved everyone.',
        ];
        storyColor = '#ccccdd';
        if (this.trueEnding) {
          storyLines.push('', 'You discovered all three', 'Star Fragments...', 'The ancient seal is broken.', 'A new adventure awaits.');
          storyColor = '#ffdd88';
        }
      }
      const story = this.add.text(w / 2, 90, storyLines.join('\n'), {
        fontSize: '12px',
        fontFamily: 'Arial, sans-serif',
        color: storyColor,
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
        fontSize: '12px',
        fontFamily: 'Arial, sans-serif',
        color: '#aabbcc',
        align: 'center',
        lineSpacing: 3,
      }).setOrigin(0.5, 0).setAlpha(0);
      this.tweens.add({ targets: statsText, alpha: 1, duration: 600 });
    });

    // Pet companion line
    this.time.delayedCall(4200, () => {
      if (!this.petType) return;
      const fallback = { slime: 'Slimey', bat: 'Batty', mushroom: 'Spore', fairy: 'Glimmer' };
      const petName = this.petName || fallback[this.petType] || this.petType;
      const aff = this.petAffection || 0;
      const hearts = Math.min(5, Math.floor(aff / 10));
      const emptyHearts = 5 - hearts;
      const companionText = this.add.text(w / 2, 172, `Companion: ${petName}  ${'♥'.repeat(hearts)}${'♡'.repeat(emptyHearts)}`, {
        fontSize: '11px',
        fontFamily: 'Arial, sans-serif',
        color: '#88ddff',
        stroke: '#001122',
        strokeThickness: 2,
        align: 'center',
      }).setOrigin(0.5, 0).setAlpha(0);
      this.tweens.add({ targets: companionText, alpha: 1, duration: 600 });
    });

    // Achievements earned — shown in two columns to avoid overflow
    this.time.delayedCall(4800, () => {
      const earned = Object.keys(this.achievements || {});
      if (earned.length === 0) return;
      const ACHIEVEMENT_LABELS = {
        first_blood: 'First Blood', boss_slayer: 'Boss Slayer',
        lich_vanquished: 'Lich Vanquished', crafter: 'Crafter',
        angler: 'Angler', hoarder: 'Hoarder',
        explorer: 'Explorer', true_hero: 'True Hero',
        storyteller: 'Storyteller', butterfly_collector: 'Nature Lover',
        beloved_friend: 'Beloved Friend', stargazer: 'Stargazer', treasure_hunter: 'Treasure Hunter',
        rainbow_chaser: 'Rainbow Chaser', lord_dire_vanquished: 'Light Bringer',
        loremaster: 'Loremaster', master_angler: 'Master Angler',
        all_seasons: 'All Seasons', decorate_home: 'Home Decorator',
        grand_festival: 'Town Hero', firefly_friend: 'Firefly Friend',
      };
      // Split into two columns if >4 achievements
      const labels = earned.map(id => `✓ ${ACHIEVEMENT_LABELS[id] || id}`);
      const half = Math.ceil(labels.length / 2);
      const col1 = labels.slice(0, half);
      const col2 = labels.slice(half);
      const headerY = this.petType ? 188 : 178;

      this.add.text(w / 2, headerY - 10, '— Achievements —', {
        fontSize: '9px', fontFamily: 'Arial, sans-serif',
        color: '#ffdd88', stroke: '#000000', strokeThickness: 2, align: 'center',
      }).setOrigin(0.5, 0).setAlpha(0.9);

      this.add.text(w / 4, headerY, col1.join('\n'), {
        fontSize: '9px', fontFamily: 'Arial, sans-serif',
        color: '#ffdd00', align: 'left', lineSpacing: 1,
      }).setOrigin(0.5, 0).setAlpha(0.9);

      if (col2.length > 0) {
        this.add.text(w * 3 / 4, headerY, col2.join('\n'), {
          fontSize: '9px', fontFamily: 'Arial, sans-serif',
          color: '#ffdd00', align: 'left', lineSpacing: 1,
        }).setOrigin(0.5, 0).setAlpha(0.9);
      }
    });

    // Return to title + New Game+ prompt
    this.time.delayedCall(6500, () => {
      const prompt = this.add.text(w / 2, h - 10, '[ENTER] Main Menu  •  [N] New Game+', {
        fontSize: '10px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5, 1).setAlpha(0);
      this.tweens.add({ targets: prompt, alpha: 1, duration: 400 });
      this.tweens.add({
        targets: prompt,
        alpha: { from: 1, to: 0.3 },
        duration: 600,
        yoyo: true,
        repeat: -1,
        delay: 400,
      });

      this._ngpKeyAdded = false;
      this.input.keyboard.once('keydown-ENTER', () => {
        if (this._ngpKeyAdded) return;
        if (sfx) sfx.play('select');
        this.cameras.main.fadeOut(800, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('Title');
        });
      });

      this.input.keyboard.once('keydown-N', () => {
        this._ngpKeyAdded = true;
        if (sfx) sfx.play('questAccept');
        this.cameras.main.fadeOut(800, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          if (this.registry.get('music')) this.registry.get('music').stop();
          this.scene.start('Game', {
            isNewGamePlus: true,
            level: 3,
            gold: 50,
            equipment: { weapon: 'wooden_sword', armor: 'cloth_armor' },
            achievements: this.achievements,
          });
        });
      });
    });
  }
}
