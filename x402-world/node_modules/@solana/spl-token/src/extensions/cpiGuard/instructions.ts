import { struct, u8 } from '@solana/buffer-layout';
import type { PublicKey, Signer } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { programSupportsExtensions, TOKEN_2022_PROGRAM_ID } from '../../constants.js';
import { TokenUnsupportedInstructionError } from '../../errors.js';
import { addSigners } from '../../instructions/internal.js';
import { TokenInstruction } from '../../instructions/types.js';

export enum CpiGuardInstruction {
    Enable = 0,
    Disable = 1,
}

/** TODO: docs */
export interface CpiGuardInstructionData {
    instruction: TokenInstruction.CpiGuardExtension;
    cpiGuardInstruction: CpiGuardInstruction;
}

/** TODO: docs */
export const cpiGuardInstructionData = struct<CpiGuardInstructionData>([u8('instruction'), u8('cpiGuardInstruction')]);

/**
 * Construct an EnableCpiGuard instruction
 *
 * @param account         Token account to update
 * @param authority       The account's owner/delegate
 * @param signers         The signer account(s)
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createEnableCpiGuardInstruction(
    account: PublicKey,
    authority: PublicKey,
    multiSigners: (Signer | PublicKey)[] = [],
    programId = TOKEN_2022_PROGRAM_ID,
): TransactionInstruction {
    return createCpiGuardInstruction(CpiGuardInstruction.Enable, account, authority, multiSigners, programId);
}

/**
 * Construct a DisableCpiGuard instruction
 *
 * @param account         Token account to update
 * @param authority       The account's owner/delegate
 * @param signers         The signer account(s)
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createDisableCpiGuardInstruction(
    account: PublicKey,
    authority: PublicKey,
    multiSigners: (Signer | PublicKey)[] = [],
    programId = TOKEN_2022_PROGRAM_ID,
): TransactionInstruction {
    return createCpiGuardInstruction(CpiGuardInstruction.Disable, account, authority, multiSigners, programId);
}

function createCpiGuardInstruction(
    cpiGuardInstruction: CpiGuardInstruction,
    account: PublicKey,
    authority: PublicKey,
    multiSigners: (Signer | PublicKey)[],
    programId: PublicKey,
): TransactionInstruction {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }
    const keys = addSigners([{ pubkey: account, isSigner: false, isWritable: true }], authority, multiSigners);

    const data = Buffer.alloc(cpiGuardInstructionData.span);
    cpiGuardInstructionData.encode(
        {
            instruction: TokenInstruction.CpiGuardExtension,
            cpiGuardInstruction,
        },
        data,
    );

    return new TransactionInstruction({ keys, programId, data });
}
