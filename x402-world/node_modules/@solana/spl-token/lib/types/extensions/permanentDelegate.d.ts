import type { PublicKey } from '@solana/web3.js';
import type { Mint } from '../state/mint.js';
/** PermanentDelegate as stored by the program */
export interface PermanentDelegate {
    delegate: PublicKey;
}
/** Buffer layout for de/serializing a mint */
export declare const PermanentDelegateLayout: import("@solana/buffer-layout").Structure<PermanentDelegate>;
export declare const PERMANENT_DELEGATE_SIZE: number;
export declare function getPermanentDelegate(mint: Mint): PermanentDelegate | null;
//# sourceMappingURL=permanentDelegate.d.ts.map