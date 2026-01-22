import { struct, u8, f64 } from '@solana/buffer-layout';
import { publicKey, u64 } from '@solana/buffer-layout-utils';
import { TokenInstruction } from '../../instructions/types.js';
import type { Signer } from '@solana/web3.js';
import { TransactionInstruction, PublicKey } from '@solana/web3.js';
import { programSupportsExtensions, TOKEN_2022_PROGRAM_ID } from '../../constants.js';
import { TokenUnsupportedInstructionError } from '../../errors.js';
import { addSigners } from '../../instructions/internal.js';

export enum ScaledUiAmountInstruction {
    Initialize = 0,
    UpdateMultiplier = 1,
}

export interface InitializeScaledUiAmountConfigData {
    instruction: TokenInstruction.ScaledUiAmountExtension;
    scaledUiAmountInstruction: ScaledUiAmountInstruction.Initialize;
    authority: PublicKey | null;
    multiplier: number;
}

export const initializeScaledUiAmountConfigInstructionData = struct<InitializeScaledUiAmountConfigData>([
    u8('instruction'),
    u8('scaledUiAmountInstruction'),
    publicKey('authority'),
    f64('multiplier'),
]);

/**
 * Construct an InitializeScaledUiAmountConfig instruction
 *
 * @param mint         Token mint account
 * @param authority    Optional authority that can update the multipliers
 * @param signers      The signer account(s)
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createInitializeScaledUiAmountConfigInstruction(
    mint: PublicKey,
    authority: PublicKey | null,
    multiplier: number,
    programId: PublicKey = TOKEN_2022_PROGRAM_ID,
): TransactionInstruction {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }
    const keys = [{ pubkey: mint, isSigner: false, isWritable: true }];

    const data = Buffer.alloc(initializeScaledUiAmountConfigInstructionData.span);
    initializeScaledUiAmountConfigInstructionData.encode(
        {
            instruction: TokenInstruction.ScaledUiAmountExtension,
            scaledUiAmountInstruction: ScaledUiAmountInstruction.Initialize,
            authority: authority ?? PublicKey.default,
            multiplier: multiplier,
        },
        data,
    );

    return new TransactionInstruction({ keys, programId, data });
}

export interface UpdateMultiplierData {
    instruction: TokenInstruction.ScaledUiAmountExtension;
    scaledUiAmountInstruction: ScaledUiAmountInstruction.UpdateMultiplier;
    multiplier: number;
    effectiveTimestamp: bigint;
}

export const updateMultiplierData = struct<UpdateMultiplierData>([
    u8('instruction'),
    u8('scaledUiAmountInstruction'),
    f64('multiplier'),
    u64('effectiveTimestamp'),
]);

/**
 * Construct an UpdateMultiplierData instruction
 *
 * @param mint                  Token mint account
 * @param authority             Optional authority that can update the multipliers
 * @param multiplier            New multiplier
 * @param effectiveTimestamp    Effective time stamp for the new multiplier
 * @param multiSigners          Signing accounts if `owner` is a multisig
 * @param programId             SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createUpdateMultiplierDataInstruction(
    mint: PublicKey,
    authority: PublicKey,
    multiplier: number,
    effectiveTimestamp: bigint,
    multiSigners: (Signer | PublicKey)[] = [],
    programId: PublicKey = TOKEN_2022_PROGRAM_ID,
): TransactionInstruction {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }
    const keys = addSigners([{ pubkey: mint, isSigner: false, isWritable: true }], authority, multiSigners);

    const data = Buffer.alloc(updateMultiplierData.span);
    updateMultiplierData.encode(
        {
            instruction: TokenInstruction.ScaledUiAmountExtension,
            scaledUiAmountInstruction: ScaledUiAmountInstruction.UpdateMultiplier,
            multiplier,
            effectiveTimestamp,
        },
        data,
    );

    return new TransactionInstruction({ keys, programId, data });
}
