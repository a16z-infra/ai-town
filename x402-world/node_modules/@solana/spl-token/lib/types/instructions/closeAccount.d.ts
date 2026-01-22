import type { AccountMeta, PublicKey, Signer } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
export interface CloseAccountInstructionData {
    instruction: TokenInstruction.CloseAccount;
}
/** TODO: docs */
export declare const closeAccountInstructionData: import("@solana/buffer-layout").Structure<CloseAccountInstructionData>;
/**
 * Construct a CloseAccount instruction
 *
 * @param account      Account to close
 * @param destination  Account to receive the remaining balance of the closed account
 * @param authority    Account close authority
 * @param multiSigners Signing accounts if `authority` is a multisig
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createCloseAccountInstruction(account: PublicKey, destination: PublicKey, authority: PublicKey, multiSigners?: (Signer | PublicKey)[], programId?: PublicKey): TransactionInstruction;
/** A decoded, valid CloseAccount instruction */
export interface DecodedCloseAccountInstruction {
    programId: PublicKey;
    keys: {
        account: AccountMeta;
        destination: AccountMeta;
        authority: AccountMeta;
        multiSigners: AccountMeta[];
    };
    data: {
        instruction: TokenInstruction.CloseAccount;
    };
}
/**
 * Decode a CloseAccount instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export declare function decodeCloseAccountInstruction(instruction: TransactionInstruction, programId?: PublicKey): DecodedCloseAccountInstruction;
/** A decoded, non-validated CloseAccount instruction */
export interface DecodedCloseAccountInstructionUnchecked {
    programId: PublicKey;
    keys: {
        account: AccountMeta | undefined;
        destination: AccountMeta | undefined;
        authority: AccountMeta | undefined;
        multiSigners: AccountMeta[];
    };
    data: {
        instruction: number;
    };
}
/**
 * Decode a CloseAccount instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export declare function decodeCloseAccountInstructionUnchecked({ programId, keys: [account, destination, authority, ...multiSigners], data, }: TransactionInstruction): DecodedCloseAccountInstructionUnchecked;
//# sourceMappingURL=closeAccount.d.ts.map