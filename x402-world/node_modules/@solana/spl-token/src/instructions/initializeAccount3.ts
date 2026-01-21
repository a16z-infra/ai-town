import { struct, u8 } from '@solana/buffer-layout';
import { publicKey } from '@solana/buffer-layout-utils';
import type { AccountMeta, PublicKey } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '../constants.js';
import {
    TokenInvalidInstructionDataError,
    TokenInvalidInstructionKeysError,
    TokenInvalidInstructionProgramError,
    TokenInvalidInstructionTypeError,
} from '../errors.js';
import { TokenInstruction } from './types.js';

export interface InitializeAccount3InstructionData {
    instruction: TokenInstruction.InitializeAccount3;
    owner: PublicKey;
}

export const initializeAccount3InstructionData = struct<InitializeAccount3InstructionData>([
    u8('instruction'),
    publicKey('owner'),
]);

/**
 * Construct an InitializeAccount3 instruction
 *
 * @param account   New token account
 * @param mint      Mint account
 * @param owner     New account's owner/multisignature
 * @param programId SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createInitializeAccount3Instruction(
    account: PublicKey,
    mint: PublicKey,
    owner: PublicKey,
    programId = TOKEN_PROGRAM_ID,
): TransactionInstruction {
    const keys = [
        { pubkey: account, isSigner: false, isWritable: true },
        { pubkey: mint, isSigner: false, isWritable: false },
    ];
    const data = Buffer.alloc(initializeAccount3InstructionData.span);
    initializeAccount3InstructionData.encode({ instruction: TokenInstruction.InitializeAccount3, owner }, data);
    return new TransactionInstruction({ keys, programId, data });
}

/** A decoded, valid InitializeAccount3 instruction */
export interface DecodedInitializeAccount3Instruction {
    programId: PublicKey;
    keys: {
        account: AccountMeta;
        mint: AccountMeta;
    };
    data: {
        instruction: TokenInstruction.InitializeAccount3;
        owner: PublicKey;
    };
}

/**
 * Decode an InitializeAccount3 instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeInitializeAccount3Instruction(
    instruction: TransactionInstruction,
    programId = TOKEN_PROGRAM_ID,
): DecodedInitializeAccount3Instruction {
    if (!instruction.programId.equals(programId)) throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== initializeAccount3InstructionData.span)
        throw new TokenInvalidInstructionDataError();

    const {
        keys: { account, mint },
        data,
    } = decodeInitializeAccount3InstructionUnchecked(instruction);
    if (data.instruction !== TokenInstruction.InitializeAccount3) throw new TokenInvalidInstructionTypeError();
    if (!account || !mint) throw new TokenInvalidInstructionKeysError();

    // TODO: key checks?

    return {
        programId,
        keys: {
            account,
            mint,
        },
        data,
    };
}

/** A decoded, non-validated InitializeAccount3 instruction */
export interface DecodedInitializeAccount3InstructionUnchecked {
    programId: PublicKey;
    keys: {
        account: AccountMeta | undefined;
        mint: AccountMeta | undefined;
    };
    data: {
        instruction: number;
        owner: PublicKey;
    };
}

/**
 * Decode an InitializeAccount3 instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeInitializeAccount3InstructionUnchecked({
    programId,
    keys: [account, mint],
    data,
}: TransactionInstruction): DecodedInitializeAccount3InstructionUnchecked {
    return {
        programId,
        keys: {
            account,
            mint,
        },
        data: initializeAccount3InstructionData.decode(data),
    };
}
