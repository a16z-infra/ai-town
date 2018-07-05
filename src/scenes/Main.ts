import AbstractScene from './AbstractScene';
import Arrow from '../game-objects/Arrow';
import Player from '../game-objects/Player';
import Treant from '../game-objects/Treant';
import Npc from '../game-objects/Npc';

class Main extends AbstractScene {
  constructor() {
    super('Main', 'myworld');
  }
}

export default Main;
