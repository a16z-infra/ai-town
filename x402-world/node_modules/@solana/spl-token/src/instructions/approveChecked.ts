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
export interface ApproveCheckedInstructionData {
    instruction: TokenInstruction.ApproveChecked;
    amount: bigint;
    decimals: number;
}

/** TODO: docs */
export const approveCheckedInstructionData = struct<ApproveCheckedInstructionData>([
    u8('instruction'),
    u64('amount'),
    u8('decimals'),
]);

/**
 * Construct an ApproveChecked instruction
 *
 * @param account      Account to set the delegate for
 * @param mint         Mint account
 * @param delegate     Account authorized to transfer of tokens from the account
 * @param owner        Owner of the account
 * @param amount       Maximum number of tokens the delegate may transfer
 * @param decimals     Number of decimals in approve amount
 * @param multiSigners Signing accounts if `owner` is a multisig
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createApproveCheckedInstruction(
    account: PublicKey,
    mint: PublicKey,
    delegate: PublicKey,
    owner: PublicKey,
    amount: number | bigint,
    decimals: number,
    multiSigners: (Signer | PublicKey)[] = [],
    programId = TOKEN_PROGRAM_ID,
): TransactionInstruction {
    const keys = addSigners(
        [
            { pubkey: account, isSigner: false, isWritable: true },
            { pubkey: mint, isSigner: false, isWritable: false },
            { pubkey: delegate, isSigner: false, isWritable: false },
        ],
        owner,
        multiSigners,
    );

    const data = Buffer.alloc(approveCheckedInstructionData.span);
    approveCheckedInstructionData.encode(
        {
            instruction: TokenInstruction.ApproveChecked,
            amount: BigInt(amount),
            decimals,
        },
        data,
    );

    return new TransactionInstruction({ keys, programId, data });
}

/** A decoded, valid ApproveChecked instruction */
export interface DecodedApproveCheckedInstruction {
    programId: PublicKey;
    keys: {
        account: AccountMeta;
        mint: AccountMeta;
        delegate: AccountMeta;
        owner: AccountMeta;
        multiSigners: AccountMeta[];
    };
    data: {
        instruction: TokenInstruction.ApproveChecked;
        amount: bigint;
        decimals: number;
    };
}

/**
 * Decode an ApproveChecked instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeApproveCheckedInstruction(
    instruction: TransactionInstruction,
    programId = TOKEN_PROGRAM_ID,
): DecodedApproveCheckedInstruction {
    if (!instruction.programId.equals(programId)) throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== approveCheckedInstructionData.span) throw new TokenInvalidInstructionDataError();

    const {
        keys: { account, mint, delegate, owner, multiSigners },
        data,
    } = decodeApproveCheckedInstructionUnchecked(instruction);
    if (data.instruction !== TokenInstruction.ApproveChecked) throw new TokenInvalidInstructionTypeError();
    if (!account || !mint || !delegate || !owner) throw new TokenInvalidInstructionKeysError();

    // TODO: key checks?

    return {
        programId,
        keys: {
            account,
            mint,
            delegate,
            owner,
            multiSigners,
        },
        data,
    };
}

/** A decoded, non-validated ApproveChecked instruction */
export interface DecodedApproveCheckedInstructionUnchecked {
    programId: PublicKey;
    keys: {
        account: AccountMeta | undefined;
        mint: AccountMeta | undefined;
        delegate: AccountMeta | undefined;
        owner: AccountMeta | undefined;
        multiSigners: AccountMeta[];
    };
    data: {
        instruction: number;
        amount: bigint;
        decimals: number;
    };
}

/**
 * Decode an ApproveChecked instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeApproveCheckedInstructionUnchecked({
    programId,
    keys: [account, mint, delegate, owner, ...multiSigners],
    data,
}: TransactionInstruction): DecodedApproveCheckedInstructionUnchecked {
    return {
        programId,
        keys: {
            account,
            mint,
            delegate,
            owner,
            multiSigners,
        },
        data: approveCheckedInstructionData.decode(data),
    };
}
