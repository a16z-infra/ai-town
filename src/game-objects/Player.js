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
    switch (this.orientation) {
      case 'down':
        this.gameObject.setFlipX(false);
        this.gameObject.play('attack-down', true);
        break;
      case 'up':
        this.gameObject.setFlipX(false);
        this.gameObject.play('attack-up', true);
        break;
      case 'left':
        this.gameObject.setFlipX(true);
        this.gameObject.play('attack-side', true);
        break;
      case 'right':
        this.gameObject.setFlipX(false);
        this.gameObject.play('attack-side', true);
        break;
      default:
    }
  }

  beIdle() {
    switch (this.orientation) {
      case 'down':
        this.gameObject.setFlipX(false);
        this.gameObject.play('idle-down', true);
        break;
      case 'up':
        this.gameObject.setFlipX(false);
        this.gameObject.play('idle-up', true);
        break;
      case 'left':
        this.gameObject.setFlipX(true);
        this.gameObject.play('idle-side', true);
        break;
      case 'right':
        this.gameObject.setFlipX(false);
        this.gameObject.play('idle-side', true);
        break;
      default:
    }
  }

  shoot() {
    let arrow;
    switch (this.orientation) {
      case 'down':
        this.gameObject.play('attack-weapon-down', true);
        arrow = new Arrow(this.scene, this, 'down');
        break;
      case 'up':
        this.gameObject.play('attack-weapon-up', true);
        arrow = new Arrow(this.scene, this, 'up');
        break;
      case 'left':
        this.gameObject.play('attack-weapon-side', true);
        arrow = new Arrow(this.scene, this, 'left');
        break;
      case 'right':
        this.gameObject.play('attack-weapon-side', true);
        arrow = new Arrow(this.scene, this, 'right');
        break;
      default:
    }
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
