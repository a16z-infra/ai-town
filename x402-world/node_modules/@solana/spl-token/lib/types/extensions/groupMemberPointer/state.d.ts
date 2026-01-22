import { PublicKey } from '@solana/web3.js';
import type { Mint } from '../../state/mint.js';
/** GroupMemberPointer as stored by the program */
export interface GroupMemberPointer {
    /** Optional authority that can set the member address */
    authority: PublicKey | null;
    /** Optional account address that holds the member */
    memberAddress: PublicKey | null;
}
/** Buffer layout for de/serializing a Group Pointer extension */
export declare const GroupMemberPointerLayout: import("@solana/buffer-layout").Structure<{
    authority: PublicKey;
    memberAddress: PublicKey;
}>;
export declare const GROUP_MEMBER_POINTER_SIZE: number;
export declare function getGroupMemberPointerState(mint: Mint): Partial<GroupMemberPointer> | null;
//# sourceMappingURL=state.d.ts.map