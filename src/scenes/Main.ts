import { AbstractScene } from './AbstractScene';
import { SCENES } from '../constants/scenes';
import { MAPS } from '../constants/maps';

export class Main extends AbstractScene {
  constructor() {
    super(SCENES.MAIN, MAPS.main.key);
  }
}
