import { DatabaseReader, DatabaseWriter } from '../_generated/server';
import { Doc, Id, TableNames } from '../_generated/dataModel';
import { FieldPaths, WithoutSystemFields } from 'convex/server';

export abstract class GameTable<T extends TableNames> {
  abstract table: T;
  abstract db: DatabaseWriter;

  data: Map<Id<T>, Doc<T>> = new Map();
  modified: Set<Id<T>> = new Set();
  deleted: Set<Id<T>> = new Set();

  abstract isActive(doc: Doc<T>): boolean;

  constructor(rows: Doc<T>[]) {
    for (const row of rows) {
      this.data.set(row._id, row);
    }
  }

  async insert(row: WithoutSystemFields<Doc<T>>): Promise<Id<T>> {
    const id = await this.db.insert(this.table, row);
    const withSystemFields = await this.db.get(id);
    if (!withSystemFields) {
      throw new Error(`Failed to db.get() inserted row`);
    }
    this.data.set(id, withSystemFields);
    return id;
  }

  delete(id: Id<T>) {
    if (this.data.delete(id)) {
      this.deleted.add(id);
    }
  }

  lookup(id: Id<T>): Doc<T> {
    const row = this.data.get(id);
    if (!row) {
      throw new Error(`Invalid ID: ${id}`);
    }
    if (!this.isActive(row)) {
      throw new Error(`ID is inactive: ${id}`);
    }
    const handlers = {
      defineProperty: (target: any, key: any, descriptor: any) => {
        this.markModified(id);
        return Reflect.defineProperty(target, key, descriptor);
      },
      get: (target: any, prop: any, receiver: any) => {
        const value = Reflect.get(target, prop, receiver);
        if (typeof value === 'object') {
          return new Proxy<Doc<T>>(value, handlers);
        } else {
          return value;
        }
      },
      set: (obj: any, prop: any, value: any) => {
        this.markModified(id);
        return Reflect.set(obj, prop, value);
      },
      deleteProperty: (target: any, prop: any) => {
        this.markModified(id);
        return Reflect.deleteProperty(target, prop);
      },
    };
    return new Proxy<Doc<T>>(row, handlers);
  }

  find(f: (doc: Doc<T>) => boolean): Doc<T> | null {
    for (const id of this.allIds()) {
      const doc = this.lookup(id);
      if (f(doc)) {
        return doc;
      }
    }
    return null;
  }

  filter(f: (doc: Doc<T>) => boolean): Array<Doc<T>> {
    const out = [];
    for (const id of this.allIds()) {
      const doc = this.lookup(id);
      if (f(doc)) {
        out.push(doc);
      }
    }
    return out;
  }

  allIds(): Array<Id<T>> {
    const ids = [];
    for (const [id, doc] of this.data.entries()) {
      if (!this.isActive(doc)) {
        continue;
      }
      ids.push(id);
    }
    return ids;
  }

  allDocuments(): Array<Doc<T>> {
    return this.allIds().map((id) => this.lookup(id));
  }

  private markModified(id: Id<T>) {
    const data = this.data.get(id);
    if (!data) {
      console.warn(`Modifying deleted id ${id}`);
      return;
    }
    if (!this.isActive(data)) {
      console.warn(`Modifying inactive id ${id}`);
      return;
    }
    this.modified.add(id);
  }

  async save() {
    for (const id of this.deleted) {
      await this.db.delete(id);
    }
    for (const id of this.modified) {
      const row = this.data.get(id);
      if (!row) {
        throw new Error(`Invalid modified id: ${id}`);
      }
      // Somehow TypeScript isn't able to figure out that our
      // generic `Doc<T>` unifies with `replace()`'s type.
      await this.db.replace(id, row as any);
    }
    this.modified.clear();
    this.deleted.clear();
  }
}
