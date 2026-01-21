/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * X402 WORLD - AI TOWN CONVERSATION SYSTEM
 * Advanced conversation management for agent interactions
 * Based on Generative Agents architecture
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { v } from 'convex/values';
import { mutation, query, action, internalAction } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import { api, internal } from '../_generated/api';

// ═══════════════════════════════════════════════════════════════════════════════
// CONVERSATION TOPIC GENERATORS
// ═══════════════════════════════════════════════════════════════════════════════

const X402_TOPICS = [
  'protocol upgrades',
  'liquidity optimization',
  'signal analysis',
  'recursive depth strategies',
  'transaction confirmation times',
  'market sentiment',
  'node coordination',
  'security protocols',
  'payment routing',
  'agent reputation',
  'service pricing',
  'RALPH processing',
  'micropayment efficiency',
  'cross-zone transfers',
  'oracle consensus',
];

const GREETING_TEMPLATES = [
  "Hey {name}, got a moment to discuss {topic}?",
  "{name}! I've been analyzing some {topic} data.",
  "Perfect timing, {name}. Any insights on {topic}?",
  "Good to see you, {name}. The {topic} metrics look interesting today.",
  "{name}, quick sync on {topic}?",
];

const RESPONSE_TEMPLATES = [
  "Interesting perspective on {topic}. My analysis suggests...",
  "I've been tracking {topic} closely. Here's what I've observed...",
  "That aligns with my {topic} models. Additionally...",
  "Good point about {topic}. From my zone's perspective...",
  "My confidence on {topic} is currently at {confidence}%. Here's why...",
];

// ═══════════════════════════════════════════════════════════════════════════════
// CONVERSATION QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

// Get all active conversations
export const getActiveConversations = query({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, { worldId }) => {
    return await ctx.db
      .query('conversations')
      .withIndex('worldId', (q) => q.eq('worldId', worldId))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect();
  },
});

// Get conversation history for an agent
export const getAgentConversationHistory = query({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { worldId, agentId, limit }) => {
    const conversations = await ctx.db
      .query('conversations')
      .withIndex('worldId', (q) => q.eq('worldId', worldId))
      .order('desc')
      .collect();

    return conversations
      .filter((c) => c.participants.includes(agentId))
      .slice(0, limit || 20);
  },
});

// Get conversation by ID with full details
export const getConversationDetails = query({
  args: {
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, { conversationId }) => {
    const conversation = await ctx.db.get(conversationId);
    if (!conversation) return null;

    // Get participant details
    const world = await ctx.db.get(conversation.worldId);
    const participants = conversation.participants.map((id: string) => {
      const agent = world?.agents?.find((a: any) => a.id === id);
      return agent || { id, name: 'Unknown' };
    });

    return {
      ...conversation,
      participantDetails: participants,
    };
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// CONVERSATION MUTATIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Initiate a conversation between agents
export const initiateConversation = mutation({
  args: {
    worldId: v.id('worlds'),
    initiatorId: v.string(),
    targetId: v.string(),
    topic: v.optional(v.string()),
  },
  handler: async (ctx, { worldId, initiatorId, targetId, topic }) => {
    const world = await ctx.db.get(worldId);
    if (!world) throw new Error('World not found');

    const initiator = world.agents.find((a: any) => a.id === initiatorId);
    const target = world.agents.find((a: any) => a.id === targetId);

    if (!initiator || !target) {
      throw new Error('Agent not found');
    }

    // Check if agents are in the same zone or adjacent
    if (initiator.zone !== target.zone) {
      throw new Error('Agents must be in the same zone to converse');
    }

    // Check if either agent is already in a conversation
    const existingConversation = await ctx.db
      .query('conversations')
      .withIndex('worldId', (q) => q.eq('worldId', worldId))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect();

    const alreadyTalking = existingConversation.some((c) =>
      c.participants.includes(initiatorId) || c.participants.includes(targetId)
    );

    if (alreadyTalking) {
      throw new Error('One or both agents are already in a conversation');
    }

    // Generate topic if not provided
    const conversationTopic = topic || X402_TOPICS[Math.floor(Math.random() * X402_TOPICS.length)];

    // Generate greeting
    const greetingTemplate = GREETING_TEMPLATES[Math.floor(Math.random() * GREETING_TEMPLATES.length)];
    const greeting = greetingTemplate
      .replace('{name}', target.name)
      .replace('{topic}', conversationTopic);

    const now = Date.now();

    // Create conversation
    const conversationId = await ctx.db.insert('conversations', {
      worldId,
      participants: [initiatorId, targetId],
      topic: conversationTopic,
      zone: initiator.zone,
      messages: [{
        agentId: initiatorId,
        content: greeting,
        timestamp: now,
        sentiment: 'neutral',
      }],
      startTime: now,
      status: 'active',
    });

    // Update agents' state
    const updatedAgents = world.agents.map((agent: any) => {
      if (agent.id === initiatorId || agent.id === targetId) {
        return {
          ...agent,
          state: 'talking',
          conversation: conversationId,
          lastActive: now,
        };
      }
      return agent;
    });

    await ctx.db.patch(worldId, { agents: updatedAgents });

    // Create memory for both agents
    await ctx.db.insert('memories', {
      worldId,
      agentId: initiatorId,
      type: 'conversation',
      content: `Started a conversation with ${target.name} about ${conversationTopic}.`,
      importance: 5,
      timestamp: now,
    });

    await ctx.db.insert('memories', {
      worldId,
      agentId: targetId,
      type: 'conversation',
      content: `${initiator.name} started a conversation about ${conversationTopic}.`,
      importance: 5,
      timestamp: now,
    });

    return conversationId;
  },
});

// Generate and add a response to conversation
export const generateResponse = mutation({
  args: {
    conversationId: v.id('conversations'),
    responderId: v.string(),
  },
  handler: async (ctx, { conversationId, responderId }) => {
    const conversation = await ctx.db.get(conversationId);
    if (!conversation) throw new Error('Conversation not found');
    if (conversation.status !== 'active') throw new Error('Conversation ended');

    if (!conversation.participants.includes(responderId)) {
      throw new Error('Agent is not part of this conversation');
    }

    const world = await ctx.db.get(conversation.worldId);
    if (!world) throw new Error('World not found');

    const responder = world.agents.find((a: any) => a.id === responderId);
    if (!responder) throw new Error('Responder not found');

    // Generate response based on agent's role and the topic
    const responseTemplate = RESPONSE_TEMPLATES[Math.floor(Math.random() * RESPONSE_TEMPLATES.length)];
    const response = responseTemplate
      .replace('{topic}', conversation.topic)
      .replace('{confidence}', String(responder.confidence || 50));

    const now = Date.now();

    const newMessage = {
      agentId: responderId,
      content: response,
      timestamp: now,
      sentiment: 'neutral' as const,
    };

    await ctx.db.patch(conversationId, {
      messages: [...conversation.messages, newMessage],
    });

    // Create memory for participants
    const otherParticipants = conversation.participants.filter((p: string) => p !== responderId);
    for (const participantId of otherParticipants) {
      await ctx.db.insert('memories', {
        worldId: conversation.worldId,
        agentId: participantId,
        type: 'conversation',
        content: `${responder.name} shared thoughts on ${conversation.topic}.`,
        importance: 3,
        timestamp: now,
      });
    }

    return newMessage;
  },
});

// End a conversation
export const endConversation = mutation({
  args: {
    conversationId: v.id('conversations'),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { conversationId, reason }) => {
    const conversation = await ctx.db.get(conversationId);
    if (!conversation) throw new Error('Conversation not found');

    const now = Date.now();

    await ctx.db.patch(conversationId, {
      status: 'ended',
      endTime: now,
    });

    // Update participants' state
    const world = await ctx.db.get(conversation.worldId);
    if (world) {
      const updatedAgents = world.agents.map((agent: any) => {
        if (conversation.participants.includes(agent.id)) {
          return {
            ...agent,
            state: 'idle',
            conversation: null,
            lastActive: now,
          };
        }
        return agent;
      });

      await ctx.db.patch(conversation.worldId, { agents: updatedAgents });
    }

    // Create summary memory
    const duration = Math.round((now - conversation.startTime) / 1000 / 60);
    for (const participantId of conversation.participants) {
      await ctx.db.insert('memories', {
        worldId: conversation.worldId,
        agentId: participantId,
        type: 'conversation',
        content: `Completed a ${duration} minute conversation about ${conversation.topic}. ${conversation.messages.length} exchanges.`,
        importance: 6,
        timestamp: now,
      });
    }

    return { success: true, duration, messageCount: conversation.messages.length };
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// CONVERSATION SIMULATION
// ═══════════════════════════════════════════════════════════════════════════════

// Simulate a conversation turn (for autonomous behavior)
export const simulateConversationTurn = mutation({
  args: {
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, { conversationId }) => {
    const conversation = await ctx.db.get(conversationId);
    if (!conversation) return null;
    if (conversation.status !== 'active') return null;

    // Determine whose turn it is
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    const nextSpeaker = conversation.participants.find((p: string) => p !== lastMessage.agentId);

    if (!nextSpeaker) return null;

    // Check if conversation should end (random chance increases with length)
    const endProbability = Math.min(0.8, conversation.messages.length * 0.15);
    if (Math.random() < endProbability) {
      // End the conversation
      return await endConversation(ctx, { conversationId, reason: 'natural end' });
    }

    // Generate response
    const world = await ctx.db.get(conversation.worldId);
    if (!world) return null;

    const responder = world.agents.find((a: any) => a.id === nextSpeaker);
    if (!responder) return null;

    const responses = [
      `That's a solid analysis of ${conversation.topic}. My RALPH depth is at ${responder.recursionDepth || 0} on this.`,
      `Interesting. The ${conversation.topic} signals I'm tracking suggest similar patterns.`,
      `My confidence on ${conversation.topic} just increased. Good insights.`,
      `I'll factor this ${conversation.topic} intel into my next processing cycle.`,
      `The X402 protocol metrics align with your ${conversation.topic} observations.`,
      `Running recursive analysis on ${conversation.topic}... patterns emerging.`,
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];
    const now = Date.now();

    const newMessage = {
      agentId: nextSpeaker,
      content: response,
      timestamp: now,
      sentiment: 'positive' as const,
    };

    await ctx.db.patch(conversationId, {
      messages: [...conversation.messages, newMessage],
    });

    return newMessage;
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// CONVERSATION FINDER - Find nearby agents to talk to
// ═══════════════════════════════════════════════════════════════════════════════

export const findConversationPartner = query({
  args: {
    worldId: v.id('worlds'),
    agentId: v.string(),
  },
  handler: async (ctx, { worldId, agentId }) => {
    const world = await ctx.db.get(worldId);
    if (!world) return null;

    const agent = world.agents.find((a: any) => a.id === agentId);
    if (!agent) return null;

    // Find agents in same zone who are idle
    const potentialPartners = world.agents.filter((a: any) =>
      a.id !== agentId &&
      a.zone === agent.zone &&
      a.state === 'idle' &&
      !a.conversation
    );

    if (potentialPartners.length === 0) return null;

    // Weight by reputation and last interaction time
    // For now, just pick randomly
    return potentialPartners[Math.floor(Math.random() * potentialPartners.length)];
  },
});
