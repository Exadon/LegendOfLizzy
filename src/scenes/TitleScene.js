import Phaser from 'phaser';
import { SFX } from '../systems/SFX.js';
import { SaveManager } from '../systems/SaveManager.js';
import { MAPS } from '../data/Maps.js';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    const _origText = this.add.text.bind(this.add);
    this.add.text = (x, y, content, style) => {
      return _origText(x, y, content, Object.assign({}, style, { resolution: 2 }));
    };

    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Store SFX globally so GameScene can access it
    if (!this.registry.get('sfx')) {
      this.registry.set('sfx', new SFX());
    }
    const sfx = this.registry.get('sfx');

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
      fontSize: '10px',
      fontFamily: 'CuteFantasy',
      color: '#8888cc',
    }).setOrigin(0.5);

    const title = this.add.text(w / 2, h / 3 + 6, 'LIZZY', {
      fontSize: '22px',
      fontFamily: 'CuteFantasy',
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

    // Lizzy idle sprite
    const lizzy = this.add.sprite(w / 2, h / 2 + 20, 'lizzy');
    lizzy.play('lizzy-idle-down');
    lizzy.setScale(1.5);

    // Check for save data
    const hasSave = SaveManager.hasSave();

    // Press ENTER prompt
    const promptText = hasSave ? 'ENTER: Continue  N: New Game' : 'Press ENTER';
    const prompt = this.add.text(w / 2, h - 36, promptText, {
      fontSize: '7px',
      fontFamily: 'CuteFantasy',
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
      fontSize: '5px',
      fontFamily: 'CuteFantasy',
      color: '#555577',
    }).setOrigin(0.5);

    // Start game - continue from save
    this.input.keyboard.once('keydown-ENTER', () => {
      sfx.play('select');
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
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('Game');
        });
      });
    }
  }
}
