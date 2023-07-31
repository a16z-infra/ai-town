import { Motion, Pose, Position } from '../types';

export function getRandomPosition(): Position {
  return { x: Math.floor(Math.random() * 100), y: Math.floor(Math.random() * 100) };
}

export function manhattanDistance(p1: Position, p2: Position) {
  return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

export function calculateFraction(start: number, end: number, ts: number): number {
  const progress = (ts - start) / (end - start);
  return Math.max(Math.min(1, progress), 0);
}

export function interpolatePosition(start: Position, end: Position, fraction: number): Position {
  return {
    x: start.x + (end.x - start.x) * fraction,
    y: start.y + (end.y - start.y) * fraction,
  };
}

export function calculateOrientation(start: Position, end: Position): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  // const orientation = (Math.atan2(dy, dx) / Math.PI) * 180;
  // return orientation < 0 ? orientation + 360 : orientation;
  return dx ? (dx > 0 ? 0 : 180) : dy > 0 ? 90 : 270;
}

export function getPoseFromMotion(motion: Motion, ts: number): Pose {
  if (motion.type === 'stopped') {
    return motion.pose;
  }
  const fraction = calculateFraction(motion.startTs, motion.targetEndTs, ts);
  return getPoseFromRoute(motion.route, fraction);
}

export function getPoseFromRoute(route: Position[], fraction: number): Pose {
  const totalLength = route.reduce((sum, pos, idx) => {
    if (idx === 0) return sum;
    return sum + manhattanDistance(pos, route[idx - 1]);
  }, 0);
  const progressDistance = fraction * totalLength;
  let soFar = 0;
  let start = route[0]!;
  let end = route[1]!;
  for (const [idx, pos] of route.slice(1).entries()) {
    soFar += manhattanDistance(route[idx], pos);
    if (soFar >= progressDistance) {
      start = route[idx];
      end = pos;
      break;
    }
  }
  return {
    position: interpolatePosition(start, end, fraction),
    orientation: calculateOrientation(start, end),
  };
}

export function roundPosition(pos: Position): Position {
  return { x: Math.round(pos.x), y: Math.round(pos.y) };
}

export function roundPose(pose: Pose): Pose {
  return {
    position: roundPosition(pose.position),
    orientation: 90 * Math.round(pose.orientation / 90),
  };
}

export function findRoute(startMotion: Motion, end: Position) {
  let distance = 0;

  const startPose = getPoseFromMotion(startMotion, Date.now());
  // TODO: If they were partially along some path, include that in the new
  // route, adjusting the start time so we stay in the same place.
  let current = roundPosition(startPose.position);
  const route: Position[] = [current];
  // Try to maintain their direction.
  let horizontal = !(startPose.orientation === 90 || startPose.orientation === 270);
  // TODO: handle walls
  while (current.x !== end.x || current.y !== end.y) {
    const next = { ...current };
    if (current.x !== end.x && horizontal) {
      // bias towards maintainng character direction
      next.x = end.x;
      distance += Math.abs(current.x - end.x);
    } else if (current.y !== end.y) {
      next.y = end.y;
      distance += Math.abs(current.y - end.y);
    } else {
      next.x = end.x;
      distance += Math.abs(current.x - end.x);
    }
    route.push(next);
    current = next;
    horizontal = !horizontal;
  }
  return { route, distance };
}
