"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateGroupMemberPointerData = exports.initializeGroupMemberPointerData = exports.GroupMemberPointerInstruction = void 0;
exports.createInitializeGroupMemberPointerInstruction = createInitializeGroupMemberPointerInstruction;
exports.createUpdateGroupMemberPointerInstruction = createUpdateGroupMemberPointerInstruction;
const buffer_layout_1 = require("@solana/buffer-layout");
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../../constants.js");
const errors_js_1 = require("../../errors.js");
const types_js_1 = require("../../instructions/types.js");
const internal_js_1 = require("../../instructions/internal.js");
var GroupMemberPointerInstruction;
(function (GroupMemberPointerInstruction) {
    GroupMemberPointerInstruction[GroupMemberPointerInstruction["Initialize"] = 0] = "Initialize";
    GroupMemberPointerInstruction[GroupMemberPointerInstruction["Update"] = 1] = "Update";
})(GroupMemberPointerInstruction || (exports.GroupMemberPointerInstruction = GroupMemberPointerInstruction = {}));
exports.initializeGroupMemberPointerData = (0, buffer_layout_1.struct)([
    // prettier-ignore
    (0, buffer_layout_1.u8)('instruction'),
    (0, buffer_layout_1.u8)('groupMemberPointerInstruction'),
    (0, buffer_layout_utils_1.publicKey)('authority'),
    (0, buffer_layout_utils_1.publicKey)('memberAddress'),
]);
/**
 * Construct an Initialize GroupMemberPointer instruction
 *
 * @param mint            Token mint account
 * @param authority       Optional Authority that can set the member address
 * @param memberAddress   Optional Account address that holds the member
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createInitializeGroupMemberPointerInstruction(mint, authority, memberAddress, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
    if (!(0, constants_js_1.programSupportsExtensions)(programId)) {
        throw new errors_js_1.TokenUnsupportedInstructionError();
    }
    const keys = [{ pubkey: mint, isSigner: false, isWritable: true }];
    const data = Buffer.alloc(exports.initializeGroupMemberPointerData.span);
    exports.initializeGroupMemberPointerData.encode({
        instruction: types_js_1.TokenInstruction.GroupMemberPointerExtension,
        groupMemberPointerInstruction: GroupMemberPointerInstruction.Initialize,
        authority: authority !== null && authority !== void 0 ? authority : web3_js_1.PublicKey.default,
        memberAddress: memberAddress !== null && memberAddress !== void 0 ? memberAddress : web3_js_1.PublicKey.default,
    }, data);
    return new web3_js_1.TransactionInstruction({ keys, programId, data: data });
}
exports.updateGroupMemberPointerData = (0, buffer_layout_1.struct)([
    // prettier-ignore
    (0, buffer_layout_1.u8)('instruction'),
    (0, buffer_layout_1.u8)('groupMemberPointerInstruction'),
    (0, buffer_layout_utils_1.publicKey)('memberAddress'),
]);
function createUpdateGroupMemberPointerInstruction(mint, authority, memberAddress, multiSigners = [], programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
    if (!(0, constants_js_1.programSupportsExtensions)(programId)) {
        throw new errors_js_1.TokenUnsupportedInstructionError();
    }
    const keys = (0, internal_js_1.addSigners)([{ pubkey: mint, isSigner: false, isWritable: true }], authority, multiSigners);
    const data = Buffer.alloc(exports.updateGroupMemberPointerData.span);
    exports.updateGroupMemberPointerData.encode({
        instruction: types_js_1.TokenInstruction.GroupMemberPointerExtension,
        groupMemberPointerInstruction: GroupMemberPointerInstruction.Update,
        memberAddress: memberAddress !== null && memberAddress !== void 0 ? memberAddress : web3_js_1.PublicKey.default,
    }, data);
    return new web3_js_1.TransactionInstruction({ keys, programId, data: data });
}
//# sourceMappingURL=instructions.js.map