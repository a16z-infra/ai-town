import { v } from 'convex/values';
import { Id } from '../_generated/dataModel';
import { ActionCtx, internalQuery } from '../_generated/server';
import { LLMMessage, chatCompletion } from '../util/openai';
import * as memory from './memory';
import { api, internal } from '../_generated/api';
import * as embeddingsCache from './embeddingsCache';
import { GameId, conversationId, playerId } from '../aiTown/ids';
import { Player } from '../aiTown/player';
import { PlayerDescription } from '../aiTown/playerDescription';
import { AgentDescription } from '../aiTown/agentDescription';
import { parseGameId } from '../aiTown/ids';

const selfInternal = internal.agent.conversation;

export async function startConversationMessage(
  ctx: ActionCtx,
  worldId: Id<'worlds'>,
  conversationId: GameId<'conversations'>,
  playerId: GameId<'players'>,
  otherPlayerIds: GameId<'players'>[],
) {
  const { player, otherPlayers, agent, otherAgents, lastConversation } = await ctx.runQuery(
    selfInternal.queryPromptData,
    {
      worldId,
      playerId,
      otherPlayerIds,
      conversationId,
    },
  );

  const otherPlayerNames = otherPlayers.map((p) => p.name);

  const embedding = await embeddingsCache.fetch(
    ctx,
    `What do you think about ${otherPlayerNames.join(',')}?`,
  );

  const memories = await memory.searchMemories(ctx, player.id as GameId<'players'>, embedding, 3);
  const memoryWithOtherPlayers = memories.find(
    (m) =>
      m.data.type === 'conversation' &&
      m.data.playerIds.some((id) => otherPlayerIds.includes(parseGameId('players', id))),
  );

  const prompt = [
    `You are ${player.name}, and you just started a conversation with ${otherPlayerNames.join(
      ', ',
    )}.`,
  ];
  prompt.push(...agentPrompts(otherPlayers, agent, otherAgents ?? null));
  prompt.push(...previousConversationPrompt(otherPlayers, lastConversation));
  prompt.push(...relatedMemoriesPrompt(memories));
  if (memoryWithOtherPlayers) {
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
    stream: true,
    stop: stopWords(otherPlayerNames[0], player.name),
  });
  return content;
}

export async function continueConversationMessage(
  ctx: ActionCtx,
  worldId: Id<'worlds'>,
  conversationId: GameId<'conversations'>,
  playerId: GameId<'players'>,
  otherPlayerIds: GameId<'players'>[],
) {
  const { player, otherPlayers, conversation, agent, otherAgents } = await ctx.runQuery(
    selfInternal.queryPromptData,
    {
      worldId,
      playerId,
      otherPlayerIds,
      conversationId,
    },
  );

  const otherPlayerNames = otherPlayers.map((p) => p.name);
  const now = Date.now();
  const started = new Date(conversation.created);

  console.warn(`TOPIC IS ${conversation.topic}`);

  const embedding = await embeddingsCache.fetch(
    ctx,
    `What do you think about ${otherPlayerNames.join(',')}?`,
  );
  const memories = await memory.searchMemories(ctx, player.id as GameId<'players'>, embedding, 3);
  const prompt = [
    `You are ${player.name}, and you're currently in a conversation with ${otherPlayerNames.join(
      ', ',
    )}.`,
    `The conversation started at ${started.toLocaleString()}. It's now ${now.toLocaleString()}.`,
  ];
  prompt.push(
    `This conversation is a debate about ${conversation.topic}.`,
    `The following is a document you can use as a reference: ${conversation.reference}`,
  );
  // prompt.push(...agentPrompts(otherPlayers, agent, otherAgents ?? null));
  // prompt.push(...relatedMemoriesPrompt(memories));
  prompt.push(
    `Below is the current chat history between you and ${otherPlayerNames.join(', ')}.`,
    `Try to add something new to the conversation and try to use the included reference document. Your response should be brief and within 200 characters.`,
  );

  const llmMessages: LLMMessage[] = [
    {
      role: 'user',
      content: prompt.join('\n'),
    },
    ...(await previousMessages(
      ctx,
      worldId,
      player,
      otherPlayers,
      conversation.id as GameId<'conversations'>,
    )),
  ];
  llmMessages.push({ role: 'user', content: `${player.name}:` });
  const { content } = await chatCompletion({
    messages: llmMessages,
    max_tokens: 300,
    stream: true,
    stop: stopWords(otherPlayerNames[0], player.name), // TODO: check this
  });
  return content;
}

export async function leaveConversationMessage(
  ctx: ActionCtx,
  worldId: Id<'worlds'>,
  conversationId: GameId<'conversations'>,
  playerId: GameId<'players'>,
  otherPlayerIds: GameId<'players'>[],
) {
  const { player, otherPlayers, conversation, agent, otherAgents } = await ctx.runQuery(
    selfInternal.queryPromptData,
    {
      worldId,
      playerId,
      otherPlayerIds,
      conversationId,
    },
  );
  const otherPlayerNames = otherPlayers.map((p) => p.name);
  const prompt = [
    `You are ${player.name}, and you're currently in a conversation with ${otherPlayerNames.join(
      ', ',
    )}.`,
    `You've decided to leave the question and would like to politely tell them you're leaving the conversation.`,
  ];
  prompt.push(...agentPrompts(otherPlayers, agent, otherAgents ?? null));
  prompt.push(
    `Below is the current chat history between you and ${otherPlayerNames.join(', ')}.`,
    `How would you like to tell them that you're leaving? Your response should be brief and within 200 characters.`,
  );
  const llmMessages: LLMMessage[] = [
    {
      role: 'user',
      content: prompt.join('\n'),
    },
    ...(await previousMessages(
      ctx,
      worldId,
      player,
      otherPlayers,
      conversation.id as GameId<'conversations'>,
    )),
  ];
  llmMessages.push({ role: 'user', content: `${player.name}:` });
  const { content } = await chatCompletion({
    messages: llmMessages,
    max_tokens: 300,
    stream: true,
    stop: stopWords(otherPlayerNames[0], player.name),
  });
  return content;
}

function agentPrompts(
  otherPlayers: { name: string }[],
  agent: { identity: string; plan: string } | null,
  otherAgents: { identity: string; plan: string }[] | null,
): string[] {
  const prompt = [];
  if (agent) {
    prompt.push(`About you: ${agent.identity}`);
    prompt.push(`Your goals for the conversation: ${agent.plan}`);
  }
  if (otherAgents) {
    for (let i = 0; i < otherAgents.length; i++) {
      const otherAgent = otherAgents[i];
      const otherPlayer = otherPlayers[i];
      prompt.push(`About ${otherPlayer.name}: ${otherAgent.identity}`);
    }
  }
  return prompt;
}

function previousConversationPrompt(
  otherPlayers: { name: string }[],
  conversation: { created: number } | null,
): string[] {
  const prompt = [];
  if (conversation) {
    const prev = new Date(conversation.created);
    const now = new Date();
    const otherPlayerNames = otherPlayers.map((p) => p.name);

    prompt.push(
      `Last time you chatted with ${otherPlayerNames.join(', ')}
      } it was ${prev.toLocaleString()}. It's now ${now.toLocaleString()}.`,
    );
  }
  return prompt;
}

function relatedMemoriesPrompt(memories: memory.Memory[]): string[] {
  const prompt = [];
  if (memories.length > 0) {
    prompt.push(`Here are some related memories in decreasing relevance order:`);
    for (const memory of memories) {
      prompt.push(' - ' + memory.description);
    }
  }
  return prompt;
}

async function previousMessages(
  ctx: ActionCtx,
  worldId: Id<'worlds'>,
  player: { id: string; name: string },
  otherPlayers: { id: string; name: string }[],
  conversationId: GameId<'conversations'>,
) {
  const llmMessages: LLMMessage[] = [];
  const prevMessages = await ctx.runQuery(api.messages.listMessages, { worldId, conversationId });
  for (const message of prevMessages) {
    const author =
      message.author === player.id ? player : otherPlayers.find((p) => p.id === message.author);
    llmMessages.push({
      role: 'user',
      content: `${author?.name}: ${message.text}`,
    });
  }
  return llmMessages;
}

export const queryPromptData = internalQuery({
  args: {
    worldId: v.id('worlds'),
    playerId,
    otherPlayerIds: v.array(v.string()),
    conversationId,
  },
  handler: async (ctx, args) => {
    const world = await ctx.db.get(args.worldId);
    if (!world) {
      throw new Error(`World ${args.worldId} not found`);
    }
    const player = world.players.find((p) => p.id === args.playerId);
    if (!player) {
      throw new Error(`Player ${args.playerId} not found`);
    }
    const playerDescription = await ctx.db
      .query('playerDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('playerId', args.playerId))
      .first();
    if (!playerDescription) {
      throw new Error(`Player description for ${args.playerId} not found`);
    }
    const otherPlayers = world.players.filter((p) => args.otherPlayerIds.includes(p.id));
    if (otherPlayers.length !== args.otherPlayerIds.length) {
      throw new Error(`Missing Player`);
    }
    //let otherPlayerDescriptions = [];
    //construct otherPlayerDescriptions as a map from playerId to description
    let otherPlayerDescriptions = new Map<string, PlayerDescription>();

    // for each other player, get their description
    for (const otherPlayer of otherPlayers) {
      const otherPlayerDescription = await ctx.db
        .query('playerDescriptions')
        .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('playerId', otherPlayer.id))
        .first();
      if (!otherPlayerDescription) {
        throw new Error(`Player description for ${otherPlayer.id} not found`);
      }
      //otherPlayerDescriptions.push(otherPlayerDescription);
      otherPlayerDescriptions.set(otherPlayer.id, new PlayerDescription(otherPlayerDescription));
    }
    const conversation = world.conversations.find((c) => c.id === args.conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${args.conversationId} not found`);
    }
    const agent = world.agents.find((a) => a.playerId === args.playerId);
    if (!agent) {
      throw new Error(`Player ${args.playerId} not found`);
    }
    const agentDescription = await ctx.db
      .query('agentDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('agentId', agent.id))
      .first();
    if (!agentDescription) {
      throw new Error(`Agent description for ${agent.id} not found`);
    }
    const otherAgents = world.agents.filter((a) => args.otherPlayerIds.includes(a.playerId));
    // let otherAgentDescriptions = [];
    let otherAgentDescriptions = new Map<string, AgentDescription>();

    // for each other agent, get their description
    for (const otherAgent of otherAgents) {
      const otherAgentDescription = await ctx.db
        .query('agentDescriptions')
        .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('agentId', otherAgent.id))
        .first();
      if (!otherAgentDescription) {
        throw new Error(`Agent description for ${otherAgent.id} not found`);
      }
      //otherAgentDescriptions.push(otherAgentDescription);
      otherAgentDescriptions.set(otherAgent.id, new AgentDescription(otherAgentDescription));
    }
    const lastTogether = await ctx.db
      .query('participatedTogether')
      .withIndex(
        'edge',
        (q) =>
          q
            .eq('worldId', args.worldId)
            .eq('player1', args.playerId)
            .eq('player2', args.otherPlayerIds[0]), // TODO: check this
      )
      // Order by conversation end time descending.
      .order('desc')
      .first();

    let lastConversation = null;
    if (lastTogether) {
      lastConversation = await ctx.db
        .query('archivedConversations')
        .withIndex('worldId', (q) =>
          q.eq('worldId', args.worldId).eq('id', lastTogether.conversationId),
        )
        .first();
      if (!lastConversation) {
        throw new Error(`Conversation ${lastTogether.conversationId} not found`);
      }
    }
    return {
      player: { name: playerDescription.name, ...player },
      otherPlayers: otherPlayers.map((player) => ({
        name: otherPlayerDescriptions.get(player.id)!.name,
        ...player,
      })),
      conversation,
      agent: { identity: agentDescription.identity, plan: agentDescription.plan, ...agent },
      otherAgents:
        otherAgents &&
        otherAgents.map((agent) => ({
          identity: otherAgentDescriptions.get(agent.id)!.identity,
          plan: otherAgentDescriptions.get(agent.id)!.plan,
          ...agent,
        })),
      lastConversation,
    };
  },
});

function stopWords(otherPlayer: string, player: string) {
  // These are the words we ask the LLM to stop on. OpenAI only supports 4.
  const variants = [`${otherPlayer} to ${player}`];
  return variants.flatMap((stop) => [stop + ':', stop.toLowerCase() + ':']);
}
