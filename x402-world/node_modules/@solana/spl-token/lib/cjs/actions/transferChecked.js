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
exports.transferChecked = transferChecked;
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../constants.js");
const transferChecked_js_1 = require("../instructions/transferChecked.js");
const internal_js_1 = require("./internal.js");
/**
 * Transfer tokens from one account to another, asserting the token mint and decimals
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
function transferChecked(connection_1, payer_1, source_1, mint_1, destination_1, owner_1, amount_1, decimals_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, source, mint, destination, owner, amount, decimals, multiSigners = [], confirmOptions, programId = constants_js_1.TOKEN_PROGRAM_ID) {
        const [ownerPublicKey, signers] = (0, internal_js_1.getSigners)(owner, multiSigners);
        const transaction = new web3_js_1.Transaction().add((0, transferChecked_js_1.createTransferCheckedInstruction)(source, mint, destination, ownerPublicKey, amount, decimals, multiSigners, programId));
        return yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer, ...signers], confirmOptions);
    });
}
//# sourceMappingURL=transferChecked.js.map