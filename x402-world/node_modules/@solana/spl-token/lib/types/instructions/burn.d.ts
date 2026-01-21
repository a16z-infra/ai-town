import type { AccountMeta, PublicKey, Signer } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
export interface BurnInstructionData {
    instruction: TokenInstruction.Burn;
    amount: bigint;
}
/** TODO: docs */
export declare const burnInstructionData: import("@solana/buffer-layout").Structure<BurnInstructionData>;
/**
 * Construct a Burn instruction
 *
 * @param account      Account to burn tokens from
 * @param mint         Mint for the account
 * @param owner        Owner of the account
 * @param amount       Number of tokens to burn
 * @param multiSigners Signing accounts if `owner` is a multisig
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createBurnInstruction(account: PublicKey, mint: PublicKey, owner: PublicKey, amount: number | bigint, multiSigners?: (Signer | PublicKey)[], programId?: PublicKey): TransactionInstruction;
/** A decoded, valid Burn instruction */
export interface DecodedBurnInstruction {
    programId: PublicKey;
    keys: {
        account: AccountMeta;
        mint: AccountMeta;
        owner: AccountMeta;
        multiSigners: AccountMeta[];
    };
    data: {
        instruction: TokenInstruction.Burn;
        amount: bigint;
    };
}
/**
 * Decode a Burn instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export declare function decodeBurnInstruction(instruction: TransactionInstruction, programId?: PublicKey): DecodedBurnInstruction;
/** A decoded, non-validated Burn instruction */
export interface DecodedBurnInstructionUnchecked {
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
    };
}
/**
 * Decode a Burn instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export declare function decodeBurnInstructionUnchecked({ programId, keys: [account, mint, owner, ...multiSigners], data, }: TransactionInstruction): DecodedBurnInstructionUnchecked;
//# sourceMappingURL=burn.d.ts.map