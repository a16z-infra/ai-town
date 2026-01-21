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
exports.createInterestBearingMint = createInterestBearingMint;
exports.updateRateInterestBearingMint = updateRateInterestBearingMint;
const web3_js_1 = require("@solana/web3.js");
const internal_js_1 = require("../../actions/internal.js");
const constants_js_1 = require("../../constants.js");
const initializeMint_js_1 = require("../../instructions/initializeMint.js");
const extensionType_js_1 = require("../extensionType.js");
const instructions_js_1 = require("./instructions.js");
/**
 * Initialize an interest bearing account on a mint
 *
 * @param connection      Connection to use
 * @param payer           Payer of the transaction fees
 * @param mintAuthority   Account or multisig that will control minting
 * @param freezeAuthority Optional account or multisig that can freeze token accounts
 * @param rateAuthority   The public key for the account that can update the rate
 * @param rate            The initial interest rate
 * @param decimals        Location of the decimal place
 * @param keypair         Optional keypair, defaulting to a new random one
 * @param confirmOptions  Options for confirming the transaction
 * @param programId       SPL Token program account
 *
 * @return Public key of the mint
 */
function createInterestBearingMint(connection_1, payer_1, mintAuthority_1, freezeAuthority_1, rateAuthority_1, rate_1, decimals_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, mintAuthority, freezeAuthority, rateAuthority, rate, decimals, keypair = web3_js_1.Keypair.generate(), confirmOptions, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
        const mintLen = (0, extensionType_js_1.getMintLen)([extensionType_js_1.ExtensionType.InterestBearingConfig]);
        const lamports = yield connection.getMinimumBalanceForRentExemption(mintLen);
        const transaction = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: keypair.publicKey,
            space: mintLen,
            lamports,
            programId,
        }), (0, instructions_js_1.createInitializeInterestBearingMintInstruction)(keypair.publicKey, rateAuthority, rate, programId), (0, initializeMint_js_1.createInitializeMintInstruction)(keypair.publicKey, decimals, mintAuthority, freezeAuthority, programId));
        yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer, keypair], confirmOptions);
        return keypair.publicKey;
    });
}
/**
 * Update the interest rate of an interest bearing account
 *
 * @param connection      Connection to use
 * @param payer           Payer of the transaction fees
 * @param mint            Public key of the mint
 * @param rateAuthority   The public key for the account that can update the rate
 * @param rate            The initial interest rate
 * @param multiSigners    Signing accounts if `owner` is a multisig
 * @param confirmOptions  Options for confirming the transaction
 * @param programId       SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
function updateRateInterestBearingMint(connection_1, payer_1, mint_1, rateAuthority_1, rate_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, mint, rateAuthority, rate, multiSigners = [], confirmOptions, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
        const [rateAuthorityPublicKey, signers] = (0, internal_js_1.getSigners)(rateAuthority, multiSigners);
        const transaction = new web3_js_1.Transaction().add((0, instructions_js_1.createUpdateRateInterestBearingMintInstruction)(mint, rateAuthorityPublicKey, rate, signers, programId));
        return yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer, rateAuthority, ...signers], confirmOptions);
    });
}
//# sourceMappingURL=actions.js.map