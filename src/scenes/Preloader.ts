import maps from '../constants/maps';

class Preloader extends Phaser.Scene {
  loadAssets() {
    this.load.tilemapTiledJSON(maps.main.key, `assets/${maps.main.file}`);
    this.load.tilemapTiledJSON(maps.second.key, `assets/${maps.second.file}`);

    // Images
    this.load.image('logo', 'assets/logo.png');
    this.load.image('tiles', 'assets/environment/tileset.png');
    this.load.image('arrow-up', 'assets/spritesheets/misc/arrow-up.png');
    this.load.image('arrow-side', 'assets/spritesheets/misc/arrow-side.png');
    this.load.image('treant', 'assets/sprites/treant/idle/treant-idle-front.png');
    this.load.image('treantAttack', 'assets/environment/sliced-objects/trunk.png');
    this.load.image('heart', 'assets/heart.png');
    this.load.image('heart-empty', 'assets/heart-empty.png');
    this.load.image('tomb', 'assets/tomb.png');

    // Spritesheets
    this.load.spritesheet('idle-down', 'assets/spritesheets/hero/idle/hero-idle-front.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('idle-up', 'assets/spritesheets/hero/idle/hero-idle-back.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('idle-side', 'assets/spritesheets/hero/idle/hero-idle-side.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('walk-down', 'assets/spritesheets/hero/walk/hero-walk-front.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('walk-up', 'assets/spritesheets/hero/walk/hero-walk-back.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('walk-side', 'assets/spritesheets/hero/walk/hero-walk-side.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('attack-down', 'assets/spritesheets/hero/attack/hero-attack-front.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('attack-up', 'assets/spritesheets/hero/attack/hero-attack-back.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('attack-side', 'assets/spritesheets/hero/attack/hero-attack-side.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet(
      'attack-weapon-down',
      'assets/spritesheets/hero/attack-weapon/hero-attack-front-weapon.png',
      { frameWidth: 32, frameHeight: 32 }
    );
    this.load.spritesheet(
      'attack-weapon-up',
      'assets/spritesheets/hero/attack-weapon/hero-attack-back-weapon.png',
      { frameWidth: 32, frameHeight: 32 }
    );
    this.load.spritesheet(
      'attack-weapon-side',
      'assets/spritesheets/hero/attack-weapon/hero-attack-side-weapon.png',
      { frameWidth: 32, frameHeight: 32 }
    );
    this.load.spritesheet('player', 'assets/player.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('npcs', 'assets/npc.png', { frameWidth: 16, frameHeight: 16 });
  }

  createAnimations() {
    this.anims.create({
      key: 'left',
      frames: this.anims.generateFrameNumbers('walk-side', { start: 0, end: 2 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'right',
      frames: this.anims.generateFrameNumbers('walk-side', { start: 0, end: 2 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'up',
      frames: this.anims.generateFrameNumbers('walk-up', { start: 0, end: 2 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'down',
      frames: this.anims.generateFrameNumbers('walk-down', { start: 0, end: 2 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'idle-up',
      frames: this.anims.generateFrameNumbers('idle-up', { start: 0, end: 0 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'idle-down',
      frames: this.anims.generateFrameNumbers('idle-down', { start: 0, end: 0 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'idle-side',
      frames: this.anims.generateFrameNumbers('idle-side', { start: 0, end: 0 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'attack-down',
      frames: this.anims.generateFrameNumbers('attack-down', { start: 0, end: 2 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'attack-up',
      frames: this.anims.generateFrameNumbers('attack-up', { start: 0, end: 2 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'attack-side',
      frames: this.anims.generateFrameNumbers('attack-side', { start: 0, end: 2 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'attack-weapon-down',
      frames: this.anims.generateFrameNumbers('attack-weapon-down', { start: 0, end: 2 }),
      frameRate: 7,
      repeat: -1,
    });
    this.anims.create({
      key: 'attack-weapon-up',
      frames: this.anims.generateFrameNumbers('attack-weapon-up', { start: 0, end: 2 }),
      frameRate: 7,
      repeat: -1,
    });
    this.anims.create({
      key: 'attack-weapon-side',
      frames: this.anims.generateFrameNumbers('attack-weapon-side', { start: 0, end: 2 }),
      frameRate: 7,
      repeat: -1,
    });
  }

  preload() {
    this.loadAssets();
  }

  create() {
    this.createAnimations();
    this.scene.launch('Main');
  }
}

export default Preloader;
