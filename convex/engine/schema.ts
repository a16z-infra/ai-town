import { defineTable } from 'convex/server';
import { Infer, v } from 'convex/values';

const inputFields = {
  // Inputs are scoped to a single engine.
  engineId: v.id('engines'),

  // Name of the input handler to run.
  name: v.string(),
  // Dynamically typed arguments and return value for the input handler. We'll
  // provide type safety at a higher layer.
  args: v.any(),
  returnValue: v.optional(
    v.union(
      v.object({
        kind: v.literal('ok'),
        value: v.any(),
      }),
      v.object({
        kind: v.literal('error'),
        message: v.string(),
      }),
    ),
  ),

  // Timestamp when the server received the input. This timestamp is best-effort,
  // since we don't guarantee strict monotonicity here. So, an input may not get
  // assigned to the engine step whose time interval contains this timestamp.
  received: v.number(),
};

const input = v.union(
  v.object({ ...inputFields, number: v.number() }),
  v.object({ ...inputFields, enqueueCommitTs: v.commitTs() }),
);

export const engine = v.object({
  // What is the current simulation time for the engine? Monotonically increasing.
  currentTime: v.optional(v.number()),
  // What was `currentTime` for the preceding step of the engine?
  lastStepTs: v.optional(v.number()),

  // High-water mark for legacy numbered inputs. Commit-ordered inputs use their result.
  processedInputNumber: v.optional(v.number()),

  running: v.boolean(),

  // Monotonically increasing counter that serializes all engine runs. If we ever
  // end up with two steps overlapping in time, this counter will force them to
  // conflict.
  generationNumber: v.number(),
});
export type Engine = Infer<typeof engine>;

export const engineTables = {
  inputs: defineTable(input)
    .index('byInputNumber', ['engineId', 'number'])
    .index('byPendingCommit', ['engineId', 'returnValue.kind', 'enqueueCommitTs']),
  engines: defineTable(engine),
};
