// Traditional (non-LLM) job system. Milestone 2.
//
// A job is a scripted routine: during shift hours the agent walks to its
// workplace and repeats a work task, producing output each time a task
// completes. None of this schedules an agent operation, so a working agent
// makes zero LLM calls. Outside shift hours the agent falls back to stock
// AI Town behavior (wandering, conversations).
//
// Structure:
//   - decideJobStep(): pure decision function, unit-tested in jobs.test.ts.
//   - tickJob(): engine-side wrapper that applies the decision to game state.
//
// Keep this file free of server-only imports (no _generated/server): the
// frontend bundles it via world.ts -> agent.ts.

import { Infer, ObjectType, v } from 'convex/values';
import { Point, point } from '../util/types';
import { distance } from '../util/geometry';
import { gameHour, inHourWindow } from './clock';
import { movePlayer } from './movement';
import type { Game } from './game';
import type { Player } from './player';

// ---------------------------------------------------------------------------
// Definitions
// ---------------------------------------------------------------------------

// Extend with v.union(v.literal('farmer'), v.literal('baker'), ...) as jobs are added.
export const jobKind = v.literal('farmer');
export type JobKind = Infer<typeof jobKind>;
export const JOB_KINDS: readonly JobKind[] = ['farmer'];

export function isJobKind(value: unknown): value is JobKind {
  return typeof value === 'string' && (JOB_KINDS as readonly string[]).includes(value);
}

export type JobDefinition = {
  title: string;
  /** Preferred workplace tile; resolved to the nearest walkable tile at runtime. */
  workplaceTarget: Point;
  /** Shift window in game hours, [start, end). May wrap past midnight. */
  shiftStartHour: number;
  shiftEndHour: number;
  /** One unit of work, shown in the UI as the player's activity. */
  task: { description: string; emoji: string; duration: number };
  /** What one completed task produces. Moves into inventory.ts next. */
  output: { item: string; amount: number };
};

export const JOB_DEFINITIONS: Record<JobKind, JobDefinition> = {
  farmer: {
    title: 'farmer',
    // Open field in the lower-right of the default "gentle" map (64x48).
    workplaceTarget: { x: 56, y: 40 },
    shiftStartHour: 6,
    shiftEndHour: 16,
    task: { description: 'farming', emoji: '🌾', duration: 30_000 },
    output: { item: 'wheat', amount: 1 },
  },
};

/** How close (in tiles) counts as "at the workplace". Pathfinding can stop short if the tile is occupied. */
export const WORKPLACE_ARRIVAL_DISTANCE = 2;

// ---------------------------------------------------------------------------
// Serialized state (stored on the agent inside the world document)
// ---------------------------------------------------------------------------

export const serializedJob = {
  kind: jobKind,
  /** Resolved walkable workplace tile. Unset until first tick. */
  workplace: v.optional(point),
  /** Set while a work task is in progress; equals the task activity's `until`. */
  taskEndsAt: v.optional(v.number()),
  /** Total units produced. Placeholder until inventory.ts owns items. */
  produced: v.number(),
};
export type SerializedJob = ObjectType<typeof serializedJob>;

export function newJob(kind: JobKind): SerializedJob {
  return { kind, produced: 0 };
}

// ---------------------------------------------------------------------------
// Pure decision logic
// ---------------------------------------------------------------------------

export type JobSnapshot = {
  now: number;
  hour: number;
  position: Point;
  pathfindingDestination?: Point;
  activity?: { description: string; until: number };
};

export type JobStep =
  | { kind: 'offShift' }
  | { kind: 'walkToWork'; destination: Point }
  | { kind: 'walking' }
  | { kind: 'startTask'; until: number }
  | { kind: 'working' }
  | { kind: 'completeTask' }
  | { kind: 'abandonTask' };

export function decideJobStep(
  job: SerializedJob,
  def: JobDefinition,
  workplace: Point,
  s: JobSnapshot,
): JobStep {
  // 1. An in-progress task takes priority, even past the end of the shift.
  if (job.taskEndsAt !== undefined) {
    const taskActivityIntact =
      s.activity?.description === def.task.description && s.activity.until === job.taskEndsAt;
    if (!taskActivityIntact) {
      // Interrupted (e.g. a conversation cut the activity short). No credit.
      return { kind: 'abandonTask' };
    }
    return s.now >= job.taskEndsAt ? { kind: 'completeTask' } : { kind: 'working' };
  }

  // 2. Outside shift hours the job doesn't drive behavior.
  if (!inHourWindow(s.hour, def.shiftStartHour, def.shiftEndHour)) {
    return { kind: 'offShift' };
  }

  // 3. Get to work.
  if (distance(s.position, workplace) > WORKPLACE_ARRIVAL_DISTANCE) {
    const dest = s.pathfindingDestination;
    if (dest && dest.x === workplace.x && dest.y === workplace.y) {
      return { kind: 'walking' };
    }
    return { kind: 'walkToWork', destination: workplace };
  }

  // 4. At work and idle: start the next task.
  return { kind: 'startTask', until: s.now + def.task.duration };
}

/**
 * Nearest tile to `target` with no object tiles on any layer, searched in
 * expanding square rings. Returns undefined if the map has no open tile.
 */
export function findOpenTile(
  map: { width: number; height: number; objectTiles: number[][][] },
  target: Point,
): Point | undefined {
  const isOpen = (x: number, y: number) =>
    x >= 0 &&
    y >= 0 &&
    x < map.width &&
    y < map.height &&
    map.objectTiles.every((layer) => layer[x][y] === -1);
  const tx = Math.floor(target.x);
  const ty = Math.floor(target.y);
  const maxRadius = Math.max(map.width, map.height);
  for (let r = 0; r <= maxRadius; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) {
          continue; // ring only
        }
        if (isOpen(tx + dx, ty + dy)) {
          return { x: tx + dx, y: ty + dy };
        }
      }
    }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Engine integration
// ---------------------------------------------------------------------------

/**
 * Advance an agent's job by one engine tick. Returns true if the job is
 * driving the agent this tick (caller should not fall through to
 * agentDoSomething), false if the agent is off shift.
 *
 * Callers must only invoke this when the agent is not in a conversation.
 */
export function tickJob(game: Game, now: number, job: SerializedJob, player: Player): boolean {
  const def = JOB_DEFINITIONS[job.kind];
  if (!job.workplace) {
    job.workplace = findOpenTile(game.worldMap, def.workplaceTarget) ?? def.workplaceTarget;
  }
  const step = decideJobStep(job, def, job.workplace, {
    now,
    hour: gameHour(now),
    position: player.position,
    pathfindingDestination: player.pathfinding?.destination,
    activity: player.activity,
  });

  switch (step.kind) {
    case 'offShift':
      return false;
    case 'walking':
    case 'working':
      return true;
    case 'walkToWork':
      // Drop any leftover stock activity (reading, daydreaming) before commuting.
      if (player.activity && player.activity.until > now) {
        player.activity.until = now;
      }
      movePlayer(game, now, player, step.destination);
      return true;
    case 'startTask':
      player.activity = {
        description: def.task.description,
        emoji: def.task.emoji,
        until: step.until,
      };
      job.taskEndsAt = step.until;
      return true;
    case 'completeTask':
      delete job.taskEndsAt;
      job.produced += def.output.amount;
      console.log(
        `[job] ${player.id} (${def.title}) produced ${def.output.amount} ${def.output.item} (total ${job.produced})`,
      );
      return true;
    case 'abandonTask':
      delete job.taskEndsAt;
      console.log(`[job] ${player.id} (${def.title}) task interrupted`);
      return true;
  }
}
