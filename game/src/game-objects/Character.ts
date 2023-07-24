import { Orientation } from '../geometry/orientation';
import { AbstractScene } from '../scenes/AbstractScene';
import { SCENES } from '../constants/scenes';
import { GameManager } from '../scenes/GameManager';

const TEXT_VERTICAL_SHIFT = 10;

type CharacterAnimation = {
  [K in Orientation]: {
    flip: boolean;
    anim: string;
  };
};

export abstract class Character extends Phaser.Physics.Arcade.Sprite {
  public scene: AbstractScene;
  protected uiScene: GameManager;
  private textField: Phaser.GameObjects.Text;

  constructor(scene: AbstractScene, x: number, y: number, sprite: string) {
    super(scene, x, y, sprite, 0);
    this.scene = scene;
    this.scene.physics.add.existing(this);
    this.scene.add.existing(this);

    const uiScene: any = this.scene.scene.get(SCENES.GAME_MANAGER);
    this.uiScene = uiScene;

    this.textField = this.scene.add.text(0, 0, 'hello!', {
      fontFamily: 'Arial',
      align: 'center',
      fontSize: 10,
      color: '#000000',
      backgroundColor: "white",
      wordWrap: {
        width: 200
      }
    });

    this.textField.setPosition(
      this.x + (this.width - this.textField.width) / 2,
      this.y - this.textField.height - TEXT_VERTICAL_SHIFT,
    );
    this.textField.setAlpha(0).setDepth(1000);
  }

  public sayText(text: string) {
    // Set the text of the text game object to the new text
    this.textField.setText(text);
    
    this.textField.setPosition(
      this.x + (this.width - this.textField.width) / 2,
      this.y - this.textField.height - TEXT_VERTICAL_SHIFT,
    );
    // Make the text game object visible
    this.textField.setAlpha(1);

    //TODO scroll text when over ___ height
  }

  public clearText() {
    // Set the text of the text game object to the new text
    this.textField.setText("");

    // Make the text game object visible
    this.textField.setAlpha(0);

    //TODO fade out the field
  }

  protected animate(animationKeys: CharacterAnimation, orientation: Orientation) {
    const { flip, anim } = animationKeys[orientation];
    this.setFlipX(flip);
    this.play(anim, true);
  }
}
