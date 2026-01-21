"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInitializeGroupInstruction = createInitializeGroupInstruction;
exports.createUpdateGroupMaxSizeInstruction = createUpdateGroupMaxSizeInstruction;
exports.createUpdateGroupAuthorityInstruction = createUpdateGroupAuthorityInstruction;
exports.createInitializeMemberInstruction = createInitializeMemberInstruction;
const codecs_1 = require("@solana/codecs");
const web3_js_1 = require("@solana/web3.js");
function getInstructionEncoder(discriminator, dataEncoder) {
    return (0, codecs_1.transformEncoder)((0, codecs_1.getTupleEncoder)([(0, codecs_1.getBytesEncoder)(), dataEncoder]), (data) => [
        discriminator,
        data,
    ]);
}
function getPublicKeyEncoder() {
    return (0, codecs_1.transformEncoder)((0, codecs_1.fixEncoderSize)((0, codecs_1.getBytesEncoder)(), 32), (publicKey) => publicKey.toBytes());
}
function createInitializeGroupInstruction(args) {
    const { programId, group, mint, mintAuthority, updateAuthority, maxSize } = args;
    return new web3_js_1.TransactionInstruction({
        programId,
        keys: [
            { isSigner: false, isWritable: true, pubkey: group },
            { isSigner: false, isWritable: false, pubkey: mint },
            { isSigner: true, isWritable: false, pubkey: mintAuthority },
        ],
        data: Buffer.from(getInstructionEncoder(new Uint8Array([
            /* await splDiscriminate('spl_token_group_interface:initialize_token_group') */
            121, 113, 108, 39, 54, 51, 0, 4,
        ]), (0, codecs_1.getStructEncoder)([
            ['updateAuthority', getPublicKeyEncoder()],
            ['maxSize', (0, codecs_1.getU64Encoder)()],
        ])).encode({ updateAuthority: updateAuthority !== null && updateAuthority !== void 0 ? updateAuthority : web3_js_1.SystemProgram.programId, maxSize })),
    });
}
function createUpdateGroupMaxSizeInstruction(args) {
    const { programId, group, updateAuthority, maxSize } = args;
    return new web3_js_1.TransactionInstruction({
        programId,
        keys: [
            { isSigner: false, isWritable: true, pubkey: group },
            { isSigner: true, isWritable: false, pubkey: updateAuthority },
        ],
        data: Buffer.from(getInstructionEncoder(new Uint8Array([
            /* await splDiscriminate('spl_token_group_interface:update_group_max_size') */
            108, 37, 171, 143, 248, 30, 18, 110,
        ]), (0, codecs_1.getStructEncoder)([['maxSize', (0, codecs_1.getU64Encoder)()]])).encode({ maxSize })),
    });
}
function createUpdateGroupAuthorityInstruction(args) {
    const { programId, group, currentAuthority, newAuthority } = args;
    return new web3_js_1.TransactionInstruction({
        programId,
        keys: [
            { isSigner: false, isWritable: true, pubkey: group },
            { isSigner: true, isWritable: false, pubkey: currentAuthority },
        ],
        data: Buffer.from(getInstructionEncoder(new Uint8Array([
            /* await splDiscriminate('spl_token_group_interface:update_authority') */
            161, 105, 88, 1, 237, 221, 216, 203,
        ]), (0, codecs_1.getStructEncoder)([['newAuthority', getPublicKeyEncoder()]])).encode({ newAuthority: newAuthority !== null && newAuthority !== void 0 ? newAuthority : web3_js_1.SystemProgram.programId })),
    });
}
function createInitializeMemberInstruction(args) {
    const { programId, member, memberMint, memberMintAuthority, group, groupUpdateAuthority } = args;
    return new web3_js_1.TransactionInstruction({
        programId,
        keys: [
            { isSigner: false, isWritable: true, pubkey: member },
            { isSigner: false, isWritable: false, pubkey: memberMint },
            { isSigner: true, isWritable: false, pubkey: memberMintAuthority },
            { isSigner: false, isWritable: true, pubkey: group },
            { isSigner: true, isWritable: false, pubkey: groupUpdateAuthority },
        ],
        data: Buffer.from(getInstructionEncoder(new Uint8Array([
            /* await splDiscriminate('spl_token_group_interface:initialize_member') */
            152, 32, 222, 176, 223, 237, 116, 134,
        ]), (0, codecs_1.getStructEncoder)([])).encode({})),
    });
}
//# sourceMappingURL=instruction.js.map