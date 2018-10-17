import { AbstractScene } from './AbstractScene';
import { SCENES } from '../constants/scenes';
import { MAPS } from '../constants/maps';

export class SecondLevel extends AbstractScene {
  constructor() {
    super(SCENES.SECOND_LEVEL, MAPS.secondLevel.key);
  }
}
