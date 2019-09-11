import { AbstractScene } from '../scenes/AbstractScene';
import { ASSETS } from '../constants/assets';

const TEXT_VERTICAL_SHIFT = 10;

export class Npc extends Phaser.Physics.Arcade.Sprite {
  public scene: AbstractScene;
  private textGameObject: Phaser.GameObjects.Text;

  constructor(scene: AbstractScene, x: number, y: number, text: string) {
    super(scene, x, y, ASSETS.IMAGES.NPCS, 0);
    this.scene = scene;
    this.scene.physics.add.existing(this);
    this.scene.add.existing(this);

    this.setDepth(5);
    this.textGameObject = this.scene.add.text(0, 0, text, { align: 'center', fontSize: '10px' });
    this.textGameObject.setWordWrapWidth(150);
    this.textGameObject.setPosition(
      this.x + (this.width - this.textGameObject.width) / 2,
      this.y - this.textGameObject.height - TEXT_VERTICAL_SHIFT,
    );
    this.textGameObject.setAlpha(0).setDepth(1000);
    this.setImmovable(true);
  }

  public talk = () => {
    this.textGameObject.setAlpha(1);
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
