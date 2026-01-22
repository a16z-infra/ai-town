"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncNativeInstructionData = void 0;
exports.createSyncNativeInstruction = createSyncNativeInstruction;
exports.decodeSyncNativeInstruction = decodeSyncNativeInstruction;
exports.decodeSyncNativeInstructionUnchecked = decodeSyncNativeInstructionUnchecked;
const buffer_layout_1 = require("@solana/buffer-layout");
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../constants.js");
const errors_js_1 = require("../errors.js");
const types_js_1 = require("./types.js");
/** TODO: docs */
exports.syncNativeInstructionData = (0, buffer_layout_1.struct)([(0, buffer_layout_1.u8)('instruction')]);
/**
 * Construct a SyncNative instruction
 *
 * @param account   Native account to sync lamports from
 * @param programId SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createSyncNativeInstruction(account, programId = constants_js_1.TOKEN_PROGRAM_ID) {
    const keys = [{ pubkey: account, isSigner: false, isWritable: true }];
    const data = Buffer.alloc(exports.syncNativeInstructionData.span);
    exports.syncNativeInstructionData.encode({ instruction: types_js_1.TokenInstruction.SyncNative }, data);
    return new web3_js_1.TransactionInstruction({ keys, programId, data });
}
/**
 * Decode a SyncNative instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
function decodeSyncNativeInstruction(instruction, programId = constants_js_1.TOKEN_PROGRAM_ID) {
    if (!instruction.programId.equals(programId))
        throw new errors_js_1.TokenInvalidInstructionProgramError();
    if (instruction.data.length !== exports.syncNativeInstructionData.span)
        throw new errors_js_1.TokenInvalidInstructionDataError();
    const { keys: { account }, data, } = decodeSyncNativeInstructionUnchecked(instruction);
    if (data.instruction !== types_js_1.TokenInstruction.SyncNative)
        throw new errors_js_1.TokenInvalidInstructionTypeError();
    if (!account)
        throw new errors_js_1.TokenInvalidInstructionKeysError();
    // TODO: key checks?
    return {
        programId,
        keys: {
            account,
        },
        data,
    };
}
/**
 * Decode a SyncNative instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
function decodeSyncNativeInstructionUnchecked({ programId, keys: [account], data, }) {
    return {
        programId,
        keys: {
            account,
        },
        data: exports.syncNativeInstructionData.decode(data),
    };
}
//# sourceMappingURL=syncNative.js.map