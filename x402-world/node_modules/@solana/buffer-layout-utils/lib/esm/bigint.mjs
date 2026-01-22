import { blob } from '@solana/buffer-layout';
import { toBigIntBE, toBigIntLE, toBufferBE, toBufferLE } from 'bigint-buffer';
import { encodeDecode } from './base.mjs';
export const bigInt = (length) => (property) => {
    const layout = blob(length, property);
    const { encode, decode } = encodeDecode(layout);
    const bigIntLayout = layout;
    bigIntLayout.decode = (buffer, offset) => {
        const src = decode(buffer, offset);
        return toBigIntLE(Buffer.from(src));
    };
    bigIntLayout.encode = (bigInt, buffer, offset) => {
        const src = toBufferLE(bigInt, length);
        return encode(src, buffer, offset);
    };
    return bigIntLayout;
};
export const bigIntBE = (length) => (property) => {
    const layout = blob(length, property);
    const { encode, decode } = encodeDecode(layout);
    const bigIntLayout = layout;
    bigIntLayout.decode = (buffer, offset) => {
        const src = decode(buffer, offset);
        return toBigIntBE(Buffer.from(src));
    };
    bigIntLayout.encode = (bigInt, buffer, offset) => {
        const src = toBufferBE(bigInt, length);
        return encode(src, buffer, offset);
    };
    return bigIntLayout;
};
export const u64 = bigInt(8);
export const u64be = bigIntBE(8);
export const u128 = bigInt(16);
export const u128be = bigIntBE(16);
export const u192 = bigInt(24);
export const u192be = bigIntBE(24);
export const u256 = bigInt(32);
export const u256be = bigIntBE(32);
//# sourceMappingURL=bigint.js.map