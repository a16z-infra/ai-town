"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOKEN_GROUP_MEMBER_SIZE = void 0;
exports.packTokenGroupMember = packTokenGroupMember;
exports.unpackTokenGroupMember = unpackTokenGroupMember;
const web3_js_1 = require("@solana/web3.js");
const codecs_1 = require("@solana/codecs");
const tokenGroupMemberCodec = (0, codecs_1.getStructCodec)([
    ['mint', (0, codecs_1.fixCodecSize)((0, codecs_1.getBytesCodec)(), 32)],
    ['group', (0, codecs_1.fixCodecSize)((0, codecs_1.getBytesCodec)(), 32)],
    ['memberNumber', (0, codecs_1.getU64Codec)()],
]);
exports.TOKEN_GROUP_MEMBER_SIZE = tokenGroupMemberCodec.fixedSize;
// Pack TokenGroupMember into byte slab
function packTokenGroupMember(member) {
    return tokenGroupMemberCodec.encode({
        mint: member.mint.toBuffer(),
        group: member.group.toBuffer(),
        memberNumber: member.memberNumber,
    });
}
// unpack byte slab into TokenGroupMember
function unpackTokenGroupMember(buffer) {
    const data = tokenGroupMemberCodec.decode(buffer);
    return {
        mint: new web3_js_1.PublicKey(data.mint),
        group: new web3_js_1.PublicKey(data.group),
        memberNumber: data.memberNumber,
    };
}
//# sourceMappingURL=tokenGroupMember.js.map