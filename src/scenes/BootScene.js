import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    // Load a minimal loading bar asset (just a colored rectangle)
  }

  create() {
    // Ensure CuteFantasy font is loaded before proceeding
    document.fonts.load('10px CuteFantasy').then(() => {
      this.scene.start('Preload');
    }).catch(() => {
      // Fallback: proceed anyway after a delay
      this.time.delayedCall(500, () => this.scene.start('Preload'));
    });
  }
}
