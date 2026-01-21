import type { AccountMeta, Signer, PublicKey } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from '../../instructions/types.js';
export declare enum TransferFeeInstruction {
    InitializeTransferFeeConfig = 0,
    TransferCheckedWithFee = 1,
    WithdrawWithheldTokensFromMint = 2,
    WithdrawWithheldTokensFromAccounts = 3,
    HarvestWithheldTokensToMint = 4,
    SetTransferFee = 5
}
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
export declare const initializeTransferFeeConfigInstructionData: import("@solana/buffer-layout").Structure<InitializeTransferFeeConfigInstructionData>;
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
export declare function createInitializeTransferFeeConfigInstruction(mint: PublicKey, transferFeeConfigAuthority: PublicKey | null, withdrawWithheldAuthority: PublicKey | null, transferFeeBasisPoints: number, maximumFee: bigint, programId?: PublicKey): TransactionInstruction;
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
export declare function decodeInitializeTransferFeeConfigInstruction(instruction: TransactionInstruction, programId: PublicKey): DecodedInitializeTransferFeeConfigInstruction;
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
export declare function decodeInitializeTransferFeeConfigInstructionUnchecked({ programId, keys: [mint], data, }: TransactionInstruction): DecodedInitializeTransferFeeConfigInstructionUnchecked;
export interface TransferCheckedWithFeeInstructionData {
    instruction: TokenInstruction.TransferFeeExtension;
    transferFeeInstruction: TransferFeeInstruction.TransferCheckedWithFee;
    amount: bigint;
    decimals: number;
    fee: bigint;
}
export declare const transferCheckedWithFeeInstructionData: import("@solana/buffer-layout").Structure<TransferCheckedWithFeeInstructionData>;
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
export declare function createTransferCheckedWithFeeInstruction(source: PublicKey, mint: PublicKey, destination: PublicKey, authority: PublicKey, amount: bigint, decimals: number, fee: bigint, multiSigners?: (Signer | PublicKey)[], programId?: PublicKey): TransactionInstruction;
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
export declare function decodeTransferCheckedWithFeeInstruction(instruction: TransactionInstruction, programId: PublicKey): DecodedTransferCheckedWithFeeInstruction;
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
export declare function decodeTransferCheckedWithFeeInstructionUnchecked({ programId, keys: [source, mint, destination, authority, ...signers], data, }: TransactionInstruction): DecodedTransferCheckedWithFeeInstructionUnchecked;
export interface WithdrawWithheldTokensFromMintInstructionData {
    instruction: TokenInstruction.TransferFeeExtension;
    transferFeeInstruction: TransferFeeInstruction.WithdrawWithheldTokensFromMint;
}
export declare const withdrawWithheldTokensFromMintInstructionData: import("@solana/buffer-layout").Structure<WithdrawWithheldTokensFromMintInstructionData>;
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
export declare function createWithdrawWithheldTokensFromMintInstruction(mint: PublicKey, destination: PublicKey, authority: PublicKey, signers?: (Signer | PublicKey)[], programId?: PublicKey): TransactionInstruction;
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
export declare function decodeWithdrawWithheldTokensFromMintInstruction(instruction: TransactionInstruction, programId: PublicKey): DecodedWithdrawWithheldTokensFromMintInstruction;
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
export declare function decodeWithdrawWithheldTokensFromMintInstructionUnchecked({ programId, keys: [mint, destination, authority, ...signers], data, }: TransactionInstruction): DecodedWithdrawWithheldTokensFromMintInstructionUnchecked;
export interface WithdrawWithheldTokensFromAccountsInstructionData {
    instruction: TokenInstruction.TransferFeeExtension;
    transferFeeInstruction: TransferFeeInstruction.WithdrawWithheldTokensFromAccounts;
    numTokenAccounts: number;
}
export declare const withdrawWithheldTokensFromAccountsInstructionData: import("@solana/buffer-layout").Structure<WithdrawWithheldTokensFromAccountsInstructionData>;
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
export declare function createWithdrawWithheldTokensFromAccountsInstruction(mint: PublicKey, destination: PublicKey, authority: PublicKey, signers: (Signer | PublicKey)[], sources: PublicKey[], programId?: PublicKey): TransactionInstruction;
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
export declare function decodeWithdrawWithheldTokensFromAccountsInstruction(instruction: TransactionInstruction, programId: PublicKey): DecodedWithdrawWithheldTokensFromAccountsInstruction;
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
export declare function decodeWithdrawWithheldTokensFromAccountsInstructionUnchecked({ programId, keys, data, }: TransactionInstruction): DecodedWithdrawWithheldTokensFromAccountsInstructionUnchecked;
export interface HarvestWithheldTokensToMintInstructionData {
    instruction: TokenInstruction.TransferFeeExtension;
    transferFeeInstruction: TransferFeeInstruction.HarvestWithheldTokensToMint;
}
export declare const harvestWithheldTokensToMintInstructionData: import("@solana/buffer-layout").Structure<HarvestWithheldTokensToMintInstructionData>;
/**
 * Construct a HarvestWithheldTokensToMint instruction
 *
 * @param mint              The token mint
 * @param sources           The source accounts to withdraw from
 * @param programID         SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createHarvestWithheldTokensToMintInstruction(mint: PublicKey, sources: PublicKey[], programId?: PublicKey): TransactionInstruction;
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
export declare function decodeHarvestWithheldTokensToMintInstruction(instruction: TransactionInstruction, programId: PublicKey): DecodedHarvestWithheldTokensToMintInstruction;
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
export declare function decodeHarvestWithheldTokensToMintInstructionUnchecked({ programId, keys: [mint, ...sources], data, }: TransactionInstruction): DecodedHarvestWithheldTokensToMintInstructionUnchecked;
export interface SetTransferFeeInstructionData {
    instruction: TokenInstruction.TransferFeeExtension;
    transferFeeInstruction: TransferFeeInstruction.SetTransferFee;
    transferFeeBasisPoints: number;
    maximumFee: bigint;
}
export declare const setTransferFeeInstructionData: import("@solana/buffer-layout").Structure<SetTransferFeeInstructionData>;
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
export declare function createSetTransferFeeInstruction(mint: PublicKey, authority: PublicKey, signers: (Signer | PublicKey)[], transferFeeBasisPoints: number, maximumFee: bigint, programId?: PublicKey): TransactionInstruction;
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
export declare function decodeSetTransferFeeInstruction(instruction: TransactionInstruction, programId: PublicKey): DecodedSetTransferFeeInstruction;
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
export declare function decodeSetTransferFeeInstructionUnchecked({ programId, keys: [mint, authority, ...signers], data, }: TransactionInstruction): DecodedSetTransferFeeInstructionUnchecked;
//# sourceMappingURL=instructions.d.ts.map