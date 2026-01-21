import { struct, u8 } from '@solana/buffer-layout';
import type { AccountMeta, PublicKey } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import {
    TokenInvalidInstructionDataError,
    TokenInvalidInstructionKeysError,
    TokenInvalidInstructionProgramError,
    TokenInvalidInstructionTypeError,
} from '../errors.js';
import { TokenInstruction } from './types.js';

/** Deserialized instruction for the initiation of an immutable owner account */
export interface InitializeImmutableOwnerInstructionData {
    instruction: TokenInstruction.InitializeImmutableOwner;
}

/** The struct that represents the instruction data as it is read by the program */
export const initializeImmutableOwnerInstructionData = struct<InitializeImmutableOwnerInstructionData>([
    u8('instruction'),
]);

/**
 * Construct an InitializeImmutableOwner instruction
 *
 * @param account           Immutable Owner Account
 * @param programId         SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createInitializeImmutableOwnerInstruction(
    account: PublicKey,
    programId: PublicKey,
): TransactionInstruction {
    const keys = [{ pubkey: account, isSigner: false, isWritable: true }];

    const data = Buffer.alloc(initializeImmutableOwnerInstructionData.span);
    initializeImmutableOwnerInstructionData.encode(
        {
            instruction: TokenInstruction.InitializeImmutableOwner,
        },
        data,
    );

    return new TransactionInstruction({ keys, programId, data });
}

/** A decoded, valid InitializeImmutableOwner instruction */
export interface DecodedInitializeImmutableOwnerInstruction {
    programId: PublicKey;
    keys: {
        account: AccountMeta;
    };
    data: {
        instruction: TokenInstruction.InitializeImmutableOwner;
    };
}

/**
 * Decode an InitializeImmutableOwner instruction and validate it
 *
 * @param instruction InitializeImmutableOwner instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeInitializeImmutableOwnerInstruction(
    instruction: TransactionInstruction,
    programId: PublicKey,
): DecodedInitializeImmutableOwnerInstruction {
    if (!instruction.programId.equals(programId)) throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== initializeImmutableOwnerInstructionData.span)
        throw new TokenInvalidInstructionDataError();

    const {
        keys: { account },
        data,
    } = decodeInitializeImmutableOwnerInstructionUnchecked(instruction);
    if (data.instruction !== TokenInstruction.InitializeImmutableOwner) throw new TokenInvalidInstructionTypeError();
    if (!account) throw new TokenInvalidInstructionKeysError();

    return {
        programId,
        keys: {
            account,
        },
        data,
    };
}

/** A decoded, non-validated InitializeImmutableOwner instruction */
export interface DecodedInitializeImmutableOwnerInstructionUnchecked {
    programId: PublicKey;
    keys: {
        account: AccountMeta | undefined;
    };
    data: {
        instruction: number;
    };
}

/**
 * Decode an InitializeImmutableOwner instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeInitializeImmutableOwnerInstructionUnchecked({
    programId,
    keys: [account],
    data,
}: TransactionInstruction): DecodedInitializeImmutableOwnerInstructionUnchecked {
    const { instruction } = initializeImmutableOwnerInstructionData.decode(data);

    return {
        programId,
        keys: {
            account: account,
        },
        data: {
            instruction,
        },
    };
}
