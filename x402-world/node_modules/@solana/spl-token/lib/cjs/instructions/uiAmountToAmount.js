"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUiAmountToAmountInstruction = createUiAmountToAmountInstruction;
exports.decodeUiAmountToAmountInstruction = decodeUiAmountToAmountInstruction;
exports.decodeUiAmountToAmountInstructionUnchecked = decodeUiAmountToAmountInstructionUnchecked;
const buffer_layout_1 = require("@solana/buffer-layout");
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../constants.js");
const errors_js_1 = require("../errors.js");
const types_js_1 = require("./types.js");
/** TODO: docs */
/**
 * Construct a UiAmountToAmount instruction
 *
 * @param mint         Public key of the mint
 * @param amount       UiAmount of tokens to be converted to Amount
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createUiAmountToAmountInstruction(mint, amount, programId = constants_js_1.TOKEN_PROGRAM_ID) {
    const keys = [{ pubkey: mint, isSigner: false, isWritable: false }];
    const buf = Buffer.from(amount, 'utf8');
    const uiAmountToAmountInstructionData = (0, buffer_layout_1.struct)([
        (0, buffer_layout_1.u8)('instruction'),
        (0, buffer_layout_1.blob)(buf.length, 'amount'),
    ]);
    const data = Buffer.alloc(uiAmountToAmountInstructionData.span);
    uiAmountToAmountInstructionData.encode({
        instruction: types_js_1.TokenInstruction.UiAmountToAmount,
        amount: buf,
    }, data);
    return new web3_js_1.TransactionInstruction({ keys, programId, data });
}
/**
 * Decode a UiAmountToAmount instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
function decodeUiAmountToAmountInstruction(instruction, programId = constants_js_1.TOKEN_PROGRAM_ID) {
    if (!instruction.programId.equals(programId))
        throw new errors_js_1.TokenInvalidInstructionProgramError();
    const uiAmountToAmountInstructionData = (0, buffer_layout_1.struct)([
        (0, buffer_layout_1.u8)('instruction'),
        (0, buffer_layout_1.blob)(instruction.data.length - 1, 'amount'),
    ]);
    if (instruction.data.length !== uiAmountToAmountInstructionData.span)
        throw new errors_js_1.TokenInvalidInstructionDataError();
    const { keys: { mint }, data, } = decodeUiAmountToAmountInstructionUnchecked(instruction);
    if (data.instruction !== types_js_1.TokenInstruction.UiAmountToAmount)
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
 * Decode a UiAmountToAmount instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
function decodeUiAmountToAmountInstructionUnchecked({ programId, keys: [mint], data, }) {
    const uiAmountToAmountInstructionData = (0, buffer_layout_1.struct)([
        (0, buffer_layout_1.u8)('instruction'),
        (0, buffer_layout_1.blob)(data.length - 1, 'amount'),
    ]);
    return {
        programId,
        keys: {
            mint,
        },
        data: uiAmountToAmountInstructionData.decode(data),
    };
}
//# sourceMappingURL=uiAmountToAmount.js.map