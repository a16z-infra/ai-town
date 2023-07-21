import { Player } from '../game-objects/Player';
import { ASSETS } from '../constants/assets';
import { SCENES } from '../constants/scenes';
import { EVENTS } from '../constants/events';
import { GameManager } from './GameManager';

const DISTANCE_BETWEEN_HEARTS = 15;

export class HUD extends Phaser.Scene {
  private hearts: Phaser.GameObjects.Sprite[];
  private gameManager: GameManager;

  constructor() {
    super(SCENES.HUD);

    this.hearts = [];
  }

  protected create() {
    const gameManager: any = this.scene.get(SCENES.GAME_MANAGER);
    this.gameManager = gameManager;

    this.gameManager.events.on(EVENTS.UPDATE_HP, () => {
      this.updateHearts();
    });

    this.initHearts();
  }

  private initHearts() {
    Array(Player.MAX_HP)
      .fill(0)
      .map((_, i) => {
        return this.add
          .sprite(
            (i + 1) * DISTANCE_BETWEEN_HEARTS,
            DISTANCE_BETWEEN_HEARTS,
            ASSETS.IMAGES.HEART_EMPTY,
          )
          .setScrollFactor(0)
          .setDepth(50);
      });

    this.hearts = Array(this.gameManager.playerHp)
      .fill(0)
      .map((_, i) => {
        return this.add
          .sprite((i + 1) * DISTANCE_BETWEEN_HEARTS, DISTANCE_BETWEEN_HEARTS, ASSETS.IMAGES.HEART)
          .setScrollFactor(0)
          .setDepth(100);
      });
  }

  private updateHearts() {
    this.hearts.map((heart, index) => {
      if (index >= this.gameManager.playerHp) {
        heart.setAlpha(0);
      }
    });
  }
}
