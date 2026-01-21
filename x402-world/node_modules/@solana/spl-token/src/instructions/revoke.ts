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
export interface RevokeInstructionData {
    instruction: TokenInstruction.Revoke;
}

/** TODO: docs */
export const revokeInstructionData = struct<RevokeInstructionData>([u8('instruction')]);

/**
 * Construct a Revoke instruction
 *
 * @param account      Address of the token account
 * @param owner        Owner of the account
 * @param multiSigners Signing accounts if `owner` is a multisig
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createRevokeInstruction(
    account: PublicKey,
    owner: PublicKey,
    multiSigners: (Signer | PublicKey)[] = [],
    programId = TOKEN_PROGRAM_ID,
): TransactionInstruction {
    const keys = addSigners([{ pubkey: account, isSigner: false, isWritable: true }], owner, multiSigners);

    const data = Buffer.alloc(revokeInstructionData.span);
    revokeInstructionData.encode({ instruction: TokenInstruction.Revoke }, data);

    return new TransactionInstruction({ keys, programId, data });
}

/** A decoded, valid Revoke instruction */
export interface DecodedRevokeInstruction {
    programId: PublicKey;
    keys: {
        account: AccountMeta;
        owner: AccountMeta;
        multiSigners: AccountMeta[];
    };
    data: {
        instruction: TokenInstruction.Revoke;
    };
}

/**
 * Decode a Revoke instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeRevokeInstruction(
    instruction: TransactionInstruction,
    programId = TOKEN_PROGRAM_ID,
): DecodedRevokeInstruction {
    if (!instruction.programId.equals(programId)) throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== revokeInstructionData.span) throw new TokenInvalidInstructionDataError();

    const {
        keys: { account, owner, multiSigners },
        data,
    } = decodeRevokeInstructionUnchecked(instruction);
    if (data.instruction !== TokenInstruction.Revoke) throw new TokenInvalidInstructionTypeError();
    if (!account || !owner) throw new TokenInvalidInstructionKeysError();

    // TODO: key checks?

    return {
        programId,
        keys: {
            account,
            owner,
            multiSigners,
        },
        data,
    };
}

/** A decoded, non-validated Revoke instruction */
export interface DecodedRevokeInstructionUnchecked {
    programId: PublicKey;
    keys: {
        account: AccountMeta | undefined;
        owner: AccountMeta | undefined;
        multiSigners: AccountMeta[];
    };
    data: {
        instruction: number;
    };
}

/**
 * Decode a Revoke instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeRevokeInstructionUnchecked({
    programId,
    keys: [account, owner, ...multiSigners],
    data,
}: TransactionInstruction): DecodedRevokeInstructionUnchecked {
    return {
        programId,
        keys: {
            account,
            owner,
            multiSigners,
        },
        data: revokeInstructionData.decode(data),
    };
}
