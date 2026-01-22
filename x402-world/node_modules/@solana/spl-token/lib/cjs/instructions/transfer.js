"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferInstructionData = void 0;
exports.createTransferInstruction = createTransferInstruction;
exports.decodeTransferInstruction = decodeTransferInstruction;
exports.decodeTransferInstructionUnchecked = decodeTransferInstructionUnchecked;
const buffer_layout_1 = require("@solana/buffer-layout");
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../constants.js");
const errors_js_1 = require("../errors.js");
const internal_js_1 = require("./internal.js");
const types_js_1 = require("./types.js");
/** TODO: docs */
exports.transferInstructionData = (0, buffer_layout_1.struct)([(0, buffer_layout_1.u8)('instruction'), (0, buffer_layout_utils_1.u64)('amount')]);
/**
 * Construct a Transfer instruction
 *
 * @param source       Source account
 * @param destination  Destination account
 * @param owner        Owner of the source account
 * @param amount       Number of tokens to transfer
 * @param multiSigners Signing accounts if `owner` is a multisig
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createTransferInstruction(source, destination, owner, amount, multiSigners = [], programId = constants_js_1.TOKEN_PROGRAM_ID) {
    const keys = (0, internal_js_1.addSigners)([
        { pubkey: source, isSigner: false, isWritable: true },
        { pubkey: destination, isSigner: false, isWritable: true },
    ], owner, multiSigners);
    const data = Buffer.alloc(exports.transferInstructionData.span);
    exports.transferInstructionData.encode({
        instruction: types_js_1.TokenInstruction.Transfer,
        amount: BigInt(amount),
    }, data);
    return new web3_js_1.TransactionInstruction({ keys, programId, data });
}
/**
 * Decode a Transfer instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
function decodeTransferInstruction(instruction, programId = constants_js_1.TOKEN_PROGRAM_ID) {
    if (!instruction.programId.equals(programId))
        throw new errors_js_1.TokenInvalidInstructionProgramError();
    if (instruction.data.length !== exports.transferInstructionData.span)
        throw new errors_js_1.TokenInvalidInstructionDataError();
    const { keys: { source, destination, owner, multiSigners }, data, } = decodeTransferInstructionUnchecked(instruction);
    if (data.instruction !== types_js_1.TokenInstruction.Transfer)
        throw new errors_js_1.TokenInvalidInstructionTypeError();
    if (!source || !destination || !owner)
        throw new errors_js_1.TokenInvalidInstructionKeysError();
    // TODO: key checks?
    return {
        programId,
        keys: {
            source,
            destination,
            owner,
            multiSigners,
        },
        data,
    };
}
/**
 * Decode a Transfer instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
function decodeTransferInstructionUnchecked({ programId, keys: [source, destination, owner, ...multiSigners], data, }) {
    return {
        programId,
        keys: {
            source,
            destination,
            owner,
            multiSigners,
        },
        data: exports.transferInstructionData.decode(data),
    };
}
//# sourceMappingURL=transfer.js.map