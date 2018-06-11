const PLAYER_INITIAL_POSITION = {
  x: 50,
  y: 200,
};

class Player {
  constructor(scene) {
    this.scene = scene;

    this.hp = 3;
    this.gameObject = scene.physics.add.sprite(
      PLAYER_INITIAL_POSITION.x,
      PLAYER_INITIAL_POSITION.y,
      'idle-down',
      0
    );
    this.orientation = 'down';
    this.lastTimeHit = new Date().getTime();
    this.gameObject.setCollideWorldBounds(true);
    this.loading = false;
  }

  reload() {
    this.loading = true;
  }

  readyToFire() {
    this.loading = false;
  }
}

export default Player;
