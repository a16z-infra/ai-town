import { Validator, v } from 'convex/values';
import { WithoutSystemFields, defineTable } from 'convex/server';
import { Doc, Id, TableNames } from '../_generated/dataModel';
import { DatabaseReader } from '../_generated/server';

/**
 * Filters out null and undefined elements from an array.
 * @param list List of elements that might be null.
 * @returns List of elements with nulls removed.
 */
export function pruneNull<T>(list: (T | null | undefined)[]): T[] {
  return list.filter((i) => i !== null && i !== undefined) as T[];
}

/**
 * asyncMap returns the results of applying an async function over an list.
 *
 * @param list - Iterable object of items, e.g. an Array, Set, Object.keys
 * @param asyncTransform
 * @returns
 */
export async function asyncMap<FromType, ToType>(
  list: Iterable<FromType>,
  asyncTransform: (item: FromType, index: number) => Promise<ToType>,
): Promise<ToType[]> {
  const promises: Promise<ToType>[] = [];
  let idx = 0;
  for (const item of list) {
    promises.push(asyncTransform(item, idx));
    idx += 1;
  }
  return Promise.all(promises);
}

/**
 * asyncFilter returns the results of applying an async function over an list.
 *
 * @param list - Iterable object of items, e.g. an Array, Set, Object.keys
 * @param asyncTransform
 * @returns
 */
export async function asyncFilter<T>(
  list: Iterable<T>,
  asyncTransform: (item: T, index: number) => Promise<any>,
): Promise<T[]> {
  const promises: Promise<boolean>[] = [];
  const results: T[] = [];
  let idx = 0;
  for (const item of list) {
    promises.push(asyncTransform(item, idx));
    results.push(item);
    idx += 1;
  }
  const mask = await Promise.all(promises);
  return results.filter((_, idx) => !!mask[idx]);
}

/**
 * getAll returns a list of Documents corresponding to the `Id`s passed in.
 * @param db A database object, usually passed from a mutation or query ctx.
 * @param ids An list (or other iterable) of Ids pointing to a table.
 * @returns The Documents referenced by the Ids, in order. `null` if not found.
 */
export async function getAll<TableName extends TableNames>(
  db: DatabaseReader,
  ids: Id<TableName>[],
): Promise<Doc<TableName>[]> {
  const docs = await asyncMap(ids, db.get);
  return docs.map((doc, idx) => {
    if (doc === null) {
      throw new Error(`Missing document for id ${ids[idx]}`);
    }
    return doc;
  });
}

// Returns a bunch of useful parts of a table definition.
export function Table<T extends Record<string, Validator<any, any, any>>, TableName extends string>(
  name: TableName,
  fields: T,
) {
  const docFields = {
    ...fields,
    _id: v.id(name) as Validator<string & { __tableName: TableName }>,
    _creationTime: v.number(),
  };
  const table = defineTable(fields);
  return {
    fields,
    table,
    docFields,
    doc: v.object(docFields),
  };
}
