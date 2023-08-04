// --
// Very simple static map pxi component
//
// - Curremtly pulls tiles from a 1600x1600 pixel tilemap of 32x32pixel tiles
// - Map has two layers, the first are background tiles that the characters can walk on
// - The second is populated with objects the characters cannot walk on
// --

import { PixiComponent, applyDefaultProps  } from '@pixi/react';
import * as PIXI from 'pixi.js';

const tilePath = '/assets/rpg-tileset.png';

// Static map properties. Lots of magic numbers here

// properties of tilemap
let tiledim = 32; // 32x32 pixel tiles
let tilefiledim = 1600; // 1600x1600 pixel file
let numytiles = tilefiledim / tiledim;

// properties of onscrean map 
let screenxtiles = 16;
let screenytiles = 16;

// sort of a hack to deal with limitations in the tile map
let bgtileindex = 51;

// background tiles. Character should be able to walk over there
let layer0 = [ 
[ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2  ],
[ 50,51, 51, 51, 51, 51, 455, 456,   457, 51, 51, 51, 51, 51, 51, 52  ],
[ 50,51, 51, 51, 51, 51, 555,  459, 507, 51, 51, 51, 51, 1312, 51, 52  ],
[ 50, 51, 51, 51, 51, 51, 51, 505, 507, 51, 51, 51, 51, 51, 51, 52  ],
[ 50, 1312, 51, 51, 51, 51, 51, 505, 508, 457, 51, 51, 51, 51, 51, 52  ],
[ 50, 51, 51, 51, 51, 51, 51, 505, 458, 557, 51, 51, 51, 51, 51, 52  ],
[ 50, 51, 51, 51, 51, 51, 51, 505, 507, 51, 51, 51, 51, 51, 51, 52  ],
[ 50, 51, 51, 51, 51, 51, 51, 505, 507, 51, 51, 51, 51, 51, 51, 52  ],
[ 50, 51, 51, 51, 51, 51, 51, 505, 507, 51, 51, 51, 51, 51, 51, 52  ],
[ 50, 455, 456, 456, 456, 456, 456, 509, 508, 456, 456, 456, 456, 456, 457, 52  ],
[ 50, 555, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 557, 52  ],
[ 50, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 52  ],
[ 50, 51, 1312, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 52  ],
[ 50, 51, 51, 51, 51, 51, 51, 51, 1312, 51, 51, 51, 51, 51, 51, 52  ],
[ 50,51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 51, 1312, 51, 51, 52  ],
[ 100,101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 101, 102  ],
];

// objects. Characters should not be able to walk over there
let layer1 = [ 
[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1  ],
[ -1,   -1,  -1,  5,    6,   7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1  ],
[ -1,   -1,  -1, 55,   56,  57, -1, -1, -1, -1, -1, -1, 1310, -1, -1, -1  ],
[ -1,   -1,  -1, 105, 106, 107, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1  ],
[ -1,   -1,  -1,  -1,  -1,  -1, -1, -1, -1, -1, 4571, 1308, 1309, -1, -1, -1  ],
[ -1,   -1,  -1,  -1,  -1,  1258, -1, -1, -1, -1, 5571, 1358, 1359, -1, -1, -1  ],
[ -1,   -1, 1350, -1,  -1,  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1  ],
[ -1,   -1,  -1,  -1,  -1,  -1, -1, -1, -1, -1, -1, -1, -1, 1208, -1, -1  ],
[ -1,   -1,  -1,  -1,  -1,  -1, -1, -1 ,-1, -1, -1, -1, -1, -1, -1, -1  ],
[ -1,   -1,  -1,  -1,  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1  ],
[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1  ],
[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1  ],
[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 1300, -1, -1, -1  ],
[ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1  ],
[ -1, 1310, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1  ],
[ -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1  ],
];

let tiles = [ ];


export const PixiStaticMap = PixiComponent('StaticMap', {
    create: ({ }) => {

        const bt = PIXI.BaseTexture.from(tilePath);

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

            const ctile = new PIXI.Sprite(tiles[layer0[y][x]]);
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
            let l1tile = layer1[y][x];
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
