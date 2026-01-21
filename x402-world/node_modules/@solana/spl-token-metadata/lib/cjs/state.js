"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOKEN_METADATA_DISCRIMINATOR = void 0;
exports.pack = pack;
exports.unpack = unpack;
const web3_js_1 = require("@solana/web3.js");
const codecs_1 = require("@solana/codecs");
exports.TOKEN_METADATA_DISCRIMINATOR = Buffer.from([112, 132, 90, 90, 11, 88, 157, 87]);
function getStringCodec() {
    return (0, codecs_1.addCodecSizePrefix)((0, codecs_1.getUtf8Codec)(), (0, codecs_1.getU32Codec)());
}
const tokenMetadataCodec = (0, codecs_1.getStructCodec)([
    ['updateAuthority', (0, codecs_1.fixCodecSize)((0, codecs_1.getBytesCodec)(), 32)],
    ['mint', (0, codecs_1.fixCodecSize)((0, codecs_1.getBytesCodec)(), 32)],
    ['name', getStringCodec()],
    ['symbol', getStringCodec()],
    ['uri', getStringCodec()],
    ['additionalMetadata', (0, codecs_1.getArrayCodec)((0, codecs_1.getTupleCodec)([getStringCodec(), getStringCodec()]))],
]);
// Checks if all elements in the array are 0
function isNonePubkey(buffer) {
    for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] !== 0) {
            return false;
        }
    }
    return true;
}
// Pack TokenMetadata into byte slab
function pack(meta) {
    var _a;
    // If no updateAuthority given, set it to the None/Zero PublicKey for encoding
    const updateAuthority = (_a = meta.updateAuthority) !== null && _a !== void 0 ? _a : web3_js_1.PublicKey.default;
    return tokenMetadataCodec.encode(Object.assign(Object.assign({}, meta), { updateAuthority: updateAuthority.toBuffer(), mint: meta.mint.toBuffer() }));
}
// unpack byte slab into TokenMetadata
function unpack(buffer) {
    const data = tokenMetadataCodec.decode(buffer);
    return isNonePubkey(data.updateAuthority)
        ? {
            mint: new web3_js_1.PublicKey(data.mint),
            name: data.name,
            symbol: data.symbol,
            uri: data.uri,
            additionalMetadata: data.additionalMetadata,
        }
        : {
            updateAuthority: new web3_js_1.PublicKey(data.updateAuthority),
            mint: new web3_js_1.PublicKey(data.mint),
            name: data.name,
            symbol: data.symbol,
            uri: data.uri,
            additionalMetadata: data.additionalMetadata,
        };
}
//# sourceMappingURL=state.js.map