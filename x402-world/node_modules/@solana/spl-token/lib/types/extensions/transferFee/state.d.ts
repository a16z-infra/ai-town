import type { Layout } from '@solana/buffer-layout';
import type { PublicKey } from '@solana/web3.js';
import type { Account } from '../../state/account.js';
import type { Mint } from '../../state/mint.js';
export declare const MAX_FEE_BASIS_POINTS = 10000;
export declare const ONE_IN_BASIS_POINTS: bigint;
/** TransferFeeConfig as stored by the program */
export interface TransferFee {
    /** First epoch where the transfer fee takes effect */
    epoch: bigint;
    /** Maximum fee assessed on transfers, expressed as an amount of tokens */
    maximumFee: bigint;
    /**
     * Amount of transfer collected as fees, expressed as basis points of the
     * transfer amount, ie. increments of 0.01%
     */
    transferFeeBasisPoints: number;
}
/** Transfer fee extension data for mints. */
export interface TransferFeeConfig {
    /** Optional authority to set the fee */
    transferFeeConfigAuthority: PublicKey;
    /** Withdraw from mint instructions must be signed by this key */
    withdrawWithheldAuthority: PublicKey;
    /** Withheld transfer fee tokens that have been moved to the mint for withdrawal */
    withheldAmount: bigint;
    /** Older transfer fee, used if the current epoch < newerTransferFee.epoch */
    olderTransferFee: TransferFee;
    /** Newer transfer fee, used if the current epoch >= newerTransferFee.epoch */
    newerTransferFee: TransferFee;
}
/** Buffer layout for de/serializing a transfer fee */
export declare function transferFeeLayout(property?: string): Layout<TransferFee>;
/** Calculate the transfer fee */
export declare function calculateFee(transferFee: TransferFee, preFeeAmount: bigint): bigint;
/** Buffer layout for de/serializing a transfer fee config extension */
export declare const TransferFeeConfigLayout: import("@solana/buffer-layout").Structure<TransferFeeConfig>;
export declare const TRANSFER_FEE_CONFIG_SIZE: number;
/** Get the fee for given epoch */
export declare function getEpochFee(transferFeeConfig: TransferFeeConfig, epoch: bigint): TransferFee;
/** Calculate the fee for the given epoch and input amount */
export declare function calculateEpochFee(transferFeeConfig: TransferFeeConfig, epoch: bigint, preFeeAmount: bigint): bigint;
/** Transfer fee amount data for accounts. */
export interface TransferFeeAmount {
    /** Withheld transfer fee tokens that can be claimed by the fee authority */
    withheldAmount: bigint;
}
/** Buffer layout for de/serializing */
export declare const TransferFeeAmountLayout: import("@solana/buffer-layout").Structure<TransferFeeAmount>;
export declare const TRANSFER_FEE_AMOUNT_SIZE: number;
export declare function getTransferFeeConfig(mint: Mint): TransferFeeConfig | null;
export declare function getTransferFeeAmount(account: Account): TransferFeeAmount | null;
//# sourceMappingURL=state.d.ts.map