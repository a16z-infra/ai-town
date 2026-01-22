"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GROUP_POINTER_SIZE = exports.GroupPointerLayout = void 0;
exports.getGroupPointerState = getGroupPointerState;
const buffer_layout_1 = require("@solana/buffer-layout");
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
const web3_js_1 = require("@solana/web3.js");
const extensionType_js_1 = require("../extensionType.js");
/** Buffer layout for de/serializing a GroupPointer extension */
exports.GroupPointerLayout = (0, buffer_layout_1.struct)([
    (0, buffer_layout_utils_1.publicKey)('authority'),
    (0, buffer_layout_utils_1.publicKey)('groupAddress'),
]);
exports.GROUP_POINTER_SIZE = exports.GroupPointerLayout.span;
function getGroupPointerState(mint) {
    const extensionData = (0, extensionType_js_1.getExtensionData)(extensionType_js_1.ExtensionType.GroupPointer, mint.tlvData);
    if (extensionData !== null) {
        const { authority, groupAddress } = exports.GroupPointerLayout.decode(extensionData);
        // Explicitly set None/Zero keys to null
        return {
            authority: authority.equals(web3_js_1.PublicKey.default) ? null : authority,
            groupAddress: groupAddress.equals(web3_js_1.PublicKey.default) ? null : groupAddress,
        };
    }
    else {
        return null;
    }
}
//# sourceMappingURL=state.js.map