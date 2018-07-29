import { Monster } from './Monster';
import { ASSETS } from '../constants/assets';

const DESTROY_SPRITE_ATTACK_DELAY = 200;

export class Treant extends Monster {
  protected WALK_ANIMATION = {
    down: { flip: false, anim: ASSETS.ANIMATIONS.TREANT_WALK_DOWN },
    up: { flip: false, anim: ASSETS.ANIMATIONS.TREANT_WALK_UP },
    left: { flip: true, anim: ASSETS.ANIMATIONS.TREANT_WALK_SIDE },
    right: { flip: false, anim: ASSETS.ANIMATIONS.TREANT_WALK_SIDE },
  };
  protected MONSTER_IDLE_DOWN = ASSETS.ANIMATIONS.TREANT_IDLE_DOWN;

  protected MONSTER_SPEED = 20;

  constructor(scene, x: number = 400, y: number = 400) {
    super(scene);

    this.hp = 3;
    this.gameObject = this.scene.physics.add
      .sprite(x, y, ASSETS.IMAGES.TREANT_IDLE_DOWN, 0)
      .setDepth(5);
    this.gameObject.setCollideWorldBounds(true);
    this.gameObject.setImmovable(true);
  }

  protected animateAttack() {
    const treantAttack = this.scene.physics.add.sprite(
      this.scene.player.gameObject.x,
      this.scene.player.gameObject.y,
      ASSETS.IMAGES.TREANT_ATTACK,
    );
    this.scene.time.addEvent({
      delay: DESTROY_SPRITE_ATTACK_DELAY,
      callback: () => (treantAttack ? treantAttack.destroy() : null),
      callbackScope: this,
    });
  }
}
