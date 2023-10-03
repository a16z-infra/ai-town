import { PixiComponent, applyDefaultProps } from '@pixi/react';
import * as PIXI from 'pixi.js';

export const PixiStaticMap = PixiComponent('StaticMap', {
  create: (props: any) => {
    const map = props.map;
    const numytiles = map.tileSetDim / map.tileDim;
    const bt = PIXI.BaseTexture.from(map.tileSetUrl, {
      scaleMode: PIXI.SCALE_MODES.NEAREST,
    });

    const tiles = [];
    for (let x = 0; x < numytiles; x++) {
      for (let y = 0; y < numytiles; y++) {
        tiles[x + y * numytiles] = new PIXI.Texture(
          bt,
          new PIXI.Rectangle(x * map.tileDim, y * map.tileDim, map.tileDim, map.tileDim),
        );
      }
    }
    const screenytiles = map.bgTiles[0].length;
    const screenxtiles = map.bgTiles[0][0].length;

    const container = new PIXI.Container();

    // blit bg & object layers of map onto canvas
    for (let i = 0; i < screenxtiles * screenytiles; i++) {
      const x = i % screenxtiles;
      const y = Math.floor(i / screenxtiles);
      const xPx = x * map.tileDim;
      const yPx = y * map.tileDim;

      // Add all layers of backgrounds.
      for (let z = 0; z < map.bgTiles.length; z++) {
        const tileIndex = map.bgTiles[z][y][x];
        // Some layers may not have tiles at this location.
        if (tileIndex === -1) continue;
        const ctile = new PIXI.Sprite(tiles[tileIndex]);
        ctile.x = xPx;
        ctile.y = yPx;
        container.addChild(ctile);
      }
      const l1tile = map.objectTiles[y][x];
      if (l1tile != -1) {
        const ctile = new PIXI.Sprite(tiles[l1tile]);
        ctile.x = xPx;
        ctile.y = yPx;
        container.addChild(ctile);
      }
    }

    container.x = 0;
    container.y = 0;

    // Set the hit area manually to ensure `pointerdown` events are delivered to this container.
    container.interactive = true;
    container.hitArea = new PIXI.Rectangle(
      0,
      0,
      screenxtiles * map.tileDim,
      screenytiles * map.tileDim,
    );

    return container;
  },

  applyProps: (instance, oldProps, newProps) => {
    applyDefaultProps(instance, oldProps, newProps);
  },
});
