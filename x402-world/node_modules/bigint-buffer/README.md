# 💪🔢 bigint-buffer: Buffer Utilities for TC39 BigInt Proposal 
[![NPM Package](https://img.shields.io/npm/v/bigint-buffer.svg?style=flat-square)](https://www.npmjs.org/package/bigint-buffer)
[![Build Status](https://img.shields.io/travis/com/no2chem/bigint-buffer.svg?branch=master&style=flat-square)](https://travis-ci.com/no2chem/bigint-buffer)
[![Coverage Status](https://img.shields.io/coveralls/no2chem/bigint-buffer.svg?style=flat-square)](https://coveralls.io/r/no2chem/bigint-buffer)
![node](https://img.shields.io/node/v/bigint-buffer.svg?style=flat-square)

[bigint-buffer](https://www.npmjs.org/package/bigint-buffer) is a utility converts [TC39 Proposed BigInts](https://github.com/tc39/proposal-bigint) to and from buffers. This utility is necessary because BigInts, as proposed, do not support direct conversion between Buffers (or UInt8Arrays), but rather require conversion from buffers to hexadecimal strings then to BigInts, which is suboptimal. This utility includes N-API bindings, so under node, conversion is performed without generating a hexadecimal string. In the browser, normal string conversion is used.

# Why use BigInts?

BigInts are currently a stage 3 proposal, supported in Node 10 and V8 v6.7. BigInts are primitive arbitrary precision integers, overcoming the limitations of the number type in javascript, which only supports up to 53 bits of precision. 

In many applications, manipulating 64, 128 or even 256 bit numbers is quite common. For example, database identifiers are often 128 bits, and hashes are often 256 bits (If you're looking for hashing support, try out [bigint-hash](https://github.com/no2chem/bigint-hash)). Before BigInts, manipulating these numbers safely required either allocating a Buffer or UInt8Arrays, which is quite expensive compared to a number, since Buffers are allocated on the heap. 

BigInts solve this problem by introducing a primitive that can hold
arbitrary precision integers, reducing memory pressure and allowing
the runtime to better optimize arithmetic operations. This results in significant performance improvements - 10x-100x for simple equality comparisons (using `===` vs `Buffer.compare()`):

```
Buffer equality comparison: 11916844±4.23% ops/s 83.91±17.293 ns/op (91 runs)
bigint equality comparison: 798024851±0.29% ops/s 1.25±0.017 ns/op (91 runs)
```

Before BigInts, you probably used a library such as the widely used [bn.js](https://www.npmjs.com/package/bn.js).
bn.js fares a little better than a plain Buffer, but is still 5-10x slower than the bigint:
```
BN equality comparison: 73255774±0.67% ops/s 13.65±0.442 ns/op (89 runs)
```

bigints are also much better with arithmetic, here are the results compared to BN for multiplying two
128-bit integers, yielding a 4x improvement:
```
BN multiply: 4763236±0.49% ops/s 209.94±5.111 ns/op (93 runs)
bigint multiply: 15268666±0.92% ops/s 65.49±2.938 ns/op (92 runs)
```

# So what's the problem?

BigInts, unfortunately lack an efficient way to be converted back and forth between buffers. When dealing with serialized data or legacy node code, you'll often want to generate a BigInt from a buffer, or convert a BigInt to a Buffer in order to send a BigInt over the wire.

Currently, the only method to generate a new BigInt is with the BigInt constructor. Unfortunately, it doesn't support Buffers, though it may in the future:

```
> BigInt(Buffer.from([1]))
SyntaxError: Cannot convert  to a BigInt
```

Instead, you need to convert the Buffer to a hexadecimal string of the correct format. For example:

```
> BigInt(`0x${buf.toString('hex')}`);
1n
```

These conversions are not only quite expensive, but obviate a lot of the performance gains we get from BigInts. For example, on a large buffer, this conversion can take over 100x the time to do a comparison:
```
bigint from hex string from buffer (huge): 1230607±1.02% ops/s 812.61±40.013 ns/op (89 runs)
```

# And... bigint-buffer helps how?

bigint-buffer introduces four functions for conversion between buffers and bigints. A small example follows:
```typescript
import {toBigIntBE, toBigIntLE, toBufferBE, toBufferLE} from 'bigint-buffer';

// Get a big endian buffer of the given width
toBufferBE(0xdeadbeefn, 8);
// ↪ <Buffer 00 00 00 00 de ad be ef>

// Get a little endian buffer of the given width
toBufferLE(0xdeadbeefn, 8);
// ↪ <Buffer ef be ad de 00 00 00 00>

// Get a BigInt from a buffer in big endian format
toBigIntBE(Buffer.from('deadbeef', 'hex'));
// ↪ 3735928559n (0xdeadbeefn)

// Get a BigInt from a buffer in little endian format
toBigIntLE(Buffer.from('deadbeef', 'hex'));
// ↪ 4022250974n (0xefbeadd0en)
```

bigint-buffer uses N-API native bindings to perform the conversion efficiently without generating the
immediate hex strings necessary in pure javascript. This results in a significant performance increase,
about 2x for small buffer to bigint conversions, and 8x better than BN:

```
BN to buffer (small): 981703±68.30% ops/s 1018.64±3194.648 ns/op (81 runs)
bigint from hex string from buffer (small): 2804915±5.00% ops/s 356.52±85.371 ns/op (88 runs)
LE bigint-buffer ToBigInt (small): 5932704±1.62% ops/s 168.56±12.971 ns/op (87 runs)
```

And about 3.3x for bigint to buffer conversions, and 17x better than BN:
```
BN to buffer (large): 339437±2.85% ops/s 2946.06±385.504 ns/op (81 runs)
BE bigint to hex string to buffer (large): 1714292±1.35% ops/s 583.33±37.995 ns/op (90 runs)
BE bigint-buffer to buffer (large, truncated): 5977218±4.68% ops/s 167.30±37.284 ns/op (87 runs)
```

You can run the benchmarks by running `npm run benchmark`.

# Typescript Support

bigint-buffer supplies typescript bindings, but BigInts are still not supported in typescript, though
a pull request has been opened, so support should be coming soon. If you are using typescript,
@calebsander has put up a pull request and the instructions in [this post](https://github.com/Microsoft/TypeScript/issues/15096#issuecomment-419654748).

# Install

Add bigint-buffer to your project with:

> `npm install bigint-buffer`

# Documentation

Basic API documentation can be found [here](https://no2chem.github.io/bigint-buffer/). Note that v1.0.0 changes
the name of the original functions to meet style guidelines.

# Benchmarks

Benchmarks can be run by executing `npm run benchmark` from the package directory.
