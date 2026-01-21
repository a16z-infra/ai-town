"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MINT_CLOSE_AUTHORITY_SIZE = exports.MintCloseAuthorityLayout = void 0;
exports.getMintCloseAuthority = getMintCloseAuthority;
const buffer_layout_1 = require("@solana/buffer-layout");
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
const extensionType_js_1 = require("./extensionType.js");
/** Buffer layout for de/serializing a mint */
exports.MintCloseAuthorityLayout = (0, buffer_layout_1.struct)([(0, buffer_layout_utils_1.publicKey)('closeAuthority')]);
exports.MINT_CLOSE_AUTHORITY_SIZE = exports.MintCloseAuthorityLayout.span;
function getMintCloseAuthority(mint) {
    const extensionData = (0, extensionType_js_1.getExtensionData)(extensionType_js_1.ExtensionType.MintCloseAuthority, mint.tlvData);
    if (extensionData !== null) {
        return exports.MintCloseAuthorityLayout.decode(extensionData);
    }
    else {
        return null;
    }
}
//# sourceMappingURL=mintCloseAuthority.js.map