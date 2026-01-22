import { blob, struct, u8 } from '@solana/buffer-layout';
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
export interface UiAmountToAmountInstructionData {
    instruction: TokenInstruction.UiAmountToAmount;
    amount: Uint8Array;
}

/** TODO: docs */

/**
 * Construct a UiAmountToAmount instruction
 *
 * @param mint         Public key of the mint
 * @param amount       UiAmount of tokens to be converted to Amount
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createUiAmountToAmountInstruction(
    mint: PublicKey,
    amount: string,
    programId = TOKEN_PROGRAM_ID,
): TransactionInstruction {
    const keys = [{ pubkey: mint, isSigner: false, isWritable: false }];
    const buf = Buffer.from(amount, 'utf8');
    const uiAmountToAmountInstructionData = struct<UiAmountToAmountInstructionData>([
        u8('instruction'),
        blob(buf.length, 'amount'),
    ]);

    const data = Buffer.alloc(uiAmountToAmountInstructionData.span);
    uiAmountToAmountInstructionData.encode(
        {
            instruction: TokenInstruction.UiAmountToAmount,
            amount: buf,
        },
        data,
    );

    return new TransactionInstruction({ keys, programId, data });
}

/** A decoded, valid UiAmountToAmount instruction */
export interface DecodedUiAmountToAmountInstruction {
    programId: PublicKey;
    keys: {
        mint: AccountMeta;
    };
    data: {
        instruction: TokenInstruction.UiAmountToAmount;
        amount: Uint8Array;
    };
}

/**
 * Decode a UiAmountToAmount instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeUiAmountToAmountInstruction(
    instruction: TransactionInstruction,
    programId = TOKEN_PROGRAM_ID,
): DecodedUiAmountToAmountInstruction {
    if (!instruction.programId.equals(programId)) throw new TokenInvalidInstructionProgramError();
    const uiAmountToAmountInstructionData = struct<UiAmountToAmountInstructionData>([
        u8('instruction'),
        blob(instruction.data.length - 1, 'amount'),
    ]);
    if (instruction.data.length !== uiAmountToAmountInstructionData.span) throw new TokenInvalidInstructionDataError();

    const {
        keys: { mint },
        data,
    } = decodeUiAmountToAmountInstructionUnchecked(instruction);
    if (data.instruction !== TokenInstruction.UiAmountToAmount) throw new TokenInvalidInstructionTypeError();
    if (!mint) throw new TokenInvalidInstructionKeysError();

    return {
        programId,
        keys: {
            mint,
        },
        data,
    };
}

/** A decoded, non-validated UiAmountToAmount instruction */
export interface DecodedUiAmountToAmountInstructionUnchecked {
    programId: PublicKey;
    keys: {
        mint: AccountMeta | undefined;
    };
    data: {
        instruction: number;
        amount: Uint8Array;
    };
}

/**
 * Decode a UiAmountToAmount instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeUiAmountToAmountInstructionUnchecked({
    programId,
    keys: [mint],
    data,
}: TransactionInstruction): DecodedUiAmountToAmountInstructionUnchecked {
    const uiAmountToAmountInstructionData = struct<UiAmountToAmountInstructionData>([
        u8('instruction'),
        blob(data.length - 1, 'amount'),
    ]);
    return {
        programId,
        keys: {
            mint,
        },
        data: uiAmountToAmountInstructionData.decode(data),
    };
}
