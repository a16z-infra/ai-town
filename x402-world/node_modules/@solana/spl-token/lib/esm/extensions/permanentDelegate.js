import { struct } from '@solana/buffer-layout';
import { publicKey } from '@solana/buffer-layout-utils';
import { ExtensionType, getExtensionData } from './extensionType.js';
/** Buffer layout for de/serializing a mint */
export const PermanentDelegateLayout = struct([publicKey('delegate')]);
export const PERMANENT_DELEGATE_SIZE = PermanentDelegateLayout.span;
export function getPermanentDelegate(mint) {
    const extensionData = getExtensionData(ExtensionType.PermanentDelegate, mint.tlvData);
    if (extensionData !== null) {
        return PermanentDelegateLayout.decode(extensionData);
    }
    else {
        return null;
    }
}
//# sourceMappingURL=permanentDelegate.js.map