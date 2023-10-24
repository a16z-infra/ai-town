import { engineTables } from '../engine/schema';
import { players } from './players';
import { locations } from './locations';
import { conversations } from './conversations';
import { conversationMembers } from './conversationMembers';
import { agents } from './agents';
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

const mapValidator = {
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
const maps = defineTable(mapValidator);
export const mapDoc = v.object({
  _id: v.id('maps'),
  _creationTime: v.number(),
  ...mapValidator,
});

export const gameTables = {
  maps,
  players,
  locations,
  conversations,
  conversationMembers,
  agents,
  ...engineTables,
};
