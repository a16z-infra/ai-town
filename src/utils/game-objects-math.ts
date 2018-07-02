export const toVector2 = (gameObject: Phaser.Physics.Arcade.Sprite): Phaser.Math.Vector2 => {
  return new Phaser.Math.Vector2(gameObject.x, gameObject.y);
};
