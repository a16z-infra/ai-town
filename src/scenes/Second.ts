import { AbstractScene } from './AbstractScene';
import { scenes } from '../constants/scenes';
import { maps } from '../constants/maps';

export class Second extends AbstractScene {
  constructor() {
    super(scenes.SECOND, maps.second.key);
  }
}
