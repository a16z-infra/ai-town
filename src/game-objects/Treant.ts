import Main from '../scenes/Main';
const TREANT_SPEED = 20;
const TREANT_HIT_DELAY = 100;
const destroySpriteAttackDelay = 200;
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

  computeDistanceWith = (
    otherGameObject: Phaser.Physics.Arcade.Sprite
  ): { diffX: number; diffY: number } => {
    var diffX = this.gameObject.x - otherGameObject.x;
    var diffY = this.gameObject.y - otherGameObject.y;
    return { diffX, diffY };
  };

  shouldChase = () => {
    const { diffX, diffY } = this.computeDistanceWith(this.scene.player.gameObject);
    const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

    if (distance < 100) {
      return true;
    }

    return false;
  };

  moveTreant() {
    if (this.gameObject.active) {
      const { diffX, diffY } = this.computeDistanceWith(this.scene.player.gameObject);
      //Move according to X
      if (diffX < 0) {
        this.gameObject.setVelocityX(TREANT_SPEED);
      } else {
        this.gameObject.setVelocityX(-TREANT_SPEED);
      }
      //Move according to Y
      if (diffY < 0) {
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
    this.destroyTreantAttack();
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

  destroyTreantAttack() {
    if (
      treantAttack != null &&
      new Date().getTime() - this.scene.player.lastTimeHit > destroySpriteAttackDelay
    ) {
      treantAttack.destroy();
    }
  }
}

export default Treant;
