"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CPI_GUARD_SIZE = exports.CpiGuardLayout = void 0;
exports.getCpiGuard = getCpiGuard;
const buffer_layout_1 = require("@solana/buffer-layout");
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
const extensionType_js_1 = require("../extensionType.js");
/** Buffer layout for de/serializing a CPI Guard extension */
exports.CpiGuardLayout = (0, buffer_layout_1.struct)([(0, buffer_layout_utils_1.bool)('lockCpi')]);
exports.CPI_GUARD_SIZE = exports.CpiGuardLayout.span;
function getCpiGuard(account) {
    const extensionData = (0, extensionType_js_1.getExtensionData)(extensionType_js_1.ExtensionType.CpiGuard, account.tlvData);
    if (extensionData !== null) {
        return exports.CpiGuardLayout.decode(extensionData);
    }
    else {
        return null;
    }
}
//# sourceMappingURL=state.js.map