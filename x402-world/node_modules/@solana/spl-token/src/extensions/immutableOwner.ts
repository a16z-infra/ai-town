import { struct } from '@solana/buffer-layout';
import type { Account } from '../state/account.js';
import { ExtensionType, getExtensionData } from './extensionType.js';

/** ImmutableOwner as stored by the program */
export interface ImmutableOwner {} // eslint-disable-line

/** Buffer layout for de/serializing an account */
export const ImmutableOwnerLayout = struct<ImmutableOwner>([]);

export const IMMUTABLE_OWNER_SIZE = ImmutableOwnerLayout.span;

export function getImmutableOwner(account: Account): ImmutableOwner | null {
    const extensionData = getExtensionData(ExtensionType.ImmutableOwner, account.tlvData);
    if (extensionData !== null) {
        return ImmutableOwnerLayout.decode(extensionData);
    } else {
        return null;
    }
}
