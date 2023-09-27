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

export const path = v.array(v.object({ position: point, facing: vector, t: v.number() }));
export type Path = Infer<typeof path>;
