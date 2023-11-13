import { Id } from '../_generated/dataModel';
import { Game } from './game';
import { ObjectType, v } from 'convex/values';
import { Player } from './player';
import { Conversation, serializedConversation } from './conversation';

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
  settings: v.union(v.object(serializedAuctionSettings), v.object(serializedDebateSettings)),
};
export type SerializedScenario = ObjectType<typeof serializedScenario>;

export class Scenario {
  id?: Id<'scenarios'>;
  worldId: Id<'worlds'>;
  type: 'debate' | 'auction';
  description: string;
  conversation?: Conversation;
  settings: SerializedAuctionSettings | SerializedDebateSettings;

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
