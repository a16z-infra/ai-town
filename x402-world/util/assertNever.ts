// From https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html#union-exhaustiveness-checking
export function assertNever(x: never): never {
  throw new Error(`Unexpected object: ${JSON.stringify(x)}`);
}
