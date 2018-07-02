import Arrow from './Arrow';
import Main from '../scenes/Main';

const HIT_DELAY = 500; //0.5s
const PLAYER_INITIAL_POSITION = {
  x: 50,
  y: 200,
};
const PLAYER_SPEED = 100;
const DISTANCE_BETWEEN_HEARTS = 15;
const PLAYER_RELOAD = 500;

class Player {
  scene: Main;
  hp: number;
  maxHp: number;
  gameObject: Phaser.Physics.Arcade.Sprite;
  orientation: 'up' | 'down' | 'left' | 'right';
  lastTimeHit: number;
  loading: boolean;
  tomb: Phaser.GameObjects.Sprite;
  hearts: Array<Phaser.GameObjects.Sprite>;

  constructor(scene: Main) {
    this.scene = scene;

    this.hp = 3;
    this.gameObject = scene.physics.add.sprite(
      PLAYER_INITIAL_POSITION.x,
      PLAYER_INITIAL_POSITION.y,
      'idle-down',
      0
    );
    this.orientation = 'down';
    this.lastTimeHit = new Date().getTime();
    this.gameObject.setCollideWorldBounds(true);
    this.gameObject.setOrigin(0.5, 0.6)
    this.gameObject.setSize(10, 22)
    this.loading = false;
    this.tomb = null;

    this.hearts = [];
    this.initHearts();
  }

  initHearts() {
    Array(this.hp)
      .fill(0)
      .map((_, i) => {
        return this.scene.add
          .sprite((i + 1) * DISTANCE_BETWEEN_HEARTS, DISTANCE_BETWEEN_HEARTS, 'heart-empty')
          .setScrollFactor(0)
          .setDepth(50);
      });

    this.hearts = Array(this.hp)
      .fill(0)
      .map((_, i) => {
        return this.scene.add
          .sprite((i + 1) * DISTANCE_BETWEEN_HEARTS, DISTANCE_BETWEEN_HEARTS, 'heart')
          .setScrollFactor(0)
          .setDepth(100);
      });
  }

  updateHearts() {
    this.hearts.map((heart, index) => {
      if (index >= this.hp) {
        heart.setAlpha(0);
      }
    });
  }

  reload() {
    this.loading = true;
    this.scene.time.addEvent({
      delay: PLAYER_RELOAD,
      callback: this.readyToFire,
      callbackScope: this,
    });
  }

  readyToFire() {
    this.loading = false;
  }

  go(direction, shouldAnimate = true) {
    switch (direction) {
      case 'left':
        this.gameObject.setVelocityX(-PLAYER_SPEED);
        break;
      case 'right':
        this.gameObject.setVelocityX(PLAYER_SPEED);
        break;
      case 'up':
        this.gameObject.setVelocityY(-PLAYER_SPEED);
        break;
      case 'down':
        this.gameObject.setVelocityY(PLAYER_SPEED);
        break;
      default:
        break;
    }

    if (!shouldAnimate) {
      return;
    }

    this.gameObject.setFlipX(direction === 'left');
    this.orientation = direction;
    this.gameObject.play(direction, true);
  }

  handleHorizontalMovement(keyPressed) {
    const isUpDownPressed = keyPressed.up || keyPressed.down;

    if (keyPressed.left) {
      this.go('left', !isUpDownPressed);
      return;
    }

    if (keyPressed.right) {
      this.go('right', !isUpDownPressed);
      return;
    }
  }

  handleVerticalMovement(keyPressed) {
    if (keyPressed.up) {
      this.go('up');
    } else if (keyPressed.down) {
      this.go('down');
    }
  }

  punch() {
    const animSwitch = {
      down: { flip: false, anim: 'attack-down' },
      up: { flip: false, anim: 'attack-up' },
      left: { flip: true, anim: 'attack-side' },
      right: { flip: false, anim: 'attack-side' },
    };

    this.gameObject.setFlipX(animSwitch[this.orientation].flip);
    this.gameObject.play(animSwitch[this.orientation].anim, true);
  }

  beIdle() {
    const animSwitch = {
      down: { flip: false, anim: 'idle-down' },
      up: { flip: false, anim: 'idle-up' },
      left: { flip: true, anim: 'idle-side' },
      right: { flip: false, anim: 'idle-side' },
    };
    this.gameObject.setFlipX(animSwitch[this.orientation].flip);
    this.gameObject.play(animSwitch[this.orientation].anim, true);
  }

  shoot() {
    const animSwitch = {
      down: { anim: 'attack-weapon-down' },
      up: { anim: 'attack-weapon-up' },
      left: { anim: 'attack-weapon-side' },
      right: { anim: 'attack-weapon-side' },
    };

    this.gameObject.play(animSwitch[this.orientation].anim, true);
    const arrow = new Arrow(this.scene, this, this.orientation);

    return arrow;
  }

  handleShootKey(keyPressed) {
    if (keyPressed.shift) {
      if (this.loading) {
        return;
      }
      this.reload();
      const arrow = this.shoot();
      const arrowGameObject = arrow.gameObject;

      // TODO refactor this for performance
      this.scene.treants.map(treant =>
        this.scene.physics.add.collider(
          arrowGameObject,
          treant.gameObject,
          treant.treantLoseHp(arrowGameObject)
        )
      );
    }
  }

  update(keyPressed) {
    if (!this.gameObject.active) {
      return;
    }
    this.gameObject.setVelocity(0);
    this.handleHorizontalMovement(keyPressed);
    this.handleVerticalMovement(keyPressed);

    if (keyPressed.space) {
      this.punch();
    }

    const noKeyPressed = Object.values(keyPressed).filter(x => x).length === 0;
    if (noKeyPressed && !this.loading) {
      this.beIdle();
    }

    this.handleShootKey(keyPressed);
  }

  loseHp() {
    this.hp--;
    this.updateHearts();

    this.lastTimeHit = new Date().getTime();

    if (this.hp > 0) {
      return;
    }

    // Player dies
    if (!this.tomb) {
      this.tomb = this.scene.add.sprite(this.gameObject.x, this.gameObject.y, 'tomb').setScale(0.1);
    }
    this.gameObject.destroy();
  }

  canGetHit() {
    return new Date().getTime() - this.lastTimeHit > HIT_DELAY;
  }
}
export default Player;
