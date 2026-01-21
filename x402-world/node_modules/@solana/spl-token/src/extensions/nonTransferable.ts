import { struct } from '@solana/buffer-layout';
import type { Account } from '../state/account.js';
import type { Mint } from '../state/mint.js';
import { ExtensionType, getExtensionData } from './extensionType.js';

/** Non-transferable mint state as stored by the program */
export interface NonTransferable {} // eslint-disable-line

/** Non-transferable token account state as stored by the program */
export interface NonTransferableAccount {} // eslint-disable-line

/** Buffer layout for de/serializing an account */
export const NonTransferableLayout = struct<NonTransferable>([]);

export const NON_TRANSFERABLE_SIZE = NonTransferableLayout.span;
export const NON_TRANSFERABLE_ACCOUNT_SIZE = NonTransferableLayout.span;

export function getNonTransferable(mint: Mint): NonTransferable | null {
    const extensionData = getExtensionData(ExtensionType.NonTransferable, mint.tlvData);
    if (extensionData !== null) {
        return NonTransferableLayout.decode(extensionData);
    } else {
        return null;
    }
}

export function getNonTransferableAccount(account: Account): NonTransferableAccount | null {
    const extensionData = getExtensionData(ExtensionType.NonTransferableAccount, account.tlvData);
    if (extensionData !== null) {
        return NonTransferableLayout.decode(extensionData);
    } else {
        return null;
    }
}
