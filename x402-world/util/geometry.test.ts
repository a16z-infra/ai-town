import { compressPath, distance, manhattanDistance, normalize, orientationDegrees, pathOverlaps, pathPosition, pointsEqual, vector, vectorLength } from './geometry';
import { Path, Vector } from './types';

describe('distance', () => {
  test('should return the correct distance for two points', () => {
    const p0 = { x: 0, y: 0 };
    const p1 = { x: 3, y: 4 };
    const expectedDistance = 5;

    const actualDistance = distance(p0, p1);

    expect(actualDistance).toBe(expectedDistance);
  });

  test('should return 0 for the same point', () => {
    const p0 = { x: 1, y: 2 };
    const expectedDistance = 0;

    const actualDistance = distance(p0, p0);

    expect(actualDistance).toBe(expectedDistance);
  });

  test('should return the correct distance for negative points', () => {
    const p0 = { x: -2, y: -3 };
    const p1 = { x: 1, y: 2 };
    const expectedDistance = 5.83;

    const actualDistance = distance(p0, p1);

    expect(actualDistance).toBeCloseTo(expectedDistance);
  });
});

describe('pointsEqual', () => {
  test('should return true for identical points', () => {
    const p0 = { x: 1, y: 2 };
    const p1 = { x: 1, y: 2 };
    expect(pointsEqual(p0, p1)).toBe(true);
  });

  test('should return false for non-idential points', () => {
    const p0 = { x: 3, y: 2 };
    const p1 = { x: 5, y: 3 };
    expect(pointsEqual(p0, p1)).toBe(false);
  });

  test('should return false for different x coordinates', () => {
    const p0 = { x: 1, y: 2 };
    const p1 = { x: 2, y: 2 };
    expect(pointsEqual(p0, p1)).toBe(false);
  });

  test('should return false for different y coordinates', () => {
    const p0 = { x: 1, y: 2 };
    const p1 = { x: 1, y: 3 };
    expect(pointsEqual(p0, p1)).toBe(false);
  });
});

describe("manhattanDistance", () => {
  test("should return correct distance for points on the same axis", () => {
    const p0 = { x: 1, y: 0 };
    const p1 = { x: 1, y: 2 };
    expect(manhattanDistance(p0, p1)).toBe(2);
  });

  test("should return correct distance for points on different axes", () => {
    const p0 = { x: 1, y: 0 };
    const p1 = { x: 3, y: 2 };
    expect(manhattanDistance(p0, p1)).toBe(4);
  });

  test("should return correct distance for negative points", () => {
    const p0 = { x: -2, y: 0 };
    const p1 = { x: 1, y: -2 };
    expect(manhattanDistance(p0, p1)).toBe(5);
  });

  test("should return correct distance for identical points", () => {
    const p0 = { x: 1, y: 2 };
    const p1 = { x: 1, y: 2 };
    expect(manhattanDistance(p0, p1)).toBe(0);
  });
});

describe('pathOverlaps', () => {
  test('should throw an error if the path does not have 2 entries', () => {
    const path: Path = [
      [0, 0, 0, 1, 0]
    ];
    const time = 0;
    expect(() => pathOverlaps(path, time)).toThrowError('Invalid path: [[0,0,0,1,0]]');
  });

  test('should return true if the time is within the path', () => {
    const path: Path = [
      [0, 0, 0, 1, 1],
      [0, 2, 0, 1, 2]
    ];
    const time = 1.5;
    expect(pathOverlaps(path, time)).toBe(true);
  });

  test('should return false if the time is before the start of the path', () => {
    const path: Path = [
      [0, 0, 0, 1, 1],
      [0, 2, 0, 1, 2]
    ];
    const time = 0.5;
    expect(pathOverlaps(path, time)).toBe(false);
  });

  test('should return false if the time is after the end of the path', () => {
    const path: Path = [
      [0, 0, 0, 1, 1],
      [0, 2, 0, 1, 2]
    ];
    const time = 2.5;
    expect(pathOverlaps(path, time)).toBe(false);
  });
});

describe('pathPosition', () => {
  test('should throw an error if the path does not have 2 entries', () => {
    const path: Path = [
      [0, 0, 0, 1, 0]
    ];
    const time = 0;
    expect(() => pathPosition(path, time)).toThrowError('Invalid path: [[0,0,0,1,0]]');
  });

  test('returns the first point when time is less than the start time', () => {
    const path: Path = [
      [1, 2, 3, 4, 2],
      [5, 6, 3, 4, 3]
    ];

    const result = pathPosition(path, 1);

    expect(result.position).toEqual({ x: 1, y: 2 });
    expect(result.facing).toEqual({ dx: 3, dy: 4 });
    expect(result.velocity).toBe(0);
  });

  test('returns the last point when time is greater than the end time', () => {
    const path: Path = [
      [1, 2, 3, 4, 2],
      [5, 6, 3, 4, 3]
    ];

    const result = pathPosition(path, 4);

    expect(result.position).toEqual({ x: 5, y: 6 });
    expect(result.facing).toEqual({ dx: 3, dy: 4 });
    expect(result.velocity).toBe(0);
  });

  test('returns the interpolated point for time between two segments', () => {
    const path: Path = [
      [1, 2, 7, 8, 2],
      [5, 6, 7, 8, 3],
      [10, 11, 7, 8, 4],
      [14, 15, 7, 8, 5]
    ];

    const result = pathPosition(path, 4.5);

    expect(result.position).toEqual({ x: 12, y: 13 });
    expect(result.facing).toEqual({ dx: 7, dy: 8 });
    expect(result.velocity).toBeCloseTo(5.657);
  });
});

describe('vector', () => {
  test('should return a vector with dx = 1 and dy = 2', () => {
    const p0 = { x: 1, y: 2 };
    const p1 = { x: 2, y: 4 };
    const expected = { dx: 1, dy: 2 };
    const actual = vector(p0, p1);
    expect(actual).toEqual(expected);
  });

  test('should return a vector with dx = 0 and dy = 0', () => {
    const p0 = { x: 1, y: 2 };
    const p1 = { x: 1, y: 2 };
    const expected = { dx: 0, dy: 0 };
    const actual = vector(p0, p1);
    expect(actual).toEqual(expected);
  });

  test('should return a vector with dx = 0 and dy = -1', () => {
    const p0 = { x: 1, y: 2 };
    const p1 = { x: 1, y: 1 };
    const expected = { dx: 0, dy: -1 };
    const actual = vector(p0, p1);
    expect(actual).toEqual(expected);
  });
});

describe('vectorLength', () => {
  test('returns the correct length for a vector', () => {
    const vector: Vector = { dx: 3.14, dy: 4 };
    expect(vectorLength(vector)).toBeCloseTo(5.09);
  });

  test('returns the correct length for a vector with negative components', () => {
    const vector: Vector = { dx: -3, dy: -4 };
    expect(vectorLength(vector)).toBeCloseTo(5);
  });

  test('returns the correct length for a vector with zero components', () => {
    const vector: Vector = { dx: 0, dy: 0 };
    expect(vectorLength(vector)).toBeCloseTo(0);
  });
});

describe('normalize', () => {
  test('should return null for vector length less than EPSILON', () => {
    const vector: Vector = { dx: 0, dy: 0 };
    const result = normalize(vector);
    expect(result).toBeNull();
  });

  test('should return a normalized vector', () => {
    const vector: Vector = { dx: 3, dy: 4 };
    const result = normalize(vector);
    expect(result).toEqual({ dx: 0.6, dy: 0.8 });
  });
});

describe('orientationDegrees', () => {
  test('should throw an error for a vector length smaller than EPSILON', () => {
    expect(() => orientationDegrees({ dx: 0, dy: 0 })).toThrowError("Can't compute the orientation of too small vector {\"dx\":0,\"dy\":0}");
  });
  test('should return 0 for a vector pointing to the right', () => {
    expect(orientationDegrees({ dx: 1, dy: 0 })).toBe(0);
  });

  test('should return 90 for a vector pointing up', () => {
    expect(orientationDegrees({ dx: 0, dy: 1 })).toBe(90);
  });

  test('should return 180 for a vector pointing to the left', () => {
    expect(orientationDegrees({ dx: -1, dy: 0 })).toBe(180);
  });

  test('should return 270 for a vector pointing down', () => {
    expect(orientationDegrees({ dx: 0, dy: -1 })).toBe(270);
  });
});


describe('compressPath', () => {
  test('should not compress a path with only 2 entries', () => {
    const facing = { dx: 0, dy: 1 };
    const compressed = compressPath([
      { position: { x: 0, y: 0 }, facing, t: 0 },
      { position: { x: 0, y: 1 }, facing, t: 1 },
    ]);
    expect(compressed).toEqual([
      [0, 0, 0, 1, 0],
      [0, 1, 0, 1, 1],
    ]);
  });

  test('should compress a line', () => {
    const facing = { dx: 0, dy: 1 };
    const compressed = compressPath([
      { position: { x: 0, y: 0 }, facing, t: 0 },
      { position: { x: 0, y: 1 }, facing, t: 1 },
      { position: { x: 0, y: 2 }, facing, t: 2 },
      { position: { x: 0, y: 3 }, facing, t: 3 },
      { position: { x: 0, y: 4 }, facing, t: 4 },
    ]);
    expect(compressed).toEqual([
      [0, 0, 0, 1, 0],
      [0, 4, 0, 1, 4],
    ]);
  });

  test('should compress a line with a turn', () => {
    const facingUp = { dx: 0, dy: 1 };
    const facingRight = { dx: 1, dy: 0 };
    const compressed = compressPath([
      { position: { x: 0, y: 0 }, facing: facingUp, t: 0 },
      { position: { x: 0, y: 1 }, facing: facingUp, t: 1 },
      { position: { x: 0, y: 2 }, facing: facingRight, t: 2 },
      { position: { x: 1, y: 2 }, facing: facingRight, t: 3 },
      { position: { x: 2, y: 2 }, facing: facingRight, t: 4 },
    ]);
    expect(compressed).toEqual([
      [0, 0, 0, 1, 0],
      [0, 2, 1, 0, 2],
      [2, 2, 1, 0, 4],
    ]);
  });
});
