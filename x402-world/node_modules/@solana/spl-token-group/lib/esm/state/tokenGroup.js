import { PublicKey } from '@solana/web3.js';
import { fixCodecSize, getBytesCodec, getStructCodec, getU64Codec } from '@solana/codecs';
const tokenGroupCodec = getStructCodec([
    ['updateAuthority', fixCodecSize(getBytesCodec(), 32)],
    ['mint', fixCodecSize(getBytesCodec(), 32)],
    ['size', getU64Codec()],
    ['maxSize', getU64Codec()],
]);
export const TOKEN_GROUP_SIZE = tokenGroupCodec.fixedSize;
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
export function packTokenGroup(group) {
    // If no updateAuthority given, set it to the None/Zero PublicKey for encoding
    const updateAuthority = group.updateAuthority ?? PublicKey.default;
    return tokenGroupCodec.encode({
        updateAuthority: updateAuthority.toBuffer(),
        mint: group.mint.toBuffer(),
        size: group.size,
        maxSize: group.maxSize,
    });
}
// unpack byte slab into TokenGroup
export function unpackTokenGroup(buffer) {
    const data = tokenGroupCodec.decode(buffer);
    return isNonePubkey(data.updateAuthority)
        ? {
            mint: new PublicKey(data.mint),
            size: data.size,
            maxSize: data.maxSize,
        }
        : {
            updateAuthority: new PublicKey(data.updateAuthority),
            mint: new PublicKey(data.mint),
            size: data.size,
            maxSize: data.maxSize,
        };
}
//# sourceMappingURL=tokenGroup.js.map