import { AbstractScene } from '../scenes/AbstractScene';

type Orientation = 'left' | 'right' | 'up' | 'down';

type CharacterAnimation = {
  [K in Orientation]: {
    flip: boolean;
    anim: string;
  };
};

export abstract class Character {
  public gameObject: Phaser.Physics.Arcade.Sprite;

  protected scene: AbstractScene;

  constructor(scene: AbstractScene) {
    this.scene = scene;
  }

  protected animate(
    animationKeys: CharacterAnimation,
    orientation: Orientation,
  ) {
    const { flip, anim } = animationKeys[orientation];
    this.gameObject.setFlipX(flip);
    this.gameObject.play(anim, true);
  }
}
