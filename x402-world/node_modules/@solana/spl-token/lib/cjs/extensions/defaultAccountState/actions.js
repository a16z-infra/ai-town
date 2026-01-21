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
exports.initializeDefaultAccountState = initializeDefaultAccountState;
exports.updateDefaultAccountState = updateDefaultAccountState;
const web3_js_1 = require("@solana/web3.js");
const internal_js_1 = require("../../actions/internal.js");
const constants_js_1 = require("../../constants.js");
const instructions_js_1 = require("./instructions.js");
/**
 * Initialize a default account state on a mint
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction fees
 * @param mint        Mint to initialize with extension
 * @param state        Account state with which to initialize new accounts
 * @param confirmOptions Options for confirming the transaction
 * @param programId      SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
function initializeDefaultAccountState(connection_1, payer_1, mint_1, state_1, confirmOptions_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, mint, state, confirmOptions, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
        const transaction = new web3_js_1.Transaction().add((0, instructions_js_1.createInitializeDefaultAccountStateInstruction)(mint, state, programId));
        return yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer], confirmOptions);
    });
}
/**
 * Update the default account state on a mint
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction fees
 * @param mint        Mint to modify
 * @param state        New account state to set on created accounts
 * @param freezeAuthority          Freeze authority of the mint
 * @param multiSigners   Signing accounts if `freezeAuthority` is a multisig
 * @param confirmOptions Options for confirming the transaction
 * @param programId      SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
function updateDefaultAccountState(connection_1, payer_1, mint_1, state_1, freezeAuthority_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, mint, state, freezeAuthority, multiSigners = [], confirmOptions, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
        const [freezeAuthorityPublicKey, signers] = (0, internal_js_1.getSigners)(freezeAuthority, multiSigners);
        const transaction = new web3_js_1.Transaction().add((0, instructions_js_1.createUpdateDefaultAccountStateInstruction)(mint, state, freezeAuthorityPublicKey, signers, programId));
        return yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer, ...signers], confirmOptions);
    });
}
//# sourceMappingURL=actions.js.map