// Replicating simplified versions of types from convex/util/types.ts

export interface Point {
  x: number;
  y: number;
}

export interface Vector {
  dx: number; // For direction / velocity
  dy: number;
}

// Path component as used in Player's pathfinding
export interface PathComponent {
  position: Point;
  until: number;
}

export type Path = PathComponent[];

// For historicalObject.ts if needed, or other generic data holder
export type HistoricalObject<T> = {
  id: string; // Or a more specific HistoricalObjectId
  doc: T;
  created: number;
  updated: number;
  deleted?: number; // Timestamp of deletion if soft-deleted
};

// Helper for unpacking path components, if needed (from convex/util/types.ts)
// For client-side, this might not be necessary if data is already in correct format.
/*
export function unpackPathComponent(component: { position: Point; until: number }): {
  position: Point;
  until: number;
} {
  return component;
}
*/
