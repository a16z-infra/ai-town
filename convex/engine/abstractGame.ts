import { ConvexError, Infer, Value, v } from 'convex/values';
import { Doc, Id } from '../_generated/dataModel';
import { ActionCtx, DatabaseReader, MutationCtx, internalQuery } from '../_generated/server';
import { engine } from '../engine/schema';
import { internal } from '../_generated/api';

export abstract class AbstractGame {
  abstract tickDuration: number;
  abstract stepDuration: number;
  abstract maxTicksPerStep: number;
  abstract maxInputsPerStep: number;

  constructor(public engine: Doc<'engines'>) {}

  abstract handleInput(now: number, name: string, args: object): Value;
  abstract tick(now: number): void;

  // Optional callback at the beginning of each step.
  beginStep(now: number) {}
  abstract saveStep(ctx: ActionCtx, engineUpdate: EngineUpdate): Promise<void>;

  async runStep(ctx: ActionCtx, now: number) {
    const inputs = await ctx.runQuery(internal.engine.abstractGame.loadPendingInputs, {
      engineId: this.engine._id,
      generationNumber: this.engine.generationNumber,
      max: this.maxInputsPerStep,
    });

    const lastStepTs = this.engine.currentTime;
    const startTs = lastStepTs ? lastStepTs + this.tickDuration : now;
    let currentTs = startTs;
    let inputIndex = 0;
    let numTicks = 0;
    let processedInputNumber = this.engine.processedInputNumber;
    const completedInputs = [];

    this.beginStep(currentTs);

    while (numTicks < this.maxTicksPerStep) {
      numTicks += 1;

      // Collect all of the inputs for this tick.
      const tickInputs = [];
      while (inputIndex < inputs.length) {
        const input = inputs[inputIndex];
        if (input.received > currentTs) {
          break;
        }
        inputIndex += 1;
        if ('number' in input) processedInputNumber = input.number;
        tickInputs.push(input);
      }

      // Feed the inputs to the game.
      for (const input of tickInputs) {
        let returnValue;
        try {
          const value = this.handleInput(currentTs, input.name, input.args);
          returnValue = { kind: 'ok' as const, value };
        } catch (e: any) {
          console.error(`Input ${input._id} failed: ${e.message}`);
          returnValue = { kind: 'error' as const, message: e.message };
        }
        completedInputs.push({ inputId: input._id, returnValue });
      }

      // Simulate the game forward one tick.
      this.tick(currentTs);

      const candidateTs = currentTs + this.tickDuration;
      if (now < candidateTs) {
        break;
      }
      currentTs = candidateTs;
    }

    // Commit the step by moving time forward, consuming our inputs, and saving the game's state.
    const expectedGenerationNumber = this.engine.generationNumber;
    this.engine.currentTime = currentTs;
    this.engine.lastStepTs = lastStepTs;
    this.engine.generationNumber += 1;
    this.engine.processedInputNumber = processedInputNumber;
    const { _id, _creationTime, ...engine } = this.engine;
    const engineUpdate = { engine, completedInputs, expectedGenerationNumber };
    await this.saveStep(ctx, engineUpdate);

    console.debug(`Simulated from ${startTs} to ${currentTs} (${currentTs - startTs}ms)`);
  }
}

const completedInput = v.object({
  inputId: v.id('inputs'),
  returnValue: v.union(
    v.object({
      kind: v.literal('ok'),
      value: v.any(),
    }),
    v.object({
      kind: v.literal('error'),
      message: v.string(),
    }),
  ),
});

export const engineUpdate = v.object({
  engine,
  expectedGenerationNumber: v.number(),
  completedInputs: v.array(completedInput),
});
export type EngineUpdate = Infer<typeof engineUpdate>;

export async function loadEngine(
  db: DatabaseReader,
  engineId: Id<'engines'>,
  generationNumber: number,
) {
  const engine = await db.get(engineId);
  if (!engine) {
    throw new Error(`No engine found with id ${engineId}`);
  }
  if (!engine.running) {
    throw new ConvexError({
      kind: 'engineNotRunning',
      message: `Engine ${engineId} is not running`,
    });
  }
  if (engine.generationNumber !== generationNumber) {
    throw new ConvexError({ kind: 'generationNumber', message: 'Generation number mismatch' });
  }
  return engine;
}

export async function engineInsertInput(
  ctx: MutationCtx,
  engineId: Id<'engines'>,
  name: string,
  args: any,
): Promise<Id<'inputs'>> {
  const now = Date.now();
  const prevInput = await ctx.db
    .query('inputs')
    .withIndex('byInputNumber', (q) => q.eq('engineId', engineId).gt('number', -1))
    .order('desc')
    .first();
  // Vacuum may have removed the numbered tail while the engine was idle.
  const previousNumber =
    prevInput && 'number' in prevInput
      ? prevInput.number
      : ((await ctx.db.get(engineId))?.processedInputNumber ?? -1);
  const number = previousNumber + 1;
  const inputId = await ctx.db.insert('inputs', {
    engineId,
    number,
    name,
    args,
    received: now,
  });
  return inputId;
}

const loadInputArgs = {
  engineId: v.id('engines'),
  processedInputNumber: v.optional(v.number()),
  max: v.number(),
};

function loadNumberedInputs(
  db: DatabaseReader,
  args: { engineId: Id<'engines'>; processedInputNumber?: number; max: number },
) {
  return db
    .query('inputs')
    .withIndex('byInputNumber', (q) =>
      q.eq('engineId', args.engineId).gt('number', args.processedInputNumber ?? -1),
    )
    .take(args.max);
}

// In-flight engine actions from before this deployment still use this endpoint.
export const loadInputs = internalQuery({
  args: loadInputArgs,
  handler: (ctx, args) => loadNumberedInputs(ctx.db, args),
});

export const loadPendingInputs = internalQuery({
  args: { engineId: v.id('engines'), generationNumber: v.number(), max: v.number() },
  handler: async (ctx, args) => {
    // A bounded index read can stay cached through a later append. Each engine
    // generation needs its own snapshot, even when the preceding page was empty.
    const engine = await loadEngine(ctx.db, args.engineId, args.generationNumber);
    const numbered = await loadNumberedInputs(ctx.db, {
      ...args,
      processedInputNumber: engine.processedInputNumber,
    });
    if (numbered.length === args.max) return numbered;

    // Acknowledgement moves a row out of the pending range in saveWorld.
    // An interrupted batch can resume even if all its inputs share a commit.
    const snapshot = ctx.meta.getSnapshotTs();
    const committed = await ctx.db
      .query('inputs')
      .withIndex('byPendingCommit', (q) =>
        q
          .eq('engineId', args.engineId)
          .eq('returnValue.kind', undefined)
          .gt('enqueueCommitTs', undefined)
          .lte('enqueueCommitTs', snapshot),
      )
      .take(args.max - numbered.length);
    return [...numbered, ...committed];
  },
});

export async function applyEngineUpdate(
  ctx: MutationCtx,
  engineId: Id<'engines'>,
  update: EngineUpdate,
) {
  const engine = await loadEngine(ctx.db, engineId, update.expectedGenerationNumber);
  if (
    engine.currentTime &&
    update.engine.currentTime &&
    update.engine.currentTime < engine.currentTime
  ) {
    throw new Error('Time moving backwards');
  }
  await ctx.db.replace(engine._id, update.engine);

  for (const completedInput of update.completedInputs) {
    const input = await ctx.db.get(completedInput.inputId);
    if (!input) {
      throw new Error(`Input ${completedInput.inputId} not found`);
    }
    if (input.returnValue) {
      throw new Error(`Input ${completedInput.inputId} already completed`);
    }
    input.returnValue = completedInput.returnValue;
    await ctx.db.replace(input._id, input);
  }
}
