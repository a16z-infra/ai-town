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

  public updateMonster() {
    if (!this.active) {
      return;
    }
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
    this.setTint(0xff0000);
    this.scene.time.addEvent({
      delay: this.MONSTER_HIT_DELAY,
      callback: () => this.clearTint(),
      callbackScope: this,
    });
    projectile.destroy();
    if (this.hp === 0) {
      this.die();
    }
  }

  protected abstract animateAttack(): void;

  private die = () => {
    const deathAnim = this.scene.add
      .sprite(
        this.x,
        this.y,
        ASSETS.IMAGES.MONSTER_DEATH,
      );
    this.destroy();
    deathAnim.play(ASSETS.ANIMATIONS.MONSTER_DEATH, false);
  }

  private shouldChase = () => {
    const playerPoint = this.scene.player.getCenter();
    const monsterPoint = this.getCenter();
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
    if (!this.active) {
      return;
    }

    const playerPoint = this.scene.player.getCenter();
    const monsterPoint = this.getCenter();
    const { x, y } = playerPoint.subtract(monsterPoint);

    this.setVelocityX(Math.sign(x) * this.MONSTER_SPEED);
    this.setVelocityY(Math.sign(y) * this.MONSTER_SPEED);

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
    this.play(this.MONSTER_IDLE_DOWN);
  }

  private stopChasing() {
    if (this.active) {
      this.setVelocity(0);
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
