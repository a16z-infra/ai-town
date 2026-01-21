import type { AccountMeta, PublicKey, Signer } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
export interface MintToInstructionData {
    instruction: TokenInstruction.MintTo;
    amount: bigint;
}
/** TODO: docs */
export declare const mintToInstructionData: import("@solana/buffer-layout").Structure<MintToInstructionData>;
/**
 * Construct a MintTo instruction
 *
 * @param mint         Public key of the mint
 * @param destination  Address of the token account to mint to
 * @param authority    The mint authority
 * @param amount       Amount to mint
 * @param multiSigners Signing accounts if `authority` is a multisig
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createMintToInstruction(mint: PublicKey, destination: PublicKey, authority: PublicKey, amount: number | bigint, multiSigners?: (Signer | PublicKey)[], programId?: PublicKey): TransactionInstruction;
/** A decoded, valid MintTo instruction */
export interface DecodedMintToInstruction {
    programId: PublicKey;
    keys: {
        mint: AccountMeta;
        destination: AccountMeta;
        authority: AccountMeta;
        multiSigners: AccountMeta[];
    };
    data: {
        instruction: TokenInstruction.MintTo;
        amount: bigint;
    };
}
/**
 * Decode a MintTo instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export declare function decodeMintToInstruction(instruction: TransactionInstruction, programId?: PublicKey): DecodedMintToInstruction;
/** A decoded, non-validated MintTo instruction */
export interface DecodedMintToInstructionUnchecked {
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
    };
}
/**
 * Decode a MintTo instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export declare function decodeMintToInstructionUnchecked({ programId, keys: [mint, destination, authority, ...multiSigners], data, }: TransactionInstruction): DecodedMintToInstructionUnchecked;
//# sourceMappingURL=mintTo.d.ts.map