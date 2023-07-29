import { v } from 'convex/values';
import { api, internal } from './_generated/api.js';
import { Doc, Id } from './_generated/dataModel';
import {
  DatabaseReader,
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server';
import {
  Entry,
  Agents,
  Memories,
  Memory,
  GameTs,
  EntryType,
  EntryOfType,
  MemoryOfType,
  MemoryType,
} from './schema.js';
import { MemoryDB, memoryDB } from './lib/memory.js';
import { Action, Agent, Message, Snapshot, Status, agentLoop } from './agent.js';
import { asyncMap, pruneNull } from './lib/utils.js';
import {
  Pose,
  calculateFraction,
  findRoute,
  getPoseFromRoute,
  getRandomPosition,
  manhattanDistance,
} from './lib/physics.js';

export const NEARBY_DISTANCE = 5;
export const TIME_PER_STEP = 1000;
export const DEFAULT_AGENT_IDLE = 30_000;
// If you don't set a start position, you'll start at 0,0.
export const DEFAULT_START_POS = { x: 0, y: 0 };

export const tick = internalMutation({
  args: { oneShot: v.optional(v.id('agents')) },
  handler: async (ctx, { oneShot }) => {
    const ts = Date.now();
    // TODO: segment agents by world
    const agentDocs = await ctx.db.query('agents').collect();
    // Make snapshot of world
    const agentSnapshots = await asyncMap(agentDocs, async (agentDoc) =>
      agentSnapshot(ctx.db, agentDoc, ts),
    );

    // TODO: ensure one action running per agent
    // TODO: coordinate shared interactions (shared focus)
    // TODO: Determine if any agents are not worth waking up

    const snapshots = await asyncMap(agentSnapshots, async (agentSnapshot) =>
      makeSnapshot(ctx.db, agentSnapshot, agentSnapshots, ts),
    );
    // For each agent (oldest to newest? Or all on the same step?):
    for (const snapshot of snapshots) {
      // For agents worth waking up: schedule action
      if (oneShot && snapshot.agent.id !== oneShot) continue;
      await ctx.db.insert('journal', {
        ts,
        actorId: snapshot.agent.id,
        data: {
          type: 'planning',
          snapshot,
        },
      });
      await ctx.scheduler.runAfter(0, internal.agent.runAgent, { snapshot });
      // TODO: handle timeouts
      // Later: handle object ownership?
    }
    if (oneShot) return;
    // TODO: recursively schedule mutation
  },
});

export const getAgentSnapshot = query({
  args: { agentId: v.id('agents'), tsOffset: v.optional(v.number()) },
  handler: async (ctx, args) => {
    // TODO: how to fetch the latest always, not cache Date.now()?
    // For now, use a big tsOffset.
    const ts = Date.now() + (args.tsOffset ?? Infinity);
    const agentDoc = (await ctx.db.get(args.agentId))!;
    const agent = await agentSnapshot(ctx.db, agentDoc, ts);
    // Could potentially do a smarter filter in the future to only get
    // agents that are nearby, but for now, just get all of them.
    const allAgents = await asyncMap(await ctx.db.query('agents').collect(), (agentDoc) =>
      agentSnapshot(ctx.db, agentDoc, ts),
    );
    const snapshot = await makeSnapshot(ctx.db, agent, allAgents, ts);
    // We fetch at ts===Infinity to get the latest
    return { ...snapshot, ts: ts === Infinity ? Date.now() : ts };
  },
});

export const handleAgentAction = internalMutation({
  args: { agentId: v.id('agents'), action: Action, observedSnapshot: Snapshot },
  handler: async (ctx, { agentId, action, observedSnapshot }) => {
    const ts = Date.now();
    let nextActionTs = ts + DEFAULT_AGENT_IDLE;
    const agentDoc = (await ctx.db.get(agentId))!;
    const agent = await agentSnapshot(ctx.db, agentDoc, ts);
    // TODO: Check if the agent shoudl still respond.
    switch (action.type) {
      case 'startConversation':
        // TODO: determine if other users are still available.
        const conversationId = await ctx.db.insert('conversations', {});
        await ctx.db.insert('journal', {
          ts,
          actorId: agentId,
          data: {
            type: 'talking',
            audience: action.audience,
            content: action.content,
            conversationId,
          },
        });
        // TODO: schedule other users to be woken up if they aren't already.
        break;
      case 'saySomething':
        // TODO: Check if these users are still nearby?
        await ctx.db.insert('journal', {
          ts,
          actorId: agentId,
          data: {
            type: 'talking',
            audience: action.audience,
            content: action.content,
            conversationId: action.conversationId,
          },
        });
        // TODO: schedule other users to be woken up if they aren't already.
        break;
      case 'travel':
        // TODO: calculate obstacles to wake up?
        const { route, distance } = await findRoute(agent.pose, action.position);
        // TODO: Scan for upcoming collisions (including objects for new observations)
        const targetEndTs = ts + distance * TIME_PER_STEP;
        nextActionTs = Math.min(nextActionTs, targetEndTs);
        await ctx.db.insert('journal', {
          ts,
          actorId: agentId,
          data: {
            type: 'walking',
            route,
            targetEndTs,
          },
        });
        break;
      case 'continue':
        await ctx.db.insert('journal', {
          ts,
          actorId: agentId,
          data: {
            type: 'continuing',
          },
        });
        break;

      //  Update agent cursor seen and nextActionTs
      // Handle new observations
      //   Calculate scores
      //   If there's enough observation score, trigger reflection?
    }
    await ctx.scheduler.runAt(nextActionTs, internal.engine.tick, {});
  },
});

async function makeSnapshot(
  db: DatabaseReader,
  agent: Agent,
  otherAgentsAndMe: Agent[],
  ts: GameTs,
): Promise<Snapshot> {
  const status = await getStatus(db, agent.id, ts);
  const lastPlan = await latestEntryOfType(db, agent.id, 'planning', ts);
  const lastPlanTs = lastPlan?.ts ?? 0;
  const otherAgents = otherAgentsAndMe.filter((d) => d.id !== agent.id);
  const nearbyAgents = getNearbyAgents(db, agent, otherAgents, lastPlanTs).map((agent) => ({
    agent,
    new: !lastPlan?.data.snapshot.nearbyAgents.find((a) => a.agent.id === agent.id),
  }));
  const planEntry = (await latestMemoryOfType(db, agent.id, 'plan', ts))!;
  return {
    agent,
    status,
    plan: planEntry.description,
    nearbyAgents,
    ts,
  };
}

async function agentSnapshot(
  db: DatabaseReader,
  agentDoc: Doc<'agents'>,
  ts: GameTs,
): Promise<Agent> {
  const lastStop = await latestEntryOfType(db, agentDoc._id, 'stopped', ts);
  const lastWalk = await latestEntryOfType(db, agentDoc._id, 'walking', ts);
  const pose: Pose = calculatePose(lastStop, lastWalk, ts);
  const identity = await fetchIdentity(db, agentDoc._id, ts);

  return { id: agentDoc._id, name: agentDoc.name, identity, pose };
}

function getNearbyAgents(db: DatabaseReader, target: Agent, others: Agent[], lastPlanTs: GameTs) {
  return others.filter((a) => {
    const distance = manhattanDistance(target.pose.position, a.pose.position);
    return distance < NEARBY_DISTANCE;
  });
}

async function getStatus(db: DatabaseReader, agentId: Id<'agents'>, ts: GameTs): Promise<Status> {
  const lastTalk = await latestEntryOfType(db, agentId, 'talking', ts);
  const lastStop = await latestEntryOfType(db, agentId, 'stopped', ts);
  const lastWalk = await latestEntryOfType(db, agentId, 'walking', ts);
  const lastPlan = await latestEntryOfType(db, agentId, 'planning', ts);
  const lastContinue = await latestEntryOfType(db, agentId, 'continuing', ts);
  const stack = pruneNull([lastTalk, lastStop, lastWalk, lastPlan, lastContinue]).sort(
    (a, b) => a.ts - b.ts,
  );
  // Special base case for before agent has other entries.
  if (stack.length > 0) {
    let latest = stack.pop()!;
    if (latest.data.type === 'continuing') {
      const next = stack.pop()!;
      if (next.data.type === 'planning') {
        // The planning decided to continue as previously planned.
        latest = stack.pop()!;
      } else {
        latest = next;
      }
    }
    const latestData = latest.data;
    switch (latestData.type) {
      case 'talking':
        const messages = await fetchMessages(db, latestData.conversationId);
        const lastMessage = messages.at(-1)!;
        return {
          type: 'talking',
          otherAgentIds: lastMessage.data.audience,
          conversationId: latestData.conversationId,
          messages: messages.map((m) => ({
            from: m.actorId,
            to: m.data.audience,
            content: m.data.content,
          })),
        };
      case 'walking':
        return {
          type: 'walking',
          sinceTs: latest.ts,
          route: latestData.route,
          targetEndTs: latestData.targetEndTs,
        };
      case 'stopped':
        return {
          type: 'stopped',
          reason: latestData.reason,
          sinceTs: latest.ts,
        };
      case 'planning':
        return {
          type: 'thinking',
          sinceTs: latest.ts,
        };
    }
  }
  return { type: 'stopped', sinceTs: ts, reason: 'finished' };
}

async function fetchPose(db: DatabaseReader, agentId: Id<'agents'>, ts: GameTs): Promise<Pose> {
  const lastStop = await latestEntryOfType(db, agentId, 'stopped', ts);
  const lastWalk = await latestEntryOfType(db, agentId, 'walking', ts);
  return calculatePose(lastStop, lastWalk, ts);
}

async function fetchIdentity(
  db: DatabaseReader,
  agentId: Id<'agents'>,
  ts: GameTs,
): Promise<string> {
  const identityEntry = (await latestMemoryOfType(db, agentId, 'identity', ts))!;
  return identityEntry.description;
}

async function fetchMessages(db: DatabaseReader, conversationId: Id<'conversations'>) {
  const messageEntries = await db
    .query('journal')
    .withIndex('by_conversation', (q) => q.eq('data.conversationId', conversationId as any))
    .collect();
  const messagesWithTalkingType = messageEntries.map((m) => {
    if (m.data.type !== 'talking') throw new Error('Messages should be talking');
    const data = m.data as Extract<Entry['data'], { type: 'talking' }>;
    return { ...m, data };
  });
  return messagesWithTalkingType;
}

function calculatePose(
  lastStop: EntryOfType<'stopped'> | null,
  lastWalk: EntryOfType<'walking'> | null,
  ts: GameTs,
): Pose {
  if (!lastWalk) {
    if (!lastStop) {
      return { position: DEFAULT_START_POS, orientation: 0 };
    }
    return lastStop.data.pose;
  }
  if (!lastStop || lastWalk.ts > lastStop.ts) {
    // Calculate based on walk
    const fraction = calculateFraction(lastWalk.ts, lastWalk.data.targetEndTs, ts);
    return getPoseFromRoute(lastWalk.data.route, fraction);
  }
  return lastStop.data.pose;
}

async function latestEntryOfType<T extends EntryType>(
  db: DatabaseReader,
  agentId: Id<'agents'>,
  type: T,
  ts: GameTs,
) {
  const entry = await db
    .query('journal')
    .withIndex('by_actorId_type_ts', (q) =>
      q.eq('actorId', agentId).eq('data.type', type).lte('ts', ts),
    )
    .order('desc')
    .first();
  if (!entry) return null;
  return entry as EntryOfType<T>;
}

async function latestMemoryOfType<T extends MemoryType>(
  db: DatabaseReader,
  agentId: Id<'agents'>,
  type: T,
  ts: GameTs,
) {
  const entry = await db
    .query('memories')
    .withIndex('by_agentId_type_ts', (q) =>
      q.eq('agentId', agentId).eq('data.type', type).lte('ts', ts),
    )
    .order('desc')
    .first();
  if (!entry) return null;
  return entry as MemoryOfType<T>;
}

// function getAgentStatus(entries: Entry[] /* latest first */): Status {}
