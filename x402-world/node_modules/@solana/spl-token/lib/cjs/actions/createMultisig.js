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
exports.createMultisig = createMultisig;
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../constants.js");
const initializeMultisig_js_1 = require("../instructions/initializeMultisig.js");
const multisig_js_1 = require("../state/multisig.js");
/**
 * Create and initialize a new multisig
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction and initialization fees
 * @param signers        Full set of signers
 * @param m              Number of required signatures
 * @param keypair        Optional keypair, defaulting to a new random one
 * @param confirmOptions Options for confirming the transaction
 * @param programId      SPL Token program account
 *
 * @return Address of the new multisig
 */
function createMultisig(connection_1, payer_1, signers_1, m_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, signers, m, keypair = web3_js_1.Keypair.generate(), confirmOptions, programId = constants_js_1.TOKEN_PROGRAM_ID) {
        const lamports = yield (0, multisig_js_1.getMinimumBalanceForRentExemptMultisig)(connection);
        const transaction = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: keypair.publicKey,
            space: multisig_js_1.MULTISIG_SIZE,
            lamports,
            programId,
        }), (0, initializeMultisig_js_1.createInitializeMultisigInstruction)(keypair.publicKey, signers, m, programId));
        yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer, keypair], confirmOptions);
        return keypair.publicKey;
    });
}
//# sourceMappingURL=createMultisig.js.map