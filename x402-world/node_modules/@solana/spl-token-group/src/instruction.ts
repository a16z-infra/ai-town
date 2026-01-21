import type { Encoder } from '@solana/codecs';
import type { PublicKey } from '@solana/web3.js';
import {
    fixEncoderSize,
    getBytesEncoder,
    getStructEncoder,
    getTupleEncoder,
    getU64Encoder,
    transformEncoder,
} from '@solana/codecs';
import { SystemProgram, TransactionInstruction } from '@solana/web3.js';

function getInstructionEncoder<T extends object>(discriminator: Uint8Array, dataEncoder: Encoder<T>): Encoder<T> {
    return transformEncoder(getTupleEncoder([getBytesEncoder(), dataEncoder]), (data: T): [Uint8Array, T] => [
        discriminator,
        data,
    ]);
}

function getPublicKeyEncoder(): Encoder<PublicKey> {
    return transformEncoder(fixEncoderSize(getBytesEncoder(), 32), (publicKey: PublicKey) => publicKey.toBytes());
}

export interface InitializeGroupInstruction {
    programId: PublicKey;
    group: PublicKey;
    mint: PublicKey;
    mintAuthority: PublicKey;
    updateAuthority: PublicKey | null;
    maxSize: bigint;
}

export function createInitializeGroupInstruction(args: InitializeGroupInstruction): TransactionInstruction {
    const { programId, group, mint, mintAuthority, updateAuthority, maxSize } = args;

    return new TransactionInstruction({
        programId,
        keys: [
            { isSigner: false, isWritable: true, pubkey: group },
            { isSigner: false, isWritable: false, pubkey: mint },
            { isSigner: true, isWritable: false, pubkey: mintAuthority },
        ],
        data: Buffer.from(
            getInstructionEncoder(
                new Uint8Array([
                    /* await splDiscriminate('spl_token_group_interface:initialize_token_group') */
                    121, 113, 108, 39, 54, 51, 0, 4,
                ]),
                getStructEncoder([
                    ['updateAuthority', getPublicKeyEncoder()],
                    ['maxSize', getU64Encoder()],
                ]),
            ).encode({ updateAuthority: updateAuthority ?? SystemProgram.programId, maxSize }),
        ),
    });
}

export interface UpdateGroupMaxSize {
    programId: PublicKey;
    group: PublicKey;
    updateAuthority: PublicKey;
    maxSize: bigint;
}

export function createUpdateGroupMaxSizeInstruction(args: UpdateGroupMaxSize): TransactionInstruction {
    const { programId, group, updateAuthority, maxSize } = args;
    return new TransactionInstruction({
        programId,
        keys: [
            { isSigner: false, isWritable: true, pubkey: group },
            { isSigner: true, isWritable: false, pubkey: updateAuthority },
        ],
        data: Buffer.from(
            getInstructionEncoder(
                new Uint8Array([
                    /* await splDiscriminate('spl_token_group_interface:update_group_max_size') */
                    108, 37, 171, 143, 248, 30, 18, 110,
                ]),
                getStructEncoder([['maxSize', getU64Encoder()]]),
            ).encode({ maxSize }),
        ),
    });
}

export interface UpdateGroupAuthority {
    programId: PublicKey;
    group: PublicKey;
    currentAuthority: PublicKey;
    newAuthority: PublicKey | null;
}

export function createUpdateGroupAuthorityInstruction(args: UpdateGroupAuthority): TransactionInstruction {
    const { programId, group, currentAuthority, newAuthority } = args;

    return new TransactionInstruction({
        programId,
        keys: [
            { isSigner: false, isWritable: true, pubkey: group },
            { isSigner: true, isWritable: false, pubkey: currentAuthority },
        ],
        data: Buffer.from(
            getInstructionEncoder(
                new Uint8Array([
                    /* await splDiscriminate('spl_token_group_interface:update_authority') */
                    161, 105, 88, 1, 237, 221, 216, 203,
                ]),
                getStructEncoder([['newAuthority', getPublicKeyEncoder()]]),
            ).encode({ newAuthority: newAuthority ?? SystemProgram.programId }),
        ),
    });
}

export interface InitializeMember {
    programId: PublicKey;
    member: PublicKey;
    memberMint: PublicKey;
    memberMintAuthority: PublicKey;
    group: PublicKey;
    groupUpdateAuthority: PublicKey;
}

export function createInitializeMemberInstruction(args: InitializeMember): TransactionInstruction {
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
        data: Buffer.from(
            getInstructionEncoder(
                new Uint8Array([
                    /* await splDiscriminate('spl_token_group_interface:initialize_member') */
                    152, 32, 222, 176, 223, 237, 116, 134,
                ]),
                getStructEncoder([]),
            ).encode({}),
        ),
    });
}
