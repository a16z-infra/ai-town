import { v } from 'convex/values';
import { action, query } from './_generated/server';
import { insertInput } from './aiTown/insertInput';
import { conversationId, playerId } from './aiTown/ids';
import { publishMessage } from '../util/rabbitmq';

// Deprecated: This will be removed once the frontend is updated to use a real-time communication mechanism.
export const listMessages = query({
  args: {
    worldId: v.id('worlds'),
    conversationId,
  },
  handler: async (ctx, args) => {
    return [];
  },
});

export const writeMessage = action({
  args: {
    worldId: v.id('worlds'),
    conversationId,
    messageUuid: v.string(),
    playerId,
    text: v.string(),
  },
  handler: async (ctx, args) => {
    await publishMessage(args.conversationId, {
        author: args.playerId,
        text: args.text,
        messageUuid: args.messageUuid,
    });
    await insertInput(ctx, args.worldId, 'finishSendingMessage', {
      conversationId: args.conversationId,
      playerId: args.playerId,
      timestamp: Date.now(),
    });
  },
});
