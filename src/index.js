/// <reference path="../typings/phaser.d.ts" />

import 'phaser';
import SceneA from './scenes/SceneA';

class PhaserGame extends Phaser.Game {
  constructor() {
    const config = {
      type: Phaser.AUTO,
      width: 600,
      height: 600,
      pixelArt: true,
      physics: {
        default: 'arcade',
      },
      scene: [SceneA],
    };
    super(config);
  }
}

const game = new PhaserGame();
