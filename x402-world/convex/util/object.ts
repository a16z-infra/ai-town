// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS FOR OBJECT MANIPULATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Parse an array of serialized objects into a Map
 */
export function parseMap<T, U>(
  array: T[],
  Constructor: new (serialized: T) => U,
  getKey: (instance: U) => string
): Map<string, U> {
  const map = new Map<string, U>();
  for (const item of array) {
    const instance = new Constructor(item);
    map.set(getKey(instance), instance);
  }
  return map;
}

/**
 * Serialize a Map to an array
 */
export function serializeMap<K, V extends { serialize(): any }>(
  map: Map<K, V>
): ReturnType<V['serialize']>[] {
  return [...map.values()].map((v) => v.serialize());
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as unknown as T;
  }

  if (obj instanceof Map) {
    const clonedMap = new Map();
    for (const [key, value] of obj.entries()) {
      clonedMap.set(deepClone(key), deepClone(value));
    }
    return clonedMap as unknown as T;
  }

  if (obj instanceof Set) {
    const clonedSet = new Set();
    for (const value of obj.values()) {
      clonedSet.add(deepClone(value));
    }
    return clonedSet as unknown as T;
  }

  const clonedObj: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clonedObj[key] = deepClone((obj as any)[key]);
    }
  }
  return clonedObj;
}

/**
 * Merge two objects deeply
 */
export function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = target[key];

      if (
        sourceValue !== undefined &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        sourceValue !== null &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue) &&
        targetValue !== null
      ) {
        (result as any)[key] = deepMerge(targetValue as object, sourceValue as object);
      } else if (sourceValue !== undefined) {
        (result as any)[key] = sourceValue;
      }
    }
  }

  return result;
}

/**
 * Pick specific keys from an object
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Omit specific keys from an object
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete (result as any)[key];
  }
  return result;
}
