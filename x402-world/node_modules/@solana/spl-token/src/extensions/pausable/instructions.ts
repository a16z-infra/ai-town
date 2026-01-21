import { struct, u8 } from '@solana/buffer-layout';
import { publicKey } from '@solana/buffer-layout-utils';
import type { Signer } from '@solana/web3.js';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, programSupportsExtensions } from '../../constants.js';
import { TokenUnsupportedInstructionError } from '../../errors.js';
import { TokenInstruction } from '../../instructions/types.js';
import { addSigners } from '../../instructions/internal.js';

export enum PausableInstruction {
    Initialize = 0,
    Pause = 1,
    Resume = 2,
}

export interface InitializePausableConfigInstructionData {
    instruction: TokenInstruction.PausableExtension;
    pausableInstruction: PausableInstruction.Initialize;
    authority: PublicKey;
}

export const initializePausableConfigInstructionData = struct<InitializePausableConfigInstructionData>([
    u8('instruction'),
    u8('pausableInstruction'),
    publicKey('authority'),
]);

/**
 * Construct a InitializePausableConfig instruction
 *
 * @param mint          Token mint account
 * @param authority     Optional authority that can pause or resume mint
 * @param programId     SPL Token program account
 */
export function createInitializePausableConfigInstruction(
    mint: PublicKey,
    authority: PublicKey | null,
    programId: PublicKey = TOKEN_2022_PROGRAM_ID,
): TransactionInstruction {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }
    const keys = [{ pubkey: mint, isSigner: false, isWritable: true }];

    const data = Buffer.alloc(initializePausableConfigInstructionData.span);
    initializePausableConfigInstructionData.encode(
        {
            instruction: TokenInstruction.PausableExtension,
            pausableInstruction: PausableInstruction.Initialize,
            authority: authority ?? PublicKey.default,
        },
        data,
    );

    return new TransactionInstruction({ keys, programId, data: data });
}

export interface PauseInstructionData {
    instruction: TokenInstruction.PausableExtension;
    pausableInstruction: PausableInstruction.Pause;
}

export const pauseInstructionData = struct<PauseInstructionData>([u8('instruction'), u8('pausableInstruction')]);

/**
 * Construct a Pause instruction
 *
 * @param mint          Token mint account
 * @param authority     The pausable mint's authority
 * @param multiSigners  Signing accounts if authority is a multisig
 * @param programId     SPL Token program account
 */
export function createPauseInstruction(
    mint: PublicKey,
    authority: PublicKey,
    multiSigners: (Signer | PublicKey)[] = [],
    programId: PublicKey = TOKEN_2022_PROGRAM_ID,
): TransactionInstruction {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }
    const keys = addSigners([{ pubkey: mint, isSigner: false, isWritable: true }], authority, multiSigners);

    const data = Buffer.alloc(pauseInstructionData.span);
    pauseInstructionData.encode(
        {
            instruction: TokenInstruction.PausableExtension,
            pausableInstruction: PausableInstruction.Pause,
        },
        data,
    );

    return new TransactionInstruction({ keys, programId, data: data });
}

export interface ResumeInstructionData {
    instruction: TokenInstruction.PausableExtension;
    pausableInstruction: PausableInstruction.Resume;
}

export const resumeInstructionData = struct<ResumeInstructionData>([u8('instruction'), u8('pausableInstruction')]);

/**
 * Construct a Resume instruction
 *
 * @param mint          Token mint account
 * @param authority     The pausable mint's authority
 * @param multiSigners  Signing accounts if authority is a multisig
 * @param programId     SPL Token program account
 */
export function createResumeInstruction(
    mint: PublicKey,
    authority: PublicKey,
    multiSigners: (Signer | PublicKey)[] = [],
    programId: PublicKey = TOKEN_2022_PROGRAM_ID,
): TransactionInstruction {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }
    const keys = addSigners([{ pubkey: mint, isSigner: false, isWritable: true }], authority, multiSigners);

    const data = Buffer.alloc(resumeInstructionData.span);
    resumeInstructionData.encode(
        {
            instruction: TokenInstruction.PausableExtension,
            pausableInstruction: PausableInstruction.Resume,
        },
        data,
    );

    return new TransactionInstruction({ keys, programId, data: data });
}
