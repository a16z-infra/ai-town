import { gameHour, inHourWindow } from './clock';
import {
  JOB_DEFINITIONS,
  JobSnapshot,
  SerializedJob,
  WORKPLACE_ARRIVAL_DISTANCE,
  decideJobStep,
  findOpenTile,
  isJobKind,
  newJob,
} from './jobs';

const farmer = JOB_DEFINITIONS.farmer;
const workplace = { x: 56, y: 40 };
const NOW = 1_000_000;
const ON_SHIFT = 10; // farmer shift is [6, 16)
const OFF_SHIFT = 20;

function snapshot(overrides: Partial<JobSnapshot> = {}): JobSnapshot {
  return { now: NOW, hour: ON_SHIFT, position: { ...workplace }, ...overrides };
}

function workingJob(taskEndsAt: number): SerializedJob {
  return { ...newJob('farmer'), workplace, taskEndsAt };
}

describe('clock', () => {
  test('gameHour maps a day onto [0, 24)', () => {
    const day = 24_000;
    expect(gameHour(0, day)).toBe(0);
    expect(gameHour(6_000, day)).toBe(6);
    expect(gameHour(day + 12_000, day)).toBe(12);
  });

  test('inHourWindow handles normal and wrapping windows', () => {
    expect(inHourWindow(10, 6, 16)).toBe(true);
    expect(inHourWindow(16, 6, 16)).toBe(false);
    expect(inHourWindow(5.99, 6, 16)).toBe(false);
    expect(inHourWindow(23, 22, 6)).toBe(true);
    expect(inHourWindow(3, 22, 6)).toBe(true);
    expect(inHourWindow(12, 22, 6)).toBe(false);
    expect(inHourWindow(12, 0, 0)).toBe(true);
  });
});

describe('decideJobStep', () => {
  test('off shift with no task in progress defers to stock behavior', () => {
    const step = decideJobStep(newJob('farmer'), farmer, workplace, snapshot({ hour: OFF_SHIFT }));
    expect(step).toEqual({ kind: 'offShift' });
  });

  test('on shift and far away: walk to the workplace', () => {
    const step = decideJobStep(
      newJob('farmer'),
      farmer,
      workplace,
      snapshot({ position: { x: 5, y: 5 } }),
    );
    expect(step).toEqual({ kind: 'walkToWork', destination: workplace });
  });

  test('already pathfinding to the workplace: keep walking', () => {
    const step = decideJobStep(
      newJob('farmer'),
      farmer,
      workplace,
      snapshot({ position: { x: 5, y: 5 }, pathfindingDestination: workplace }),
    );
    expect(step).toEqual({ kind: 'walking' });
  });

  test('pathfinding somewhere else: redirect to the workplace', () => {
    const step = decideJobStep(
      newJob('farmer'),
      farmer,
      workplace,
      snapshot({ position: { x: 5, y: 5 }, pathfindingDestination: { x: 1, y: 1 } }),
    );
    expect(step.kind).toBe('walkToWork');
  });

  test('within arrival distance counts as at work', () => {
    const near = { x: workplace.x + WORKPLACE_ARRIVAL_DISTANCE, y: workplace.y };
    const step = decideJobStep(newJob('farmer'), farmer, workplace, snapshot({ position: near }));
    expect(step).toEqual({ kind: 'startTask', until: NOW + farmer.task.duration });
  });

  test('task in progress with intact activity: keep working', () => {
    const until = NOW + 5_000;
    const step = decideJobStep(
      workingJob(until),
      farmer,
      workplace,
      snapshot({ activity: { description: farmer.task.description, until } }),
    );
    expect(step).toEqual({ kind: 'working' });
  });

  test('task reaches its end: complete it', () => {
    const until = NOW;
    const step = decideJobStep(
      workingJob(until),
      farmer,
      workplace,
      snapshot({ activity: { description: farmer.task.description, until } }),
    );
    expect(step).toEqual({ kind: 'completeTask' });
  });

  test('a task in progress finishes even after the shift ends', () => {
    const until = NOW;
    const step = decideJobStep(
      workingJob(until),
      farmer,
      workplace,
      snapshot({ hour: OFF_SHIFT, activity: { description: farmer.task.description, until } }),
    );
    expect(step).toEqual({ kind: 'completeTask' });
  });

  test('activity cut short (conversation) abandons the task without credit', () => {
    const taskEndsAt = NOW + 20_000;
    const step = decideJobStep(
      workingJob(taskEndsAt),
      farmer,
      workplace,
      snapshot({ activity: { description: farmer.task.description, until: NOW - 1_000 } }),
    );
    expect(step).toEqual({ kind: 'abandonTask' });
  });

  test('activity replaced by something else abandons the task', () => {
    const taskEndsAt = NOW + 20_000;
    const step = decideJobStep(
      workingJob(taskEndsAt),
      farmer,
      workplace,
      snapshot({ activity: { description: 'reading a book', until: taskEndsAt } }),
    );
    expect(step).toEqual({ kind: 'abandonTask' });
  });
});

describe('findOpenTile', () => {
  // 5x5 map, everything blocked except (4, 4) and (1, 2).
  const blocked = () => Array.from({ length: 5 }, () => Array(5).fill(7));
  const layer = blocked();
  layer[4][4] = -1;
  layer[1][2] = -1;
  const map = { width: 5, height: 5, objectTiles: [layer] };

  test('returns the target when it is open', () => {
    expect(findOpenTile(map, { x: 4, y: 4 })).toEqual({ x: 4, y: 4 });
  });

  test('returns the nearest open tile when the target is blocked', () => {
    expect(findOpenTile(map, { x: 0, y: 2 })).toEqual({ x: 1, y: 2 });
  });

  test('an open tile must be clear on every layer', () => {
    const second = blocked();
    second[1][2] = -1; // (4,4) blocked on this layer
    const twoLayers = { width: 5, height: 5, objectTiles: [layer, second] };
    expect(findOpenTile(twoLayers, { x: 4, y: 4 })).toEqual({ x: 1, y: 2 });
  });

  test('returns undefined when nothing is open', () => {
    expect(
      findOpenTile(
        {
          width: 2,
          height: 2,
          objectTiles: [
            [
              [0, 0],
              [0, 0],
            ],
          ],
        },
        { x: 0, y: 0 },
      ),
    ).toBeUndefined();
  });
});

test('isJobKind', () => {
  expect(isJobKind('farmer')).toBe(true);
  expect(isJobKind('wizard')).toBe(false);
  expect(isJobKind(undefined)).toBe(false);
});
