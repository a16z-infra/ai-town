import { Orientation } from '../geometry/orientation';
import { AbstractScene } from '../scenes/AbstractScene';

type CharacterAnimation = {
  [K in Orientation]: {
    flip: boolean;
    anim: string;
  };
};

export abstract class Character extends Phaser.Physics.Arcade.Sprite {
  protected scene: AbstractScene;

  constructor(scene: AbstractScene, x: number, y: number, sprite: string) {
    super(scene, x, y, sprite, 0);
    this.scene = scene;
    this.scene.physics.add.existing(this);
    this.scene.add.existing(this);
  }

  protected animate(
    animationKeys: CharacterAnimation,
    orientation: Orientation,
  ) {
    const { flip, anim } = animationKeys[orientation];
    this.setFlipX(flip);
    this.play(anim, true);
  }
}
