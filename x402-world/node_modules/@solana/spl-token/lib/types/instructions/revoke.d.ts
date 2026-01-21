import type { AccountMeta, PublicKey, Signer } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
export interface RevokeInstructionData {
    instruction: TokenInstruction.Revoke;
}
/** TODO: docs */
export declare const revokeInstructionData: import("@solana/buffer-layout").Structure<RevokeInstructionData>;
/**
 * Construct a Revoke instruction
 *
 * @param account      Address of the token account
 * @param owner        Owner of the account
 * @param multiSigners Signing accounts if `owner` is a multisig
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createRevokeInstruction(account: PublicKey, owner: PublicKey, multiSigners?: (Signer | PublicKey)[], programId?: PublicKey): TransactionInstruction;
/** A decoded, valid Revoke instruction */
export interface DecodedRevokeInstruction {
    programId: PublicKey;
    keys: {
        account: AccountMeta;
        owner: AccountMeta;
        multiSigners: AccountMeta[];
    };
    data: {
        instruction: TokenInstruction.Revoke;
    };
}
/**
 * Decode a Revoke instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export declare function decodeRevokeInstruction(instruction: TransactionInstruction, programId?: PublicKey): DecodedRevokeInstruction;
/** A decoded, non-validated Revoke instruction */
export interface DecodedRevokeInstructionUnchecked {
    programId: PublicKey;
    keys: {
        account: AccountMeta | undefined;
        owner: AccountMeta | undefined;
        multiSigners: AccountMeta[];
    };
    data: {
        instruction: number;
    };
}
/**
 * Decode a Revoke instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export declare function decodeRevokeInstructionUnchecked({ programId, keys: [account, owner, ...multiSigners], data, }: TransactionInstruction): DecodedRevokeInstructionUnchecked;
//# sourceMappingURL=revoke.d.ts.map