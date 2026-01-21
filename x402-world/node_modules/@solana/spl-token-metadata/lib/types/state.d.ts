import { PublicKey } from '@solana/web3.js';
import type { ReadonlyUint8Array } from '@solana/codecs';
export declare const TOKEN_METADATA_DISCRIMINATOR: Buffer;
export interface TokenMetadata {
    updateAuthority?: PublicKey;
    mint: PublicKey;
    name: string;
    symbol: string;
    uri: string;
    additionalMetadata: (readonly [string, string])[];
}
export declare function pack(meta: TokenMetadata): ReadonlyUint8Array;
export declare function unpack(buffer: Buffer | Uint8Array | ReadonlyUint8Array): TokenMetadata;
//# sourceMappingURL=state.d.ts.map