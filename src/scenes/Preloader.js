class Preloader extends Phaser.Scene {
  preload() {
    this.load.image('logo', 'assets/logo.png');
    this.load.tilemapTiledJSON('myworld', 'assets/tilemap.json');
    this.load.image('tiles', 'assets/environment/tileset.png');
    this.load.image('arrow-up', 'assets/spritesheets/misc/arrow-up.png');
    this.load.image('arrow-side', 'assets/spritesheets/misc/arrow-side.png');
    this.load.spritesheet('idle-down', 'assets/spritesheets/hero/idle/hero-idle-front.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('idle-up', 'assets/spritesheets/hero/idle/hero-idle-back.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('idle-side', 'assets/spritesheets/hero/idle/hero-idle-side.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('walk-down', 'assets/spritesheets/hero/walk/hero-walk-front.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('walk-up', 'assets/spritesheets/hero/walk/hero-walk-back.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('walk-side', 'assets/spritesheets/hero/walk/hero-walk-side.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('attack-down', 'assets/spritesheets/hero/attack/hero-attack-front.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('attack-up', 'assets/spritesheets/hero/attack/hero-attack-back.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('attack-side', 'assets/spritesheets/hero/attack/hero-attack-side.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('attack-weapon-down', 'assets/spritesheets/hero/attack-weapon/hero-attack-front-weapon.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('attack-weapon-up', 'assets/spritesheets/hero/attack-weapon/hero-attack-back-weapon.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('attack-weapon-side', 'assets/spritesheets/hero/attack-weapon/hero-attack-side-weapon.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('player', 'assets/player.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('npcs', 'assets/npc.png', { frameWidth: 16, frameHeight: 16 });
    this.load.image('treant', 'assets/sprites/treant/idle/treant-idle-front.png');
    this.load.image('treantAttack', 'assets/environment/sliced-objects/trunk.png')
    this.load.image('heart', 'assets/heart.png')
    this.load.image('tomb', 'assets/tomb.png')
  }

  create() {
    this.scene.launch('Main');
  }
}

export default Preloader;