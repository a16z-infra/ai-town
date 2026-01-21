import { addEncoderSizePrefix, fixEncoderSize, getBooleanEncoder, getBytesEncoder, getDataEnumCodec, getOptionEncoder, getUtf8Encoder, getStructEncoder, getTupleEncoder, getU32Encoder, getU64Encoder, transformEncoder, } from '@solana/codecs';
import { SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { getFieldCodec, getFieldConfig } from './field.js';
function getInstructionEncoder(discriminator, dataEncoder) {
    return transformEncoder(getTupleEncoder([getBytesEncoder(), dataEncoder]), (data) => [
        discriminator,
        data,
    ]);
}
function getPublicKeyEncoder() {
    return transformEncoder(fixEncoderSize(getBytesEncoder(), 32), (publicKey) => publicKey.toBytes());
}
function getStringEncoder() {
    return addEncoderSizePrefix(getUtf8Encoder(), getU32Encoder());
}
export function createInitializeInstruction(args) {
    const { programId, metadata, updateAuthority, mint, mintAuthority, name, symbol, uri } = args;
    return new TransactionInstruction({
        programId,
        keys: [
            { isSigner: false, isWritable: true, pubkey: metadata },
            { isSigner: false, isWritable: false, pubkey: updateAuthority },
            { isSigner: false, isWritable: false, pubkey: mint },
            { isSigner: true, isWritable: false, pubkey: mintAuthority },
        ],
        data: Buffer.from(getInstructionEncoder(new Uint8Array([
            /* await splDiscriminate('spl_token_metadata_interface:initialize_account') */
            210, 225, 30, 162, 88, 184, 77, 141,
        ]), getStructEncoder([
            ['name', getStringEncoder()],
            ['symbol', getStringEncoder()],
            ['uri', getStringEncoder()],
        ])).encode({ name, symbol, uri })),
    });
}
export function createUpdateFieldInstruction(args) {
    const { programId, metadata, updateAuthority, field, value } = args;
    return new TransactionInstruction({
        programId,
        keys: [
            { isSigner: false, isWritable: true, pubkey: metadata },
            { isSigner: true, isWritable: false, pubkey: updateAuthority },
        ],
        data: Buffer.from(getInstructionEncoder(new Uint8Array([
            /* await splDiscriminate('spl_token_metadata_interface:updating_field') */
            221, 233, 49, 45, 181, 202, 220, 200,
        ]), getStructEncoder([
            ['field', getDataEnumCodec(getFieldCodec())],
            ['value', getStringEncoder()],
        ])).encode({ field: getFieldConfig(field), value })),
    });
}
export function createRemoveKeyInstruction(args) {
    const { programId, metadata, updateAuthority, key, idempotent } = args;
    return new TransactionInstruction({
        programId,
        keys: [
            { isSigner: false, isWritable: true, pubkey: metadata },
            { isSigner: true, isWritable: false, pubkey: updateAuthority },
        ],
        data: Buffer.from(getInstructionEncoder(new Uint8Array([
            /* await splDiscriminate('spl_token_metadata_interface:remove_key_ix') */
            234, 18, 32, 56, 89, 141, 37, 181,
        ]), getStructEncoder([
            ['idempotent', getBooleanEncoder()],
            ['key', getStringEncoder()],
        ])).encode({ idempotent, key })),
    });
}
export function createUpdateAuthorityInstruction(args) {
    const { programId, metadata, oldAuthority, newAuthority } = args;
    return new TransactionInstruction({
        programId,
        keys: [
            { isSigner: false, isWritable: true, pubkey: metadata },
            { isSigner: true, isWritable: false, pubkey: oldAuthority },
        ],
        data: Buffer.from(getInstructionEncoder(new Uint8Array([
            /* await splDiscriminate('spl_token_metadata_interface:update_the_authority') */
            215, 228, 166, 228, 84, 100, 86, 123,
        ]), getStructEncoder([['newAuthority', getPublicKeyEncoder()]])).encode({ newAuthority: newAuthority ?? SystemProgram.programId })),
    });
}
export function createEmitInstruction(args) {
    const { programId, metadata, start, end } = args;
    return new TransactionInstruction({
        programId,
        keys: [{ isSigner: false, isWritable: false, pubkey: metadata }],
        data: Buffer.from(getInstructionEncoder(new Uint8Array([
            /* await splDiscriminate('spl_token_metadata_interface:emitter') */
            250, 166, 180, 250, 13, 12, 184, 70,
        ]), getStructEncoder([
            ['start', getOptionEncoder(getU64Encoder())],
            ['end', getOptionEncoder(getU64Encoder())],
        ])).encode({ start: start ?? null, end: end ?? null })),
    });
}
//# sourceMappingURL=instruction.js.map