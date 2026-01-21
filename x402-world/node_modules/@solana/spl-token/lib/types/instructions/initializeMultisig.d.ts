import type { AccountMeta, Signer } from '@solana/web3.js';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
export interface InitializeMultisigInstructionData {
    instruction: TokenInstruction.InitializeMultisig;
    m: number;
}
/** TODO: docs */
export declare const initializeMultisigInstructionData: import("@solana/buffer-layout").Structure<InitializeMultisigInstructionData>;
/**
 * Construct an InitializeMultisig instruction
 *
 * @param account   Multisig account
 * @param signers   Full set of signers
 * @param m         Number of required signatures
 * @param programId SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createInitializeMultisigInstruction(account: PublicKey, signers: (Signer | PublicKey)[], m: number, programId?: PublicKey): TransactionInstruction;
/** A decoded, valid InitializeMultisig instruction */
export interface DecodedInitializeMultisigInstruction {
    programId: PublicKey;
    keys: {
        account: AccountMeta;
        rent: AccountMeta;
        signers: AccountMeta[];
    };
    data: {
        instruction: TokenInstruction.InitializeMultisig;
        m: number;
    };
}
/**
 * Decode an InitializeMultisig instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export declare function decodeInitializeMultisigInstruction(instruction: TransactionInstruction, programId?: PublicKey): DecodedInitializeMultisigInstruction;
/** A decoded, non-validated InitializeMultisig instruction */
export interface DecodedInitializeMultisigInstructionUnchecked {
    programId: PublicKey;
    keys: {
        account: AccountMeta | undefined;
        rent: AccountMeta | undefined;
        signers: AccountMeta[];
    };
    data: {
        instruction: number;
        m: number;
    };
}
/**
 * Decode an InitializeMultisig instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export declare function decodeInitializeMultisigInstructionUnchecked({ programId, keys: [account, rent, ...signers], data, }: TransactionInstruction): DecodedInitializeMultisigInstructionUnchecked;
//# sourceMappingURL=initializeMultisig.d.ts.map