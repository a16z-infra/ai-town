import { struct, u8 } from '@solana/buffer-layout';
import { publicKey } from '@solana/buffer-layout-utils';
import type { Signer } from '@solana/web3.js';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, programSupportsExtensions } from '../../constants.js';
import { TokenUnsupportedInstructionError } from '../../errors.js';
import { TokenInstruction } from '../../instructions/types.js';
import { addSigners } from '../../instructions/internal.js';

export enum MetadataPointerInstruction {
    Initialize = 0,
    Update = 1,
}

export const initializeMetadataPointerData = struct<{
    instruction: TokenInstruction.MetadataPointerExtension;
    metadataPointerInstruction: number;
    authority: PublicKey;
    metadataAddress: PublicKey;
}>([
    // prettier-ignore
    u8('instruction'),
    u8('metadataPointerInstruction'),
    publicKey('authority'),
    publicKey('metadataAddress'),
]);

/**
 * Construct an Initialize MetadataPointer instruction
 *
 * @param mint            Token mint account
 * @param authority       Optional Authority that can set the metadata address
 * @param metadataAddress Optional Account address that holds the metadata
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createInitializeMetadataPointerInstruction(
    mint: PublicKey,
    authority: PublicKey | null,
    metadataAddress: PublicKey | null,
    programId: PublicKey,
): TransactionInstruction {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }
    const keys = [{ pubkey: mint, isSigner: false, isWritable: true }];

    const data = Buffer.alloc(initializeMetadataPointerData.span);
    initializeMetadataPointerData.encode(
        {
            instruction: TokenInstruction.MetadataPointerExtension,
            metadataPointerInstruction: MetadataPointerInstruction.Initialize,
            authority: authority ?? PublicKey.default,
            metadataAddress: metadataAddress ?? PublicKey.default,
        },
        data,
    );

    return new TransactionInstruction({ keys, programId, data: data });
}

export const updateMetadataPointerData = struct<{
    instruction: TokenInstruction.MetadataPointerExtension;
    metadataPointerInstruction: number;
    metadataAddress: PublicKey;
}>([
    // prettier-ignore
    u8('instruction'),
    u8('metadataPointerInstruction'),
    publicKey('metadataAddress'),
]);

export function createUpdateMetadataPointerInstruction(
    mint: PublicKey,
    authority: PublicKey,
    metadataAddress: PublicKey | null,
    multiSigners: (Signer | PublicKey)[] = [],
    programId: PublicKey = TOKEN_2022_PROGRAM_ID,
): TransactionInstruction {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }

    const keys = addSigners([{ pubkey: mint, isSigner: false, isWritable: true }], authority, multiSigners);

    const data = Buffer.alloc(updateMetadataPointerData.span);
    updateMetadataPointerData.encode(
        {
            instruction: TokenInstruction.MetadataPointerExtension,
            metadataPointerInstruction: MetadataPointerInstruction.Update,
            metadataAddress: metadataAddress ?? PublicKey.default,
        },
        data,
    );

    return new TransactionInstruction({ keys, programId, data: data });
}
