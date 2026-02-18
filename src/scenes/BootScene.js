import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    // Load a minimal loading bar asset (just a colored rectangle)
  }

  create() {
    this.scene.start('Preload');
  }
}
