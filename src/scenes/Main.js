let player;
let cursors;

const CAMERA_LERP = 0.06;
const PLAYER_SPEED = 100;

class Main extends Phaser.Scene {
  constructor() {
    super('Main');
  }

  preload() {
    this.load.image('logo', 'assets/logo.png');
    this.load.tilemapTiledJSON('myworld', 'assets/tilemap.json');
    this.load.image('tiles', 'assets/tiles.png');
    this.load.image('player', 'assets/player.png');
  }

  create() {
    const map = this.make.tilemap({ key: 'myworld' });
    const tileset = map.addTilesetImage('tileset', 'tiles', 16, 16, 0, 0);

    const layers = {
      background: map.createStaticLayer('background', tileset, 0, 0),
      obstacles: map.createStaticLayer('obstacles', tileset, 0, 0),
      obstaclesForeground: map.createStaticLayer('obstaclesForeground', tileset, 0, 0).setDepth(1),
    }
    layers.obstacles.setCollisionByProperty({ collides: true });

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    player = this.physics.add.image(800, 800, 'player');

    player.setCollideWorldBounds(true);
    this.physics.add.collider(player, layers.obstacles);

    this.cameras.main.startFollow(player, true, CAMERA_LERP, CAMERA_LERP);

    cursors = this.input.keyboard.createCursorKeys();
    this.add.graphics()
  }

  update() {
    player.setVelocity(0);

    if (cursors.left.isDown) {
      player.setVelocityX(-PLAYER_SPEED);
    } else if (cursors.right.isDown) {
      player.setVelocityX(PLAYER_SPEED);
    }

    if (cursors.up.isDown) {
      player.setVelocityY(-PLAYER_SPEED);
    } else if (cursors.down.isDown) {
      player.setVelocityY(PLAYER_SPEED);
    }
  }
}

export default Main;
