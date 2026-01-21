import { struct, u8 } from '@solana/buffer-layout';
import type { PublicKey, Signer } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { programSupportsExtensions, TOKEN_2022_PROGRAM_ID } from '../../constants.js';
import { TokenUnsupportedInstructionError } from '../../errors.js';
import { addSigners } from '../../instructions/internal.js';
import { TokenInstruction } from '../../instructions/types.js';

export enum MemoTransferInstruction {
    Enable = 0,
    Disable = 1,
}

/** TODO: docs */
export interface MemoTransferInstructionData {
    instruction: TokenInstruction.MemoTransferExtension;
    memoTransferInstruction: MemoTransferInstruction;
}

/** TODO: docs */
export const memoTransferInstructionData = struct<MemoTransferInstructionData>([
    u8('instruction'),
    u8('memoTransferInstruction'),
]);

/**
 * Construct an EnableRequiredMemoTransfers instruction
 *
 * @param account         Token account to update
 * @param authority       The account's owner/delegate
 * @param signers         The signer account(s)
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createEnableRequiredMemoTransfersInstruction(
    account: PublicKey,
    authority: PublicKey,
    multiSigners: (Signer | PublicKey)[] = [],
    programId = TOKEN_2022_PROGRAM_ID,
): TransactionInstruction {
    return createMemoTransferInstruction(MemoTransferInstruction.Enable, account, authority, multiSigners, programId);
}

/**
 * Construct a DisableMemoTransfer instruction
 *
 * @param account         Token account to update
 * @param authority       The account's owner/delegate
 * @param signers         The signer account(s)
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createDisableRequiredMemoTransfersInstruction(
    account: PublicKey,
    authority: PublicKey,
    multiSigners: (Signer | PublicKey)[] = [],
    programId = TOKEN_2022_PROGRAM_ID,
): TransactionInstruction {
    return createMemoTransferInstruction(MemoTransferInstruction.Disable, account, authority, multiSigners, programId);
}

function createMemoTransferInstruction(
    memoTransferInstruction: MemoTransferInstruction,
    account: PublicKey,
    authority: PublicKey,
    multiSigners: (Signer | PublicKey)[],
    programId: PublicKey,
): TransactionInstruction {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }

    const keys = addSigners([{ pubkey: account, isSigner: false, isWritable: true }], authority, multiSigners);
    const data = Buffer.alloc(memoTransferInstructionData.span);
    memoTransferInstructionData.encode(
        {
            instruction: TokenInstruction.MemoTransferExtension,
            memoTransferInstruction,
        },
        data,
    );

    return new TransactionInstruction({ keys, programId, data });
}
