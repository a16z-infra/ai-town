import 'phaser';
import { Main } from './scenes/Main';
import { Second } from './scenes/Second';
import { Preloader } from './scenes/Preloader';

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
        // arcade: {
        //   debug: true,
        // },
      },
      scene: [Preloader, Main, Second],
    };
    super(config);
  }
}

// tslint:disable-next-line
new PhaserGame();
