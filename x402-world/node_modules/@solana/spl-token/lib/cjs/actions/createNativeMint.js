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
exports.createNativeMint = createNativeMint;
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../constants.js");
const createNativeMint_js_1 = require("../instructions/createNativeMint.js");
/**
 * Create native mint
 *
 * @param connection               Connection to use
 * @param payer                    Payer of the transaction and initialization fees
 * @param confirmOptions           Options for confirming the transaction
 * @param programId                SPL Token program account
 * @param nativeMint               Native mint id associated with program
 */
function createNativeMint(connection_1, payer_1, confirmOptions_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, confirmOptions, nativeMint = constants_js_1.NATIVE_MINT_2022, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
        const transaction = new web3_js_1.Transaction().add((0, createNativeMint_js_1.createCreateNativeMintInstruction)(payer.publicKey, nativeMint, programId));
        yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer], confirmOptions);
    });
}
//# sourceMappingURL=createNativeMint.js.map