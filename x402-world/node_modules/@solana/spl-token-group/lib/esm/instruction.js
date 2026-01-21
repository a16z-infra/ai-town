import { fixEncoderSize, getBytesEncoder, getStructEncoder, getTupleEncoder, getU64Encoder, transformEncoder, } from '@solana/codecs';
import { SystemProgram, TransactionInstruction } from '@solana/web3.js';
function getInstructionEncoder(discriminator, dataEncoder) {
    return transformEncoder(getTupleEncoder([getBytesEncoder(), dataEncoder]), (data) => [
        discriminator,
        data,
    ]);
}
function getPublicKeyEncoder() {
    return transformEncoder(fixEncoderSize(getBytesEncoder(), 32), (publicKey) => publicKey.toBytes());
}
export function createInitializeGroupInstruction(args) {
    const { programId, group, mint, mintAuthority, updateAuthority, maxSize } = args;
    return new TransactionInstruction({
        programId,
        keys: [
            { isSigner: false, isWritable: true, pubkey: group },
            { isSigner: false, isWritable: false, pubkey: mint },
            { isSigner: true, isWritable: false, pubkey: mintAuthority },
        ],
        data: Buffer.from(getInstructionEncoder(new Uint8Array([
            /* await splDiscriminate('spl_token_group_interface:initialize_token_group') */
            121, 113, 108, 39, 54, 51, 0, 4,
        ]), getStructEncoder([
            ['updateAuthority', getPublicKeyEncoder()],
            ['maxSize', getU64Encoder()],
        ])).encode({ updateAuthority: updateAuthority ?? SystemProgram.programId, maxSize })),
    });
}
export function createUpdateGroupMaxSizeInstruction(args) {
    const { programId, group, updateAuthority, maxSize } = args;
    return new TransactionInstruction({
        programId,
        keys: [
            { isSigner: false, isWritable: true, pubkey: group },
            { isSigner: true, isWritable: false, pubkey: updateAuthority },
        ],
        data: Buffer.from(getInstructionEncoder(new Uint8Array([
            /* await splDiscriminate('spl_token_group_interface:update_group_max_size') */
            108, 37, 171, 143, 248, 30, 18, 110,
        ]), getStructEncoder([['maxSize', getU64Encoder()]])).encode({ maxSize })),
    });
}
export function createUpdateGroupAuthorityInstruction(args) {
    const { programId, group, currentAuthority, newAuthority } = args;
    return new TransactionInstruction({
        programId,
        keys: [
            { isSigner: false, isWritable: true, pubkey: group },
            { isSigner: true, isWritable: false, pubkey: currentAuthority },
        ],
        data: Buffer.from(getInstructionEncoder(new Uint8Array([
            /* await splDiscriminate('spl_token_group_interface:update_authority') */
            161, 105, 88, 1, 237, 221, 216, 203,
        ]), getStructEncoder([['newAuthority', getPublicKeyEncoder()]])).encode({ newAuthority: newAuthority ?? SystemProgram.programId })),
    });
}
export function createInitializeMemberInstruction(args) {
    const { programId, member, memberMint, memberMintAuthority, group, groupUpdateAuthority } = args;
    return new TransactionInstruction({
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
        ]), getStructEncoder([])).encode({})),
    });
}
//# sourceMappingURL=instruction.js.map