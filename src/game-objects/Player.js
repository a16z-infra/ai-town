import Arrow from './Arrow';
const PLAYER_INITIAL_POSITION = {
  x: 50,
  y: 200,
};
const PLAYER_SPEED = 100;

class Player {
  constructor(scene) {
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
    this.loading = false;
    this.hearts = [];
    this.initHearts();
  }

  initHearts() {
    this.hearts = Array(this.hp)
      .fill()
      .map((_, i) => {
        return this.scene.add
          .sprite((i + 1) * 15, 15, 'heart')
          .setScrollFactor(0)
          .setDepth(10);
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
  }

  readyToFire() {
    this.loading = false;
  }

  go(direction, shouldAnimate = true) {
    if (!this.gameObject.active) {
      return;
    }

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
    }

    this.gameObject.setFlipX(animSwitch[this.orientation].flip);
    this.gameObject.play(animSwitch[this.orientation].anim, true);
  }

  beIdle() {
    const animSwitch = {
      down: { flip: false, anim: 'idle-down' },
      up: { flip: false, anim: 'idle-up' },
      left: { flip: true, anim: 'idle-side' },
      right: { flip: false, anim: 'idle-side' },
    }
    this.gameObject.setFlipX(animSwitch[this.orientation].flip);
    this.gameObject.play(animSwitch[this.orientation].anim, true);
  }

  shoot() {
    const animSwitch = {
      down: { anim: 'attack-weapon-down' },
      up: { anim: 'attack-weapon-up' },
      left: { anim: 'attack-weapon-side' },
      right: { anim: 'attack-weapon-side' },
    }

    this.gameObject.play(animSwitch[this.orientation].anim, true);
    const arrow = new Arrow(this.scene, this, this.orientation);

    return arrow;
  }

  update(keyPressed) {
    this.handleHorizontalMovement(keyPressed);
    this.handleVerticalMovement(keyPressed);

    if (keyPressed.space) {
      this.punch();
    }

    const noKeyPressed = Object.values(keyPressed).filter(x => x).length === 0;
    if (noKeyPressed && !this.loading) {
      this.beIdle();
    }
  }
}

export default Player;
