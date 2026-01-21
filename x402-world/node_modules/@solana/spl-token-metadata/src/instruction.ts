import type { Encoder } from '@solana/codecs';
import {
    addEncoderSizePrefix,
    fixEncoderSize,
    getBooleanEncoder,
    getBytesEncoder,
    getDataEnumCodec,
    getOptionEncoder,
    getUtf8Encoder,
    getStructEncoder,
    getTupleEncoder,
    getU32Encoder,
    getU64Encoder,
    transformEncoder,
} from '@solana/codecs';
import type { VariableSizeEncoder } from '@solana/codecs';
import type { PublicKey } from '@solana/web3.js';
import { SystemProgram, TransactionInstruction } from '@solana/web3.js';

import type { Field } from './field.js';
import { getFieldCodec, getFieldConfig } from './field.js';

function getInstructionEncoder<T extends object>(discriminator: Uint8Array, dataEncoder: Encoder<T>): Encoder<T> {
    return transformEncoder(getTupleEncoder([getBytesEncoder(), dataEncoder]), (data: T): [Uint8Array, T] => [
        discriminator,
        data,
    ]);
}

function getPublicKeyEncoder(): Encoder<PublicKey> {
    return transformEncoder(fixEncoderSize(getBytesEncoder(), 32), (publicKey: PublicKey) => publicKey.toBytes());
}

function getStringEncoder(): VariableSizeEncoder<string> {
    return addEncoderSizePrefix(getUtf8Encoder(), getU32Encoder());
}

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

export function createInitializeInstruction(args: InitializeInstructionArgs): TransactionInstruction {
    const { programId, metadata, updateAuthority, mint, mintAuthority, name, symbol, uri } = args;
    return new TransactionInstruction({
        programId,
        keys: [
            { isSigner: false, isWritable: true, pubkey: metadata },
            { isSigner: false, isWritable: false, pubkey: updateAuthority },
            { isSigner: false, isWritable: false, pubkey: mint },
            { isSigner: true, isWritable: false, pubkey: mintAuthority },
        ],
        data: Buffer.from(
            getInstructionEncoder(
                new Uint8Array([
                    /* await splDiscriminate('spl_token_metadata_interface:initialize_account') */
                    210, 225, 30, 162, 88, 184, 77, 141,
                ]),
                getStructEncoder([
                    ['name', getStringEncoder()],
                    ['symbol', getStringEncoder()],
                    ['uri', getStringEncoder()],
                ]),
            ).encode({ name, symbol, uri }),
        ),
    });
}

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

export function createUpdateFieldInstruction(args: UpdateFieldInstruction): TransactionInstruction {
    const { programId, metadata, updateAuthority, field, value } = args;
    return new TransactionInstruction({
        programId,
        keys: [
            { isSigner: false, isWritable: true, pubkey: metadata },
            { isSigner: true, isWritable: false, pubkey: updateAuthority },
        ],
        data: Buffer.from(
            getInstructionEncoder(
                new Uint8Array([
                    /* await splDiscriminate('spl_token_metadata_interface:updating_field') */
                    221, 233, 49, 45, 181, 202, 220, 200,
                ]),
                getStructEncoder([
                    ['field', getDataEnumCodec(getFieldCodec())],
                    ['value', getStringEncoder()],
                ]),
            ).encode({ field: getFieldConfig(field), value }),
        ),
    });
}

export interface RemoveKeyInstructionArgs {
    programId: PublicKey;
    metadata: PublicKey;
    updateAuthority: PublicKey;
    key: string;
    idempotent: boolean;
}

export function createRemoveKeyInstruction(args: RemoveKeyInstructionArgs) {
    const { programId, metadata, updateAuthority, key, idempotent } = args;
    return new TransactionInstruction({
        programId,
        keys: [
            { isSigner: false, isWritable: true, pubkey: metadata },
            { isSigner: true, isWritable: false, pubkey: updateAuthority },
        ],
        data: Buffer.from(
            getInstructionEncoder(
                new Uint8Array([
                    /* await splDiscriminate('spl_token_metadata_interface:remove_key_ix') */
                    234, 18, 32, 56, 89, 141, 37, 181,
                ]),
                getStructEncoder([
                    ['idempotent', getBooleanEncoder()],
                    ['key', getStringEncoder()],
                ]),
            ).encode({ idempotent, key }),
        ),
    });
}

export interface UpdateAuthorityInstructionArgs {
    programId: PublicKey;
    metadata: PublicKey;
    oldAuthority: PublicKey;
    newAuthority: PublicKey | null;
}

export function createUpdateAuthorityInstruction(args: UpdateAuthorityInstructionArgs): TransactionInstruction {
    const { programId, metadata, oldAuthority, newAuthority } = args;

    return new TransactionInstruction({
        programId,
        keys: [
            { isSigner: false, isWritable: true, pubkey: metadata },
            { isSigner: true, isWritable: false, pubkey: oldAuthority },
        ],
        data: Buffer.from(
            getInstructionEncoder(
                new Uint8Array([
                    /* await splDiscriminate('spl_token_metadata_interface:update_the_authority') */
                    215, 228, 166, 228, 84, 100, 86, 123,
                ]),
                getStructEncoder([['newAuthority', getPublicKeyEncoder()]]),
            ).encode({ newAuthority: newAuthority ?? SystemProgram.programId }),
        ),
    });
}

export interface EmitInstructionArgs {
    programId: PublicKey;
    metadata: PublicKey;
    start?: bigint;
    end?: bigint;
}

export function createEmitInstruction(args: EmitInstructionArgs): TransactionInstruction {
    const { programId, metadata, start, end } = args;
    return new TransactionInstruction({
        programId,
        keys: [{ isSigner: false, isWritable: false, pubkey: metadata }],
        data: Buffer.from(
            getInstructionEncoder(
                new Uint8Array([
                    /* await splDiscriminate('spl_token_metadata_interface:emitter') */
                    250, 166, 180, 250, 13, 12, 184, 70,
                ]),
                getStructEncoder([
                    ['start', getOptionEncoder(getU64Encoder())],
                    ['end', getOptionEncoder(getU64Encoder())],
                ]),
            ).encode({ start: start ?? null, end: end ?? null }),
        ),
    });
}
