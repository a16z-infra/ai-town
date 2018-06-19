import Main from '../scenes/Main';

const NPC_POS = {
  x: 50,
  y: 150,
};

class Npc {
  scene: Main;
  gameObject: Phaser.Physics.Arcade.Sprite;
  textGameObject: Phaser.GameObjects.Text;

  constructor(scene) {
    this.scene = scene;
    this.gameObject = this.scene.physics.add.sprite(NPC_POS.x, NPC_POS.y, 'npcs', 0);
    this.textGameObject = this.scene.add.text(NPC_POS.x - 35, NPC_POS.y - 20, 'Hello there!', {
      align: 'center',
      fontSize: '10px',
    });
    this.textGameObject.setAlpha(0);
    this.gameObject.setImmovable(true);

    this.helloNPC = this.helloNPC.bind(this);
  }

  helloNPC() {
    this.textGameObject.setAlpha(1);
  }
}

export default Npc;
