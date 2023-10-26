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

// `HistoricalObject`s require the developer to pass in the
// field names that'll be tracked and sent down to the client.
//
// By default, the historical tracking will round each floating point
// value to an integer. The developer can specify more or less precision
// via the `precision` parameter: the table's quantization will maintain
// less than `1 / 2^precision` error. Note that higher precision values
// imply less error.
export type FieldConfig = Array<string | { name: string; precision: number }>;

// `HistoricalObject`s support at most 16 fields.
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

// `HistoricalObject` tracks a set of numeric fields over time and
// supports compressing the fields' histories into a binary buffer.
// This can be useful for continuous properties like position, where
// we'd want to smoothly replay their tick-by-tick progress at a high
// frame rate on the client.
//
// `HistoricalObject`s have a few limitations:
// - Documents in a historical can only have up to 16 fields.
// - The historical tracking only applies to a specified list of fields,
//   and these fields must match between the client and server.
export class HistoricalObject<T extends Record<string, number>> {
  startTs?: number;

  fieldConfig: NormalizedFieldConfig;

  data: T;
  history: Record<string, History> = {};

  constructor(fields: FieldConfig, initialValue: T) {
    if (fields.length >= MAX_FIELDS) {
      throw new Error(`HistoricalObject can have at most ${MAX_FIELDS} fields.`);
    }
    this.fieldConfig = normalizeFieldConfig(fields);
    this.checkShape(initialValue);
    this.data = initialValue;
  }

  historyLength() {
    return Object.values(this.history)
      .map((h) => h.samples.length)
      .reduce((a, b) => a + b, 0);
  }

  checkShape(data: any) {
    for (const [key, value] of Object.entries(data)) {
      if (!this.fieldConfig.find((f) => f.name === key)) {
        throw new Error(`Cannot set undeclared field '${key}'`);
      }
      if (typeof value !== 'number') {
        throw new Error(
          `HistoricalObject only supports numeric values, found: ${JSON.stringify(value)}`,
        );
      }
    }
  }

  update(now: number, data: T) {
    this.checkShape(data);
    for (const [key, value] of Object.entries(data)) {
      const currentValue = this.data[key];
      if (currentValue !== value) {
        let history = this.history[key];
        if (!history) {
          this.history[key] = history = { initialValue: currentValue, samples: [] };
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
    }
    this.data = data;
  }

  pack(): ArrayBuffer | null {
    if (this.historyLength() === 0) {
      return null;
    }
    return packSampleRecord(this.fieldConfig, this.history);
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
  sampleRecord: Record<string, History>,
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

  const out = {} as Record<string, History>;
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
