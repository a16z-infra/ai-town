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
export interface CloseAccountInstructionData {
    instruction: TokenInstruction.CloseAccount;
}

/** TODO: docs */
export const closeAccountInstructionData = struct<CloseAccountInstructionData>([u8('instruction')]);

/**
 * Construct a CloseAccount instruction
 *
 * @param account      Account to close
 * @param destination  Account to receive the remaining balance of the closed account
 * @param authority    Account close authority
 * @param multiSigners Signing accounts if `authority` is a multisig
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createCloseAccountInstruction(
    account: PublicKey,
    destination: PublicKey,
    authority: PublicKey,
    multiSigners: (Signer | PublicKey)[] = [],
    programId = TOKEN_PROGRAM_ID,
): TransactionInstruction {
    const keys = addSigners(
        [
            { pubkey: account, isSigner: false, isWritable: true },
            { pubkey: destination, isSigner: false, isWritable: true },
        ],
        authority,
        multiSigners,
    );

    const data = Buffer.alloc(closeAccountInstructionData.span);
    closeAccountInstructionData.encode({ instruction: TokenInstruction.CloseAccount }, data);

    return new TransactionInstruction({ keys, programId, data });
}

/** A decoded, valid CloseAccount instruction */
export interface DecodedCloseAccountInstruction {
    programId: PublicKey;
    keys: {
        account: AccountMeta;
        destination: AccountMeta;
        authority: AccountMeta;
        multiSigners: AccountMeta[];
    };
    data: {
        instruction: TokenInstruction.CloseAccount;
    };
}

/**
 * Decode a CloseAccount instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeCloseAccountInstruction(
    instruction: TransactionInstruction,
    programId = TOKEN_PROGRAM_ID,
): DecodedCloseAccountInstruction {
    if (!instruction.programId.equals(programId)) throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== closeAccountInstructionData.span) throw new TokenInvalidInstructionDataError();

    const {
        keys: { account, destination, authority, multiSigners },
        data,
    } = decodeCloseAccountInstructionUnchecked(instruction);
    if (data.instruction !== TokenInstruction.CloseAccount) throw new TokenInvalidInstructionTypeError();
    if (!account || !destination || !authority) throw new TokenInvalidInstructionKeysError();

    // TODO: key checks?

    return {
        programId,
        keys: {
            account,
            destination,
            authority,
            multiSigners,
        },
        data,
    };
}

/** A decoded, non-validated CloseAccount instruction */
export interface DecodedCloseAccountInstructionUnchecked {
    programId: PublicKey;
    keys: {
        account: AccountMeta | undefined;
        destination: AccountMeta | undefined;
        authority: AccountMeta | undefined;
        multiSigners: AccountMeta[];
    };
    data: {
        instruction: number;
    };
}

/**
 * Decode a CloseAccount instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeCloseAccountInstructionUnchecked({
    programId,
    keys: [account, destination, authority, ...multiSigners],
    data,
}: TransactionInstruction): DecodedCloseAccountInstructionUnchecked {
    return {
        programId,
        keys: {
            account,
            destination,
            authority,
            multiSigners,
        },
        data: closeAccountInstructionData.decode(data),
    };
}
