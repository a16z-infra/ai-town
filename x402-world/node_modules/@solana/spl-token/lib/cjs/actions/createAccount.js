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
exports.createAccount = createAccount;
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../constants.js");
const extensionType_js_1 = require("../extensions/extensionType.js");
const initializeAccount_js_1 = require("../instructions/initializeAccount.js");
const mint_js_1 = require("../state/mint.js");
const createAssociatedTokenAccount_js_1 = require("./createAssociatedTokenAccount.js");
/**
 * Create and initialize a new token account
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction and initialization fees
 * @param mint           Mint for the account
 * @param owner          Owner of the new account
 * @param keypair        Optional keypair, defaulting to the associated token account for the `mint` and `owner`
 * @param confirmOptions Options for confirming the transaction
 * @param programId      SPL Token program account
 *
 * @return Address of the new token account
 */
function createAccount(connection_1, payer_1, mint_1, owner_1, keypair_1, confirmOptions_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, mint, owner, keypair, confirmOptions, programId = constants_js_1.TOKEN_PROGRAM_ID) {
        // If a keypair isn't provided, create the associated token account and return its address
        if (!keypair)
            return yield (0, createAssociatedTokenAccount_js_1.createAssociatedTokenAccount)(connection, payer, mint, owner, confirmOptions, programId);
        // Otherwise, create the account with the provided keypair and return its public key
        const mintState = yield (0, mint_js_1.getMint)(connection, mint, confirmOptions === null || confirmOptions === void 0 ? void 0 : confirmOptions.commitment, programId);
        const space = (0, extensionType_js_1.getAccountLenForMint)(mintState);
        const lamports = yield connection.getMinimumBalanceForRentExemption(space);
        const transaction = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: keypair.publicKey,
            space,
            lamports,
            programId,
        }), (0, initializeAccount_js_1.createInitializeAccountInstruction)(keypair.publicKey, mint, owner, programId));
        yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer, keypair], confirmOptions);
        return keypair.publicKey;
    });
}
//# sourceMappingURL=createAccount.js.map