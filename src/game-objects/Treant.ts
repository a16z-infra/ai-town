import Main from '../scenes/Main';
import { toVector2 } from '../utils/game-objects-math';

const TREANT_SPEED = 20;
const TREANT_HIT_DELAY = 100;
const DESTROY_SPRITE_ATTACK_DELAY = 200;
var treantAttack = null;

class Treant {
  scene: Main;
  gameObject: Phaser.Physics.Arcade.Sprite;
  hp: number;
  chasingPlayerTimerEvent: Phaser.Time.TimerEvent;

  constructor(scene, x: number = 400, y: number = 400) {
    this.scene = scene;
    this.gameObject = null;
    this.hp = 3;

    this.gameObject = this.scene.physics.add.sprite(x, y, 'treant').setDepth(5);
    this.gameObject.setCollideWorldBounds(true);
    this.gameObject.setImmovable(true);
  }

  shouldChase = () => {
    const playerPoint = toVector2(this.scene.player.gameObject)
    const treantPoint = toVector2(this.gameObject);
    const distance = treantPoint.distance(playerPoint)

    if (distance < 100) {
      return true;
    }

    return false;
  };

  moveTreant() {
    if (this.gameObject.active) {
      const playerPoint = toVector2(this.scene.player.gameObject)
      const treantPoint = toVector2(this.gameObject);
      const { x, y } = treantPoint.subtract(playerPoint)

      //Move according to X
      if (x < 0) {
        this.gameObject.setVelocityX(TREANT_SPEED);
      } else {
        this.gameObject.setVelocityX(-TREANT_SPEED);
      }
      //Move according to Y
      if (y < 0) {
        this.gameObject.setVelocityY(TREANT_SPEED);
      } else {
        this.gameObject.setVelocityY(-TREANT_SPEED);
      }
    }
  }

  startChasing() {
    this.chasingPlayerTimerEvent = this.scene.time.addEvent({
      delay: 500,
      callback: this.moveTreant,
      callbackScope: this,
      repeat: Infinity,
      startAt: 2000,
    });
  }

  stopChasing() {
    if (this.gameObject.active) {
      this.gameObject.setVelocity(0);
    }
    this.chasingPlayerTimerEvent.destroy();
    this.chasingPlayerTimerEvent = null;
  }

  handleChase() {
    if (!this.chasingPlayerTimerEvent && this.shouldChase()) {
      this.startChasing();
    }

    if (this.chasingPlayerTimerEvent && !this.shouldChase()) {
      this.stopChasing();
    }
  }

  update() {
    this.handleChase();
  }

  treantHit = () => {
    if (this.scene.player.canGetHit()) {
      treantAttack = this.scene.physics.add.sprite(
        this.scene.player.gameObject.x,
        this.scene.player.gameObject.y,
        'treantAttack'
      );
      this.scene.player.loseHp();
      this.scene.time.addEvent({
        delay: DESTROY_SPRITE_ATTACK_DELAY,
        callback: () => (treantAttack ? treantAttack.destroy() : null),
        callbackScope: this,
      });
    }
  };

  treantLoseHp = (projectile: Phaser.Physics.Arcade.Sprite) => {
    return () => {
      this.hp--;
      this.gameObject.setTint(0xff0000);
      this.scene.time.addEvent({
        delay: TREANT_HIT_DELAY,
        callback: () => this.gameObject.clearTint(),
        callbackScope: this,
      });
      projectile.destroy();
      if (this.hp == 0) {
        this.gameObject.destroy();
      }
    };
  };
}

export default Treant;
