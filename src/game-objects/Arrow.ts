import { Player } from './Player';
import { ASSETS } from '../constants/assets';

const ARROW_SPEED = 150;

export class Arrow extends Phaser.Physics.Arcade.Sprite {
  public scene: Phaser.Scene;
  private player: Player;

  constructor(scene: Phaser.Scene, player, direction) {
    super(scene, player.x, player.y, ASSETS.IMAGES.ARROW);
    this.scene = scene;
    this.player = player;

    this.scene.physics.add.existing(this);
    this.scene.add.existing(this);

    this.setDepth(1000);

    switch (direction) {
      case 'up':
        this.setVelocityY(-ARROW_SPEED);
        break;
      case 'down':
        this.setVelocityY(ARROW_SPEED);
        this.setRotation(Math.PI);
        break;
      case 'left':
        this.setVelocityX(-ARROW_SPEED);
        this.setRotation(-Math.PI / 2);
        break;
      case 'right':
        this.setVelocityX(ARROW_SPEED);
        this.setRotation(Math.PI / 2);
        break;
      default:
        break;
    }
  }
}
