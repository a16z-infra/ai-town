import { f64, struct } from '@solana/buffer-layout';
import { publicKey, u64 } from '@solana/buffer-layout-utils';
import type { PublicKey } from '@solana/web3.js';
import type { Mint } from '../../state/mint.js';
import { ExtensionType, getExtensionData } from '../extensionType.js';

export interface ScaledUiAmountConfig {
    authority: PublicKey;
    multiplier: number;
    newMultiplierEffectiveTimestamp: bigint;
    newMultiplier: number;
}

export const ScaledUiAmountConfigLayout = struct<ScaledUiAmountConfig>([
    publicKey('authority'),
    f64('multiplier'),
    u64('newMultiplierEffectiveTimestamp'),
    f64('newMultiplier'),
]);

export const SCALED_UI_AMOUNT_CONFIG_SIZE = ScaledUiAmountConfigLayout.span;

export function getScaledUiAmountConfig(mint: Mint): ScaledUiAmountConfig | null {
    const extensionData = getExtensionData(ExtensionType.ScaledUiAmountConfig, mint.tlvData);
    if (extensionData !== null) {
        return ScaledUiAmountConfigLayout.decode(extensionData);
    }
    return null;
}
