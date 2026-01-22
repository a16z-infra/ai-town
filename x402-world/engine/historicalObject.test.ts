import { History, packSampleRecord, unpackSampleRecord } from './historicalObject';

describe('HistoricalObject', () => {
  test('pack sample record roundtrips', () => {
    let data: Record<string, History> = {
      x: {
        initialValue: 0,
        samples: [
          { time: 1696021246740, value: 1 },
          { time: 1696021246756, value: 2 },
          { time: 1696021246772, value: 3 },
          { time: 1696021246788, value: 4 },
        ],
      },
      y: {
        initialValue: 140.2,
        samples: [
          { time: 1696021246740, value: 169.7 },
          { time: 1696021246756, value: 237.59 },
          { time: 1696021246772, value: 344.44 },
          { time: 1696021246788, value: 489.13 },
        ],
      },
    };
    const fields = [
      { name: 'x', precision: 4 },
      { name: 'y', precision: 4 },
    ];
    const packed = packSampleRecord(fields, data);
    const unpacked = unpackSampleRecord(fields, packed);
    const maxError = Math.max(1 / (1 << 4), 1e-8);

    expect(Object.keys(data)).toEqual(Object.keys(unpacked));
    for (const key of Object.keys(data)) {
      const { initialValue, samples } = data[key];
      const { initialValue: unpackedInitialValue, samples: unpackedSamples } = unpacked[key];
      expect(Math.abs(initialValue - unpackedInitialValue)).toBeLessThanOrEqual(maxError);
      expect(samples.length).toEqual(unpackedSamples.length);
      for (let i = 0; i < samples.length; i++) {
        const sample = samples[i];
        const unpackedSample = unpackedSamples[i];
        expect(sample.time).toEqual(unpackedSample.time);
        expect(Math.abs(sample.value - unpackedSample.value)).toBeLessThanOrEqual(maxError);
      }
    }
  });
});
