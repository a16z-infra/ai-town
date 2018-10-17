import { REGISTRY_KEYS } from '../constants/registry';
import { SCENES } from '../constants/scenes';
import { EVENTS } from '../constants/events';

export class GameManager extends Phaser.Scene {
  constructor() {
    super(SCENES.GAME_MANAGER);
  }

  public get playerHp(): number {
    return this.registry.get(REGISTRY_KEYS.PLAYER.HP);
  }

  public set playerHp(newHp: number) {
    this.registry.set(REGISTRY_KEYS.PLAYER.HP, newHp);
    this.events.emit(EVENTS.UPDATE_HP);
  }

  protected create() {
    this.scene.launch(SCENES.HUD);
  }
}
