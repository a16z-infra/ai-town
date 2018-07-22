import { AbstractScene } from './AbstractScene';
import { scenes } from '../constants/scenes';
import { maps } from '../constants/maps';

export class Main extends AbstractScene {
  constructor() {
    super(scenes.MAIN, maps.main.key);
  }
}
