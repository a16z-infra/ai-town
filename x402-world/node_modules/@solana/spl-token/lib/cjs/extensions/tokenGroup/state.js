"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOKEN_GROUP_MEMBER_SIZE = exports.TOKEN_GROUP_SIZE = void 0;
exports.getTokenGroupState = getTokenGroupState;
exports.getTokenGroupMemberState = getTokenGroupMemberState;
const web3_js_1 = require("@solana/web3.js");
const spl_token_group_1 = require("@solana/spl-token-group");
const extensionType_js_1 = require("../extensionType.js");
var spl_token_group_2 = require("@solana/spl-token-group");
Object.defineProperty(exports, "TOKEN_GROUP_SIZE", { enumerable: true, get: function () { return spl_token_group_2.TOKEN_GROUP_SIZE; } });
Object.defineProperty(exports, "TOKEN_GROUP_MEMBER_SIZE", { enumerable: true, get: function () { return spl_token_group_2.TOKEN_GROUP_MEMBER_SIZE; } });
function getTokenGroupState(mint) {
    const extensionData = (0, extensionType_js_1.getExtensionData)(extensionType_js_1.ExtensionType.TokenGroup, mint.tlvData);
    if (extensionData !== null) {
        const { updateAuthority, mint, size, maxSize } = (0, spl_token_group_1.unpackTokenGroup)(extensionData);
        // Explicitly set None/Zero keys to null
        return {
            updateAuthority: (updateAuthority === null || updateAuthority === void 0 ? void 0 : updateAuthority.equals(web3_js_1.PublicKey.default)) ? undefined : updateAuthority,
            mint,
            size,
            maxSize,
        };
    }
    else {
        return null;
    }
}
function getTokenGroupMemberState(mint) {
    const extensionData = (0, extensionType_js_1.getExtensionData)(extensionType_js_1.ExtensionType.TokenGroupMember, mint.tlvData);
    if (extensionData !== null) {
        const { mint, group, memberNumber } = (0, spl_token_group_1.unpackTokenGroupMember)(extensionData);
        return {
            mint,
            group,
            memberNumber,
        };
    }
    else {
        return null;
    }
}
//# sourceMappingURL=state.js.map