import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';
import { VictoryScene } from './scenes/VictoryScene.js';
import { DebugScene } from './scenes/DebugScene.js';

const config = {
  type: Phaser.AUTO,
  width: 320,
  height: 240,
  // pixelArt: true REMOVED — it forced NEAREST filtering on text canvases,
  // making them blocky. PreloadScene already sets NEAREST on all sprite textures.
  antialias: false,
  roundPixels: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: 2,
  },
  scene: [BootScene, PreloadScene, TitleScene, GameScene, UIScene, VictoryScene, DebugScene],
};

const game = new Phaser.Game(config);

// F9: Toggle debug scene overlay
window.addEventListener('keydown', (e) => {
  if (e.key === 'F9') {
    e.preventDefault();
    if (game.scene.isActive('Debug')) {
      game.scene.stop('Debug');
    } else {
      game.scene.start('Debug');
    }
  }
});

// Monkey-patch text factory: render all text at 4x internal resolution
// for crisp edges when the game canvas is scaled up by the browser
const origTextFactory = Phaser.GameObjects.GameObjectFactory.prototype.text;
Phaser.GameObjects.GameObjectFactory.prototype.text = function (x, y, text, style) {
  const t = origTextFactory.call(this, x, y, text, style);
  t.setResolution(8);
  if (!style || !style.fontStyle) t.setFontStyle('bold');
  return t;
};
