import type { AccountMeta, PublicKey, Signer } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
export interface ApproveCheckedInstructionData {
    instruction: TokenInstruction.ApproveChecked;
    amount: bigint;
    decimals: number;
}
/** TODO: docs */
export declare const approveCheckedInstructionData: import("@solana/buffer-layout").Structure<ApproveCheckedInstructionData>;
/**
 * Construct an ApproveChecked instruction
 *
 * @param account      Account to set the delegate for
 * @param mint         Mint account
 * @param delegate     Account authorized to transfer of tokens from the account
 * @param owner        Owner of the account
 * @param amount       Maximum number of tokens the delegate may transfer
 * @param decimals     Number of decimals in approve amount
 * @param multiSigners Signing accounts if `owner` is a multisig
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createApproveCheckedInstruction(account: PublicKey, mint: PublicKey, delegate: PublicKey, owner: PublicKey, amount: number | bigint, decimals: number, multiSigners?: (Signer | PublicKey)[], programId?: PublicKey): TransactionInstruction;
/** A decoded, valid ApproveChecked instruction */
export interface DecodedApproveCheckedInstruction {
    programId: PublicKey;
    keys: {
        account: AccountMeta;
        mint: AccountMeta;
        delegate: AccountMeta;
        owner: AccountMeta;
        multiSigners: AccountMeta[];
    };
    data: {
        instruction: TokenInstruction.ApproveChecked;
        amount: bigint;
        decimals: number;
    };
}
/**
 * Decode an ApproveChecked instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export declare function decodeApproveCheckedInstruction(instruction: TransactionInstruction, programId?: PublicKey): DecodedApproveCheckedInstruction;
/** A decoded, non-validated ApproveChecked instruction */
export interface DecodedApproveCheckedInstructionUnchecked {
    programId: PublicKey;
    keys: {
        account: AccountMeta | undefined;
        mint: AccountMeta | undefined;
        delegate: AccountMeta | undefined;
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
 * Decode an ApproveChecked instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export declare function decodeApproveCheckedInstructionUnchecked({ programId, keys: [account, mint, delegate, owner, ...multiSigners], data, }: TransactionInstruction): DecodedApproveCheckedInstructionUnchecked;
//# sourceMappingURL=approveChecked.d.ts.map