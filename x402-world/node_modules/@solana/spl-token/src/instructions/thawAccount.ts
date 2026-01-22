import { struct, u8 } from '@solana/buffer-layout';
import type { AccountMeta, PublicKey, Signer } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '../constants.js';
import {
    TokenInvalidInstructionDataError,
    TokenInvalidInstructionKeysError,
    TokenInvalidInstructionProgramError,
    TokenInvalidInstructionTypeError,
} from '../errors.js';
import { addSigners } from './internal.js';
import { TokenInstruction } from './types.js';

/** TODO: docs */
export interface ThawAccountInstructionData {
    instruction: TokenInstruction.ThawAccount;
}

/** TODO: docs */
export const thawAccountInstructionData = struct<ThawAccountInstructionData>([u8('instruction')]);

/**
 * Construct a ThawAccount instruction
 *
 * @param account      Account to thaw
 * @param mint         Mint account
 * @param authority    Mint freeze authority
 * @param multiSigners Signing accounts if `authority` is a multisig
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createThawAccountInstruction(
    account: PublicKey,
    mint: PublicKey,
    authority: PublicKey,
    multiSigners: (Signer | PublicKey)[] = [],
    programId = TOKEN_PROGRAM_ID,
): TransactionInstruction {
    const keys = addSigners(
        [
            { pubkey: account, isSigner: false, isWritable: true },
            { pubkey: mint, isSigner: false, isWritable: false },
        ],
        authority,
        multiSigners,
    );

    const data = Buffer.alloc(thawAccountInstructionData.span);
    thawAccountInstructionData.encode({ instruction: TokenInstruction.ThawAccount }, data);

    return new TransactionInstruction({ keys, programId, data });
}

/** A decoded, valid ThawAccount instruction */
export interface DecodedThawAccountInstruction {
    programId: PublicKey;
    keys: {
        account: AccountMeta;
        mint: AccountMeta;
        authority: AccountMeta;
        multiSigners: AccountMeta[];
    };
    data: {
        instruction: TokenInstruction.ThawAccount;
    };
}

/**
 * Decode a ThawAccount instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeThawAccountInstruction(
    instruction: TransactionInstruction,
    programId = TOKEN_PROGRAM_ID,
): DecodedThawAccountInstruction {
    if (!instruction.programId.equals(programId)) throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== thawAccountInstructionData.span) throw new TokenInvalidInstructionDataError();

    const {
        keys: { account, mint, authority, multiSigners },
        data,
    } = decodeThawAccountInstructionUnchecked(instruction);
    if (data.instruction !== TokenInstruction.ThawAccount) throw new TokenInvalidInstructionTypeError();
    if (!account || !mint || !authority) throw new TokenInvalidInstructionKeysError();

    // TODO: key checks?

    return {
        programId,
        keys: {
            account,
            mint,
            authority,
            multiSigners,
        },
        data,
    };
}

/** A decoded, non-validated ThawAccount instruction */
export interface DecodedThawAccountInstructionUnchecked {
    programId: PublicKey;
    keys: {
        account: AccountMeta | undefined;
        mint: AccountMeta | undefined;
        authority: AccountMeta | undefined;
        multiSigners: AccountMeta[];
    };
    data: {
        instruction: number;
    };
}

/**
 * Decode a ThawAccount instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeThawAccountInstructionUnchecked({
    programId,
    keys: [account, mint, authority, ...multiSigners],
    data,
}: TransactionInstruction): DecodedThawAccountInstructionUnchecked {
    return {
        programId,
        keys: {
            account,
            mint,
            authority,
            multiSigners,
        },
        data: thawAccountInstructionData.decode(data),
    };
}
