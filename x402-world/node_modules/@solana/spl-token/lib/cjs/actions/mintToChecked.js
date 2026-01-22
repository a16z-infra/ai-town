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
exports.mintToChecked = mintToChecked;
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../constants.js");
const mintToChecked_js_1 = require("../instructions/mintToChecked.js");
const internal_js_1 = require("./internal.js");
/**
 * Mint tokens to an account, asserting the token mint and decimals
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction fees
 * @param mint           Mint for the account
 * @param destination    Address of the account to mint to
 * @param authority      Minting authority
 * @param amount         Amount to mint
 * @param decimals       Number of decimals in amount to mint
 * @param multiSigners   Signing accounts if `authority` is a multisig
 * @param confirmOptions Options for confirming the transaction
 * @param programId      SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
function mintToChecked(connection_1, payer_1, mint_1, destination_1, authority_1, amount_1, decimals_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, mint, destination, authority, amount, decimals, multiSigners = [], confirmOptions, programId = constants_js_1.TOKEN_PROGRAM_ID) {
        const [authorityPublicKey, signers] = (0, internal_js_1.getSigners)(authority, multiSigners);
        const transaction = new web3_js_1.Transaction().add((0, mintToChecked_js_1.createMintToCheckedInstruction)(mint, destination, authorityPublicKey, amount, decimals, multiSigners, programId));
        return yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer, ...signers], confirmOptions);
    });
}
//# sourceMappingURL=mintToChecked.js.map