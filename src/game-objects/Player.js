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

  update(keyPressed) {
    const isUpDownPressed = keyPressed.up || keyPressed.down;

    if (keyPressed.left) {
      if (!isUpDownPressed) {
        this.gameObject.setFlipX(true);
        this.orientation = 'left';
        this.gameObject.play('left', true);
      }
      if (this.gameObject.active) {
        this.gameObject.setVelocityX(-PLAYER_SPEED);
      }
    } else if (keyPressed.right) {
      if (!isUpDownPressed) {
        this.gameObject.setFlipX(false);
        this.orientation = 'right';
        this.gameObject.play('right', true);
      }
      if (this.gameObject.active) {
        this.gameObject.setVelocityX(PLAYER_SPEED);
      }
    }

    if (keyPressed.up) {
      this.gameObject.setFlipX(false);
      this.orientation = 'up';
      this.gameObject.play('up', true);
      if (this.gameObject.active) {
        this.gameObject.setVelocityY(-PLAYER_SPEED);
      }
    } else if (keyPressed.down) {
      this.gameObject.setFlipX(false);
      this.orientation = 'down';
      this.gameObject.play('down', true);
      if (this.gameObject.active) {
        this.gameObject.setVelocityY(PLAYER_SPEED);
      }
    }

    if (keyPressed.space) {
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
  }
}

export default Player;
