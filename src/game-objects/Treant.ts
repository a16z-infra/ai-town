import { AbstractScene } from '../scenes/AbstractScene';

const TREANT_SPEED = 20;
const TREANT_HIT_DELAY = 100;
const DESTROY_SPRITE_ATTACK_DELAY = 200;

export class Treant {
  public scene: AbstractScene;
  public gameObject: Phaser.Physics.Arcade.Sprite;
  private hp: number;
  private chasingPlayerTimerEvent: Phaser.Time.TimerEvent;

  constructor(scene, x: number = 400, y: number = 400) {
    this.scene = scene;
    this.gameObject = null;
    this.hp = 3;

    this.gameObject = this.scene.physics.add.sprite(x, y, 'treant').setDepth(5);
    this.gameObject.setCollideWorldBounds(true);
    this.gameObject.setImmovable(true);
  }

  public update() {
    this.handleChase();
  }

  public treantHit = () => {
    if (!this.scene.player.canGetHit()) {
      return;
    }

    const treantAttack = this.scene.physics.add.sprite(
      this.scene.player.gameObject.x,
      this.scene.player.gameObject.y,
      'treantAttack',
    );
    this.scene.player.loseHp();
    this.scene.time.addEvent({
      delay: DESTROY_SPRITE_ATTACK_DELAY,
      callback: () => (treantAttack ? treantAttack.destroy() : null),
      callbackScope: this,
    });
  }

  public treantLoseHp = (projectile: Phaser.Physics.Arcade.Sprite) => {
    return () => {
      this.hp--;
      this.gameObject.setTint(0xff0000);
      this.scene.time.addEvent({
        delay: TREANT_HIT_DELAY,
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
    const treantPoint = this.gameObject.getCenter();
    const distance = treantPoint.distance(playerPoint);

    if (distance < 100) {
      return true;
    }

    return false;
  }

  private moveTreant() {
    if (!this.gameObject.active) {
      return;
    }

    const playerPoint = this.scene.player.gameObject.getCenter();
    const treantPoint = this.gameObject.getCenter();
    const { x, y } = playerPoint.subtract(treantPoint);

    this.gameObject.setVelocityX(Math.sign(x) * TREANT_SPEED);
    this.gameObject.setVelocityY(Math.sign(y) * TREANT_SPEED);
  }

  private startChasing() {
    this.chasingPlayerTimerEvent = this.scene.time.addEvent({
      delay: 500,
      callback: this.moveTreant,
      callbackScope: this,
      repeat: Infinity,
      startAt: 2000,
    });
  }

  private stopChasing() {
    if (this.gameObject.active) {
      this.gameObject.setVelocity(0);
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
