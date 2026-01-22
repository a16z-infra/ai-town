"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOKEN_GROUP_SIZE = void 0;
exports.packTokenGroup = packTokenGroup;
exports.unpackTokenGroup = unpackTokenGroup;
const web3_js_1 = require("@solana/web3.js");
const codecs_1 = require("@solana/codecs");
const tokenGroupCodec = (0, codecs_1.getStructCodec)([
    ['updateAuthority', (0, codecs_1.fixCodecSize)((0, codecs_1.getBytesCodec)(), 32)],
    ['mint', (0, codecs_1.fixCodecSize)((0, codecs_1.getBytesCodec)(), 32)],
    ['size', (0, codecs_1.getU64Codec)()],
    ['maxSize', (0, codecs_1.getU64Codec)()],
]);
exports.TOKEN_GROUP_SIZE = tokenGroupCodec.fixedSize;
// Checks if all elements in the array are 0
function isNonePubkey(buffer) {
    for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] !== 0) {
            return false;
        }
    }
    return true;
}
// Pack TokenGroup into byte slab
function packTokenGroup(group) {
    var _a;
    // If no updateAuthority given, set it to the None/Zero PublicKey for encoding
    const updateAuthority = (_a = group.updateAuthority) !== null && _a !== void 0 ? _a : web3_js_1.PublicKey.default;
    return tokenGroupCodec.encode({
        updateAuthority: updateAuthority.toBuffer(),
        mint: group.mint.toBuffer(),
        size: group.size,
        maxSize: group.maxSize,
    });
}
// unpack byte slab into TokenGroup
function unpackTokenGroup(buffer) {
    const data = tokenGroupCodec.decode(buffer);
    return isNonePubkey(data.updateAuthority)
        ? {
            mint: new web3_js_1.PublicKey(data.mint),
            size: data.size,
            maxSize: data.maxSize,
        }
        : {
            updateAuthority: new web3_js_1.PublicKey(data.updateAuthority),
            mint: new web3_js_1.PublicKey(data.mint),
            size: data.size,
            maxSize: data.maxSize,
        };
}
//# sourceMappingURL=tokenGroup.js.map