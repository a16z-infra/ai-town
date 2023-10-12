import { WithoutSystemFields } from 'convex/server';
import { Doc, Id, TableNames } from '../_generated/dataModel';
import { DatabaseWriter } from '../_generated/server';

type FieldName = string;

export type History = {
  initialValue: number;
  samples: Sample[];
};

export type Sample = {
  time: number;
  value: number;
};

export abstract class HistoricalTable<T extends TableNames> {
  abstract table: T;
  abstract db: DatabaseWriter;
  startTs?: number;

  fields: FieldName[];

  data: Map<Id<T>, Doc<T>> = new Map();
  modified: Set<Id<T>> = new Set();
  deleted: Set<Id<T>> = new Set();

  history: Map<Id<T>, Record<FieldName, History>> = new Map();

  constructor(fields: FieldName[], rows: Doc<T>[]) {
    this.fields = fields;
    for (const row of rows) {
      if ('history' in row) {
        delete row.history;
        this.modified.add(row._id);
      }
      this.checkShape(row);
      this.data.set(row._id, row);
    }
  }

  historyLength() {
    return [...this.history.values()]
      .flatMap((sampleRecord) => Object.values(sampleRecord))
      .map((h) => h.samples.length)
      .reduce((a, b) => a + b, 0);
  }

  checkShape(obj: any) {
    if ('history' in obj) {
      throw new Error(`Cannot insert row with 'history' field`);
    }
    for (const [key, value] of Object.entries(obj)) {
      if (this.isReservedFieldName(key)) {
        continue;
      }
      if (typeof value !== 'number') {
        throw new Error(
          `HistoricalTable only supports numeric values, found: ${JSON.stringify(value)}`,
        );
      }
    }
  }

  isReservedFieldName(key: string) {
    return key.startsWith('_') || key === 'history';
  }

  async insert(now: number, row: WithoutSystemFields<Doc<T>>): Promise<Id<T>> {
    this.checkShape(row);

    const id = await this.db.insert(this.table, row);
    const withSystemFields = await this.db.get(id);
    if (!withSystemFields) {
      throw new Error(`Failed to db.get() inserted row`);
    }
    this.data.set(id, withSystemFields);
    return id;
  }

  lookup(now: number, id: Id<T>): Doc<T> {
    const row = this.data.get(id);
    if (!row) {
      throw new Error(`Invalid ID: ${id}`);
    }
    const handlers = {
      defineProperty: (target: any, key: any, descriptor: any) => {
        throw new Error(`Adding new fields unsupported on HistoricalTable`);
      },
      get: (target: any, prop: any, receiver: any) => {
        const value = Reflect.get(target, prop, receiver);
        if (typeof value === 'object') {
          throw new Error(`Nested objects unsupported on HistoricalTable`);
        } else {
          return value;
        }
      },
      set: (obj: any, prop: any, value: any) => {
        if (this.isReservedFieldName(prop)) {
          throw new Error(`Cannot set reserved field '${prop}'`);
        }
        this.markModified(id, now, prop, value);
        return Reflect.set(obj, prop, value);
      },
      deleteProperty: (target: any, prop: any) => {
        throw new Error(`Deleting fields unsupported on HistoricalTable`);
      },
    };

    return new Proxy<Doc<T>>(row, handlers);
  }

  private markModified(id: Id<T>, now: number, fieldName: FieldName, value: any) {
    if (typeof value !== 'number') {
      throw new Error(`Cannot set field '${fieldName}' to ${JSON.stringify(value)}`);
    }
    if (this.fields.indexOf(fieldName) === -1) {
      throw new Error(`Mutating undeclared field name: ${fieldName}`);
    }
    const doc = this.data.get(id);
    if (!doc) {
      throw new Error(`Invalid ID: ${id}`);
    }
    const currentValue = doc[fieldName];
    if (currentValue === undefined || typeof currentValue !== 'number') {
      throw new Error(`Invalid value ${currentValue} for ${fieldName} in ${id}`);
    }
    if (currentValue !== value) {
      let historyRecord = this.history.get(id);
      if (!historyRecord) {
        historyRecord = {};
        this.history.set(id, historyRecord);
      }
      let history = historyRecord[fieldName];
      if (!history) {
        history = { initialValue: currentValue, samples: [] };
        historyRecord[fieldName] = history;
      }
      const { samples } = history;
      let inserted = false;
      if (samples.length > 0) {
        const last = samples[samples.length - 1];
        if (now < last.time) {
          throw new Error(`Server time moving backwards: ${now} < ${last.time}`);
        }
        if (now === last.time) {
          last.value = value;
          inserted = true;
        }
      }
      if (!inserted) {
        samples.push({ time: now, value });
      }
    }
    this.modified.add(id);
  }

  async save() {
    for (const id of this.deleted) {
      await this.db.delete(id);
    }
    let totalSize = 0;
    let buffersPacked = 0;
    for (const id of this.modified) {
      const row = this.data.get(id);
      if (!row) {
        throw new Error(`Invalid modified id: ${id}`);
      }
      if ('history' in row) {
        throw new Error(`Cannot save row with 'history' field`);
      }
      const sampleRecord = this.history.get(id);
      if (sampleRecord && Object.entries(sampleRecord).length > 0) {
        const packed = packSampleRecord(sampleRecord);
        (row as any).history = packed;
        totalSize += packed.byteLength;
        buffersPacked += 1;
      }
      // Somehow TypeScript isn't able to figure out that our
      // generic `Doc<T>` unifies with `replace()`'s type.
      await this.db.replace(id, row as any);
    }
    if (buffersPacked > 0) {
      console.debug(
        `Packed ${buffersPacked} buffers for ${this.table}, total size: ${(
          totalSize / 1024
        ).toFixed(2)}KiB`,
      );
    }
    this.modified.clear();
    this.deleted.clear();
  }
}

export function packSampleRecord(sampleMap: Record<FieldName, History>): ArrayBuffer {
  // TODO: This is very inefficient in space.
  // [ ] Switch to fixed point and quantize the floats.
  // [ ] Delta encode differences
  // [ ] Use an integer compressor: https://github.com/lemire/FastIntegerCompression.js/blob/master/FastIntegerCompression.js
  const s = JSON.stringify(sampleMap);
  const encoder = new TextEncoder();
  const bytes = encoder.encode(s);
  return bytes.buffer;
}

export function unpackSampleRecord(buffer: ArrayBuffer): Record<FieldName, History> {
  const decoder = new TextDecoder();
  const s = decoder.decode(buffer);
  return JSON.parse(s);
}
