/// <reference types="node" />
import { Layout } from '@solana/buffer-layout';
export interface EncodeDecode<T> {
    decode(buffer: Buffer, offset?: number): T;
    encode(src: T, buffer: Buffer, offset?: number): number;
}
export declare const encodeDecode: <T>(layout: Layout<T>) => EncodeDecode<T>;
