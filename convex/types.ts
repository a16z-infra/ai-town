import { Infer, v } from 'convex/values';

export const Message = v.object({
  from: v.id('players'),
  to: v.array(v.id('players')),
  content: v.string(),
  ts: v.number(),
});
export type Message = Infer<typeof Message>;

// Hierarchical location within tree
// TODO: build zone lookup from position, whether player-dependent or global.

export const zone = v.array(v.string());
export type Zone = Infer<typeof zone>;

export const Position = v.object({ x: v.number(), y: v.number() });
export type Position = Infer<typeof Position>;
// Position plus a direction, as degrees counter-clockwise from East / Right

export const Pose = v.object({ position: Position, orientation: v.number() });
export type Pose = Infer<typeof Pose>;

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
});
export type Player = Infer<typeof Player>;

export const Snapshot = v.object({
  player: Player,
  lastPlan: v.optional(v.object({ plan: v.string(), ts: v.number() })),
  // recentMemories: v.array(memoryValidator),
  nearbyPlayers: v.array(v.object({ player: Player, new: v.boolean() })),
  nearbyConversations: v.array(
    v.object({ conversationId: v.id('conversations'), messages: v.array(Message) }),
  ),
});
export type Snapshot = Infer<typeof Snapshot>;

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
    type: v.literal('continue'),
  }),
);
export type Action = Infer<typeof Action>;
