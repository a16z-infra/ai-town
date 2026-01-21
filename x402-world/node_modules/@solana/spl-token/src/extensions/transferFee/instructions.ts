import { struct, u16, u8 } from '@solana/buffer-layout';
import { u64 } from '@solana/buffer-layout-utils';
import type { AccountMeta, Signer, PublicKey } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { programSupportsExtensions, TOKEN_2022_PROGRAM_ID } from '../../constants.js';
import {
    TokenInvalidInstructionDataError,
    TokenInvalidInstructionKeysError,
    TokenInvalidInstructionProgramError,
    TokenInvalidInstructionTypeError,
    TokenUnsupportedInstructionError,
} from '../../errors.js';
import { addSigners } from '../../instructions/internal.js';
import { TokenInstruction } from '../../instructions/types.js';
import { COptionPublicKeyLayout } from '../../serialization.js';

export enum TransferFeeInstruction {
    InitializeTransferFeeConfig = 0,
    TransferCheckedWithFee = 1,
    WithdrawWithheldTokensFromMint = 2,
    WithdrawWithheldTokensFromAccounts = 3,
    HarvestWithheldTokensToMint = 4,
    SetTransferFee = 5,
}

// InitializeTransferFeeConfig

/** TODO: docs */
export interface InitializeTransferFeeConfigInstructionData {
    instruction: TokenInstruction.TransferFeeExtension;
    transferFeeInstruction: TransferFeeInstruction.InitializeTransferFeeConfig;
    transferFeeConfigAuthority: PublicKey | null;
    withdrawWithheldAuthority: PublicKey | null;
    transferFeeBasisPoints: number;
    maximumFee: bigint;
}

/** TODO: docs */
export const initializeTransferFeeConfigInstructionData = struct<InitializeTransferFeeConfigInstructionData>([
    u8('instruction'),
    u8('transferFeeInstruction'),
    new COptionPublicKeyLayout('transferFeeConfigAuthority'),
    new COptionPublicKeyLayout('withdrawWithheldAuthority'),
    u16('transferFeeBasisPoints'),
    u64('maximumFee'),
]);

/**
 * Construct an InitializeTransferFeeConfig instruction
 *
 * @param mint            Token mint account
 * @param transferFeeConfigAuthority  Optional authority that can update the fees
 * @param withdrawWithheldAuthority Optional authority that can withdraw fees
 * @param transferFeeBasisPoints Amount of transfer collected as fees, expressed as basis points of the transfer amount
 * @param maximumFee        Maximum fee assessed on transfers
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createInitializeTransferFeeConfigInstruction(
    mint: PublicKey,
    transferFeeConfigAuthority: PublicKey | null,
    withdrawWithheldAuthority: PublicKey | null,
    transferFeeBasisPoints: number,
    maximumFee: bigint,
    programId = TOKEN_2022_PROGRAM_ID,
): TransactionInstruction {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }
    const keys = [{ pubkey: mint, isSigner: false, isWritable: true }];

    const data = Buffer.alloc(78); // worst-case size
    initializeTransferFeeConfigInstructionData.encode(
        {
            instruction: TokenInstruction.TransferFeeExtension,
            transferFeeInstruction: TransferFeeInstruction.InitializeTransferFeeConfig,
            transferFeeConfigAuthority: transferFeeConfigAuthority,
            withdrawWithheldAuthority: withdrawWithheldAuthority,
            transferFeeBasisPoints: transferFeeBasisPoints,
            maximumFee: maximumFee,
        },
        data,
    );

    return new TransactionInstruction({
        keys,
        programId,
        data: data.subarray(0, initializeTransferFeeConfigInstructionData.getSpan(data)),
    });
}

/** A decoded, valid InitializeTransferFeeConfig instruction */
export interface DecodedInitializeTransferFeeConfigInstruction {
    programId: PublicKey;
    keys: {
        mint: AccountMeta;
    };
    data: {
        instruction: TokenInstruction.TransferFeeExtension;
        transferFeeInstruction: TransferFeeInstruction.InitializeTransferFeeConfig;
        transferFeeConfigAuthority: PublicKey | null;
        withdrawWithheldAuthority: PublicKey | null;
        transferFeeBasisPoints: number;
        maximumFee: bigint;
    };
}

/**
 * Decode an InitializeTransferFeeConfig instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeInitializeTransferFeeConfigInstruction(
    instruction: TransactionInstruction,
    programId: PublicKey,
): DecodedInitializeTransferFeeConfigInstruction {
    if (!instruction.programId.equals(programId)) throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== initializeTransferFeeConfigInstructionData.getSpan(instruction.data))
        throw new TokenInvalidInstructionDataError();

    const {
        keys: { mint },
        data,
    } = decodeInitializeTransferFeeConfigInstructionUnchecked(instruction);
    if (
        data.instruction !== TokenInstruction.TransferFeeExtension ||
        data.transferFeeInstruction !== TransferFeeInstruction.InitializeTransferFeeConfig
    )
        throw new TokenInvalidInstructionTypeError();
    if (!mint) throw new TokenInvalidInstructionKeysError();

    return {
        programId,
        keys: {
            mint,
        },
        data,
    };
}

/** A decoded, non-validated InitializeTransferFeeConfig instruction */
export interface DecodedInitializeTransferFeeConfigInstructionUnchecked {
    programId: PublicKey;
    keys: {
        mint: AccountMeta | undefined;
    };
    data: {
        instruction: TokenInstruction.TransferFeeExtension;
        transferFeeInstruction: TransferFeeInstruction.InitializeTransferFeeConfig;
        transferFeeConfigAuthority: PublicKey | null;
        withdrawWithheldAuthority: PublicKey | null;
        transferFeeBasisPoints: number;
        maximumFee: bigint;
    };
}

/**
 * Decode an InitializeTransferFeeConfig instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeInitializeTransferFeeConfigInstructionUnchecked({
    programId,
    keys: [mint],
    data,
}: TransactionInstruction): DecodedInitializeTransferFeeConfigInstructionUnchecked {
    const {
        instruction,
        transferFeeInstruction,
        transferFeeConfigAuthority,
        withdrawWithheldAuthority,
        transferFeeBasisPoints,
        maximumFee,
    } = initializeTransferFeeConfigInstructionData.decode(data);

    return {
        programId,
        keys: {
            mint,
        },
        data: {
            instruction,
            transferFeeInstruction,
            transferFeeConfigAuthority,
            withdrawWithheldAuthority,
            transferFeeBasisPoints,
            maximumFee,
        },
    };
}

// TransferCheckedWithFee
export interface TransferCheckedWithFeeInstructionData {
    instruction: TokenInstruction.TransferFeeExtension;
    transferFeeInstruction: TransferFeeInstruction.TransferCheckedWithFee;
    amount: bigint;
    decimals: number;
    fee: bigint;
}

export const transferCheckedWithFeeInstructionData = struct<TransferCheckedWithFeeInstructionData>([
    u8('instruction'),
    u8('transferFeeInstruction'),
    u64('amount'),
    u8('decimals'),
    u64('fee'),
]);

/**
 * Construct an TransferCheckedWithFee instruction
 *
 * @param source          The source account
 * @param mint            The token mint
 * @param destination     The destination account
 * @param authority       The source account's owner/delegate
 * @param signers         The signer account(s)
 * @param amount          The amount of tokens to transfer
 * @param decimals        The expected number of base 10 digits to the right of the decimal place
 * @param fee             The expected fee assesed on this transfer, calculated off-chain based on the transferFeeBasisPoints and maximumFee of the mint.
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createTransferCheckedWithFeeInstruction(
    source: PublicKey,
    mint: PublicKey,
    destination: PublicKey,
    authority: PublicKey,
    amount: bigint,
    decimals: number,
    fee: bigint,
    multiSigners: (Signer | PublicKey)[] = [],
    programId = TOKEN_2022_PROGRAM_ID,
): TransactionInstruction {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }
    const data = Buffer.alloc(transferCheckedWithFeeInstructionData.span);
    transferCheckedWithFeeInstructionData.encode(
        {
            instruction: TokenInstruction.TransferFeeExtension,
            transferFeeInstruction: TransferFeeInstruction.TransferCheckedWithFee,
            amount,
            decimals,
            fee,
        },
        data,
    );
    const keys = addSigners(
        [
            { pubkey: source, isSigner: false, isWritable: true },
            { pubkey: mint, isSigner: false, isWritable: false },
            { pubkey: destination, isSigner: false, isWritable: true },
        ],
        authority,
        multiSigners,
    );
    return new TransactionInstruction({ keys, programId, data });
}

/** A decoded, valid TransferCheckedWithFee instruction */
export interface DecodedTransferCheckedWithFeeInstruction {
    programId: PublicKey;
    keys: {
        source: AccountMeta;
        mint: AccountMeta;
        destination: AccountMeta;
        authority: AccountMeta;
        signers: AccountMeta[] | null;
    };
    data: {
        instruction: TokenInstruction.TransferFeeExtension;
        transferFeeInstruction: TransferFeeInstruction.TransferCheckedWithFee;
        amount: bigint;
        decimals: number;
        fee: bigint;
    };
}

/**
 * Decode a TransferCheckedWithFee instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeTransferCheckedWithFeeInstruction(
    instruction: TransactionInstruction,
    programId: PublicKey,
): DecodedTransferCheckedWithFeeInstruction {
    if (!instruction.programId.equals(programId)) throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== transferCheckedWithFeeInstructionData.span)
        throw new TokenInvalidInstructionDataError();

    const {
        keys: { source, mint, destination, authority, signers },
        data,
    } = decodeTransferCheckedWithFeeInstructionUnchecked(instruction);
    if (
        data.instruction !== TokenInstruction.TransferFeeExtension ||
        data.transferFeeInstruction !== TransferFeeInstruction.TransferCheckedWithFee
    )
        throw new TokenInvalidInstructionTypeError();
    if (!mint) throw new TokenInvalidInstructionKeysError();

    return {
        programId,
        keys: {
            source,
            mint,
            destination,
            authority,
            signers: signers ? signers : null,
        },
        data,
    };
}

/** A decoded, non-validated TransferCheckedWithFees instruction */
export interface DecodedTransferCheckedWithFeeInstructionUnchecked {
    programId: PublicKey;
    keys: {
        source: AccountMeta;
        mint: AccountMeta;
        destination: AccountMeta;
        authority: AccountMeta;
        signers: AccountMeta[] | undefined;
    };
    data: {
        instruction: TokenInstruction.TransferFeeExtension;
        transferFeeInstruction: TransferFeeInstruction.TransferCheckedWithFee;
        amount: bigint;
        decimals: number;
        fee: bigint;
    };
}

/**
 * Decode a TransferCheckedWithFees instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeTransferCheckedWithFeeInstructionUnchecked({
    programId,
    keys: [source, mint, destination, authority, ...signers],
    data,
}: TransactionInstruction): DecodedTransferCheckedWithFeeInstructionUnchecked {
    const { instruction, transferFeeInstruction, amount, decimals, fee } =
        transferCheckedWithFeeInstructionData.decode(data);

    return {
        programId,
        keys: {
            source,
            mint,
            destination,
            authority,
            signers,
        },
        data: {
            instruction,
            transferFeeInstruction,
            amount,
            decimals,
            fee,
        },
    };
}

// WithdrawWithheldTokensFromMint
export interface WithdrawWithheldTokensFromMintInstructionData {
    instruction: TokenInstruction.TransferFeeExtension;
    transferFeeInstruction: TransferFeeInstruction.WithdrawWithheldTokensFromMint;
}

export const withdrawWithheldTokensFromMintInstructionData = struct<WithdrawWithheldTokensFromMintInstructionData>([
    u8('instruction'),
    u8('transferFeeInstruction'),
]);

/**
 * Construct a WithdrawWithheldTokensFromMint instruction
 *
 * @param mint              The token mint
 * @param destination       The destination account
 * @param authority         The source account's owner/delegate
 * @param signers           The signer account(s)
 * @param programID         SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createWithdrawWithheldTokensFromMintInstruction(
    mint: PublicKey,
    destination: PublicKey,
    authority: PublicKey,
    signers: (Signer | PublicKey)[] = [],
    programId = TOKEN_2022_PROGRAM_ID,
): TransactionInstruction {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }
    const data = Buffer.alloc(withdrawWithheldTokensFromMintInstructionData.span);
    withdrawWithheldTokensFromMintInstructionData.encode(
        {
            instruction: TokenInstruction.TransferFeeExtension,
            transferFeeInstruction: TransferFeeInstruction.WithdrawWithheldTokensFromMint,
        },
        data,
    );
    const keys = addSigners(
        [
            { pubkey: mint, isSigner: false, isWritable: true },
            { pubkey: destination, isSigner: false, isWritable: true },
        ],
        authority,
        signers,
    );
    return new TransactionInstruction({ keys, programId, data });
}

/** A decoded, valid WithdrawWithheldTokensFromMint instruction */
export interface DecodedWithdrawWithheldTokensFromMintInstruction {
    programId: PublicKey;
    keys: {
        mint: AccountMeta;
        destination: AccountMeta;
        authority: AccountMeta;
        signers: AccountMeta[] | null;
    };
    data: {
        instruction: TokenInstruction.TransferFeeExtension;
        transferFeeInstruction: TransferFeeInstruction.WithdrawWithheldTokensFromMint;
    };
}

/**
 * Decode a WithdrawWithheldTokensFromMint instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeWithdrawWithheldTokensFromMintInstruction(
    instruction: TransactionInstruction,
    programId: PublicKey,
): DecodedWithdrawWithheldTokensFromMintInstruction {
    if (!instruction.programId.equals(programId)) throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== withdrawWithheldTokensFromMintInstructionData.span)
        throw new TokenInvalidInstructionDataError();

    const {
        keys: { mint, destination, authority, signers },
        data,
    } = decodeWithdrawWithheldTokensFromMintInstructionUnchecked(instruction);
    if (
        data.instruction !== TokenInstruction.TransferFeeExtension ||
        data.transferFeeInstruction !== TransferFeeInstruction.WithdrawWithheldTokensFromMint
    )
        throw new TokenInvalidInstructionTypeError();
    if (!mint) throw new TokenInvalidInstructionKeysError();

    return {
        programId,
        keys: {
            mint,
            destination,
            authority,
            signers: signers ? signers : null,
        },
        data,
    };
}

/** A decoded, valid WithdrawWithheldTokensFromMint instruction */
export interface DecodedWithdrawWithheldTokensFromMintInstructionUnchecked {
    programId: PublicKey;
    keys: {
        mint: AccountMeta;
        destination: AccountMeta;
        authority: AccountMeta;
        signers: AccountMeta[] | null;
    };
    data: {
        instruction: TokenInstruction.TransferFeeExtension;
        transferFeeInstruction: TransferFeeInstruction.WithdrawWithheldTokensFromMint;
    };
}

/**
 * Decode a WithdrawWithheldTokensFromMint instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeWithdrawWithheldTokensFromMintInstructionUnchecked({
    programId,
    keys: [mint, destination, authority, ...signers],
    data,
}: TransactionInstruction): DecodedWithdrawWithheldTokensFromMintInstructionUnchecked {
    const { instruction, transferFeeInstruction } = withdrawWithheldTokensFromMintInstructionData.decode(data);

    return {
        programId,
        keys: {
            mint,
            destination,
            authority,
            signers,
        },
        data: {
            instruction,
            transferFeeInstruction,
        },
    };
}

// WithdrawWithheldTokensFromAccounts
export interface WithdrawWithheldTokensFromAccountsInstructionData {
    instruction: TokenInstruction.TransferFeeExtension;
    transferFeeInstruction: TransferFeeInstruction.WithdrawWithheldTokensFromAccounts;
    numTokenAccounts: number;
}

export const withdrawWithheldTokensFromAccountsInstructionData =
    struct<WithdrawWithheldTokensFromAccountsInstructionData>([
        u8('instruction'),
        u8('transferFeeInstruction'),
        u8('numTokenAccounts'),
    ]);

/**
 * Construct a WithdrawWithheldTokensFromAccounts instruction
 *
 * @param mint              The token mint
 * @param destination       The destination account
 * @param authority         The source account's owner/delegate
 * @param signers           The signer account(s)
 * @param sources           The source accounts to withdraw from
 * @param programID         SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createWithdrawWithheldTokensFromAccountsInstruction(
    mint: PublicKey,
    destination: PublicKey,
    authority: PublicKey,
    signers: (Signer | PublicKey)[],
    sources: PublicKey[],
    programId = TOKEN_2022_PROGRAM_ID,
): TransactionInstruction {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }
    const data = Buffer.alloc(withdrawWithheldTokensFromAccountsInstructionData.span);
    withdrawWithheldTokensFromAccountsInstructionData.encode(
        {
            instruction: TokenInstruction.TransferFeeExtension,
            transferFeeInstruction: TransferFeeInstruction.WithdrawWithheldTokensFromAccounts,
            numTokenAccounts: sources.length,
        },
        data,
    );
    const keys = addSigners(
        [
            { pubkey: mint, isSigner: false, isWritable: true },
            { pubkey: destination, isSigner: false, isWritable: true },
        ],
        authority,
        signers,
    );
    for (const source of sources) {
        keys.push({ pubkey: source, isSigner: false, isWritable: true });
    }
    return new TransactionInstruction({ keys, programId, data });
}

/** A decoded, valid WithdrawWithheldTokensFromAccounts instruction */
export interface DecodedWithdrawWithheldTokensFromAccountsInstruction {
    programId: PublicKey;
    keys: {
        mint: AccountMeta;
        destination: AccountMeta;
        authority: AccountMeta;
        signers: AccountMeta[] | null;
        sources: AccountMeta[] | null;
    };
    data: {
        instruction: TokenInstruction.TransferFeeExtension;
        transferFeeInstruction: TransferFeeInstruction.WithdrawWithheldTokensFromAccounts;
        numTokenAccounts: number;
    };
}

/**
 * Decode a WithdrawWithheldTokensFromAccounts instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeWithdrawWithheldTokensFromAccountsInstruction(
    instruction: TransactionInstruction,
    programId: PublicKey,
): DecodedWithdrawWithheldTokensFromAccountsInstruction {
    if (!instruction.programId.equals(programId)) throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== withdrawWithheldTokensFromAccountsInstructionData.span)
        throw new TokenInvalidInstructionDataError();

    const {
        keys: { mint, destination, authority, signers, sources },
        data,
    } = decodeWithdrawWithheldTokensFromAccountsInstructionUnchecked(instruction);
    if (
        data.instruction !== TokenInstruction.TransferFeeExtension ||
        data.transferFeeInstruction !== TransferFeeInstruction.WithdrawWithheldTokensFromAccounts
    )
        throw new TokenInvalidInstructionTypeError();
    if (!mint) throw new TokenInvalidInstructionKeysError();

    return {
        programId,
        keys: {
            mint,
            destination,
            authority,
            signers: signers ? signers : null,
            sources: sources ? sources : null,
        },
        data,
    };
}

/** A decoded, valid WithdrawWithheldTokensFromAccounts instruction */
export interface DecodedWithdrawWithheldTokensFromAccountsInstructionUnchecked {
    programId: PublicKey;
    keys: {
        mint: AccountMeta;
        destination: AccountMeta;
        authority: AccountMeta;
        signers: AccountMeta[] | null;
        sources: AccountMeta[] | null;
    };
    data: {
        instruction: TokenInstruction.TransferFeeExtension;
        transferFeeInstruction: TransferFeeInstruction.WithdrawWithheldTokensFromAccounts;
        numTokenAccounts: number;
    };
}

/**
 * Decode a WithdrawWithheldTokensFromAccount instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeWithdrawWithheldTokensFromAccountsInstructionUnchecked({
    programId,
    keys,
    data,
}: TransactionInstruction): DecodedWithdrawWithheldTokensFromAccountsInstructionUnchecked {
    const { instruction, transferFeeInstruction, numTokenAccounts } =
        withdrawWithheldTokensFromAccountsInstructionData.decode(data);
    const [mint, destination, authority, signers, sources] = [
        keys[0],
        keys[1],
        keys[2],
        keys.slice(3, 3 + numTokenAccounts),
        keys.slice(-1 * numTokenAccounts),
    ];
    return {
        programId,
        keys: {
            mint,
            destination,
            authority,
            signers,
            sources,
        },
        data: {
            instruction,
            transferFeeInstruction,
            numTokenAccounts,
        },
    };
}

// HarvestWithheldTokensToMint

export interface HarvestWithheldTokensToMintInstructionData {
    instruction: TokenInstruction.TransferFeeExtension;
    transferFeeInstruction: TransferFeeInstruction.HarvestWithheldTokensToMint;
}

export const harvestWithheldTokensToMintInstructionData = struct<HarvestWithheldTokensToMintInstructionData>([
    u8('instruction'),
    u8('transferFeeInstruction'),
]);

/**
 * Construct a HarvestWithheldTokensToMint instruction
 *
 * @param mint              The token mint
 * @param sources           The source accounts to withdraw from
 * @param programID         SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createHarvestWithheldTokensToMintInstruction(
    mint: PublicKey,
    sources: PublicKey[],
    programId = TOKEN_2022_PROGRAM_ID,
): TransactionInstruction {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }
    const data = Buffer.alloc(harvestWithheldTokensToMintInstructionData.span);
    harvestWithheldTokensToMintInstructionData.encode(
        {
            instruction: TokenInstruction.TransferFeeExtension,
            transferFeeInstruction: TransferFeeInstruction.HarvestWithheldTokensToMint,
        },
        data,
    );
    const keys: AccountMeta[] = [];
    keys.push({ pubkey: mint, isSigner: false, isWritable: true });
    for (const source of sources) {
        keys.push({ pubkey: source, isSigner: false, isWritable: true });
    }
    return new TransactionInstruction({ keys, programId, data });
}

/** A decoded, valid HarvestWithheldTokensToMint instruction */
export interface DecodedHarvestWithheldTokensToMintInstruction {
    programId: PublicKey;
    keys: {
        mint: AccountMeta;
        sources: AccountMeta[] | null;
    };
    data: {
        instruction: TokenInstruction.TransferFeeExtension;
        transferFeeInstruction: TransferFeeInstruction.HarvestWithheldTokensToMint;
    };
}

/**
 * Decode a HarvestWithheldTokensToMint instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeHarvestWithheldTokensToMintInstruction(
    instruction: TransactionInstruction,
    programId: PublicKey,
): DecodedHarvestWithheldTokensToMintInstruction {
    if (!instruction.programId.equals(programId)) throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== harvestWithheldTokensToMintInstructionData.span)
        throw new TokenInvalidInstructionDataError();

    const {
        keys: { mint, sources },
        data,
    } = decodeHarvestWithheldTokensToMintInstructionUnchecked(instruction);
    if (
        data.instruction !== TokenInstruction.TransferFeeExtension ||
        data.transferFeeInstruction !== TransferFeeInstruction.HarvestWithheldTokensToMint
    )
        throw new TokenInvalidInstructionTypeError();
    if (!mint) throw new TokenInvalidInstructionKeysError();

    return {
        programId,
        keys: {
            mint,
            sources,
        },
        data,
    };
}

/** A decoded, valid HarvestWithheldTokensToMint instruction */
export interface DecodedHarvestWithheldTokensToMintInstructionUnchecked {
    programId: PublicKey;
    keys: {
        mint: AccountMeta;
        sources: AccountMeta[] | null;
    };
    data: {
        instruction: TokenInstruction.TransferFeeExtension;
        transferFeeInstruction: TransferFeeInstruction.HarvestWithheldTokensToMint;
    };
}

/**
 * Decode a HarvestWithheldTokensToMint instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeHarvestWithheldTokensToMintInstructionUnchecked({
    programId,
    keys: [mint, ...sources],
    data,
}: TransactionInstruction): DecodedHarvestWithheldTokensToMintInstructionUnchecked {
    const { instruction, transferFeeInstruction } = harvestWithheldTokensToMintInstructionData.decode(data);
    return {
        programId,
        keys: {
            mint,
            sources,
        },
        data: {
            instruction,
            transferFeeInstruction,
        },
    };
}

// SetTransferFee

export interface SetTransferFeeInstructionData {
    instruction: TokenInstruction.TransferFeeExtension;
    transferFeeInstruction: TransferFeeInstruction.SetTransferFee;
    transferFeeBasisPoints: number;
    maximumFee: bigint;
}

export const setTransferFeeInstructionData = struct<SetTransferFeeInstructionData>([
    u8('instruction'),
    u8('transferFeeInstruction'),
    u16('transferFeeBasisPoints'),
    u64('maximumFee'),
]);

/**
 * Construct a SetTransferFeeInstruction instruction
 *
 * @param mint                      The token mint
 * @param authority                 The authority of the transfer fee
 * @param signers                   The signer account(s)
 * @param transferFeeBasisPoints    Amount of transfer collected as fees, expressed as basis points of the transfer amount
 * @param maximumFee                Maximum fee assessed on transfers
 * @param programID                 SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createSetTransferFeeInstruction(
    mint: PublicKey,
    authority: PublicKey,
    signers: (Signer | PublicKey)[],
    transferFeeBasisPoints: number,
    maximumFee: bigint,
    programId = TOKEN_2022_PROGRAM_ID,
): TransactionInstruction {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }

    const data = Buffer.alloc(setTransferFeeInstructionData.span);
    setTransferFeeInstructionData.encode(
        {
            instruction: TokenInstruction.TransferFeeExtension,
            transferFeeInstruction: TransferFeeInstruction.SetTransferFee,
            transferFeeBasisPoints: transferFeeBasisPoints,
            maximumFee: maximumFee,
        },
        data,
    );
    const keys = addSigners([{ pubkey: mint, isSigner: false, isWritable: true }], authority, signers);

    return new TransactionInstruction({ keys, programId, data });
}

/** A decoded, valid SetTransferFee instruction */
export interface DecodedSetTransferFeeInstruction {
    programId: PublicKey;
    keys: {
        mint: AccountMeta;
        authority: AccountMeta;
        signers: AccountMeta[] | null;
    };
    data: {
        instruction: TokenInstruction.TransferFeeExtension;
        transferFeeInstruction: TransferFeeInstruction.SetTransferFee;
        transferFeeBasisPoints: number;
        maximumFee: bigint;
    };
}

/**
 * Decode an SetTransferFee instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeSetTransferFeeInstruction(
    instruction: TransactionInstruction,
    programId: PublicKey,
): DecodedSetTransferFeeInstruction {
    if (!instruction.programId.equals(programId)) throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== setTransferFeeInstructionData.span) throw new TokenInvalidInstructionDataError();

    const {
        keys: { mint, authority, signers },
        data,
    } = decodeSetTransferFeeInstructionUnchecked(instruction);
    if (
        data.instruction !== TokenInstruction.TransferFeeExtension ||
        data.transferFeeInstruction !== TransferFeeInstruction.SetTransferFee
    )
        throw new TokenInvalidInstructionTypeError();
    if (!mint) throw new TokenInvalidInstructionKeysError();

    return {
        programId,
        keys: {
            mint,
            authority,
            signers: signers ? signers : null,
        },
        data,
    };
}

/** A decoded, valid SetTransferFee instruction */
export interface DecodedSetTransferFeeInstructionUnchecked {
    programId: PublicKey;
    keys: {
        mint: AccountMeta;
        authority: AccountMeta;
        signers: AccountMeta[] | undefined;
    };
    data: {
        instruction: TokenInstruction.TransferFeeExtension;
        transferFeeInstruction: TransferFeeInstruction.SetTransferFee;
        transferFeeBasisPoints: number;
        maximumFee: bigint;
    };
}

/**
 * Decode a SetTransferFee instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeSetTransferFeeInstructionUnchecked({
    programId,
    keys: [mint, authority, ...signers],
    data,
}: TransactionInstruction): DecodedSetTransferFeeInstructionUnchecked {
    const { instruction, transferFeeInstruction, transferFeeBasisPoints, maximumFee } =
        setTransferFeeInstructionData.decode(data);

    return {
        programId,
        keys: {
            mint,
            authority,
            signers,
        },
        data: {
            instruction,
            transferFeeInstruction,
            transferFeeBasisPoints,
            maximumFee,
        },
    };
}
