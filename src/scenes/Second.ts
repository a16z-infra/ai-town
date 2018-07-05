import AbstractScene from './AbstractScene';
import Arrow from '../game-objects/Arrow';
import Player from '../game-objects/Player';
import Treant from '../game-objects/Treant';
import Npc from '../game-objects/Npc';

const CAMERA_LERP = 1;

class Second extends AbstractScene {
  constructor() {
    super('Second', 'second');
  }
}

export default Second;
