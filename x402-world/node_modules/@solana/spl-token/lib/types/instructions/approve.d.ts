import type { AccountMeta, PublicKey, Signer } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
export interface ApproveInstructionData {
    instruction: TokenInstruction.Approve;
    amount: bigint;
}
/** TODO: docs */
export declare const approveInstructionData: import("@solana/buffer-layout").Structure<ApproveInstructionData>;
/**
 * Construct an Approve instruction
 *
 * @param account      Account to set the delegate for
 * @param delegate     Account authorized to transfer tokens from the account
 * @param owner        Owner of the account
 * @param amount       Maximum number of tokens the delegate may transfer
 * @param multiSigners Signing accounts if `owner` is a multisig
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createApproveInstruction(account: PublicKey, delegate: PublicKey, owner: PublicKey, amount: number | bigint, multiSigners?: (Signer | PublicKey)[], programId?: PublicKey): TransactionInstruction;
/** A decoded, valid Approve instruction */
export interface DecodedApproveInstruction {
    programId: PublicKey;
    keys: {
        account: AccountMeta;
        delegate: AccountMeta;
        owner: AccountMeta;
        multiSigners: AccountMeta[];
    };
    data: {
        instruction: TokenInstruction.Approve;
        amount: bigint;
    };
}
/**
 * Decode an Approve instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export declare function decodeApproveInstruction(instruction: TransactionInstruction, programId?: PublicKey): DecodedApproveInstruction;
/** A decoded, non-validated Approve instruction */
export interface DecodedApproveInstructionUnchecked {
    programId: PublicKey;
    keys: {
        account: AccountMeta | undefined;
        delegate: AccountMeta | undefined;
        owner: AccountMeta | undefined;
        multiSigners: AccountMeta[];
    };
    data: {
        instruction: number;
        amount: bigint;
    };
}
/**
 * Decode an Approve instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export declare function decodeApproveInstructionUnchecked({ programId, keys: [account, delegate, owner, ...multiSigners], data, }: TransactionInstruction): DecodedApproveInstructionUnchecked;
//# sourceMappingURL=approve.d.ts.map