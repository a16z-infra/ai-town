import { Player } from './Player';

const ARROW_SPEED = 150;

export class Arrow extends Phaser.Physics.Arcade.Sprite {
  public scene: Phaser.Scene;
  private player: Player;

  constructor(scene: Phaser.Scene, player, direction) {
    let spriteName = 'arrow-up';
    if (direction === 'up' || direction === 'down') {
      spriteName = 'arrow-up';
    }

    if (direction === 'left' || direction === 'right') {
      spriteName = 'arrow-side';
    }

    super(scene, player.x, player.y, spriteName, 0);
    this.scene = scene;
    this.player = player;

    this.scene.physics.add.existing(this);
    this.scene.add.existing(this);

    switch (direction) {
      case 'up':
        this.setVelocityY(-ARROW_SPEED);
        break;
      case 'down':
        this.setVelocityY(ARROW_SPEED);
        this.setFlipY(true);
        break;
      case 'left':
        this.setVelocityX(-ARROW_SPEED);
        this.setFlipX(true);
        break;
      case 'right':
        this.setVelocityX(ARROW_SPEED);
        break;
      default:
        break;
    }
  }
}
