[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]
<br />
[![code-style-prettier][code-style-prettier-image]][code-style-prettier-url]

[code-style-prettier-image]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square
[code-style-prettier-url]: https://github.com/prettier/prettier
[npm-downloads-image]: https://img.shields.io/npm/dm/@solana/codecs-numbers?style=flat
[npm-image]: https://img.shields.io/npm/v/@solana/codecs-numbers?style=flat
[npm-url]: https://www.npmjs.com/package/@solana/codecs-numbers

# @solana/codecs-numbers

This package contains codecs for numbers of different sizes and endianness. It can be used standalone, but it is also exported as part of Kit [`@solana/kit`](https://github.com/anza-xyz/kit/tree/main/packages/kit).

This package is also part of the [`@solana/codecs` package](https://github.com/anza-xyz/kit/tree/main/packages/codecs) which acts as an entry point for all codec packages as well as for their documentation.

## Integer codecs

This package provides ten codecs of five different byte sizes for integers. Five of them store unsigned integers and the other five store signed integers.

```ts
// Unsigned integers.
getU8Codec().encode(42); // 0x2a
getU16Codec().encode(42); // 0x2a00
getU32Codec().encode(42); // 0x2a000000
getU64Codec().encode(42); // 0x2a00000000000000
getU128Codec().encode(42); // 0x2a000000000000000000000000000000

// Signed integers.
getI8Codec().encode(-42); // 0xd6
getI16Codec().encode(-42); // 0xd6ff
getI32Codec().encode(-42); // 0xd6ffffff
getI64Codec().encode(-42); // 0xd6ffffffffffffff
getI128Codec().encode(-42); // 0xd6ffffffffffffffffffffffffffffff
```

By default, integers are stored using little endianness but you may change this behaviour via the `endian` option. This option is available for every codec that uses more than a single byte.

```ts
// Big-endian unsigned integers.
getU16Codec({ endian: Endian.Big }).encode(42); // 0x002a
getU32Codec({ endian: Endian.Big }).encode(42); // 0x0000002a
getU64Codec({ endian: Endian.Big }).encode(42); // 0x000000000000002a
getU128Codec({ endian: Endian.Big }).encode(42); // 0x0000000000000000000000000000002a

// Big-endian signed integers.
getI16Codec({ endian: Endian.Big }).encode(-42); // 0xffd6
getI32Codec({ endian: Endian.Big }).encode(-42); // 0xffffffd6
getI64Codec({ endian: Endian.Big }).encode(-42); // 0xffffffffffffffd6
getI128Codec({ endian: Endian.Big }).encode(-42); // 0xffffffffffffffffffffffffffffffd6
```

All integer codecs are of type `Codec<number>` except for the `u64`, `u128`, `i64` and `i128` codecs which are of type `Codec<number | bigint, bigint>`. This means we can provide either a `number` of a `bigint` value to encode but the decoded value will always be a `bigint`. This is because JavaScript's native `number` type does not support numbers larger than `2^53 - 1` and these large integer codecs have the potential to go over that value.

```ts
const bytesFromNumber = getU64Codec().encode(42);
getU64Codec().decode(bytesFromNumber); // BigInt(42)

// OR
const bytesFromBigInt = getU64Codec().encode(BigInt(42));
getU64Codec().decode(bytesFromBigInt); // BigInt(42)
```

Finally, for each of these `get*Codec` functions, separate `get*Encoder` and `get*Decoder` functions exist to focus on only one side of the serialization and tree-shake the rest of the functions away.

```ts
const bytes = getU8Encoder().encode(42);
const value = getU8Decoder().decode(bytes);
```

## Decimal number codecs

This package also provides two codecs for floating numbers. One using 32 bits and one using 64 bits.

```ts
getF32Codec().encode(-1.5); // 0x0000c0bf
getF64Codec().encode(-1.5); // 0x000000000000f8bf
```

Similarly to the integer codecs, they are stored in little-endian by default but may be stored in big-endian using the `endian` option.

```ts
getF32Codec({ endian: Endian.Big }).encode(-1.5); // 0xbfc00000
getF64Codec({ endian: Endian.Big }).encode(-1.5); // 0xbff8000000000000
```

Note that based on the selected codec, some of the precision of the number you are encoding may be lost when decoding it. For instance, when storing `3.1415` using a `f32` codec, you will not get the exact same number back.

```ts
const bytes = getF32Codec().encode(3.1415); // 0x560e4940
const value = getF32Codec().decode(bytes); // 3.1414999961853027 !== 3.1415
```

As usual, separate encoder and decoder functions are available for these codecs.

```ts
getF32Encoder().encode(-1.5);
getF32Decoder().decode(new Uint8Array([...]));

getF64Encoder().encode(-1.5);
getF64Decoder().decode(new Uint8Array([...]));
```

## Short u16 codec

This last integer codec is less common `VariableSizeCodec` that stores an unsigned integer using between 1 to 3 bytes depending on the value of that integer.

```ts
const bytes = getShortU16Codec().encode(42); // 0x2a
const value = getShortU16Codec().decode(bytes); // 42
```

If the provided integer is equal to or lower than `0x7f`, it will be stored as-is, using a single byte. However, if the integer is above `0x7f`, then the top bit is set and the remaining value is stored in the next bytes. Each byte follows the same pattern until the third byte. The third byte, if needed, uses all 8 bits to store the last byte of the original value.

In other words, this codec provides an extendable size that adapts based on the integer. In the illustration below, you can see the `0` and `1` byte flags for each scenario as well as the available bits to store the integer marked with `X`.

```
0XXXXXXX <- From 0 to 127.
1XXXXXXX 0XXXXXXX <- From 128 to 16,383.
1XXXXXXX 1XXXXXXX XXXXXXXX <- From 16,384 to 4,194,303.
```

This codec is mainly used internally when encoding and decoding Solana transactions.

Separate encoder and decoder functions are also available via `getShortU16Encoder` and `getShortU16Decoder` respectively.

---

To read more about the available codecs and how to use them, check out the documentation of the main [`@solana/codecs` package](https://github.com/anza-xyz/kit/tree/main/packages/codecs).
