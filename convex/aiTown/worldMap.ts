import { Infer, ObjectType, v } from 'convex/values';

export const serializedWorldMap = {
  width: v.number(),
  height: v.number(),

  tileSetUrl: v.string(),
  //  Width & height of tileset image, px (assume square)
  tileSetDim: v.number(),
  // Tile size in pixels (assume square)
  tileDim: v.number(),
  bgTiles: v.array(v.array(v.array(v.number()))),
  objectTiles: v.array(v.array(v.number())),
};
export type SerializedWorldMap = ObjectType<typeof serializedWorldMap>;

export class WorldMap {
  width: number;
  height: number;

  tileSetUrl: string;
  tileSetDim: number;

  tileDim: number;
  bgTiles: number[][][];
  objectTiles: number[][];

  constructor(serialized: SerializedWorldMap) {
    const { width, height, tileSetUrl, tileSetDim, tileDim, bgTiles, objectTiles } = serialized;
    this.width = width;
    this.height = height;
    this.tileSetUrl = tileSetUrl;
    this.tileSetDim = tileSetDim;
    this.tileDim = tileDim;
    this.bgTiles = bgTiles;
    this.objectTiles = objectTiles;
  }

  serialize(): SerializedWorldMap {
    const { width, height, tileSetUrl, tileSetDim, tileDim, bgTiles, objectTiles } = this;
    return {
      width,
      height,
      tileSetUrl,
      tileSetDim,
      tileDim,
      bgTiles,
      objectTiles,
    };
  }
}
