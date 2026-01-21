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
exports.initializeTransferHook = initializeTransferHook;
exports.updateTransferHook = updateTransferHook;
exports.transferCheckedWithTransferHook = transferCheckedWithTransferHook;
exports.transferCheckedWithFeeAndTransferHook = transferCheckedWithFeeAndTransferHook;
const web3_js_1 = require("@solana/web3.js");
const internal_js_1 = require("../../actions/internal.js");
const constants_js_1 = require("../../constants.js");
const instructions_js_1 = require("./instructions.js");
/**
 * Initialize a transfer hook on a mint
 *
 * @param connection            Connection to use
 * @param payer                 Payer of the transaction fees
 * @param mint                  Mint to initialize with extension
 * @param authority             Transfer hook authority account
 * @param transferHookProgramId The transfer hook program account
 * @param confirmOptions        Options for confirming the transaction
 * @param programId             SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
function initializeTransferHook(connection_1, payer_1, mint_1, authority_1, transferHookProgramId_1, confirmOptions_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, mint, authority, transferHookProgramId, confirmOptions, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
        const transaction = new web3_js_1.Transaction().add((0, instructions_js_1.createInitializeTransferHookInstruction)(mint, authority, transferHookProgramId, programId));
        return yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer], confirmOptions);
    });
}
/**
 * Update the transfer hook program on a mint
 *
 * @param connection            Connection to use
 * @param payer                 Payer of the transaction fees
 * @param mint                  Mint to modify
 * @param transferHookProgramId New transfer hook program account
 * @param authority             Transfer hook update authority
 * @param multiSigners          Signing accounts if `freezeAuthority` is a multisig
 * @param confirmOptions        Options for confirming the transaction
 * @param programId             SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
function updateTransferHook(connection_1, payer_1, mint_1, transferHookProgramId_1, authority_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, mint, transferHookProgramId, authority, multiSigners = [], confirmOptions, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
        const [authorityPublicKey, signers] = (0, internal_js_1.getSigners)(authority, multiSigners);
        const transaction = new web3_js_1.Transaction().add((0, instructions_js_1.createUpdateTransferHookInstruction)(mint, authorityPublicKey, transferHookProgramId, signers, programId));
        return yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer, ...signers], confirmOptions);
    });
}
/**
 * Transfer tokens from one account to another, asserting the token mint, and decimals
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction fees
 * @param source         Source account
 * @param mint           Mint for the account
 * @param destination    Destination account
 * @param authority      Authority of the source account
 * @param amount         Number of tokens to transfer
 * @param decimals       Number of decimals in transfer amount
 * @param multiSigners   Signing accounts if `owner` is a multisig
 * @param confirmOptions Options for confirming the transaction
 * @param programId      SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
function transferCheckedWithTransferHook(connection_1, payer_1, source_1, mint_1, destination_1, authority_1, amount_1, decimals_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, source, mint, destination, authority, amount, decimals, multiSigners = [], confirmOptions, programId = constants_js_1.TOKEN_PROGRAM_ID) {
        const [authorityPublicKey, signers] = (0, internal_js_1.getSigners)(authority, multiSigners);
        const transaction = new web3_js_1.Transaction().add(yield (0, instructions_js_1.createTransferCheckedWithTransferHookInstruction)(connection, source, mint, destination, authorityPublicKey, amount, decimals, signers, confirmOptions === null || confirmOptions === void 0 ? void 0 : confirmOptions.commitment, programId));
        return yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer, ...signers], confirmOptions);
    });
}
/**
 * Transfer tokens from one account to another, asserting the transfer fee, token mint, and decimals
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction fees
 * @param source         Source account
 * @param mint           Mint for the account
 * @param destination    Destination account
 * @param authority      Authority of the source account
 * @param amount         Number of tokens to transfer
 * @param decimals       Number of decimals in transfer amount
 * @param fee            The calculated fee for the transfer fee extension
 * @param multiSigners   Signing accounts if `owner` is a multisig
 * @param confirmOptions Options for confirming the transaction
 * @param programId      SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
function transferCheckedWithFeeAndTransferHook(connection_1, payer_1, source_1, mint_1, destination_1, authority_1, amount_1, decimals_1, fee_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, source, mint, destination, authority, amount, decimals, fee, multiSigners = [], confirmOptions, programId = constants_js_1.TOKEN_PROGRAM_ID) {
        const [authorityPublicKey, signers] = (0, internal_js_1.getSigners)(authority, multiSigners);
        const transaction = new web3_js_1.Transaction().add(yield (0, instructions_js_1.createTransferCheckedWithFeeAndTransferHookInstruction)(connection, source, mint, destination, authorityPublicKey, amount, decimals, fee, signers, confirmOptions === null || confirmOptions === void 0 ? void 0 : confirmOptions.commitment, programId));
        return yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer, ...signers], confirmOptions);
    });
}
//# sourceMappingURL=actions.js.map