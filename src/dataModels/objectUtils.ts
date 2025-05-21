// Simplified utility functions inspired by convex/util/object.ts

/**
 * Serializes a Map into an array of its values.
 * @param map The Map instance to serialize.
 * @returns An array containing the values from the map.
 */
export function serializeMap<K, V>(map: Map<K, V>): V[] {
  return Array.from(map.values());
}

/**
 * Parses an array of objects into a Map.
 * @param arr The array of objects.
 * @param Constructor The constructor function for the objects (if they need to be instantiated).
 * @param keyExtractor A function to extract the key from each object.
 * @returns A Map instance.
 */
export function parseMap<K, V, S>(
  arr: S[], // Serialized array of items
  Constructor: new (serialized: S) => V, // Constructor to create V from S
  keyExtractor: (value: V) => K // Function to get the key K from an instance of V
): Map<K, V> {
  const map = new Map<K, V>();
  for (const serializedItem of arr) {
    const item = new Constructor(serializedItem);
    map.set(keyExtractor(item), item);
  }
  return map;
}

/**
 * Parses an array of objects (that don't need construction, e.g. plain data) into a Map.
 * @param arr The array of objects.
 * @param keyExtractor A function to extract the key from each object.
 * @returns A Map instance.
 */
export function parsePlainMap<K, V>(
  arr: V[],
  keyExtractor: (value: V) => K
): Map<K, V> {
  const map = new Map<K, V>();
  for (const item of arr) {
    map.set(keyExtractor(item), item);
  }
  return map;
}
