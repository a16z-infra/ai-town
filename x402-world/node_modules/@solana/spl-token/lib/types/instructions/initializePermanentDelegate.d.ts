import type { AccountMeta } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
export interface InitializePermanentDelegateInstructionData {
    instruction: TokenInstruction.InitializePermanentDelegate;
    delegate: PublicKey;
}
/** TODO: docs */
export declare const initializePermanentDelegateInstructionData: import("@solana/buffer-layout").Structure<InitializePermanentDelegateInstructionData>;
/**
 * Construct an InitializePermanentDelegate instruction
 *
 * @param mint               Token mint account
 * @param permanentDelegate  Authority that may sign for `Transfer`s and `Burn`s on any account
 * @param programId          SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createInitializePermanentDelegateInstruction(mint: PublicKey, permanentDelegate: PublicKey | null, programId: PublicKey): TransactionInstruction;
/** A decoded, valid InitializePermanentDelegate instruction */
export interface DecodedInitializePermanentDelegateInstruction {
    programId: PublicKey;
    keys: {
        mint: AccountMeta;
    };
    data: {
        instruction: TokenInstruction.InitializePermanentDelegate;
        delegate: PublicKey | null;
    };
}
/**
 * Decode an InitializePermanentDelegate instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export declare function decodeInitializePermanentDelegateInstruction(instruction: TransactionInstruction, programId: PublicKey): DecodedInitializePermanentDelegateInstruction;
/** A decoded, non-validated InitializePermanentDelegate instruction */
export interface DecodedInitializePermanentDelegateInstructionUnchecked {
    programId: PublicKey;
    keys: {
        mint: AccountMeta | undefined;
    };
    data: {
        instruction: number;
        delegate: PublicKey | null;
    };
}
/**
 * Decode an InitializePermanentDelegate instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export declare function decodeInitializePermanentDelegateInstructionUnchecked({ programId, keys: [mint], data, }: TransactionInstruction): DecodedInitializePermanentDelegateInstructionUnchecked;
//# sourceMappingURL=initializePermanentDelegate.d.ts.map