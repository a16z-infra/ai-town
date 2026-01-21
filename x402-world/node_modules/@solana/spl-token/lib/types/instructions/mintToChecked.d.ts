import type { AccountMeta, PublicKey, Signer } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
export interface MintToCheckedInstructionData {
    instruction: TokenInstruction.MintToChecked;
    amount: bigint;
    decimals: number;
}
/** TODO: docs */
export declare const mintToCheckedInstructionData: import("@solana/buffer-layout").Structure<MintToCheckedInstructionData>;
/**
 * Construct a MintToChecked instruction
 *
 * @param mint         Public key of the mint
 * @param destination  Address of the token account to mint to
 * @param authority    The mint authority
 * @param amount       Amount to mint
 * @param decimals     Number of decimals in amount to mint
 * @param multiSigners Signing accounts if `authority` is a multisig
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createMintToCheckedInstruction(mint: PublicKey, destination: PublicKey, authority: PublicKey, amount: number | bigint, decimals: number, multiSigners?: (Signer | PublicKey)[], programId?: PublicKey): TransactionInstruction;
/** A decoded, valid MintToChecked instruction */
export interface DecodedMintToCheckedInstruction {
    programId: PublicKey;
    keys: {
        mint: AccountMeta;
        destination: AccountMeta;
        authority: AccountMeta;
        multiSigners: AccountMeta[];
    };
    data: {
        instruction: TokenInstruction.MintToChecked;
        amount: bigint;
        decimals: number;
    };
}
/**
 * Decode a MintToChecked instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export declare function decodeMintToCheckedInstruction(instruction: TransactionInstruction, programId?: PublicKey): DecodedMintToCheckedInstruction;
/** A decoded, non-validated MintToChecked instruction */
export interface DecodedMintToCheckedInstructionUnchecked {
    programId: PublicKey;
    keys: {
        mint: AccountMeta | undefined;
        destination: AccountMeta | undefined;
        authority: AccountMeta | undefined;
        multiSigners: AccountMeta[];
    };
    data: {
        instruction: number;
        amount: bigint;
        decimals: number;
    };
}
/**
 * Decode a MintToChecked instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export declare function decodeMintToCheckedInstructionUnchecked({ programId, keys: [mint, destination, authority, ...multiSigners], data, }: TransactionInstruction): DecodedMintToCheckedInstructionUnchecked;
//# sourceMappingURL=mintToChecked.d.ts.map