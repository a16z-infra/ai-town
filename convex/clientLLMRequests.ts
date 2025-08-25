import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { internal } from './_generated/api';

// Get pending client LLM requests for a world
export const getPendingRequests = query({
  args: { worldId: v.id('worlds') },
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query('clientLLMRequests')
      .withIndex('status', (q) => q.eq('status', 'pending'))
      .filter((q) => q.eq(q.field('worldId'), args.worldId))
      .order('asc')
      .take(10); // Limit to 10 requests at a time

    return requests;
  },
});

// Complete a client LLM request
export const completeRequest = mutation({
  args: {
    requestId: v.id('clientLLMRequests'),
    generatedText: v.string(),
    success: v.boolean(),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error(`Request ${args.requestId} not found`);
    }

    if (args.success && args.generatedText) {
      // Update the request with the generated text
      await ctx.db.patch(args.requestId, {
        status: 'completed',
        generatedText: args.generatedText,
      });

      // Send the message using the existing agent system
      await ctx.scheduler.runAfter(0, internal.aiTown.agent.agentSendMessage, {
        worldId: request.worldId,
        conversationId: request.conversationContext.conversationId,
        agentId: request.agentId,
        playerId: request.conversationContext.playerId,
        text: args.generatedText,
        messageUuid: request.messageUuid,
        leaveConversation: request.type === 'leave',
        operationId: request.operationId,
      });
    } else {
      // Mark as failed
      await ctx.db.patch(args.requestId, {
        status: 'failed',
        generatedText: args.generatedText || 'Failed to generate response',
      });

      // Still send a fallback message to continue the conversation flow
      const fallbackText = getFallbackText(request.type);
      await ctx.scheduler.runAfter(0, internal.aiTown.agent.agentSendMessage, {
        worldId: request.worldId,
        conversationId: request.conversationContext.conversationId,
        agentId: request.agentId,
        playerId: request.conversationContext.playerId,
        text: fallbackText,
        messageUuid: request.messageUuid,
        leaveConversation: request.type === 'leave',
        operationId: request.operationId,
      });
    }
  },
});

// Clean up old completed/failed requests
export const cleanupOldRequests = mutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    
    const oldRequests = await ctx.db
      .query('clientLLMRequests')
      .filter((q) => q.and(
        q.neq(q.field('status'), 'pending'),
        q.lt(q.field('timestamp'), cutoff)
      ))
      .collect();

    for (const request of oldRequests) {
      await ctx.db.delete(request._id);
    }
    
    return { deleted: oldRequests.length };
  },
});

function getFallbackText(type: 'start' | 'continue' | 'leave'): string {
  switch (type) {
    case 'start':
      return 'Hello there!';
    case 'continue':
      return 'That\'s interesting.';
    case 'leave':
      return 'Well, I should get going. Nice talking to you!';
    default:
      return 'Hi!';
  }
}