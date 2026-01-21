import { struct, u8 } from '@solana/buffer-layout';
import type { AccountMeta, Commitment, Connection, PublicKey, Signer } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { programSupportsExtensions, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '../../constants.js';
import { TokenUnsupportedInstructionError } from '../../errors.js';
import { addSigners } from '../../instructions/internal.js';
import { TokenInstruction } from '../../instructions/types.js';
import { publicKey } from '@solana/buffer-layout-utils';
import { createTransferCheckedInstruction } from '../../instructions/transferChecked.js';
import { createTransferCheckedWithFeeInstruction } from '../transferFee/instructions.js';
import { getMint } from '../../state/mint.js';
import { getExtraAccountMetaAddress, getExtraAccountMetas, getTransferHook, resolveExtraAccountMeta } from './state.js';

export enum TransferHookInstruction {
    Initialize = 0,
    Update = 1,
}

/** Deserialized instruction for the initiation of an transfer hook */
export interface InitializeTransferHookInstructionData {
    instruction: TokenInstruction.TransferHookExtension;
    transferHookInstruction: TransferHookInstruction.Initialize;
    authority: PublicKey;
    transferHookProgramId: PublicKey;
}

/** The struct that represents the instruction data as it is read by the program */
export const initializeTransferHookInstructionData = struct<InitializeTransferHookInstructionData>([
    u8('instruction'),
    u8('transferHookInstruction'),
    publicKey('authority'),
    publicKey('transferHookProgramId'),
]);

/**
 * Construct an InitializeTransferHook instruction
 *
 * @param mint                  Token mint account
 * @param authority             Transfer hook authority account
 * @param transferHookProgramId Transfer hook program account
 * @param programId             SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createInitializeTransferHookInstruction(
    mint: PublicKey,
    authority: PublicKey,
    transferHookProgramId: PublicKey,
    programId: PublicKey,
): TransactionInstruction {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }
    const keys = [{ pubkey: mint, isSigner: false, isWritable: true }];

    const data = Buffer.alloc(initializeTransferHookInstructionData.span);
    initializeTransferHookInstructionData.encode(
        {
            instruction: TokenInstruction.TransferHookExtension,
            transferHookInstruction: TransferHookInstruction.Initialize,
            authority,
            transferHookProgramId,
        },
        data,
    );

    return new TransactionInstruction({ keys, programId, data });
}

/** Deserialized instruction for the initiation of an transfer hook */
export interface UpdateTransferHookInstructionData {
    instruction: TokenInstruction.TransferHookExtension;
    transferHookInstruction: TransferHookInstruction.Update;
    transferHookProgramId: PublicKey;
}

/** The struct that represents the instruction data as it is read by the program */
export const updateTransferHookInstructionData = struct<UpdateTransferHookInstructionData>([
    u8('instruction'),
    u8('transferHookInstruction'),
    publicKey('transferHookProgramId'),
]);

/**
 * Construct an UpdateTransferHook instruction
 *
 * @param mint                  Mint to update
 * @param authority             The mint's transfer hook authority
 * @param transferHookProgramId The new transfer hook program account
 * @param signers               The signer account(s) for a multisig
 * @param tokenProgramId        SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createUpdateTransferHookInstruction(
    mint: PublicKey,
    authority: PublicKey,
    transferHookProgramId: PublicKey,
    multiSigners: (Signer | PublicKey)[] = [],
    programId = TOKEN_2022_PROGRAM_ID,
): TransactionInstruction {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }

    const keys = addSigners([{ pubkey: mint, isSigner: false, isWritable: true }], authority, multiSigners);
    const data = Buffer.alloc(updateTransferHookInstructionData.span);
    updateTransferHookInstructionData.encode(
        {
            instruction: TokenInstruction.TransferHookExtension,
            transferHookInstruction: TransferHookInstruction.Update,
            transferHookProgramId,
        },
        data,
    );

    return new TransactionInstruction({ keys, programId, data });
}

function deEscalateAccountMeta(accountMeta: AccountMeta, accountMetas: AccountMeta[]): AccountMeta {
    const maybeHighestPrivileges = accountMetas
        .filter(x => x.pubkey.equals(accountMeta.pubkey))
        .reduce<{ isSigner: boolean; isWritable: boolean } | undefined>((acc, x) => {
            if (!acc) return { isSigner: x.isSigner, isWritable: x.isWritable };
            return { isSigner: acc.isSigner || x.isSigner, isWritable: acc.isWritable || x.isWritable };
        }, undefined);
    if (maybeHighestPrivileges) {
        const { isSigner, isWritable } = maybeHighestPrivileges;
        if (!isSigner && isSigner !== accountMeta.isSigner) {
            accountMeta.isSigner = false;
        }
        if (!isWritable && isWritable !== accountMeta.isWritable) {
            accountMeta.isWritable = false;
        }
    }
    return accountMeta;
}

/**
 * Construct an `ExecuteInstruction` for a transfer hook program, without the
 * additional accounts
 *
 * @param programId             The program ID of the transfer hook program
 * @param source                The source account
 * @param mint                  The mint account
 * @param destination           The destination account
 * @param owner                 Owner of the source account
 * @param validateStatePubkey   The validate state pubkey
 * @param amount                The amount of tokens to transfer
 * @returns Instruction to add to a transaction
 */
export function createExecuteInstruction(
    programId: PublicKey,
    source: PublicKey,
    mint: PublicKey,
    destination: PublicKey,
    owner: PublicKey,
    validateStatePubkey: PublicKey,
    amount: bigint,
): TransactionInstruction {
    const keys = [source, mint, destination, owner, validateStatePubkey].map(pubkey => ({
        pubkey,
        isSigner: false,
        isWritable: false,
    }));

    const data = Buffer.alloc(16);
    data.set(Buffer.from([105, 37, 101, 197, 75, 251, 102, 26]), 0); // `ExecuteInstruction` discriminator
    data.writeBigUInt64LE(BigInt(amount), 8);

    return new TransactionInstruction({ keys, programId, data });
}

/**
 * Adds all the extra accounts needed for a transfer hook to an instruction.
 *
 * Note this will modify the instruction passed in.
 *
 * @param connection            Connection to use
 * @param instruction           The instruction to add accounts to
 * @param programId             Transfer hook program ID
 * @param source                The source account
 * @param mint                  The mint account
 * @param destination           The destination account
 * @param owner                 Owner of the source account
 * @param amount                The amount of tokens to transfer
 * @param commitment            Commitment to use
 */
export async function addExtraAccountMetasForExecute(
    connection: Connection,
    instruction: TransactionInstruction,
    programId: PublicKey,
    source: PublicKey,
    mint: PublicKey,
    destination: PublicKey,
    owner: PublicKey,
    amount: number | bigint,
    commitment?: Commitment,
) {
    const validateStatePubkey = getExtraAccountMetaAddress(mint, programId);
    const validateStateAccount = await connection.getAccountInfo(validateStatePubkey, commitment);
    if (validateStateAccount == null) {
        return instruction;
    }
    const validateStateData = getExtraAccountMetas(validateStateAccount);

    // Check to make sure the provided keys are in the instruction
    if (![source, mint, destination, owner].every(key => instruction.keys.some(meta => meta.pubkey.equals(key)))) {
        throw new Error('Missing required account in instruction');
    }

    const executeInstruction = createExecuteInstruction(
        programId,
        source,
        mint,
        destination,
        owner,
        validateStatePubkey,
        BigInt(amount),
    );

    for (const extraAccountMeta of validateStateData) {
        executeInstruction.keys.push(
            deEscalateAccountMeta(
                await resolveExtraAccountMeta(
                    connection,
                    extraAccountMeta,
                    executeInstruction.keys,
                    executeInstruction.data,
                    executeInstruction.programId,
                ),
                executeInstruction.keys,
            ),
        );
    }

    // Add only the extra accounts resolved from the validation state
    instruction.keys.push(...executeInstruction.keys.slice(5));

    // Add the transfer hook program ID and the validation state account
    instruction.keys.push({ pubkey: programId, isSigner: false, isWritable: false });
    instruction.keys.push({ pubkey: validateStatePubkey, isSigner: false, isWritable: false });
}

/**
 * Construct an transferChecked instruction with extra accounts for transfer hook
 *
 * @param connection            Connection to use
 * @param source                Source account
 * @param mint                  Mint to update
 * @param destination           Destination account
 * @param owner                 Owner of the source account
 * @param amount                The amount of tokens to transfer
 * @param decimals              Number of decimals in transfer amount
 * @param multiSigners          The signer account(s) for a multisig
 * @param commitment            Commitment to use
 * @param programId             SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export async function createTransferCheckedWithTransferHookInstruction(
    connection: Connection,
    source: PublicKey,
    mint: PublicKey,
    destination: PublicKey,
    owner: PublicKey,
    amount: bigint,
    decimals: number,
    multiSigners: (Signer | PublicKey)[] = [],
    commitment?: Commitment,
    programId = TOKEN_PROGRAM_ID,
) {
    const instruction = createTransferCheckedInstruction(
        source,
        mint,
        destination,
        owner,
        amount,
        decimals,
        multiSigners,
        programId,
    );

    const mintInfo = await getMint(connection, mint, commitment, programId);
    const transferHook = getTransferHook(mintInfo);

    if (transferHook) {
        await addExtraAccountMetasForExecute(
            connection,
            instruction,
            transferHook.programId,
            source,
            mint,
            destination,
            owner,
            amount,
            commitment,
        );
    }

    return instruction;
}

/**
 * Construct an transferChecked instruction with extra accounts for transfer hook
 *
 * @param connection            Connection to use
 * @param source                Source account
 * @param mint                  Mint to update
 * @param destination           Destination account
 * @param owner                 Owner of the source account
 * @param amount                The amount of tokens to transfer
 * @param decimals              Number of decimals in transfer amount
 * @param fee                   The calculated fee for the transfer fee extension
 * @param multiSigners          The signer account(s) for a multisig
 * @param commitment            Commitment to use
 * @param programId             SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export async function createTransferCheckedWithFeeAndTransferHookInstruction(
    connection: Connection,
    source: PublicKey,
    mint: PublicKey,
    destination: PublicKey,
    owner: PublicKey,
    amount: bigint,
    decimals: number,
    fee: bigint,
    multiSigners: (Signer | PublicKey)[] = [],
    commitment?: Commitment,
    programId = TOKEN_PROGRAM_ID,
) {
    const instruction = createTransferCheckedWithFeeInstruction(
        source,
        mint,
        destination,
        owner,
        amount,
        decimals,
        fee,
        multiSigners,
        programId,
    );

    const mintInfo = await getMint(connection, mint, commitment, programId);
    const transferHook = getTransferHook(mintInfo);

    if (transferHook) {
        await addExtraAccountMetasForExecute(
            connection,
            instruction,
            transferHook.programId,
            source,
            mint,
            destination,
            owner,
            amount,
            commitment,
        );
    }

    return instruction;
}
