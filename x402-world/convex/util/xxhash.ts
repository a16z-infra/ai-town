/*
From https://github.com/Jason3S/xxhash

MIT License

Copyright (c) 2019 Jason Dent

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

const PRIME32_1 = 2654435761;
const PRIME32_2 = 2246822519;
const PRIME32_3 = 3266489917;
const PRIME32_4 = 668265263;
const PRIME32_5 = 374761393;

export function toUtf8(text: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0, n = text.length; i < n; ++i) {
    const c = text.charCodeAt(i);
    if (c < 0x80) {
      bytes.push(c);
    } else if (c < 0x800) {
      bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    } else if (c < 0xd800 || c >= 0xe000) {
      bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    } else {
      const cp = 0x10000 + (((c & 0x3ff) << 10) | (text.charCodeAt(++i) & 0x3ff));
      bytes.push(
        0xf0 | ((cp >> 18) & 0x7),
        0x80 | ((cp >> 12) & 0x3f),
        0x80 | ((cp >> 6) & 0x3f),
        0x80 | (cp & 0x3f),
      );
    }
  }
  return new Uint8Array(bytes);
}

/**
 *
 * @param buffer - byte array or string
 * @param seed - optional seed (32-bit unsigned);
 */
export function xxHash32(buffer: Uint8Array | string, seed = 0): number {
  buffer = typeof buffer === 'string' ? toUtf8(buffer) : buffer;
  const b = buffer;

  /*
        Step 1. Initialize internal accumulators
        Each accumulator gets an initial value based on optional seed input. Since the seed is optional, it can be 0.

        ```
            u32 acc1 = seed + PRIME32_1 + PRIME32_2;
            u32 acc2 = seed + PRIME32_2;
            u32 acc3 = seed + 0;
            u32 acc4 = seed - PRIME32_1;
        ```
        Special case : input is less than 16 bytes
        When input is too small (< 16 bytes), the algorithm will not process any stripe. Consequently, it will not
        make use of parallel accumulators.

        In which case, a simplified initialization is performed, using a single accumulator :

        u32 acc  = seed + PRIME32_5;
        The algorithm then proceeds directly to step 4.
    */

  let acc = (seed + PRIME32_5) & 0xffffffff;
  let offset = 0;

  if (b.length >= 16) {
    const accN = [
      (seed + PRIME32_1 + PRIME32_2) & 0xffffffff,
      (seed + PRIME32_2) & 0xffffffff,
      (seed + 0) & 0xffffffff,
      (seed - PRIME32_1) & 0xffffffff,
    ];

    /*
            Step 2. Process stripes
            A stripe is a contiguous segment of 16 bytes. It is evenly divided into 4 lanes, of 4 bytes each.
            The first lane is used to update accumulator 1, the second lane is used to update accumulator 2, and so on.

            Each lane read its associated 32-bit value using little-endian convention.

            For each {lane, accumulator}, the update process is called a round, and applies the following formula :

            ```
            accN = accN + (laneN * PRIME32_2);
            accN = accN <<< 13;
            accN = accN * PRIME32_1;
            ```

            This shuffles the bits so that any bit from input lane impacts several bits in output accumulator.
            All operations are performed modulo 2^32.

            Input is consumed one full stripe at a time. Step 2 is looped as many times as necessary to consume
            the whole input, except the last remaining bytes which cannot form a stripe (< 16 bytes). When that
            happens, move to step 3.
        */

    const b = buffer;
    const limit = b.length - 16;
    let lane = 0;
    for (offset = 0; (offset & 0xfffffff0) <= limit; offset += 4) {
      const i = offset;
      const laneN0 = (b[i + 0] as any) + ((b[i + 1] as any) << 8);
      const laneN1 = (b[i + 2] as any) + ((b[i + 3] as any) << 8);
      const laneNP = laneN0 * PRIME32_2 + ((laneN1 * PRIME32_2) << 16);
      let acc = (accN[lane] + laneNP) & 0xffffffff;
      acc = (acc << 13) | (acc >>> 19);
      const acc0 = acc & 0xffff;
      const acc1 = acc >>> 16;
      accN[lane] = (acc0 * PRIME32_1 + ((acc1 * PRIME32_1) << 16)) & 0xffffffff;
      lane = (lane + 1) & 0x3;
    }

    /*
            Step 3. Accumulator convergence
            All 4 lane accumulators from previous steps are merged to produce a single remaining accumulator
            of same width (32-bit). The associated formula is as follows :

            ```
            acc = (acc1 <<< 1) + (acc2 <<< 7) + (acc3 <<< 12) + (acc4 <<< 18);
            ```
        */
    acc =
      (((accN[0] << 1) | (accN[0] >>> 31)) +
        ((accN[1] << 7) | (accN[1] >>> 25)) +
        ((accN[2] << 12) | (accN[2] >>> 20)) +
        ((accN[3] << 18) | (accN[3] >>> 14))) &
      0xffffffff;
  }

  /*
        Step 4. Add input length
        The input total length is presumed known at this stage. This step is just about adding the length to
        accumulator, so that it participates to final mixing.

        ```
        acc = acc + (u32)inputLength;
        ```
    */
  acc = (acc + buffer.length) & 0xffffffff;

  /*
        Step 5. Consume remaining input
        There may be up to 15 bytes remaining to consume from the input. The final stage will digest them according
        to following pseudo-code :
        ```
        while (remainingLength >= 4) {
            lane = read_32bit_little_endian(input_ptr);
            acc = acc + lane * PRIME32_3;
            acc = (acc <<< 17) * PRIME32_4;
            input_ptr += 4; remainingLength -= 4;
        }
        ```
        This process ensures that all input bytes are present in the final mix.
    */

  const limit = buffer.length - 4;
  for (; offset <= limit; offset += 4) {
    const i = offset;
    const laneN0 = (b[i + 0] as any) + ((b[i + 1] as any) << 8);
    const laneN1 = (b[i + 2] as any) + ((b[i + 3] as any) << 8);
    const laneP = laneN0 * PRIME32_3 + ((laneN1 * PRIME32_3) << 16);
    acc = (acc + laneP) & 0xffffffff;
    acc = (acc << 17) | (acc >>> 15);
    acc = ((acc & 0xffff) * PRIME32_4 + (((acc >>> 16) * PRIME32_4) << 16)) & 0xffffffff;
  }

  /*
        ```
        while (remainingLength >= 1) {
            lane = read_byte(input_ptr);
            acc = acc + lane * PRIME32_5;
            acc = (acc <<< 11) * PRIME32_1;
            input_ptr += 1; remainingLength -= 1;
        }
        ```
    */

  for (; offset < b.length; ++offset) {
    const lane = b[offset];
    acc = acc + (lane as any) * PRIME32_5;
    acc = (acc << 11) | (acc >>> 21);
    acc = ((acc & 0xffff) * PRIME32_1 + (((acc >>> 16) * PRIME32_1) << 16)) & 0xffffffff;
  }

  /*
        Step 6. Final mix (avalanche)
        The final mix ensures that all input bits have a chance to impact any bit in the output digest,
        resulting in an unbiased distribution. This is also called avalanche effect.
        ```
        acc = acc xor (acc >> 15);
        acc = acc * PRIME32_2;
        acc = acc xor (acc >> 13);
        acc = acc * PRIME32_3;
        acc = acc xor (acc >> 16);
        ```
    */

  acc = acc ^ (acc >>> 15);
  acc = (((acc & 0xffff) * PRIME32_2) & 0xffffffff) + (((acc >>> 16) * PRIME32_2) << 16);
  acc = acc ^ (acc >>> 13);
  acc = (((acc & 0xffff) * PRIME32_3) & 0xffffffff) + (((acc >>> 16) * PRIME32_3) << 16);
  acc = acc ^ (acc >>> 16);

  // turn any negatives back into a positive number;
  return acc < 0 ? acc + 4294967296 : acc;
}
