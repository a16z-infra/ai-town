import type { PublicKey } from '@solana/web3.js';
import type { Mint } from '../../state/mint.js';
export interface InterestBearingMintConfigState {
    rateAuthority: PublicKey;
    initializationTimestamp: bigint;
    preUpdateAverageRate: number;
    lastUpdateTimestamp: bigint;
    currentRate: number;
}
export declare const InterestBearingMintConfigStateLayout: import("@solana/buffer-layout").Structure<InterestBearingMintConfigState>;
export declare const INTEREST_BEARING_MINT_CONFIG_STATE_SIZE: number;
export declare function getInterestBearingMintConfigState(mint: Mint): InterestBearingMintConfigState | null;
//# sourceMappingURL=state.d.ts.map