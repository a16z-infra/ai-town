import { PublicKey } from '@solana/web3.js';
import type { ReadonlyUint8Array } from '@solana/codecs';
export declare const TOKEN_GROUP_MEMBER_SIZE: number;
export interface TokenGroupMember {
    /** The associated mint, used to counter spoofing to be sure that member belongs to a particular mint */
    mint: PublicKey;
    /** The pubkey of the `TokenGroup` */
    group: PublicKey;
    /** The member number */
    memberNumber: bigint;
}
export declare function packTokenGroupMember(member: TokenGroupMember): ReadonlyUint8Array;
export declare function unpackTokenGroupMember(buffer: Buffer | Uint8Array | ReadonlyUint8Array): TokenGroupMember;
//# sourceMappingURL=tokenGroupMember.d.ts.map