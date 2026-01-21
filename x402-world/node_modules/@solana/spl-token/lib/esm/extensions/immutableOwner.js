import { struct } from '@solana/buffer-layout';
import { ExtensionType, getExtensionData } from './extensionType.js';
/** Buffer layout for de/serializing an account */
export const ImmutableOwnerLayout = struct([]);
export const IMMUTABLE_OWNER_SIZE = ImmutableOwnerLayout.span;
export function getImmutableOwner(account) {
    const extensionData = getExtensionData(ExtensionType.ImmutableOwner, account.tlvData);
    if (extensionData !== null) {
        return ImmutableOwnerLayout.decode(extensionData);
    }
    else {
        return null;
    }
}
//# sourceMappingURL=immutableOwner.js.map