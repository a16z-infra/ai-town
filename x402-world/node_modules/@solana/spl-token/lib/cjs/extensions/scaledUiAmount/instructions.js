"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMultiplierData = exports.initializeScaledUiAmountConfigInstructionData = exports.ScaledUiAmountInstruction = void 0;
exports.createInitializeScaledUiAmountConfigInstruction = createInitializeScaledUiAmountConfigInstruction;
exports.createUpdateMultiplierDataInstruction = createUpdateMultiplierDataInstruction;
const buffer_layout_1 = require("@solana/buffer-layout");
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
const types_js_1 = require("../../instructions/types.js");
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../../constants.js");
const errors_js_1 = require("../../errors.js");
const internal_js_1 = require("../../instructions/internal.js");
var ScaledUiAmountInstruction;
(function (ScaledUiAmountInstruction) {
    ScaledUiAmountInstruction[ScaledUiAmountInstruction["Initialize"] = 0] = "Initialize";
    ScaledUiAmountInstruction[ScaledUiAmountInstruction["UpdateMultiplier"] = 1] = "UpdateMultiplier";
})(ScaledUiAmountInstruction || (exports.ScaledUiAmountInstruction = ScaledUiAmountInstruction = {}));
exports.initializeScaledUiAmountConfigInstructionData = (0, buffer_layout_1.struct)([
    (0, buffer_layout_1.u8)('instruction'),
    (0, buffer_layout_1.u8)('scaledUiAmountInstruction'),
    (0, buffer_layout_utils_1.publicKey)('authority'),
    (0, buffer_layout_1.f64)('multiplier'),
]);
/**
 * Construct an InitializeScaledUiAmountConfig instruction
 *
 * @param mint         Token mint account
 * @param authority    Optional authority that can update the multipliers
 * @param signers      The signer account(s)
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createInitializeScaledUiAmountConfigInstruction(mint, authority, multiplier, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
    if (!(0, constants_js_1.programSupportsExtensions)(programId)) {
        throw new errors_js_1.TokenUnsupportedInstructionError();
    }
    const keys = [{ pubkey: mint, isSigner: false, isWritable: true }];
    const data = Buffer.alloc(exports.initializeScaledUiAmountConfigInstructionData.span);
    exports.initializeScaledUiAmountConfigInstructionData.encode({
        instruction: types_js_1.TokenInstruction.ScaledUiAmountExtension,
        scaledUiAmountInstruction: ScaledUiAmountInstruction.Initialize,
        authority: authority !== null && authority !== void 0 ? authority : web3_js_1.PublicKey.default,
        multiplier: multiplier,
    }, data);
    return new web3_js_1.TransactionInstruction({ keys, programId, data });
}
exports.updateMultiplierData = (0, buffer_layout_1.struct)([
    (0, buffer_layout_1.u8)('instruction'),
    (0, buffer_layout_1.u8)('scaledUiAmountInstruction'),
    (0, buffer_layout_1.f64)('multiplier'),
    (0, buffer_layout_utils_1.u64)('effectiveTimestamp'),
]);
/**
 * Construct an UpdateMultiplierData instruction
 *
 * @param mint                  Token mint account
 * @param authority             Optional authority that can update the multipliers
 * @param multiplier            New multiplier
 * @param effectiveTimestamp    Effective time stamp for the new multiplier
 * @param multiSigners          Signing accounts if `owner` is a multisig
 * @param programId             SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createUpdateMultiplierDataInstruction(mint, authority, multiplier, effectiveTimestamp, multiSigners = [], programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
    if (!(0, constants_js_1.programSupportsExtensions)(programId)) {
        throw new errors_js_1.TokenUnsupportedInstructionError();
    }
    const keys = (0, internal_js_1.addSigners)([{ pubkey: mint, isSigner: false, isWritable: true }], authority, multiSigners);
    const data = Buffer.alloc(exports.updateMultiplierData.span);
    exports.updateMultiplierData.encode({
        instruction: types_js_1.TokenInstruction.ScaledUiAmountExtension,
        scaledUiAmountInstruction: ScaledUiAmountInstruction.UpdateMultiplier,
        multiplier,
        effectiveTimestamp,
    }, data);
    return new web3_js_1.TransactionInstruction({ keys, programId, data });
}
//# sourceMappingURL=instructions.js.map