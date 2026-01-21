"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInitializeInstruction = createInitializeInstruction;
exports.createUpdateFieldInstruction = createUpdateFieldInstruction;
exports.createRemoveKeyInstruction = createRemoveKeyInstruction;
exports.createUpdateAuthorityInstruction = createUpdateAuthorityInstruction;
exports.createEmitInstruction = createEmitInstruction;
const codecs_1 = require("@solana/codecs");
const web3_js_1 = require("@solana/web3.js");
const field_js_1 = require("./field.js");
function getInstructionEncoder(discriminator, dataEncoder) {
    return (0, codecs_1.transformEncoder)((0, codecs_1.getTupleEncoder)([(0, codecs_1.getBytesEncoder)(), dataEncoder]), (data) => [
        discriminator,
        data,
    ]);
}
function getPublicKeyEncoder() {
    return (0, codecs_1.transformEncoder)((0, codecs_1.fixEncoderSize)((0, codecs_1.getBytesEncoder)(), 32), (publicKey) => publicKey.toBytes());
}
function getStringEncoder() {
    return (0, codecs_1.addEncoderSizePrefix)((0, codecs_1.getUtf8Encoder)(), (0, codecs_1.getU32Encoder)());
}
function createInitializeInstruction(args) {
    const { programId, metadata, updateAuthority, mint, mintAuthority, name, symbol, uri } = args;
    return new web3_js_1.TransactionInstruction({
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
        ]), (0, codecs_1.getStructEncoder)([
            ['name', getStringEncoder()],
            ['symbol', getStringEncoder()],
            ['uri', getStringEncoder()],
        ])).encode({ name, symbol, uri })),
    });
}
function createUpdateFieldInstruction(args) {
    const { programId, metadata, updateAuthority, field, value } = args;
    return new web3_js_1.TransactionInstruction({
        programId,
        keys: [
            { isSigner: false, isWritable: true, pubkey: metadata },
            { isSigner: true, isWritable: false, pubkey: updateAuthority },
        ],
        data: Buffer.from(getInstructionEncoder(new Uint8Array([
            /* await splDiscriminate('spl_token_metadata_interface:updating_field') */
            221, 233, 49, 45, 181, 202, 220, 200,
        ]), (0, codecs_1.getStructEncoder)([
            ['field', (0, codecs_1.getDataEnumCodec)((0, field_js_1.getFieldCodec)())],
            ['value', getStringEncoder()],
        ])).encode({ field: (0, field_js_1.getFieldConfig)(field), value })),
    });
}
function createRemoveKeyInstruction(args) {
    const { programId, metadata, updateAuthority, key, idempotent } = args;
    return new web3_js_1.TransactionInstruction({
        programId,
        keys: [
            { isSigner: false, isWritable: true, pubkey: metadata },
            { isSigner: true, isWritable: false, pubkey: updateAuthority },
        ],
        data: Buffer.from(getInstructionEncoder(new Uint8Array([
            /* await splDiscriminate('spl_token_metadata_interface:remove_key_ix') */
            234, 18, 32, 56, 89, 141, 37, 181,
        ]), (0, codecs_1.getStructEncoder)([
            ['idempotent', (0, codecs_1.getBooleanEncoder)()],
            ['key', getStringEncoder()],
        ])).encode({ idempotent, key })),
    });
}
function createUpdateAuthorityInstruction(args) {
    const { programId, metadata, oldAuthority, newAuthority } = args;
    return new web3_js_1.TransactionInstruction({
        programId,
        keys: [
            { isSigner: false, isWritable: true, pubkey: metadata },
            { isSigner: true, isWritable: false, pubkey: oldAuthority },
        ],
        data: Buffer.from(getInstructionEncoder(new Uint8Array([
            /* await splDiscriminate('spl_token_metadata_interface:update_the_authority') */
            215, 228, 166, 228, 84, 100, 86, 123,
        ]), (0, codecs_1.getStructEncoder)([['newAuthority', getPublicKeyEncoder()]])).encode({ newAuthority: newAuthority !== null && newAuthority !== void 0 ? newAuthority : web3_js_1.SystemProgram.programId })),
    });
}
function createEmitInstruction(args) {
    const { programId, metadata, start, end } = args;
    return new web3_js_1.TransactionInstruction({
        programId,
        keys: [{ isSigner: false, isWritable: false, pubkey: metadata }],
        data: Buffer.from(getInstructionEncoder(new Uint8Array([
            /* await splDiscriminate('spl_token_metadata_interface:emitter') */
            250, 166, 180, 250, 13, 12, 184, 70,
        ]), (0, codecs_1.getStructEncoder)([
            ['start', (0, codecs_1.getOptionEncoder)((0, codecs_1.getU64Encoder)())],
            ['end', (0, codecs_1.getOptionEncoder)((0, codecs_1.getU64Encoder)())],
        ])).encode({ start: start !== null && start !== void 0 ? start : null, end: end !== null && end !== void 0 ? end : null })),
    });
}
//# sourceMappingURL=instruction.js.map