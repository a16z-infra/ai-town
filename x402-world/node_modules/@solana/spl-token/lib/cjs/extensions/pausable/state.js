"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAUSABLE_ACCOUNT_SIZE = exports.PausableAccountLayout = exports.PAUSABLE_CONFIG_SIZE = exports.PausableConfigLayout = void 0;
exports.getPausableConfig = getPausableConfig;
exports.getPausableAccount = getPausableAccount;
const buffer_layout_1 = require("@solana/buffer-layout");
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
const extensionType_js_1 = require("../extensionType.js");
/** Buffer layout for de/serializing a pausable config */
exports.PausableConfigLayout = (0, buffer_layout_1.struct)([(0, buffer_layout_utils_1.publicKey)('authority'), (0, buffer_layout_utils_1.bool)('paused')]);
exports.PAUSABLE_CONFIG_SIZE = exports.PausableConfigLayout.span;
function getPausableConfig(mint) {
    const extensionData = (0, extensionType_js_1.getExtensionData)(extensionType_js_1.ExtensionType.PausableConfig, mint.tlvData);
    if (extensionData !== null) {
        return exports.PausableConfigLayout.decode(extensionData);
    }
    else {
        return null;
    }
}
/** Buffer layout for de/serializing a pausable account */
exports.PausableAccountLayout = (0, buffer_layout_1.struct)([]); // esline-disable-line
exports.PAUSABLE_ACCOUNT_SIZE = exports.PausableAccountLayout.span;
function getPausableAccount(account) {
    const extensionData = (0, extensionType_js_1.getExtensionData)(extensionType_js_1.ExtensionType.PausableAccount, account.tlvData);
    if (extensionData !== null) {
        return exports.PausableAccountLayout.decode(extensionData);
    }
    else {
        return null;
    }
}
//# sourceMappingURL=state.js.map