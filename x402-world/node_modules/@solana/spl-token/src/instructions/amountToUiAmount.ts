import { struct, u8 } from '@solana/buffer-layout';
import { u64 } from '@solana/buffer-layout-utils';
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

/** TODO: docs */
export interface AmountToUiAmountInstructionData {
    instruction: TokenInstruction.AmountToUiAmount;
    amount: bigint;
}

/** TODO: docs */
export const amountToUiAmountInstructionData = struct<AmountToUiAmountInstructionData>([
    u8('instruction'),
    u64('amount'),
]);

/**
 * Construct a AmountToUiAmount instruction
 *
 * @param mint         Public key of the mint
 * @param amount       Amount of tokens to be converted to UiAmount
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createAmountToUiAmountInstruction(
    mint: PublicKey,
    amount: number | bigint,
    programId = TOKEN_PROGRAM_ID,
): TransactionInstruction {
    const keys = [{ pubkey: mint, isSigner: false, isWritable: false }];

    const data = Buffer.alloc(amountToUiAmountInstructionData.span);
    amountToUiAmountInstructionData.encode(
        {
            instruction: TokenInstruction.AmountToUiAmount,
            amount: BigInt(amount),
        },
        data,
    );

    return new TransactionInstruction({ keys, programId, data });
}

/** A decoded, valid AmountToUiAmount instruction */
export interface DecodedAmountToUiAmountInstruction {
    programId: PublicKey;
    keys: {
        mint: AccountMeta;
    };
    data: {
        instruction: TokenInstruction.AmountToUiAmount;
        amount: bigint;
    };
}

/**
 * Decode a AmountToUiAmount instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeAmountToUiAmountInstruction(
    instruction: TransactionInstruction,
    programId = TOKEN_PROGRAM_ID,
): DecodedAmountToUiAmountInstruction {
    if (!instruction.programId.equals(programId)) throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== amountToUiAmountInstructionData.span) throw new TokenInvalidInstructionDataError();

    const {
        keys: { mint },
        data,
    } = decodeAmountToUiAmountInstructionUnchecked(instruction);
    if (data.instruction !== TokenInstruction.AmountToUiAmount) throw new TokenInvalidInstructionTypeError();
    if (!mint) throw new TokenInvalidInstructionKeysError();

    return {
        programId,
        keys: {
            mint,
        },
        data,
    };
}

/** A decoded, non-validated AmountToUiAmount instruction */
export interface DecodedAmountToUiAmountInstructionUnchecked {
    programId: PublicKey;
    keys: {
        mint: AccountMeta | undefined;
    };
    data: {
        instruction: number;
        amount: bigint;
    };
}

/**
 * Decode a AmountToUiAmount instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeAmountToUiAmountInstructionUnchecked({
    programId,
    keys: [mint],
    data,
}: TransactionInstruction): DecodedAmountToUiAmountInstructionUnchecked {
    return {
        programId,
        keys: {
            mint,
        },
        data: amountToUiAmountInstructionData.decode(data),
    };
}
