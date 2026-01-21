import type { AccountMeta, PublicKey } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from './types.js';
export interface InitializeAccount2InstructionData {
    instruction: TokenInstruction.InitializeAccount2;
    owner: PublicKey;
}
export declare const initializeAccount2InstructionData: import("@solana/buffer-layout").Structure<InitializeAccount2InstructionData>;
/**
 * Construct an InitializeAccount2 instruction
 *
 * @param account   New token account
 * @param mint      Mint account
 * @param owner     New account's owner/multisignature
 * @param programId SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createInitializeAccount2Instruction(account: PublicKey, mint: PublicKey, owner: PublicKey, programId?: PublicKey): TransactionInstruction;
/** A decoded, valid InitializeAccount2 instruction */
export interface DecodedInitializeAccount2Instruction {
    programId: PublicKey;
    keys: {
        account: AccountMeta;
        mint: AccountMeta;
        rent: AccountMeta;
    };
    data: {
        instruction: TokenInstruction.InitializeAccount2;
        owner: PublicKey;
    };
}
/**
 * Decode an InitializeAccount2 instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export declare function decodeInitializeAccount2Instruction(instruction: TransactionInstruction, programId?: PublicKey): DecodedInitializeAccount2Instruction;
/** A decoded, non-validated InitializeAccount2 instruction */
export interface DecodedInitializeAccount2InstructionUnchecked {
    programId: PublicKey;
    keys: {
        account: AccountMeta | undefined;
        mint: AccountMeta | undefined;
        rent: AccountMeta | undefined;
    };
    data: {
        instruction: number;
        owner: PublicKey;
    };
}
/**
 * Decode an InitializeAccount2 instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export declare function decodeInitializeAccount2InstructionUnchecked({ programId, keys: [account, mint, rent], data, }: TransactionInstruction): DecodedInitializeAccount2InstructionUnchecked;
//# sourceMappingURL=initializeAccount2.d.ts.map