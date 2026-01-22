import type { AccountMeta, PublicKey, Signer } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
export interface FreezeAccountInstructionData {
    instruction: TokenInstruction.FreezeAccount;
}
/** TODO: docs */
export declare const freezeAccountInstructionData: import("@solana/buffer-layout").Structure<FreezeAccountInstructionData>;
/**
 * Construct a FreezeAccount instruction
 *
 * @param account      Account to freeze
 * @param mint         Mint account
 * @param authority    Mint freeze authority
 * @param multiSigners Signing accounts if `authority` is a multisig
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createFreezeAccountInstruction(account: PublicKey, mint: PublicKey, authority: PublicKey, multiSigners?: (Signer | PublicKey)[], programId?: PublicKey): TransactionInstruction;
/** A decoded, valid FreezeAccount instruction */
export interface DecodedFreezeAccountInstruction {
    programId: PublicKey;
    keys: {
        account: AccountMeta;
        mint: AccountMeta;
        authority: AccountMeta;
        multiSigners: AccountMeta[];
    };
    data: {
        instruction: TokenInstruction.FreezeAccount;
    };
}
/**
 * Decode a FreezeAccount instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export declare function decodeFreezeAccountInstruction(instruction: TransactionInstruction, programId?: PublicKey): DecodedFreezeAccountInstruction;
/** A decoded, non-validated FreezeAccount instruction */
export interface DecodedFreezeAccountInstructionUnchecked {
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
 * Decode a FreezeAccount instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export declare function decodeFreezeAccountInstructionUnchecked({ programId, keys: [account, mint, authority, ...multiSigners], data, }: TransactionInstruction): DecodedFreezeAccountInstructionUnchecked;
//# sourceMappingURL=freezeAccount.d.ts.map