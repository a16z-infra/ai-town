import { compressPath } from './geometry';

describe('compressPath', () => {
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
      { position: { x: 0, y: 0 }, facing, t: 0 },
      { position: { x: 0, y: 4 }, facing, t: 4 },
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
      { position: { x: 0, y: 0 }, facing: facingUp, t: 0 },
      { position: { x: 0, y: 2 }, facing: facingRight, t: 2 },
      { position: { x: 2, y: 2 }, facing: facingRight, t: 4 },
    ]);
  });
});
