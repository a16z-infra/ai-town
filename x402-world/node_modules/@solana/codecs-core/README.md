[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]
[![semantic-release][semantic-release-image]][semantic-release-url]
<br />
[![code-style-prettier][code-style-prettier-image]][code-style-prettier-url]

[code-style-prettier-image]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square
[code-style-prettier-url]: https://github.com/prettier/prettier
[npm-downloads-image]: https://img.shields.io/npm/dm/@solana/codecs-core/rc.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@solana/codecs-core/rc.svg?style=flat
[npm-url]: https://www.npmjs.com/package/@solana/codecs-core/v/rc
[semantic-release-image]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[semantic-release-url]: https://github.com/semantic-release/semantic-release

# @solana/codecs-core

This package contains the core types and functions for encoding and decoding data structures on Solana. It can be used standalone, but it is also exported as part of the Solana JavaScript SDK [`@solana/web3.js@rc`](https://github.com/solana-labs/solana-web3.js/tree/master/packages/library).

This package is also part of the [`@solana/codecs` package](https://github.com/solana-labs/solana-web3.js/tree/master/packages/codecs) which acts as an entry point for all codec packages as well as for their documentation.

## Composing codecs

The easiest way to create your own codecs is to compose the [various codecs](https://github.com/solana-labs/solana-web3.js/tree/master/packages/codecs) offered by this library. For instance, here’s how you would define a codec for a `Person` object that contains a `name` string attribute and an `age` number stored in 4 bytes.

```ts
type Person = { name: string; age: number };
const getPersonCodec = (): Codec<Person> =>
    getStructCodec([
        ['name', addCodecSizePrefix(getUtf8Codec(), getU32Codec())],
        ['age', getU32Codec()],
    ]);
```

This function returns a `Codec` object which contains both an `encode` and `decode` function that can be used to convert a `Person` type to and from a `Uint8Array`.

```ts
const personCodec = getPersonCodec();
const bytes = personCodec.encode({ name: 'John', age: 42 });
const person = personCodec.decode(bytes);
```

There is a significant library of composable codecs at your disposal, enabling you to compose complex types. You may be interested in the documentation of these other packages to learn more about them:

-   [`@solana/codecs-numbers`](https://github.com/solana-labs/solana-web3.js/tree/master/packages/codecs-numbers) for number codecs.
-   [`@solana/codecs-strings`](https://github.com/solana-labs/solana-web3.js/tree/master/packages/codecs-strings) for string codecs.
-   [`@solana/codecs-data-structures`](https://github.com/solana-labs/solana-web3.js/tree/master/packages/codecs-data-structures) for many data structure codecs such as objects, arrays, tuples, sets, maps, enums, discriminated unions, booleans, etc.
-   [`@solana/options`](https://github.com/solana-labs/solana-web3.js/tree/master/packages/options) for a Rust-like `Option` type and associated codec.

You may also be interested in some of the helpers of this `@solana/codecs-core` library such as `transformCodec`, `fixCodecSize` or `reverseCodec` that create new codecs from existing ones.

Note that all of these libraries are included in the [`@solana/codecs` package](https://github.com/solana-labs/solana-web3.js/tree/master/packages/codecs) as well as the main `@solana/web3.js` package for your convenience.

## Composing encoders and decoders

Whilst Codecs can both encode and decode, it is possible to only focus on encoding or decoding data, enabling the unused logic to be tree-shaken. For instance, here’s our previous example using Encoders only to encode a `Person` type.

```ts
const getPersonEncoder = (): Encoder<Person> =>
    getStructEncoder([
        ['name', addEncoderSizePrefix(getUtf8Encoder(), getU32Encoder())],
        ['age', getU32Encoder()],
    ]);

const bytes = getPersonEncoder().encode({ name: 'John', age: 42 });
```

The same can be done for decoding the `Person` type by using Decoders like so.

```ts
const getPersonDecoder = (): Decoder<Person> =>
    getStructDecoder([
        ['name', addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder())],
        ['age', getU32Decoder()],
    ]);

const person = getPersonDecoder().decode(bytes);
```

## Combining encoders and decoders

Separating Codecs into Encoders and Decoders is particularly good practice for library maintainers as it allows their users to tree-shake any of the encoders and/or decoders they don’t need. However, we may still want to offer a codec helper for users who need both for convenience.

That’s why this library offers a `combineCodec` helper that creates a `Codec` instance from a matching `Encoder` and `Decoder`.

```ts
const getPersonCodec = (): Codec<Person> => combineCodec(getPersonEncoder(), getPersonDecoder());
```

This means library maintainers can offer Encoders, Decoders and Codecs for all their types whilst staying efficient and tree-shakeable. In summary, we recommend the following pattern when creating codecs for library types.

```ts
type MyType = /* ... */;
const getMyTypeEncoder = (): Encoder<MyType> => { /* ... */ };
const getMyTypeDecoder = (): Decoder<MyType> => { /* ... */ };
const getMyTypeCodec = (): Codec<MyType> =>
    combineCodec(getMyTypeEncoder(), getMyTypeDecoder());
```

## Different From and To types

When creating codecs, the encoded type is allowed to be looser than the decoded type. A good example of that is the u64 number codec:

```ts
const u64Codec: Codec<number | bigint, bigint> = getU64Codec();
```

As you can see, the first type parameter is looser since it accepts numbers or big integers, whereas the second type parameter only accepts big integers. That’s because when _encoding_ a u64 number, you may provide either a `bigint` or a `number` for convenience. However, when you decode a u64 number, you will always get a `bigint` because not all u64 values can fit in a JavaScript `number` type.

```ts
const bytes = u64Codec.encode(42);
const value = u64Codec.decode(bytes); // BigInt(42)
```

This relationship between the type we encode “From” and decode “To” can be generalized in TypeScript as `To extends From`.

Here’s another example using an object with default values. You can read more about the `transformEncoder` helper below.

```ts
type Person = { name: string, age: number };
type PersonInput = { name: string, age?: number };

const getPersonEncoder = (): Encoder<PersonInput> =>
    transformEncoder(
        getStructEncoder([
            ['name', addEncoderSizePrefix(getUtf8Encoder(), getU32Encoder())],
            ['age', getU32Encoder()],
        ]),
        input => { ...input, age: input.age ?? 42 }
    );

const getPersonDecoder = (): Decoder<Person> =>
    getStructDecoder([
        ['name', addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder())],
        ['age', getU32Decoder()],
    ]);

const getPersonCodec = (): Codec<PersonInput, Person> =>
  combineCodec(getPersonEncoder(), getPersonDecoder())
```

## Fixed-size and variable-size codecs

It is also worth noting that Codecs can either be of fixed size or variable size.

`FixedSizeCodecs` have a `fixedSize` number attribute that tells us exactly how big their encoded data is in bytes.

```ts
const myCodec: FixedSizeCodec<number> = getU32Codec();
myCodec.fixedSize; // 4 bytes.
```

On the other hand, `VariableSizeCodecs` do not know the size of their encoded data in advance. Instead, they will grab that information either from the provided encoded data or from the value to encode. For the former, we can simply access the length of the `Uint8Array`. For the latter, it provides a `getSizeFromValue` that tells us the encoded byte size of the provided value.

```ts
const myCodec: VariableSizeCodec<string> = addCodecSizePrefix(getUtf8Codec(), getU32Codec());
myCodec.getSizeFromValue('hello world'); // 4 + 11 bytes.
```

Also note that, if the `VariableSizeCodec` is bounded by a maximum size, it can be provided as a `maxSize` number attribute.

The following type guards are available to identify and/or assert the size of codecs: `isFixedSize`, `isVariableSize`, `assertIsFixedSize` and `assertIsVariableSize`.

Finally, note that the same is true for `Encoders` and `Decoders`.

-   A `FixedSizeEncoder` has a `fixedSize` number attribute.
-   A `VariableSizeEncoder` has a `getSizeFromValue` function and an optional `maxSize` number attribute.
-   A `FixedSizeDecoder` has a `fixedSize` number attribute.
-   A `VariableSizeDecoder` has an optional `maxSize` number attribute.

## Creating custom codecs

If composing codecs isn’t enough for you, you may implement your own codec logic by using the `createCodec` function. This function requires an object with a `read` and a `write` function telling us how to read from and write to an existing byte array.

The `read` function accepts the `bytes` to decode from and the `offset` at each we should start reading. It returns an array with two items:

-   The first item should be the decoded value.
-   The second item should be the next offset to read from.

```ts
createCodec({
    read(bytes, offset) {
        const value = bytes[offset];
        return [value, offset + 1];
    },
    // ...
});
```

Reciprocally, the `write` function accepts the `value` to encode, the array of `bytes` to write the encoded value to and the `offset` at which it should be written. It should encode the given value, insert it in the byte array, and provide the next offset to write to as the return value.

```ts
createCodec({
    write(value, bytes, offset) {
        bytes.set(value, offset);
        return offset + 1;
    },
    // ...
});
```

Additionally, we must specify the size of the codec. If we are defining a `FixedSizeCodec`, we must simply provide the `fixedSize` number attribute. For `VariableSizeCodecs`, we must provide the `getSizeFromValue` function as described in the previous section.

```ts
// FixedSizeCodec.
createCodec({
    fixedSize: 1,
    // ...
});

// VariableSizeCodec.
createCodec({
    getSizeFromValue: (value: string) => value.length,
    // ...
});
```

Here’s a concrete example of a custom codec that encodes any unsigned integer in a single byte. Since a single byte can only store integers from 0 to 255, if any other integer is provided it will take its modulo 256 to ensure it fits in a single byte. Because it always requires a single byte, that codec is a `FixedSizeCodec` of size `1`.

```ts
const getModuloU8Codec = () =>
    createCodec<number>({
        fixedSize: 1,
        read(bytes, offset) {
            const value = bytes[offset];
            return [value, offset + 1];
        },
        write(value, bytes, offset) {
            bytes.set(value % 256, offset);
            return offset + 1;
        },
    });
```

Note that, it is also possible to create custom encoders and decoders separately by using the `createEncoder` and `createDecoder` functions respectively and then use the `combineCodec` function on them just like we were doing with composed codecs.

This approach is recommended to library maintainers as it allows their users to tree-shake any of the encoders and/or decoders they don’t need.

Here’s our previous modulo u8 example but split into separate `Encoder`, `Decoder` and `Codec` instances.

```ts
const getModuloU8Encoder = () =>
    createEncoder<number>({
        fixedSize: 1,
        write(value, bytes, offset) {
            bytes.set(value % 256, offset);
            return offset + 1;
        },
    });

const getModuloU8Decoder = () =>
    createDecoder<number>({
        fixedSize: 1,
        read(bytes, offset) {
            const value = bytes[offset];
            return [value, offset + 1];
        },
    });

const getModuloU8Codec = () => combineCodec(getModuloU8Encoder(), getModuloU8Decoder());
```

Here’s another example returning a `VariableSizeCodec`. This one transforms a simple string composed of characters from `a` to `z` to a buffer of numbers from `1` to `26` where `0` bytes are spaces.

```ts
const alphabet = ' abcdefghijklmnopqrstuvwxyz';

const getCipherEncoder = () =>
    createEncoder<string>({
        getSizeFromValue: value => value.length,
        write(value, bytes, offset) {
            const bytesToAdd = [...value].map(char => alphabet.indexOf(char));
            bytes.set(bytesToAdd, offset);
            return offset + bytesToAdd.length;
        },
    });

const getCipherDecoder = () =>
    createDecoder<string>({
        read(bytes, offset) {
            const value = [...bytes.slice(offset)].map(byte => alphabet.charAt(byte)).join('');
            return [value, bytes.length];
        },
    });

const getCipherCodec = () => combineCodec(getCipherEncoder(), getCipherDecoder());
```

## Transforming codecs

It is possible to transform a `Codec<T>` to a `Codec<U>` by providing two mapping functions: one that goes from `T` to `U` and one that does the opposite.

For instance, here’s how you would map a `u32` integer into a `string` representation of that number.

```ts
const getStringU32Codec = () =>
    transformCodec(
        getU32Codec(),
        (integerAsString: string): number => parseInt(integerAsString),
        (integer: number): string => integer.toString(),
    );

getStringU32Codec().encode('42'); // new Uint8Array([42])
getStringU32Codec().decode(new Uint8Array([42])); // "42"
```

If a `Codec` has [different From and To types](#different-from-and-to-types), say `Codec<OldFrom, OldTo>`, and we want to map it to `Codec<NewFrom, NewTo>`, we must provide functions that map from `NewFrom` to `OldFrom` and from `OldTo` to `NewTo`.

To illustrate that, let’s take our previous `getStringU32Codec` example but make it use a `getU64Codec` codec instead as it returns a `Codec<number | bigint, bigint>`. Additionally, let’s make it so our `getStringU64Codec` function returns a `Codec<number | string, string>` so that it also accepts numbers when encoding values. Here’s what our mapping functions look like:

```ts
const getStringU64Codec = () =>
    transformCodec(
        getU64Codec(),
        (integerInput: number | string): number | bigint =>
            typeof integerInput === 'string' ? BigInt(integerAsString) : integerInput,
        (integer: bigint): string => integer.toString(),
    );
```

Note that the second function that maps the decoded type is optional. That means, you can omit it to simply update or loosen the type to encode whilst keeping the decoded type the same.

This is particularly useful to provide default values to object structures. For instance, here’s how we can map our `Person` codec to give a default value to its `age` attribute.

```ts
type Person = { name: string; age: number; }
const getPersonCodec = (): Codec<Person> => { /*...*/ }

type PersonInput = { name: string; age?: number; }
const getPersonWithDefaultValueCodec = (): Codec<PersonInput, Person> =>
    transformCodec(
        getPersonCodec(),
        (person: PersonInput): Person => { ...person, age: person.age ?? 42 }
    )
```

Similar helpers exist to map `Encoder` and `Decoder` instances allowing you to separate your codec logic into tree-shakeable functions. Here’s our `getStringU32Codec` written that way.

```ts
const getStringU32Encoder = () =>
    transformEncoder(getU32Encoder(), (integerAsString: string): number => parseInt(integerAsString));
const getStringU32Decoder = () => transformDecoder(getU32Decoder(), (integer: number): string => integer.toString());
const getStringU32Codec = () => combineCodec(getStringU32Encoder(), getStringU32Decoder());
```

## Fixing the size of codecs

The `fixCodecSize` function allows you to bind the size of a given codec to the given fixed size.

For instance, say you want to represent a base-58 string that uses exactly 32 bytes when decoded. Here’s how you can use the `fixCodecSize` helper to achieve that.

```ts
const get32BytesBase58Codec = () => fixCodecSize(getBase58Codec(), 32);
```

You may also use the `fixEncoderSize` and `fixDecoderSize` functions to separate your codec logic like so:

```ts
const get32BytesBase58Encoder = () => fixEncoderSize(getBase58Encoder(), 32);
const get32BytesBase58Decoder = () => fixDecoderSize(getBase58Decoder(), 32);
const get32BytesBase58Codec = () => combineCodec(get32BytesBase58Encoder(), get32BytesBase58Decoder());
```

## Prefixing codecs with their size

The `addCodecSizePrefix` function allows you to store the byte size of any codec as a number prefix. This allows you to contain variable-size codecs to their actual size.

When encoding, the size of the encoded data is stored before the encoded data itself. When decoding, the size is read first to know how many bytes to read next.

For example, say we want to represent a variable-size base-58 string using a `u32` size prefix — the equivalent of a Borsh `String` in Rust. Here’s how you can use the `addCodecSizePrefix` function to achieve that.

```ts
const getU32Base58Codec = () => addCodecSizePrefix(getBase58Codec(), getU32Codec());

getU32Base58Codec().encode('hello world');
// 0x0b00000068656c6c6f20776f726c64
//   |       └-- Our encoded base-58 string.
//   └-- Our encoded u32 size prefix.
```

You may also use the `addEncoderSizePrefix` and `addDecoderSizePrefix` functions to separate your codec logic like so:

```ts
const getU32Base58Encoder = () => addEncoderSizePrefix(getBase58Encoder(), getU32Encoder());
const getU32Base58Decoder = () => addDecoderSizePrefix(getBase58Decoder(), getU32Decoder());
const getU32Base58Codec = () => combineCodec(getU32Base58Encoder(), getU32Base58Decoder());
```

## Adding sentinels to codecs

Another way of delimiting the size of a codec is to use sentinels. The `addCodecSentinel` function allows us to add a sentinel to the end of the encoded data and to read until that sentinel is found when decoding. It accepts any codec and a `Uint8Array` sentinel responsible for delimiting the encoded data.

```ts
const codec = addCodecSentinel(getUtf8Codec(), new Uint8Array([255, 255]));
codec.encode('hello');
// 0x68656c6c6fffff
//   |        └-- Our sentinel.
//   └-- Our encoded string.
```

Note that the sentinel _must not_ be present in the encoded data and _must_ be present in the decoded data for this to work. If this is not the case, dedicated errors will be thrown.

```ts
const sentinel = new Uint8Array([108, 108]); // 'll'
const codec = addCodecSentinel(getUtf8Codec(), sentinel);

codec.encode('hello'); // Throws: sentinel is in encoded data.
codec.decode(new Uint8Array([1, 2, 3])); // Throws: sentinel missing in decoded data.
```

Separate `addEncoderSentinel` and `addDecoderSentinel` functions are also available.

```ts
const bytes = addEncoderSentinel(getUtf8Encoder(), sentinel).encode('hello');
const value = addDecoderSentinel(getUtf8Decoder(), sentinel).decode(bytes);
```

## Adjusting the size of codecs

The `resizeCodec` helper re-defines the size of a given codec by accepting a function that takes the current size of the codec and returns a new size. This works for both fixed-size and variable-size codecs.

```ts
// Fixed-size codec.
const getBiggerU32Codec = () => resizeCodec(getU32Codec(), size => size + 4);
getBiggerU32Codec().encode(42);
// 0x2a00000000000000
//   |       └-- Empty buffer space caused by the resizeCodec function.
//   └-- Our encoded u32 number.

// Variable-size codec.
const getBiggerUtf8Codec = () => resizeCodec(getUtf8Codec(), size => size + 4);
getBiggerUtf8Codec().encode('ABC');
// 0x41424300000000
//   |     └-- Empty buffer space caused by the resizeCodec function.
//   └-- Our encoded string.
```

Note that the `resizeCodec` function doesn't change any encoded or decoded bytes, it merely tells the `encode` and `decode` functions how big the `Uint8Array` should be before delegating to their respective `write` and `read` functions. In fact, this is completely bypassed when using the `write` and `read` functions directly. For instance:

```ts
const getBiggerU32Codec = () => resizeCodec(getU32Codec(), size => size + 4);

// Using the encode function.
getBiggerU32Codec().encode(42);
// 0x2a00000000000000

// Using the lower-level write function.
const myCustomBytes = new Uint8Array(4);
getBiggerU32Codec().write(42, myCustomBytes, 0);
// 0x2a000000
```

So when would it make sense to use the `resizeCodec` function? This function is particularly useful when combined with the `offsetCodec` function described below. Whilst the `offsetCodec` may help us push the offset forward — e.g. to skip some padding — it won't change the size of the encoded data which means the last bytes will be truncated by how much we pushed the offset forward. The `resizeCodec` function can be used to fix that. For instance, here's how we can use the `resizeCodec` and the `offsetCodec` functions together to create a struct codec that includes some padding.

```ts
const personCodec = getStructCodec([
    ['name', fixCodecSize(getUtf8Codec(), 8)],
    // There is a 4-byte padding between name and age.
    [
        'age',
        offsetCodec(
            resizeCodec(getU32Codec(), size => size + 4),
            { preOffset: ({ preOffset }) => preOffset + 4 },
        ),
    ],
]);

personCodec.encode({ name: 'Alice', age: 42 });
// 0x416c696365000000000000002a000000
//   |               |       └-- Our encoded u32 (42).
//   |               └-- The 4-bytes of padding we are skipping.
//   └-- Our 8-byte encoded string ("Alice").
```

As usual, the `resizeEncoder` and `resizeDecoder` functions can also be used to achieve that.

```ts
const getBiggerU32Encoder = () => resizeEncoder(getU32Codec(), size => size + 4);
const getBiggerU32Decoder = () => resizeDecoder(getU32Codec(), size => size + 4);
const getBiggerU32Codec = () => combineCodec(getBiggerU32Encoder(), getBiggerU32Decoder());
```

## Offsetting codecs

The `offsetCodec` function is a powerful codec primitive that allows you to move the offset of a given codec forward or backwards. It accepts one or two functions that takes the current offset and returns a new offset.

To understand how this works, let's take our previous `biggerU32Codec` example which encodes a `u32` number inside an 8-byte buffer.

```ts
const biggerU32Codec = resizeCodec(getU32Codec(), size => size + 4);
biggerU32Codec.encode(0xffffffff);
// 0xffffffff00000000
//   |       └-- Empty buffer space caused by the resizeCodec function.
//   └-- Our encoded u32 number.
```

Now, let's say we want to move the offset of that codec 2 bytes forward so that the encoded number sits in the middle of the buffer. To achieve, this we can use the `offsetCodec` helper and provide a `preOffset` function that moves the "pre-offset" of the codec 2 bytes forward.

```ts
const u32InTheMiddleCodec = offsetCodec(biggerU32Codec, {
    preOffset: ({ preOffset }) => preOffset + 2,
});
u32InTheMiddleCodec.encode(0xffffffff);
// 0x0000ffffffff0000
//       └-- Our encoded u32 number is now in the middle of the buffer.
```

We refer to this offset as the "pre-offset" because, once the inner codec is encoded or decoded, an additional offset will be returned which we refer to as the "post-offset". That "post-offset" is important as, unless we are reaching the end of our codec, it will be used by any further codecs to continue encoding or decoding data.

By default, that "post-offset" is simply the addition of the "pre-offset" and the size of the encoded or decoded inner data.

```ts
const u32InTheMiddleCodec = offsetCodec(biggerU32Codec, {
    preOffset: ({ preOffset }) => preOffset + 2,
});
u32InTheMiddleCodec.encode(0xffffffff);
// 0x0000ffffffff0000
//   |   |       └-- Post-offset.
//   |   └-- New pre-offset: The original pre-offset + 2.
//   └-- Pre-offset: The original pre-offset before we adjusted it.
```

However, you may also provide a `postOffset` function to adjust the "post-offset". For instance, let's push the "post-offset" 2 bytes forward as well such that any further codecs will start doing their job at the end of our 8-byte `u32` number.

```ts
const u32InTheMiddleCodec = offsetCodec(biggerU32Codec, {
    preOffset: ({ preOffset }) => preOffset + 2,
    postOffset: ({ postOffset }) => postOffset + 2,
});
u32InTheMiddleCodec.encode(0xffffffff);
// 0x0000ffffffff0000
//   |   |       |   └-- New post-offset: The original post-offset + 2.
//   |   |       └-- Post-offset: The original post-offset before we adjusted it.
//   |   └-- New pre-offset: The original pre-offset + 2.
//   └-- Pre-offset: The original pre-offset before we adjusted it.
```

Both the `preOffset` and `postOffset` functions offer the following attributes:

-   `bytes`: The entire byte array being encoded or decoded.
-   `preOffset`: The original and unaltered pre-offset.
-   `wrapBytes`: A helper function that wraps the given offset around the byte array length. E.g. `wrapBytes(-1)` will refer to the last byte of the byte array.

Additionally, the post-offset function also provides the following attributes:

-   `newPreOffset`: The new pre-offset after the pre-offset function has been applied.
-   `postOffset`: The original and unaltered post-offset.

Note that you may also decide to ignore these attributes to achieve absolute offsets. However, relative offsets are usually recommended as they won't break your codecs when composed with other codecs.

```ts
const u32InTheMiddleCodec = offsetCodec(biggerU32Codec, {
    preOffset: () => 2,
    postOffset: () => 8,
});
u32InTheMiddleCodec.encode(0xffffffff);
// 0x0000ffffffff0000
```

Also note that any negative offset or offset that exceeds the size of the byte array will throw a `SolanaError` of code `SOLANA_ERROR__CODECS__OFFSET_OUT_OF_RANGE`.

```ts
const u32InTheEndCodec = offsetCodec(biggerU32Codec, { preOffset: () => -4 });
u32InTheEndCodec.encode(0xffffffff);
// throws new SolanaError(SOLANA_ERROR__CODECS__OFFSET_OUT_OF_RANGE)
```

To avoid this, you may use the `wrapBytes` function to wrap the offset around the byte array length. For instance, here's how we can use the `wrapBytes` function to move the pre-offset 4 bytes from the end of the byte array.

```ts
const u32InTheEndCodec = offsetCodec(biggerU32Codec, {
    preOffset: ({ wrapBytes }) => wrapBytes(-4),
});
u32InTheEndCodec.encode(0xffffffff);
// 0x00000000ffffffff
```

As you can see, the `offsetCodec` helper allows you to jump all over the place with your codecs. This non-linear approach to encoding and decoding data allows you to achieve complex serialization strategies that would otherwise be impossible.

As usual, the `offsetEncoder` and `offsetDecoder` functions can also be used to split your codec logic into tree-shakeable functions.

```ts
const getU32InTheMiddleEncoder = () => offsetEncoder(biggerU32Encoder, { preOffset: ({ preOffset }) => preOffset + 2 });
const getU32InTheMiddleDecoder = () => offsetDecoder(biggerU32Decoder, { preOffset: ({ preOffset }) => preOffset + 2 });
const getU32InTheMiddleCodec = () => combineCodec(getU32InTheMiddleEncoder(), getU32InTheMiddleDecoder());
```

## Padding codecs

The `padLeftCodec` and `padRightCodec` helpers can be used to add padding to the left or right of a given codec. They accept an `offset` number that tells us how big the padding should be.

```ts
const getLeftPaddedCodec = () => padLeftCodec(getU16Codec(), 4);
getLeftPaddedCodec().encode(0xffff);
// 0x00000000ffff
//   |       └-- Our encoded u16 number.
//   └-- Our 4-byte padding.

const getRightPaddedCodec = () => padRightCodec(getU16Codec(), 4);
getRightPaddedCodec().encode(0xffff);
// 0xffff00000000
//   |   └-- Our 4-byte padding.
//   └-- Our encoded u16 number.
```

Note that both the `padLeftCodec` and `padRightCodec` functions are simple wrappers around the `offsetCodec` and `resizeCodec` functions. For more complex padding strategies, you may want to use the `offsetCodec` and `resizeCodec` functions directly instead.

As usual, encoder-only and decoder-only helpers are available for these padding functions. Namely, `padLeftEncoder`, `padRightEncoder`, `padLeftDecoder` and `padRightDecoder`.

```ts
const getMyPaddedEncoder = () => padLeftEncoder(getU16Encoder());
const getMyPaddedDecoder = () => padLeftDecoder(getU16Decoder());
const getMyPaddedCodec = () => combineCodec(getMyPaddedEncoder(), getMyPaddedDecoder());
```

## Reversing codecs

The `reverseCodec` helper reverses the bytes of the provided `FixedSizeCodec`.

```ts
const getBigEndianU64Codec = () => reverseCodec(getU64Codec());
```

Note that number codecs can already do that for you via their `endian` option.

```ts
const getBigEndianU64Codec = () => getU64Codec({ endian: Endian.Big });
```

As usual, the `reverseEncoder` and `reverseDecoder` functions can also be used to achieve that.

```ts
const getBigEndianU64Encoder = () => reverseEncoder(getU64Encoder());
const getBigEndianU64Decoder = () => reverseDecoder(getU64Decoder());
const getBigEndianU64Codec = () => combineCodec(getBigEndianU64Encoder(), getBigEndianU64Decoder());
```

## Byte helpers

This package also provides utility functions for managing bytes such as:

-   `mergeBytes`: Concatenates an array of `Uint8Arrays` into a single `Uint8Array`.
-   `padBytes`: Pads a `Uint8Array` with zeroes (to the right) to the specified length.
-   `fixBytes`: Pads or truncates a `Uint8Array` so it has the specified length.
-   `containsBytes`: Checks if a `Uint8Array` contains another `Uint8Array` at a given offset.

```ts
// Merge multiple Uint8Array buffers into one.
mergeBytes([new Uint8Array([1, 2]), new Uint8Array([3, 4])]); // Uint8Array([1, 2, 3, 4])

// Pad a Uint8Array buffer to the given size.
padBytes(new Uint8Array([1, 2]), 4); // Uint8Array([1, 2, 0, 0])
padBytes(new Uint8Array([1, 2, 3, 4]), 2); // Uint8Array([1, 2, 3, 4])

// Pad and truncate a Uint8Array buffer to the given size.
fixBytes(new Uint8Array([1, 2]), 4); // Uint8Array([1, 2, 0, 0])
fixBytes(new Uint8Array([1, 2, 3, 4]), 2); // Uint8Array([1, 2])

// Check if a Uint8Array contains another Uint8Array at a given offset.
containsBytes(new Uint8Array([1, 2, 3, 4]), new Uint8Array([2, 3]), 1); // true
containsBytes(new Uint8Array([1, 2, 3, 4]), new Uint8Array([2, 3]), 2); // false
```

---

To read more about the available codecs and how to use them, check out the documentation of the main [`@solana/codecs` package](https://github.com/solana-labs/solana-web3.js/tree/master/packages/codecs).
