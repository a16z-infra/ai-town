import { Doc } from '../_generated/dataModel';
import { Motion, Position } from '../schema';
import {
  getPoseFromMotion,
  getRemainingPathFromMotion,
  manhattanDistance,
  roundPosition,
} from './physics';

// null is the root path / starting point
type Path = { pos: Position; distance: number; cost: number; prev: Path | null; next?: Path[] };

export function findRoute(
  map: Doc<'maps'>,
  startMotion: Motion,
  // TODO: Walk around other players along the way
  otherPlayerMotion: Motion[],
  end: Position,
  ts: number,
): { route: Position[]; distance: number } {
  if (
    end.x < 0 ||
    end.y < 0 ||
    end.x >= map.bgTiles[0][0].length ||
    end.y >= map.bgTiles[0].length ||
    map.objectTiles[end.y][end.x] !== -1
  ) {
    throw new Error('Invalid end position: ' + JSON.stringify(end));
  }
  const width = map.bgTiles[0][0].length;
  const height = map.bgTiles[0].length;

  // Make Position[] for each player, starting at ts
  const otherPlayerLocations = otherPlayerMotion
    .map((motion) => getRemainingPathFromMotion(motion, ts))
    .map(makeDensePath);
  const blocked = (pos: Position, distance: number) => {
    if (pos.x < 0 || pos.y < 0 || pos.x >= width || pos.y >= height) {
      return true;
    }
    if (map.objectTiles[pos.y][pos.x] !== -1) {
      return true;
    }
    for (const otherPlayerPath of otherPlayerLocations) {
      const otherPos = otherPlayerPath[distance] ?? otherPlayerPath.at(-1);
      if (otherPos.x === pos.x && otherPos.y === pos.y) {
        return true;
      }
    }
    return false;
  };
  const minDistances: Path[][] = [];
  const makeNext = (prev: Path): Path[] => {
    const distance = prev.distance + 1;
    const next = [];
    // TODO: shake this up to get more interesting paths.
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const pos = { x: prev.pos.x + dx, y: prev.pos.y + dy };
      if (blocked(pos, distance)) continue;
      const left = manhattanDistance(pos, end);
      const cost = distance + left;
      const path = { pos, distance, cost, prev };
      // TODO: break endgame logic into its own function.
      if (left <= 2) {
        // Custom endgame logic, in case we arrived at a crowd.
        if (left === 0) {
          // We arrived.
          return [{ pos, distance, cost: -1, prev }];
        }
        if (blocked(end, distance + left)) {
          if (left === 1) {
            // We are as close as we can get.
            return [{ pos, distance, cost: -1, prev }];
          } else {
            // We are 2 away.
            const candidates = [];
            if (pos.x < end.x) candidates.push({ x: end.x - 1, y: end.y });
            if (pos.x > end.x) candidates.push({ x: end.x + 1, y: end.y });
            if (pos.y < end.y) candidates.push({ x: end.x, y: end.y - 1 });
            if (pos.y > end.y) candidates.push({ x: end.x, y: end.y + 1 });
            const closest = candidates.find((c) => !blocked(c, distance + 1));
            if (closest) {
              // Where we were was the closest we could get
              if (prev.pos.x === closest.x && prev.pos.y === closest.y) {
                return [{ ...prev, cost: -1 }];
              }
              // we can get 1 closer.
              return [{ pos: closest, distance, cost: -1, prev: path }];
            }
            // We have to stop 2 away: all the spots 1 away are blocked.
            return [{ pos, distance, cost: -1, prev }];
          }
        } else if (left === 1) {
          return [{ pos: end, distance: distance + 1, cost: -1, prev: path }];
        }
      }
      const existingMin = minDistances[pos.y]?.[pos.x];
      if (!existingMin) {
        minDistances[pos.y] ??= [];
        minDistances[pos.y][pos.x] = path;
      } else if (cost >= existingMin.cost) {
        continue;
      }
      next.push(path);
    }
    return next;
  };
  const startPose = getPoseFromMotion(startMotion, ts);
  let startPos = roundPosition(startPose.position);
  if (blocked(startPos, 0)) {
    const next = makeNext({ pos: startPos, distance: 0, cost: 0, prev: null });
    if (next.length) startPos = next[0].pos;
  }
  if (startPos.x === end.x && startPos.y === end.y && !blocked(startPos, 0)) {
    return { route: [startPos], distance: 0 };
  }
  const minheap = MinHeap<Path>((more, less) => more.cost > less.cost);
  const startPath = {
    pos: startPos,
    distance: 0,
    cost: manhattanDistance(startPos, end),
    prev: null,
  };
  minDistances[startPos.y] = [];
  minDistances[startPos.y][startPos.x] = startPath;
  let path: Path | undefined = startPath;
  while (path) {
    path.next = makeNext(path);
    if (path.next.length === 1 && path.next[0].cost === -1) {
      path = path.next[0];
      break;
    }
    for (const next of path.next) {
      minheap.push(next);
    }
    path = minheap.pop();
  }
  if (!path) {
    // TODO: Find the closest point we can get to.
    return { route: [startPos], distance: 0 };
  }
  const denseRoute: Position[] = [path.pos];
  const distance = path.distance;
  while (path.prev) {
    path = path.prev;
    denseRoute.push(path.pos);
  }
  denseRoute.reverse();
  const route = makeSparsePath(denseRoute);
  return { route, distance };
}

// Assumes all motion has started in the past or currently.
// Otherwise we'd need to know how far we'd go before it starts.
// Assumes one square move per time unit, all together.
export function findCollision<T extends { motion: Motion }>(
  route: Position[],
  others: T[],
  ts: number,
  strikeZone: number,
) {
  const densePath = makeDensePath(route);
  // Make Position[] for each player, starting at ts
  const otherPlayerPaths = others
    .map(({ motion }) => getRemainingPathFromMotion(motion, ts))
    .map(makeDensePath);

  // For each position index, check if any other player is nearby.
  for (const [distance, pos] of densePath.entries()) {
    const hits = [];
    for (const [idx, otherPlayerPath] of otherPlayerPaths.entries()) {
      // Assume the player will stop where the end walking
      const otherPlayerPos = otherPlayerPath[distance] ?? otherPlayerPath.at(-1);
      if (manhattanDistance(pos, otherPlayerPos) <= strikeZone) {
        // Return the first index where there is a collision
        hits.push(others[idx]);
      }
    }
    if (hits.length > 0) {
      return {
        hits,
        distance,
      };
    }
  }
  return null;
}

export function makeSparsePath(path: Position[]): Position[] {
  if (path.length <= 1) return path;
  const sparsePath = [path[0]];
  for (let i = 1; i < path.length - 1; i++) {
    const dx = path[i].x - path[i - 1].x;
    const dy = path[i].y - path[i - 1].y;
    let j = i + 1;
    for (; j < path.length; j++) {
      const dx2 = path[j].x - path[j - 1].x;
      const dy2 = path[j].y - path[j - 1].y;
      if (!dx2 && !dy2) continue;
      if (dx !== dx2 || dy !== dy2) {
        sparsePath.push(path[j - 1]);
        i = j - 1;
        break;
      }
    }
  }
  sparsePath.push(path[path.length - 1]);
  return sparsePath;
}

export function makeDensePath(path: Position[]): Position[] {
  if (path.length <= 1) return path;
  const densePath = [];
  for (const [idx, nextPos] of path.slice(1).entries()) {
    const pos = path[idx];
    if (pos.x < nextPos.x) {
      for (let x = pos.x; x < nextPos.x; x++) {
        densePath.push({ x, y: pos.y });
      }
    } else {
      for (let x = pos.x; x > nextPos.x; x--) {
        densePath.push({ x, y: pos.y });
      }
    }
    if (pos.y < nextPos.y) {
      for (let y = pos.y; y < nextPos.y; y++) {
        densePath.push({ x: pos.x, y });
      }
    } else {
      for (let y = pos.y; y > nextPos.y; y--) {
        densePath.push({ x: pos.x, y });
      }
    }
  }
  densePath.push(path[path.length - 1]);
  return densePath;
}

// Basic 1-indexed minheap implementation
function MinHeap<T>(compare: (a: T, b: T) => boolean) {
  // Using 1 indexing. I know, it's goofy
  const tree = [null as T];
  let endIndex = 1;
  return {
    peek: (): T | undefined => tree[1],
    length: () => endIndex - 1,
    push: (newValue: T) => {
      let destinationIndex = endIndex++;
      let nextToCheck;
      while ((nextToCheck = destinationIndex >> 1) > 0) {
        const existing = tree[nextToCheck];
        if (compare(newValue, existing)) break;
        tree[destinationIndex] = existing;
        destinationIndex = nextToCheck;
      }
      tree[destinationIndex] = newValue;
    },
    pop: () => {
      if (endIndex == 1) return undefined;
      endIndex--;
      const value = tree[1];
      const lastValue = tree[endIndex];
      let destinationIndex = 1;
      let nextToCheck;
      while ((nextToCheck = destinationIndex << 1) < endIndex) {
        if (nextToCheck + 1 <= endIndex && compare(tree[nextToCheck], tree[nextToCheck + 1]))
          nextToCheck++;
        const existing = tree[nextToCheck];
        if (compare(existing, lastValue)) break;
        tree[destinationIndex] = existing;
        destinationIndex = nextToCheck;
      }
      tree[destinationIndex] = lastValue;
      return value;
    },
  };
}
