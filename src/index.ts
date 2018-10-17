import 'phaser';
import { FirstLevel } from './scenes/FirstLevel';
import { SecondLevel } from './scenes/SecondLevel';
import { Preloader } from './scenes/Preloader';
import { GameManager } from './scenes/GameManager';
import { HUD } from './scenes/HUD';

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
      scene: [Preloader, FirstLevel, SecondLevel, GameManager, HUD],
    };
    super(config);
  }
}

// tslint:disable-next-line
new PhaserGame();
