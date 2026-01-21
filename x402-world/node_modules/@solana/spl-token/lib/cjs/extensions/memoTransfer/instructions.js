"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoTransferInstructionData = exports.MemoTransferInstruction = void 0;
exports.createEnableRequiredMemoTransfersInstruction = createEnableRequiredMemoTransfersInstruction;
exports.createDisableRequiredMemoTransfersInstruction = createDisableRequiredMemoTransfersInstruction;
const buffer_layout_1 = require("@solana/buffer-layout");
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../../constants.js");
const errors_js_1 = require("../../errors.js");
const internal_js_1 = require("../../instructions/internal.js");
const types_js_1 = require("../../instructions/types.js");
var MemoTransferInstruction;
(function (MemoTransferInstruction) {
    MemoTransferInstruction[MemoTransferInstruction["Enable"] = 0] = "Enable";
    MemoTransferInstruction[MemoTransferInstruction["Disable"] = 1] = "Disable";
})(MemoTransferInstruction || (exports.MemoTransferInstruction = MemoTransferInstruction = {}));
/** TODO: docs */
exports.memoTransferInstructionData = (0, buffer_layout_1.struct)([
    (0, buffer_layout_1.u8)('instruction'),
    (0, buffer_layout_1.u8)('memoTransferInstruction'),
]);
/**
 * Construct an EnableRequiredMemoTransfers instruction
 *
 * @param account         Token account to update
 * @param authority       The account's owner/delegate
 * @param signers         The signer account(s)
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createEnableRequiredMemoTransfersInstruction(account, authority, multiSigners = [], programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
    return createMemoTransferInstruction(MemoTransferInstruction.Enable, account, authority, multiSigners, programId);
}
/**
 * Construct a DisableMemoTransfer instruction
 *
 * @param account         Token account to update
 * @param authority       The account's owner/delegate
 * @param signers         The signer account(s)
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createDisableRequiredMemoTransfersInstruction(account, authority, multiSigners = [], programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
    return createMemoTransferInstruction(MemoTransferInstruction.Disable, account, authority, multiSigners, programId);
}
function createMemoTransferInstruction(memoTransferInstruction, account, authority, multiSigners, programId) {
    if (!(0, constants_js_1.programSupportsExtensions)(programId)) {
        throw new errors_js_1.TokenUnsupportedInstructionError();
    }
    const keys = (0, internal_js_1.addSigners)([{ pubkey: account, isSigner: false, isWritable: true }], authority, multiSigners);
    const data = Buffer.alloc(exports.memoTransferInstructionData.span);
    exports.memoTransferInstructionData.encode({
        instruction: types_js_1.TokenInstruction.MemoTransferExtension,
        memoTransferInstruction,
    }, data);
    return new web3_js_1.TransactionInstruction({ keys, programId, data });
}
//# sourceMappingURL=instructions.js.map