import Phaser from 'phaser';
import { SFX } from '../systems/SFX.js';
import { Music } from '../systems/Music.js';
import { SaveManager } from '../systems/SaveManager.js';
import { MAPS } from '../data/Maps.js';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Store SFX globally so GameScene can access it
    if (!this.registry.get('sfx')) {
      this.registry.set('sfx', new SFX());
    }
    const sfx = this.registry.get('sfx');
    // Apply saved mute preference
    if (localStorage.getItem('lizzy-muted') === 'true') {
      sfx.muted = true;
    }

    // Title screen music — gentle interior track
    if (!this.registry.get('music')) {
      this.registry.set('music', new Music());
    }
    this.music = this.registry.get('music');
    // Start music on first user interaction (audio context requirement)
    this.input.keyboard.once('keydown', () => {
      if (!this.music.playing) {
        this.music.play('interior', sfx);
        if (sfx.muted && this.music.masterGain && this.music.ctx) {
          this.music.masterGain.gain.setValueAtTime(0, this.music.ctx.currentTime);
        }
      }
    });

    this.cameras.main.setBackgroundColor('#0a0a1a');

    // Subtle starfield
    for (let i = 0; i < 30; i++) {
      const sx = Math.random() * w;
      const sy = Math.random() * (h * 0.6);
      const star = this.add.circle(sx, sy, Math.random() < 0.3 ? 1.5 : 0.8, 0xffffff, 0.4 + Math.random() * 0.4);
      this.tweens.add({
        targets: star,
        alpha: { from: star.alpha, to: 0.1 },
        duration: 1000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
      });
    }

    // Title text
    this.add.text(w / 2, h / 3 - 12, 'LEGEND OF', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#8888cc',
    }).setOrigin(0.5);

    const title = this.add.text(w / 2, h / 3 + 6, 'LIZZY', {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffdd00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Gentle float on title
    this.tweens.add({
      targets: title,
      y: title.y - 3,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Lizzy idle sprite with gentle breathing animation
    const lizzy = this.add.sprite(w / 2, h / 2 + 20, 'lizzy');
    lizzy.play('lizzy-idle-down');
    lizzy.setScale(1.5);
    this.tweens.add({
      targets: lizzy,
      scaleX: 1.52, scaleY: 1.48,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Floating leaf particles
    this.time.addEvent({
      delay: 600,
      callback: () => {
        const lx = -10;
        const ly = Math.random() * h * 0.7;
        const colors = [0x88cc44, 0x66aa33, 0xaadd66, 0x558822];
        const leaf = this.add.ellipse(lx, ly, 4, 2, colors[Math.floor(Math.random() * 4)], 0.6);
        leaf.setDepth(1);
        this.tweens.add({
          targets: leaf,
          x: w + 20,
          y: ly + (Math.random() - 0.3) * 60,
          rotation: Math.PI * 2 * (Math.random() > 0.5 ? 1 : -1),
          alpha: 0,
          duration: 4000 + Math.random() * 2000,
          ease: 'Sine.easeInOut',
          onComplete: () => leaf.destroy(),
        });
      },
      loop: true,
    });

    // Grass line at bottom
    for (let i = 0; i < w; i += 6) {
      const gh = 4 + Math.random() * 6;
      const grass = this.add.rectangle(i, h - gh / 2 - 14, 2, gh, 0x337722, 0.4 + Math.random() * 0.3);
      this.tweens.add({
        targets: grass, scaleX: 0.6,
        duration: 800 + Math.random() * 600,
        yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Math.random() * 800,
      });
    }

    // Check for save data
    const hasSave = SaveManager.hasSave();
    let saveInfo = '';
    if (hasSave) {
      const save = SaveManager.load();
      if (save) {
        saveInfo = ` (Lv.${save.level || 1})`;
      }
    }

    // Press ENTER prompt
    const promptText = hasSave ? `ENTER: Continue${saveInfo}  N: New` : 'Press ENTER';
    const prompt = this.add.text(w / 2, h - 36, promptText, {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: { from: 1, to: 0.2 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Credits
    this.add.text(w / 2, h - 14, 'Assets by Kenmi Art', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#555577',
    }).setOrigin(0.5);

    // Start game - continue from save
    this.input.keyboard.once('keydown-ENTER', () => {
      sfx.play('select');
      if (this.music) this.music.fadeOut(0.4);
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        if (hasSave) {
          const save = SaveManager.load();
          if (save) {
            const mapData = MAPS[save.mapName] || MAPS.overworld;
            this.scene.start('Game', {
              mapData: {
                ...mapData,
                playerSpawn: { x: save.playerX, y: save.playerY },
              },
              questState: save.questState,
              playerHealth: save.playerHealth,
              gold: save.gold,
              xp: save.xp,
              level: save.level,
              inventory: save.inventory,
              dayTime: save.dayTime,
              equipment: save.equipment,
              openedChests: save.openedChests || [],
              trackedQuestId: save.trackedQuestId || null,
              bestiary: save.bestiary || {},
              timedQuestId: save.timedQuestId || null,
              timedRemaining: save.timedRemaining || 0,
              tutorialShown: save.tutorialShown || false,
              playerAttackBonus: save.playerAttackBonus || 0,
              unlockedTeleports: save.unlockedTeleports || [],
            });
            return;
          }
        }
        this.scene.start('Game');
      });
    });

    // New game (deletes save)
    if (hasSave) {
      this.input.keyboard.once('keydown-N', () => {
        SaveManager.deleteSave();
        sfx.play('select');
        if (this.music) this.music.fadeOut(0.4);
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('Game');
        });
      });
    }
  }
}
