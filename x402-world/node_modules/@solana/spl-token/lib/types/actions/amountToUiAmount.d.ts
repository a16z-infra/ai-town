import type { Connection, Signer, TransactionError } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';
/**
 * Amount as a string using mint-prescribed decimals
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction fees
 * @param mint           Mint for the account
 * @param amount         Amount of tokens to be converted to Ui Amount
 * @param programId      SPL Token program account
 *
 * @return Ui Amount generated or error
 */
export declare function amountToUiAmount(connection: Connection, payer: Signer, mint: PublicKey, amount: number | bigint, programId?: PublicKey): Promise<string | TransactionError | null>;
/**
 * Convert amount to UiAmount for a mint with interest bearing extension without simulating a transaction
 * This implements the same logic as the CPI instruction available in /token/program-2022/src/extension/interest_bearing_mint/mod.rs
 *
 * Formula: A = P * e^(r * t) where
 * A = final amount after interest
 * P = principal amount (initial investment)
 * r = annual interest rate (as a decimal)
 * t = time in years
 * e = mathematical constant (~2.718)
 *
 * In this case, we are calculating the total scale factor for the interest bearing extension which is the product of two exponential functions:
 * totalScale = e^(r1 * t1) * e^(r2 * t2)
 * where r1 and r2 are the interest rates before and after the last update, and t1 and t2 are the times in years between
 * the initialization timestamp and the last update timestamp, and between the last update timestamp and the current timestamp.
 *
 * @param amount                   Amount of tokens to be converted
 * @param decimals                 Number of decimals of the mint
 * @param currentTimestamp         Current timestamp in seconds
 * @param lastUpdateTimestamp      Last time the interest rate was updated in seconds
 * @param initializationTimestamp  Time the interest bearing extension was initialized in seconds
 * @param preUpdateAverageRate     Interest rate in basis points (1 basis point = 0.01%) before last update
 * @param currentRate              Current interest rate in basis points
 *
 * @return Amount scaled by accrued interest as a string with appropriate decimal places
 */
export declare function amountToUiAmountForInterestBearingMintWithoutSimulation(amount: bigint, decimals: number, currentTimestamp: number, // in seconds
lastUpdateTimestamp: number, initializationTimestamp: number, preUpdateAverageRate: number, currentRate: number): string;
/**
 * Convert amount to UiAmount for a mint with scaled UI amount extension
 * @param amount     Amount of tokens to be converted
 * @param decimals   Number of decimals of the mint
 * @param multiplier Multiplier to scale the amount
 * @return Scaled UI amount as a string
 */
export declare function amountToUiAmountForScaledUiAmountMintWithoutSimulation(amount: bigint, decimals: number, multiplier: number): string;
/**
 * Convert amount to UiAmount for a mint without simulating a transaction
 * This implements the same logic as `process_amount_to_ui_amount` in /token/program-2022/src/processor.rs
 * and `process_amount_to_ui_amount` in /token/program/src/processor.rs
 *
 * @param connection     Connection to use
 * @param mint           Mint to use for calculations
 * @param amount         Amount of tokens to be converted to Ui Amount
 *
 * @return Ui Amount generated
 */
export declare function amountToUiAmountForMintWithoutSimulation(connection: Connection, mint: PublicKey, amount: bigint): Promise<string>;
/**
 * Convert an amount with interest back to the original amount without interest
 * This implements the same logic as the CPI instruction available in /token/program-2022/src/extension/interest_bearing_mint/mod.rs
 *
 * Formula: P = A / (e^(r * t)) where
 * P = principal
 * A = UI amount
 * r = annual interest rate (as a decimal)
 * t = time in years
 *
 * @param uiAmount                  UI Amount (principal plus continuously compounding interest) to be converted back to original principal
 * @param decimals                  Number of decimals for the mint
 * @param currentTimestamp          Current timestamp in seconds
 * @param lastUpdateTimestamp       Last time the interest rate was updated in seconds
 * @param initializationTimestamp   Time the interest bearing extension was initialized in seconds
 * @param preUpdateAverageRate      Interest rate in basis points (hundredths of a percent) before the last update
 * @param currentRate               Current interest rate in basis points
 *
 * @return Original amount (principal) without interest
 */
export declare function uiAmountToAmountForInterestBearingMintWithoutSimulation(uiAmount: string, decimals: number, currentTimestamp: number, // in seconds
lastUpdateTimestamp: number, initializationTimestamp: number, preUpdateAverageRate: number, currentRate: number): bigint;
/**
 * Convert a UI amount back to the raw amount for a mint with a scaled UI amount extension
 * This implements the same logic as the CPI instruction available in /token/program-2022/src/extension/scaled_ui_amount/mod.rs
 *
 * @param uiAmount       UI Amount to be converted back to raw amount
 * @param decimals       Number of decimals for the mint
 * @param multiplier     Multiplier for the scaled UI amount
 *
 * @return Raw amount
 */
export declare function uiAmountToAmountForScaledUiAmountMintWithoutSimulation(uiAmount: string, decimals: number, multiplier: number): bigint;
/**
 * Convert a UI amount back to the raw amount
 *
 * @param connection     Connection to use
 * @param mint           Mint to use for calculations
 * @param uiAmount       UI Amount to be converted back to raw amount
 *
 * @return Raw amount
 */
export declare function uiAmountToAmountForMintWithoutSimulation(connection: Connection, mint: PublicKey, uiAmount: string): Promise<bigint>;
//# sourceMappingURL=amountToUiAmount.d.ts.map