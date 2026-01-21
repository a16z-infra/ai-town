import { struct, u8 } from '@solana/buffer-layout';
import { publicKey } from '@solana/buffer-layout-utils';
import type { AccountMeta } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { programSupportsExtensions } from '../constants.js';
import {
    TokenInvalidInstructionDataError,
    TokenInvalidInstructionKeysError,
    TokenInvalidInstructionProgramError,
    TokenInvalidInstructionTypeError,
    TokenUnsupportedInstructionError,
} from '../errors.js';
import { TokenInstruction } from './types.js';

/** TODO: docs */
export interface InitializePermanentDelegateInstructionData {
    instruction: TokenInstruction.InitializePermanentDelegate;
    delegate: PublicKey;
}

/** TODO: docs */
export const initializePermanentDelegateInstructionData = struct<InitializePermanentDelegateInstructionData>([
    u8('instruction'),
    publicKey('delegate'),
]);

/**
 * Construct an InitializePermanentDelegate instruction
 *
 * @param mint               Token mint account
 * @param permanentDelegate  Authority that may sign for `Transfer`s and `Burn`s on any account
 * @param programId          SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createInitializePermanentDelegateInstruction(
    mint: PublicKey,
    permanentDelegate: PublicKey | null,
    programId: PublicKey,
): TransactionInstruction {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }
    const keys = [{ pubkey: mint, isSigner: false, isWritable: true }];

    const data = Buffer.alloc(initializePermanentDelegateInstructionData.span);
    initializePermanentDelegateInstructionData.encode(
        {
            instruction: TokenInstruction.InitializePermanentDelegate,
            delegate: permanentDelegate || new PublicKey(0),
        },
        data,
    );

    return new TransactionInstruction({ keys, programId, data });
}

/** A decoded, valid InitializePermanentDelegate instruction */
export interface DecodedInitializePermanentDelegateInstruction {
    programId: PublicKey;
    keys: {
        mint: AccountMeta;
    };
    data: {
        instruction: TokenInstruction.InitializePermanentDelegate;
        delegate: PublicKey | null;
    };
}

/**
 * Decode an InitializePermanentDelegate instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeInitializePermanentDelegateInstruction(
    instruction: TransactionInstruction,
    programId: PublicKey,
): DecodedInitializePermanentDelegateInstruction {
    if (!instruction.programId.equals(programId)) throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== initializePermanentDelegateInstructionData.span)
        throw new TokenInvalidInstructionDataError();

    const {
        keys: { mint },
        data,
    } = decodeInitializePermanentDelegateInstructionUnchecked(instruction);
    if (data.instruction !== TokenInstruction.InitializePermanentDelegate) throw new TokenInvalidInstructionTypeError();
    if (!mint) throw new TokenInvalidInstructionKeysError();

    return {
        programId,
        keys: {
            mint,
        },
        data,
    };
}

/** A decoded, non-validated InitializePermanentDelegate instruction */
export interface DecodedInitializePermanentDelegateInstructionUnchecked {
    programId: PublicKey;
    keys: {
        mint: AccountMeta | undefined;
    };
    data: {
        instruction: number;
        delegate: PublicKey | null;
    };
}

/**
 * Decode an InitializePermanentDelegate instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeInitializePermanentDelegateInstructionUnchecked({
    programId,
    keys: [mint],
    data,
}: TransactionInstruction): DecodedInitializePermanentDelegateInstructionUnchecked {
    const { instruction, delegate } = initializePermanentDelegateInstructionData.decode(data);

    return {
        programId,
        keys: {
            mint,
        },
        data: {
            instruction,
            delegate,
        },
    };
}
