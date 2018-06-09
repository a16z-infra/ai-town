let player;
let cursors;

class SceneA extends Phaser.Scene {
  constructor() {
    super('SceneA');
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

    const backgroundLayer = map.createStaticLayer('background', tileset, 0, 0);
    const obstaclesLayer = map.createStaticLayer('obstacles', tileset, 0, 0);
    obstaclesLayer.setCollisionByProperty({ collides: true });

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    player = this.physics.add.image(200, 300, 'player');

    player.setCollideWorldBounds(true);

    this.cameras.main.startFollow(player, true, 0.05, 0.05);

    cursors = this.input.keyboard.createCursorKeys();
  }

  update() {
    player.setVelocity(0);

    if (cursors.left.isDown) {
      player.setVelocityX(-200);
    } else if (cursors.right.isDown) {
      player.setVelocityX(200);
    }

    if (cursors.up.isDown) {
      player.setVelocityY(-200);
    } else if (cursors.down.isDown) {
      player.setVelocityY(200);
    }
  }
}

export default SceneA;
