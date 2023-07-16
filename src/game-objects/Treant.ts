import { Monster } from './Monster';
import { ASSETS } from '../constants/assets';
import { debounce } from '../utils';

const DESTROY_SPRITE_ATTACK_DELAY = 200;
const TEXT_VERTICAL_SHIFT = 10;

export class Treant extends Monster {
  protected WALK_ANIMATION = {
    down: { flip: false, anim: ASSETS.ANIMATIONS.TREANT_WALK_DOWN },
    up: { flip: false, anim: ASSETS.ANIMATIONS.TREANT_WALK_UP },
    left: { flip: true, anim: ASSETS.ANIMATIONS.TREANT_WALK_SIDE },
    right: { flip: false, anim: ASSETS.ANIMATIONS.TREANT_WALK_SIDE },
  };
  protected MONSTER_IDLE_DOWN = ASSETS.ANIMATIONS.TREANT_IDLE_DOWN;
  private textGameObject: Phaser.GameObjects.Text;

  protected MONSTER_SPEED = 20;

  constructor(scene, x = 400, y = 400) {
    super(scene, x, y, ASSETS.IMAGES.TREANT_IDLE_DOWN);

    this.hp = 3;
    this.setDepth(5);
    this.setCollideWorldBounds(true);
    this.setImmovable(true);
    this.textGameObject = this.scene.add.text(0, 0, 'hello!', {
      align: 'center',
      fontSize: '10px',
    });
    this.textGameObject.setPosition(
      this.x + (this.width - this.textGameObject.width) / 2,
      this.y - this.textGameObject.height - TEXT_VERTICAL_SHIFT,
    );
    this.textGameObject.setAlpha(0).setDepth(1000);
  }

  protected animateAttack() {
    const treantAttack = this.scene.physics.add.sprite(
      this.scene.player.x,
      this.scene.player.y,
      ASSETS.IMAGES.TREANT_ATTACK,
    );
    this.scene.time.addEvent({
      delay: DESTROY_SPRITE_ATTACK_DELAY,
      callback: () => (treantAttack ? treantAttack.destroy() : null),
      callbackScope: this,
    });
  }

  public talkToNPC = async (
    npc: Phaser.GameObjects.GameObject,
    otherNpc: Phaser.GameObjects.GameObject,
  ) => {
    // const result = await fetch('http://localhost:3000/api/converse', {
    //   method: 'POST',
    // });
    // console.log('result: ', result);
    // const data = await fetch('http://localhost:3000/api/converse', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     // Add any other required headers
    //   },
    //   body: JSON.stringify({ key: 'value' }),
    // });
    // console.log(data);
    console.log(npc.name);
    this.textGameObject.setText('oooops');

    // Make the text game object visible
    this.textGameObject.setAlpha(1);

    // Set up a timer to hide the text after 3 seconds
    this.scene.time.addEvent({
      delay: 1000,
      callback: this.hideText,
      callbackScope: this,
    });
  };

  public talkToUser = () => {
    // Set the text of the text game object to the new text
    this.textGameObject.setText('oooops');

    // Make the text game object visible
    this.textGameObject.setAlpha(1);

    // Set up a timer to hide the text after 3 seconds
    this.scene.time.addEvent({
      delay: 3000,
      callback: this.hideText,
      callbackScope: this,
    });
  };

  private hideText = () => {
    this.textGameObject.setAlpha(0);
  };
}
