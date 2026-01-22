import type { AccountMeta, PublicKey } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
export interface UiAmountToAmountInstructionData {
    instruction: TokenInstruction.UiAmountToAmount;
    amount: Uint8Array;
}
/** TODO: docs */
/**
 * Construct a UiAmountToAmount instruction
 *
 * @param mint         Public key of the mint
 * @param amount       UiAmount of tokens to be converted to Amount
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createUiAmountToAmountInstruction(mint: PublicKey, amount: string, programId?: PublicKey): TransactionInstruction;
/** A decoded, valid UiAmountToAmount instruction */
export interface DecodedUiAmountToAmountInstruction {
    programId: PublicKey;
    keys: {
        mint: AccountMeta;
    };
    data: {
        instruction: TokenInstruction.UiAmountToAmount;
        amount: Uint8Array;
    };
}
/**
 * Decode a UiAmountToAmount instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export declare function decodeUiAmountToAmountInstruction(instruction: TransactionInstruction, programId?: PublicKey): DecodedUiAmountToAmountInstruction;
/** A decoded, non-validated UiAmountToAmount instruction */
export interface DecodedUiAmountToAmountInstructionUnchecked {
    programId: PublicKey;
    keys: {
        mint: AccountMeta | undefined;
    };
    data: {
        instruction: number;
        amount: Uint8Array;
    };
}
/**
 * Decode a UiAmountToAmount instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export declare function decodeUiAmountToAmountInstructionUnchecked({ programId, keys: [mint], data, }: TransactionInstruction): DecodedUiAmountToAmountInstructionUnchecked;
//# sourceMappingURL=uiAmountToAmount.d.ts.map