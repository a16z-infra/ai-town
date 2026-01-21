"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultAccountStateInstructionData = exports.DefaultAccountStateInstruction = void 0;
exports.createInitializeDefaultAccountStateInstruction = createInitializeDefaultAccountStateInstruction;
exports.createUpdateDefaultAccountStateInstruction = createUpdateDefaultAccountStateInstruction;
const buffer_layout_1 = require("@solana/buffer-layout");
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../../constants.js");
const errors_js_1 = require("../../errors.js");
const internal_js_1 = require("../../instructions/internal.js");
const types_js_1 = require("../../instructions/types.js");
var DefaultAccountStateInstruction;
(function (DefaultAccountStateInstruction) {
    DefaultAccountStateInstruction[DefaultAccountStateInstruction["Initialize"] = 0] = "Initialize";
    DefaultAccountStateInstruction[DefaultAccountStateInstruction["Update"] = 1] = "Update";
})(DefaultAccountStateInstruction || (exports.DefaultAccountStateInstruction = DefaultAccountStateInstruction = {}));
/** TODO: docs */
exports.defaultAccountStateInstructionData = (0, buffer_layout_1.struct)([
    (0, buffer_layout_1.u8)('instruction'),
    (0, buffer_layout_1.u8)('defaultAccountStateInstruction'),
    (0, buffer_layout_1.u8)('accountState'),
]);
/**
 * Construct an InitializeDefaultAccountState instruction
 *
 * @param mint         Mint to initialize
 * @param accountState Default account state to set on all new accounts
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createInitializeDefaultAccountStateInstruction(mint, accountState, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
    if (!(0, constants_js_1.programSupportsExtensions)(programId)) {
        throw new errors_js_1.TokenUnsupportedInstructionError();
    }
    const keys = [{ pubkey: mint, isSigner: false, isWritable: true }];
    const data = Buffer.alloc(exports.defaultAccountStateInstructionData.span);
    exports.defaultAccountStateInstructionData.encode({
        instruction: types_js_1.TokenInstruction.DefaultAccountStateExtension,
        defaultAccountStateInstruction: DefaultAccountStateInstruction.Initialize,
        accountState,
    }, data);
    return new web3_js_1.TransactionInstruction({ keys, programId, data });
}
/**
 * Construct an UpdateDefaultAccountState instruction
 *
 * @param mint         Mint to update
 * @param accountState    Default account state to set on all accounts
 * @param freezeAuthority       The mint's freeze authority
 * @param signers         The signer account(s) for a multisig
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createUpdateDefaultAccountStateInstruction(mint, accountState, freezeAuthority, multiSigners = [], programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
    if (!(0, constants_js_1.programSupportsExtensions)(programId)) {
        throw new errors_js_1.TokenUnsupportedInstructionError();
    }
    const keys = (0, internal_js_1.addSigners)([{ pubkey: mint, isSigner: false, isWritable: true }], freezeAuthority, multiSigners);
    const data = Buffer.alloc(exports.defaultAccountStateInstructionData.span);
    exports.defaultAccountStateInstructionData.encode({
        instruction: types_js_1.TokenInstruction.DefaultAccountStateExtension,
        defaultAccountStateInstruction: DefaultAccountStateInstruction.Update,
        accountState,
    }, data);
    return new web3_js_1.TransactionInstruction({ keys, programId, data });
}
//# sourceMappingURL=instructions.js.map