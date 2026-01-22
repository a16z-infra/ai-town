"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.METADATA_POINTER_SIZE = exports.MetadataPointerLayout = void 0;
exports.getMetadataPointerState = getMetadataPointerState;
const buffer_layout_1 = require("@solana/buffer-layout");
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
const web3_js_1 = require("@solana/web3.js");
const extensionType_js_1 = require("../extensionType.js");
/** Buffer layout for de/serializing a Metadata Pointer extension */
exports.MetadataPointerLayout = (0, buffer_layout_1.struct)([
    (0, buffer_layout_utils_1.publicKey)('authority'),
    (0, buffer_layout_utils_1.publicKey)('metadataAddress'),
]);
exports.METADATA_POINTER_SIZE = exports.MetadataPointerLayout.span;
function getMetadataPointerState(mint) {
    const extensionData = (0, extensionType_js_1.getExtensionData)(extensionType_js_1.ExtensionType.MetadataPointer, mint.tlvData);
    if (extensionData !== null) {
        const { authority, metadataAddress } = exports.MetadataPointerLayout.decode(extensionData);
        // Explicitly set None/Zero keys to null
        return {
            authority: authority.equals(web3_js_1.PublicKey.default) ? null : authority,
            metadataAddress: metadataAddress.equals(web3_js_1.PublicKey.default) ? null : metadataAddress,
        };
    }
    else {
        return null;
    }
}
//# sourceMappingURL=state.js.map