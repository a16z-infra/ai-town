import { AbstractScene } from './AbstractScene';
import { SCENES } from '../constants/scenes';
import { MAPS } from '../constants/maps';

export class FirstLevel extends AbstractScene {
  constructor() {
    super(SCENES.FIRST_LEVEL, MAPS.firstLevel.key);
  }
}
