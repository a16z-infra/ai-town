import { WithoutSystemFields } from 'convex/server';
import { Doc, Id, TableNames } from '../_generated/dataModel';
import { DatabaseWriter } from '../_generated/server';
import { xxHash32 } from '../util/xxhash';
import { compressSigned, uncompressSigned } from '../util/FastIntegerCompression';
import {
  runLengthEncode,
  deltaEncode,
  quantize,
  deltaDecode,
  runLengthDecode,
  unquantize,
} from '../util/compression';

export type FieldName = string;

// `HistoricalTable`s require the developer to pass in the
// field names that'll be tracked and sent down to the client.
//
// By default, the historical tracking will round each floating point
// value to an integer. The developer can specify more or less precision
// via the `precision` parameter: the table's quantization will maintain
// less than `1 / 2^precision` error. Note that higher precision values
// imply less error.
export type FieldConfig = Array<string | { name: string; precision: number }>;

// `HistoricalTable`s support at most 16 fields.
const MAX_FIELDS = 16;

const PACKED_VERSION = 1;

type NormalizedFieldConfig = Array<{
  name: string;
  precision: number;
}>;

// The `History` structure represents the history of a continuous
// value over all bounded time. Each sample represents a line
// segment that's extends to the previous sample's time inclusively
// and to the sample's time non-inclusively. We track an `initialValue`
// that goes to `-\infty` up until the first sample, and the final
// sample persists out to `+\infty`.
// ```
//                    ^
//                 position
//                    |
// samples[0].value - |         x---------------o
//                    |
// samples[1].value - |                         x-------->
//                    |
// initialValue     - <---------o
//                    |
//                     ------------------------------> time
//                              |               |
//                      samples[0].time  samples[1].time
// ```
export type History = {
  initialValue: number;
  samples: Sample[];
};

export type Sample = {
  time: number;
  value: number;
};

// `HistoricalTable` is a more restricted version of `GameTable` that
// tracks its intermediate value throughout a step. This can be useful
// for continuous properties like position, where we'd want to smoothly
// replay their tick-by-tick progress at a high frame rate on the client.
//
// `HistoricalTable`s have a few limitations:
// - Other than the built in `_id` and `_creationTime`, they can only
//   have numeric values. Nested objects are not supported.
// - Documents in a historical can only have up to 16 fields.
// - The historical tracking only applies to a specified list of fields,
//   and these fields must match between the client and server.
export abstract class HistoricalTable<T extends TableNames> {
  abstract table: T;
  abstract db: DatabaseWriter;
  startTs?: number;

  fieldConfig: NormalizedFieldConfig;

  data: Map<Id<T>, Doc<T>> = new Map();
  modified: Set<Id<T>> = new Set();
  deleted: Set<Id<T>> = new Set();

  history: Map<Id<T>, Record<FieldName, History>> = new Map();

  constructor(fields: FieldConfig, rows: Doc<T>[]) {
    if (fields.length >= MAX_FIELDS) {
      throw new Error(`HistoricalTable can have at most ${MAX_FIELDS} fields.`);
    }
    this.fieldConfig = normalizeFieldConfig(fields);
    for (const row of rows) {
      this.checkShape(row);
      this.data.set(row._id, row);
    }
  }

  // Save the packed history buffers for all of the modified rows.
  abstract saveHistory(
    buffers: Record<Id<T>, { doc: WithoutSystemFields<Doc<T>>; history?: ArrayBuffer }>,
  ): Promise<void>;

  historyLength() {
    return [...this.history.values()]
      .flatMap((sampleRecord) => Object.values(sampleRecord))
      .map((h) => h.samples.length)
      .reduce((a, b) => a + b, 0);
  }

  checkShape(obj: any) {
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
    return key.startsWith('_');
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
    if (!this.fieldConfig.find((f) => f.name === fieldName)) {
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
    const buffers: Record<Id<T>, { doc: WithoutSystemFields<Doc<T>>; history?: ArrayBuffer }> = {};
    for (const [id, doc] of this.data.entries()) {
      const { _id, _creationTime, ...withoutSystemFields } = doc;
      buffers[id] = { doc: withoutSystemFields as any };
    }
    for (const id of this.modified) {
      const row = this.data.get(id);
      if (!row) {
        throw new Error(`Invalid modified id: ${id}`);
      }
      const sampleRecord = this.history.get(id);
      if (sampleRecord && Object.entries(sampleRecord).length > 0) {
        const packed = packSampleRecord(this.fieldConfig, sampleRecord);
        buffers[id].history = packed;
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
    await this.saveHistory(buffers);
    this.modified.clear();
    this.deleted.clear();
  }
}

// Pack (normalized) field configuration into a binary buffer.
//
// Format:
// ```
// [ u8 version ]
// for each field config:
//   [ u8 field name length ]
//   [ UTF8 encoded field name ]
//   [ u8 precision ]
// ```
function packFieldConfig(fields: NormalizedFieldConfig) {
  const out = new ArrayBuffer(1024);
  const outView = new DataView(out);
  let pos = 0;

  outView.setUint8(pos, PACKED_VERSION);
  pos += 1;

  const encoder = new TextEncoder();
  for (const fieldConfig of fields) {
    const name = encoder.encode(fieldConfig.name);

    outView.setUint8(pos, name.length);
    pos += 1;

    new Uint8Array(out, pos, name.length).set(name);
    pos += name.length;

    outView.setUint8(pos, fieldConfig.precision);
    pos += 1;
  }
  return out.slice(0, pos);
}

// Pack a document's sample record into a binary buffer.
//
// We encode each field's history with a few layered forms of
// compression:
// 1. Quantization: Turn each floating point number into an integer
//    by multiplying by 2^precision and then `Math.floor()`.
// 2. Delta encoding: Assume that values are continuous and don't
//    abruptly change over time, so their differences will be small.
//    This step turns the large integers from (1) into small ones.
// 3. Run length encoding (optional): Assume that some quantities
//    in the system will have constant velocity, so encode `k`
//    repetitions of `n` as `[k, n]`. If run length encoding doesn't
//    make (2) smaller, we skip it.
// 4. Varint encoding: Using FastIntegerCompression.js, we use a
//    variable length integer encoding that uses fewer bytes for
//    smaller numbers.
//
// Format:
// ```
// [ 4 byte xxhash of packed field config ]
//
// for each set field:
//   [ 0 0 0 useRLE? ]
//   [ u4 field number ]
//
//   Sample timestamps:
//   [ u64le initial timestamp ]
//   [ u16le timestamp buffer length ]
//   [ vint(RLE(delta(remaining timestamps)))]
//
//   Sample values:
//   [ u16le value buffer length ]
//   [ vint(RLE?(delta([initialValue, ...values])))]
// ```
export function packSampleRecord(
  fields: NormalizedFieldConfig,
  sampleRecord: Record<FieldName, History>,
): ArrayBuffer {
  const out = new ArrayBuffer(65536);
  const outView = new DataView(out);
  let pos = 0;

  const configHash = xxHash32(new Uint8Array(packFieldConfig(fields)));
  outView.setUint32(pos, configHash, true);
  pos += 4;

  for (let fieldNumber = 0; fieldNumber < fields.length; fieldNumber += 1) {
    const { name, precision } = fields[fieldNumber];
    const history = sampleRecord[name];
    if (!history || history.samples.length === 0) {
      continue;
    }

    const timestamps = history.samples.map((s) => Math.floor(s.time));
    const initialTimestamp = timestamps[0];
    const encodedTimestamps = runLengthEncode(deltaEncode(timestamps.slice(1), initialTimestamp));
    const compressedTimestamps = compressSigned(encodedTimestamps);
    if (compressedTimestamps.byteLength >= 1 << 16) {
      throw new Error(`Compressed buffer too long: ${compressedTimestamps.byteLength}`);
    }

    const values = [history.initialValue, ...history.samples.map((s) => s.value)];
    const quantized = quantize(values, precision);
    const deltaEncoded = deltaEncode(quantized);
    const runLengthEncoded = runLengthEncode(deltaEncoded);

    // Decide if we're going to run length encode the values based on whether
    // it actually made the encoded buffer smaller.
    const useRLE = runLengthEncoded.length < deltaEncoded.length;
    let fieldHeader = fieldNumber;
    if (useRLE) {
      fieldHeader |= 1 << 4;
    }

    const encoded = useRLE ? runLengthEncoded : deltaEncoded;
    const compressed = compressSigned(encoded);
    if (compressed.byteLength >= 1 << 16) {
      throw new Error(`Compressed buffer too long: ${compressed.byteLength}`);
    }

    outView.setUint8(pos, fieldHeader);
    pos += 1;

    outView.setBigUint64(pos, BigInt(initialTimestamp), true);
    pos += 8;

    outView.setUint16(pos, compressedTimestamps.byteLength, true);
    pos += 2;

    new Uint8Array(out, pos, compressedTimestamps.byteLength).set(
      new Uint8Array(compressedTimestamps),
    );
    pos += compressedTimestamps.byteLength;

    outView.setUint16(pos, compressed.byteLength, true);
    pos += 2;

    new Uint8Array(out, pos, compressed.byteLength).set(new Uint8Array(compressed));
    pos += compressed.byteLength;
  }

  return out.slice(0, pos);
}

export function unpackSampleRecord(fields: FieldConfig, buffer: ArrayBuffer) {
  const view = new DataView(buffer);
  let pos = 0;

  const normalizedFields = normalizeFieldConfig(fields);
  const expectedConfigHash = xxHash32(new Uint8Array(packFieldConfig(normalizedFields)));

  const configHash = view.getUint32(pos, true);
  pos += 4;

  if (configHash !== expectedConfigHash) {
    throw new Error(`Config hash mismatch: ${configHash} !== ${expectedConfigHash}`);
  }

  const out = {} as Record<FieldName, History>;
  while (pos < buffer.byteLength) {
    const fieldHeader = view.getUint8(pos);
    pos += 1;

    const fieldNumber = fieldHeader & 0b00001111;
    const useRLE = (fieldHeader & (1 << 4)) !== 0;
    const fieldConfig = normalizedFields[fieldNumber];
    if (!fieldConfig) {
      throw new Error(`Invalid field number: ${fieldNumber}`);
    }

    const initialTimestamp = Number(view.getBigUint64(pos, true));
    pos += 8;

    const compressedTimestampLength = view.getUint16(pos, true);
    pos += 2;

    const compressedTimestampBuffer = buffer.slice(pos, pos + compressedTimestampLength);
    pos += compressedTimestampLength;

    const timestamps = [
      initialTimestamp,
      ...deltaDecode(
        runLengthDecode(uncompressSigned(compressedTimestampBuffer)),
        initialTimestamp,
      ),
    ];

    const compressedLength = view.getUint16(pos, true);
    pos += 2;

    const compressedBuffer = buffer.slice(pos, pos + compressedLength);
    pos += compressedLength;

    const encoded = uncompressSigned(compressedBuffer);
    const deltaEncoded = useRLE ? runLengthDecode(encoded) : encoded;
    const quantized = deltaDecode(deltaEncoded);
    const values = unquantize(quantized, fieldConfig.precision);

    if (timestamps.length + 1 !== values.length) {
      throw new Error(`Invalid sample record: ${timestamps.length} + 1 !== ${values.length}`);
    }
    const initialValue = values[0];
    const samples = [];
    for (let i = 0; i < timestamps.length; i++) {
      const time = timestamps[i];
      const value = values[i + 1];
      samples.push({ value, time });
    }
    const history = { initialValue, samples };
    out[fieldConfig.name] = history;
  }
  return out;
}

function normalizeFieldConfig(fields: FieldConfig): NormalizedFieldConfig {
  return fields.map((f) => (typeof f === 'string' ? { name: f, precision: 0 } : f));
}
