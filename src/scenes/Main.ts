import { AbstractScene } from './AbstractScene';
import { SCENES } from '../constants/scenes';
import { maps } from '../constants/maps';

export class Main extends AbstractScene {
  constructor() {
    super(SCENES.MAIN, maps.main.key);
  }
}
