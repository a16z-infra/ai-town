import { Player } from '../game-objects/Player';
import { registry as REGISTRY_KEYS } from '../constants/registry';
import { ASSETS } from '../constants/assets';
import { scenes as SCENES } from '../constants/scenes';

const HIT_DELAY = 500;
const PLAYER_SPEED = 80;
const DISTANCE_BETWEEN_HEARTS = 15;
const PLAYER_RELOAD = 500;
const MAX_HP = 3;

export class UIScene extends Phaser.Scene {
  private score: number;
  private hearts: Phaser.GameObjects.Sprite[];

  constructor() {
    super(SCENES.UI);

    this.score = 0;
    this.hearts = [];
  }

  private initHearts() {
    Array(MAX_HP)
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

    this.hearts = Array(this.getHp())
      .fill(0)
      .map((_, i) => {
        return this.add
          .sprite((i + 1) * DISTANCE_BETWEEN_HEARTS, DISTANCE_BETWEEN_HEARTS, ASSETS.IMAGES.HEART)
          .setScrollFactor(0)
          .setDepth(100);
      });
  }

  private getHp() {
    return this.registry.get(REGISTRY_KEYS.PLAYER.HP);
  }

  private updateHearts() {
    this.hearts.map((heart, index) => {
      if (index >= this.getHp()) {
        heart.setAlpha(0);
      }
    });
  }

  private create() {
    this.initHearts();
    this.events.on('hp change', () => {
      this.updateHearts();
    });
  }
}
