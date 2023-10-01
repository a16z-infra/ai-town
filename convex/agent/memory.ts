import { defineTable } from 'convex/server';
import { v } from 'convex/values';
import { ActionCtx, internalMutation, internalQuery } from '../_generated/server';
import { Doc, Id } from '../_generated/dataModel';
import { internal } from '../_generated/api';
import { LLMMessage, chatCompletion } from '../util/openai';
import * as embeddingsCache from './embeddingsCache';

const selfInternal = internal.agent.memory;

export async function rememberConversation(
  ctx: ActionCtx,
  agentId: Id<'agents'>,
  generationNumber: number,
  playerId: Id<'players'>,
  conversationId: Id<'conversations'>,
) {
  const data = await ctx.runQuery(selfInternal.loadConversation, {
    playerId,
    conversationId,
  });
  if (data === null) {
    console.log(`Conversation ${conversationId} already remembered`);
    return;
  }
  const { player, otherPlayer } = data;
  const messages = await ctx.runQuery(selfInternal.loadMessages, { conversationId });
  if (!messages.length) {
    return;
  }
  const llmMessages: LLMMessage[] = [
    {
      role: 'user',
      content: `You are ${player.name}, and you just finished a conversation with ${otherPlayer.name}. I would
      like you to summarize the conversation from ${player.name}'s perspective, using first-person pronouns like
      "I," and add if you liked or disliked this interaction.`,
    },
  ];
  for (const message of messages) {
    const author = message.author === player._id ? player : otherPlayer;
    const recipient = message.author === player._id ? otherPlayer : player;
    llmMessages.push({
      role: 'user',
      content: `${author.name} to ${recipient.name}: ${message.text}`,
    });
  }
  llmMessages.push({ role: 'user', content: 'Summary:' });
  const { content: description } = await chatCompletion({
    messages: llmMessages,
    max_tokens: 500,
  });
  const summary = await description.readAll();
  const embedding = await embeddingsCache.fetch(ctx, summary);
  await ctx.runMutation(selfInternal.insertMemory, {
    agentId,
    generationNumber,

    owner: player._id,
    conversation: conversationId,
    summary,
    talkingTo: otherPlayer._id,
    embedding,
  });
  return summary;
}

export const loadConversation = internalQuery({
  args: {
    playerId: v.id('players'),
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('conversationMemories')
      .withIndex('owner', (q) =>
        q.eq('owner', args.playerId).eq('conversation', args.conversationId),
      )
      .first();
    if (existing) {
      return null;
    }
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error(`Player ${args.playerId} not found`);
    }
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${args.conversationId} not found`);
    }
    const conversationMembers = await ctx.db
      .query('conversationMembers')
      .withIndex('conversationId', (q) => q.eq('conversationId', args.conversationId))
      .filter((q) => q.neq(q.field('playerId'), args.playerId))
      .collect();
    if (conversationMembers.length !== 1) {
      throw new Error(`Conversation ${args.conversationId} not with exactly one other player`);
    }
    const otherPlayer = await ctx.db.get(conversationMembers[0].playerId);
    if (!otherPlayer) {
      throw new Error(`Conversation ${args.conversationId} other player not found`);
    }
    return {
      player,
      conversation,
      otherPlayer,
    };
  },
});

export async function queryOpinionAboutPlayer(
  ctx: ActionCtx,
  player: Doc<'players'>,
  otherPlayer: Doc<'players'>,
) {
  const embedding = await embeddingsCache.fetch(
    ctx,
    `What do you think about ${otherPlayer.name}?`,
  );
  const results = await ctx.vectorSearch('conversationMemories', 'embedding', {
    vector: embedding,
    filter: (q) => q.eq('conversationTag', conversationTag(player._id, otherPlayer._id)),
    limit: 3,
  });
  const summaries = await ctx.runQuery(selfInternal.loadMemories, {
    memoryIds: results.map((r) => r._id),
  });
  return summaries;
}

export const loadMemories = internalQuery({
  args: {
    memoryIds: v.array(v.id('conversationMemories')),
  },
  handler: async (ctx, args) => {
    const out = [];
    for (const memoryId of args.memoryIds) {
      const memory = await ctx.db.get(memoryId);
      if (!memory) {
        throw new Error(`Memory ${memoryId} not found`);
      }
      out.push(memory.summary);
    }
    return out;
  },
});

export const loadMessages = internalQuery({
  args: {
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query('messages')
      .withIndex('conversationId', (q) => q.eq('conversationId', args.conversationId))
      .collect();
    return messages;
  },
});

export const insertMemory = internalMutation({
  args: {
    agentId: v.id('agents'),
    generationNumber: v.number(),

    owner: v.id('players'),
    conversation: v.id('conversations'),
    talkingTo: v.id('players'),
    summary: v.string(),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      throw new Error(`Agent ${args.agentId} not found`);
    }
    if (agent.generationNumber !== args.generationNumber) {
      throw new Error(
        `Agent ${args.agentId} generation number ${agent.generationNumber} does not match ${args.generationNumber}`,
      );
    }
    await ctx.db.insert('conversationMemories', {
      owner: args.owner,
      conversation: args.conversation,
      talkingTo: args.talkingTo,
      conversationTag: conversationTag(args.owner, args.talkingTo),
      summary: args.summary,
      embedding: args.embedding,
    });
  },
});

export function conversationTag(playerId: Id<'players'>, otherPlayerId: Id<'players'>) {
  return `${playerId}:${otherPlayerId}`;
}

const conversationMemories = v.object({
  owner: v.id('players'),
  conversation: v.id('conversations'),
  talkingTo: v.id('players'),

  summary: v.string(),

  // Computed embedding of `summary`
  embedding: v.array(v.float64()),

  // Concatenation of `${owner}-${talkingTo}` to work around not having `.and()`
  // for vector indexes.
  conversationTag: v.string(),
});

export const memoryTables = {
  conversationMemories: defineTable(conversationMemories)
    .index('owner', ['owner', 'conversation'])
    .vectorIndex('embedding', {
      vectorField: 'embedding',
      filterFields: ['conversationTag'],
      dimensions: 1536,
    }),
};
