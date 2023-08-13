import { defineSchema, defineTable } from 'convex/server';
import { Infer, v } from 'convex/values';
import { Table } from './lib/utils';

export const Worlds = Table('worlds', {
  // name: v.string(),
  // characterIds: v.array(v.id('characters')),
  // TODO: remove these and instead have a Zone hierarchy
  width: v.optional(v.number()), // number of tiles wide
  height: v.optional(v.number()),
  mapId: v.id('maps'),
  frozen: v.boolean(),
});

export const Maps = Table('maps', {
  tileSetUrl: v.string(),
  tileSetDim: v.number(), // Width & height of tileset image, px (assume square)
  tileDim: v.number(), // tile size in pixels (assume square)
  // An array of layers, which is a 2-d array of tile indices.
  bgTiles: v.array(v.array(v.array(v.number()))),
  objectTiles: v.array(v.array(v.number())),
});

export const Position = v.object({ x: v.number(), y: v.number() });
export type Position = Infer<typeof Position>;
// Position plus a direction, as degrees counter-clockwise from East / Right

export const Pose = v.object({ position: Position, orientation: v.number() });
export type Pose = Infer<typeof Pose>;

const commonFields = {
  from: v.id('players'),
  fromName: v.string(),
  to: v.array(v.id('players')),
  toNames: v.array(v.string()),
  ts: v.number(),
};
export const Message = v.union(
  // TODO: maybe just switch back to regular messages
  v.object({
    ...commonFields,
    type: v.literal('started'),
  }),
  v.object({
    ...commonFields,
    type: v.literal('responded'),
    content: v.string(),
  }),
  v.object({
    ...commonFields,
    type: v.literal('left'),
  }),
);
export type Message = Infer<typeof Message>;
// export type ResponseMessage = Omit<Message, 'data'> & {
//   data: Extract<Message['data'], { type: 'responded' }>;
// };

export const Stopped = v.object({
  type: v.literal('stopped'),
  reason: v.union(v.literal('interrupted'), v.literal('idle')),
  pose: Pose,
});

export const Walking = v.object({
  type: v.literal('walking'),
  route: v.array(Position),
  ignore: v.array(v.id('players')),
  startTs: v.number(),
  targetEndTs: v.number(),
});

export const Motion = v.union(Walking, Stopped);
export type Motion = Infer<typeof Motion>;

// Materiailized from journal & memories for a snapshot.
export const Player = v.object({
  id: v.id('players'),
  name: v.string(),
  agentId: v.optional(v.id('agents')),
  characterId: v.id('characters'),
  identity: v.string(),
  motion: Motion,
  thinking: v.boolean(),
  lastPlan: v.optional(v.object({ plan: v.string(), ts: v.number() })),
  lastChat: v.optional(v.object({ message: Message, conversationId: v.id('conversations') })),
});
export type Player = Infer<typeof Player>;

// Journal documents are append-only, and define an player's state.
export const Journal = Table('journal', {
  playerId: v.id('players'),
  // emojiSummary: v.string(),
  data: v.union(
    v.object({
      type: v.literal('startConversation'),
      audience: v.array(v.id('players')),
      conversationId: v.id('conversations'),
    }),
    v.object({
      type: v.literal('talking'),
      // If they are speaking to a person in particular.
      // If it's empty, it's just talking out loud.
      audience: v.array(v.id('players')),
      content: v.string(),
      // Refers to the first message in the conversation.
      conversationId: v.id('conversations'),
      relatedMemoryIds: v.optional(v.array(v.id('memories'))),
    }),
    v.object({
      type: v.literal('leaveConversation'),
      conversationId: v.id('conversations'),
      audience: v.array(v.id('players')),
    }),
    Stopped,
    Walking,

    // Exercises left to the reader:

    // v.object({
    //   type: v.literal('activity'),
    //   description: v.string(),
    // 	// objects: v.array(v.object({ id: v.id('objects'), action: v.string() })),
    //   pose: Pose,
    // }),
  ),
});
export type Entry = Infer<typeof Journal.doc>;
export type EntryType = Entry['data']['type'];
export type EntryOfType<T extends EntryType> = Omit<Entry, 'data'> & {
  data: Extract<Entry['data'], { type: T }>;
};
export type MessageEntry = EntryOfType<'talking' | 'startConversation' | 'leaveConversation'>;

export const Memories = Table('memories', {
  playerId: v.id('players'),
  description: v.string(),
  embeddingId: v.id('embeddings'),
  importance: v.number(),
  lastAccess: v.number(),
  data: v.union(
    // Useful for seed memories, high level goals
    v.object({
      type: v.literal('identity'),
    }),
    // Setting up dynamics between players
    v.object({
      type: v.literal('relationship'),
      playerId: v.id('players'),
    }),
    // Per-agent summary of recent observations
    // Can start out all the same, but could be dependent on personality
    v.object({
      type: v.literal('conversation'),
      conversationId: v.id('conversations'),
    }),
    v.object({
      type: v.literal('plan'),
    }),

    // Exercises left to the reader:

    v.object({
      type: v.literal('reflection'),
      relatedMemoryIds: v.array(v.id('memories')),
    }),
    // v.object({
    //   type: v.literal('observation'),
    //   object: v.string(),
    //   pose: Pose,
    // }),
    // Seemed too noisey for every message for every party, but maybe?
    // v.object({
    //   type: v.literal('message'),
    //   messageId: v.id('messages'),
    //   relatedMemoryIds: v.optional(v.array(v.id('memories'))),
    // }),
    // Could be a way to have the agent reflect and change identities
  ),
});
export type Memory = Infer<typeof Memories.doc>;
export type MemoryType = Memory['data']['type'];
export type MemoryOfType<T extends MemoryType> = Omit<Memory, 'data'> & {
  data: Extract<Memory['data'], { type: T }>;
};

export const Characters = Table('characters', {
  name: v.string(),
  textureUrl: v.string(),
  textureStorageId: v.optional(v.string()),
  spritesheetData: v.object({
    frames: v.any(), // Record<string, { frame: { x, y, w, h }, rotated?: boolean, trimmed?: boolean, spriteSourceSize: { x, y }, sourceSize: { w, h }, anchor?: {x, y} border?: {left, right, top, bottom} }>
    animations: v.optional(v.any()), // Record<string, string[]>
    meta: v.object({
      scale: v.string(),
    }),
  }),
  speed: v.number(),
});
export type SpritesheetData = Infer<(typeof Characters.fields)['spritesheetData']>;

// Hierarchical location within tree
// Future: build zone lookup from position, whether player-dependent or global.
// export const Zones = Table('zones', {
//   mapId: v.id('maps'),
//   name: v.string(),
//   parent: v.id('zones'), // index of parent zone
//   children: v.array(v.id('zones')), // index of children zones
//   area:
//     // v.union(
//     //   // Future: support polygons
//     //   v.object({
//     //     type: v.literal('polygon'),
//     //     minX: v.number(),
//     //     minY: v.number(),
//     //     maxX: v.number(),
//     //     maxY: v.number(),
//     //     points: v.array(v.object({ x: v.number(), y: v.number() })),
//     //   }),
//     v.object({
//       type: v.literal('rectangle'),
//       x: v.number(),
//       y: v.number(),
//       width: v.number(),
//       height: v.number(),
//     }),
//   // ),
// });
// export const zone = v.array(v.string());
// export type Zone = Infer<typeof zone>;

export default defineSchema(
  {
    worlds: Worlds.table,
    maps: Maps.table,
    characters: Characters.table,
    players: defineTable({
      name: v.string(),
      worldId: v.id('worlds'),
      // For NPCs, this is set to the agent's state.
      agentId: v.optional(v.id('agents')),
      characterId: v.id('characters'),
    }).index('by_worldId', ['worldId']),
    // For tracking the engine's processing of agents
    agents: defineTable({
      worldId: v.id('worlds'),
      playerId: v.id('players'),
      thinking: v.boolean(),
      nextWakeTs: v.number(),
      lastWakeTs: v.number(),
      alsoWake: v.optional(v.array(v.id('agents'))),
      scheduled: v.boolean(),
    }).index('by_worldId_thinking', ['worldId', 'thinking', 'nextWakeTs']),

    journal: Journal.table
      .index('by_playerId_type', ['playerId', 'data.type'])
      .index('by_conversation', ['data.conversationId']),

    memories: Memories.table
      .index('by_playerId_embeddingId', ['playerId', 'embeddingId'])
      .index('by_playerId_type', ['playerId', 'data.type']),

    embeddings: defineTable({
      playerId: v.optional(v.id('players')),
      text: v.string(),
      embedding: v.array(v.number()),
    })
      // To avoid recomputing embeddings, we can use this table as a cache.
      // IMPORTANT: don't re-use the object, as it has a reference to the playerId.
      // Just copy the embedding to a new document when needed.
      .index('by_text', ['text']),

    // Something for messages to associate with, can store
    // read-only metadata here in the future.
    conversations: defineTable({ worldId: v.id('worlds') }).index('by_worldId', ['worldId']),

    heartbeats: defineTable({}),
  },
  // When schemaValidation is enabled, it prevents pushing code that has a
  // schema incompatible with the current database.
  // It also prevents writing data at runtime that doesn't match the schema.
  // We disable it while iterating on the schema, to avoid needing to clear
  // tables all the time or write migrations while iterating quickly.
  // Instead, we just create new worlds with the correct data schema.
  { schemaValidation: true },
);
