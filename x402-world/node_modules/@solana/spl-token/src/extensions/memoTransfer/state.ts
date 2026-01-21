import { struct } from '@solana/buffer-layout';
import { bool } from '@solana/buffer-layout-utils';
import type { Account } from '../../state/account.js';
import { ExtensionType, getExtensionData } from '../extensionType.js';

/** MemoTransfer as stored by the program */
export interface MemoTransfer {
    /** Require transfers into this account to be accompanied by a memo */
    requireIncomingTransferMemos: boolean;
}

/** Buffer layout for de/serializing a memo transfer extension */
export const MemoTransferLayout = struct<MemoTransfer>([bool('requireIncomingTransferMemos')]);

export const MEMO_TRANSFER_SIZE = MemoTransferLayout.span;

export function getMemoTransfer(account: Account): MemoTransfer | null {
    const extensionData = getExtensionData(ExtensionType.MemoTransfer, account.tlvData);
    if (extensionData !== null) {
        return MemoTransferLayout.decode(extensionData);
    } else {
        return null;
    }
}
