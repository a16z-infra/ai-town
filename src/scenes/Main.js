const CAMERA_LERP = 1;
const PLAYER_SPEED = 100;
const TREANT_SPEED = 500;
var timedEvent;

const NPC_POS = {
  x: 50,
  y: 150,
};

class Main extends Phaser.Scene {
  constructor() {
    super('Main');
    this.player = {
      x: 50,
      y: 200,
      orientation: 'down'
    }
    this.cursors = null;
    this.npc = {
      gameObject: null,
      textGameObject: null,
    };
    this.treant = null;
  }

  preload() {
    this.load.image('logo', 'assets/logo.png');
    this.load.tilemapTiledJSON('myworld', 'assets/tilemap.json');
    this.load.image('tiles', 'assets/environment/tileset.png');
    this.load.spritesheet('idle-down', 'assets/spritesheets/hero/idle/hero-idle-front.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('idle-up', 'assets/spritesheets/hero/idle/hero-idle-back.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('idle-side', 'assets/spritesheets/hero/idle/hero-idle-side.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('walk-down', 'assets/spritesheets/hero/walk/hero-walk-front.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('walk-up', 'assets/spritesheets/hero/walk/hero-walk-back.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('walk-side', 'assets/spritesheets/hero/walk/hero-walk-side.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('attack-down', 'assets/spritesheets/hero/attack/hero-attack-front.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('attack-up', 'assets/spritesheets/hero/attack/hero-attack-back.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('attack-side', 'assets/spritesheets/hero/attack/hero-attack-side.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('player', 'assets/player.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('npcs', 'assets/npc.png', { frameWidth: 16, frameHeight: 16 });
    this.load.image('treant', 'assets/sprites/treant/idle/treant-idle-front.png');
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
    this.player = this.physics.add.sprite(50, 200, 'idle-down', 0);

    this.npc.gameObject = this.physics.add.sprite(NPC_POS.x, NPC_POS.y, 'npcs', 0);
    this.npc.textGameObject = this.add.text(NPC_POS.x - 35, NPC_POS.y - 20, 'Hello there!', {
      align: 'center',
      fontSize: '10px',
    });
    this.npc.textGameObject.setAlpha(0);

    this.treant = this.physics.add.sprite(100,200, 'treant');
    this.treant.setCollideWorldBounds(true);
    this.physics.add.collider(this.treant, layers.terrain);
    this.physics.add.collider(this.treant, layers.deco);
    this.physics.add.collider(this.treant, this.player);

    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, layers.terrain);
    this.physics.add.collider(this.player, layers.deco);
    this.physics.add.collider(this.player, this.npc.gameObject);
    this.npc.gameObject.setImmovable(true);

    this.cameras.main.setRoundPixels(true);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.player, true, CAMERA_LERP, CAMERA_LERP);

    this.cursors = this.input.keyboard.createCursorKeys();

    this.anims.create({
      key: 'left',
      frames: this.anims.generateFrameNumbers('walk-side', { start: 0, end: 2 }),
      framerate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'right',
      frames: this.anims.generateFrameNumbers('walk-side', { start: 0, end: 2 }),
      framerate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'up',
      frames: this.anims.generateFrameNumbers('walk-up', { start: 0, end: 2 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'down',
      frames: this.anims.generateFrameNumbers('walk-down', { start: 0, end: 2 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'idle-up',
      frames: this.anims.generateFrameNumbers('idle-up', { start: 0, end: 0 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'idle-down',
      frames: this.anims.generateFrameNumbers('idle-down', { start: 0, end: 0 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'idle-side',
      frames: this.anims.generateFrameNumbers('idle-side', { start: 0, end: 0 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'attack-down',
      frames: this.anims.generateFrameNumbers('attack-down', { start: 0, end: 2 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'attack-up',
      frames: this.anims.generateFrameNumbers('attack-up', { start: 0, end: 2 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'attack-side',
      frames: this.anims.generateFrameNumbers('attack-side', { start: 0, end: 2 }),
      frameRate: 10,
      repeat: -1
    });

    timedEvent = this.time.addEvent({
      delay: 500, 
      callback: this.moveTreant,
      callbackScope: this,
      repeat: Infinity,
      startAt: 2000
       });
  }

  update() {
    this.player.setVelocity(0);
    this.treant.setVelocity(0);
    this.treant.getCenter;
    const keyPressed = {
      left: this.cursors.left.isDown,
      right: this.cursors.right.isDown,
      up: this.cursors.up.isDown,
      down: this.cursors.down.isDown,
      space: this.cursors.space.isDown,
      shift: this.cursors.shift.isDown,
    };

    const isUpDownPressed = keyPressed.up || keyPressed.down;

    if (keyPressed.left) {
      if (!isUpDownPressed) {
        this.player.scaleX = -1;
        this.player.orientation = 'left';
        this.player.play('left', true);
      }
      this.player.setVelocityX(-PLAYER_SPEED);
    } else if (keyPressed.right) {
      if (!isUpDownPressed) {
        this.player.scaleX = 1;
        this.player.orientation = 'right';
        this.player.play('right', true);
      }
      this.player.setVelocityX(PLAYER_SPEED);
    }

    if (keyPressed.shift && this.player.body) {
      this.npc.textGameObject.setAlpha(1);
    }

    if (keyPressed.up) {
      this.player.scaleX = 1;
      this.player.orientation = 'up';
      this.player.play('up', true);
      this.player.setVelocityY(-PLAYER_SPEED);
    } else if (keyPressed.down) {
      this.player.scaleX = 1;
      this.player.orientation = 'down';
      this.player.play('down', true);
      this.player.setVelocityY(PLAYER_SPEED);
    }

    if (keyPressed.space) {
      switch (this.player.orientation) {
        case 'down':
          this.player.scaleX = 1;
          this.player.play('attack-down', true);
          break;
        case 'up':
          this.player.scaleX = 1;
          this.player.play('attack-up', true);
          break;
        case 'left':
          this.player.scaleX = -1;
          this.player.play('attack-side', true);
          break;
        case 'right':
          this.player.scaleX = 1;
          this.player.play('attack-side', true);
          break;
        default:
      }
    }

    const noKeyPressed = Object.values(keyPressed).filter(x => x).length === 0;
    if (noKeyPressed) {
      switch (this.player.orientation) {
        case 'down':
          this.player.scaleX = 1;
          this.player.play('idle-down', true);
          break;
        case 'up':
          this.player.scaleX = 1;
          this.player.play('idle-up', true);
          break;
        case 'left':
          this.player.scaleX = -1;
          this.player.play('idle-side', true);
          break;
        case 'right':
          this.player.scaleX = 1;
          this.player.play('idle-side', true);
          break;
        default:
      }
    }
  }

  moveTreant() {
    var diffX = this.treant.x - this.player.x;
    var diffY = this.treant.y - this.player.y;
      //Move according to X
      if(diffX < 0) {
        this.treant.scaleX = 1;
        this.treant.setVelocityX(TREANT_SPEED);
      } else {
        this.treant.scaleX = 1;
        this.treant.setVelocityX(-TREANT_SPEED);
      }
      //Move according to Y
      if(diffY < 0) {
        this.treant.scaleY = 1;
        this.treant.setVelocityY(TREANT_SPEED);
      } else {
        this.treant.scaleY = 1;
        this.treant.setVelocityY(-TREANT_SPEED);
      }
  
  }
}

export default Main;