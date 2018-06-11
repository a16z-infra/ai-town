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
      hp: 3,
    }
    this.cursors = null;
    this.npc = {
      gameObject: null,
      textGameObject: null,
      isPlayerColliding: false,
    };
    this.treant = null;
    this.hearts = [];
    this.tomb = null;
    this.map = null;
    this.layers = null;
  }

  helloNPC() {
    this.npc.isPlayerColliding = true;
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

  initHearts() {
    this.hearts = Array(this.player.hp).fill().map((_, i) => {
      return this.add.sprite((i + 1) * 15, 15, 'heart').setScrollFactor(0).setDepth(10);
    });
  }

  initPlayer() {
    this.player.gameObject = this.physics.add.sprite(PLAYER_INITIAL_POSITION.x, PLAYER_INITIAL_POSITION.y, 'idle-down', 0);
    this.player.lastTimeHit = (new Date()).getTime()
    this.player.gameObject.setCollideWorldBounds(true);
  }

  initTreant() {
    this.treant = this.physics.add.sprite(500, 500, 'treant').setDepth(5);
    this.treant.hp = 3;
    this.treant.setCollideWorldBounds(true);
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
    this.physics.add.collider(this.treant, this.layers.terrain);
    this.physics.add.collider(this.treant, this.layers.deco);
    this.physics.add.collider(this.treant, this.player.gameObject, this.playerLoseHp.bind(this));

    this.physics.add.collider(this.player.gameObject, this.layers.terrain);
    this.physics.add.collider(this.player.gameObject, this.layers.deco);
    this.physics.add.collider(this.player.gameObject, this.npc.gameObject, this.helloNPC.bind(this));
  }

  initCamera() {
    this.cameras.main.setRoundPixels(true);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.startFollow(this.player.gameObject, true, CAMERA_LERP, CAMERA_LERP);
  }

  create() {
    this.createMapWithLayers();

    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.initPlayer();

    this.initHearts();

    this.initNpc();
    this.initTreant();

    this.addColliders();

    this.initCamera();

    this.cursors = this.input.keyboard.createCursorKeys();

    this.time.addEvent({
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
      // Player dies
      if (!this.tomb) {
        this.tomb = this.add.sprite(this.player.gameObject.x, this.player.gameObject.y, 'tomb').setScale(0.1);
      }
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