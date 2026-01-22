import { struct } from '@solana/buffer-layout';
import { publicKey } from '@solana/buffer-layout-utils';
import { PublicKey } from '@solana/web3.js';
import { ExtensionType, getExtensionData } from '../extensionType.js';
/** Buffer layout for de/serializing a GroupPointer extension */
export const GroupPointerLayout = struct([
    publicKey('authority'),
    publicKey('groupAddress'),
]);
export const GROUP_POINTER_SIZE = GroupPointerLayout.span;
export function getGroupPointerState(mint) {
    const extensionData = getExtensionData(ExtensionType.GroupPointer, mint.tlvData);
    if (extensionData !== null) {
        const { authority, groupAddress } = GroupPointerLayout.decode(extensionData);
        // Explicitly set None/Zero keys to null
        return {
            authority: authority.equals(PublicKey.default) ? null : authority,
            groupAddress: groupAddress.equals(PublicKey.default) ? null : groupAddress,
        };
    }
    else {
        return null;
    }
}
//# sourceMappingURL=state.js.map