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
import { Agent, Message, Snapshot, Status, agentLoop } from './agent.js';
import { asyncMap, pruneNull } from './lib/utils.js';
import {
  Pose,
  calculateFraction,
  getPoseFromRoute,
  getRandomPosition,
  manhattanDistance,
} from './lib/physics.js';

export const NEARBY_DISTANCE = 5;

export const tick = internalMutation({
  args: { ts: v.number() },
  handler: async (ctx, { ts }) => {
    // TODO: segment agents by world
    const agentDocs = await ctx.db.query('agents').collect();
    // Make snapshot of world
    const agentSnapshots = await asyncMap(agentDocs, async (agentDoc) =>
      agentSnapshot(ctx.db, agentDoc, ts),
    );

    // ensure one action running per agent
    // coordinate shared interactions (shared focus)

    const snapshots = await asyncMap(agentSnapshots, async (agentSnapshot) => {
      const snapshot = await makeSnapshot(ctx.db, agentSnapshot, agentSnapshots, ts);
      await ctx.scheduler.runAfter(0, internal.engine.runAgent, snapshot);
    });
    // For each agent (oldest to newest? Or all on the same step?):
    // For agents worth waking up: schedule action
    // handle timeouts
    // Later: handle object ownership?
  },
});

//What triggers another loop:
// 1. New observation
// 2.
export const runAgent = internalAction({
  args: Snapshot,
  handler: async (ctx, snapshot) => {
    const tsOffset = snapshot.ts - Date.now();
    const memory = memoryDB(ctx);
    const action = await agentLoop(snapshot, memory);
    //  fetch params: nearby agent states, memories, messages
    // ^ can happen in mutation
    //  might include new observations -> add to memory with openai embeddings
    //   Future: ask who should talk next if it's 3+ people
    //  run agent loop
    //  if starts a conversation, ... see it through? just send one?
    //   If dialog, focus attention of other agent(s)
    //     Creates a conversation stream
    //  If move, update path plan
    //    Scan for upcoming collisions (including objects for new observations)
    //  Update agent cursor seen and nextActionTs
    // Handle new observations
    //   Calculate scores
    //   If there's enough observation score, trigger reflection?

    return 'hello';
  },
});

async function makeSnapshot(
  db: DatabaseReader,
  agent: Agent,
  otherAgents: Agent[],
  ts: GameTs,
): Promise<Snapshot> {
  const lastPlan = await latestEntryOfType(db, agent.id, 'planning', ts);
  const lastPlanTs = lastPlan?.ts ?? ts;
  const nearbyAgents = await getNearbyAgents(db, agent, otherAgents, ts, lastPlanTs);
  return { agent, nearbyAgents, ts, lastPlanTs };
}

async function agentSnapshot(
  db: DatabaseReader,
  agentDoc: Doc<'agents'>,
  ts: GameTs,
): Promise<Agent> {
  const lastTalk = await latestEntryOfType(db, agentDoc._id, 'talking', ts);
  const lastStop = await latestEntryOfType(db, agentDoc._id, 'stopped', ts);
  const lastWalk = await latestEntryOfType(db, agentDoc._id, 'walking', ts);
  const lastPlan = await latestEntryOfType(db, agentDoc._id, 'planning', ts);
  const lastContinue = await latestEntryOfType(db, agentDoc._id, 'continuing', ts);
  const stack = pruneNull([lastTalk, lastStop, lastWalk, lastPlan, lastContinue]).sort(
    (a, b) => a.ts - b.ts,
  );
  // Special base case for before agent has other entries.
  let status: Status = { type: 'stopped', sinceTs: ts, reason: 'finished' };
  const pose: Pose = calculatePose(lastStop, lastWalk, ts);
  if (stack.length > 0) {
    let latest = stack.pop()!;
    while (latest.data.type === 'continuing') {
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
        status = {
          type: 'talking',
          otherAgentIds: lastMessage.data.audience,
          messages: messages.map((m) => ({
            from: m.actorId,
            to: m.data.audience,
            content: m.data.content,
          })),
        };
        break;
      case 'walking':
        status = {
          type: 'walking',
          sinceTs: latest.ts,
          route: latestData.route,
          targetEndTs: latestData.targetEndTs,
        };
        break;
      case 'stopped':
        status = {
          type: 'stopped',
          reason: latestData.reason,
          sinceTs: latest.ts,
        };
        break;
      case 'planning':
        status = {
          type: 'thinking',
          sinceTs: latest.ts,
        };
        break;
    }
  }

  const identityEntry = (await latestMemoryOfType(db, agentDoc._id, 'identity', ts))!;
  const planEntry = (await latestMemoryOfType(db, agentDoc._id, 'plan', ts))!;

  return {
    id: agentDoc._id,
    name: agentDoc.name,
    identity: identityEntry.description,
    pose,
    status,
    plan: planEntry.description,
  };
}

async function getNearbyAgents(
  db: DatabaseReader,
  target: Agent,
  others: Agent[],
  ts: GameTs,
  lastPlanTs: GameTs,
): Promise<Snapshot['nearbyAgents']> {
  const nearbyAgents = others.filter((a) => {
    const distance = manhattanDistance(target.pose.position, a.pose.position);
    return distance < NEARBY_DISTANCE;
  });
  const oldTarget = await findHistoricalPose(db, target.id, lastPlanTs);
  return asyncMap(nearbyAgents, async (agent) => {
    const old = await findHistoricalPose(db, agent.id, lastPlanTs);
    const oldDistance = manhattanDistance(oldTarget.position, old.position);
    return {
      agent,
      new: oldDistance > NEARBY_DISTANCE,
    };
  });
}

async function findHistoricalPose(
  db: DatabaseReader,
  agentId: Id<'agents'>,
  ts: GameTs,
): Promise<Pose> {
  const lastStop = await latestEntryOfType(db, agentId, 'stopped', ts);
  const lastWalk = await latestEntryOfType(db, agentId, 'walking', ts);
  return calculatePose(lastStop, lastWalk, ts);
}

async function fetchMessages(db: DatabaseReader, conversationId: Id<'journal'>) {
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
      // TODO: better Base case for location
      return { position: getRandomPosition(), orientation: 0 };
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
  // if (entry.data.type !== type) throw new Error("Entry type mismatch");
  // return {...entry, data: entry.data as Extract<Entry['data'], {type: T}>}
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
