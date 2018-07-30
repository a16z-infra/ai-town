import { Character } from './Character';
import { ASSETS } from '../constants/assets';

const DESTROY_SPRITE_ATTACK_DELAY = 200;

export abstract class Monster extends Character {
  protected abstract WALK_ANIMATION;
  protected abstract MONSTER_IDLE_DOWN;
  protected MONSTER_SPEED = 20;
  protected MONSTER_HIT_DELAY = 100;

  protected hp: number;
  private chasingPlayerTimerEvent: Phaser.Time.TimerEvent;

  constructor(scene) {
    super(scene);
  }

  public update() {
    this.handleChase();
  }

  public monsterHit = () => {
    if (!this.scene.player.canGetHit()) {
      return;
    }

    this.scene.player.loseHp();
    this.animateAttack();
  }

  public monsterLoseHp = (projectile: Phaser.Physics.Arcade.Sprite) => {
    this.hp--;
    this.gameObject.setTint(0xff0000);
    this.scene.time.addEvent({
      delay: this.MONSTER_HIT_DELAY,
      callback: () => this.gameObject.clearTint(),
      callbackScope: this,
    });
    projectile.destroy();
    if (this.hp === 0) {
      this.gameObject.destroy();
    }
  }

  protected abstract animateAttack(): void;

  private shouldChase = () => {
    const playerPoint = this.scene.player.gameObject.getCenter();
    const monsterPoint = this.gameObject.getCenter();
    const distance = monsterPoint.distance(playerPoint);

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

  private moveMonster() {
    if (!this.gameObject.active) {
      return;
    }

    const playerPoint = this.scene.player.gameObject.getCenter();
    const monsterPoint = this.gameObject.getCenter();
    const { x, y } = playerPoint.subtract(monsterPoint);

    this.gameObject.setVelocityX(Math.sign(x) * this.MONSTER_SPEED);
    this.gameObject.setVelocityY(Math.sign(y) * this.MONSTER_SPEED);

    const orientation = this.getOrientationFromTargettedPosition(x, y);

    this.animate(this.WALK_ANIMATION, orientation);
  }

  private startChasing() {
    this.chasingPlayerTimerEvent = this.scene.time.addEvent({
      delay: 500,
      callback: this.moveMonster,
      callbackScope: this,
      repeat: Infinity,
      startAt: 2000,
    });
  }

  private beIdle() {
    this.gameObject.play(this.MONSTER_IDLE_DOWN);
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
