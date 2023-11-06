import { Id } from '../_generated/dataModel';
import { ObjectType, v } from 'convex/values';

export const serializedWorldStatus = {
  id: v.optional(v.id('worldStatus')),
  worldId: v.id('worlds'),
  isDefault: v.boolean(),
  engineId: v.id('engines'),
  lastViewed: v.number(),
  status: v.union(v.literal('running'), v.literal('stoppedByDeveloper'), v.literal('inactive')),
  scenarioStarted: v.boolean(),
};
export type SerializedWorldStatus = ObjectType<typeof serializedWorldStatus>;

export class WorldStatus {
  id?: Id<'worldStatus'>;
  worldId: Id<'worlds'>;
  isDefault: boolean;
  engineId: Id<'engines'>;
  lastViewed: number;
  status: 'running' | 'stoppedByDeveloper' | 'inactive';
  scenarioStarted: boolean;

  constructor(serialized: SerializedWorldStatus) {
    this.id = serialized.id;
    this.worldId = serialized.worldId;
    this.isDefault = serialized.isDefault;
    this.engineId = serialized.engineId;
    this.lastViewed = serialized.lastViewed;
    this.status = serialized.status;
    this.scenarioStarted = serialized.scenarioStarted;
  }

  serialize(): SerializedWorldStatus {
    return {
      id: this.id,
      worldId: this.worldId,
      isDefault: this.isDefault,
      engineId: this.engineId,
      lastViewed: this.lastViewed,
      status: this.status,
      scenarioStarted: this.scenarioStarted,
    };
  }
}
