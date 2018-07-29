import { Monster } from './Monster';
import { ASSETS } from '../constants/assets';

const DESTROY_SPRITE_ATTACK_DELAY = 200;

export class Mole extends Monster {
  protected WALK_ANIMATION = {
    down: { flip: false, anim: ASSETS.ANIMATIONS.MOLE_WALK_DOWN },
    up: { flip: false, anim: ASSETS.ANIMATIONS.MOLE_WALK_UP },
    left: { flip: true, anim: ASSETS.ANIMATIONS.MOLE_WALK_SIDE },
    right: { flip: false, anim: ASSETS.ANIMATIONS.MOLE_WALK_SIDE },
  };
  protected MONSTER_IDLE_DOWN = ASSETS.ANIMATIONS.MOLE_IDLE_DOWN;

  protected MONSTER_SPEED = 20;

  constructor(scene, x: number = 400, y: number = 400) {
    super(scene);

    this.hp = 3;
    this.gameObject = this.scene.physics.add
      .sprite(x, y, ASSETS.IMAGES.MOLE_IDLE_DOWN, 0)
      .setDepth(5);
    this.gameObject.setCollideWorldBounds(true);
    this.gameObject.setImmovable(true);
  }

  protected animateAttack() {
    return undefined;
  }
}
