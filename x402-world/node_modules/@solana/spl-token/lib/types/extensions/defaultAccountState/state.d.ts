import type { AccountState } from '../../state/account.js';
import type { Mint } from '../../state/mint.js';
/** DefaultAccountState as stored by the program */
export interface DefaultAccountState {
    /** Default AccountState in which new accounts are initialized */
    state: AccountState;
}
/** Buffer layout for de/serializing a transfer fee config extension */
export declare const DefaultAccountStateLayout: import("@solana/buffer-layout").Structure<DefaultAccountState>;
export declare const DEFAULT_ACCOUNT_STATE_SIZE: number;
export declare function getDefaultAccountState(mint: Mint): DefaultAccountState | null;
//# sourceMappingURL=state.d.ts.map