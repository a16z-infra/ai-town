"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INTEREST_BEARING_MINT_CONFIG_STATE_SIZE = exports.InterestBearingMintConfigStateLayout = void 0;
exports.getInterestBearingMintConfigState = getInterestBearingMintConfigState;
const buffer_layout_1 = require("@solana/buffer-layout");
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
const extensionType_js_1 = require("../extensionType.js");
exports.InterestBearingMintConfigStateLayout = (0, buffer_layout_1.struct)([
    (0, buffer_layout_utils_1.publicKey)('rateAuthority'),
    (0, buffer_layout_1.ns64)('initializationTimestamp'),
    (0, buffer_layout_1.s16)('preUpdateAverageRate'),
    (0, buffer_layout_1.ns64)('lastUpdateTimestamp'),
    (0, buffer_layout_1.s16)('currentRate'),
]);
exports.INTEREST_BEARING_MINT_CONFIG_STATE_SIZE = exports.InterestBearingMintConfigStateLayout.span;
function getInterestBearingMintConfigState(mint) {
    const extensionData = (0, extensionType_js_1.getExtensionData)(extensionType_js_1.ExtensionType.InterestBearingConfig, mint.tlvData);
    if (extensionData !== null) {
        return exports.InterestBearingMintConfigStateLayout.decode(extensionData);
    }
    return null;
}
//# sourceMappingURL=state.js.map