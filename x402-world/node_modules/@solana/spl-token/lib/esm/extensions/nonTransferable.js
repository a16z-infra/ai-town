import { struct } from '@solana/buffer-layout';
import { ExtensionType, getExtensionData } from './extensionType.js';
/** Buffer layout for de/serializing an account */
export const NonTransferableLayout = struct([]);
export const NON_TRANSFERABLE_SIZE = NonTransferableLayout.span;
export const NON_TRANSFERABLE_ACCOUNT_SIZE = NonTransferableLayout.span;
export function getNonTransferable(mint) {
    const extensionData = getExtensionData(ExtensionType.NonTransferable, mint.tlvData);
    if (extensionData !== null) {
        return NonTransferableLayout.decode(extensionData);
    }
    else {
        return null;
    }
}
export function getNonTransferableAccount(account) {
    const extensionData = getExtensionData(ExtensionType.NonTransferableAccount, account.tlvData);
    if (extensionData !== null) {
        return NonTransferableLayout.decode(extensionData);
    }
    else {
        return null;
    }
}
//# sourceMappingURL=nonTransferable.js.map