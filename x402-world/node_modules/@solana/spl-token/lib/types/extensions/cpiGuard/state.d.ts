import type { Account } from '../../state/account.js';
/** CpiGuard as stored by the program */
export interface CpiGuard {
    /** Lock certain token operations from taking place within CPI for this account */
    lockCpi: boolean;
}
/** Buffer layout for de/serializing a CPI Guard extension */
export declare const CpiGuardLayout: import("@solana/buffer-layout").Structure<CpiGuard>;
export declare const CPI_GUARD_SIZE: number;
export declare function getCpiGuard(account: Account): CpiGuard | null;
//# sourceMappingURL=state.d.ts.map