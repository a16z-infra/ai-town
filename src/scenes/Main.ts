import Arrow from '../game-objects/Arrow';
import Player from '../game-objects/Player';
import Treant from '../game-objects/Treant';
import Npc from '../game-objects/Npc';

const CAMERA_LERP = 1;

class Main extends Phaser.Scene {
  player: Player;
  cursors: CursorKeys;
  npcs: Npc[];
  treants: Treant[];
  map: Phaser.Tilemaps.Tilemap;
  treantGroup: Phaser.Physics.Arcade.Group;
  layers: {
    terrain: Phaser.Tilemaps.StaticTilemapLayer;
    deco: Phaser.Tilemaps.StaticTilemapLayer;
    bridge: Phaser.Tilemaps.StaticTilemapLayer;
  };

  constructor() {
    super('Main');
    this.player = null;
    this.cursors = null;
    this.npcs = [];
    this.treants = [];
    this.treantGroup = null;
    this.map = null;
    this.layers = null;
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

  addColliders() {
    this.treantGroup = this.physics.add.group(this.treants.map(treant => treant.gameObject));
    this.physics.add.collider(this.treantGroup, this.layers.terrain);
    this.physics.add.collider(this.treantGroup, this.layers.deco);
    // TODO refactor this for performance
    this.treants.map(treant =>
      this.physics.add.collider(treant.gameObject, this.player.gameObject, treant.treantHit)
    );

    this.physics.add.collider(this.player.gameObject, this.layers.terrain);
    this.physics.add.collider(this.player.gameObject, this.layers.deco);
    this.npcs.map(npc =>
      this.physics.add.collider(npc.gameObject, this.player.gameObject, npc.talk)
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

    const npcsMapObjects = this.map.objects.find(o => o.name === 'npcs');
    const npcs: any = npcsMapObjects ? npcsMapObjects.objects : [];
    this.npcs = npcs.map(npc => {
      return new Npc(this, npc.x, npc.y, npc.properties.message);
    });

    const treantsMapObjects = this.map.objects.find(o => o.name === 'treants');
    const treants: any = treantsMapObjects ? treantsMapObjects.objects : [];

    this.treants = treants.map(treant => {
      return new Treant(this, treant.x, treant.y);
    });

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

    this.treants.map(treant => treant.update());
    this.player.update(keyPressed);
  }
}

export default Main;
