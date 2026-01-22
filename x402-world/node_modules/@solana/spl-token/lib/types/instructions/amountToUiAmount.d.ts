import type { AccountMeta, PublicKey } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
export interface AmountToUiAmountInstructionData {
    instruction: TokenInstruction.AmountToUiAmount;
    amount: bigint;
}
/** TODO: docs */
export declare const amountToUiAmountInstructionData: import("@solana/buffer-layout").Structure<AmountToUiAmountInstructionData>;
/**
 * Construct a AmountToUiAmount instruction
 *
 * @param mint         Public key of the mint
 * @param amount       Amount of tokens to be converted to UiAmount
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createAmountToUiAmountInstruction(mint: PublicKey, amount: number | bigint, programId?: PublicKey): TransactionInstruction;
/** A decoded, valid AmountToUiAmount instruction */
export interface DecodedAmountToUiAmountInstruction {
    programId: PublicKey;
    keys: {
        mint: AccountMeta;
    };
    data: {
        instruction: TokenInstruction.AmountToUiAmount;
        amount: bigint;
    };
}
/**
 * Decode a AmountToUiAmount instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export declare function decodeAmountToUiAmountInstruction(instruction: TransactionInstruction, programId?: PublicKey): DecodedAmountToUiAmountInstruction;
/** A decoded, non-validated AmountToUiAmount instruction */
export interface DecodedAmountToUiAmountInstructionUnchecked {
    programId: PublicKey;
    keys: {
        mint: AccountMeta | undefined;
    };
    data: {
        instruction: number;
        amount: bigint;
    };
}
/**
 * Decode a AmountToUiAmount instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export declare function decodeAmountToUiAmountInstructionUnchecked({ programId, keys: [mint], data, }: TransactionInstruction): DecodedAmountToUiAmountInstructionUnchecked;
//# sourceMappingURL=amountToUiAmount.d.ts.map