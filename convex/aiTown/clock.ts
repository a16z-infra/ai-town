// World clock shared by traditional (non-LLM) subsystems: jobs, needs, schedules.
//
// Game time is derived from wall-clock time so it survives engine restarts and
// is identical for every agent in a step. Keep this file free of server-only
// imports: the frontend bundles anything reachable from convex/aiTown/world.ts.

import { GAME_DAY_LENGTH } from '../constants';

/** Hour of the in-game day in [0, 24), fractional. */
export function gameHour(now: number, dayLength: number = GAME_DAY_LENGTH): number {
  const fraction = (now % dayLength) / dayLength;
  return fraction * 24;
}

/**
 * True if `hour` falls inside [start, end). Handles windows that wrap past
 * midnight (e.g. start 22, end 6). start === end means "all day".
 */
export function inHourWindow(hour: number, start: number, end: number): boolean {
  if (start === end) {
    return true;
  }
  if (start < end) {
    return hour >= start && hour < end;
  }
  return hour >= start || hour < end;
}
