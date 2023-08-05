// --
// Very simple static map pxi component
//
// - Curremtly pulls tiles from a 1600x1600 pixel tilemap of 32x32pixel tiles
// - Map has two layers, the first are background tiles that the characters can walk on
// - The second is populated with objects the characters cannot walk on
// --

import { PixiComponent, applyDefaultProps  } from '@pixi/react';
import { tilesetpath, tilefiledim, tiledim, screenxtiles, screenytiles, bgtiles, objmap} from '../../convex/maps/firstmap'
import * as PIXI from 'pixi.js';

const numytiles = tilefiledim / tiledim;
// sort of a hack to deal with limitations in the tile map
const bgtileindex = 51;

let tiles = [ ];

export const PixiStaticMap = PixiComponent('StaticMap', {
    create: ({ }) => {

        const bt = PIXI.BaseTexture.from(tilesetpath);

        for (let x =0; x < numytiles; x++){
            for (let y =0; y < numytiles; y++){
                tiles[x+ y*numytiles] = new PIXI.Texture(bt, new PIXI.Rectangle(x*tiledim, y*tiledim, tiledim, tiledim));
            }
        }

      const container = new PIXI.Container();

      // blit both layers of map onto canvas
        for (let i = 0; i < screenxtiles * screenytiles; i++) {
            let x = (i % screenytiles);
            let y = Math.floor(i / screenytiles);

            const ctile = new PIXI.Sprite(tiles[bgtiles[y][x]]);
            ctile.x = x * tiledim;
            ctile.y = y * tiledim;
            // a bit of hack to get arond limitations in the tileset
            // used to fill the background. Dealing with a shortcoming in the tilemap
            if(x > 0 && x < 15 && y > 0 && y < (screenytiles - 1)){
                const bgtile = new PIXI.Sprite(tiles[bgtileindex]);
                bgtile.x = x * tiledim;
                bgtile.y = y * tiledim;
                container.addChild(bgtile);
            }
            container.addChild(ctile)
            let l1tile = objmap[y][x];
            if (l1tile != -1) {
                const ctile = new PIXI.Sprite(tiles[l1tile]);
                ctile.x = x * tiledim;
                ctile.y = y * tiledim;
                container.addChild(ctile)
            }
        }
  
      container.x = 0;
      container.y = 0;
  
      return container;
  
      //return PIXI.Sprite.from('https://pixijs.com/assets/bunny.png')
    },
  
    applyProps: (instance, oldProps, newProps) => {
      applyDefaultProps(instance, oldProps, newProps);
    },

  });
