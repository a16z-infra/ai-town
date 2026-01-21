// Basic 1-indexed minheap implementation
export function MinHeap<T>(compare: (a: T, b: T) => boolean) {
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
