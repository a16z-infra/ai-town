import { maps } from '../constants/maps';

export class Preloader extends Phaser.Scene {
  private loadAssets() {
    this.load.tilemapTiledJSON(maps.main.key, `assets/${maps.main.file}`);
    this.load.tilemapTiledJSON(maps.second.key, `assets/${maps.second.file}`);

    // Images
    this.load.image('logo', 'assets/logo.png');
    this.load.image('tiles', 'assets/environment/tileset.png');
    this.load.image('arrow-up', 'assets/spritesheets/misc/arrow-up.png');
    this.load.image('arrow-side', 'assets/spritesheets/misc/arrow-side.png');
    this.load.image('treantAttack', 'assets/environment/sliced-objects/trunk.png');
    this.load.image('heart', 'assets/heart.png');
    this.load.image('heart-empty', 'assets/heart-empty.png');
    this.load.image('tomb', 'assets/tomb.png');

    // Spritesheets
    this.load.spritesheet('player-idle-down', 'assets/spritesheets/hero/idle/hero-idle-front.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('player-idle-up', 'assets/spritesheets/hero/idle/hero-idle-back.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('player-idle-side', 'assets/spritesheets/hero/idle/hero-idle-side.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('player-walk-down', 'assets/spritesheets/hero/walk/hero-walk-front.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('player-walk-up', 'assets/spritesheets/hero/walk/hero-walk-back.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('player-walk-side', 'assets/spritesheets/hero/walk/hero-walk-side.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('player-attack-down', 'assets/spritesheets/hero/attack/hero-attack-front.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('player-attack-up', 'assets/spritesheets/hero/attack/hero-attack-back.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('player-attack-side', 'assets/spritesheets/hero/attack/hero-attack-side.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet(
      'player-attack-weapon-down',
      'assets/spritesheets/hero/attack-weapon/hero-attack-front-weapon.png',
      { frameWidth: 32, frameHeight: 32 },
    );
    this.load.spritesheet(
      'player-attack-weapon-up',
      'assets/spritesheets/hero/attack-weapon/hero-attack-back-weapon.png',
      { frameWidth: 32, frameHeight: 32 },
    );
    this.load.spritesheet(
      'player-attack-weapon-side',
      'assets/spritesheets/hero/attack-weapon/hero-attack-side-weapon.png',
      { frameWidth: 32, frameHeight: 32 },
    );
    this.load.spritesheet(
      'treant-idle-down',
      'assets/spritesheets/treant/idle/treant-idle-front.png',
      { frameWidth: 31, frameHeight: 35 },
    );
    this.load.spritesheet(
      'treant-walk-side',
      'assets/spritesheets/treant/walk/treant-walk-side.png',
      { frameWidth: 31, frameHeight: 35 },
    );
    this.load.spritesheet(
      'treant-walk-up',
      'assets/spritesheets/treant/walk/treant-walk-back.png',
      { frameWidth: 31, frameHeight: 35 },
    );
    this.load.spritesheet(
      'treant-walk-down',
      'assets/spritesheets/treant/walk/treant-walk-front.png',
      { frameWidth: 31, frameHeight: 35 },
    );
    this.load.spritesheet('player', 'assets/player.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('npcs', 'assets/npc.png', { frameWidth: 16, frameHeight: 16 });
  }

  private createAnimations() {
    this.anims.create({
      key: 'player-move-left',
      frames: this.anims.generateFrameNumbers('player-walk-side', { start: 0, end: 2 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'player-move-right',
      frames: this.anims.generateFrameNumbers('player-walk-side', { start: 0, end: 2 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'player-move-up',
      frames: this.anims.generateFrameNumbers('player-walk-up', { start: 0, end: 2 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'player-move-down',
      frames: this.anims.generateFrameNumbers('player-walk-down', { start: 0, end: 2 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'player-idle-up',
      frames: this.anims.generateFrameNumbers('player-idle-up', { start: 0, end: 0 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'player-idle-down',
      frames: this.anims.generateFrameNumbers('player-idle-down', { start: 0, end: 0 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'player-idle-side',
      frames: this.anims.generateFrameNumbers('player-idle-side', { start: 0, end: 0 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'player-attack-down',
      frames: this.anims.generateFrameNumbers('player-attack-down', { start: 0, end: 2 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'player-attack-up',
      frames: this.anims.generateFrameNumbers('player-attack-up', { start: 0, end: 2 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'player-attack-side',
      frames: this.anims.generateFrameNumbers('player-attack-side', { start: 0, end: 2 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'player-attack-weapon-down',
      frames: this.anims.generateFrameNumbers('player-attack-weapon-down', { start: 0, end: 2 }),
      frameRate: 7,
      repeat: -1,
    });
    this.anims.create({
      key: 'player-attack-weapon-up',
      frames: this.anims.generateFrameNumbers('player-attack-weapon-up', { start: 0, end: 2 }),
      frameRate: 7,
      repeat: -1,
    });
    this.anims.create({
      key: 'player-attack-weapon-side',
      frames: this.anims.generateFrameNumbers('player-attack-weapon-side', { start: 0, end: 2 }),
      frameRate: 7,
      repeat: -1,
    });
    this.anims.create({
      key: 'treant-idle-down',
      frames: this.anims.generateFrameNumbers('treant-idle-down', { start: 0, end: 0 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'treant-walk-side',
      frames: this.anims.generateFrameNumbers('treant-walk-side', { start: 0, end: 3 }),
      frameRate: 7,
      repeat: -1,
    });
    this.anims.create({
      key: 'treant-walk-down',
      frames: this.anims.generateFrameNumbers('treant-walk-down', { start: 0, end: 3 }),
      frameRate: 7,
      repeat: -1,
    });
    this.anims.create({
      key: 'treant-walk-up',
      frames: this.anims.generateFrameNumbers('treant-walk-up', { start: 0, end: 3 }),
      frameRate: 7,
      repeat: -1,
    });
  }

  private preload() {
    this.loadAssets();
  }

  private create() {
    this.createAnimations();
    this.scene.launch('Main');
  }
}
