import Player from '../game-objects/Player';
import Arrow from '../game-objects/Arrow';
import Treant from '../game-objects/Treant';

const CAMERA_LERP = 1;
const ARROW_SPEED = 150;
const TREANT_SPEED = 500;
const destroySpriteAttackDelay = 200;
const treantOpacityDelay = 100;
var treantAttack = null;

const NPC_POS = {
  x: 50,
  y: 150,
};

class Main extends Phaser.Scene {
  constructor() {
    super('Main');
    this.player = null;
    this.cursors = null;
    this.npc = {
      gameObject: null,
      textGameObject: null,
    };
    this.treant = null;
    this.hearts = [];
    this.tomb = null;
    this.map = null;
    this.layers = null;
  }

  helloNPC() {
    this.npc.textGameObject.setAlpha(1);
  }

  createMapWithLayers() {
    this.map = this.make.tilemap({ key: 'myworld' });
    const tileset = this.map.addTilesetImage('tileset', 'tiles', 16, 16, 0, 0);

    this.layers = {
      terrain: this.map.createStaticLayer('terrain', tileset, 0, 0),
      deco: this.map.createStaticLayer('deco', tileset, 0, 0),
      bridge: this.map.createStaticLayer('bridge', tileset, 0, 0),
    };
    this.layers.terrain.setCollisionByProperty({ collides: true });
    this.layers.deco.setCollisionByProperty({ collides: true });
  }

  initNpc() {
    this.npc.gameObject = this.physics.add.sprite(NPC_POS.x, NPC_POS.y, 'npcs', 0);
    this.npc.textGameObject = this.add.text(NPC_POS.x - 35, NPC_POS.y - 20, 'Hello there!', {
      align: 'center',
      fontSize: '10px',
    });
    this.npc.textGameObject.setAlpha(0);
    this.npc.gameObject.setImmovable(true);
  }

  addColliders() {
    this.physics.add.collider(this.treant.gameObject, this.layers.terrain);
    this.physics.add.collider(this.treant.gameObject, this.layers.deco);
    this.physics.add.collider(this.treant.gameObject, this.player.gameObject, this.treant.treantHit);

    this.physics.add.collider(this.player.gameObject, this.layers.terrain);
    this.physics.add.collider(this.player.gameObject, this.layers.deco);
    this.physics.add.collider(
      this.player.gameObject,
      this.npc.gameObject,
      this.helloNPC.bind(this)
    );
  }

  initCamera() {
    this.cameras.main.setRoundPixels(true);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.startFollow(this.player.gameObject, true, CAMERA_LERP, CAMERA_LERP);
  }

  create() {
    this.createMapWithLayers();

    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.player = new Player(this);

    this.initNpc();
    this.treant = new Treant(this);

    this.addColliders();

    this.initCamera();

    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update() {
    const keyPressed = {
      left: this.cursors.left.isDown,
      right: this.cursors.right.isDown,
      up: this.cursors.up.isDown,
      down: this.cursors.down.isDown,
      space: this.cursors.space.isDown,
      shift: this.cursors.shift.isDown,
    };

    this.treant.update();
    this.player.update(keyPressed);
  }
}

export default Main;
