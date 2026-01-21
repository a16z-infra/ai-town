import { struct } from '@solana/buffer-layout';
import { publicKey } from '@solana/buffer-layout-utils';
import { PublicKey } from '@solana/web3.js';
import { ExtensionType, getExtensionData } from '../extensionType.js';
/** Buffer layout for de/serializing a Group Pointer extension */
export const GroupMemberPointerLayout = struct([
    publicKey('authority'),
    publicKey('memberAddress'),
]);
export const GROUP_MEMBER_POINTER_SIZE = GroupMemberPointerLayout.span;
export function getGroupMemberPointerState(mint) {
    const extensionData = getExtensionData(ExtensionType.GroupMemberPointer, mint.tlvData);
    if (extensionData !== null) {
        const { authority, memberAddress } = GroupMemberPointerLayout.decode(extensionData);
        // Explicitly set None/Zero keys to null
        return {
            authority: authority.equals(PublicKey.default) ? null : authority,
            memberAddress: memberAddress.equals(PublicKey.default) ? null : memberAddress,
        };
    }
    else {
        return null;
    }
}
//# sourceMappingURL=state.js.map