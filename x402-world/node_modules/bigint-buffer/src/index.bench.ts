
import * as benchmark from 'benchmark';

import {toBigIntBE, toBigIntLE, toBufferBE, toBufferLE} from './index';

const BN = require('bn.js');


// This file contains the benchmark test suite. It includes the benchmark and
// some lightweight boilerplate code for running benchmark.js. To
// run the benchmarks, execute `npm run benchmark` from the package directory.
const suite = new benchmark.Suite();

interface BenchmarkRun {
  name: string;
  hz: number;
  stats: benchmark.Stats;
}

// Tests the performance of a no-op.
suite.add('no-op', () => {});

// Test small strings (unaligned)
const smallHex = 'deadbeef';
const smallString = `0x${smallHex}`;
const smallBuf: Buffer = Buffer.from(smallHex, 'hex');
suite.add('bigint from hex string (small)', () => {
  return BigInt(smallString);
});
suite.add('bigint from hex string from buffer (small)', () => {
  return BigInt(`0x${smallBuf.toString('hex')}`);
});
suite.add('BN from hex string from buffer (small)', () => {
  return new BN(smallBuf.toString('hex'), 16);
});
suite.add('LE bigint-buffer ToBigInt (small)', () => {
  return toBigIntLE(smallBuf);
});
suite.add('BE bigint-buffer ToBigInt (small)', () => {
  return toBigIntBE(smallBuf);
});

// Test mid strings (aligned)
const midHex = 'badc0ffee0ddf00d';
const midString = `0x${midHex}`;
const midBuf: Buffer = Buffer.from(midHex, 'hex');
suite.add('bigint from hex string (mid, aligned)', () => {
  return BigInt(midString);
});
suite.add('bigint from hex string from buffer (mid, aligned)', () => {
  return BigInt(`0x${midBuf.toString('hex')}`);
});
suite.add('BN from hex string from buffer (mid, aligned)', () => {
  return new BN(midBuf.toString('hex'), 16);
});
suite.add('LE bigint-buffer ToBigInt (mid, aligned)', () => {
  return toBigIntLE(midBuf);
});
suite.add('BE bigint-buffer ToBigInt (mid, aligned)', () => {
  return toBigIntBE(midBuf);
});

// Test huge strings
const hugeHex =
    'badc0ffee0ddf00dbadc0ffee0ddf00dbadc0ffee0ddf00dbadc0ffee0ddf00dbadc0ffee0ddf00dbadc0ffee0ddf00d';
const hugeString = `0x${hugeHex}`;
const hugeBuf: Buffer = Buffer.from(hugeHex, 'hex');
suite.add('bigint from hex string (huge)', () => {
  return BigInt(hugeString);
});
suite.add('bigint from hex string from buffer (huge)', () => {
  return BigInt(`0x${hugeBuf.toString('hex')}`);
});
suite.add('BN from hex string from buffer (huge)', () => {
  return new BN(hugeBuf.toString('hex'), 16);
});
suite.add('LE bigint-buffer ToBigInt (huge)', () => {
  return toBigIntLE(hugeBuf);
});
suite.add('BE bigint-buffer ToBigInt (huge)', () => {
  return toBigIntBE(hugeBuf);
});

const bigIntToBufferWithStringBE = (int: bigint, width: number): Buffer => {
  const hex = int.toString(16);
  return Buffer.from(hex.padStart(width * 2, '0').slice(0, width * 2), 'hex');
};

const bigIntToBufferWithStringLE = (int: bigint, width: number): Buffer => {
  const hex = int.toString(16);
  const buffer =
      Buffer.from(hex.padStart(width * 2, '0').slice(0, width * 2), 'hex');
  buffer.reverse();
  return buffer;
};

// Test small toBuffer
const smallValue = 12345678n;
suite.add('LE bigint to hex string to buffer (small)', () => {
  return bigIntToBufferWithStringLE(smallValue, 8);
});

suite.add('BE bigint to hex string to buffer (small)', () => {
  return bigIntToBufferWithStringBE(smallValue, 8);
});

const bnSmallValue = new BN('12345678', 10);
suite.add('BN to buffer (small)', () => {
  return bnSmallValue.toBuffer(8);
});

suite.add('LE bigint-buffer to buffer (small)', () => {
  return toBufferLE(smallValue, 8);
});

suite.add('BE bigint-buffer to buffer (small)', () => {
  return toBufferBE(smallValue, 8);
});


// Test large toBuffer
const largeValue =
    0xbadc0ffee0ddf00dbadc0ffee0ddf00dbadc0ffee0ddf00dbadc0ffee0ddf00dbadc0ffee0ddf00dbadc0ffee0ddf00dn;
suite.add('LE bigint to hex string to buffer (large)', () => {
  return bigIntToBufferWithStringLE(largeValue, 24);
});

suite.add('BE bigint to hex string to buffer (large)', () => {
  return bigIntToBufferWithStringBE(largeValue, 24);
});

const bnLargeValue = new BN(
    'badc0ffee0ddf00dbadc0ffee0ddf00dbadc0ffee0ddf00dbadc0ffee0ddf00dbadc0ffee0ddf00dbadc0ffee0ddf00d',
    16);
suite.add('BN to buffer (large)', () => {
  return bnLargeValue.toBuffer(24);
});

suite.add('LE bigint-buffer to buffer (large)', () => {
  return toBufferLE(largeValue, 24);
});

suite.add('BE bigint-buffer to buffer (large)', () => {
  return toBufferBE(largeValue, 24);
});

suite.add('LE bigint to hex string to buffer (large)', () => {
  return bigIntToBufferWithStringLE(largeValue, 8);
});

suite.add('BE bigint to hex string to buffer (large)', () => {
  return bigIntToBufferWithStringBE(largeValue, 8);
});

suite.add('LE bigint-buffer to buffer (large, truncated)', () => {
  return toBufferLE(largeValue, 8);
});

suite.add('BE bigint-buffer to buffer (large, truncated)', () => {
  return toBufferBE(largeValue, 8);
});

const b1 = Buffer.from('0123456789ABCDEF0123456789ABCDEF', 'hex');
const b2 = Buffer.from('0123456789ABCDEF0123456789ABCDEF', 'hex');
const bn1 = new BN('0123456789ABCDEF0123456789ABCDEF', 'hex');
const bn2 = new BN('0123456789ABCDEF0123456789ABCDEF', 'hex');
const n1 = 0x0123456789ABCDEF0123456789ABCDEFn;
const n2 = 0x0123456789ABCDEF0123456789ABCDEFn;
suite.add('Buffer equality comparison', () => {
  return b1.compare(b2) === 0;
});

suite.add('BN equality comparison', () => {
  return bn1.eq(bn2);
});

suite.add('bigint equality comparison', () => {
  return n1 === n2;
});

suite.add('BN multiply', () => {
  return bn1.mul(bn2);
});

suite.add('bigint multiply', () => {
  return n1 * n2;
});

//#endregion


// Reporter for each benchmark
suite.on('cycle', (event: benchmark.Event) => {
  const benchmarkRun: BenchmarkRun = event.target as BenchmarkRun;
  const stats = benchmarkRun.stats as benchmark.Stats;
  const meanInNanos = (stats.mean * 1000000000).toFixed(2);
  const stdDevInNanos = (stats.deviation * 1000000000).toFixed(3);
  const runs = stats.sample.length;
  const ops = benchmarkRun.hz.toFixed(benchmarkRun.hz < 100 ? 2 : 0);
  const err = stats.rme.toFixed(2);

  console.log(`${benchmarkRun.name}: ${ops}±${err}% ops/s ${meanInNanos}±${
      stdDevInNanos} ns/op (${runs} run${runs === 0 ? '' : 's'})`);
});

// Runs the test suite
suite.run();