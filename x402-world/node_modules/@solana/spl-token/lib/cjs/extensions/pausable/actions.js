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
exports.pause = pause;
exports.resume = resume;
const web3_js_1 = require("@solana/web3.js");
const internal_js_1 = require("../../actions/internal.js");
const constants_js_1 = require("../../constants.js");
const instructions_js_1 = require("./instructions.js");
/**
 * Pause a pausable mint
 *
 * @param connection      Connection to use
 * @param payer           Payer of the transaction fees
 * @param mint            Public key of the mint
 * @param owner           The pausable config authority
 * @param multiSigners    Signing accounts if `owner` is a multisig
 * @param confirmOptions  Options for confirming the transaction
 * @param programId       SPL Token program account
 *
 * @return Public key of the mint
 */
function pause(connection_1, payer_1, mint_1, owner_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, mint, owner, multiSigners = [], confirmOptions, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
        const [ownerPublicKey, signers] = (0, internal_js_1.getSigners)(owner, multiSigners);
        const transaction = new web3_js_1.Transaction().add((0, instructions_js_1.createPauseInstruction)(mint, ownerPublicKey, multiSigners, programId));
        return yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer, ...signers], confirmOptions);
    });
}
/**
 * Resume a pausable mint
 *
 * @param connection      Connection to use
 * @param payer           Payer of the transaction fees
 * @param mint            Public key of the mint
 * @param owner           The pausable config authority
 * @param multiSigners    Signing accounts if `owner` is a multisig
 * @param confirmOptions  Options for confirming the transaction
 * @param programId       SPL Token program account
 *
 * @return Public key of the mint
 */
function resume(connection_1, payer_1, mint_1, owner_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, mint, owner, multiSigners = [], confirmOptions, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
        const [ownerPublicKey, signers] = (0, internal_js_1.getSigners)(owner, multiSigners);
        const transaction = new web3_js_1.Transaction().add((0, instructions_js_1.createResumeInstruction)(mint, ownerPublicKey, multiSigners, programId));
        return yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer, ...signers], confirmOptions);
    });
}
//# sourceMappingURL=actions.js.map