import { AbstractScene } from './AbstractScene';
import { SCENES } from '../constants/scenes';
import { maps } from '../constants/maps';

export class Second extends AbstractScene {
  constructor() {
    super(SCENES.SECOND, maps.second.key);
  }
}
