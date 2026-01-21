import { blob, Layout } from '@solana/buffer-layout';
import { toBigIntBE, toBigIntLE, toBufferBE, toBufferLE } from 'bigint-buffer';
import { encodeDecode } from './base';

export const bigInt =
    (length: number) =>
    (property?: string): Layout<bigint> => {
        const layout = blob(length, property);
        const { encode, decode } = encodeDecode(layout);

        const bigIntLayout = layout as Layout<unknown> as Layout<bigint>;

        bigIntLayout.decode = (buffer: Buffer, offset: number) => {
            const src = decode(buffer, offset);
            return toBigIntLE(Buffer.from(src));
        };

        bigIntLayout.encode = (bigInt: bigint, buffer: Buffer, offset: number) => {
            const src = toBufferLE(bigInt, length);
            return encode(src, buffer, offset);
        };

        return bigIntLayout;
    };

export const bigIntBE =
    (length: number) =>
    (property?: string): Layout<bigint> => {
        const layout = blob(length, property);
        const { encode, decode } = encodeDecode(layout);

        const bigIntLayout = layout as Layout<unknown> as Layout<bigint>;

        bigIntLayout.decode = (buffer: Buffer, offset: number) => {
            const src = decode(buffer, offset);
            return toBigIntBE(Buffer.from(src));
        };

        bigIntLayout.encode = (bigInt: bigint, buffer: Buffer, offset: number) => {
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
