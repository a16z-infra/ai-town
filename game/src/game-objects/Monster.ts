import { Orientation } from '../geometry/orientation';
import { Character } from './Character';
import { ASSETS } from '../constants/assets';
import { converse } from '../utils';

export abstract class Monster extends Character {
  private static WANDER_DELAY = () => 1000 + 1000 * Math.random();
  private static WANDER_LENGTH = () => 1000 + 5000 * Math.random();

  protected abstract WALK_ANIMATION;
  protected abstract MONSTER_IDLE_DOWN;
  protected MONSTER_SPEED = 20;
  protected MONSTER_HIT_DELAY = 100;
  protected CHASING_DISTANCE = 100;

  protected hp: number;
  private chasingPlayerTimerEvent: Phaser.Time.TimerEvent;
  private isWandering = false;
  private isStartled = false;
  private isTalking = false;

  public updateMonster() {
    if (!this.active) {
      return;
    }
    this.wanderAround();
  }

  public talkToUser = () => {};
  public async talkToNPC(
    npc: Phaser.GameObjects.GameObject,
    otherNpc: Phaser.GameObjects.GameObject,
  ) {
    console.log('start talking');

    this.isTalking = true;
    if (otherNpc instanceof Monster) {
      (otherNpc as Monster).setTalking(true);
    }

    let from = npc.name;
    let to = otherNpc.name;
    console.log('npc names', from, to);
    while (true) {
      let result = await converse(this.scene, from, to);
      console.log(result);
      if (result == undefined || !result || result!.text === 'STOP') {
        this.isTalking = false;

        break;
      }
      [from, to] = [to, from];
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    this.scene.time.addEvent({
      delay: 60000, // 60 seconds in milliseconds
      callbackScope: this,
      callback: () => {
        console.log('STOP TALKING ' + this.name);
        if (!this.active) {
          return;
        }

        // Resume movement after the pause
        this.isTalking = false;

        if (otherNpc instanceof Monster) {
          (otherNpc as Monster).setTalking(false);
        }
      },
    });
  }

  public setTalking(talking: boolean) {
    this.isTalking = talking;
  }

  public pauseMovement() {
    if (this.isWandering) {
      // Stop the monster from moving
      this.stopRunning();
      console.log('pause movement ' + this.name);
    }
  }

  public loseHp = (projectile: Phaser.Physics.Arcade.Sprite) => {
    this.hp--;
    this.isStartled = true;
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
  };

  protected abstract animateAttack(): void;

  private die = () => {
    const deathAnim = this.scene.add.sprite(this.x, this.y, ASSETS.IMAGES.MONSTER_DEATH);
    this.destroy();
    deathAnim.play(ASSETS.ANIMATIONS.MONSTER_DEATH, false);
  };

  private shouldChase = () => {
    const playerPoint = this.scene.player.getCenter();
    const monsterPoint = new Phaser.Math.Vector2(this.getCenter());
    const distance = monsterPoint.distance(playerPoint);

    if (distance < this.CHASING_DISTANCE) {
      return true;
    }

    if (this.isStartled) {
      return true;
    }

    return false;
  };

  private getOrientationFromTargettedPosition(x: number, y: number): Orientation {
    if (Math.abs(y) > Math.abs(x)) {
      return y < 0 ? Orientation.Up : Orientation.Down;
    }

    return x < 0 ? Orientation.Left : Orientation.Right;
  }

  private moveTowardsPlayer() {
    if (!this.active) {
      return;
    }

    const playerPoint = new Phaser.Math.Vector2(this.scene.player.getCenter());
    const monsterPoint = this.getCenter();
    const { x, y } = playerPoint.subtract(monsterPoint);

    this.run(x, y);
  }

  private run(x: number, y: number) {
    if (x === 0 && y === 0) {
      return;
    }

    if (!this.active) {
      return;
    }

    this.setVelocityX(Math.sign(x) * this.MONSTER_SPEED);
    this.setVelocityY(Math.sign(y) * this.MONSTER_SPEED);

    const orientation = this.getOrientationFromTargettedPosition(x, y);

    this.animate(this.WALK_ANIMATION, orientation);
  }

  public stopRunning() {
    if (!this.active) {
      return;
    }

    this.setVelocity(0);
    this.beIdle();
  }

  private startChasing() {
    this.chasingPlayerTimerEvent = this.scene.time.addEvent({
      delay: 500,
      callback: this.moveTowardsPlayer,
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
      this.stopRunning();
    }
    this.chasingPlayerTimerEvent.destroy();
    this.chasingPlayerTimerEvent = null;
  }

  private handleChase() {
    if (!this.chasingPlayerTimerEvent && this.shouldChase()) {
      this.startChasing();
      return;
    }

    if (this.chasingPlayerTimerEvent && !this.shouldChase()) {
      this.stopChasing();
    }

    if (!this.shouldChase()) {
      this.wanderAround();
    }
  }

  private wanderAround() {
    // if (this.isTalking) {
    //   console.log("wanderingAround " + this.isWandering  + " " + this.isTalking + " " + this.name);
    // }
    if (this.isWandering || this.isTalking) {
      return;
    }

    this.isWandering = true;

    const direction = this.getRandomDirection();
    this.run(direction.x, direction.y);

    this.scene.time.addEvent({
      delay: Monster.WANDER_LENGTH(),
      callbackScope: this,
      callback: () => {
        this.stopRunning();

        if (!this.active) {
          return;
        }

        this.scene.time.addEvent({
          delay: Monster.WANDER_DELAY(),
          callbackScope: this,
          callback: () => {
            this.isWandering = false;
          },
        });
      },
    });
  }

  private getRandomDirection() {
    const randomBetweenMinusOneAndOne = () => Math.round(2 * Math.random()) - 1;
    const x = randomBetweenMinusOneAndOne();
    const y = randomBetweenMinusOneAndOne();

    return { x, y };
  }
}
