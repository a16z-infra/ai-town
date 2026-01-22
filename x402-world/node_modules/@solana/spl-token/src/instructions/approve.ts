import { struct, u8 } from '@solana/buffer-layout';
import { u64 } from '@solana/buffer-layout-utils';
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
export interface ApproveInstructionData {
    instruction: TokenInstruction.Approve;
    amount: bigint;
}

/** TODO: docs */
export const approveInstructionData = struct<ApproveInstructionData>([u8('instruction'), u64('amount')]);

/**
 * Construct an Approve instruction
 *
 * @param account      Account to set the delegate for
 * @param delegate     Account authorized to transfer tokens from the account
 * @param owner        Owner of the account
 * @param amount       Maximum number of tokens the delegate may transfer
 * @param multiSigners Signing accounts if `owner` is a multisig
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createApproveInstruction(
    account: PublicKey,
    delegate: PublicKey,
    owner: PublicKey,
    amount: number | bigint,
    multiSigners: (Signer | PublicKey)[] = [],
    programId = TOKEN_PROGRAM_ID,
): TransactionInstruction {
    const keys = addSigners(
        [
            { pubkey: account, isSigner: false, isWritable: true },
            { pubkey: delegate, isSigner: false, isWritable: false },
        ],
        owner,
        multiSigners,
    );

    const data = Buffer.alloc(approveInstructionData.span);
    approveInstructionData.encode(
        {
            instruction: TokenInstruction.Approve,
            amount: BigInt(amount),
        },
        data,
    );

    return new TransactionInstruction({ keys, programId, data });
}

/** A decoded, valid Approve instruction */
export interface DecodedApproveInstruction {
    programId: PublicKey;
    keys: {
        account: AccountMeta;
        delegate: AccountMeta;
        owner: AccountMeta;
        multiSigners: AccountMeta[];
    };
    data: {
        instruction: TokenInstruction.Approve;
        amount: bigint;
    };
}

/**
 * Decode an Approve instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeApproveInstruction(
    instruction: TransactionInstruction,
    programId = TOKEN_PROGRAM_ID,
): DecodedApproveInstruction {
    if (!instruction.programId.equals(programId)) throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== approveInstructionData.span) throw new TokenInvalidInstructionDataError();

    const {
        keys: { account, delegate, owner, multiSigners },
        data,
    } = decodeApproveInstructionUnchecked(instruction);
    if (data.instruction !== TokenInstruction.Approve) throw new TokenInvalidInstructionTypeError();
    if (!account || !delegate || !owner) throw new TokenInvalidInstructionKeysError();

    // TODO: key checks?

    return {
        programId,
        keys: {
            account,
            delegate,
            owner,
            multiSigners,
        },
        data,
    };
}

/** A decoded, non-validated Approve instruction */
export interface DecodedApproveInstructionUnchecked {
    programId: PublicKey;
    keys: {
        account: AccountMeta | undefined;
        delegate: AccountMeta | undefined;
        owner: AccountMeta | undefined;
        multiSigners: AccountMeta[];
    };
    data: {
        instruction: number;
        amount: bigint;
    };
}

/**
 * Decode an Approve instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeApproveInstructionUnchecked({
    programId,
    keys: [account, delegate, owner, ...multiSigners],
    data,
}: TransactionInstruction): DecodedApproveInstructionUnchecked {
    return {
        programId,
        keys: {
            account,
            delegate,
            owner,
            multiSigners,
        },
        data: approveInstructionData.decode(data),
    };
}
