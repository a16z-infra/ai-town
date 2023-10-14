import { v } from 'convex/values';
import { ActionCtx, internalAction, internalMutation, query } from '../_generated/server';
import { api, internal } from '../_generated/api';
import { AgentDecision, agentDecision } from './agentDecision';
import { runDecision } from './runDecision';
import { Id } from '../_generated/dataModel';
import { sleep } from '../util/sleep';

const QUERY_INTERVAL = 1000;

type BatchedDecision = {
  agentId: Id<'agents'>;
  playerId: Id<'players'>;
  decision: AgentDecision;
}[];

export class BatchedAgentState {
  currentDecisions?: BatchedDecision;

  // Counter that increments every time we (1) start a new query and (2)
  // receive a result. So, the counter is odd whenever a query is inflight.
  // This scheme allows an observer to implement a barrier, where it can
  // wait until the next query that's guaranteed to have its side-effects.
  counter: number = 0;
  counterListeners: Array<{ lowerBound: number; waiter: () => void }> = [];
  waitingOnValue: Array<() => void> = [];

  constructor(
    public worldId: Id<'worlds'>,
    public deadline: number,
  ) {}

  async updateDecisions(ctx: ActionCtx, generationNumber: number) {
    let lastUpdate;
    while (Date.now() < this.deadline) {
      this.incrementCounter();
      const decisions = await ctx.runQuery(api.agent.batching.batchedAgentDecide, {
        worldId: this.worldId,
        generationNumber,
      });
      this.incrementCounter();
      this.currentDecisions = decisions;
      for (const listener of this.waitingOnValue) {
        listener();
      }
      this.waitingOnValue = [];
      const updateReceived = Date.now();
      if (lastUpdate) {
        await sleep(lastUpdate + QUERY_INTERVAL - updateReceived);
      }
      lastUpdate = updateReceived;
    }
  }

  private incrementCounter() {
    this.counter++;
    let anyFired = false;
    for (const listener of this.counterListeners) {
      if (listener.lowerBound <= this.counter) {
        anyFired = true;
        listener.waiter();
      }
    }
    if (anyFired) {
      this.counterListeners = this.counterListeners.filter((l) => this.counter < l.lowerBound);
    }
  }

  async waitOnInitialLoad(): Promise<BatchedDecision> {
    if (this.currentDecisions) {
      return this.currentDecisions;
    }
    return new Promise((resolve) => {
      this.waitingOnValue.push(() => resolve(this.currentDecisions!));
    });
  }

  async barrier(): Promise<void> {
    // If a request is inflight, wait for the one after it. Otherwise, wait
    // for the next completed request.
    const lowerBound = this.counter % 2 === 1 ? this.counter + 3 : this.counter + 2;
    await new Promise<void>((resolve) => {
      this.counterListeners.push({ lowerBound, waiter: resolve });
    });
  }
}

export async function runBatchedAgentLoop(
  ctx: ActionCtx,
  schedulerId: Id<'agentSchedulers'>,
  expectedGenerationNumber: number,
  maxDuration: number,
) {
  const deadline = Date.now() + maxDuration;
  const generationCheck = await ctx.runMutation(internal.agent.batching.checkGenerationNumber, {
    schedulerId,
    generationNumber: expectedGenerationNumber,
  });
  if (!generationCheck) {
    return null;
  }
  const { worldId, generationNumber } = generationCheck;
  const state = new BatchedAgentState(worldId, deadline);
  const updater = state.updateDecisions(ctx, generationNumber);
  const decisions = await state.waitOnInitialLoad();
  const agentRuns = [];
  for (const { agentId, playerId } of decisions) {
    agentRuns.push(runBatchedAgent(ctx, state, generationNumber, agentId, playerId));
  }
  await Promise.all([updater, ...agentRuns]);
  return generationNumber;
}

export const checkGenerationNumber = internalMutation({
  args: {
    schedulerId: v.id('agentSchedulers'),
    generationNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const scheduler = await ctx.db.get(args.schedulerId);
    if (!scheduler) {
      throw new Error(`Invalid scheduler ID: ${args.schedulerId}`);
    }
    if (scheduler.generationNumber !== args.generationNumber) {
      console.debug(
        `Scheduler generation number mismatch: ${scheduler.generationNumber} != ${args.generationNumber}`,
      );
      return null;
    }
    if (!scheduler.running) {
      console.debug(`Scheduler ${args.schedulerId} not running`);
      return null;
    }
    const generationNumber = scheduler.generationNumber + 1;
    await ctx.db.patch(args.schedulerId, { generationNumber });
    return { worldId: scheduler.worldId, generationNumber };
  },
});

export const batchedAgentDecide = query({
  args: {
    worldId: v.id('worlds'),
    generationNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const scheduler = await ctx.db
      .query('agentSchedulers')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .first();
    if (!scheduler) {
      throw new Error(`Scheduler not found for world ${args.worldId}`);
    }
    if (!scheduler.running) {
      throw new Error(`Scheduler ${scheduler._id} not running`);
    }
    if (scheduler.generationNumber !== args.generationNumber) {
      throw new Error(
        `Scheduler generation number mismatch: ${scheduler.generationNumber} != ${args.generationNumber}`,
      );
    }
    const out = [];
    const agents = await ctx.db
      .query('agents')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .collect();
    for (const agent of agents) {
      const decision = await agentDecision(ctx.db, Date.now(), agent);
      out.push({ agentId: agent._id, decision, playerId: agent.playerId });
    }
    return out;
  },
});

async function withTimeout<T>(
  promise: Promise<T>,
  deadline: number,
): Promise<{ kind: 'ok'; value: T } | { kind: 'timeout' }> {
  let timeout: NodeJS.Timeout | undefined;
  const timerPromise = new Promise<void>((resolve) => {
    const toSleep = deadline - Date.now();
    timeout = setTimeout(resolve, toSleep);
  });
  try {
    return await Promise.race([
      promise.then((value) => ({ kind: 'ok' as const, value })),
      timerPromise.then(() => ({ kind: 'timeout' as const })),
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

export async function runBatchedAgent(
  ctx: ActionCtx,
  state: BatchedAgentState,
  generationNumber: number,
  agentId: Id<'agents'>,
  playerId: Id<'players'>,
) {
  let currentDecision: AgentDecision | undefined;
  while (Date.now() < state.deadline) {
    // Run the current decision if it's loaded already.
    if (currentDecision) {
      try {
        await runDecision(ctx, agentId, generationNumber, playerId, currentDecision);
      } catch (e: any) {
        console.error(`[${agentId}] Error running decision: ${e.message}`);
      }

      // Wait for a barrier to guarantee the side-effects of our decision run
      // are visible in the next decision.
      const start = Date.now();
      const waitResult = await withTimeout(state.barrier(), state.deadline);
      if (waitResult.kind === 'timeout') {
        return;
      }
    }

    const nextDecision = state.currentDecisions?.find((d) => d.agentId === agentId)?.decision;
    if (!nextDecision) {
      console.error(`Agent ${agentId} not found`);
      return;
    }
    currentDecision = nextDecision;
  }
}
