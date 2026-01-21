import { Path, PathComponent, packPathComponent, queryPath, unpackPathComponent } from "./types";

describe('queryPath', () => {
  it('should return the correct path component', () => {
    const p: Path = [
      [1, 2, 3, 4, 5],
      [6, 7, 8, 9, 10],
      [11, 12, 13, 14, 15]
    ];
    const expected = {
      position: { x: 6, y: 7 },
      facing: { dx: 8, dy: 9 },
      t: 10,
    };
    expect(queryPath(p, 1)).toEqual(expected);
  });
});

describe('packPathComponent', () => {
  it('should correctly pack a path component', () => {
    const p: PathComponent = {
      position: { x: 10, y: 20 },
      facing: { dx: 3, dy: 4 },
      t: 5,
    };
    const expected = [10, 20, 3, 4, 5];
    expect(packPathComponent(p)).toEqual(expected);
  })
});

describe('unpackPathComponent', () => {
  it('should unpack a path component with positive values', () => {
    const input: [number, number, number, number, number] = [10, 20, 3, 4, 5];
    const expected = {
      position: { x: 10, y: 20 },
      facing: { dx: 3, dy: 4 },
      t: 5,
    }
    const actual = unpackPathComponent(input);
    expect(actual).toEqual(expected);
  });
});