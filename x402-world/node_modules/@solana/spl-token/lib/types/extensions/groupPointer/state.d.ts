import { PublicKey } from '@solana/web3.js';
import type { Mint } from '../../state/mint.js';
/** GroupPointer as stored by the program */
export interface GroupPointer {
    /** Optional authority that can set the group address */
    authority: PublicKey | null;
    /** Optional account address that holds the group */
    groupAddress: PublicKey | null;
}
/** Buffer layout for de/serializing a GroupPointer extension */
export declare const GroupPointerLayout: import("@solana/buffer-layout").Structure<{
    authority: PublicKey;
    groupAddress: PublicKey;
}>;
export declare const GROUP_POINTER_SIZE: number;
export declare function getGroupPointerState(mint: Mint): Partial<GroupPointer> | null;
//# sourceMappingURL=state.d.ts.map