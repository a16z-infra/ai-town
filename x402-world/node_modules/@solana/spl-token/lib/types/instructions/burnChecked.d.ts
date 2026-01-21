import type { AccountMeta, PublicKey, Signer } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
export interface BurnCheckedInstructionData {
    instruction: TokenInstruction.BurnChecked;
    amount: bigint;
    decimals: number;
}
/** TODO: docs */
export declare const burnCheckedInstructionData: import("@solana/buffer-layout").Structure<BurnCheckedInstructionData>;
/**
 * Construct a BurnChecked instruction
 *
 * @param mint         Mint for the account
 * @param account      Account to burn tokens from
 * @param owner        Owner of the account
 * @param amount       Number of tokens to burn
 * @param decimals     Number of decimals in burn amount
 * @param multiSigners Signing accounts if `owner` is a multisig
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createBurnCheckedInstruction(account: PublicKey, mint: PublicKey, owner: PublicKey, amount: number | bigint, decimals: number, multiSigners?: (Signer | PublicKey)[], programId?: PublicKey): TransactionInstruction;
/** A decoded, valid BurnChecked instruction */
export interface DecodedBurnCheckedInstruction {
    programId: PublicKey;
    keys: {
        account: AccountMeta;
        mint: AccountMeta;
        owner: AccountMeta;
        multiSigners: AccountMeta[];
    };
    data: {
        instruction: TokenInstruction.BurnChecked;
        amount: bigint;
        decimals: number;
    };
}
/**
 * Decode a BurnChecked instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export declare function decodeBurnCheckedInstruction(instruction: TransactionInstruction, programId?: PublicKey): DecodedBurnCheckedInstruction;
/** A decoded, non-validated BurnChecked instruction */
export interface DecodedBurnCheckedInstructionUnchecked {
    programId: PublicKey;
    keys: {
        account: AccountMeta | undefined;
        mint: AccountMeta | undefined;
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
 * Decode a BurnChecked instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export declare function decodeBurnCheckedInstructionUnchecked({ programId, keys: [account, mint, owner, ...multiSigners], data, }: TransactionInstruction): DecodedBurnCheckedInstructionUnchecked;
//# sourceMappingURL=burnChecked.d.ts.map