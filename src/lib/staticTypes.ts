/**
 * Static type definitions to replace Convex-dependent types
 * These provide the same interface without requiring Convex backend
 */

export interface AnimatedSprite {
  sheet: string;
  startFrame: number;
  endFrame: number;
  period: number;
  // Additional properties used by PixiStaticMap
  animation: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WorldMap {
  bgTiles: number[][][];
  objectTiles: number[][][];
  decorTiles: number[][][];
  width: number;
  height: number;
  tileSize: number;
  tilesheetUrl: string;
  tilesPerRow: number;
  animatedSprites: AnimatedSprite[];
  // Additional properties used by PixiStaticMap
  tileSetDimX: number;
  tileSetDimY: number;
  tileDim: number;
  tileSetUrl: string;
}

// Additional static types as needed
export interface StaticWorld {
  _id: string;
  nextId: number;
  agents: string[];
  conversations: string[];
  players: string[];
}

export interface StaticPlayer {
  _id: string;
  playerId: string;
  name: string;
  x: number;
  y: number;
}

export interface StaticAgent {
  _id: string;
  agentId: string;
  name: string;
  character: string;
  x: number;
  y: number;
}