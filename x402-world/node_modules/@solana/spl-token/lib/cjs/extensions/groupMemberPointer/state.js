"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GROUP_MEMBER_POINTER_SIZE = exports.GroupMemberPointerLayout = void 0;
exports.getGroupMemberPointerState = getGroupMemberPointerState;
const buffer_layout_1 = require("@solana/buffer-layout");
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
const web3_js_1 = require("@solana/web3.js");
const extensionType_js_1 = require("../extensionType.js");
/** Buffer layout for de/serializing a Group Pointer extension */
exports.GroupMemberPointerLayout = (0, buffer_layout_1.struct)([
    (0, buffer_layout_utils_1.publicKey)('authority'),
    (0, buffer_layout_utils_1.publicKey)('memberAddress'),
]);
exports.GROUP_MEMBER_POINTER_SIZE = exports.GroupMemberPointerLayout.span;
function getGroupMemberPointerState(mint) {
    const extensionData = (0, extensionType_js_1.getExtensionData)(extensionType_js_1.ExtensionType.GroupMemberPointer, mint.tlvData);
    if (extensionData !== null) {
        const { authority, memberAddress } = exports.GroupMemberPointerLayout.decode(extensionData);
        // Explicitly set None/Zero keys to null
        return {
            authority: authority.equals(web3_js_1.PublicKey.default) ? null : authority,
            memberAddress: memberAddress.equals(web3_js_1.PublicKey.default) ? null : memberAddress,
        };
    }
    else {
        return null;
    }
}
//# sourceMappingURL=state.js.map