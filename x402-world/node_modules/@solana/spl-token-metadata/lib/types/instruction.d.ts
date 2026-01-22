import type { PublicKey } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import type { Field } from './field.js';
/**
 * Initializes a TLV entry with the basic token-metadata fields.
 *
 * Assumes that the provided mint is an SPL token mint, that the metadata
 * account is allocated and assigned to the program, and that the metadata
 * account has enough lamports to cover the rent-exempt reserve.
 */
export interface InitializeInstructionArgs {
    programId: PublicKey;
    metadata: PublicKey;
    updateAuthority: PublicKey;
    mint: PublicKey;
    mintAuthority: PublicKey;
    name: string;
    symbol: string;
    uri: string;
}
export declare function createInitializeInstruction(args: InitializeInstructionArgs): TransactionInstruction;
/**
 * If the field does not exist on the account, it will be created.
 * If the field does exist, it will be overwritten.
 */
export interface UpdateFieldInstruction {
    programId: PublicKey;
    metadata: PublicKey;
    updateAuthority: PublicKey;
    field: Field | string;
    value: string;
}
export declare function createUpdateFieldInstruction(args: UpdateFieldInstruction): TransactionInstruction;
export interface RemoveKeyInstructionArgs {
    programId: PublicKey;
    metadata: PublicKey;
    updateAuthority: PublicKey;
    key: string;
    idempotent: boolean;
}
export declare function createRemoveKeyInstruction(args: RemoveKeyInstructionArgs): TransactionInstruction;
export interface UpdateAuthorityInstructionArgs {
    programId: PublicKey;
    metadata: PublicKey;
    oldAuthority: PublicKey;
    newAuthority: PublicKey | null;
}
export declare function createUpdateAuthorityInstruction(args: UpdateAuthorityInstructionArgs): TransactionInstruction;
export interface EmitInstructionArgs {
    programId: PublicKey;
    metadata: PublicKey;
    start?: bigint;
    end?: bigint;
}
export declare function createEmitInstruction(args: EmitInstructionArgs): TransactionInstruction;
//# sourceMappingURL=instruction.d.ts.map