import type { PublicKey, Signer } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from '../../instructions/types.js';
export declare enum MemoTransferInstruction {
    Enable = 0,
    Disable = 1
}
/** TODO: docs */
export interface MemoTransferInstructionData {
    instruction: TokenInstruction.MemoTransferExtension;
    memoTransferInstruction: MemoTransferInstruction;
}
/** TODO: docs */
export declare const memoTransferInstructionData: import("@solana/buffer-layout").Structure<MemoTransferInstructionData>;
/**
 * Construct an EnableRequiredMemoTransfers instruction
 *
 * @param account         Token account to update
 * @param authority       The account's owner/delegate
 * @param signers         The signer account(s)
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createEnableRequiredMemoTransfersInstruction(account: PublicKey, authority: PublicKey, multiSigners?: (Signer | PublicKey)[], programId?: PublicKey): TransactionInstruction;
/**
 * Construct a DisableMemoTransfer instruction
 *
 * @param account         Token account to update
 * @param authority       The account's owner/delegate
 * @param signers         The signer account(s)
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createDisableRequiredMemoTransfersInstruction(account: PublicKey, authority: PublicKey, multiSigners?: (Signer | PublicKey)[], programId?: PublicKey): TransactionInstruction;
//# sourceMappingURL=instructions.d.ts.map