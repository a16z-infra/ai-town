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
exports.setAuthority = setAuthority;
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../constants.js");
const setAuthority_js_1 = require("../instructions/setAuthority.js");
const internal_js_1 = require("./internal.js");
/**
 * Assign a new authority to the account
 *
 * @param connection       Connection to use
 * @param payer            Payer of the transaction fees
 * @param account          Address of the account
 * @param currentAuthority Current authority of the specified type
 * @param authorityType    Type of authority to set
 * @param newAuthority     New authority of the account
 * @param multiSigners     Signing accounts if `currentAuthority` is a multisig
 * @param confirmOptions   Options for confirming the transaction
 * @param programId        SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
function setAuthority(connection_1, payer_1, account_1, currentAuthority_1, authorityType_1, newAuthority_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, account, currentAuthority, authorityType, newAuthority, multiSigners = [], confirmOptions, programId = constants_js_1.TOKEN_PROGRAM_ID) {
        const [currentAuthorityPublicKey, signers] = (0, internal_js_1.getSigners)(currentAuthority, multiSigners);
        const transaction = new web3_js_1.Transaction().add((0, setAuthority_js_1.createSetAuthorityInstruction)(account, currentAuthorityPublicKey, authorityType, newAuthority, multiSigners, programId));
        return yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer, ...signers], confirmOptions);
    });
}
//# sourceMappingURL=setAuthority.js.map