import type { AccountMeta, PublicKey, Signer } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
export interface TransferCheckedInstructionData {
    instruction: TokenInstruction.TransferChecked;
    amount: bigint;
    decimals: number;
}
/** TODO: docs */
export declare const transferCheckedInstructionData: import("@solana/buffer-layout").Structure<TransferCheckedInstructionData>;
/**
 * Construct a TransferChecked instruction
 *
 * @param source       Source account
 * @param mint         Mint account
 * @param destination  Destination account
 * @param owner        Owner of the source account
 * @param amount       Number of tokens to transfer
 * @param decimals     Number of decimals in transfer amount
 * @param multiSigners Signing accounts if `owner` is a multisig
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createTransferCheckedInstruction(source: PublicKey, mint: PublicKey, destination: PublicKey, owner: PublicKey, amount: number | bigint, decimals: number, multiSigners?: (Signer | PublicKey)[], programId?: PublicKey): TransactionInstruction;
/** A decoded, valid TransferChecked instruction */
export interface DecodedTransferCheckedInstruction {
    programId: PublicKey;
    keys: {
        source: AccountMeta;
        mint: AccountMeta;
        destination: AccountMeta;
        owner: AccountMeta;
        multiSigners: AccountMeta[];
    };
    data: {
        instruction: TokenInstruction.TransferChecked;
        amount: bigint;
        decimals: number;
    };
}
/**
 * Decode a TransferChecked instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export declare function decodeTransferCheckedInstruction(instruction: TransactionInstruction, programId?: PublicKey): DecodedTransferCheckedInstruction;
/** A decoded, non-validated TransferChecked instruction */
export interface DecodedTransferCheckedInstructionUnchecked {
    programId: PublicKey;
    keys: {
        source: AccountMeta | undefined;
        mint: AccountMeta | undefined;
        destination: AccountMeta | undefined;
        owner: AccountMeta | undefined;
        multiSigners: AccountMeta[];
    };
    data: {
        instruction: number;
        amount: bigint;
        decimals: number;
    };
}
/**
 * Decode a TransferChecked instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export declare function decodeTransferCheckedInstructionUnchecked({ programId, keys: [source, mint, destination, owner, ...multiSigners], data, }: TransactionInstruction): DecodedTransferCheckedInstructionUnchecked;
//# sourceMappingURL=transferChecked.d.ts.map