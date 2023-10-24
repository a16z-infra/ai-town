import { Infer, v } from 'convex/values';
import { conversation } from './conversation';
import { player } from './player';
import { agent } from './agent';

export const worldFields = {
  nextId: v.number(),
  conversations: v.array(conversation),
  players: v.array(player),
  agents: v.array(agent),
};
export const world = v.object(worldFields);
export type World = Infer<typeof world>;
export const worldMapFields = {
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
export const worldMap = v.object(worldMapFields);
export type WorldMap = Infer<typeof worldMap>;
