"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NON_TRANSFERABLE_ACCOUNT_SIZE = exports.NON_TRANSFERABLE_SIZE = exports.NonTransferableLayout = void 0;
exports.getNonTransferable = getNonTransferable;
exports.getNonTransferableAccount = getNonTransferableAccount;
const buffer_layout_1 = require("@solana/buffer-layout");
const extensionType_js_1 = require("./extensionType.js");
/** Buffer layout for de/serializing an account */
exports.NonTransferableLayout = (0, buffer_layout_1.struct)([]);
exports.NON_TRANSFERABLE_SIZE = exports.NonTransferableLayout.span;
exports.NON_TRANSFERABLE_ACCOUNT_SIZE = exports.NonTransferableLayout.span;
function getNonTransferable(mint) {
    const extensionData = (0, extensionType_js_1.getExtensionData)(extensionType_js_1.ExtensionType.NonTransferable, mint.tlvData);
    if (extensionData !== null) {
        return exports.NonTransferableLayout.decode(extensionData);
    }
    else {
        return null;
    }
}
function getNonTransferableAccount(account) {
    const extensionData = (0, extensionType_js_1.getExtensionData)(extensionType_js_1.ExtensionType.NonTransferableAccount, account.tlvData);
    if (extensionData !== null) {
        return exports.NonTransferableLayout.decode(extensionData);
    }
    else {
        return null;
    }
}
//# sourceMappingURL=nonTransferable.js.map