[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]
[![semantic-release][semantic-release-image]][semantic-release-url]
<br />
[![code-style-prettier][code-style-prettier-image]][code-style-prettier-url]

[code-style-prettier-image]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square
[code-style-prettier-url]: https://github.com/prettier/prettier
[npm-downloads-image]: https://img.shields.io/npm/dm/@solana/codecs-data-structures/rc.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@solana/codecs-data-structures/rc.svg?style=flat
[npm-url]: https://www.npmjs.com/package/@solana/codecs-data-structures/v/rc
[semantic-release-image]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[semantic-release-url]: https://github.com/semantic-release/semantic-release

# @solana/codecs-data-structures

This package contains codecs for various data structures such as arrays, maps, structs, tuples, enums, etc. It can be used standalone, but it is also exported as part of the Solana JavaScript SDK [`@solana/web3.js@rc`](https://github.com/solana-labs/solana-web3.js/tree/master/packages/library).

This package is also part of the [`@solana/codecs` package](https://github.com/solana-labs/solana-web3.js/tree/master/packages/codecs) which acts as an entry point for all codec packages as well as for their documentation.

## Array codec

The `getArrayCodec` function accepts any codec of type `T` and returns a codec of type `Array<T>`. For instance, here’s how we can create a codec for arrays of numbers that each fit in a single byte.

```ts
const bytes = getArrayCodec(getU8Codec()).encode([1, 2, 3]);
const array = getArrayCodec(getU8Codec()).decode(bytes);
```

By default, the size of the array is stored as a `u32` prefix before encoding the items.

```ts
getArrayCodec(getU8Codec()).encode([1, 2, 3]);
// 0x03000000010203
//   |       └-- 3 items of 1 byte each.
//   └-- 4-byte prefix telling us to read 3 items.
```

However, you may use the `size` option to configure this behaviour. It can be one of the following three strategies:

-   `Codec<number>`: When a number codec is provided, that codec will be used to encode and decode the size prefix.
-   `number`: When a number is provided, the codec will expect a fixed number of items in the array. An error will be thrown when trying to encode an array of a different length.
-   `"remainder"`: When the string `"remainder"` is passed as a size, the codec will use the remainder of the bytes to encode/decode its items. This means the size is not stored or known in advance but simply inferred from the rest of the buffer. For instance, if we have an array of `u16` numbers and 10 bytes remaining, we know there are 5 items in this array.

```ts
getArrayCodec(getU8Codec(), { size: getU16Codec() }).encode([1, 2, 3]);
// 0x0300010203
//   |   └-- 3 items of 1 byte each.
//   └-- 2-byte prefix telling us to read 3 items.

getArrayCodec(getU8Codec(), { size: 3 }).encode([1, 2, 3]);
// 0x010203
//   └-- 3 items of 1 byte each. There must always be 3 items in the array.

getArrayCodec(getU8Codec(), { size: 'remainder' }).encode([1, 2, 3]);
// 0x010203
//   └-- 3 items of 1 byte each. The size is inferred from the remainder of the bytes.
```

Separate `getArrayEncoder` and `getArrayDecoder` functions are also available.

```ts
const bytes = getArrayEncoder(getU8Encoder()).encode([1, 2, 3]);
const array = getArrayDecoder(getU8Decoder()).decode(bytes);
```

## Set codec

The `getSetCodec` function accepts any codec of type `T` and returns a codec of type `Set<T>`. For instance, here’s how we can create a codec for sets of numbers that each fit in a single byte.

```ts
const bytes = getSetCodec(getU8Codec()).encode(new Set([1, 2, 3]));
const set = getSetCodec(getU8Codec()).decode(bytes);
```

Just like the array codec, it uses a `u32` size prefix by default but can be configured using the `size` option. [See the array codec](#array-codec) for more details.

```ts
getSetCodec(getU8Codec(), { size: getU16Codec() }).encode(new Set([1, 2, 3]));
getSetCodec(getU8Codec(), { size: 3 }).encode(new Set([1, 2, 3]));
getSetCodec(getU8Codec(), { size: 'remainder' }).encode(new Set([1, 2, 3]));
```

Separate `getSetEncoder` and `getSetDecoder` functions are also available.

```ts
const bytes = getSetEncoder(getU8Encoder()).encode(new Set([1, 2, 3]));
const set = getSetDecoder(getU8Decoder()).decode(bytes);
```

## Map codec

The `getMapCodec` function accepts two codecs of type `K` and `V` and returns a codec of type `Map<K, V>`. For instance, here’s how we can create a codec for maps such that the keys are fixed strings of 8 bytes and the values are `u8` numbers.

```ts
const keyCodec = fixCodecSize(getUtf8Codec(), 8);
const valueCodec = getU8Codec();
const bytes = getMapCodec(keyCodec, valueCodec).encode(new Map([['alice', 42]]));
const map = getMapCodec(keyCodec, valueCodec).decode(bytes);
```

Just like the array codec, it uses a `u32` size prefix by default.

```ts
const keyCodec = fixCodecSize(getUtf8Codec(), 8);
const valueCodec = getU8Codec();
const myMap = new Map<string, number>();
myMap.set('alice', 42);
myMap.set('bob', 5);

getMapCodec(keyCodec, valueCodec).encode(myMap);
// 0x02000000616c6963650000002a626f62000000000005
//   |       |               | |               └-- 2nd entry value (5).
//   |       |               | └-- 2nd entry key ("bob").
//   |       |               └-- 1st entry value (42).
//   |       └-- 1st entry key ("alice").
//   └-- 4-byte prefix telling us to read 2 map entries.
```

However, it can be configured using the `size` option. [See the `size` option of the array codec](#array-codec) for more details.

```ts
getMapCodec(keyCodec, valueCodec, { size: getU16Codec() }).encode(myMap);
getMapCodec(keyCodec, valueCodec, { size: 3 }).encode(myMap);
getMapCodec(keyCodec, valueCodec, { size: 'remainder' }).encode(myMap);
```

Separate `getMapEncoder` and `getMapDecoder` functions are also available.

```ts
const bytes = getMapEncoder(keyEncoder, valueEncoder).encode(myMap);
const map = getMapDecoder(keyDecoder, valueDecoder).decode(bytes);
```

## Tuple codec

The `getTupleCodec` function accepts any number of codecs — `T`, `U`, `V`, etc. — and returns a tuple codec of type `[T, U, V, …]` such that each item is in the order of the provided codecs.

```ts
const codec = getTupleCodec([addCodecSizePrefix(getUtf8Codec(), getU32Codec()), getU8Codec(), getU64Codec()]);
const bytes = codec.encode(['alice', 42, 123]);
const tuple = codec.decode(bytes);
```

Separate `getTupleEncoder` and `getTupleDecoder` functions are also available.

```ts
const bytes = getTupleEncoder([getU8Encoder(), getU64Encoder()]).encode([42, 123]);
const tuple = getTupleDecoder([getU8Decoder(), getU64Decoder()]).decode(bytes);
```

## Struct codec

The `getStructCodec` function accepts any number of field codecs and returns a codec for an object containing all these fields. Each provided field is an array such that the first item is the name of the field and the second item is the codec used to encode and decode that field type.

```ts
type Person = { name: string; age: number };
const personCodec: Codec<Person> = getStructCodec([
    ['name', addCodecSizePrefix(getUtf8Codec(), getU32Codec())],
    ['age', getU8Codec()],
]);

const bytes = personCodec.encode({ name: 'alice', age: 42 });
const person = personCodec.decode(bytes);
```

Separate `getStructEncoder` and `getStructDecoder` functions are also available.

```ts
const personEncoder: Encoder<Person> = getStructEncoder([
    ['name', addEncoderSizePrefix(getUtf8Encoder(), getU32Encoder())],
    ['age', getU8Encoder()],
]);
const personDecoder: Decoder<Person> = getStructDecoder([
    ['name', addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder())],
    ['age', getU8Decoder()],
]);
const bytes = personEncoder.encode({ name: 'alice', age: 42 });
const person = personDecoder.decode(bytes);
```

## Enum codec

The `getEnumCodec` function accepts a JavaScript enum constructor and returns a codec for encoding and decoding values of that enum.

```ts
enum Direction {
    Left,
    Right,
}

const bytes = getEnumCodec(Direction).encode(Direction.Left);
const direction = getEnumCodec(Direction).decode(bytes);
```

When encoding an enum, you may either provide the value of the enum variant — e.g. `Direction.Left` — or its key — e.g. `'Left'`.

```ts
enum Direction {
    Left,
    Right,
}

getEnumCodec(Direction).encode(Direction.Left); // 0x00
getEnumCodec(Direction).encode(Direction.Right); // 0x01
getEnumCodec(Direction).encode('Left'); // 0x00
getEnumCodec(Direction).encode('Right'); // 0x01
```

As you can see, by default, a `u8` number is being used to store the enum value. However, a number codec may be passed as the `size` option to configure that behaviour.

```ts
const u32DirectionCodec = getEnumCodec(Direction, { size: getU32Codec() });
u32DirectionCodec.encode(Direction.Left); // 0x00000000
u32DirectionCodec.encode(Direction.Right); // 0x01000000
```

This function also works with lexical enums — e.g. `enum Direction { Left = '←' }` — explicit numerical enums — e.g. `enum Speed { Left = 50 }` — and hybrid enums with a mix of both.

```ts
enum Numbers {
    One,
    Five = 5,
    Six,
    Nine = 'nine',
}

getEnumCodec(Numbers).encode(Direction.One); // 0x00
getEnumCodec(Numbers).encode(Direction.Five); // 0x01
getEnumCodec(Numbers).encode(Direction.Six); // 0x02
getEnumCodec(Numbers).encode(Direction.Nine); // 0x03
getEnumCodec(Numbers).encode('One'); // 0x00
getEnumCodec(Numbers).encode('Five'); // 0x01
getEnumCodec(Numbers).encode('Six'); // 0x02
getEnumCodec(Numbers).encode('Nine'); // 0x03
```

Notice how, by default, the index of the enum variant is used to encode the value of the enum. For instance, in the example above, `Numbers.Five` is encoded as `0x01` even though its value is `5`. This is also true for lexical enums.

However, when dealing with numerical enums that have explicit values, you may use the `useValuesAsDiscriminators` option to encode the value of the enum variant instead of its index.

```ts
enum Numbers {
    One,
    Five = 5,
    Six,
    Nine = 9,
}

const codec = getEnumCodec(Numbers, { useValuesAsDiscriminators: true });
codec.encode(Direction.One); // 0x00
codec.encode(Direction.Five); // 0x05
codec.encode(Direction.Six); // 0x06
codec.encode(Direction.Nine); // 0x09
codec.encode('One'); // 0x00
codec.encode('Five'); // 0x05
codec.encode('Six'); // 0x06
codec.encode('Nine'); // 0x09
```

Note that when using the `useValuesAsDiscriminators` option on an enum that contains a lexical value, an error will be thrown.

```ts
enum Lexical {
    One,
    Two = 'two',
}
getEnumCodec(Lexical, { useValuesAsDiscriminators: true }); // Throws an error.
```

Separate `getEnumEncoder` and `getEnumDecoder` functions are also available.

```ts
const bytes = getEnumEncoder(Direction).encode(Direction.Left);
const direction = getEnumDecoder(Direction).decode(bytes);
```

## Literal union codec

The `getLiteralUnionCodec` function works similarly to the `getUnionCodec` function but does not require a JavaScript `enum` to exist.

It accepts an array of literal values — such as `string`, `number`, `boolean`, etc. — and returns a codec that encodes and decodes such values using by using their index in the array. It uses TypeScript unions to represent all the possible values.

```ts
const codec = getLiteralUnionCodec(['left', 'right', 'up', 'down']);
// ^? FixedSizeCodec<"left" | "right" | "up" | "down">

const bytes = codec.encode('left'); // 0x00
const value = codec.decode(bytes); // 'left'
```

As you can see, it uses a `u8` number by default to store the index of the value. However, you may provide a number codec as the `size` option of the `getLiteralUnionCodec` function to customise that behaviour.

```ts
const codec = getLiteralUnionCodec(['left', 'right', 'up', 'down'], {
    size: getU32Codec(),
});

codec.encode('left'); // 0x00000000
codec.encode('right'); // 0x01000000
codec.encode('up'); // 0x02000000
codec.encode('down'); // 0x03000000
```

Separate `getLiteralUnionEncoder` and `getLiteralUnionDecoder` functions are also available.

```ts
const bytes = getLiteralUnionEncoder(['left', 'right']).encode('left'); // 0x00
const value = getLiteralUnionDecoder(['left', 'right']).decode(bytes); // 'left'
```

## Discriminated union codec

In Rust, enums are powerful data types whose variants can be one of the following:

-   An empty variant — e.g. `enum Message { Quit }`.
-   A tuple variant — e.g. `enum Message { Write(String) }`.
-   A struct variant — e.g. `enum Message { Move { x: i32, y: i32 } }`.

Whilst we do not have such powerful enums in JavaScript, we can emulate them in TypeScript using a union of objects such that each object is differentiated by a specific field. **We call this a discriminated union**.

We use a special field named `__kind` to distinguish between the different variants of a discriminated union. Additionally, since all variants are objects, we can use a `fields` property to wrap the array of tuple variants. Here is an example.

```ts
type Message =
    | { __kind: 'Quit' } // Empty variant.
    | { __kind: 'Write'; fields: [string] } // Tuple variant.
    | { __kind: 'Move'; x: number; y: number }; // Struct variant.
```

The `getDiscriminatedUnionCodec` function helps us encode and decode these discriminated unions.

It requires the discriminator and codec of each variant as a first argument. Similarly to the struct codec, these are defined as an array of variant tuples where the first item is the discriminator of the variant and the second item is its codec. Since empty variants do not have data to encode, they simply use the unit codec — documented below — which does nothing.

Here is how we can create a discriminated union codec for our previous example.

```ts
const messageCodec = getDiscriminatedUnionCodec([
    // Empty variant.
    ['Quit', getUnitCodec()],

    // Tuple variant.
    ['Write', getStructCodec([['fields', getTupleCodec([addCodecSizePrefix(getUtf8Codec(), getU32Codec())])]])],

    // Struct variant.
    [
        'Move',
        getStructCodec([
            ['x', getI32Codec()],
            ['y', getI32Codec()],
        ]),
    ],
]);
```

And here’s how we can use such a codec to encode discriminated unions. Notice that by default, they use a `u8` number prefix to distinguish between the different types of variants.

```ts
messageCodec.encode({ __kind: 'Quit' });
// 0x00
//   └-- 1-byte discriminator (Index 0 — the "Quit" variant).

messageCodec.encode({ __kind: 'Write', fields: ['Hi'] });
// 0x01020000004869
//   | |       └-- utf8 string content ("Hi").
//   | └-- u32 string prefix (2 characters).
//   └-- 1-byte discriminator (Index 1 — the "Write" variant).

messageCodec.encode({ __kind: 'Move', x: 5, y: 6 });
// 0x020500000006000000
//   | |       └-- Field y (6).
//   | └-- Field x (5).
//   └-- 1-byte discriminator (Index 2 — the "Move" variant).
```

However, you may provide a number codec as the `size` option of the `getDiscriminatedUnionCodec` function to customise that behaviour.

```ts
const u32MessageCodec = getDiscriminatedUnionCodec([...], {
    size: getU32Codec(),
});

u32MessageCodec.encode({ __kind: 'Quit' });
// 0x00000000
//   └------┘ 4-byte discriminator (Index 0).

u32MessageCodec.encode({ __kind: 'Write', fields: ['Hi'] });
// 0x01000000020000004869
//   └------┘ 4-byte discriminator (Index 1).

u32MessageCodec.encode({ __kind: 'Move', x: 5, y: 6 });
// 0x020000000500000006000000
//   └------┘ 4-byte discriminator (Index 2).
```

You may also customize the discriminator property — which defaults to `__kind` — by providing the desired property name as the `discriminator` option like so:

```ts
const messageCodec = getDiscriminatedUnionCodec([...], {
    discriminator: 'message',
});

messageCodec.encode({ message: 'Quit' });
messageCodec.encode({ message: 'Write', fields: ['Hi'] });
messageCodec.encode({ message: 'Move', x: 5, y: 6 });
```

Note that, the discriminator value of a variant may be any scalar value — such as `number`, `bigint`, `boolean`, a JavaScript `enum`, etc. For instance, the following is also valid:

```ts
enum Message {
    Quit,
    Write,
    Move,
}
const messageCodec = getDiscriminatedUnionCodec([
    [Message.Quit, getUnitCodec()],
    [Message.Write, getStructCodec([...])],
    [Message.Move, getStructCodec([...])],
]);

codec.encode({ __kind: Message.Quit });
codec.encode({ __kind: Message.Write, fields: ['Hi'] });
codec.encode({ __kind: Message.Move, x: 5, y: 6 });
```

Finally, note that separate `getDiscriminatedUnionEncoder` and `getDiscriminatedUnionDecoder` functions are available.

```ts
const bytes = getDiscriminatedUnionEncoder(variantEncoders).encode({ __kind: 'Quit' });
const message = getDiscriminatedUnionDecoder(variantDecoders).decode(bytes);
```

## Union codec

The `getUnionCodec` is a lower-lever codec helper that can be used to encode/decode any TypeScript union.

It accepts the following arguments:

-   An array of codecs, each defining a variant of the union.
-   A `getIndexFromValue` function which, given a value of the union, returns the index of the codec that should be used to encode that value.
-   A `getIndexFromBytes` function which, given the byte array to decode at a given offset, returns the index of the codec that should be used to decode the next bytes.

```ts
const codec: Codec<number | boolean> = getUnionCodec(
    [getU16Codec(), getBooleanCodec()],
    value => (typeof value === 'number' ? 0 : 1),
    (bytes, offset) => (bytes.slice(offset).length > 1 ? 0 : 1),
);

codec.encode(42); // 0x2a00
codec.encode(true); // 0x01
```

As usual, separate `getUnionEncoder` and `getUnionDecoder` functions are also available.

```ts
const bytes = getUnionEncoder(encoders, getIndexFromValue).encode(42);
const value = getUnionDecoder(decoders, getIndexFromBytes).decode(bytes);
```

## Boolean codec

The `getBooleanCodec` function returns a `Codec<boolean>` that stores the boolean as `0` or `1` using a `u8` number by default.

```ts
const bytes = getBooleanCodec().encode(true); // 0x01
const value = getBooleanCodec().decode(bytes); // true
```

You may configure that behaviour by providing an explicit number codec as the `size` option of the `getBooleanCodec` function. That number codec will then be used to encode and decode the values `0` and `1` accordingly.

```ts
getBooleanCodec({ size: getU16Codec() }).encode(false); // 0x0000
getBooleanCodec({ size: getU16Codec() }).encode(true); // 0x0100

getBooleanCodec({ size: getU32Codec() }).encode(false); // 0x00000000
getBooleanCodec({ size: getU32Codec() }).encode(true); // 0x01000000
```

Separate `getBooleanEncoder` and `getBooleanDecoder` functions are also available.

```ts
const bytes = getBooleanEncoder().encode(true); // 0x01
const value = getBooleanDecoder().decode(bytes); // true
```

## Nullable codec

The `getNullableCodec` function accepts a codec of type `T` and returns a codec of type `T | null`. It stores whether or not the item exists as a boolean prefix using a `u8` by default.

```ts
const stringCodec = addCodecSizePrefix(getUtf8Codec(), getU32Codec());

getNullableCodec(stringCodec).encode('Hi');
// 0x01020000004869
//   | |       └-- utf8 string content ("Hi").
//   | └-- u32 string prefix (2 characters).
//   └-- 1-byte prefix (true — The item exists).

getNullableCodec(stringCodec).encode(null);
// 0x00
//   └-- 1-byte prefix (false — The item is null).
```

You may provide a number codec as the `prefix` option of the `getNullableCodec` function to configure how to store the boolean prefix.

```ts
const u32NullableStringCodec = getNullableCodec(stringCodec, {
    prefix: getU32Codec(),
});

u32NullableStringCodec.encode('Hi');
// 0x01000000020000004869
//   └------┘ 4-byte prefix (true).

u32NullableStringCodec.encode(null);
// 0x00000000
//   └------┘ 4-byte prefix (false).
```

Additionally, if the item is a `FixedSizeCodec`, you may set the `noneValue` option to `"zeroes"` to also make the returned nullable codec a `FixedSizeCodec`. To do so, it will pad `null` values with zeroes to match the length of existing values.

```ts
const fixedNullableStringCodec = getNullableCodec(
    fixCodecSize(getUtf8Codec(), 8), // Only works with fixed-size items.
    { noneValue: 'zeroes' },
);

fixedNullableStringCodec.encode('Hi');
// 0x014869000000000000
//   | └-- 8-byte utf8 string content ("Hi").
//   └-- 1-byte prefix (true — The item exists).

fixedNullableStringCodec.encode(null);
// 0x000000000000000000
//   | └-- 8-byte of padding to make a fixed-size codec.
//   └-- 1-byte prefix (false — The item is null).
```

The `noneValue` option can also be set to an explicit byte array to use as the padding for `null` values. Note that, in this case, the returned codec will not be a `FixedSizeCodec` as the byte array representing `null` values may be of any length.

```ts
const codec = getNullableCodec(getUtf8Codec(), {
    noneValue: new Uint8Array([255]), // 0xff means null.
});

codec.encode('Hi');
// 0x014869
//   | └-- 2-byte utf8 string content ("Hi").
//   └-- 1-byte prefix (true — The item exists).

codec.encode(null);
// 0x00ff
//   | └-- 1-byte representing null (0xff).
//   └-- 1-byte prefix (false — The item is null).
```

Last but not least, the `prefix` option of the `getNullableCodec` function can also be set to `null`, meaning no prefix will be used to determine whether the item exists. In this case, the codec will rely on the `noneValue` option to determine whether the item is `null`.

```ts
const codecWithZeroNoneValue = getNullableCodec(getU16Codec(), {
    noneValue: 'zeroes', // 0x0000 means null.
    prefix: null,
});
codecWithZeroNoneValue.encode(42); // 0x2a00
codecWithZeroNoneValue.encode(null); // 0x0000

const codecWithCustomNoneValue = getNullableCodec(getU16Codec(), {
    noneValue: new Uint8Array([255]), // 0xff means null.
    prefix: null,
});
codecWithCustomNoneValue.encode(42); // 0x2a00
codecWithCustomNoneValue.encode(null); // 0xff
```

Finally, note that if `prefix` is set to `null` and no `noneValue` is provided, the codec assumes that the item exists if and only if some remaining bytes are available to decode. This could be useful to describe data structures that may or may not have additional data to the end of the buffer.

```ts
const codec = getNullableCodec(getU16Codec(), { prefix: null });
codec.encode(42); // 0x2a00
codec.encode(null); // Encodes nothing.
codec.decode(new Uint8Array([42, 0])); // 42
codec.decode(new Uint8Array([])); // null
```

To recap, here are all the possible configurations of the `getNullableCodec` function, using a `u16` codec as an example.

| `encode(42)` / `encode(null)` | No `noneValue` (default) | `noneValue: "zeroes"`       | Custom `noneValue` (`0xff`) |
| ----------------------------- | ------------------------ | --------------------------- | --------------------------- |
| `u8` prefix (default)         | `0x012a00` / `0x00`      | `0x012a00` / `0x000000`     | `0x012a00` / `0x00ff`       |
| Custom `prefix` (`u16`)       | `0x01002a00` / `0x0000`  | `0x01002a00` / `0x00000000` | `0x01002a00` / `0x0000ff`   |
| No `prefix`                   | `0x2a00` / `0x`          | `0x2a00` / `0x0000`         | `0x2a00` / `0xff`           |

Note that you might be interested in the Rust-like alternative version of nullable codecs, available in [the `@solana/options` package](https://github.com/solana-labs/solana-web3.js/tree/master/packages/options).

Separate `getNullableEncoder` and `getNullableDecoder` functions are also available.

```ts
const bytes = getNullableEncoder(getU32Encoder()).encode(42);
const value = getNullableDecoder(getU32Decoder()).decode(bytes);
```

## Bytes codec

The `getBytesCodec` function returns a `Codec<Uint8Array>` meaning it converts `Uint8Arrays` to and from… `Uint8Arrays`! Whilst this might seem a bit useless, it can be useful when composed into other codecs. For example, you could use it in a struct codec to say that a particular field should be left unserialised.

```ts
const bytes = getBytesCodec().encode(new Uint8Array([42])); // 0x2a
const value = getBytesCodec().decode(bytes); // 0x2a
```

The `getBytesCodec` function will encode and decode `Uint8Arrays` using as much bytes as necessary. If you'd like to restrict the number of bytes used by this codec, you may combine it with the [`fixCodecSize`](https://github.com/solana-labs/solana-web3.js/tree/master/packages/codecs-core#fixing-the-size-of-codecs) or [`addCodecSizePrefix`](https://github.com/solana-labs/solana-web3.js/tree/master/packages/codecs-core#prefixing-the-size-of-codecs) primitives.

Here are some examples of how you might use the `getBytesCodec` function.

```ts
// Variable size.
getBytesCodec().encode(new Uint8Array([42]));
// 0x2a
//   └-- Uint8Array content using any bytes available.

// Prefixing the size with a 2-byte u16.
addCodecSizePrefix(getBytesCodec(), getU16Codec()).encode(new Uint8Array([42]));
// 0x01002a
//   |   └-- Uint8Array content.
//   └-- 2-byte prefix telling us to read 1 bytes

// Fixing the size to 5 bytes.
fixCodecSize(getBytesCodec(), 5).encode(new Uint8Array([42]));
// 0x2a00000000
//   └-- Uint8Array content padded to use exactly 5 bytes.
```

Separate `getBytesEncoder` and `getBytesDecoder` functions are also available.

```ts
const bytes = getBytesEncoder().encode(new Uint8Array([42]));
const value = getBytesDecoder().decode(bytes);
```

## Bit array codec

The `getBitArrayCodec` function returns a codec that encodes and decodes an array of booleans such that each boolean is represented by a single bit. It requires the size of the codec in bytes and an optional `backward` flag that can be used to reverse the order of the bits.

```ts
const booleans = [true, false, true, false, true, false, true, false];

getBitArrayCodec(1).encode(booleans);
// 0xaa or 0b10101010

getBitArrayCodec(1, { backward: true }).encode(booleans);
// 0x55 or 0b01010101
```

Separate `getBitArrayEncoder` and `getBitArrayDecoder` functions are also available.

```ts
const bytes = getBitArrayEncoder(1).encode(booleans);
const decodedBooleans = getBitArrayDecoder(1).decode(bytes);
```

## Constant codec

The `getConstantCodec` function accepts any `Uint8Array` and returns a `Codec<void>`. When encoding, it will set the provided `Uint8Array` as-is. When decoding, it will assert that the next bytes contain the provided `Uint8Array` and move the offset forward.

```ts
const codec = getConstantCodec(new Uint8Array([1, 2, 3]));

codec.encode(undefined); // 0x010203
codec.decode(new Uint8Array([1, 2, 3])); // undefined
codec.decode(new Uint8Array([1, 2, 4])); // Throws an error.
```

Separate `getConstantEncoder` and `getConstantDecoder` functions are also available.

```ts
getConstantEncoder(new Uint8Array([1, 2, 3])).encode(undefined);
getConstantDecoder(new Uint8Array([1, 2, 3])).decode(new Uint8Array([1, 2, 3]));
```

## Unit codec

The `getUnitCodec` function returns a `Codec<void>` that encodes `undefined` into an empty `Uint8Array` and returns `undefined` without consuming any bytes when decoding. This is more of a low-level codec that can be used internally by other codecs. For instance, this is how discriminated union codecs describe the codecs of empty variants.

```ts
getUnitCodec().encode(undefined); // Empty Uint8Array
getUnitCodec().decode(anyBytes); // undefined
```

Separate `getUnitEncoder` and `getUnitDecoder` functions are also available.

```ts
getUnitEncoder().encode(undefined);
getUnitDecoder().decode(anyBytes);
```

---

To read more about the available codecs and how to use them, check out the documentation of the main [`@solana/codecs` package](https://github.com/solana-labs/solana-web3.js/tree/master/packages/codecs).

## Hidden prefix and suffix codec

The `getHiddenPrefixCodec` and `getHiddenSuffixCodec` functions allow us to respectively prepend or append a list of hidden `Codec<void>` to a given codec. When encoding, the hidden codecs will be encoded before or after the main codec and the offset will be moved accordingly. When decoding, the hidden codecs will be decoded but only the result of the main codec will be returned. This is particularly helpful when creating data structures that include constant values that should not be included in the final type.

```ts
const codec: Codec<number> = getHiddenPrefixCodec(getU16Codec(), [
    getConstantCodec(new Uint8Array([1, 2, 3])),
    getConstantCodec(new Uint8Array([4, 5, 6])),
]);

codec.encode(42);
// 0x0102030405062a00
//   |     |     └-- Our main u16 codec (value = 42).
//   |     └-- Our second hidden prefix codec.
//   └-- Our first hidden prefix codec.

codec.decode(new Uint8Array([1, 2, 3, 4, 5, 6, 42, 0])); // 42
```

As usual, separate encoder and decoder functions are also available.

```ts
getHiddenPrefixEncoder(encoder, prefixedEncoders);
getHiddenPrefixEncoder(decoder, prefixedDecoders);
getHiddenSuffixEncoder(encoder, suffixedEncoders);
getHiddenSuffixEncoder(decoder, suffixedDecoders);
```
