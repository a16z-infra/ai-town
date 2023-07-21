import { Monster } from './Monster';
import { ASSETS } from '../constants/assets';

export class Mole extends Monster {
  protected WALK_ANIMATION = {
    down: { flip: false, anim: ASSETS.ANIMATIONS.MOLE_WALK_DOWN },
    up: { flip: false, anim: ASSETS.ANIMATIONS.MOLE_WALK_UP },
    left: { flip: true, anim: ASSETS.ANIMATIONS.MOLE_WALK_SIDE },
    right: { flip: false, anim: ASSETS.ANIMATIONS.MOLE_WALK_SIDE },
  };
  protected MONSTER_IDLE_DOWN = ASSETS.ANIMATIONS.MOLE_IDLE_DOWN;

  protected MONSTER_SPEED = 20;

  constructor(scene, x = 400, y = 400) {
    super(scene, x, y, ASSETS.IMAGES.MOLE_IDLE_DOWN);

    this.hp = 3;
    this.setDepth(5);
    this.setCollideWorldBounds(true);
    this.setImmovable(true);
  }

  protected animateAttack() {
    return undefined;
  }
}
