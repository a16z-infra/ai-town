import { struct } from '@solana/buffer-layout';
import { bool } from '@solana/buffer-layout-utils';
import { ExtensionType, getExtensionData } from '../extensionType.js';
/** Buffer layout for de/serializing a CPI Guard extension */
export const CpiGuardLayout = struct([bool('lockCpi')]);
export const CPI_GUARD_SIZE = CpiGuardLayout.span;
export function getCpiGuard(account) {
    const extensionData = getExtensionData(ExtensionType.CpiGuard, account.tlvData);
    if (extensionData !== null) {
        return CpiGuardLayout.decode(extensionData);
    }
    else {
        return null;
    }
}
//# sourceMappingURL=state.js.map