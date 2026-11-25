import { ObjectType, v } from 'convex/values';
import { MutationCtx, mutation, query } from './_generated/server';
import { insertInput } from './aiTown/insertInput';
import { conversationId, playerId } from './aiTown/ids';

export const listMessages = query({
  args: {
    worldId: v.id('worlds'),
    conversationId,
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query('messages')
      .withIndex('conversationId', (q) =>
        q.eq('worldId', args.worldId).eq('conversationId', args.conversationId),
      )
      .collect();
    const out = [];
    for (const message of messages) {
      const playerDescription = await ctx.db
        .query('playerDescriptions')
        .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('playerId', message.author))
        .first();
      if (!playerDescription) {
        throw new Error(`Invalid author ID: ${message.author}`);
      }
      out.push({ ...message, authorName: playerDescription.name });
    }
    return out;
  },
});

const messageArgs = {
  worldId: v.id('worlds'),
  conversationId,
  messageUuid: v.string(),
  playerId,
  text: v.string(),
};

type Sender =
  | { kind: 'human'; tokenIdentifier: string }
  | { kind: 'agent'; agentId: string; operationId: string; leaveConversation: boolean };

export async function publishMessage(
  ctx: MutationCtx,
  args: ObjectType<typeof messageArgs>,
  sender: Sender,
) {
  const { worldId, conversationId, playerId, messageUuid, text } = args;
  // This indexed read and both inserts share one transaction. A concurrent
  // publisher for the same UUID retries against the winning message.
  const published = await ctx.db
    .query('messages')
    .withIndex('messageUuid', (q) =>
      q.eq('conversationId', conversationId).eq('messageUuid', messageUuid),
    )
    .filter((q) => q.eq(q.field('worldId'), worldId))
    .first();
  const world = await ctx.db.get(worldId);
  const player = world?.players.find((p) => p.id === playerId);
  if (sender.kind === 'human') {
    // The original sender can acknowledge a committed send after leaving town.
    const owner =
      player ??
      (published &&
        (await ctx.db
          .query('archivedPlayers')
          .withIndex('worldId', (q) => q.eq('worldId', worldId).eq('id', playerId))
          .first()));
    if (owner?.human !== sender.tokenIdentifier) throw new Error('Not the human player');
  }
  if (published) {
    if (published.author !== playerId || (sender.kind === 'human' && published.text !== text)) {
      throw new Error('Message UUID already used for another message');
    }
    return;
  }

  const conversation = world?.conversations.find((c) => c.id === conversationId);
  const participating =
    player &&
    conversation?.participants.some(
      (member) => member.playerId === playerId && member.status.kind === 'participating',
    );
  const typing = conversation?.isTyping;
  if (sender.kind === 'human') {
    if (!participating) {
      throw new Error('Only the participating human player can send this message');
    }
    if (typing?.messageUuid === messageUuid && typing.playerId !== playerId) {
      throw new Error('Message UUID belongs to the other participant');
    }
  } else {
    const agent = world?.agents.find((a) => a.id === sender.agentId && a.playerId === playerId);
    const op = agent?.inProgressOperation;
    if (
      !participating ||
      op?.name !== 'agentGenerateMessage' ||
      op.operationId !== sender.operationId
    ) {
      return;
    }
    // Older scheduled actions carry the UUID in their immutable arguments.
    // Their operation ID remains authoritative after the typing indicator expires.
    if (op.messageUuid !== undefined && op.messageUuid !== messageUuid) return;
    if (typing && (typing.playerId !== playerId || typing.messageUuid !== messageUuid)) return;
  }

  await ctx.db.insert('messages', { worldId, conversationId, author: playerId, messageUuid, text });
  const completion = { conversationId, messageUuid, timestamp: Date.now() };
  if (sender.kind === 'human') {
    await insertInput(ctx, worldId, 'finishSendingMessage', { ...completion, playerId });
  } else {
    const { agentId, operationId, leaveConversation } = sender;
    await insertInput(ctx, worldId, 'agentFinishSendingMessage', {
      ...completion,
      agentId,
      operationId,
      leaveConversation,
    });
  }
}

export const writeMessage = mutation({
  args: messageArgs,
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not logged in');
    await publishMessage(ctx, args, { kind: 'human', tokenIdentifier: identity.tokenIdentifier });
  },
});
