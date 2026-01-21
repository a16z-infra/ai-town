"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cpiGuardInstructionData = exports.CpiGuardInstruction = void 0;
exports.createEnableCpiGuardInstruction = createEnableCpiGuardInstruction;
exports.createDisableCpiGuardInstruction = createDisableCpiGuardInstruction;
const buffer_layout_1 = require("@solana/buffer-layout");
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../../constants.js");
const errors_js_1 = require("../../errors.js");
const internal_js_1 = require("../../instructions/internal.js");
const types_js_1 = require("../../instructions/types.js");
var CpiGuardInstruction;
(function (CpiGuardInstruction) {
    CpiGuardInstruction[CpiGuardInstruction["Enable"] = 0] = "Enable";
    CpiGuardInstruction[CpiGuardInstruction["Disable"] = 1] = "Disable";
})(CpiGuardInstruction || (exports.CpiGuardInstruction = CpiGuardInstruction = {}));
/** TODO: docs */
exports.cpiGuardInstructionData = (0, buffer_layout_1.struct)([(0, buffer_layout_1.u8)('instruction'), (0, buffer_layout_1.u8)('cpiGuardInstruction')]);
/**
 * Construct an EnableCpiGuard instruction
 *
 * @param account         Token account to update
 * @param authority       The account's owner/delegate
 * @param signers         The signer account(s)
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createEnableCpiGuardInstruction(account, authority, multiSigners = [], programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
    return createCpiGuardInstruction(CpiGuardInstruction.Enable, account, authority, multiSigners, programId);
}
/**
 * Construct a DisableCpiGuard instruction
 *
 * @param account         Token account to update
 * @param authority       The account's owner/delegate
 * @param signers         The signer account(s)
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createDisableCpiGuardInstruction(account, authority, multiSigners = [], programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
    return createCpiGuardInstruction(CpiGuardInstruction.Disable, account, authority, multiSigners, programId);
}
function createCpiGuardInstruction(cpiGuardInstruction, account, authority, multiSigners, programId) {
    if (!(0, constants_js_1.programSupportsExtensions)(programId)) {
        throw new errors_js_1.TokenUnsupportedInstructionError();
    }
    const keys = (0, internal_js_1.addSigners)([{ pubkey: account, isSigner: false, isWritable: true }], authority, multiSigners);
    const data = Buffer.alloc(exports.cpiGuardInstructionData.span);
    exports.cpiGuardInstructionData.encode({
        instruction: types_js_1.TokenInstruction.CpiGuardExtension,
        cpiGuardInstruction,
    }, data);
    return new web3_js_1.TransactionInstruction({ keys, programId, data });
}
//# sourceMappingURL=instructions.js.map