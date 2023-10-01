import { Infer, Validator } from 'convex/values';
import { Id } from '../_generated/dataModel';
import { MutationCtx } from '../_generated/server';
import { ENGINE_WAKEUP_THRESHOLD } from './constants';

export type InputHandler<Args extends any, ReturnValue extends any> = {
  args: Validator<Args, false, any>;
  returnValue: Validator<ReturnValue, false, any>;
};

export type InputHandlers = Record<string, InputHandler<any, any>>;
export abstract class Game<Handlers extends InputHandlers> {
  abstract engineId: Id<'engines'>;

  abstract tickDuration: number;
  abstract stepDuration: number;
  abstract maxTicksPerStep: number;
  abstract maxInputsPerStep: number;

  abstract handleInput(
    now: number,
    name: keyof Handlers,
    args: Infer<Handlers[typeof name]['args']>,
  ): Promise<Infer<Handlers[typeof name]['returnValue']>>;

  abstract tick(now: number): void;
  abstract save(): Promise<void>;
  idleUntil(now: number): null | number {
    return null;
  }

  async runStep(ctx: MutationCtx, generationNumber: number) {
    const now = Date.now();
    const engine = await ctx.db.get(this.engineId);
    if (!engine) {
      throw new Error(`Invalid engine ID: ${this.engineId}`);
    }
    if (!engine.active) {
      throw new Error(`engine ${this.engineId} is not active, returning immediately.`);
    }
    if (engine.generationNumber !== generationNumber) {
      throw new Error(
        `Generation mismatch (${generationNumber} vs. ${engine.generationNumber}), returning`,
      );
    }
    if (engine.currentTime && now < engine.currentTime) {
      throw new Error(`Server time moving backwards: ${now} < ${engine.currentTime}`);
    }

    // Collect the inputs for our step, sorting them by receipt time.
    const inputs = await ctx.db
      .query('inputs')
      .withIndex('byInputNumber', (q) =>
        q.eq('engineId', this.engineId).gt('number', engine.processedInputNumber ?? -1),
      )
      .take(this.maxInputsPerStep);

    const lastStepTs = engine.currentTime;
    const startTs = lastStepTs ? lastStepTs + this.tickDuration : now;
    let currentTs = startTs;
    let inputIndex = 0;
    let numTicks = 0;
    let processedInputNumber = engine.processedInputNumber;
    while (true) {
      if (numTicks > this.maxTicksPerStep) {
        break;
      }
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
        try {
          const value = await this.handleInput(currentTs, input.name, input.args);
          input.returnValue = { kind: 'ok', value };
        } catch (e: any) {
          console.error(`Input ${input._id} failed: ${e.message}`);
          input.returnValue = { kind: 'error', message: e.message };
        }
        await ctx.db.replace(input._id, input);
      }

      // Simulate the game forward one tick.
      this.tick(currentTs);

      // Decide how to advance time.
      let candidateTs = currentTs + this.tickDuration;
      let idleUntil = this.idleUntil(currentTs);
      if (idleUntil) {
        if (inputIndex < inputs.length) {
          idleUntil = Math.min(idleUntil, inputs[inputIndex].received);
        }
        // Clamp the idle time to between the next tick and now.
        idleUntil = Math.max(candidateTs, Math.min(idleUntil, now));
        console.log(`Engine idle, advancing time to ${idleUntil}`);
        candidateTs = idleUntil;
      }
      if (now < candidateTs) {
        break;
      }
      currentTs = candidateTs;
    }

    let idleUntil = this.idleUntil(currentTs);

    // Force an immediate wakeup if we have more inputs to process or more time to simulate.
    if (inputs.length === this.maxInputsPerStep) {
      console.warn(`Received max inputs (${this.maxInputsPerStep}) for step`);
      idleUntil = null;
    }
    if (numTicks === this.maxTicksPerStep) {
      console.warn(`Only simulating ${currentTs - startTs}ms due to max ticks per step limit.`);
      idleUntil = null;
    }
    idleUntil = idleUntil ?? now + this.stepDuration;

    // Commit the step by moving time forward, consuming our inputs, and saving the game's state.
    await ctx.db.patch(engine._id, {
      currentTime: currentTs,
      lastStepTs,
      processedInputNumber,
      idleUntil,
    });
    await this.save();

    // Let the caller reschedule us since we don't have a reference to ourself in `api`.
    return {
      generationNumber,
      idleUntil,
    };
  }
}

export async function insertInput(
  ctx: MutationCtx,
  engineId: Id<'engines'>,
  name: string,
  args: any,
): Promise<{ inputId: Id<'inputs'>; preemption?: { now: number; generationNumber: number } }> {
  const now = Date.now();
  const engine = await ctx.db.get(engineId);
  if (!engine) {
    throw new Error(`Invalid engine ID: ${engineId}`);
  }
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
  let preemption;
  if (engine.active && engine.idleUntil && now + ENGINE_WAKEUP_THRESHOLD < engine.idleUntil) {
    // TODO: We have to return the preemption to the layer above since we don't have
    // a path to schedule ourselves.
    console.log(`Preempting engine ${engineId}`);
    const generationNumber = engine.generationNumber + 1;
    await ctx.db.patch(engineId, { idleUntil: now, generationNumber });
    preemption = { now, generationNumber };
  }
  return { inputId, preemption };
}

export async function createEngine(ctx: MutationCtx) {
  const now = Date.now();
  const engineId = await ctx.db.insert('engines', {
    active: true,
    currentTime: now,
    generationNumber: 0,
    idleUntil: now,
  });
  return engineId;
}
