text-encoding-utf-8
==============

This is a **partial** polyfill for the [Encoding Living Standard](https://encoding.spec.whatwg.org/)
API for the Web, allowing encoding and decoding of textual data to and from Typed Array
buffers for binary data in JavaScript.

This is fork of [text-encoding](https://github.com/inexorabletash/text-encoding)
that **only** support **UTF-8**.

Basic examples and tests are included.

### Install ###

There are a few ways you can get the `text-encoding-utf-8` library.

#### Node ####

`text-encoding-utf-8` is on `npm`. Simply run:

```js
npm install text-encoding-utf-8
```

Or add it to your `package.json` dependencies.

### HTML Page Usage ###

```html
  <script src="encoding.js"></script>
```

### API Overview ###

Basic Usage

```js
  var uint8array = TextEncoder(encoding).encode(string);
  var string = TextDecoder(encoding).decode(uint8array);
```

Streaming Decode

```js
  var string = "", decoder = TextDecoder(encoding), buffer;
  while (buffer = next_chunk()) {
    string += decoder.decode(buffer, {stream:true});
  }
  string += decoder.decode(); // finish the stream
```

### Encodings ###

Only `utf-8` and `UTF-8` are supported.

### Non-Standard Behavior ###

Only `utf-8` and `UTF-8` are supported.

### Motivation

Binary size matters, especially on a mobile phone. Safari on iOS does not
support TextDecoder or TextEncoder.
