import type { AccountMeta, PublicKey, Signer } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
export interface TransferInstructionData {
    instruction: TokenInstruction.Transfer;
    amount: bigint;
}
/** TODO: docs */
export declare const transferInstructionData: import("@solana/buffer-layout").Structure<TransferInstructionData>;
/**
 * Construct a Transfer instruction
 *
 * @param source       Source account
 * @param destination  Destination account
 * @param owner        Owner of the source account
 * @param amount       Number of tokens to transfer
 * @param multiSigners Signing accounts if `owner` is a multisig
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createTransferInstruction(source: PublicKey, destination: PublicKey, owner: PublicKey, amount: number | bigint, multiSigners?: (Signer | PublicKey)[], programId?: PublicKey): TransactionInstruction;
/** A decoded, valid Transfer instruction */
export interface DecodedTransferInstruction {
    programId: PublicKey;
    keys: {
        source: AccountMeta;
        destination: AccountMeta;
        owner: AccountMeta;
        multiSigners: AccountMeta[];
    };
    data: {
        instruction: TokenInstruction.Transfer;
        amount: bigint;
    };
}
/**
 * Decode a Transfer instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export declare function decodeTransferInstruction(instruction: TransactionInstruction, programId?: PublicKey): DecodedTransferInstruction;
/** A decoded, non-validated Transfer instruction */
export interface DecodedTransferInstructionUnchecked {
    programId: PublicKey;
    keys: {
        source: AccountMeta | undefined;
        destination: AccountMeta | undefined;
        owner: AccountMeta | undefined;
        multiSigners: AccountMeta[];
    };
    data: {
        instruction: number;
        amount: bigint;
    };
}
/**
 * Decode a Transfer instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export declare function decodeTransferInstructionUnchecked({ programId, keys: [source, destination, owner, ...multiSigners], data, }: TransactionInstruction): DecodedTransferInstructionUnchecked;
//# sourceMappingURL=transfer.d.ts.map