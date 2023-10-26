import {
  deltaDecode,
  deltaEncode,
  quantize,
  runLengthDecode,
  runLengthEncode,
  unquantize,
} from './compression';

describe('compression', () => {
  test('quantize (approximately) roundtrips', () => {
    const precisions = [-1, 0, 1, 4, 8];
    const datasets = [
      // Random samples from [-2^32, 2^32]
      [
        -2331813745.435792, 4165391630.4586916, 2508162414.104561, -3815881222.355323,
        3182227671.241928, -2091141304.634983, -3454731809.638463, 1539778764.4030657,
        3723556916.971266, 4014694279.989772, 1165331218.5641785, -4209073662.9696226,
        -3837962324.440032, 2145014827.7712336, -631662265.4694176, 4116219084.927844,
      ],

      // [-2^16, 2^16]
      [
        -29109.399926296363, 24836.163035466132, 59528.43800645282, 5706.0239888604265,
        61844.35496542655, -46030.9434605508, 10288.243500897894, -48623.38350764701,
        -62182.09862667126, 20639.535833017246, -7691.974206406943, -44505.52704528734,
        -28755.644095767944, 38244.45061335398, -14135.607864461621, -14792.956311113172,
      ],

      // [-2^8, 2^8]
      [
        -67.02672070745166, -117.41024397385388, -243.41065459675673, 160.3825635900851,
        191.79026087008378, 89.76668679513216, -10.719096486254784, 205.25021491717217,
        -68.83096015839055, 44.321620651742364, -203.44266714551503, -19.734642986127426,
        159.0214530150044, 72.07459707399431, -242.49909539291787, -246.50759645751867,
      ],

      // [-2^4, 2^4]
      [
        14.993015665565746, -14.206729228453774, -1.503306544783097, -8.618521795982875,
        15.14825900944064, -0.7561338814569538, -4.372631369200661, -14.296889398516797,
        -0.7673738652041102, 5.880288329769968, -0.12246711347653516, 2.6074790469727773,
        -1.0378494460674226, -5.395209965702431, -0.9218194118035932, -1.8677599340100492,
      ],
    ];
    for (const values of datasets) {
      for (const precision of precisions) {
        const maxError = Math.max(1 / (1 << precision), 1e-8);
        const roundTripped = unquantize(quantize(values, precision), precision);
        expect(values.length).toEqual(roundTripped.length);
        for (let i = 0; i < values.length; i++) {
          const value = values[i];
          const roundtrippedValue = roundTripped[i];
          expect(Math.abs(value - roundtrippedValue)).toBeLessThanOrEqual(maxError);
        }
      }
    }
  });

  test('delta encode roundtrips', () => {
    const data = [
      41476, -13450, -59451, -65102, -32493, -39078, -53884, 40784, 32081, -40422, 43421, 17184,
      23042, 27548, -61705, -45215, -39037, 61611, -43945, 28001, -64417, -54192, -56325, 24401,
      17735, 37464, -39842, 54964, 14469, -47248, -39450,
    ];
    const roundtripped = deltaDecode(deltaEncode(data));
    expect(data).toEqual(roundtripped);
  });

  test('run length encode roundtrips', () => {
    const datasets = [
      // No repetitions.
      [
        41476, -13450, -59451, -65102, -32493, -39078, -53884, 40784, 32081, -40422, 43421, 17184,
        23042, 27548, -61705, -45215, -39037, 61611, -43945, 28001, -64417, -54192, -56325, 24401,
        17735, 37464, -39842, 54964, 14469, -47248, -39450,
      ],
      // All repetitions.
      [10, 10, 10, 10, 10, 10],
      // Just one value.
      [11],
      // Repetitions in the middle of unique values.
      [1, 2, 3, 4, 4, 4, 4, 5, 6, 7],
    ];
    for (const data of datasets) {
      const roundtripped = runLengthDecode(runLengthEncode(data));
      expect(data).toEqual(roundtripped);
    }
  });
});
