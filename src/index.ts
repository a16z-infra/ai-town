import 'phaser';
import { FirstLevel } from './scenes/FirstLevel';
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
      zoom: 2.5,
      pixelArt: true,
      physics: {
        default: 'arcade',
        // arcade: {
        //   debug: true,
        // },
      },
      scene: [Preloader, FirstLevel, Second, UIScene],
    };
    super(config);
  }
}

// tslint:disable-next-line
new PhaserGame();
