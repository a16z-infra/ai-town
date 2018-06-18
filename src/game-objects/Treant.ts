import Main from '../scenes/Main';
const TREANT_SPEED = 500;
const treantOpacityDelay = 100;
const destroySpriteAttackDelay = 200;
var treantAttack = null;

class Treant {
  scene: Main;
  gameObject: Phaser.Physics.Arcade.Sprite;
  lastTimeHit: number;
  hp: number;

  constructor(scene) {
    this.scene = scene;
    this.gameObject = null;
    this.lastTimeHit = null;
    this.hp = 3;

    this.gameObject = this.scene.physics.add.sprite(500, 500, 'treant').setDepth(5);
    this.gameObject.setCollideWorldBounds(true);

    this.scene.time.addEvent({
      delay: 500,
      callback: this.moveTreant,
      callbackScope: this,
      repeat: Infinity,
      startAt: 2000,
    });

    this.treantHit = this.treantHit.bind(this);
  }

  moveTreant() {
    if (this.gameObject.active) {
      var diffX = this.gameObject.x - this.scene.player.gameObject.x;
      var diffY = this.gameObject.y - this.scene.player.gameObject.y;
      //Move according to X
      if (diffX < 0) {
        this.gameObject.scaleX = 1;
        this.gameObject.setVelocityX(TREANT_SPEED);
      } else {
        this.gameObject.scaleX = 1;
        this.gameObject.setVelocityX(-TREANT_SPEED);
      }
      //Move according to Y
      if (diffY < 0) {
        this.gameObject.scaleY = 1;
        this.gameObject.setVelocityY(TREANT_SPEED);
      } else {
        this.gameObject.scaleY = 1;
        this.gameObject.setVelocityY(-TREANT_SPEED);
      }
    }
  }

  update() {
    this.destroyTreantAttack();
    this.checkTreantOpacity();
    if (this.gameObject.active) {
      this.gameObject.setVelocity(0);
    }
  }

  treantHit() {
    if (this.scene.player.canGetHit()) {
      treantAttack = this.scene.physics.add.sprite(
        this.scene.player.gameObject.x,
        this.scene.player.gameObject.y,
        'treantAttack'
      );
      this.scene.player.loseHp();
    }
  }

  treantLoseHp(arrow) {
    return () => {
      this.hp--;
      this.gameObject.alpha = 0.1;
      this.lastTimeHit = new Date().getTime();
      arrow.destroy();
      if (this.hp == 0) {
        this.gameObject.destroy();
      }
    };
  }

  checkTreantOpacity() {
    if (new Date().getTime() - this.lastTimeHit > treantOpacityDelay) {
      this.gameObject.alpha = 1;
    }
  }

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
