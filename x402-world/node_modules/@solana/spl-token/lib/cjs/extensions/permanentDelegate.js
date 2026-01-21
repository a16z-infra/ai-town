"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERMANENT_DELEGATE_SIZE = exports.PermanentDelegateLayout = void 0;
exports.getPermanentDelegate = getPermanentDelegate;
const buffer_layout_1 = require("@solana/buffer-layout");
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
const extensionType_js_1 = require("./extensionType.js");
/** Buffer layout for de/serializing a mint */
exports.PermanentDelegateLayout = (0, buffer_layout_1.struct)([(0, buffer_layout_utils_1.publicKey)('delegate')]);
exports.PERMANENT_DELEGATE_SIZE = exports.PermanentDelegateLayout.span;
function getPermanentDelegate(mint) {
    const extensionData = (0, extensionType_js_1.getExtensionData)(extensionType_js_1.ExtensionType.PermanentDelegate, mint.tlvData);
    if (extensionData !== null) {
        return exports.PermanentDelegateLayout.decode(extensionData);
    }
    else {
        return null;
    }
}
//# sourceMappingURL=permanentDelegate.js.map