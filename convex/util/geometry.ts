import { Path, Point, Vector } from './types';

export function distance(p0: Point, p1: Point): number {
  const dx = p0.x - p1.x;
  const dy = p0.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function pointsEqual(p0: Point, p1: Point): boolean {
  return p0.x == p1.x && p0.y == p1.y;
}

export function manhattanDistance(p0: Point, p1: Point) {
  return Math.abs(p0.x - p1.x) + Math.abs(p0.y - p1.y);
}

export function pathOverlaps(path: Path, time: number): boolean {
  if (path.length < 2) {
    throw new Error(`Invalid path: ${JSON.stringify(path)}`);
  }
  return path.at(0)!.t <= time && time <= path.at(-1)!.t;
}

export function pathPosition(
  path: Path,
  time: number,
): { position: Point; facing: Vector; velocity: number } {
  if (path.length < 2) {
    throw new Error(`Invalid path: ${JSON.stringify(path)}`);
  }
  const first = path[0];
  if (time < first.t) {
    return { position: first.position, facing: first.facing, velocity: 0 };
  }
  const last = path[path.length - 1];
  if (last.t < time) {
    return { position: last.position, facing: last.facing, velocity: 0 };
  }
  for (let i = 0; i < path.length - 1; i++) {
    const segmentStart = path[i];
    const segmentEnd = path[i + 1];
    if (segmentStart.t <= time && time <= segmentEnd.t) {
      const interp = (time - segmentStart.t) / (segmentEnd.t - segmentStart.t);
      return {
        position: {
          x: segmentStart.position.x + interp * (segmentEnd.position.x - segmentStart.position.x),
          y: segmentStart.position.y + interp * (segmentEnd.position.y - segmentStart.position.y),
        },
        facing: segmentStart.facing,
        velocity:
          distance(segmentStart.position, segmentEnd.position) / (segmentEnd.t - segmentStart.t),
      };
    }
  }
  throw new Error(`Timestamp checks not exhaustive?`);
}

export const EPSILON = 0.0001;

export function vector(p0: Point, p1: Point): Vector {
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  return { dx, dy };
}

export function normalize(vector: Vector): Vector | null {
  const { dx, dy } = vector;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < EPSILON) {
    return null;
  }
  return {
    dx: dx / len,
    dy: dy / len,
  };
}

export function orientationDegrees(vector: Vector): number {
  if (Math.sqrt(vector.dx * vector.dx + vector.dy * vector.dy) < EPSILON) {
    throw new Error(`Can't compute the orientation of too small vector ${JSON.stringify(vector)}`);
  }
  const twoPi = 2 * Math.PI;
  const radians = (Math.atan2(vector.dy, vector.dx) + twoPi) % twoPi;
  return (radians / twoPi) * 360;
}
