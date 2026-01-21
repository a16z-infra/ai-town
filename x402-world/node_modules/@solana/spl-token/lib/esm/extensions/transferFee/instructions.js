import { struct, u16, u8 } from '@solana/buffer-layout';
import { u64 } from '@solana/buffer-layout-utils';
import { TransactionInstruction } from '@solana/web3.js';
import { programSupportsExtensions, TOKEN_2022_PROGRAM_ID } from '../../constants.js';
import { TokenInvalidInstructionDataError, TokenInvalidInstructionKeysError, TokenInvalidInstructionProgramError, TokenInvalidInstructionTypeError, TokenUnsupportedInstructionError, } from '../../errors.js';
import { addSigners } from '../../instructions/internal.js';
import { TokenInstruction } from '../../instructions/types.js';
import { COptionPublicKeyLayout } from '../../serialization.js';
export var TransferFeeInstruction;
(function (TransferFeeInstruction) {
    TransferFeeInstruction[TransferFeeInstruction["InitializeTransferFeeConfig"] = 0] = "InitializeTransferFeeConfig";
    TransferFeeInstruction[TransferFeeInstruction["TransferCheckedWithFee"] = 1] = "TransferCheckedWithFee";
    TransferFeeInstruction[TransferFeeInstruction["WithdrawWithheldTokensFromMint"] = 2] = "WithdrawWithheldTokensFromMint";
    TransferFeeInstruction[TransferFeeInstruction["WithdrawWithheldTokensFromAccounts"] = 3] = "WithdrawWithheldTokensFromAccounts";
    TransferFeeInstruction[TransferFeeInstruction["HarvestWithheldTokensToMint"] = 4] = "HarvestWithheldTokensToMint";
    TransferFeeInstruction[TransferFeeInstruction["SetTransferFee"] = 5] = "SetTransferFee";
})(TransferFeeInstruction || (TransferFeeInstruction = {}));
/** TODO: docs */
export const initializeTransferFeeConfigInstructionData = struct([
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
export function createInitializeTransferFeeConfigInstruction(mint, transferFeeConfigAuthority, withdrawWithheldAuthority, transferFeeBasisPoints, maximumFee, programId = TOKEN_2022_PROGRAM_ID) {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }
    const keys = [{ pubkey: mint, isSigner: false, isWritable: true }];
    const data = Buffer.alloc(78); // worst-case size
    initializeTransferFeeConfigInstructionData.encode({
        instruction: TokenInstruction.TransferFeeExtension,
        transferFeeInstruction: TransferFeeInstruction.InitializeTransferFeeConfig,
        transferFeeConfigAuthority: transferFeeConfigAuthority,
        withdrawWithheldAuthority: withdrawWithheldAuthority,
        transferFeeBasisPoints: transferFeeBasisPoints,
        maximumFee: maximumFee,
    }, data);
    return new TransactionInstruction({
        keys,
        programId,
        data: data.subarray(0, initializeTransferFeeConfigInstructionData.getSpan(data)),
    });
}
/**
 * Decode an InitializeTransferFeeConfig instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeInitializeTransferFeeConfigInstruction(instruction, programId) {
    if (!instruction.programId.equals(programId))
        throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== initializeTransferFeeConfigInstructionData.getSpan(instruction.data))
        throw new TokenInvalidInstructionDataError();
    const { keys: { mint }, data, } = decodeInitializeTransferFeeConfigInstructionUnchecked(instruction);
    if (data.instruction !== TokenInstruction.TransferFeeExtension ||
        data.transferFeeInstruction !== TransferFeeInstruction.InitializeTransferFeeConfig)
        throw new TokenInvalidInstructionTypeError();
    if (!mint)
        throw new TokenInvalidInstructionKeysError();
    return {
        programId,
        keys: {
            mint,
        },
        data,
    };
}
/**
 * Decode an InitializeTransferFeeConfig instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeInitializeTransferFeeConfigInstructionUnchecked({ programId, keys: [mint], data, }) {
    const { instruction, transferFeeInstruction, transferFeeConfigAuthority, withdrawWithheldAuthority, transferFeeBasisPoints, maximumFee, } = initializeTransferFeeConfigInstructionData.decode(data);
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
export const transferCheckedWithFeeInstructionData = struct([
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
export function createTransferCheckedWithFeeInstruction(source, mint, destination, authority, amount, decimals, fee, multiSigners = [], programId = TOKEN_2022_PROGRAM_ID) {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }
    const data = Buffer.alloc(transferCheckedWithFeeInstructionData.span);
    transferCheckedWithFeeInstructionData.encode({
        instruction: TokenInstruction.TransferFeeExtension,
        transferFeeInstruction: TransferFeeInstruction.TransferCheckedWithFee,
        amount,
        decimals,
        fee,
    }, data);
    const keys = addSigners([
        { pubkey: source, isSigner: false, isWritable: true },
        { pubkey: mint, isSigner: false, isWritable: false },
        { pubkey: destination, isSigner: false, isWritable: true },
    ], authority, multiSigners);
    return new TransactionInstruction({ keys, programId, data });
}
/**
 * Decode a TransferCheckedWithFee instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeTransferCheckedWithFeeInstruction(instruction, programId) {
    if (!instruction.programId.equals(programId))
        throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== transferCheckedWithFeeInstructionData.span)
        throw new TokenInvalidInstructionDataError();
    const { keys: { source, mint, destination, authority, signers }, data, } = decodeTransferCheckedWithFeeInstructionUnchecked(instruction);
    if (data.instruction !== TokenInstruction.TransferFeeExtension ||
        data.transferFeeInstruction !== TransferFeeInstruction.TransferCheckedWithFee)
        throw new TokenInvalidInstructionTypeError();
    if (!mint)
        throw new TokenInvalidInstructionKeysError();
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
/**
 * Decode a TransferCheckedWithFees instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeTransferCheckedWithFeeInstructionUnchecked({ programId, keys: [source, mint, destination, authority, ...signers], data, }) {
    const { instruction, transferFeeInstruction, amount, decimals, fee } = transferCheckedWithFeeInstructionData.decode(data);
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
export const withdrawWithheldTokensFromMintInstructionData = struct([
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
export function createWithdrawWithheldTokensFromMintInstruction(mint, destination, authority, signers = [], programId = TOKEN_2022_PROGRAM_ID) {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }
    const data = Buffer.alloc(withdrawWithheldTokensFromMintInstructionData.span);
    withdrawWithheldTokensFromMintInstructionData.encode({
        instruction: TokenInstruction.TransferFeeExtension,
        transferFeeInstruction: TransferFeeInstruction.WithdrawWithheldTokensFromMint,
    }, data);
    const keys = addSigners([
        { pubkey: mint, isSigner: false, isWritable: true },
        { pubkey: destination, isSigner: false, isWritable: true },
    ], authority, signers);
    return new TransactionInstruction({ keys, programId, data });
}
/**
 * Decode a WithdrawWithheldTokensFromMint instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeWithdrawWithheldTokensFromMintInstruction(instruction, programId) {
    if (!instruction.programId.equals(programId))
        throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== withdrawWithheldTokensFromMintInstructionData.span)
        throw new TokenInvalidInstructionDataError();
    const { keys: { mint, destination, authority, signers }, data, } = decodeWithdrawWithheldTokensFromMintInstructionUnchecked(instruction);
    if (data.instruction !== TokenInstruction.TransferFeeExtension ||
        data.transferFeeInstruction !== TransferFeeInstruction.WithdrawWithheldTokensFromMint)
        throw new TokenInvalidInstructionTypeError();
    if (!mint)
        throw new TokenInvalidInstructionKeysError();
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
/**
 * Decode a WithdrawWithheldTokensFromMint instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeWithdrawWithheldTokensFromMintInstructionUnchecked({ programId, keys: [mint, destination, authority, ...signers], data, }) {
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
export const withdrawWithheldTokensFromAccountsInstructionData = struct([
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
export function createWithdrawWithheldTokensFromAccountsInstruction(mint, destination, authority, signers, sources, programId = TOKEN_2022_PROGRAM_ID) {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }
    const data = Buffer.alloc(withdrawWithheldTokensFromAccountsInstructionData.span);
    withdrawWithheldTokensFromAccountsInstructionData.encode({
        instruction: TokenInstruction.TransferFeeExtension,
        transferFeeInstruction: TransferFeeInstruction.WithdrawWithheldTokensFromAccounts,
        numTokenAccounts: sources.length,
    }, data);
    const keys = addSigners([
        { pubkey: mint, isSigner: false, isWritable: true },
        { pubkey: destination, isSigner: false, isWritable: true },
    ], authority, signers);
    for (const source of sources) {
        keys.push({ pubkey: source, isSigner: false, isWritable: true });
    }
    return new TransactionInstruction({ keys, programId, data });
}
/**
 * Decode a WithdrawWithheldTokensFromAccounts instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeWithdrawWithheldTokensFromAccountsInstruction(instruction, programId) {
    if (!instruction.programId.equals(programId))
        throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== withdrawWithheldTokensFromAccountsInstructionData.span)
        throw new TokenInvalidInstructionDataError();
    const { keys: { mint, destination, authority, signers, sources }, data, } = decodeWithdrawWithheldTokensFromAccountsInstructionUnchecked(instruction);
    if (data.instruction !== TokenInstruction.TransferFeeExtension ||
        data.transferFeeInstruction !== TransferFeeInstruction.WithdrawWithheldTokensFromAccounts)
        throw new TokenInvalidInstructionTypeError();
    if (!mint)
        throw new TokenInvalidInstructionKeysError();
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
/**
 * Decode a WithdrawWithheldTokensFromAccount instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeWithdrawWithheldTokensFromAccountsInstructionUnchecked({ programId, keys, data, }) {
    const { instruction, transferFeeInstruction, numTokenAccounts } = withdrawWithheldTokensFromAccountsInstructionData.decode(data);
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
export const harvestWithheldTokensToMintInstructionData = struct([
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
export function createHarvestWithheldTokensToMintInstruction(mint, sources, programId = TOKEN_2022_PROGRAM_ID) {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }
    const data = Buffer.alloc(harvestWithheldTokensToMintInstructionData.span);
    harvestWithheldTokensToMintInstructionData.encode({
        instruction: TokenInstruction.TransferFeeExtension,
        transferFeeInstruction: TransferFeeInstruction.HarvestWithheldTokensToMint,
    }, data);
    const keys = [];
    keys.push({ pubkey: mint, isSigner: false, isWritable: true });
    for (const source of sources) {
        keys.push({ pubkey: source, isSigner: false, isWritable: true });
    }
    return new TransactionInstruction({ keys, programId, data });
}
/**
 * Decode a HarvestWithheldTokensToMint instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeHarvestWithheldTokensToMintInstruction(instruction, programId) {
    if (!instruction.programId.equals(programId))
        throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== harvestWithheldTokensToMintInstructionData.span)
        throw new TokenInvalidInstructionDataError();
    const { keys: { mint, sources }, data, } = decodeHarvestWithheldTokensToMintInstructionUnchecked(instruction);
    if (data.instruction !== TokenInstruction.TransferFeeExtension ||
        data.transferFeeInstruction !== TransferFeeInstruction.HarvestWithheldTokensToMint)
        throw new TokenInvalidInstructionTypeError();
    if (!mint)
        throw new TokenInvalidInstructionKeysError();
    return {
        programId,
        keys: {
            mint,
            sources,
        },
        data,
    };
}
/**
 * Decode a HarvestWithheldTokensToMint instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeHarvestWithheldTokensToMintInstructionUnchecked({ programId, keys: [mint, ...sources], data, }) {
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
export const setTransferFeeInstructionData = struct([
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
export function createSetTransferFeeInstruction(mint, authority, signers, transferFeeBasisPoints, maximumFee, programId = TOKEN_2022_PROGRAM_ID) {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }
    const data = Buffer.alloc(setTransferFeeInstructionData.span);
    setTransferFeeInstructionData.encode({
        instruction: TokenInstruction.TransferFeeExtension,
        transferFeeInstruction: TransferFeeInstruction.SetTransferFee,
        transferFeeBasisPoints: transferFeeBasisPoints,
        maximumFee: maximumFee,
    }, data);
    const keys = addSigners([{ pubkey: mint, isSigner: false, isWritable: true }], authority, signers);
    return new TransactionInstruction({ keys, programId, data });
}
/**
 * Decode an SetTransferFee instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeSetTransferFeeInstruction(instruction, programId) {
    if (!instruction.programId.equals(programId))
        throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== setTransferFeeInstructionData.span)
        throw new TokenInvalidInstructionDataError();
    const { keys: { mint, authority, signers }, data, } = decodeSetTransferFeeInstructionUnchecked(instruction);
    if (data.instruction !== TokenInstruction.TransferFeeExtension ||
        data.transferFeeInstruction !== TransferFeeInstruction.SetTransferFee)
        throw new TokenInvalidInstructionTypeError();
    if (!mint)
        throw new TokenInvalidInstructionKeysError();
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
/**
 * Decode a SetTransferFee instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeSetTransferFeeInstructionUnchecked({ programId, keys: [mint, authority, ...signers], data, }) {
    const { instruction, transferFeeInstruction, transferFeeBasisPoints, maximumFee } = setTransferFeeInstructionData.decode(data);
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
//# sourceMappingURL=instructions.js.map