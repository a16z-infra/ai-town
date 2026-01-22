import type { Signer } from '@solana/web3.js';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from '../../instructions/types.js';
export declare enum GroupMemberPointerInstruction {
    Initialize = 0,
    Update = 1
}
export declare const initializeGroupMemberPointerData: import("@solana/buffer-layout").Structure<{
    instruction: TokenInstruction.GroupMemberPointerExtension;
    groupMemberPointerInstruction: number;
    authority: PublicKey;
    memberAddress: PublicKey;
}>;
/**
 * Construct an Initialize GroupMemberPointer instruction
 *
 * @param mint            Token mint account
 * @param authority       Optional Authority that can set the member address
 * @param memberAddress   Optional Account address that holds the member
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createInitializeGroupMemberPointerInstruction(mint: PublicKey, authority: PublicKey | null, memberAddress: PublicKey | null, programId?: PublicKey): TransactionInstruction;
export declare const updateGroupMemberPointerData: import("@solana/buffer-layout").Structure<{
    instruction: TokenInstruction.GroupMemberPointerExtension;
    groupMemberPointerInstruction: number;
    memberAddress: PublicKey;
}>;
export declare function createUpdateGroupMemberPointerInstruction(mint: PublicKey, authority: PublicKey, memberAddress: PublicKey | null, multiSigners?: (Signer | PublicKey)[], programId?: PublicKey): TransactionInstruction;
//# sourceMappingURL=instructions.d.ts.map