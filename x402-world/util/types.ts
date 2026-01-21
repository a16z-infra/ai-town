import { Infer, v } from 'convex/values';

export const point = v.object({
  x: v.number(),
  y: v.number(),
});
export type Point = Infer<typeof point>;

export const vector = v.object({
  dx: v.number(),
  dy: v.number(),
});
export type Vector = Infer<typeof vector>;

// Paths are arrays of [x, y, dx, dy, t] tuples;
export const path = v.array(v.array(v.number()));
export type Path = [number, number, number, number, number][];

export type PathComponent = { position: Point; facing: Vector; t: number };

export function queryPath(p: Path, at: number): PathComponent {
  return unpackPathComponent(p[at]);
}
export function packPathComponent(p: PathComponent): [number, number, number, number, number] {
  return [p.position.x, p.position.y, p.facing.dx, p.facing.dy, p.t];
}
export function unpackPathComponent(p: [number, number, number, number, number]): PathComponent {
  return {
    position: { x: p[0], y: p[1] },
    facing: { dx: p[2], dy: p[3] },
    t: p[4],
  };
}
