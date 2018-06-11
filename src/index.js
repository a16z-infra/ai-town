/// <reference path="../typings/phaser.d.ts" />

import 'phaser';
import Main from './scenes/Main';

class PhaserGame extends Phaser.Game {
  constructor() {
    const config = {
      type: Phaser.AUTO,
      parent: 'game-container',
      width: 400,
      height: 250,
      pixelArt: true,
      physics: {
        default: 'arcade',
      },
      scene: [Main],
    };
    super(config);
  }
}

const game = new PhaserGame();
