// Removed: import { Infer, ObjectType, v } from 'convex/values';

// `layer[position.x][position.y]` is the tileIndex or -1 if empty.
export type TileLayer = number[][]; // Was: v.array(v.array(v.number()));

export interface AnimatedSprite { // Was: const animatedSprite = { ... }
  x: number;
  y: number;
  w: number;
  h: number;
  layer: number;
  sheet: string;
  animation: string; // Was: animation: v.string()
}

export interface SerializedWorldMap { // Was: export const serializedWorldMap = { ... }
  width: number;
  height: number;

  tileSetUrl: string;
  //  Width & height of tileset image, px.
  tileSetDimX: number;
  tileSetDimY: number;

  // Tile size in pixels (assume square)
  tileDim: number;
  bgTiles: TileLayer; // Changed from TileLayer[] to TileLayer (number[][])
  objectTiles: TileLayer; // Changed from TileLayer[] to TileLayer (number[][])
  animatedSprites: AnimatedSprite[];
}

export class WorldMap {
  width: number;
  height: number;

  tileSetUrl: string;
  tileSetDimX: number;
  tileSetDimY: number;

  tileDim: number;

  bgTiles: TileLayer; // Now number[][]
  objectTiles: TileLayer; // Now number[][]
  animatedSprites: AnimatedSprite[];

  constructor(serialized: SerializedWorldMap) {
    this.width = serialized.width;
    this.height = serialized.height;
    this.tileSetUrl = serialized.tileSetUrl;
    this.tileSetDimX = serialized.tileSetDimX;
    this.tileSetDimY = serialized.tileSetDimY;
    this.tileDim = serialized.tileDim;
    this.bgTiles = serialized.bgTiles;
    this.objectTiles = serialized.objectTiles;
    this.animatedSprites = serialized.animatedSprites;
  }

  serialize(): SerializedWorldMap {
    return {
      width: this.width,
      height: this.height,
      tileSetUrl: this.tileSetUrl,
      tileSetDimX: this.tileSetDimX,
      tileSetDimY: this.tileSetDimY,
      tileDim: this.tileDim,
      bgTiles: this.bgTiles,
      objectTiles: this.objectTiles,
      animatedSprites: this.animatedSprites,
    };
  }
}
