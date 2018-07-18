import { AbstractScene } from './AbstractScene';
import { Arrow } from '../game-objects/Arrow';
import { Player } from '../game-objects/Player';
import { Treant } from '../game-objects/Treant';
import { Npc } from '../game-objects/Npc';
import { scenes } from '../constants/scenes';
import { maps } from '../constants/maps';

const CAMERA_LERP = 1;

export class Second extends AbstractScene {
  constructor() {
    super(scenes.SECOND, maps.second.key);
  }
}
