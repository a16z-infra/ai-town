const END_OF_BUFFER_ERROR_MESSAGE = 'Reached end of buffer unexpectedly';

/**
 * Delegates to `Array#shift`, but throws if the array is zero-length.
 */
export function guardedShift<T>(byteArray: T[]): T {
  if (byteArray.length === 0) {
    throw new Error(END_OF_BUFFER_ERROR_MESSAGE);
  }
  return byteArray.shift() as T;
}

/**
 * Delegates to `Array#splice`, but throws if the section being spliced out extends past the end of
 * the array.
 */
export function guardedSplice<T>(
  byteArray: T[],
  ...args:
    | [start: number, deleteCount?: number]
    | [start: number, deleteCount: number, ...items: T[]]
): T[] {
  const [start] = args;
  if (
    args.length === 2 // Implies that `deleteCount` was supplied
      ? start + (args[1] ?? 0) > byteArray.length
      : start >= byteArray.length
  ) {
    throw new Error(END_OF_BUFFER_ERROR_MESSAGE);
  }
  return byteArray.splice(
    ...(args as Parameters<typeof Array.prototype.splice>),
  );
}
