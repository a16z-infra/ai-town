import { Infer, v } from 'convex/values';
import { Position, Pose } from './lib/physics.js';

export const Message = v.object({
  from: v.id('players'),
  to: v.array(v.id('players')),
  content: v.string(),
});
export type Message = Infer<typeof Message>;

export const Status = v.union(
  v.object({
    type: v.literal('talking'),
    otherPlayerIds: v.array(v.id('players')),
    conversationId: v.id('conversations'),
    messages: v.array(Message),
  }),
  v.object({
    type: v.literal('walking'),
    sinceTs: v.number(),
    route: v.array(Position),
    targetEndTs: v.number(),
  }),
  v.object({
    type: v.literal('stopped'),
    sinceTs: v.number(),
    reason: v.union(v.literal('interrupted'), v.literal('idle')),
  }),
  v.object({
    type: v.literal('thinking'),
    sinceTs: v.number(),
  }),
);
export type Status = Infer<typeof Status>;

export const Player = v.object({
  id: v.id('players'),
  name: v.string(),
  identity: v.string(),
  pose: Pose,
});
export type Player = Infer<typeof Player>;

export const Snapshot = v.object({
  player: Player,
  status: Status,
  plan: v.string(),
  // recentMemories: v.array(memoryValidator),
  nearbyPlayers: v.array(v.object({ player: Player, new: v.boolean() })),
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
    type: v.literal('continue'),
  }),
);
export type Action = Infer<typeof Action>;
