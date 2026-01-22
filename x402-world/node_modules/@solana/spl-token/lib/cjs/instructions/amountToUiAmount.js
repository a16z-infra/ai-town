"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.amountToUiAmountInstructionData = void 0;
exports.createAmountToUiAmountInstruction = createAmountToUiAmountInstruction;
exports.decodeAmountToUiAmountInstruction = decodeAmountToUiAmountInstruction;
exports.decodeAmountToUiAmountInstructionUnchecked = decodeAmountToUiAmountInstructionUnchecked;
const buffer_layout_1 = require("@solana/buffer-layout");
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../constants.js");
const errors_js_1 = require("../errors.js");
const types_js_1 = require("./types.js");
/** TODO: docs */
exports.amountToUiAmountInstructionData = (0, buffer_layout_1.struct)([
    (0, buffer_layout_1.u8)('instruction'),
    (0, buffer_layout_utils_1.u64)('amount'),
]);
/**
 * Construct a AmountToUiAmount instruction
 *
 * @param mint         Public key of the mint
 * @param amount       Amount of tokens to be converted to UiAmount
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createAmountToUiAmountInstruction(mint, amount, programId = constants_js_1.TOKEN_PROGRAM_ID) {
    const keys = [{ pubkey: mint, isSigner: false, isWritable: false }];
    const data = Buffer.alloc(exports.amountToUiAmountInstructionData.span);
    exports.amountToUiAmountInstructionData.encode({
        instruction: types_js_1.TokenInstruction.AmountToUiAmount,
        amount: BigInt(amount),
    }, data);
    return new web3_js_1.TransactionInstruction({ keys, programId, data });
}
/**
 * Decode a AmountToUiAmount instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
function decodeAmountToUiAmountInstruction(instruction, programId = constants_js_1.TOKEN_PROGRAM_ID) {
    if (!instruction.programId.equals(programId))
        throw new errors_js_1.TokenInvalidInstructionProgramError();
    if (instruction.data.length !== exports.amountToUiAmountInstructionData.span)
        throw new errors_js_1.TokenInvalidInstructionDataError();
    const { keys: { mint }, data, } = decodeAmountToUiAmountInstructionUnchecked(instruction);
    if (data.instruction !== types_js_1.TokenInstruction.AmountToUiAmount)
        throw new errors_js_1.TokenInvalidInstructionTypeError();
    if (!mint)
        throw new errors_js_1.TokenInvalidInstructionKeysError();
    return {
        programId,
        keys: {
            mint,
        },
        data,
    };
}
/**
 * Decode a AmountToUiAmount instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
function decodeAmountToUiAmountInstructionUnchecked({ programId, keys: [mint], data, }) {
    return {
        programId,
        keys: {
            mint,
        },
        data: exports.amountToUiAmountInstructionData.decode(data),
    };
}
//# sourceMappingURL=amountToUiAmount.js.map