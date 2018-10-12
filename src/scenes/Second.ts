import { AbstractScene } from './AbstractScene';
import { SCENES } from '../constants/scenes';
import { MAPS } from '../constants/maps';

export class Second extends AbstractScene {
  constructor() {
    super(SCENES.SECOND, MAPS.second.key);
  }
}
