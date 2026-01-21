import type { AccountMeta, PublicKey } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
export interface InitializeAccountInstructionData {
    instruction: TokenInstruction.InitializeAccount;
}
/** TODO: docs */
export declare const initializeAccountInstructionData: import("@solana/buffer-layout").Structure<InitializeAccountInstructionData>;
/**
 * Construct an InitializeAccount instruction
 *
 * @param account   New token account
 * @param mint      Mint account
 * @param owner     Owner of the new account
 * @param programId SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createInitializeAccountInstruction(account: PublicKey, mint: PublicKey, owner: PublicKey, programId?: PublicKey): TransactionInstruction;
/** A decoded, valid InitializeAccount instruction */
export interface DecodedInitializeAccountInstruction {
    programId: PublicKey;
    keys: {
        account: AccountMeta;
        mint: AccountMeta;
        owner: AccountMeta;
        rent: AccountMeta;
    };
    data: {
        instruction: TokenInstruction.InitializeAccount;
    };
}
/**
 * Decode an InitializeAccount instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export declare function decodeInitializeAccountInstruction(instruction: TransactionInstruction, programId?: PublicKey): DecodedInitializeAccountInstruction;
/** A decoded, non-validated InitializeAccount instruction */
export interface DecodedInitializeAccountInstructionUnchecked {
    programId: PublicKey;
    keys: {
        account: AccountMeta | undefined;
        mint: AccountMeta | undefined;
        owner: AccountMeta | undefined;
        rent: AccountMeta | undefined;
    };
    data: {
        instruction: number;
    };
}
/**
 * Decode an InitializeAccount instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export declare function decodeInitializeAccountInstructionUnchecked({ programId, keys: [account, mint, owner, rent], data, }: TransactionInstruction): DecodedInitializeAccountInstructionUnchecked;
//# sourceMappingURL=initializeAccount.d.ts.map