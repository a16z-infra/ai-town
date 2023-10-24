import { ConvexError, Infer, v } from 'convex/values';
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

  abstract handleInput(now: number, name: string, args: object): any;
  abstract tick(now: number): void;
  abstract save(ctx: ActionCtx, engineUpdate: EngineUpdate): Promise<void>;

  async runStep(ctx: ActionCtx, now: number) {
    const inputs = await ctx.runQuery(internal.engine2.abstractEngine.loadInputs, {
      engineId: this.engine._id,
      processedInputNumber: this.engine.processedInputNumber,
      max: this.maxInputsPerStep,
    });

    const lastStepTs = this.engine.currentTime;
    const startTs = lastStepTs ? lastStepTs + this.tickDuration : now;
    let currentTs = startTs;
    let inputIndex = 0;
    let numTicks = 0;
    let processedInputNumber = this.engine.processedInputNumber;
    const completedInputs = [];

    while (numTicks < this.maxInputsPerStep) {
      numTicks += 1;

      // Collect all of the inputs for this tick.
      const tickInputs = [];
      while (inputIndex < inputs.length) {
        const input = inputs[inputIndex];
        if (input.received > currentTs) {
          break;
        }
        inputIndex += 1;
        processedInputNumber = input.number;
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

    this.engine.currentTime = currentTs;
    this.engine.lastStepTs = lastStepTs;
    this.engine.generationNumber += 1;

    // Commit the step by moving time forward, consuming our inputs, and saving the game's state.
    await this.applyUpdate(ctx, completedInputs);

    console.debug(`Simulated from ${startTs} to ${currentTs} (${currentTs - startTs}ms)`);
  }

  async applyUpdate(ctx: ActionCtx, completedInputs: Infer<typeof completedInput>[]) {
    const { _id, _creationTime, ...engine } = this.engine;
    const engineUpdate = { engine, completedInputs };

    await this.save(ctx, engineUpdate);
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
  completedInputs: v.array(completedInput),
});
export type EngineUpdate = Infer<typeof engineUpdate>;

export async function loadEngine(db: DatabaseReader, engineId: Id<'engines'>) {
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
    .withIndex('byInputNumber', (q) => q.eq('engineId', engineId))
    .order('desc')
    .first();
  const number = prevInput ? prevInput.number + 1 : 0;
  const inputId = await ctx.db.insert('inputs', {
    engineId,
    number,
    name,
    args,
    received: now,
  });
  return inputId;
}

export const loadInputs = internalQuery({
  args: {
    engineId: v.id('engines'),
    processedInputNumber: v.optional(v.number()),
    max: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('inputs')
      .withIndex('byInputNumber', (q) =>
        q.eq('engineId', args.engineId).gt('number', args.processedInputNumber ?? -1),
      )
      .order('asc')
      .take(args.max);
  },
});

export async function applyEngineUpdate(
  ctx: MutationCtx,
  engineId: Id<'engines'>,
  update: EngineUpdate,
) {
  const engine = await loadEngine(ctx.db, engineId);
  if (engine.generationNumber !== update.engine.generationNumber) {
    throw new ConvexError({ kind: 'generationNumber', message: 'Generation number mismatch' });
  }
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
