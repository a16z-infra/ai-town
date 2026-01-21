import { struct, u8 } from '@solana/buffer-layout';
import { publicKey } from '@solana/buffer-layout-utils';
import type { Signer } from '@solana/web3.js';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, programSupportsExtensions } from '../../constants.js';
import { TokenUnsupportedInstructionError } from '../../errors.js';
import { TokenInstruction } from '../../instructions/types.js';
import { addSigners } from '../../instructions/internal.js';

export enum GroupMemberPointerInstruction {
    Initialize = 0,
    Update = 1,
}

export const initializeGroupMemberPointerData = struct<{
    instruction: TokenInstruction.GroupMemberPointerExtension;
    groupMemberPointerInstruction: number;
    authority: PublicKey;
    memberAddress: PublicKey;
}>([
    // prettier-ignore
    u8('instruction'),
    u8('groupMemberPointerInstruction'),
    publicKey('authority'),
    publicKey('memberAddress'),
]);

/**
 * Construct an Initialize GroupMemberPointer instruction
 *
 * @param mint            Token mint account
 * @param authority       Optional Authority that can set the member address
 * @param memberAddress   Optional Account address that holds the member
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createInitializeGroupMemberPointerInstruction(
    mint: PublicKey,
    authority: PublicKey | null,
    memberAddress: PublicKey | null,
    programId: PublicKey = TOKEN_2022_PROGRAM_ID,
): TransactionInstruction {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }
    const keys = [{ pubkey: mint, isSigner: false, isWritable: true }];

    const data = Buffer.alloc(initializeGroupMemberPointerData.span);
    initializeGroupMemberPointerData.encode(
        {
            instruction: TokenInstruction.GroupMemberPointerExtension,
            groupMemberPointerInstruction: GroupMemberPointerInstruction.Initialize,
            authority: authority ?? PublicKey.default,
            memberAddress: memberAddress ?? PublicKey.default,
        },
        data,
    );

    return new TransactionInstruction({ keys, programId, data: data });
}

export const updateGroupMemberPointerData = struct<{
    instruction: TokenInstruction.GroupMemberPointerExtension;
    groupMemberPointerInstruction: number;
    memberAddress: PublicKey;
}>([
    // prettier-ignore
    u8('instruction'),
    u8('groupMemberPointerInstruction'),
    publicKey('memberAddress'),
]);

export function createUpdateGroupMemberPointerInstruction(
    mint: PublicKey,
    authority: PublicKey,
    memberAddress: PublicKey | null,
    multiSigners: (Signer | PublicKey)[] = [],
    programId: PublicKey = TOKEN_2022_PROGRAM_ID,
): TransactionInstruction {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }

    const keys = addSigners([{ pubkey: mint, isSigner: false, isWritable: true }], authority, multiSigners);

    const data = Buffer.alloc(updateGroupMemberPointerData.span);
    updateGroupMemberPointerData.encode(
        {
            instruction: TokenInstruction.GroupMemberPointerExtension,
            groupMemberPointerInstruction: GroupMemberPointerInstruction.Update,
            memberAddress: memberAddress ?? PublicKey.default,
        },
        data,
    );

    return new TransactionInstruction({ keys, programId, data: data });
}
