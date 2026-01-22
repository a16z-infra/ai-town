import { struct } from '@solana/buffer-layout';
import { publicKey, bool } from '@solana/buffer-layout-utils';
import { ExtensionType, getExtensionData } from '../extensionType.js';
/** Buffer layout for de/serializing a pausable config */
export const PausableConfigLayout = struct([publicKey('authority'), bool('paused')]);
export const PAUSABLE_CONFIG_SIZE = PausableConfigLayout.span;
export function getPausableConfig(mint) {
    const extensionData = getExtensionData(ExtensionType.PausableConfig, mint.tlvData);
    if (extensionData !== null) {
        return PausableConfigLayout.decode(extensionData);
    }
    else {
        return null;
    }
}
/** Buffer layout for de/serializing a pausable account */
export const PausableAccountLayout = struct([]); // esline-disable-line
export const PAUSABLE_ACCOUNT_SIZE = PausableAccountLayout.span;
export function getPausableAccount(account) {
    const extensionData = getExtensionData(ExtensionType.PausableAccount, account.tlvData);
    if (extensionData !== null) {
        return PausableAccountLayout.decode(extensionData);
    }
    else {
        return null;
    }
}
//# sourceMappingURL=state.js.map