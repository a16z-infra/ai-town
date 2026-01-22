"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resumeInstructionData = exports.pauseInstructionData = exports.initializePausableConfigInstructionData = exports.PausableInstruction = void 0;
exports.createInitializePausableConfigInstruction = createInitializePausableConfigInstruction;
exports.createPauseInstruction = createPauseInstruction;
exports.createResumeInstruction = createResumeInstruction;
const buffer_layout_1 = require("@solana/buffer-layout");
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../../constants.js");
const errors_js_1 = require("../../errors.js");
const types_js_1 = require("../../instructions/types.js");
const internal_js_1 = require("../../instructions/internal.js");
var PausableInstruction;
(function (PausableInstruction) {
    PausableInstruction[PausableInstruction["Initialize"] = 0] = "Initialize";
    PausableInstruction[PausableInstruction["Pause"] = 1] = "Pause";
    PausableInstruction[PausableInstruction["Resume"] = 2] = "Resume";
})(PausableInstruction || (exports.PausableInstruction = PausableInstruction = {}));
exports.initializePausableConfigInstructionData = (0, buffer_layout_1.struct)([
    (0, buffer_layout_1.u8)('instruction'),
    (0, buffer_layout_1.u8)('pausableInstruction'),
    (0, buffer_layout_utils_1.publicKey)('authority'),
]);
/**
 * Construct a InitializePausableConfig instruction
 *
 * @param mint          Token mint account
 * @param authority     Optional authority that can pause or resume mint
 * @param programId     SPL Token program account
 */
function createInitializePausableConfigInstruction(mint, authority, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
    if (!(0, constants_js_1.programSupportsExtensions)(programId)) {
        throw new errors_js_1.TokenUnsupportedInstructionError();
    }
    const keys = [{ pubkey: mint, isSigner: false, isWritable: true }];
    const data = Buffer.alloc(exports.initializePausableConfigInstructionData.span);
    exports.initializePausableConfigInstructionData.encode({
        instruction: types_js_1.TokenInstruction.PausableExtension,
        pausableInstruction: PausableInstruction.Initialize,
        authority: authority !== null && authority !== void 0 ? authority : web3_js_1.PublicKey.default,
    }, data);
    return new web3_js_1.TransactionInstruction({ keys, programId, data: data });
}
exports.pauseInstructionData = (0, buffer_layout_1.struct)([(0, buffer_layout_1.u8)('instruction'), (0, buffer_layout_1.u8)('pausableInstruction')]);
/**
 * Construct a Pause instruction
 *
 * @param mint          Token mint account
 * @param authority     The pausable mint's authority
 * @param multiSigners  Signing accounts if authority is a multisig
 * @param programId     SPL Token program account
 */
function createPauseInstruction(mint, authority, multiSigners = [], programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
    if (!(0, constants_js_1.programSupportsExtensions)(programId)) {
        throw new errors_js_1.TokenUnsupportedInstructionError();
    }
    const keys = (0, internal_js_1.addSigners)([{ pubkey: mint, isSigner: false, isWritable: true }], authority, multiSigners);
    const data = Buffer.alloc(exports.pauseInstructionData.span);
    exports.pauseInstructionData.encode({
        instruction: types_js_1.TokenInstruction.PausableExtension,
        pausableInstruction: PausableInstruction.Pause,
    }, data);
    return new web3_js_1.TransactionInstruction({ keys, programId, data: data });
}
exports.resumeInstructionData = (0, buffer_layout_1.struct)([(0, buffer_layout_1.u8)('instruction'), (0, buffer_layout_1.u8)('pausableInstruction')]);
/**
 * Construct a Resume instruction
 *
 * @param mint          Token mint account
 * @param authority     The pausable mint's authority
 * @param multiSigners  Signing accounts if authority is a multisig
 * @param programId     SPL Token program account
 */
function createResumeInstruction(mint, authority, multiSigners = [], programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
    if (!(0, constants_js_1.programSupportsExtensions)(programId)) {
        throw new errors_js_1.TokenUnsupportedInstructionError();
    }
    const keys = (0, internal_js_1.addSigners)([{ pubkey: mint, isSigner: false, isWritable: true }], authority, multiSigners);
    const data = Buffer.alloc(exports.resumeInstructionData.span);
    exports.resumeInstructionData.encode({
        instruction: types_js_1.TokenInstruction.PausableExtension,
        pausableInstruction: PausableInstruction.Resume,
    }, data);
    return new web3_js_1.TransactionInstruction({ keys, programId, data: data });
}
//# sourceMappingURL=instructions.js.map