import { Infer, v } from 'convex/values';
import { tableHelper } from './lib/utils';

// ts is milliseconds in game time
const ts = v.number();
export type GameTs = Infer<typeof ts>;

// Hierarchical location within tree
// TODO: build zone lookup from position, whether player-dependent or global.

export const zone = v.array(v.string());
export type Zone = Infer<typeof zone>;

export const Position = v.object({ x: v.number(), y: v.number() });
export type Position = Infer<typeof Position>;
// Position plus a direction, as degrees counter-clockwise from East / Right

export const Pose = v.object({ position: Position, orientation: v.number() });
export type Pose = Infer<typeof Pose>;

export const Action = v.union(
  v.object({
    type: v.literal('startConversation'),
    audience: v.array(v.id('players')),
    content: v.string(),
  }),
  v.object({
    type: v.literal('saySomething'),
    audience: v.array(v.id('players')),
    content: v.string(),
    conversationId: v.id('conversations'),
  }),
  v.object({
    type: v.literal('travel'),
    position: Position,
  }),
  v.object({
    type: v.literal('stop'),
  }),
  v.object({
    type: v.literal('done'),
  }),
);
export type Action = Infer<typeof Action>;

export const Message = v.object({
  from: v.id('players'),
  fromName: v.string(),
  to: v.array(v.id('players')),
  toNames: v.array(v.string()),
  content: v.string(),
  ts,
});
export type Message = Infer<typeof Message>;

export const Stopped = v.object({
  type: v.literal('stopped'),
  reason: v.union(v.literal('interrupted'), v.literal('idle')),
  pose: Pose,
});

export const Walking = v.object({
  type: v.literal('walking'),
  route: v.array(Position),
  startTs: v.number(),
  targetEndTs: v.number(),
});

export const Motion = v.union(Walking, Stopped);
export type Motion = Infer<typeof Motion>;

export const Player = v.object({
  id: v.id('players'),
  name: v.string(),
  identity: v.string(),
  motion: Motion,
  thinking: v.boolean(),
  lastSpokeTs: v.number(),
  lastSpokeConversationId: v.optional(v.id('conversations')),
});
export type Player = Infer<typeof Player>;

export const Snapshot = v.object({
  player: Player,
  lastPlan: v.optional(v.object({ plan: v.string(), ts })),
  // recentMemories: v.array(memoryValidator),
  nearbyPlayers: v.array(
    v.object({
      player: Player,
      new: v.boolean(),
      relationship: v.string(),
    }),
  ),
  nearbyConversations: v.array(
    v.object({ conversationId: v.id('conversations'), messages: v.array(Message) }),
  ),
});
export type Snapshot = Infer<typeof Snapshot>;

// Journal documents are append-only, and define an player's state.
export const Journal = tableHelper('journal', {
  // TODO: maybe we can just use _creationTime?
  ts,
  playerId: v.id('players'),
  // emojiSummary: v.string(),
  data: v.union(
    v.object({
      type: v.literal('talking'),
      // If they are speaking to a person in particular.
      // If it's empty, it's just talking out loud.
      audience: v.array(v.id('players')),
      content: v.string(),
      // Refers to the first message in the conversation.
      conversationId: v.id('conversations'),
    }),
    Stopped,
    Walking,
    // When we run the agent loop.
    v.object({
      type: v.literal('thinking'),
      snapshot: Snapshot,
    }),
    // In case we don't do anything, confirm we're done thinking.
    v.object({
      type: v.literal('done_thinking'),
    }),

    // Exercises left to the reader:

    // v.object({
    //   type: v.literal('reflecting'),
    // }),
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

export const Memories = tableHelper('memories', {
  playerId: v.id('players'),
  description: v.string(),
  embeddingId: v.id('embeddings'),
  importance: v.number(),
  ts,
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

    // v.object({
    //   type: v.literal('reflection'),
    //   relatedMemoryIds: v.array(v.id('memories')),
    // }),
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
