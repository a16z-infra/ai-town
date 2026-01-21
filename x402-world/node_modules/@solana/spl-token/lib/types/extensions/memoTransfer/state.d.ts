import type { Account } from '../../state/account.js';
/** MemoTransfer as stored by the program */
export interface MemoTransfer {
    /** Require transfers into this account to be accompanied by a memo */
    requireIncomingTransferMemos: boolean;
}
/** Buffer layout for de/serializing a memo transfer extension */
export declare const MemoTransferLayout: import("@solana/buffer-layout").Structure<MemoTransfer>;
export declare const MEMO_TRANSFER_SIZE: number;
export declare function getMemoTransfer(account: Account): MemoTransfer | null;
//# sourceMappingURL=state.d.ts.map