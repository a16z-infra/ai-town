import type { AccountMeta, PublicKey } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
export interface SyncNativeInstructionData {
    instruction: TokenInstruction.SyncNative;
}
/** TODO: docs */
export declare const syncNativeInstructionData: import("@solana/buffer-layout").Structure<SyncNativeInstructionData>;
/**
 * Construct a SyncNative instruction
 *
 * @param account   Native account to sync lamports from
 * @param programId SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createSyncNativeInstruction(account: PublicKey, programId?: PublicKey): TransactionInstruction;
/** A decoded, valid SyncNative instruction */
export interface DecodedSyncNativeInstruction {
    programId: PublicKey;
    keys: {
        account: AccountMeta;
    };
    data: {
        instruction: TokenInstruction.SyncNative;
    };
}
/**
 * Decode a SyncNative instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export declare function decodeSyncNativeInstruction(instruction: TransactionInstruction, programId?: PublicKey): DecodedSyncNativeInstruction;
/** A decoded, non-validated SyncNative instruction */
export interface DecodedSyncNativeInstructionUnchecked {
    programId: PublicKey;
    keys: {
        account: AccountMeta | undefined;
    };
    data: {
        instruction: number;
    };
}
/**
 * Decode a SyncNative instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export declare function decodeSyncNativeInstructionUnchecked({ programId, keys: [account], data, }: TransactionInstruction): DecodedSyncNativeInstructionUnchecked;
//# sourceMappingURL=syncNative.d.ts.map