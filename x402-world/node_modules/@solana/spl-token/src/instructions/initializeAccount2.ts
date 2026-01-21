import { struct, u8 } from '@solana/buffer-layout';
import { publicKey } from '@solana/buffer-layout-utils';
import type { AccountMeta, PublicKey } from '@solana/web3.js';
import { SYSVAR_RENT_PUBKEY, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '../constants.js';
import {
    TokenInvalidInstructionDataError,
    TokenInvalidInstructionKeysError,
    TokenInvalidInstructionProgramError,
    TokenInvalidInstructionTypeError,
} from '../errors.js';
import { TokenInstruction } from './types.js';

export interface InitializeAccount2InstructionData {
    instruction: TokenInstruction.InitializeAccount2;
    owner: PublicKey;
}

export const initializeAccount2InstructionData = struct<InitializeAccount2InstructionData>([
    u8('instruction'),
    publicKey('owner'),
]);

/**
 * Construct an InitializeAccount2 instruction
 *
 * @param account   New token account
 * @param mint      Mint account
 * @param owner     New account's owner/multisignature
 * @param programId SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createInitializeAccount2Instruction(
    account: PublicKey,
    mint: PublicKey,
    owner: PublicKey,
    programId = TOKEN_PROGRAM_ID,
): TransactionInstruction {
    const keys = [
        { pubkey: account, isSigner: false, isWritable: true },
        { pubkey: mint, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ];
    const data = Buffer.alloc(initializeAccount2InstructionData.span);
    initializeAccount2InstructionData.encode({ instruction: TokenInstruction.InitializeAccount2, owner }, data);
    return new TransactionInstruction({ keys, programId, data });
}

/** A decoded, valid InitializeAccount2 instruction */
export interface DecodedInitializeAccount2Instruction {
    programId: PublicKey;
    keys: {
        account: AccountMeta;
        mint: AccountMeta;
        rent: AccountMeta;
    };
    data: {
        instruction: TokenInstruction.InitializeAccount2;
        owner: PublicKey;
    };
}

/**
 * Decode an InitializeAccount2 instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeInitializeAccount2Instruction(
    instruction: TransactionInstruction,
    programId = TOKEN_PROGRAM_ID,
): DecodedInitializeAccount2Instruction {
    if (!instruction.programId.equals(programId)) throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== initializeAccount2InstructionData.span)
        throw new TokenInvalidInstructionDataError();

    const {
        keys: { account, mint, rent },
        data,
    } = decodeInitializeAccount2InstructionUnchecked(instruction);
    if (data.instruction !== TokenInstruction.InitializeAccount2) throw new TokenInvalidInstructionTypeError();
    if (!account || !mint || !rent) throw new TokenInvalidInstructionKeysError();

    // TODO: key checks?

    return {
        programId,
        keys: {
            account,
            mint,
            rent,
        },
        data,
    };
}

/** A decoded, non-validated InitializeAccount2 instruction */
export interface DecodedInitializeAccount2InstructionUnchecked {
    programId: PublicKey;
    keys: {
        account: AccountMeta | undefined;
        mint: AccountMeta | undefined;
        rent: AccountMeta | undefined;
    };
    data: {
        instruction: number;
        owner: PublicKey;
    };
}

/**
 * Decode an InitializeAccount2 instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeInitializeAccount2InstructionUnchecked({
    programId,
    keys: [account, mint, rent],
    data,
}: TransactionInstruction): DecodedInitializeAccount2InstructionUnchecked {
    return {
        programId,
        keys: {
            account,
            mint,
            rent,
        },
        data: initializeAccount2InstructionData.decode(data),
    };
}
