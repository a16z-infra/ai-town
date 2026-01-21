import type { PublicKey, Signer } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from '../../instructions/types.js';
export declare enum CpiGuardInstruction {
    Enable = 0,
    Disable = 1
}
/** TODO: docs */
export interface CpiGuardInstructionData {
    instruction: TokenInstruction.CpiGuardExtension;
    cpiGuardInstruction: CpiGuardInstruction;
}
/** TODO: docs */
export declare const cpiGuardInstructionData: import("@solana/buffer-layout").Structure<CpiGuardInstructionData>;
/**
 * Construct an EnableCpiGuard instruction
 *
 * @param account         Token account to update
 * @param authority       The account's owner/delegate
 * @param signers         The signer account(s)
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createEnableCpiGuardInstruction(account: PublicKey, authority: PublicKey, multiSigners?: (Signer | PublicKey)[], programId?: PublicKey): TransactionInstruction;
/**
 * Construct a DisableCpiGuard instruction
 *
 * @param account         Token account to update
 * @param authority       The account's owner/delegate
 * @param signers         The signer account(s)
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createDisableCpiGuardInstruction(account: PublicKey, authority: PublicKey, multiSigners?: (Signer | PublicKey)[], programId?: PublicKey): TransactionInstruction;
//# sourceMappingURL=instructions.d.ts.map