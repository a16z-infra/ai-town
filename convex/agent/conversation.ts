import { v } from 'convex/values';
import { Doc, Id } from '../_generated/dataModel';
import { ActionCtx, QueryCtx, internalQuery } from '../_generated/server';
import { LLMMessage, chatCompletion } from '../util/openai';
import * as memory from './memory';
import { api, internal } from '../_generated/api';

const selfInternal = internal.agent.conversation;

export async function startConversation(
  ctx: ActionCtx,
  conversationId: Id<'conversations'>,
  playerId: Id<'players'>,
  otherPlayerId: Id<'players'>,
  lastConversationId: Id<'conversations'> | null,
) {
  const { player, otherPlayer, agent, otherAgent, lastConversation, previousSummaries } =
    await loadPromptData(ctx, playerId, otherPlayerId, conversationId, lastConversationId);
  const prompt = [
    `You are ${player.name}, and you just started a conversation with ${otherPlayer.name}.`,
  ];
  prompt.push(...agentPrompts(otherPlayer, agent, otherAgent));
  prompt.push(...previousConversationPrompt(otherPlayer, lastConversation));
  prompt.push(...conversationMemoriesPrompt(otherPlayer, previousSummaries));
  if (previousSummaries.length > 0) {
    prompt.push(
      `Be sure to include some detail or question about a previous conversation in your greeting.`,
    );
  }
  prompt.push(`${player.name}:`);

  const { content } = await chatCompletion({
    messages: [
      {
        role: 'user',
        content: prompt.join('\n'),
      },
    ],
    max_tokens: 300,
    stop: stopWords(otherPlayer),
  });
  return content;
}

export async function continueConversation(
  ctx: ActionCtx,
  conversationId: Id<'conversations'>,
  playerId: Id<'players'>,
  otherPlayerId: Id<'players'>,
  lastConversationId: Id<'conversations'> | null,
) {
  const { player, otherPlayer, conversation, agent, otherAgent, previousSummaries } =
    await loadPromptData(ctx, playerId, otherPlayerId, conversationId, lastConversationId);
  const now = Date.now();
  const started = new Date(conversation._creationTime);
  const prompt = [
    `You are ${player.name}, and you're currently in a conversation with ${otherPlayer.name}.`,
    `The conversation started at ${started.toLocaleString()}. It's now ${now.toLocaleString()}.`,
  ];
  prompt.push(...agentPrompts(otherPlayer, agent, otherAgent));
  prompt.push(...conversationMemoriesPrompt(otherPlayer, previousSummaries));
  prompt.push(
    `Below is the current chat history between you and ${otherPlayer.name}.`,
    `DO NOT greet them again. Do NOT use the word "Hey" too often. Your response should be brief and within 200 characters.`,
  );

  const llmMessages: LLMMessage[] = [
    {
      role: 'user',
      content: prompt.join('\n'),
    },
    ...(await previousMessages(ctx, player, otherPlayer, conversation._id)),
  ];
  llmMessages.push({ role: 'user', content: `${player.name}:` });
  const { content } = await chatCompletion({
    messages: llmMessages,
    max_tokens: 300,
    stop: stopWords(otherPlayer),
  });
  return content;
}

export async function leaveConversation(
  ctx: ActionCtx,
  conversationId: Id<'conversations'>,
  playerId: Id<'players'>,
  otherPlayerId: Id<'players'>,
  lastConversationId: Id<'conversations'> | null,
) {
  const { player, otherPlayer, conversation, agent, otherAgent } = await loadPromptData(
    ctx,
    playerId,
    otherPlayerId,
    conversationId,
    lastConversationId,
  );
  const prompt = [
    `You are ${player.name}, and you're currently in a conversation with ${otherPlayer.name}.`,
    `You've decided to leave the question and would like to politely tell them you're leaving the conversation.`,
  ];
  prompt.push(...agentPrompts(otherPlayer, agent, otherAgent));
  prompt.push(
    `Below is the current chat history between you and ${otherPlayer.name}.`,
    `How would you like to tell them that you're leaving? Your response should be brief and within 200 characters.`,
  );
  const llmMessages: LLMMessage[] = [
    {
      role: 'user',
      content: prompt.join('\n'),
    },
    ...(await previousMessages(ctx, player, otherPlayer, conversation._id)),
  ];
  llmMessages.push({ role: 'user', content: `${player.name}:` });
  const { content } = await chatCompletion({
    messages: llmMessages,
    max_tokens: 300,
    stop: stopWords(otherPlayer),
  });
  return content;
}

function agentPrompts(
  otherPlayer: Doc<'players'>,
  agent: Doc<'agents'> | null,
  otherAgent: Doc<'agents'> | null,
): string[] {
  const prompt = [];
  if (agent) {
    prompt.push(`About you: ${agent.identity}`);
    prompt.push(`Your goals for the conversation: ${agent.plan}`);
  }
  if (otherAgent) {
    prompt.push(`About ${otherPlayer.name}: ${otherAgent.identity}`);
  }
  return prompt;
}

function previousConversationPrompt(
  otherPlayer: Doc<'players'>,
  conversation: Doc<'conversations'> | null,
): string[] {
  const prompt = [];
  if (conversation) {
    const prev = new Date(conversation._creationTime);
    const now = new Date();
    prompt.push(
      `Last time you chatted with ${
        otherPlayer.name
      } it was ${prev.toLocaleString()}. It's now ${now.toLocaleString()}.`,
    );
  }
  return prompt;
}

function conversationMemoriesPrompt(otherPlayer: Doc<'players'>, summaries: string[]): string[] {
  const prompt = [];
  if (summaries.length > 0) {
    prompt.push(
      `Here are some summaries of previous conversations with ${otherPlayer.name} in decreasing relevance order:`,
    );
    for (const text of summaries) {
      prompt.push(' - ' + text);
    }
  }
  return prompt;
}

async function previousMessages(
  ctx: ActionCtx,
  player: Doc<'players'>,
  otherPlayer: Doc<'players'>,
  conversationId: Id<'conversations'>,
) {
  const llmMessages: LLMMessage[] = [];
  const prevMessages = await ctx.runQuery(api.messages.listMessages, { conversationId });
  for (const message of prevMessages) {
    const author = message.author === player._id ? player : otherPlayer;
    const recipient = message.author === player._id ? otherPlayer : player;
    llmMessages.push({
      role: 'user',
      content: `${author.name} to ${recipient.name}: ${message.text}`,
    });
  }
  return llmMessages;
}

async function loadPromptData(
  ctx: ActionCtx,
  playerId: Id<'players'>,
  otherPlayerId: Id<'players'>,
  conversationId: Id<'conversations'>,
  lastConversationId: Id<'conversations'> | null,
) {
  const promptData = await ctx.runQuery(selfInternal.queryPromptData, {
    playerId,
    otherPlayerId,
    conversationId,
    lastConversationId,
  });
  const previousSummaries = await memory.queryOpinionAboutPlayer(
    ctx,
    promptData.player,
    promptData.otherPlayer,
  );
  return { previousSummaries, ...promptData };
}

export const queryPromptData = internalQuery({
  args: {
    playerId: v.id('players'),
    otherPlayerId: v.id('players'),
    conversationId: v.id('conversations'),

    lastConversationId: v.union(v.id('conversations'), v.null()),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error(`Player ${args.playerId} not found`);
    }
    const otherPlayer = await ctx.db.get(args.otherPlayerId);
    if (!otherPlayer) {
      throw new Error(`Player ${args.otherPlayerId} not found`);
    }
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${args.conversationId} not found`);
    }
    const agent = await ctx.db
      .query('agents')
      .withIndex('playerId', (q) => q.eq('playerId', args.playerId))
      .first();
    if (!agent) {
      throw new Error(`Player ${args.playerId} not found`);
    }
    const otherAgent = await ctx.db
      .query('agents')
      .withIndex('playerId', (q) => q.eq('playerId', args.otherPlayerId))
      .first();
    let lastConversation = null;
    if (args.lastConversationId) {
      lastConversation = await ctx.db.get(args.lastConversationId);
      if (!lastConversation) {
        throw new Error(`Conversation ${args.lastConversationId} not found`);
      }
    }
    return { player, otherPlayer, conversation, agent, otherAgent, lastConversation };
  },
});

export const previousConversation = internalQuery({
  args: {
    conversationId: v.id('conversations'),
    playerId: v.id('players'),
    otherPlayerId: v.id('players'),
  },
  handler: async (ctx, args) => {
    const previousConversations = await ctx.db
      .query('conversationMembers')
      .withIndex('playerId', (q) => q.eq('playerId', args.playerId))
      .filter((q) => q.neq(q.field('conversationId'), args.conversationId))
      .collect();
    const conversations = [];
    for (const member of previousConversations) {
      const otherMember = await ctx.db
        .query('conversationMembers')
        .withIndex('conversationId', (q) =>
          q.eq('conversationId', member.conversationId).eq('playerId', args.otherPlayerId),
        )
        .first();
      if (otherMember) {
        const conversation = await ctx.db.get(member.conversationId);
        if (!conversation) {
          throw new Error(`Conversation ${member.conversationId} not found`);
        }
        if (conversation.finished) {
          conversations.push(conversation);
        }
      }
    }
    conversations.sort((a, b) => b._creationTime - a._creationTime);
    return conversations.length > 0 ? conversations[0] : null;
  },
});

function stopWords(otherPlayer: Doc<'players'>) {
  // These are the words we ask the LLM to stop on. OpenAI only supports 4.
  return [otherPlayer.name + ':', otherPlayer.name.toLowerCase() + ':'];
}
