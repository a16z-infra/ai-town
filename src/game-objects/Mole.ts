import { Character } from './Character';
import { ASSETS } from '../constants/assets';

const MOLE_SPEED = 20;
const MOLE_HIT_DELAY = 100;
const DESTROY_SPRITE_ATTACK_DELAY = 200;

export class Mole extends Character {
  private static WALK_ANIMATION = {
    down: { flip: false, anim: ASSETS.ANIMATIONS.MOLE_WALK_DOWN },
    up: { flip: false, anim: ASSETS.ANIMATIONS.MOLE_WALK_UP },
    left: { flip: true, anim: ASSETS.ANIMATIONS.MOLE_WALK_SIDE },
    right: { flip: false, anim: ASSETS.ANIMATIONS.MOLE_WALK_SIDE },
  };

  private hp: number;
  private chasingPlayerTimerEvent: Phaser.Time.TimerEvent;

  constructor(scene, x: number = 400, y: number = 400) {
    super(scene);

    this.hp = 3;
    this.gameObject = this.scene.physics.add
      .sprite(x, y, ASSETS.IMAGES.MOLE_IDLE_DOWN, 0)
      .setDepth(5);
    this.gameObject.setCollideWorldBounds(true);
    this.gameObject.setImmovable(true);
  }

  public update() {
    this.handleChase();
  }

  public moleHit = () => {
    if (!this.scene.player.canGetHit()) {
      return;
    }

    this.scene.player.loseHp();
  }

  public moleLoseHp = (projectile: Phaser.Physics.Arcade.Sprite) => {
    return () => {
      this.hp--;
      this.gameObject.setTint(0xff0000);
      this.scene.time.addEvent({
        delay: MOLE_HIT_DELAY,
        callback: () => this.gameObject.clearTint(),
        callbackScope: this,
      });
      projectile.destroy();
      if (this.hp === 0) {
        this.gameObject.destroy();
      }
    };
  }

  private shouldChase = () => {
    const playerPoint = this.scene.player.gameObject.getCenter();
    const molePoint = this.gameObject.getCenter();
    const distance = molePoint.distance(playerPoint);

    if (distance < 100) {
      return true;
    }

    return false;
  }

  private getOrientationFromTargettedPosition(x: number, y: number) {
    if (Math.abs(y) > Math.abs(x)) {
      return y < 0 ? 'up' : 'down';
    }

    return x < 0 ? 'left' : 'right';
  }

  private moveMole() {
    if (!this.gameObject.active) {
      return;
    }

    const playerPoint = this.scene.player.gameObject.getCenter();
    const molePoint = this.gameObject.getCenter();
    const { x, y } = playerPoint.subtract(molePoint);

    this.gameObject.setVelocityX(Math.sign(x) * MOLE_SPEED);
    this.gameObject.setVelocityY(Math.sign(y) * MOLE_SPEED);

    const orientation = this.getOrientationFromTargettedPosition(x, y);

    this.animate(Mole.WALK_ANIMATION, orientation);
  }

  private startChasing() {
    this.chasingPlayerTimerEvent = this.scene.time.addEvent({
      delay: 500,
      callback: this.moveMole,
      callbackScope: this,
      repeat: Infinity,
      startAt: 2000,
    });
  }

  private beIdle() {
    this.gameObject.play(ASSETS.ANIMATIONS.MOLE_IDLE_DOWN, true);
  }

  private stopChasing() {
    if (this.gameObject.active) {
      this.gameObject.setVelocity(0);
      this.beIdle();
    }
    this.chasingPlayerTimerEvent.destroy();
    this.chasingPlayerTimerEvent = null;
  }

  private handleChase() {
    if (!this.chasingPlayerTimerEvent && this.shouldChase()) {
      this.startChasing();
    }

    if (this.chasingPlayerTimerEvent && !this.shouldChase()) {
      this.stopChasing();
    }
  }
}
