import AbstractScene from '../scenes/AbstractScene';

const TEXT_VERTICAL_SHIFT = 10;

class Npc {
  scene: AbstractScene;
  gameObject: Phaser.Physics.Arcade.Sprite;
  textGameObject: Phaser.GameObjects.Text;

  constructor(scene: AbstractScene, x: number, y: number, text: string) {
    this.scene = scene;
    this.gameObject = this.scene.physics.add.sprite(x, y, 'npcs', 0).setDepth(5);
    this.textGameObject = this.scene.add.text(0, 0, text, { align: 'center', fontSize: '10px' });
    this.textGameObject.setWordWrapWidth(150);
    this.textGameObject.setPosition(
      this.gameObject.x + (this.gameObject.width - this.textGameObject.width) / 2,
      this.gameObject.y - this.textGameObject.height - TEXT_VERTICAL_SHIFT
    );
    this.textGameObject.setAlpha(0);
    this.gameObject.setImmovable(true);
  }

  talk = () => {
    this.textGameObject.setAlpha(1);
    this.scene.time.addEvent({
      delay: 3000,
      callback: this.hideText,
      callbackScope: this,
    });
  };

  hideText = () => {
    this.textGameObject.setAlpha(0);
  };
}

export default Npc;
