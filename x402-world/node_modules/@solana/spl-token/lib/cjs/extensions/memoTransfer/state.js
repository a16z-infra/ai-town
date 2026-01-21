"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MEMO_TRANSFER_SIZE = exports.MemoTransferLayout = void 0;
exports.getMemoTransfer = getMemoTransfer;
const buffer_layout_1 = require("@solana/buffer-layout");
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
const extensionType_js_1 = require("../extensionType.js");
/** Buffer layout for de/serializing a memo transfer extension */
exports.MemoTransferLayout = (0, buffer_layout_1.struct)([(0, buffer_layout_utils_1.bool)('requireIncomingTransferMemos')]);
exports.MEMO_TRANSFER_SIZE = exports.MemoTransferLayout.span;
function getMemoTransfer(account) {
    const extensionData = (0, extensionType_js_1.getExtensionData)(extensionType_js_1.ExtensionType.MemoTransfer, account.tlvData);
    if (extensionData !== null) {
        return exports.MemoTransferLayout.decode(extensionData);
    }
    else {
        return null;
    }
}
//# sourceMappingURL=state.js.map