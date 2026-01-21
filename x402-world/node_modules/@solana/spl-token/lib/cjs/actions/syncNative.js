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
exports.syncNative = syncNative;
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../constants.js");
const syncNative_js_1 = require("../instructions/syncNative.js");
/**
 * Sync the balance of a native SPL token account to the underlying system account's lamports
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction fees
 * @param account        Native account to sync
 * @param confirmOptions Options for confirming the transaction
 * @param programId      SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
function syncNative(connection_1, payer_1, account_1, confirmOptions_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, account, confirmOptions, programId = constants_js_1.TOKEN_PROGRAM_ID) {
        const transaction = new web3_js_1.Transaction().add((0, syncNative_js_1.createSyncNativeInstruction)(account, programId));
        return yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer], confirmOptions);
    });
}
//# sourceMappingURL=syncNative.js.map