// This is free and unencumbered software released into the public domain.
// See LICENSE.md for more information.

import {
  TextDecoder as TextDecoderPolyfill,
  TextEncoder as TextEncoderPolyfill,
} from './encoding.js'

function getGlobal() {
  if (typeof self !== 'undefined') return self;
  if (typeof global !== 'undefined') return global;
  throw new Error('No global found');
}

if (typeof TextDecoder !== 'function') {
  getGlobal().TextDecoder = TextDecoderPolyfill;
}

if (typeof TextEncoder !== 'function') {
  getGlobal().TextEncoder = TextEncoderPolyfill;
}
