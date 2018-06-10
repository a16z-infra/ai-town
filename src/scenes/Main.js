import { Time } from "phaser";

const CAMERA_LERP = 1;
const PLAYER_SPEED = 100;
const ARROW_SPEED = 150;
const TREANT_SPEED = 500;
const PLAYER_INITIAL_POSITION = {
  x: 50,
  y: 200,
};
const hitDelay = 500; //0.5s
const destroySpriteAttackDelay = 200;
const treantOpacityDelay = 100;
var timedEvent;
var treantAttack = null;
var loading = false; // loading arrows

const NPC_POS = {
  x: 50,
  y: 150,
};

class Main extends Phaser.Scene {
  constructor() {
    super('Main');
    this.player = {
      orientation: 'down',
      gameObject: null,
      hp: 10,
    }
    this.cursors = null;
    this.npc = {
      gameObject: null,
      textGameObject: null,
      isPlayerColliding: false,
    };
    this.treant = null;
    this.hearts = [];
  }

  preload() {
    this.load.image('logo', 'assets/logo.png');
    this.load.tilemapTiledJSON('myworld', 'assets/tilemap.json');
    this.load.image('tiles', 'assets/environment/tileset.png');
    this.load.image('arrow-up', 'assets/spritesheets/misc/arrow-up.png');
    this.load.image('arrow-side', 'assets/spritesheets/misc/arrow-side.png');
    this.load.spritesheet('idle-down', 'assets/spritesheets/hero/idle/hero-idle-front.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('idle-up', 'assets/spritesheets/hero/idle/hero-idle-back.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('idle-side', 'assets/spritesheets/hero/idle/hero-idle-side.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('walk-down', 'assets/spritesheets/hero/walk/hero-walk-front.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('walk-up', 'assets/spritesheets/hero/walk/hero-walk-back.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('walk-side', 'assets/spritesheets/hero/walk/hero-walk-side.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('attack-down', 'assets/spritesheets/hero/attack/hero-attack-front.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('attack-up', 'assets/spritesheets/hero/attack/hero-attack-back.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('attack-side', 'assets/spritesheets/hero/attack/hero-attack-side.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('attack-weapon-down', 'assets/spritesheets/hero/attack-weapon/hero-attack-front-weapon.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('attack-weapon-up', 'assets/spritesheets/hero/attack-weapon/hero-attack-back-weapon.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('attack-weapon-side', 'assets/spritesheets/hero/attack-weapon/hero-attack-side-weapon.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('player', 'assets/player.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('npcs', 'assets/npc.png', { frameWidth: 16, frameHeight: 16 });
    this.load.image('treant', 'assets/sprites/treant/idle/treant-idle-front.png');
    this.load.image('treantAttack', 'assets/environment/sliced-objects/trunk.png')
    this.load.image('heart', 'assets/heart.png')
  }

  helloNPC() {
    this.npc.isPlayerColliding = true;
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
    this.player.gameObject = this.physics.add.sprite(PLAYER_INITIAL_POSITION.x, PLAYER_INITIAL_POSITION.y, 'idle-down', 0);
    this.player.lastTimeHit = (new Date()).getTime()

    this.hearts = Array(this.player.hp).fill().map((_, i) => {
      return this.add.sprite((i + 1) * 15, 15, 'heart').setScrollFactor(0).setDepth(1);
    });

    this.npc.gameObject = this.physics.add.sprite(NPC_POS.x, NPC_POS.y, 'npcs', 0);
    this.npc.textGameObject = this.add.text(NPC_POS.x - 35, NPC_POS.y - 20, 'Hello there!', {
      align: 'center',
      fontSize: '10px',
    });
    this.npc.textGameObject.setAlpha(0);

    this.treant = this.physics.add.sprite(200, 300, 'treant');
    this.treant.hp = 3;
    this.treant.setCollideWorldBounds(true);
    this.physics.add.collider(this.treant, layers.terrain);
    this.physics.add.collider(this.treant, layers.deco);
    this.physics.add.collider(this.treant, this.player.gameObject, this.playerLoseHp.bind(this));

    this.player.gameObject.setCollideWorldBounds(true);
    this.physics.add.collider(this.player.gameObject, layers.terrain);
    this.physics.add.collider(this.player.gameObject, layers.deco);
    this.physics.add.collider(this.player.gameObject, this.npc.gameObject, this.helloNPC.bind(this));
    this.npc.gameObject.setImmovable(true);

    this.cameras.main.setRoundPixels(true);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.player.gameObject, true, CAMERA_LERP, CAMERA_LERP);

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
    this.anims.create({
      key: 'attack-weapon-down',
      frames: this.anims.generateFrameNumbers('attack-weapon-down', { start: 0, end: 2 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'attack-weapon-up',
      frames: this.anims.generateFrameNumbers('attack-weapon-up', { start: 0, end: 2 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'attack-weapon-side',
      frames: this.anims.generateFrameNumbers('attack-weapon-side', { start: 0, end: 2 }),
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
    this.destroyTreantAttack();
    this.checkTreantOpacity();
    if (this.player.gameObject.active) {
      this.player.gameObject.setVelocity(0);
    }
    if(this.treant.active) {
      this.treant.setVelocity(0);
    }

    const keyPressed = {
      left: this.cursors.left.isDown,
      right: this.cursors.right.isDown,
      up: this.cursors.up.isDown,
      down: this.cursors.down.isDown,
      space: this.cursors.space.isDown,
      shift: this.cursors.shift.isDown
    };

    const isUpDownPressed = keyPressed.up || keyPressed.down;

    if (keyPressed.left) {
      if (!isUpDownPressed) {
        this.player.gameObject.scaleX = -1;
        this.player.orientation = 'left';
        this.player.gameObject.play('left', true);
      }
      if (this.player.gameObject.active) {
        this.player.gameObject.setVelocityX(-PLAYER_SPEED);
      }
    } else if (keyPressed.right) {
      if (!isUpDownPressed) {
        this.player.gameObject.scaleX = 1;
        this.player.orientation = 'right';
        this.player.gameObject.play('right', true);
      }
      if (this.player.gameObject.active) {
        this.player.gameObject.setVelocityX(PLAYER_SPEED);
      }
    }

    if (this.npc.isPlayerColliding) {
      this.npc.textGameObject.setAlpha(1);
    }

    if (keyPressed.up) {
      this.player.gameObject.scaleX = 1;
      this.player.orientation = 'up';
      this.player.gameObject.play('up', true);
      if (this.player.gameObject.active) {
        this.player.gameObject.setVelocityY(-PLAYER_SPEED);
      }
    } else if (keyPressed.down) {
      this.player.gameObject.scaleX = 1;
      this.player.orientation = 'down';
      this.player.gameObject.play('down', true);
      if (this.player.gameObject.active) {
        this.player.gameObject.setVelocityY(PLAYER_SPEED);
      }
    }

    if (keyPressed.space) {
      switch (this.player.orientation) {
        case 'down':
          this.player.gameObject.scaleX = 1;
          this.player.gameObject.play('attack-down', true);
          break;
        case 'up':
          this.player.gameObject.scaleX = 1;
          this.player.gameObject.play('attack-up', true);
          break;
        case 'left':
          this.player.gameObject.scaleX = -1;
          this.player.gameObject.play('attack-side', true);
          break;
        case 'right':
          this.player.gameObject.scaleX = 1;
          this.player.gameObject.play('attack-side', true);
          break;
        default:
      }
    }

    if (keyPressed.shift) {
      if (!loading) {
        loading = true;
        switch (this.player.orientation) {
          case 'down':
            this.player.scaleX = 1;
            this.player.gameObject.play('attack-weapon-down', true);
            this.arrow = this.physics.add.sprite(this.player.gameObject.x, this.player.gameObject.y, 'arrow-up', 0);
            this.arrow.scaleY = -1;
            this.arrow.setVelocityY(ARROW_SPEED);
            this.physics.add.collider(this.arrow, this.treant, this.treantLoseHp.bind(this));
            this.time.addEvent({
              delay: 500,
              callback: () => {
                loading = false;
              },
              callbackScope: this
            });
            break;
          case 'up':
            this.player.scaleX = 1;
            this.player.gameObject.play('attack-weapon-up', true);
            this.arrow = this.physics.add.sprite(this.player.gameObject.x, this.player.gameObject.y, 'arrow-up', 0);
            this.arrow.setVelocityY(-ARROW_SPEED);
            this.physics.add.collider(this.arrow, this.treant, this.treantLoseHp.bind(this));
            this.time.addEvent({
              delay: 500,
              callback: () => {
                loading = false;
              },
              callbackScope: this
            });
            break;
          case 'left':
            this.player.scaleX = -1;
            this.player.gameObject.play('attack-weapon-side', true);
            this.arrow = this.physics.add.sprite(this.player.gameObject.x, this.player.gameObject.y, 'arrow-side', 0);
            this.arrow.scaleX = -1;
            this.arrow.setVelocityX(-ARROW_SPEED);
            this.physics.add.collider(this.arrow, this.treant, this.treantLoseHp.bind(this));
            this.time.addEvent({
              delay: 500,
              callback: () => {
                loading = false;
              },
              callbackScope: this
            });
            break;
          case 'right':
            this.player.scaleX = 1;
            this.player.gameObject.play('attack-weapon-side', true);
            this.arrow = this.physics.add.sprite(this.player.gameObject.x, this.player.gameObject.y, 'arrow-side', 0);
            this.arrow.scaleX = 1;
            this.arrow.setVelocityX(ARROW_SPEED);
            this.physics.add.collider(this.arrow, this.treant, this.treantLoseHp.bind(this));
            this.time.addEvent({
              delay: 500,
              callback: () => {
                loading = false;
              },
              callbackScope: this
            });
            break;
          default:
        }
      }
    }

    const noKeyPressed = Object.values(keyPressed).filter(x => x).length === 0;
    if (noKeyPressed && !loading) {
      switch (this.player.orientation) {
        case 'down':
          this.player.gameObject.scaleX = 1;
          this.player.gameObject.play('idle-down', true);
          break;
        case 'up':
          this.player.gameObject.scaleX = 1;
          this.player.gameObject.play('idle-up', true);
          break;
        case 'left':
          this.player.gameObject.scaleX = -1;
          this.player.gameObject.play('idle-side', true);
          break;
        case 'right':
          this.player.gameObject.scaleX = 1;
          this.player.gameObject.play('idle-side', true);
          break;
        default:
      }
    }
  }

  initiliazeTreant() {
    //TODO repop a treant if the previous one is dead after a certain delay.
  }

  moveTreant() {
    if(this.treant.active) {
    var diffX = this.treant.x - this.player.gameObject.x;
    var diffY = this.treant.y - this.player.gameObject.y;
    //Move according to X
    if (diffX < 0) {
      this.treant.scaleX = 1;
      this.treant.setVelocityX(TREANT_SPEED);
    } else {
      this.treant.scaleX = 1;
      this.treant.setVelocityX(-TREANT_SPEED);
    }
    //Move according to Y
    if (diffY < 0) {
      this.treant.scaleY = 1;
      this.treant.setVelocityY(TREANT_SPEED);
    } else {
      this.treant.scaleY = 1;
      this.treant.setVelocityY(-TREANT_SPEED);
    }
  }

  }
  updateHearts() {
    this.hearts.map((heart, index) => {
      if (index >= this.player.hp) {
        heart.setAlpha(0);
      }
    })
  }

  playerLoseHp() {
    if ((new Date()).getTime() - this.player.lastTimeHit > hitDelay) {
      this.player.hp--;
      this.updateHearts();
      treantAttack = this.physics.add.sprite(this.player.gameObject.x, this.player.gameObject.y, 'treantAttack');

      this.player.lastTimeHit = new Date();
    }

    if (this.player.hp === 0) {
      this.player.gameObject.destroy();
    }
  }

  treantLoseHp() {
    this.treant.hp--;
    this.treant.alpha = 0.1;
    this.treant.lastTimeHit = (new Date()).getTime();
    this.arrow.destroy();
    if(this.treant.hp == 0) {
      this.treant.destroy();
      
    }
  }

  checkTreantOpacity() {
    if ((new Date()).getTime() - this.treant.lastTimeHit > treantOpacityDelay) {
      this.treant.alpha = 1;
    }
  }

  destroyTreantAttack() {
    if (treantAttack != null && (new Date()).getTime() - this.player.lastTimeHit > destroySpriteAttackDelay) {
      treantAttack.destroy();
    }
  }
}

export default Main;