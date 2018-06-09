const CAMERA_LERP = 1;
const PLAYER_SPEED = 100;

class Main extends Phaser.Scene {
  constructor() {
    super('Main');
    this.player = null;
    this.cursors = null;
  }

  preload() {
    this.load.image('logo', 'assets/logo.png');
    this.load.tilemapTiledJSON('myworld', 'assets/tilemap.json');
    this.load.image('tiles', 'assets/tiles.png');
    this.load.spritesheet('player', 'assets/player.png', { frameWidth: 16, frameHeight: 16 });
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

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.player = this.physics.add.image(800, 800, 'player', 7);

    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, layers.obstacles);

    this.cameras.main.setRoundPixels(true);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.player, true, CAMERA_LERP, CAMERA_LERP);

    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update() {
    this.player.setVelocity(0);

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-PLAYER_SPEED);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(PLAYER_SPEED);
    }

    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-PLAYER_SPEED);
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(PLAYER_SPEED);
    }
  }
}

export default Main;
