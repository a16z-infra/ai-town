import type { AccountMeta, PublicKey } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from './types.js';
/** Deserialized instruction for the initiation of an immutable owner account */
export interface InitializeImmutableOwnerInstructionData {
    instruction: TokenInstruction.InitializeImmutableOwner;
}
/** The struct that represents the instruction data as it is read by the program */
export declare const initializeImmutableOwnerInstructionData: import("@solana/buffer-layout").Structure<InitializeImmutableOwnerInstructionData>;
/**
 * Construct an InitializeImmutableOwner instruction
 *
 * @param account           Immutable Owner Account
 * @param programId         SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createInitializeImmutableOwnerInstruction(account: PublicKey, programId: PublicKey): TransactionInstruction;
/** A decoded, valid InitializeImmutableOwner instruction */
export interface DecodedInitializeImmutableOwnerInstruction {
    programId: PublicKey;
    keys: {
        account: AccountMeta;
    };
    data: {
        instruction: TokenInstruction.InitializeImmutableOwner;
    };
}
/**
 * Decode an InitializeImmutableOwner instruction and validate it
 *
 * @param instruction InitializeImmutableOwner instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export declare function decodeInitializeImmutableOwnerInstruction(instruction: TransactionInstruction, programId: PublicKey): DecodedInitializeImmutableOwnerInstruction;
/** A decoded, non-validated InitializeImmutableOwner instruction */
export interface DecodedInitializeImmutableOwnerInstructionUnchecked {
    programId: PublicKey;
    keys: {
        account: AccountMeta | undefined;
    };
    data: {
        instruction: number;
    };
}
/**
 * Decode an InitializeImmutableOwner instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export declare function decodeInitializeImmutableOwnerInstructionUnchecked({ programId, keys: [account], data, }: TransactionInstruction): DecodedInitializeImmutableOwnerInstructionUnchecked;
//# sourceMappingURL=initializeImmutableOwner.d.ts.map