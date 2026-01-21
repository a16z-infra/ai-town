import { PublicKey } from '@solana/web3.js';
import type { ReadonlyUint8Array } from '@solana/codecs';
export declare const TOKEN_GROUP_SIZE: number;
export interface TokenGroup {
    /** The authority that can sign to update the group */
    updateAuthority?: PublicKey;
    /** The associated mint, used to counter spoofing to be sure that group belongs to a particular mint */
    mint: PublicKey;
    /** The current number of group members */
    size: bigint;
    /** The maximum number of group members */
    maxSize: bigint;
}
export declare function packTokenGroup(group: TokenGroup): ReadonlyUint8Array;
export declare function unpackTokenGroup(buffer: Buffer | Uint8Array | ReadonlyUint8Array): TokenGroup;
//# sourceMappingURL=tokenGroup.d.ts.map