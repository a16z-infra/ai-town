import type { Account } from '../state/account.js';
/** ImmutableOwner as stored by the program */
export interface ImmutableOwner {
}
/** Buffer layout for de/serializing an account */
export declare const ImmutableOwnerLayout: import("@solana/buffer-layout").Structure<ImmutableOwner>;
export declare const IMMUTABLE_OWNER_SIZE: number;
export declare function getImmutableOwner(account: Account): ImmutableOwner | null;
//# sourceMappingURL=immutableOwner.d.ts.map