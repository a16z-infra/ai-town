import * as PIXI from 'pixi.js'
import * as CONFIG from './levelconfig.js'

// -- 
// Overlay with a square and set interactive to capture mouse events etc
// --
export function set_interactive(level_container) {
    var newsquare = new PIXI.Graphics();
    newsquare.beginFill(0x2980b9);
    newsquare.drawRect(0, 0, CONFIG.LEVELWIDTH, CONFIG.LEVELHEIGHT);
    newsquare.endFill();
    newsquare.interactive = true;
    level_container.addChild(newsquare);
    return newsquare;
}