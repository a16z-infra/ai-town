"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCALED_UI_AMOUNT_CONFIG_SIZE = exports.ScaledUiAmountConfigLayout = void 0;
exports.getScaledUiAmountConfig = getScaledUiAmountConfig;
const buffer_layout_1 = require("@solana/buffer-layout");
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
const extensionType_js_1 = require("../extensionType.js");
exports.ScaledUiAmountConfigLayout = (0, buffer_layout_1.struct)([
    (0, buffer_layout_utils_1.publicKey)('authority'),
    (0, buffer_layout_1.f64)('multiplier'),
    (0, buffer_layout_utils_1.u64)('newMultiplierEffectiveTimestamp'),
    (0, buffer_layout_1.f64)('newMultiplier'),
]);
exports.SCALED_UI_AMOUNT_CONFIG_SIZE = exports.ScaledUiAmountConfigLayout.span;
function getScaledUiAmountConfig(mint) {
    const extensionData = (0, extensionType_js_1.getExtensionData)(extensionType_js_1.ExtensionType.ScaledUiAmountConfig, mint.tlvData);
    if (extensionData !== null) {
        return exports.ScaledUiAmountConfigLayout.decode(extensionData);
    }
    return null;
}
//# sourceMappingURL=state.js.map