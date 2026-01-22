import { PublicKey } from '@solana/web3.js';
import { addCodecSizePrefix, fixCodecSize, getArrayCodec, getBytesCodec, getUtf8Codec, getU32Codec, getStructCodec, getTupleCodec, } from '@solana/codecs';
export const TOKEN_METADATA_DISCRIMINATOR = Buffer.from([112, 132, 90, 90, 11, 88, 157, 87]);
function getStringCodec() {
    return addCodecSizePrefix(getUtf8Codec(), getU32Codec());
}
const tokenMetadataCodec = getStructCodec([
    ['updateAuthority', fixCodecSize(getBytesCodec(), 32)],
    ['mint', fixCodecSize(getBytesCodec(), 32)],
    ['name', getStringCodec()],
    ['symbol', getStringCodec()],
    ['uri', getStringCodec()],
    ['additionalMetadata', getArrayCodec(getTupleCodec([getStringCodec(), getStringCodec()]))],
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
export function pack(meta) {
    // If no updateAuthority given, set it to the None/Zero PublicKey for encoding
    const updateAuthority = meta.updateAuthority ?? PublicKey.default;
    return tokenMetadataCodec.encode({
        ...meta,
        updateAuthority: updateAuthority.toBuffer(),
        mint: meta.mint.toBuffer(),
    });
}
// unpack byte slab into TokenMetadata
export function unpack(buffer) {
    const data = tokenMetadataCodec.decode(buffer);
    return isNonePubkey(data.updateAuthority)
        ? {
            mint: new PublicKey(data.mint),
            name: data.name,
            symbol: data.symbol,
            uri: data.uri,
            additionalMetadata: data.additionalMetadata,
        }
        : {
            updateAuthority: new PublicKey(data.updateAuthority),
            mint: new PublicKey(data.mint),
            name: data.name,
            symbol: data.symbol,
            uri: data.uri,
            additionalMetadata: data.additionalMetadata,
        };
}
//# sourceMappingURL=state.js.map