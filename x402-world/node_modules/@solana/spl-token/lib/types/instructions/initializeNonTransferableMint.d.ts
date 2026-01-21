import type { PublicKey } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from './types.js';
/** Deserialized instruction for the initiation of an immutable owner account */
export interface InitializeNonTransferableMintInstructionData {
    instruction: TokenInstruction.InitializeNonTransferableMint;
}
/** The struct that represents the instruction data as it is read by the program */
export declare const initializeNonTransferableMintInstructionData: import("@solana/buffer-layout").Structure<InitializeNonTransferableMintInstructionData>;
/**
 * Construct an InitializeNonTransferableMint instruction
 *
 * @param mint           Mint Account to make non-transferable
 * @param programId         SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createInitializeNonTransferableMintInstruction(mint: PublicKey, programId: PublicKey): TransactionInstruction;
//# sourceMappingURL=initializeNonTransferableMint.d.ts.map