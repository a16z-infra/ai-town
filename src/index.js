import 'phaser';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
	pixelArt: true,
  scene: {
    preload: preload,
    create: create,
		update,
  },
};

const game = new Phaser.Game(config);
let controls;

function preload() {
  this.load.image('logo', 'assets/logo.png');
  this.load.tilemapTiledJSON('myworld', 'assets/tilemap.json');
  this.load.image('tiles', 'assets/tiles.png');
}

function create() {
  const map = this.make.tilemap({ key: 'myworld' });
  const tileset = map.addTilesetImage('tileset', 'tiles', 16, 16, 0, 0);

  const layer = map.createStaticLayer('background', tileset, 0, 0);
  const layer2 = map.createStaticLayer('obstacles', tileset, 0, 0);

  this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

  var cursors = this.input.keyboard.createCursorKeys();
  var controlConfig = {
    camera: this.cameras.main,
    left: cursors.left,
    right: cursors.right,
    up: cursors.up,
    down: cursors.down,
    speed: 0.5,
  };
  controls = new Phaser.Cameras.Controls.Fixed(controlConfig);

  var help = this.add.text(16, 16, 'Arrow keys to scroll', {
    fontSize: '18px',
    padding: { x: 10, y: 5 },
    backgroundColor: '#000000',
    fill: '#ffffff',
  });
  help.setScrollFactor(0);
  // this.map.addTilesetImage('result', 'tiles')
  // this.map.setCollisionBetween(1, 4)

  // this.layer = this.map.createLayer('obstacles')

  // this.layer.resizeWorld()

  // const logo = this.add.image(300, 150, 'logo');

  // this.tweens.add({
  //   targets: logo,
  //   y: 450,
  //   duration: 2000,
  //   ease: 'Power2',
  //   yoyo: true,
  //   loop: -1,
  // });
}

function update(time, delta) {
  controls.update(delta);
}
