import { Orientation } from '../geometry/orientation';
import { Character } from './Character';
import { Arrow } from './Arrow';
import { Monster } from './Monster';
import { AbstractScene } from '../scenes/AbstractScene';
import { registry as REGISTRY_KEYS } from '../constants/registry';
import { ASSETS } from '../constants/assets';

const HIT_DELAY = 500;
const PLAYER_SPEED = 80;
const DISTANCE_BETWEEN_HEARTS = 15;
const PLAYER_RELOAD = 500;
const MAX_HP = 3;

export class Player extends Character {
  private static MOVE_ANIMATION = {
    down: { flip: false, anim: ASSETS.ANIMATIONS.PLAYER_MOVE_DOWN },
    up: { flip: false, anim: ASSETS.ANIMATIONS.PLAYER_MOVE_UP },
    left: { flip: true, anim: ASSETS.ANIMATIONS.PLAYER_MOVE_LEFT },
    right: { flip: false, anim: ASSETS.ANIMATIONS.PLAYER_MOVE_RIGHT },
  };

  private static PUNCH_ANIMATION = {
    down: { flip: false, anim: ASSETS.ANIMATIONS.PLAYER_ATTACK_DOWN },
    up: { flip: false, anim: ASSETS.ANIMATIONS.PLAYER_ATTACK_UP },
    left: { flip: true, anim: ASSETS.ANIMATIONS.PLAYER_ATTACK_SIDE },
    right: { flip: false, anim: ASSETS.ANIMATIONS.PLAYER_ATTACK_SIDE },
  };

  private static IDLE_ANIMATION = {
    down: { flip: false, anim: ASSETS.ANIMATIONS.PLAYER_IDLE_DOWN },
    up: { flip: false, anim: ASSETS.ANIMATIONS.PLAYER_IDLE_UP },
    left: { flip: true, anim: ASSETS.ANIMATIONS.PLAYER_IDLE_SIDE },
    right: { flip: false, anim: ASSETS.ANIMATIONS.PLAYER_IDLE_SIDE },
  };

  private static SHOOT_ANIMATION = {
    down: { flip: false, anim: ASSETS.ANIMATIONS.PLAYER_ATTACK_WEAPON_DOWN },
    up: { flip: false, anim: ASSETS.ANIMATIONS.PLAYER_ATTACK_WEAPON_UP },
    left: { flip: true, anim: ASSETS.ANIMATIONS.PLAYER_ATTACK_WEAPON_SIDE },
    right: { flip: false, anim: ASSETS.ANIMATIONS.PLAYER_ATTACK_WEAPON_SIDE },
  };

  private orientation: Orientation;
  private lastTimeHit: number;
  private isLoading: boolean;
  private isShooting: boolean;
  private tomb: Phaser.GameObjects.Sprite;
  private hearts: Phaser.GameObjects.Sprite[];

  constructor(scene: AbstractScene, x: number, y: number) {
    super(scene, x, y, ASSETS.IMAGES.PLAYER_IDLE_DOWN);

    const registryHp = this.scene.registry.get(REGISTRY_KEYS.PLAYER.HP);
    if (!registryHp) {
      this.scene.registry.set(REGISTRY_KEYS.PLAYER.HP, MAX_HP);
    }

    this.orientation = Orientation.Down;
    this.lastTimeHit = new Date().getTime();
    this.setCollideWorldBounds(true);
    this.setOrigin(0.5, 0.7);
    this.setSize(10, 10);
    this.setDepth(10);
    this.isLoading = false;
    this.isShooting = false;
    this.tomb = null;

    this.hearts = [];
    this.initHearts();

    this.on('animationrepeat', event => {
      switch (event.key) {
        case ASSETS.ANIMATIONS.PLAYER_ATTACK_WEAPON_SIDE:
        case ASSETS.ANIMATIONS.PLAYER_ATTACK_WEAPON_UP:
        case ASSETS.ANIMATIONS.PLAYER_ATTACK_WEAPON_DOWN:
          this.concludeShoot();
          break;
        default:
          break;
      }
    }, this);
  }

  public updatePlayer(keyPressed) {
    if (!this.active) {
      return;
    }
    this.setVelocity(0);
    this.handleMovement(keyPressed);

    if (keyPressed.space) {
      this.punch();
    }

    const noKeyPressed = Object.values(keyPressed).filter(x => x).length === 0;
    if (noKeyPressed && !this.isLoading) {
      this.beIdle();
    }

    this.handleShootKey(keyPressed);
  }

  public canGetHit() {
    return new Date().getTime() - this.lastTimeHit > HIT_DELAY;
  }

  public loseHp() {
    this.addHp(-1);
    this.updateHearts();

    this.lastTimeHit = new Date().getTime();

    if (this.getHp() > 0) {
      return;
    }

    // Player dies
    if (!this.tomb) {
      this.tomb = this.scene.add
        .sprite(this.x, this.y, ASSETS.IMAGES.TOMB)
        .setScale(0.1);
    }
    this.destroy();
  }

  private getHp(): number {
    return this.scene.registry.get(REGISTRY_KEYS.PLAYER.HP);
  }

  private setHp(newHp: number) {
    this.scene.registry.set(REGISTRY_KEYS.PLAYER.HP, newHp);
  }

  private addHp(hpToAdd: number) {
    const hp = this.scene.registry.get(REGISTRY_KEYS.PLAYER.HP);
    this.setHp(hp + hpToAdd);
  }

  private initHearts() {
    Array(MAX_HP)
      .fill(0)
      .map((_, i) => {
        return this.scene.add
          .sprite(
            (i + 1) * DISTANCE_BETWEEN_HEARTS,
            DISTANCE_BETWEEN_HEARTS,
            ASSETS.IMAGES.HEART_EMPTY,
          )
          .setScrollFactor(0)
          .setDepth(50);
      });

    this.hearts = Array(this.getHp())
      .fill(0)
      .map((_, i) => {
        return this.scene.add
          .sprite((i + 1) * DISTANCE_BETWEEN_HEARTS, DISTANCE_BETWEEN_HEARTS, ASSETS.IMAGES.HEART)
          .setScrollFactor(0)
          .setDepth(100);
      });
  }

  private updateHearts() {
    this.hearts.map((heart, index) => {
      if (index >= this.getHp()) {
        heart.setAlpha(0);
      }
    });
  }

  private reload() {
    this.isLoading = true;
    this.scene.time.addEvent({
      delay: PLAYER_RELOAD,
      callback: this.readyToFire,
      callbackScope: this,
    });
  }

  private readyToFire() {
    this.isLoading = false;
  }

  private go(direction: Orientation, shouldAnimate = true) {
    switch (direction) {
      case Orientation.Left:
        this.setVelocityX(-PLAYER_SPEED);
        break;
      case Orientation.Right:
        this.setVelocityX(PLAYER_SPEED);
        break;
      case Orientation.Up:
        this.setVelocityY(-PLAYER_SPEED);
        break;
      case Orientation.Down:
        this.setVelocityY(PLAYER_SPEED);
        break;
      default:
        break;
    }

    if (!shouldAnimate) {
      return;
    }

    this.orientation = direction;

    this.animate(Player.MOVE_ANIMATION, this.orientation);
  }

  private handleHorizontalMovement(keyPressed) {
    const isUpDownPressed = keyPressed.up || keyPressed.down;

    if (keyPressed.left) {
      this.go(Orientation.Left, !isUpDownPressed);
      return;
    }

    if (keyPressed.right) {
      this.go(Orientation.Right, !isUpDownPressed);
      return;
    }
  }

  private handleVerticalMovement(keyPressed) {
    if (keyPressed.up) {
      this.go(Orientation.Up);
    } else if (keyPressed.down) {
      this.go(Orientation.Down);
    }
  }

  private handleMovement(keyPressed) {
    if (this.isShooting) {
      return;
    }
    this.handleHorizontalMovement(keyPressed);
    this.handleVerticalMovement(keyPressed);
  }

  private punch() {
    this.animate(Player.PUNCH_ANIMATION, this.orientation);
  }

  private beIdle() {
    this.animate(Player.IDLE_ANIMATION, this.orientation);
  }

  private concludeShoot = () => {
    this.isShooting = false;
    const arrow = new Arrow(this.scene, this, this.orientation);
    this.scene.physics.add.collider(arrow, this.scene.monsterGroup, (a: Arrow, m: Monster) => {
      m.monsterLoseHp(a);
    });
  }

  private shoot() {
    this.isShooting = true;

    this.animate(Player.SHOOT_ANIMATION, this.orientation);
    // Arrow will be spawned at the end of the animation
  }

  private handleShootKey(keyPressed) {
    if (keyPressed.shift) {
      if (this.isLoading) {
        return;
      }
      this.reload();
      this.shoot();
    }
  }

  private spawnArrow() {
    const arrow = new Arrow(this.scene, this, this.orientation);
    this.scene.physics.add.collider(arrow, this.scene.monsterGroup, (a: Arrow, m: Monster) => {
      m.monsterLoseHp(a);
    });
  }
}
