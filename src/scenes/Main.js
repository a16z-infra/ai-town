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
    this.load.image('tiles', 'assets/environment/tileset.png');
    this.load.spritesheet('player', 'assets/player.png', { frameWidth: 16, frameHeight: 16 });
  }

  create() {
    const map = this.make.tilemap({ key: 'myworld' });
    const tileset = map.addTilesetImage('tileset', 'tiles', 16, 16, 0, 0);

    const layers = {
      terrain: map.createStaticLayer('terrain', tileset, 0, 0),
      deco: map.createStaticLayer('deco', tileset, 0, 0),
    };
    layers.terrain.setCollisionByProperty({ collides: true });
    layers.deco.setCollisionByProperty({ collides: true });

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.player = this.physics.add.sprite(50, 200, 'player', 7);

    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, layers.terrain);
    this.physics.add.collider(this.player, layers.deco);

    this.cameras.main.setRoundPixels(true);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.player, true, CAMERA_LERP, CAMERA_LERP);

    this.cursors = this.input.keyboard.createCursorKeys();

    this.anims.create({
      key: 'left',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 2 }),
      framerate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'right',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 2 }),
      framerate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'up',
      frames: this.anims.generateFrameNumbers('player', { start: 3, end: 5 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'down',
      frames: this.anims.generateFrameNumbers('player', { start: 6, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'idle',
      frames: this.anims.generateFrameNumbers('player', { start: 7, end: 7 }),
      frameRate: 10,
      repeat: -1,
    });
  }

  update() {
    this.player.setVelocity(0);
    const keyPressed = {
      left: this.cursors.left.isDown,
      right: this.cursors.right.isDown,
      up: this.cursors.up.isDown,
      down: this.cursors.down.isDown,
    };

    const isUpDownPressed = keyPressed.up || keyPressed.down;

    if (keyPressed.left) {
      if (!isUpDownPressed) {
        this.player.scaleX = 1;
        this.player.play('left', true);
      }
      this.player.setVelocityX(-PLAYER_SPEED);
    } else if (keyPressed.right) {
      if (!isUpDownPressed) {
        this.player.scaleX = -1;
        this.player.play('right', true);
      }
      this.player.setVelocityX(PLAYER_SPEED);
    }

    if (keyPressed.up) {
      this.player.scaleX = 1;
      this.player.play('up', true);
      this.player.setVelocityY(-PLAYER_SPEED);
    } else if (keyPressed.down) {
      this.player.scaleX = 1;
      this.player.play('down', true);
      this.player.setVelocityY(PLAYER_SPEED);
    }

    const noKeyPressed = Object.values(keyPressed).filter(x => x).length === 0;
    if (noKeyPressed) {
      this.player.scaleX = 1;
      this.player.play('idle', true);
    }
  }
}

export default Main;
