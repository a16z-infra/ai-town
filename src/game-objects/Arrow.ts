const ARROW_SPEED = 150;

class Arrow {
  scene: Phaser.Scene;
  player: any;
  gameObject: any;

  constructor(scene: Phaser.Scene, player, direction) {
    this.scene = scene;
    this.player = player;

    let spriteName = 'arrow-up';
    if (direction === 'up' || direction === 'down') {
      spriteName = 'arrow-up';
    }

    if (direction === 'left' || direction === 'right') {
      spriteName = 'arrow-side';
    }

    this.gameObject = scene.physics.add.sprite(
      player.gameObject.x,
      player.gameObject.y,
      spriteName,
      0
    );

    switch (direction) {
      case 'up':
        this.gameObject.setVelocityY(-ARROW_SPEED);
        break;
      case 'down':
        this.gameObject.setVelocityY(ARROW_SPEED);
        this.gameObject.setFlipY(true);
        break;
      case 'left':
        this.gameObject.setVelocityX(-ARROW_SPEED);
        this.gameObject.setFlipX(true);
        break;
      case 'right':
        this.gameObject.setVelocityX(ARROW_SPEED);
        break;
      default:
        break;
    }

    this.scene.time.addEvent({
      delay: 500,
      callback: () => {
        this.player.readyToFire();
      },
      callbackScope: this,
    });
  }
}

export default Arrow;
