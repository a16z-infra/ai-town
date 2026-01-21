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
exports.createWrappedNativeAccount = createWrappedNativeAccount;
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../constants.js");
const associatedTokenAccount_js_1 = require("../instructions/associatedTokenAccount.js");
const initializeAccount_js_1 = require("../instructions/initializeAccount.js");
const syncNative_js_1 = require("../instructions/syncNative.js");
const account_js_1 = require("../state/account.js");
const mint_js_1 = require("../state/mint.js");
const createAccount_js_1 = require("./createAccount.js");
/**
 * Create, initialize, and fund a new wrapped native SOL account
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction and initialization fees
 * @param owner          Owner of the new token account
 * @param amount         Number of lamports to wrap
 * @param keypair        Optional keypair, defaulting to the associated token account for the native mint and `owner`
 * @param confirmOptions Options for confirming the transaction
 * @param programId      SPL Token program account
 *
 * @return Address of the new wrapped native SOL account
 */
function createWrappedNativeAccount(connection_1, payer_1, owner_1, amount_1, keypair_1, confirmOptions_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, owner, amount, keypair, confirmOptions, programId = constants_js_1.TOKEN_PROGRAM_ID, nativeMint = constants_js_1.NATIVE_MINT) {
        // If the amount provided is explicitly 0 or NaN, just create the account without funding it
        if (!amount)
            return yield (0, createAccount_js_1.createAccount)(connection, payer, nativeMint, owner, keypair, confirmOptions, programId);
        // If a keypair isn't provided, create the account at the owner's ATA for the native mint and return its address
        if (!keypair) {
            const associatedToken = (0, mint_js_1.getAssociatedTokenAddressSync)(nativeMint, owner, false, programId, constants_js_1.ASSOCIATED_TOKEN_PROGRAM_ID);
            const transaction = new web3_js_1.Transaction().add((0, associatedTokenAccount_js_1.createAssociatedTokenAccountInstruction)(payer.publicKey, associatedToken, owner, nativeMint, programId, constants_js_1.ASSOCIATED_TOKEN_PROGRAM_ID), web3_js_1.SystemProgram.transfer({
                fromPubkey: payer.publicKey,
                toPubkey: associatedToken,
                lamports: amount,
            }), (0, syncNative_js_1.createSyncNativeInstruction)(associatedToken, programId));
            yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer], confirmOptions);
            return associatedToken;
        }
        // Otherwise, create the account with the provided keypair and return its public key
        const lamports = yield (0, account_js_1.getMinimumBalanceForRentExemptAccount)(connection);
        const transaction = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: keypair.publicKey,
            space: account_js_1.ACCOUNT_SIZE,
            lamports,
            programId,
        }), web3_js_1.SystemProgram.transfer({
            fromPubkey: payer.publicKey,
            toPubkey: keypair.publicKey,
            lamports: amount,
        }), (0, initializeAccount_js_1.createInitializeAccountInstruction)(keypair.publicKey, nativeMint, owner, programId));
        yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer, keypair], confirmOptions);
        return keypair.publicKey;
    });
}
//# sourceMappingURL=createWrappedNativeAccount.js.map