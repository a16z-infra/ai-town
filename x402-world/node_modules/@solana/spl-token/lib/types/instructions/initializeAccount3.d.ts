import type { AccountMeta, PublicKey } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from './types.js';
export interface InitializeAccount3InstructionData {
    instruction: TokenInstruction.InitializeAccount3;
    owner: PublicKey;
}
export declare const initializeAccount3InstructionData: import("@solana/buffer-layout").Structure<InitializeAccount3InstructionData>;
/**
 * Construct an InitializeAccount3 instruction
 *
 * @param account   New token account
 * @param mint      Mint account
 * @param owner     New account's owner/multisignature
 * @param programId SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createInitializeAccount3Instruction(account: PublicKey, mint: PublicKey, owner: PublicKey, programId?: PublicKey): TransactionInstruction;
/** A decoded, valid InitializeAccount3 instruction */
export interface DecodedInitializeAccount3Instruction {
    programId: PublicKey;
    keys: {
        account: AccountMeta;
        mint: AccountMeta;
    };
    data: {
        instruction: TokenInstruction.InitializeAccount3;
        owner: PublicKey;
    };
}
/**
 * Decode an InitializeAccount3 instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export declare function decodeInitializeAccount3Instruction(instruction: TransactionInstruction, programId?: PublicKey): DecodedInitializeAccount3Instruction;
/** A decoded, non-validated InitializeAccount3 instruction */
export interface DecodedInitializeAccount3InstructionUnchecked {
    programId: PublicKey;
    keys: {
        account: AccountMeta | undefined;
        mint: AccountMeta | undefined;
    };
    data: {
        instruction: number;
        owner: PublicKey;
    };
}
/**
 * Decode an InitializeAccount3 instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export declare function decodeInitializeAccount3InstructionUnchecked({ programId, keys: [account, mint], data, }: TransactionInstruction): DecodedInitializeAccount3InstructionUnchecked;
//# sourceMappingURL=initializeAccount3.d.ts.map