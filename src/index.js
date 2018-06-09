/// <reference path="../typings/phaser.d.ts" />

import 'phaser';
import SceneA from './scenes/SceneA';

class PhaserGame extends Phaser.Game {
  constructor() {
    const config = {
      type: Phaser.AUTO,
      zoom: 3,
      width: 400,
      height: 250,
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
