import type { PublicKey } from '@solana/web3.js';
import type { Account } from '../../state/account.js';
import type { Mint } from '../../state/mint.js';
/** PausableConfig as stored by the program */
export interface PausableConfig {
    /** Authority that can pause or resume activity on the mint */
    authority: PublicKey;
    /** Whether minting / transferring / burning tokens is paused */
    paused: boolean;
}
/** Buffer layout for de/serializing a pausable config */
export declare const PausableConfigLayout: import("@solana/buffer-layout").Structure<PausableConfig>;
export declare const PAUSABLE_CONFIG_SIZE: number;
export declare function getPausableConfig(mint: Mint): PausableConfig | null;
/** Pausable token account state as stored by the program */
export interface PausableAccount {
}
/** Buffer layout for de/serializing a pausable account */
export declare const PausableAccountLayout: import("@solana/buffer-layout").Structure<PausableAccount>;
export declare const PAUSABLE_ACCOUNT_SIZE: number;
export declare function getPausableAccount(account: Account): PausableAccount | null;
//# sourceMappingURL=state.d.ts.map