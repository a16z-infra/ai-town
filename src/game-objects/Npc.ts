import Main from '../scenes/Main';

const TEXT_VERTICAL_SHIFT = 10;
const NPC_POS = {
  x: 80,
  y: 150,
};

class Npc {
  scene: Main;
  gameObject: Phaser.Physics.Arcade.Sprite;
  textGameObject: Phaser.GameObjects.Text;

  constructor(scene) {
    this.scene = scene;
    this.gameObject = this.scene.physics.add.sprite(NPC_POS.x, NPC_POS.y, 'npcs', 0);
    this.textGameObject = this.scene.add.text(
      0,
      0,
      'Hello there! Watch out for those dangerous treants!',
      {
        align: 'center',
        fontSize: '10px',
      }
    );
    this.textGameObject.setWordWrapWidth(150);
    this.textGameObject.setPosition(
      this.gameObject.x + (this.gameObject.width - this.textGameObject.width) / 2,
      this.gameObject.y - this.textGameObject.height - TEXT_VERTICAL_SHIFT
    );
    this.textGameObject.setAlpha(0);
    this.gameObject.setImmovable(true);
  }

  helloNPC = () => {
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
