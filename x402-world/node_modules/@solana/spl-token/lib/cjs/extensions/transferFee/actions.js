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
exports.transferCheckedWithFee = transferCheckedWithFee;
exports.withdrawWithheldTokensFromMint = withdrawWithheldTokensFromMint;
exports.withdrawWithheldTokensFromAccounts = withdrawWithheldTokensFromAccounts;
exports.harvestWithheldTokensToMint = harvestWithheldTokensToMint;
exports.setTransferFee = setTransferFee;
const web3_js_1 = require("@solana/web3.js");
const internal_js_1 = require("../../actions/internal.js");
const constants_js_1 = require("../../constants.js");
const instructions_js_1 = require("./instructions.js");
/**
 * Transfer tokens from one account to another, asserting the transfer fee, token mint, and decimals
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction fees
 * @param source         Source account
 * @param mint           Mint for the account
 * @param destination    Destination account
 * @param owner          Owner of the source account
 * @param amount         Number of tokens to transfer
 * @param decimals       Number of decimals in transfer amount
 * @param multiSigners   Signing accounts if `owner` is a multisig
 * @param confirmOptions Options for confirming the transaction
 * @param programId      SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
function transferCheckedWithFee(connection_1, payer_1, source_1, mint_1, destination_1, owner_1, amount_1, decimals_1, fee_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, source, mint, destination, owner, amount, decimals, fee, multiSigners = [], confirmOptions, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
        const [ownerPublicKey, signers] = (0, internal_js_1.getSigners)(owner, multiSigners);
        const transaction = new web3_js_1.Transaction().add((0, instructions_js_1.createTransferCheckedWithFeeInstruction)(source, mint, destination, ownerPublicKey, amount, decimals, fee, multiSigners, programId));
        return yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer, ...signers], confirmOptions);
    });
}
/**
 * Withdraw withheld tokens from mint
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction fees
 * @param mint           The token mint
 * @param destination    The destination account
 * @param authority      The mint's withdraw withheld tokens authority
 * @param multiSigners   Signing accounts if `owner` is a multisig
 * @param confirmOptions Options for confirming the transaction
 * @param programId      SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
function withdrawWithheldTokensFromMint(connection_1, payer_1, mint_1, destination_1, authority_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, mint, destination, authority, multiSigners = [], confirmOptions, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
        const [authorityPublicKey, signers] = (0, internal_js_1.getSigners)(authority, multiSigners);
        const transaction = new web3_js_1.Transaction().add((0, instructions_js_1.createWithdrawWithheldTokensFromMintInstruction)(mint, destination, authorityPublicKey, signers, programId));
        return yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer, ...signers], confirmOptions);
    });
}
/**
 * Withdraw withheld tokens from accounts
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction fees
 * @param mint           The token mint
 * @param destination    The destination account
 * @param authority      The mint's withdraw withheld tokens authority
 * @param multiSigners   Signing accounts if `owner` is a multisig
 * @param sources        Source accounts from which to withdraw withheld fees
 * @param confirmOptions Options for confirming the transaction
 * @param programId      SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
function withdrawWithheldTokensFromAccounts(connection_1, payer_1, mint_1, destination_1, authority_1, multiSigners_1, sources_1, confirmOptions_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, mint, destination, authority, multiSigners, sources, confirmOptions, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
        const [authorityPublicKey, signers] = (0, internal_js_1.getSigners)(authority, multiSigners);
        const transaction = new web3_js_1.Transaction().add((0, instructions_js_1.createWithdrawWithheldTokensFromAccountsInstruction)(mint, destination, authorityPublicKey, signers, sources, programId));
        return yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer, ...signers], confirmOptions);
    });
}
/**
 * Harvest withheld tokens from accounts to the mint
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction fees
 * @param mint           The token mint
 * @param sources        Source accounts from which to withdraw withheld fees
 * @param confirmOptions Options for confirming the transaction
 * @param programId      SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
function harvestWithheldTokensToMint(connection_1, payer_1, mint_1, sources_1, confirmOptions_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, mint, sources, confirmOptions, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
        const transaction = new web3_js_1.Transaction().add((0, instructions_js_1.createHarvestWithheldTokensToMintInstruction)(mint, sources, programId));
        return yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer], confirmOptions);
    });
}
/**
 * Update transfer fee and maximum fee
 *
 * @param connection                Connection to use
 * @param payer                     Payer of the transaction fees
 * @param mint                      The token mint
 * @param authority                 The authority of the transfer fee
 * @param multiSigners              Signing accounts if `owner` is a multisig
 * @param transferFeeBasisPoints    Amount of transfer collected as fees, expressed as basis points of the transfer amount
 * @param maximumFee                Maximum fee assessed on transfers
 * @param confirmOptions            Options for confirming the transaction
 * @param programId                 SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
function setTransferFee(connection_1, payer_1, mint_1, authority_1, multiSigners_1, transferFeeBasisPoints_1, maximumFee_1, confirmOptions_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, mint, authority, multiSigners, transferFeeBasisPoints, maximumFee, confirmOptions, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
        const [authorityPublicKey, signers] = (0, internal_js_1.getSigners)(authority, multiSigners);
        const transaction = new web3_js_1.Transaction().add((0, instructions_js_1.createSetTransferFeeInstruction)(mint, authorityPublicKey, signers, transferFeeBasisPoints, maximumFee, programId));
        return yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer, ...signers], confirmOptions);
    });
}
//# sourceMappingURL=actions.js.map