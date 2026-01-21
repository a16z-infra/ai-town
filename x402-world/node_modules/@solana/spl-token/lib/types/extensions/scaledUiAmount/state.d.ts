import type { PublicKey } from '@solana/web3.js';
import type { Mint } from '../../state/mint.js';
export interface ScaledUiAmountConfig {
    authority: PublicKey;
    multiplier: number;
    newMultiplierEffectiveTimestamp: bigint;
    newMultiplier: number;
}
export declare const ScaledUiAmountConfigLayout: import("@solana/buffer-layout").Structure<ScaledUiAmountConfig>;
export declare const SCALED_UI_AMOUNT_CONFIG_SIZE: number;
export declare function getScaledUiAmountConfig(mint: Mint): ScaledUiAmountConfig | null;
//# sourceMappingURL=state.d.ts.map