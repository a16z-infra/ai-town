"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.amountToUiAmount = amountToUiAmount;
exports.amountToUiAmountForInterestBearingMintWithoutSimulation = amountToUiAmountForInterestBearingMintWithoutSimulation;
exports.amountToUiAmountForScaledUiAmountMintWithoutSimulation = amountToUiAmountForScaledUiAmountMintWithoutSimulation;
exports.amountToUiAmountForMintWithoutSimulation = amountToUiAmountForMintWithoutSimulation;
exports.uiAmountToAmountForInterestBearingMintWithoutSimulation = uiAmountToAmountForInterestBearingMintWithoutSimulation;
exports.uiAmountToAmountForScaledUiAmountMintWithoutSimulation = uiAmountToAmountForScaledUiAmountMintWithoutSimulation;
exports.uiAmountToAmountForMintWithoutSimulation = uiAmountToAmountForMintWithoutSimulation;
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../constants.js");
const amountToUiAmount_js_1 = require("../instructions/amountToUiAmount.js");
const mint_js_1 = require("../state/mint.js");
const state_js_1 = require("../extensions/interestBearingMint/state.js");
const state_js_2 = require("../extensions/scaledUiAmount/state.js");
// Constants for interest calculations
const ONE_IN_BASIS_POINTS = 10000;
const SECONDS_PER_YEAR = 60 * 60 * 24 * 365.24;
const SYSVAR_CLOCK_PUBKEY = new web3_js_1.PublicKey('SysvarC1ock11111111111111111111111111111111');
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
function amountToUiAmount(connection_1, payer_1, mint_1, amount_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, mint, amount, programId = constants_js_1.TOKEN_PROGRAM_ID) {
        const transaction = new web3_js_1.Transaction().add((0, amountToUiAmount_js_1.createAmountToUiAmountInstruction)(mint, amount, programId));
        const { returnData, err } = (yield connection.simulateTransaction(transaction, [payer], false)).value;
        if (returnData === null || returnData === void 0 ? void 0 : returnData.data) {
            return Buffer.from(returnData.data[0], returnData.data[1]).toString('utf-8');
        }
        return err;
    });
}
/**
 * Calculates the exponent for the interest rate formula.
 * @param t1 - The start time in seconds.
 * @param t2 - The end time in seconds.
 * @param r - The interest rate in basis points.
 * @returns The calculated exponent.
 */
function calculateExponentForTimesAndRate(t1, t2, r) {
    const timespan = t2 - t1;
    const numerator = r * timespan;
    const exponent = numerator / (SECONDS_PER_YEAR * ONE_IN_BASIS_POINTS);
    return Math.exp(exponent);
}
/**
 * Retrieves the current timestamp from the Solana clock sysvar.
 * @param connection - The Solana connection object.
 * @returns A promise that resolves to the current timestamp in seconds.
 * @throws An error if the sysvar clock cannot be fetched or parsed.
 */
function getSysvarClockTimestamp(connection) {
    return __awaiter(this, void 0, void 0, function* () {
        const info = yield connection.getParsedAccountInfo(SYSVAR_CLOCK_PUBKEY);
        if (!(info === null || info === void 0 ? void 0 : info.value)) {
            throw new Error('Failed to fetch sysvar clock');
        }
        if (typeof info.value === 'object' && 'data' in info.value && 'parsed' in info.value.data) {
            return info.value.data.parsed.info.unixTimestamp;
        }
        throw new Error('Failed to parse sysvar clock');
    });
}
/**
 * Calculates the decimal factor for a given number of decimals
 * @param decimals - Number of decimals
 * @returns The decimal factor (e.g., 100 for 2 decimals)
 */
function getDecimalFactor(decimals) {
    return Math.pow(10, decimals);
}
/**
 * Convert a UI amount to an atomic amount by removing decimal scaling
 * For example, converts "1.234" with 3 decimals to 1234 (atomic units)
 *
 * @param uiAmount       UI Amount to be converted to atomic UI amount
 * @param decimals       Number of decimals for the mint
 *
 * @return Atomic UI amount
 */
function uiAmountToAtomicUiAmount(uiAmount, decimals) {
    const uiAmountNumber = parseFloat(uiAmount);
    const decimalFactor = getDecimalFactor(decimals);
    return uiAmountNumber * decimalFactor;
}
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
function amountToUiAmountForInterestBearingMintWithoutSimulation(amount, decimals, currentTimestamp, // in seconds
lastUpdateTimestamp, initializationTimestamp, preUpdateAverageRate, currentRate) {
    // Calculate pre-update exponent (interest accrued from initialization to last update)
    const preUpdateExp = calculateExponentForTimesAndRate(initializationTimestamp, lastUpdateTimestamp, preUpdateAverageRate);
    // Calculate post-update exponent (interest accrued from last update to current time)
    const postUpdateExp = calculateExponentForTimesAndRate(lastUpdateTimestamp, currentTimestamp, currentRate);
    // Calculate total scale factor
    const totalScale = preUpdateExp * postUpdateExp;
    // Scale the amount by the total interest factor
    const scaledAmount = Number(amount) * totalScale;
    // Calculate the decimal factor (e.g. 100 for 2 decimals)
    const decimalFactor = getDecimalFactor(decimals);
    // Convert to UI amount by truncating and dividing by decimal factor
    return (Math.trunc(scaledAmount) / decimalFactor).toString();
}
/**
 * Convert amount to UiAmount for a mint with scaled UI amount extension
 * @param amount     Amount of tokens to be converted
 * @param decimals   Number of decimals of the mint
 * @param multiplier Multiplier to scale the amount
 * @return Scaled UI amount as a string
 */
function amountToUiAmountForScaledUiAmountMintWithoutSimulation(amount, decimals, multiplier) {
    const scaledAmount = Number(amount) * multiplier;
    const decimalFactor = getDecimalFactor(decimals);
    return (Math.trunc(scaledAmount) / decimalFactor).toString();
}
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
function amountToUiAmountForMintWithoutSimulation(connection, mint, amount) {
    return __awaiter(this, void 0, void 0, function* () {
        const accountInfo = yield connection.getAccountInfo(mint);
        const programId = accountInfo === null || accountInfo === void 0 ? void 0 : accountInfo.owner;
        if (!(programId === null || programId === void 0 ? void 0 : programId.equals(constants_js_1.TOKEN_PROGRAM_ID)) && !(programId === null || programId === void 0 ? void 0 : programId.equals(constants_js_1.TOKEN_2022_PROGRAM_ID))) {
            throw new Error('Invalid program ID');
        }
        const mintInfo = (0, mint_js_1.unpackMint)(mint, accountInfo, programId);
        // Check for interest bearing mint extension
        const interestBearingMintConfigState = (0, state_js_1.getInterestBearingMintConfigState)(mintInfo);
        // Check for scaled UI amount extension
        const scaledUiAmountConfig = (0, state_js_2.getScaledUiAmountConfig)(mintInfo);
        // Standard conversion for regular mints
        if (!interestBearingMintConfigState && !scaledUiAmountConfig) {
            const decimalFactor = getDecimalFactor(mintInfo.decimals);
            return (Number(amount) / decimalFactor).toString();
        }
        // Get timestamp only if needed for special mint types
        const timestamp = yield getSysvarClockTimestamp(connection);
        // Handle interest bearing mint
        if (interestBearingMintConfigState) {
            return amountToUiAmountForInterestBearingMintWithoutSimulation(amount, mintInfo.decimals, timestamp, Number(interestBearingMintConfigState.lastUpdateTimestamp), Number(interestBearingMintConfigState.initializationTimestamp), interestBearingMintConfigState.preUpdateAverageRate, interestBearingMintConfigState.currentRate);
        }
        // At this point, we know it must be a scaled UI amount mint
        let multiplier = scaledUiAmountConfig.multiplier;
        if (timestamp >= Number(scaledUiAmountConfig.newMultiplierEffectiveTimestamp)) {
            multiplier = scaledUiAmountConfig.newMultiplier;
        }
        return amountToUiAmountForScaledUiAmountMintWithoutSimulation(amount, mintInfo.decimals, multiplier);
    });
}
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
function uiAmountToAmountForInterestBearingMintWithoutSimulation(uiAmount, decimals, currentTimestamp, // in seconds
lastUpdateTimestamp, initializationTimestamp, preUpdateAverageRate, currentRate) {
    const uiAmountScaled = uiAmountToAtomicUiAmount(uiAmount, decimals);
    // Calculate pre-update exponent
    const preUpdateExp = calculateExponentForTimesAndRate(initializationTimestamp, lastUpdateTimestamp, preUpdateAverageRate);
    // Calculate post-update exponent
    const postUpdateExp = calculateExponentForTimesAndRate(lastUpdateTimestamp, currentTimestamp, currentRate);
    // Calculate total scale
    const totalScale = preUpdateExp * postUpdateExp;
    // Calculate original principal by dividing the UI amount (principal + interest) by the total scale
    const originalPrincipal = uiAmountScaled / totalScale;
    return BigInt(Math.trunc(originalPrincipal));
}
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
function uiAmountToAmountForScaledUiAmountMintWithoutSimulation(uiAmount, decimals, multiplier) {
    const uiAmountScaled = uiAmountToAtomicUiAmount(uiAmount, decimals);
    const rawAmount = uiAmountScaled / multiplier;
    return BigInt(Math.trunc(rawAmount));
}
/**
 * Convert a UI amount back to the raw amount
 *
 * @param connection     Connection to use
 * @param mint           Mint to use for calculations
 * @param uiAmount       UI Amount to be converted back to raw amount
 *
 * @return Raw amount
 */
function uiAmountToAmountForMintWithoutSimulation(connection, mint, uiAmount) {
    return __awaiter(this, void 0, void 0, function* () {
        const accountInfo = yield connection.getAccountInfo(mint);
        const programId = accountInfo === null || accountInfo === void 0 ? void 0 : accountInfo.owner;
        if (!(programId === null || programId === void 0 ? void 0 : programId.equals(constants_js_1.TOKEN_PROGRAM_ID)) && !(programId === null || programId === void 0 ? void 0 : programId.equals(constants_js_1.TOKEN_2022_PROGRAM_ID))) {
            throw new Error('Invalid program ID');
        }
        const mintInfo = (0, mint_js_1.unpackMint)(mint, accountInfo, programId);
        // Check for interest bearing mint extension
        const interestBearingMintConfigState = (0, state_js_1.getInterestBearingMintConfigState)(mintInfo);
        // Check for scaled UI amount extension
        const scaledUiAmountConfig = (0, state_js_2.getScaledUiAmountConfig)(mintInfo);
        if (!interestBearingMintConfigState && !scaledUiAmountConfig) {
            // Standard conversion for regular mints
            return BigInt(Math.trunc(uiAmountToAtomicUiAmount(uiAmount, mintInfo.decimals)));
        }
        const timestamp = yield getSysvarClockTimestamp(connection);
        if (interestBearingMintConfigState) {
            return uiAmountToAmountForInterestBearingMintWithoutSimulation(uiAmount, mintInfo.decimals, timestamp, Number(interestBearingMintConfigState.lastUpdateTimestamp), Number(interestBearingMintConfigState.initializationTimestamp), interestBearingMintConfigState.preUpdateAverageRate, interestBearingMintConfigState.currentRate);
        }
        // At this point, we know it must be a scaled UI amount mint
        let multiplier = scaledUiAmountConfig.multiplier;
        if (timestamp >= Number(scaledUiAmountConfig.newMultiplierEffectiveTimestamp)) {
            multiplier = scaledUiAmountConfig.newMultiplier;
        }
        return uiAmountToAmountForScaledUiAmountMintWithoutSimulation(uiAmount, mintInfo.decimals, multiplier);
    });
}
//# sourceMappingURL=amountToUiAmount.js.map