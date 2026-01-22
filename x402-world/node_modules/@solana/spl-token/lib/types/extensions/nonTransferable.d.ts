import type { Account } from '../state/account.js';
import type { Mint } from '../state/mint.js';
/** Non-transferable mint state as stored by the program */
export interface NonTransferable {
}
/** Non-transferable token account state as stored by the program */
export interface NonTransferableAccount {
}
/** Buffer layout for de/serializing an account */
export declare const NonTransferableLayout: import("@solana/buffer-layout").Structure<NonTransferable>;
export declare const NON_TRANSFERABLE_SIZE: number;
export declare const NON_TRANSFERABLE_ACCOUNT_SIZE: number;
export declare function getNonTransferable(mint: Mint): NonTransferable | null;
export declare function getNonTransferableAccount(account: Account): NonTransferableAccount | null;
//# sourceMappingURL=nonTransferable.d.ts.map