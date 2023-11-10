import { Id } from '../_generated/dataModel';
import { Game } from './game';
import { ObjectType, v } from 'convex/values';
import { Player } from './player';
import { Conversation, serializedConversation } from './conversation';
import { ACTION_TIMEOUT, TYPING_TIMEOUT } from '../constants';

export const serializedAuctionSettings = {
  rounds: v.number(),
};
export type SerializedAuctionSettings = ObjectType<typeof serializedAuctionSettings>;

export const serializedDebateSettings = {
  rounds: v.number(),
  topic: v.string(),
};
export type SerializedDebateSettings = ObjectType<typeof serializedDebateSettings>;

export const serializedScenario = {
  id: v.optional(v.id('scenarios')),
  worldId: v.id('worlds'),
  type: v.union(v.literal('debate'), v.literal('auction')),
  description: v.string(),
  conversation: v.object(serializedConversation),
  scenarioSettings: v.union(
    v.object(serializedAuctionSettings),
    v.object(serializedDebateSettings),
  ),
};
export type SerializedScenario = ObjectType<typeof serializedScenario>;

export class Scenario {
  id?: Id<'scenarios'>;
  worldId: Id<'worlds'>;
  type: 'debate' | 'auction';
  description: string;
  conversation?: Conversation;
  scenarioSettings: SerializedAuctionSettings | SerializedDebateSettings;

  constructor(serialized: SerializedScenario) {
    this.id = serialized.id;
    this.worldId = serialized.worldId;
    this.type = serialized.type;
    this.description = serialized.description;
    this.conversation =
      (serialized.conversation && new Conversation(serialized.conversation)) || undefined;
    this.scenarioSettings = serialized.scenarioSettings;
  }

  tick(game: Game, now: number) {
    if (
      this.conversation &&
      this.conversation.isTyping &&
      this.conversation.isTyping.since + TYPING_TIMEOUT < now
    ) {
      delete this.conversation.isTyping;
    }
    for (const agent of game.world.agents.values()) {
      const player = game.world.players.get(agent.playerId);
      console.log(`PLAYER: ${player!.id}`);
      if (!player) {
        throw new Error(`Invalid player ID: ${agent.playerId}`);
      }
      if (agent.inProgressOperation) {
        if (now < agent.inProgressOperation.started + ACTION_TIMEOUT) {
          // Wait on the operation to finish.
          return;
        }
        console.log(`Timing out ${JSON.stringify(agent.inProgressOperation)}`);
        delete agent.inProgressOperation;
      }

      const conversation = game.world.playerConversation(player);
      const member = conversation?.participants.get(player.id);
      //TODO: do we need to remember anything?
      if (conversation && member) {
        const otherPlayerIds = [...conversation.participants.keys()].filter(
          (id) => id !== player.id,
        );
        if (member?.status.kind === 'participating') {
          // if (conversation.nextSpeaker !== player.id) {
          //   // Wait for the other player to finish speaking.
          //   return;
          // }
          console.log(`NEXT SPEAKER: ${conversation.nextSpeaker}`);
          // if (conversation.isTyping && conversation.isTyping.playerId !== player.id) {
          //   // Wait for the other player to finish typing.
          //   console.log(`PLAYER IS TYPING: ${conversation.isTyping.playerId}`);
          //   return;
          // }

          // if (
          //   conversation.numMessages >
          //   conversation.participants.size * this.scenarioSettings.rounds
          // ) {
          //   console.log(`${player.id} leaving conversation.`);
          //   const messageUuid = crypto.randomUUID();
          //   conversation.setIsTyping(now, player, messageUuid);
          //   conversation.setNextSpeaker();
          //   agent.startOperation(game, now, 'agentGenerateMessage', {
          //     worldId: game.worldId,
          //     playerId: player.id,
          //     agentId: agent.id,
          //     conversationId: conversation.id,
          //     otherPlayerIds,
          //     messageUuid,
          //     type: 'leave',
          //   });
          //   return;
          // }

          const messageUuid = crypto.randomUUID();
          conversation.setIsTyping(now, player, messageUuid);
          conversation.setNextSpeaker();
          agent.startOperation(game, now, 'agentGenerateMessage', {
            worldId: game.worldId,
            playerId: player.id,
            agentId: agent.id,
            conversationId: conversation.id,
            otherPlayerIds,
            messageUuid,
            type: 'continue',
          });
        }
      }
    }
    // console.log(`SCENARIO TICK: ${JSON.stringify(this)}`);
    // console.log(`CONVERSATIONS: ${JSON.stringify(game.world.conversations)}`);
    // console.log(`AGENTS: ${JSON.stringify(game.world.agents)}`);
  }

  start(game: Game, now: number, players: Player[]) {
    this.conversation = Conversation.startMultiplayer(game, now, players);
    console.log(`START MULTIPLAYER`);
  }

  serialize(): SerializedScenario {
    return {
      id: this.id,
      worldId: this.worldId,
      type: this.type,
      description: this.description,
      conversation: this.conversation,
      scenarioSettings: this.scenarioSettings,
    };
  }
}
