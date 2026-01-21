/**
 * FastIntegerCompression.js : a fast integer compression library in JavaScript.
 * From https://github.com/lemire/FastIntegerCompression.js/
 * (c) the authors
 * Licensed under the Apache License, Version 2.0.
 *
 *FastIntegerCompression
 * Simple usage :
 *  // var FastIntegerCompression = require("fastintcompression");// if you use node
 *  var array = [10,100000,65999,10,10,0,1,1,2000];
 *  var buf = FastIntegerCompression.compress(array);
 *  var back = FastIntegerCompression.uncompress(buf); // gets back [10,100000,65999,10,10,0,1,1,2000]
 *
 *
 * You can install the library under node with the command line
 *   npm install fastintcompression
 */

function bytelog(val: number) {
  if (val < 1 << 7) {
    return 1;
  } else if (val < 1 << 14) {
    return 2;
  } else if (val < 1 << 21) {
    return 3;
  } else if (val < 1 << 28) {
    return 4;
  }
  return 5;
}

function zigzag_encode(val: number) {
  return (val + val) ^ (val >> 31);
}

function zigzag_decode(val: number) {
  return (val >> 1) ^ -(val & 1);
}

// Compute how many bytes an array of integers would use once compressed.
// The input is expected to be an array of non-negative integers.
export function computeCompressedSizeInBytes(input: number[]) {
  const c = input.length;
  let answer = 0;
  for (let i = 0; i < c; i++) {
    answer += bytelog(input[i]);
  }
  return answer;
}

// Compute how many bytes an array of integers would use once compressed.
// The input is expected to be an array of integers, some of them can be negative.
export function computeCompressedSizeInBytesSigned(input: number[]) {
  const c = input.length;
  let answer = 0;
  for (let i = 0; i < c; i++) {
    answer += bytelog(zigzag_encode(input[i]));
  }
  return answer;
}

// Compress an array of integers, return a compressed buffer (as an ArrayBuffer).
// It is expected that the integers are non-negative: the caller is responsible
// for making this check. Floating-point numbers are not supported.
export function compress(input: number[]) {
  const c = input.length;
  const buf = new ArrayBuffer(computeCompressedSizeInBytes(input));
  const view = new Int8Array(buf);
  let pos = 0;
  for (let i = 0; i < c; i++) {
    const val = input[i];
    if (val < 1 << 7) {
      view[pos++] = val;
    } else if (val < 1 << 14) {
      view[pos++] = (val & 0x7f) | 0x80;
      view[pos++] = val >>> 7;
    } else if (val < 1 << 21) {
      view[pos++] = (val & 0x7f) | 0x80;
      view[pos++] = ((val >>> 7) & 0x7f) | 0x80;
      view[pos++] = val >>> 14;
    } else if (val < 1 << 28) {
      view[pos++] = (val & 0x7f) | 0x80;
      view[pos++] = ((val >>> 7) & 0x7f) | 0x80;
      view[pos++] = ((val >>> 14) & 0x7f) | 0x80;
      view[pos++] = val >>> 21;
    } else {
      view[pos++] = (val & 0x7f) | 0x80;
      view[pos++] = ((val >>> 7) & 0x7f) | 0x80;
      view[pos++] = ((val >>> 14) & 0x7f) | 0x80;
      view[pos++] = ((val >>> 21) & 0x7f) | 0x80;
      view[pos++] = val >>> 28;
    }
  }
  return buf;
}

// From a compressed array of integers stored ArrayBuffer,
// compute the number of compressed integers by scanning the input.
export function computeHowManyIntegers(input: ArrayBuffer) {
  const view = new Uint8Array(input);
  const c = view.length;
  let count = 0;
  for (let i = 0; i < c; i++) {
    count += view[i] >>> 7;
  }
  return c - count;
}
// Uncompress an array of integer from an ArrayBuffer, return the array.
// It is assumed that they were compressed using the compress function, the caller
// is responsible for ensuring that it is the case.
export function uncompress(input: ArrayBuffer) {
  const array = []; // The size of the output is not yet known.
  const inbyte = new Int8Array(input);
  const end = inbyte.length;
  let pos = 0;
  while (end > pos) {
    let c = inbyte[pos++];
    let v = c & 0x7f;
    if (c >= 0) {
      array.push(v);
      continue;
    }
    c = inbyte[pos++];
    v |= (c & 0x7f) << 7;
    if (c >= 0) {
      array.push(v);
      continue;
    }
    c = inbyte[pos++];
    v |= (c & 0x7f) << 14;
    if (c >= 0) {
      array.push(v);
      continue;
    }
    c = inbyte[pos++];
    v |= (c & 0x7f) << 21;
    if (c >= 0) {
      array.push(v);
      continue;
    }
    c = inbyte[pos++];
    v |= c << 28;
    v >>>= 0; // make positive
    array.push(v);
  }
  return array;
}

// Compress an array of integers, return a compressed buffer (as an ArrayBuffer).
// The integers can be signed (negative), but floating-point values are not supported.
export function compressSigned(input: number[]) {
  const c = input.length;
  const buf = new ArrayBuffer(computeCompressedSizeInBytesSigned(input));
  const view = new Int8Array(buf);
  let pos = 0;
  for (let i = 0; i < c; i++) {
    const val = zigzag_encode(input[i]);
    if (val < 1 << 7) {
      view[pos++] = val;
    } else if (val < 1 << 14) {
      view[pos++] = (val & 0x7f) | 0x80;
      view[pos++] = val >>> 7;
    } else if (val < 1 << 21) {
      view[pos++] = (val & 0x7f) | 0x80;
      view[pos++] = ((val >>> 7) & 0x7f) | 0x80;
      view[pos++] = val >>> 14;
    } else if (val < 1 << 28) {
      view[pos++] = (val & 0x7f) | 0x80;
      view[pos++] = ((val >>> 7) & 0x7f) | 0x80;
      view[pos++] = ((val >>> 14) & 0x7f) | 0x80;
      view[pos++] = val >>> 21;
    } else {
      view[pos++] = (val & 0x7f) | 0x80;
      view[pos++] = ((val >>> 7) & 0x7f) | 0x80;
      view[pos++] = ((val >>> 14) & 0x7f) | 0x80;
      view[pos++] = ((val >>> 21) & 0x7f) | 0x80;
      view[pos++] = val >>> 28;
    }
  }
  return buf;
}

// Uncompress an array of integer from an ArrayBuffer, return the array.
// It is assumed that they were compressed using the compressSigned function, the caller
// is responsible for ensuring that it is the case.
export function uncompressSigned(input: ArrayBuffer) {
  const array = []; // The size of the output is not yet known.
  const inbyte = new Int8Array(input);
  const end = inbyte.length;
  let pos = 0;
  while (end > pos) {
    let c = inbyte[pos++];
    let v = c & 0x7f;
    if (c >= 0) {
      array.push(zigzag_decode(v));
      continue;
    }
    c = inbyte[pos++];
    v |= (c & 0x7f) << 7;
    if (c >= 0) {
      array.push(zigzag_decode(v));
      continue;
    }
    c = inbyte[pos++];
    v |= (c & 0x7f) << 14;
    if (c >= 0) {
      array.push(zigzag_decode(v));
      continue;
    }
    c = inbyte[pos++];
    v |= (c & 0x7f) << 21;
    if (c >= 0) {
      array.push(zigzag_decode(v));
      continue;
    }
    c = inbyte[pos++];
    v |= c << 28;
    array.push(zigzag_decode(v));
  }
  return array;
}
