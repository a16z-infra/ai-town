import { Id } from '../_generated/dataModel';
import { Game } from './game';
import { ObjectType, v } from 'convex/values';
import { Player } from './player';
import { Conversation, serializedConversation } from './conversation';

// export const serializedAuctionSettings = {
//   rounds: v.number(),
// };
// export type SerializedAuctionSettings = ObjectType<typeof serializedAuctionSettings>;

export const serializedDebateSettings = {
  rounds: v.number(),
  topic: v.string(),
  reference: v.string(),
};
export type SerializedDebateSettings = ObjectType<typeof serializedDebateSettings>;

export const serializedScenario = {
  id: v.optional(v.id('scenarios')),
  worldId: v.id('worlds'),
  type: v.union(v.literal('debate'), v.literal('auction')),
  description: v.string(),
  conversation: v.object(serializedConversation),
  settings: v.object(serializedDebateSettings),
};
export type SerializedScenario = ObjectType<typeof serializedScenario>;

export class Scenario {
  id?: Id<'scenarios'>;
  worldId: Id<'worlds'>;
  type: 'debate' | 'auction';
  description: string;
  conversation?: Conversation;
  settings: SerializedDebateSettings;

  constructor(serialized: SerializedScenario) {
    this.id = serialized.id;
    this.worldId = serialized.worldId;
    this.type = serialized.type;
    this.description = serialized.description;
    this.conversation =
      (serialized.conversation && new Conversation(serialized.conversation)) || undefined;
    this.settings = serialized.settings;
  }

  start(game: Game, now: number, players: Player[]) {
    this.conversation = Conversation.startMultiplayer(game, now, players);
    console.log(`START MULTIPLAYER`);
  }

  getInitialMessage() {
    if (this.type === 'debate') {
      const prompt = [
        `You are ${
          player.name
        }, and you're currently in a conversation with ${otherPlayerNames.join(', ')}.`,
        `The conversation started at ${started.toLocaleString()}. It's now ${now.toLocaleString()}.`,
      ];
      return ` 
      
      `;
    }
  }

  serialize(): SerializedScenario {
    return {
      id: this.id,
      worldId: this.worldId,
      type: this.type,
      description: this.description,
      conversation: this.conversation,
      settings: this.settings,
    };
  }
}

// export async function continueConversationMessage(
//   ctx: ActionCtx,
//   worldId: Id<'worlds'>,
//   conversationId: GameId<'conversations'>,
//   playerId: GameId<'players'>,
//   otherPlayerIds: GameId<'players'>[],
// ) {
//   const { player, otherPlayers, conversation, agent, otherAgents } = await ctx.runQuery(
//     selfInternal.queryPromptData,
//     {
//       worldId,
//       playerId,
//       otherPlayerIds,
//       conversationId,
//     },
//   );

//   const otherPlayerNames = otherPlayers.map((p) => p.name);
//   const now = Date.now();
//   const started = new Date(conversation.created);

//   const embedding = await embeddingsCache.fetch(
//     ctx,
//     `What do you think about ${otherPlayerNames.join(',')}?`,
//   );
//   const memories = await memory.searchMemories(ctx, player.id as GameId<'players'>, embedding, 3);
//   const prompt = [
//     `You are ${player.name}, and you're currently in a conversation with ${otherPlayerNames.join(
//       ', ',
//     )}.`,
//     `The conversation started at ${started.toLocaleString()}. It's now ${now.toLocaleString()}.`,
//   ];
//   prompt.push(...agentPrompts(otherPlayers, agent, otherAgents ?? null));
//   prompt.push(...relatedMemoriesPrompt(memories));
//   prompt.push(
//     `Below is the current chat history between you and ${otherPlayerNames.join(', ')}.`,
//     `DO NOT greet them again. Do NOT use the word "Hey" too often. Your response should be brief and within 200 characters.`,
//   );

//   const llmMessages: LLMMessage[] = [
//     {
//       role: 'user',
//       content: prompt.join('\n'),
//     },
//     ...(await previousMessages(
//       ctx,
//       worldId,
//       player,
//       otherPlayers,
//       conversation.id as GameId<'conversations'>,
//     )),
//   ];
//   llmMessages.push({ role: 'user', content: `${player.name}:` });
//   const { content } = await chatCompletion({
//     messages: llmMessages,
//     max_tokens: 300,
//     stream: true,
//     stop: stopWords(otherPlayerNames[0], player.name), // TODO: check this
//   });
//   return content;
// }
