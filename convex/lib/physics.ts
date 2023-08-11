import { NEARBY_DISTANCE } from '../config';
import { Motion, Pose, Position } from '../schema';

export function manhattanDistance(p1: Position, p2: Position) {
  return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

export function calculateFraction(start: number, end: number, ts: number): number {
  if (start === end) return 0;
  const progress = (ts - start) / (end - start);
  return Math.max(Math.min(1, progress), 0);
}

export function interpolatePosition(start: Position, end: Position, distance: number): Position {
  return {
    x: start.x + Math.sign(end.x - start.x) * distance,
    y: start.y + Math.sign(end.y - start.y) * distance,
  };
}

// See types.Pose for definition of orientation.
export function calculateOrientation(start: Position, end: Position): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  // const orientation = (Math.atan2(dy, dx) / Math.PI) * 180;
  // return orientation < 0 ? orientation + 360 : orientation;
  return dx ? (dx > 0 ? 0 : 180) : dy > 0 ? 270 : 90;
}

export function getPoseFromMotion(motion: Motion, ts: number): Pose {
  if (motion.type === 'stopped') {
    return motion.pose;
  }
  const fraction = calculateFraction(motion.startTs, motion.targetEndTs, ts);
  return getPoseFromRoute(motion.route, fraction);
}

export function getPoseFromRoute(route: Position[], fraction: number): Pose {
  if (route.length === 0) throw new Error('Empty route');
  if (route.length === 1) return { position: route[0], orientation: 0 };
  const totalLength = getRouteDistance(route);
  const progressDistance = fraction * totalLength;
  let soFar = 0;
  let start = route[0]!;
  let end = route[1]!;
  for (const [idx, pos] of route.slice(1).entries()) {
    const nextSegment = manhattanDistance(route[idx], pos);
    if (soFar + nextSegment >= progressDistance) {
      start = route[idx];
      end = pos;
      break;
    }
    soFar += nextSegment;
  }
  return {
    position: interpolatePosition(start, end, progressDistance - soFar),
    orientation: calculateOrientation(start, end),
  };
}

// Assumes the motion has started in the past or currently.
export function getRemainingPathFromMotion(motion: Motion, ts: number): Position[] {
  if (motion.type === 'stopped') {
    return [motion.pose.position];
  }
  const route = motion.route;
  if (route.length === 1) return route;
  const totalLength = getRouteDistance(route);
  const fraction = calculateFraction(motion.startTs, motion.targetEndTs, ts);
  const progressDistance = fraction * totalLength;
  let soFar = 0;
  let start = route.length - 1;
  let end = route.length - 1;
  for (const [idx, pos] of route.slice(1).entries()) {
    const nextSegment = manhattanDistance(route[idx], pos);
    if (soFar + nextSegment >= progressDistance) {
      start = idx;
      end = idx + 1;
      break;
    }
    soFar += nextSegment;
  }
  return [
    interpolatePosition(route[start], route[end], progressDistance - soFar),
    ...route.slice(start + 1),
  ];
}

export function getRouteDistance(route: Position[]): number {
  if (route.length === 1) return 0;
  return route.reduce((sum, pos, idx) => {
    if (idx === 0) return sum;
    return sum + manhattanDistance(pos, route[idx - 1]);
  }, 0);
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

export function getNearbyPlayers<T extends { motion: Motion }>(target: Motion, others: T[]) {
  const ts = Date.now();
  const targetPose = getPoseFromMotion(target, ts);
  return others.filter((a) => {
    const distance = manhattanDistance(
      targetPose.position,
      getPoseFromMotion(a.motion, ts).position,
    );
    return distance < NEARBY_DISTANCE;
  });
}
