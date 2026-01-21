"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IMMUTABLE_OWNER_SIZE = exports.ImmutableOwnerLayout = void 0;
exports.getImmutableOwner = getImmutableOwner;
const buffer_layout_1 = require("@solana/buffer-layout");
const extensionType_js_1 = require("./extensionType.js");
/** Buffer layout for de/serializing an account */
exports.ImmutableOwnerLayout = (0, buffer_layout_1.struct)([]);
exports.IMMUTABLE_OWNER_SIZE = exports.ImmutableOwnerLayout.span;
function getImmutableOwner(account) {
    const extensionData = (0, extensionType_js_1.getExtensionData)(extensionType_js_1.ExtensionType.ImmutableOwner, account.tlvData);
    if (extensionData !== null) {
        return exports.ImmutableOwnerLayout.decode(extensionData);
    }
    else {
        return null;
    }
}
//# sourceMappingURL=immutableOwner.js.map