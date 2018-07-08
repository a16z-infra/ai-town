import AbstractScene from './AbstractScene';
import Arrow from '../game-objects/Arrow';
import Player from '../game-objects/Player';
import Treant from '../game-objects/Treant';
import Npc from '../game-objects/Npc';
import scenes from '../constants/scenes';
import maps from '../constants/maps';

class Main extends AbstractScene {
  constructor() {
    super(scenes.MAIN, maps.main.key);
  }
}

export default Main;
