import 'phaser';
import { Main } from './scenes/Main';
import { Second } from './scenes/Second';
import { Preloader } from './scenes/Preloader';
import { UIScene } from './scenes/UIScene';

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
      scene: [Preloader, Main, Second, UIScene],
    };
    super(config);
  }
}

// tslint:disable-next-line
new PhaserGame();
