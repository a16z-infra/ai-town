import { Infer, ObjectType, v } from 'convex/values';
import { GameId, parseGameId, zoneId } from './ids';

// ═══════════════════════════════════════════════════════════════════════════════
// X402 WORLD MAP
// Geographic representation of X402 World with functional zones
//
// ZONES (adapted from Gas Town concepts):
// - NEXUS: Central hub where The Oracle resides (Town Square)
// - EXCHANGE: Trading floor, DEX interactions (Market)
// - FORGE: Where new agents are created (Workshops)
// - ARCHIVE: Historical data & memories (Library)
// - GATEWAY: External API connections (Gates)
// - VAULT: Treasury & escrow (Bank)
// - LAB: Strategy testing & experimentation (Laboratory)
// - COMMONS: General interaction space (Commons)
// ═══════════════════════════════════════════════════════════════════════════════

// Tile layer types
const tileLayer = v.array(v.array(v.number()));
export type TileLayer = Infer<typeof tileLayer>;

// Animated sprite definition
const animatedSprite = {
  x: v.number(),
  y: v.number(),
  w: v.number(),
  h: v.number(),
  layer: v.number(),
  sheet: v.string(),
  animation: v.string(),
};
export type AnimatedSprite = ObjectType<typeof animatedSprite>;

// Zone definition
export const serializedZone = {
  id: zoneId,
  name: v.string(),
  type: v.union(
    v.literal('nexus'),
    v.literal('exchange'),
    v.literal('forge'),
    v.literal('archive'),
    v.literal('gateway'),
    v.literal('vault'),
    v.literal('lab'),
    v.literal('commons')
  ),
  position: v.object({ x: v.number(), y: v.number() }),
  radius: v.number(),
  capacity: v.number(),
  feeMultiplier: v.number(),
  color: v.string(),
  icon: v.string(),
};
export type SerializedZone = ObjectType<typeof serializedZone>;

export class Zone {
  id: GameId<'zones'>;
  name: string;
  type: string;
  position: { x: number; y: number };
  radius: number;
  capacity: number;
  feeMultiplier: number;
  color: string;
  icon: string;

  constructor(serialized: SerializedZone) {
    this.id = parseGameId('zones', serialized.id);
    this.name = serialized.name;
    this.type = serialized.type;
    this.position = serialized.position;
    this.radius = serialized.radius;
    this.capacity = serialized.capacity;
    this.feeMultiplier = serialized.feeMultiplier;
    this.color = serialized.color;
    this.icon = serialized.icon;
  }

  containsPoint(x: number, y: number): boolean {
    const dx = x - this.position.x;
    const dy = y - this.position.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.radius;
  }

  serialize(): SerializedZone {
    return {
      id: this.id,
      name: this.name,
      type: this.type as any,
      position: this.position,
      radius: this.radius,
      capacity: this.capacity,
      feeMultiplier: this.feeMultiplier,
      color: this.color,
      icon: this.icon,
    };
  }
}

// World map definition
export const serializedWorldMap = {
  width: v.number(),
  height: v.number(),

  // Visual layers
  tileSetUrl: v.string(),
  tileSetDimX: v.number(),
  tileSetDimY: v.number(),
  tileDim: v.number(),
  bgTiles: v.array(v.array(v.array(v.number()))),
  objectTiles: v.array(tileLayer),
  animatedSprites: v.array(v.object(animatedSprite)),

  // Functional zones (optional for migration from old data)
  zones: v.optional(v.array(v.object(serializedZone))),

  // Connection paths between zones (optional for migration from old data)
  paths: v.optional(v.array(v.object({
    from: zoneId,
    to: zoneId,
    cost: v.number(),
    type: v.union(v.literal('direct'), v.literal('tunnel'), v.literal('bridge')),
  }))),
};

export type SerializedWorldMap = ObjectType<typeof serializedWorldMap>;

export class WorldMap {
  width: number;
  height: number;

  tileSetUrl: string;
  tileSetDimX: number;
  tileSetDimY: number;
  tileDim: number;

  bgTiles: TileLayer[];
  objectTiles: TileLayer[];
  animatedSprites: AnimatedSprite[];

  zones: Map<GameId<'zones'>, Zone>;
  paths: Array<{
    from: GameId<'zones'>;
    to: GameId<'zones'>;
    cost: number;
    type: 'direct' | 'tunnel' | 'bridge';
  }>;

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

    this.zones = new Map();
    for (const zone of serialized.zones || []) {
      const z = new Zone(zone);
      this.zones.set(z.id, z);
    }

    this.paths = (serialized.paths || []).map(p => ({
      from: parseGameId('zones', p.from),
      to: parseGameId('zones', p.to),
      cost: p.cost,
      type: p.type,
    }));
  }

  // Get zone at position
  getZoneAt(x: number, y: number): Zone | undefined {
    for (const zone of this.zones.values()) {
      if (zone.containsPoint(x, y)) {
        return zone;
      }
    }
    return undefined;
  }

  // Get path between zones
  getPath(from: GameId<'zones'>, to: GameId<'zones'>): typeof this.paths[0] | undefined {
    return this.paths.find(p =>
      (p.from === from && p.to === to) ||
      (p.from === to && p.to === from)
    );
  }

  // Check if position is blocked
  isBlocked(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return true;
    }
    for (const layer of this.objectTiles) {
      if (layer[Math.floor(x)]?.[Math.floor(y)] !== -1) {
        return true;
      }
    }
    return false;
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
      zones: this.zones.size > 0 ? [...this.zones.values()].map(z => z.serialize()) : undefined,
      paths: this.paths.length > 0 ? this.paths.map(p => ({
        from: p.from,
        to: p.to,
        cost: p.cost,
        type: p.type,
      })) : undefined,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT X402 WORLD MAP CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export const DEFAULT_X402_MAP: SerializedWorldMap = {
  width: 100,
  height: 100,
  tileSetUrl: '/tilesets/x402-world.png',
  tileSetDimX: 256,
  tileSetDimY: 256,
  tileDim: 32,
  bgTiles: [],
  objectTiles: [],
  animatedSprites: [],

  zones: [
    {
      id: 'zn:000001',
      name: 'THE NEXUS',
      type: 'nexus',
      position: { x: 50, y: 50 },
      radius: 15,
      capacity: 50,
      feeMultiplier: 1.0,
      color: '#9945FF',
      icon: '🔮',
    },
    {
      id: 'zn:000002',
      name: 'THE EXCHANGE',
      type: 'exchange',
      position: { x: 25, y: 50 },
      radius: 12,
      capacity: 30,
      feeMultiplier: 1.2,
      color: '#14F195',
      icon: '📊',
    },
    {
      id: 'zn:000003',
      name: 'THE FORGE',
      type: 'forge',
      position: { x: 75, y: 50 },
      radius: 10,
      capacity: 20,
      feeMultiplier: 1.5,
      color: '#FF6B35',
      icon: '⚒️',
    },
    {
      id: 'zn:000004',
      name: 'THE ARCHIVE',
      type: 'archive',
      position: { x: 50, y: 25 },
      radius: 10,
      capacity: 15,
      feeMultiplier: 0.8,
      color: '#00D4FF',
      icon: '📚',
    },
    {
      id: 'zn:000005',
      name: 'THE GATEWAY',
      type: 'gateway',
      position: { x: 50, y: 75 },
      radius: 8,
      capacity: 25,
      feeMultiplier: 1.0,
      color: '#FFD700',
      icon: '🚪',
    },
    {
      id: 'zn:000006',
      name: 'THE VAULT',
      type: 'vault',
      position: { x: 25, y: 25 },
      radius: 8,
      capacity: 10,
      feeMultiplier: 0.5,
      color: '#FFB020',
      icon: '🏦',
    },
    {
      id: 'zn:000007',
      name: 'THE LAB',
      type: 'lab',
      position: { x: 75, y: 25 },
      radius: 10,
      capacity: 15,
      feeMultiplier: 1.3,
      color: '#FF3B5C',
      icon: '🧪',
    },
    {
      id: 'zn:000008',
      name: 'THE COMMONS',
      type: 'commons',
      position: { x: 75, y: 75 },
      radius: 12,
      capacity: 40,
      feeMultiplier: 0.9,
      color: '#8888AA',
      icon: '🏛️',
    },
  ],

  paths: [
    { from: 'zn:000001', to: 'zn:000002', cost: 25, type: 'direct' },
    { from: 'zn:000001', to: 'zn:000003', cost: 25, type: 'direct' },
    { from: 'zn:000001', to: 'zn:000004', cost: 25, type: 'direct' },
    { from: 'zn:000001', to: 'zn:000005', cost: 25, type: 'direct' },
    { from: 'zn:000002', to: 'zn:000006', cost: 30, type: 'tunnel' },
    { from: 'zn:000003', to: 'zn:000007', cost: 30, type: 'tunnel' },
    { from: 'zn:000004', to: 'zn:000006', cost: 30, type: 'direct' },
    { from: 'zn:000004', to: 'zn:000007', cost: 30, type: 'direct' },
    { from: 'zn:000005', to: 'zn:000008', cost: 30, type: 'bridge' },
    { from: 'zn:000003', to: 'zn:000008', cost: 20, type: 'direct' },
  ],
};
