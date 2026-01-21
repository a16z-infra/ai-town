"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_ACCOUNT_STATE_SIZE = exports.DefaultAccountStateLayout = void 0;
exports.getDefaultAccountState = getDefaultAccountState;
const buffer_layout_1 = require("@solana/buffer-layout");
const extensionType_js_1 = require("../extensionType.js");
/** Buffer layout for de/serializing a transfer fee config extension */
exports.DefaultAccountStateLayout = (0, buffer_layout_1.struct)([(0, buffer_layout_1.u8)('state')]);
exports.DEFAULT_ACCOUNT_STATE_SIZE = exports.DefaultAccountStateLayout.span;
function getDefaultAccountState(mint) {
    const extensionData = (0, extensionType_js_1.getExtensionData)(extensionType_js_1.ExtensionType.DefaultAccountState, mint.tlvData);
    if (extensionData !== null) {
        return exports.DefaultAccountStateLayout.decode(extensionData);
    }
    else {
        return null;
    }
}
//# sourceMappingURL=state.js.map