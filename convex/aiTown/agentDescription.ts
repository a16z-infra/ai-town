import { ObjectType, v } from 'convex/values';
import { GameId, agentId, parseGameId } from './ids';

export class AgentDescription {
  agentId: GameId<'agents'>;
  identity: string;
  plan: string;
  archetype: string;
  stats: { sociability: number; diligence: number; cunning: number; justice: number; creativity: number; resilience: number };
  mbti?: string;
  personality?: {
    background: string;
    mbtiScores: { [key: string]: number };
    emotion: string;
  };
  homePoiId?: string;

  constructor(serialized: SerializedAgentDescription) {
    const { agentId, identity, plan } = serialized;
    this.agentId = parseGameId('agents', agentId);
    this.identity = identity;
    this.plan = plan;
    this.archetype = serialized.archetype ?? 'normal';
    this.stats = serialized.stats ?? { sociability: 5, diligence: 5, cunning: 5, justice: 5, creativity: 5, resilience: 5 };
    this.mbti = serialized.mbti;
    this.personality = serialized.personality;
    this.homePoiId = serialized.homePoiId;
  }

  serialize(): SerializedAgentDescription {
    const { agentId, identity, plan, archetype, stats, mbti, personality, homePoiId } = this;
    return { agentId, identity, plan, archetype, stats, mbti, personality, homePoiId };
  }
}

const mbtiScoresValidator = v.object({
  E: v.optional(v.number()),
  I: v.optional(v.number()),
  S: v.optional(v.number()),
  N: v.optional(v.number()),
  T: v.optional(v.number()),
  F: v.optional(v.number()),
  J: v.optional(v.number()),
  P: v.optional(v.number()),
});

export const serializedAgentDescription = {
  agentId,
  identity: v.string(),
  plan: v.string(),
  archetype: v.optional(v.string()),
  stats: v.optional(
    v.object({
      sociability: v.number(),
      diligence: v.number(),
      cunning: v.number(),
      justice: v.number(),
      creativity: v.number(),
      resilience: v.number(),
    }),
  ),
  mbti: v.optional(v.string()),
  personality: v.optional(v.object({
    background: v.string(),
    mbtiScores: mbtiScoresValidator,
    emotion: v.string(),
  })),
  homePoiId: v.optional(v.string()),
};
export type SerializedAgentDescription = ObjectType<typeof serializedAgentDescription>;
