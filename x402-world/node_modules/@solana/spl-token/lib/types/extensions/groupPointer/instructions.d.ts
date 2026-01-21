import type { Signer } from '@solana/web3.js';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from '../../instructions/types.js';
export declare enum GroupPointerInstruction {
    Initialize = 0,
    Update = 1
}
export declare const initializeGroupPointerData: import("@solana/buffer-layout").Structure<{
    instruction: TokenInstruction.GroupPointerExtension;
    groupPointerInstruction: number;
    authority: PublicKey;
    groupAddress: PublicKey;
}>;
/**
 * Construct an Initialize GroupPointer instruction
 *
 * @param mint            Token mint account
 * @param authority       Optional Authority that can set the group address
 * @param groupAddress    Optional Account address that holds the group
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createInitializeGroupPointerInstruction(mint: PublicKey, authority: PublicKey | null, groupAddress: PublicKey | null, programId?: PublicKey): TransactionInstruction;
export declare const updateGroupPointerData: import("@solana/buffer-layout").Structure<{
    instruction: TokenInstruction.GroupPointerExtension;
    groupPointerInstruction: number;
    groupAddress: PublicKey;
}>;
export declare function createUpdateGroupPointerInstruction(mint: PublicKey, authority: PublicKey, groupAddress: PublicKey | null, multiSigners?: (Signer | PublicKey)[], programId?: PublicKey): TransactionInstruction;
//# sourceMappingURL=instructions.d.ts.map