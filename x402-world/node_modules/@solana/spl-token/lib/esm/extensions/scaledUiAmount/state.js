import { f64, struct } from '@solana/buffer-layout';
import { publicKey, u64 } from '@solana/buffer-layout-utils';
import { ExtensionType, getExtensionData } from '../extensionType.js';
export const ScaledUiAmountConfigLayout = struct([
    publicKey('authority'),
    f64('multiplier'),
    u64('newMultiplierEffectiveTimestamp'),
    f64('newMultiplier'),
]);
export const SCALED_UI_AMOUNT_CONFIG_SIZE = ScaledUiAmountConfigLayout.span;
export function getScaledUiAmountConfig(mint) {
    const extensionData = getExtensionData(ExtensionType.ScaledUiAmountConfig, mint.tlvData);
    if (extensionData !== null) {
        return ScaledUiAmountConfigLayout.decode(extensionData);
    }
    return null;
}
//# sourceMappingURL=state.js.map