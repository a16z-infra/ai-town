import { Player } from '../game-objects/Player';
import { registry as REGISTRY_KEYS } from '../constants/registry';
import { ASSETS } from '../constants/assets';
import { SCENES } from '../constants/scenes';
import { EVENTS } from '../constants/events';

const DISTANCE_BETWEEN_HEARTS = 15;

export class UIScene extends Phaser.Scene {
  private hearts: Phaser.GameObjects.Sprite[];

  constructor() {
    super(SCENES.UI);

    this.hearts = [];
  }

  public get playerHp(): number {
    return this.registry.get(REGISTRY_KEYS.PLAYER.HP);
  }

  public set playerHp(newHp: number) {
    this.registry.set(REGISTRY_KEYS.PLAYER.HP, newHp);
  }

  protected create() {
    this.initHearts();
    this.events.on(EVENTS.HP_CHANGE, () => {
      this.updateHearts();
    });
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

    this.hearts = Array(this.playerHp)
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
      if (index >= this.playerHp) {
        heart.setAlpha(0);
      }
    });
  }
}
