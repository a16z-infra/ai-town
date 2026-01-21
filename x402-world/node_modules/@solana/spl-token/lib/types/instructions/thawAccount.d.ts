import type { AccountMeta, PublicKey, Signer } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
export interface ThawAccountInstructionData {
    instruction: TokenInstruction.ThawAccount;
}
/** TODO: docs */
export declare const thawAccountInstructionData: import("@solana/buffer-layout").Structure<ThawAccountInstructionData>;
/**
 * Construct a ThawAccount instruction
 *
 * @param account      Account to thaw
 * @param mint         Mint account
 * @param authority    Mint freeze authority
 * @param multiSigners Signing accounts if `authority` is a multisig
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createThawAccountInstruction(account: PublicKey, mint: PublicKey, authority: PublicKey, multiSigners?: (Signer | PublicKey)[], programId?: PublicKey): TransactionInstruction;
/** A decoded, valid ThawAccount instruction */
export interface DecodedThawAccountInstruction {
    programId: PublicKey;
    keys: {
        account: AccountMeta;
        mint: AccountMeta;
        authority: AccountMeta;
        multiSigners: AccountMeta[];
    };
    data: {
        instruction: TokenInstruction.ThawAccount;
    };
}
/**
 * Decode a ThawAccount instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export declare function decodeThawAccountInstruction(instruction: TransactionInstruction, programId?: PublicKey): DecodedThawAccountInstruction;
/** A decoded, non-validated ThawAccount instruction */
export interface DecodedThawAccountInstructionUnchecked {
    programId: PublicKey;
    keys: {
        account: AccountMeta | undefined;
        mint: AccountMeta | undefined;
        authority: AccountMeta | undefined;
        multiSigners: AccountMeta[];
    };
    data: {
        instruction: number;
    };
}
/**
 * Decode a ThawAccount instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export declare function decodeThawAccountInstructionUnchecked({ programId, keys: [account, mint, authority, ...multiSigners], data, }: TransactionInstruction): DecodedThawAccountInstructionUnchecked;
//# sourceMappingURL=thawAccount.d.ts.map