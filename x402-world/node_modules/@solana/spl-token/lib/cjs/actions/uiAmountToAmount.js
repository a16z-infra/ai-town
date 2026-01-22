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
exports.uiAmountToAmount = uiAmountToAmount;
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../constants.js");
const uiAmountToAmount_js_1 = require("../instructions/uiAmountToAmount.js");
/**
 * Amount as a string using mint-prescribed decimals
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction fees
 * @param mint           Mint for the account
 * @param amount         Ui Amount of tokens to be converted to Amount
 * @param programId      SPL Token program account
 *
 * @return Ui Amount generated
 */
function uiAmountToAmount(connection_1, payer_1, mint_1, amount_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, mint, amount, programId = constants_js_1.TOKEN_PROGRAM_ID) {
        const transaction = new web3_js_1.Transaction().add((0, uiAmountToAmount_js_1.createUiAmountToAmountInstruction)(mint, amount, programId));
        const { returnData, err } = (yield connection.simulateTransaction(transaction, [payer], false)).value;
        if (returnData) {
            const data = Buffer.from(returnData.data[0], returnData.data[1]);
            return (0, buffer_layout_utils_1.u64)().decode(data);
        }
        return err;
    });
}
//# sourceMappingURL=uiAmountToAmount.js.map