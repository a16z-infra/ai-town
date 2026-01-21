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
exports.getOrCreateAssociatedTokenAccount = getOrCreateAssociatedTokenAccount;
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../constants.js");
const errors_js_1 = require("../errors.js");
const associatedTokenAccount_js_1 = require("../instructions/associatedTokenAccount.js");
const account_js_1 = require("../state/account.js");
const mint_js_1 = require("../state/mint.js");
/**
 * Retrieve the associated token account, or create it if it doesn't exist
 *
 * @param connection               Connection to use
 * @param payer                    Payer of the transaction and initialization fees
 * @param mint                     Mint associated with the account to set or verify
 * @param owner                    Owner of the account to set or verify
 * @param allowOwnerOffCurve       Allow the owner account to be a PDA (Program Derived Address)
 * @param commitment               Desired level of commitment for querying the state
 * @param confirmOptions           Options for confirming the transaction
 * @param programId                SPL Token program account
 * @param associatedTokenProgramId SPL Associated Token program account
 *
 * @return Address of the new associated token account
 */
function getOrCreateAssociatedTokenAccount(connection_1, payer_1, mint_1, owner_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, mint, owner, allowOwnerOffCurve = false, commitment, confirmOptions, programId = constants_js_1.TOKEN_PROGRAM_ID, associatedTokenProgramId = constants_js_1.ASSOCIATED_TOKEN_PROGRAM_ID) {
        const associatedToken = (0, mint_js_1.getAssociatedTokenAddressSync)(mint, owner, allowOwnerOffCurve, programId, associatedTokenProgramId);
        // This is the optimal logic, considering TX fee, client-side computation, RPC roundtrips and guaranteed idempotent.
        // Sadly we can't do this atomically.
        let account;
        try {
            account = yield (0, account_js_1.getAccount)(connection, associatedToken, commitment, programId);
        }
        catch (error) {
            // TokenAccountNotFoundError can be possible if the associated address has already received some lamports,
            // becoming a system account. Assuming program derived addressing is safe, this is the only case for the
            // TokenInvalidAccountOwnerError in this code path.
            if (error instanceof errors_js_1.TokenAccountNotFoundError || error instanceof errors_js_1.TokenInvalidAccountOwnerError) {
                // As this isn't atomic, it's possible others can create associated accounts meanwhile.
                try {
                    const transaction = new web3_js_1.Transaction().add((0, associatedTokenAccount_js_1.createAssociatedTokenAccountInstruction)(payer.publicKey, associatedToken, owner, mint, programId, associatedTokenProgramId));
                    yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer], confirmOptions);
                }
                catch (error) {
                    // Ignore all errors; for now there is no API-compatible way to selectively ignore the expected
                    // instruction error if the associated account exists already.
                }
                // Now this should always succeed
                account = yield (0, account_js_1.getAccount)(connection, associatedToken, commitment, programId);
            }
            else {
                throw error;
            }
        }
        if (!account.mint.equals(mint))
            throw new errors_js_1.TokenInvalidMintError();
        if (!account.owner.equals(owner))
            throw new errors_js_1.TokenInvalidOwnerError();
        return account;
    });
}
//# sourceMappingURL=getOrCreateAssociatedTokenAccount.js.map