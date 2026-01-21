"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateGroupPointerData = exports.initializeGroupPointerData = exports.GroupPointerInstruction = void 0;
exports.createInitializeGroupPointerInstruction = createInitializeGroupPointerInstruction;
exports.createUpdateGroupPointerInstruction = createUpdateGroupPointerInstruction;
const buffer_layout_1 = require("@solana/buffer-layout");
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../../constants.js");
const errors_js_1 = require("../../errors.js");
const types_js_1 = require("../../instructions/types.js");
const internal_js_1 = require("../../instructions/internal.js");
var GroupPointerInstruction;
(function (GroupPointerInstruction) {
    GroupPointerInstruction[GroupPointerInstruction["Initialize"] = 0] = "Initialize";
    GroupPointerInstruction[GroupPointerInstruction["Update"] = 1] = "Update";
})(GroupPointerInstruction || (exports.GroupPointerInstruction = GroupPointerInstruction = {}));
exports.initializeGroupPointerData = (0, buffer_layout_1.struct)([
    // prettier-ignore
    (0, buffer_layout_1.u8)('instruction'),
    (0, buffer_layout_1.u8)('groupPointerInstruction'),
    (0, buffer_layout_utils_1.publicKey)('authority'),
    (0, buffer_layout_utils_1.publicKey)('groupAddress'),
]);
/**
 * Construct an Initialize GroupPointer instruction
 *
 * @param mint            Token mint account
 * @param authority       Optional Authority that can set the group address
 * @param groupAddress    Optional Account address that holds the group
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createInitializeGroupPointerInstruction(mint, authority, groupAddress, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
    if (!(0, constants_js_1.programSupportsExtensions)(programId)) {
        throw new errors_js_1.TokenUnsupportedInstructionError();
    }
    const keys = [{ pubkey: mint, isSigner: false, isWritable: true }];
    const data = Buffer.alloc(exports.initializeGroupPointerData.span);
    exports.initializeGroupPointerData.encode({
        instruction: types_js_1.TokenInstruction.GroupPointerExtension,
        groupPointerInstruction: GroupPointerInstruction.Initialize,
        authority: authority !== null && authority !== void 0 ? authority : web3_js_1.PublicKey.default,
        groupAddress: groupAddress !== null && groupAddress !== void 0 ? groupAddress : web3_js_1.PublicKey.default,
    }, data);
    return new web3_js_1.TransactionInstruction({ keys, programId, data: data });
}
exports.updateGroupPointerData = (0, buffer_layout_1.struct)([
    // prettier-ignore
    (0, buffer_layout_1.u8)('instruction'),
    (0, buffer_layout_1.u8)('groupPointerInstruction'),
    (0, buffer_layout_utils_1.publicKey)('groupAddress'),
]);
function createUpdateGroupPointerInstruction(mint, authority, groupAddress, multiSigners = [], programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
    if (!(0, constants_js_1.programSupportsExtensions)(programId)) {
        throw new errors_js_1.TokenUnsupportedInstructionError();
    }
    const keys = (0, internal_js_1.addSigners)([{ pubkey: mint, isSigner: false, isWritable: true }], authority, multiSigners);
    const data = Buffer.alloc(exports.updateGroupPointerData.span);
    exports.updateGroupPointerData.encode({
        instruction: types_js_1.TokenInstruction.GroupPointerExtension,
        groupPointerInstruction: GroupPointerInstruction.Update,
        groupAddress: groupAddress !== null && groupAddress !== void 0 ? groupAddress : web3_js_1.PublicKey.default,
    }, data);
    return new web3_js_1.TransactionInstruction({ keys, programId, data: data });
}
//# sourceMappingURL=instructions.js.map