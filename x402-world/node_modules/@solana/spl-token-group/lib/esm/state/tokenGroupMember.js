import { PublicKey } from '@solana/web3.js';
import { fixCodecSize, getBytesCodec, getStructCodec, getU64Codec } from '@solana/codecs';
const tokenGroupMemberCodec = getStructCodec([
    ['mint', fixCodecSize(getBytesCodec(), 32)],
    ['group', fixCodecSize(getBytesCodec(), 32)],
    ['memberNumber', getU64Codec()],
]);
export const TOKEN_GROUP_MEMBER_SIZE = tokenGroupMemberCodec.fixedSize;
// Pack TokenGroupMember into byte slab
export function packTokenGroupMember(member) {
    return tokenGroupMemberCodec.encode({
        mint: member.mint.toBuffer(),
        group: member.group.toBuffer(),
        memberNumber: member.memberNumber,
    });
}
// unpack byte slab into TokenGroupMember
export function unpackTokenGroupMember(buffer) {
    const data = tokenGroupMemberCodec.decode(buffer);
    return {
        mint: new PublicKey(data.mint),
        group: new PublicKey(data.group),
        memberNumber: data.memberNumber,
    };
}
//# sourceMappingURL=tokenGroupMember.js.map