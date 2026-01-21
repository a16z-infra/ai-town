import { struct, u8 } from '@solana/buffer-layout';
import type { AccountState } from '../../state/account.js';
import type { Mint } from '../../state/mint.js';
import { ExtensionType, getExtensionData } from '../extensionType.js';

/** DefaultAccountState as stored by the program */
export interface DefaultAccountState {
    /** Default AccountState in which new accounts are initialized */
    state: AccountState;
}

/** Buffer layout for de/serializing a transfer fee config extension */
export const DefaultAccountStateLayout = struct<DefaultAccountState>([u8('state')]);

export const DEFAULT_ACCOUNT_STATE_SIZE = DefaultAccountStateLayout.span;

export function getDefaultAccountState(mint: Mint): DefaultAccountState | null {
    const extensionData = getExtensionData(ExtensionType.DefaultAccountState, mint.tlvData);
    if (extensionData !== null) {
        return DefaultAccountStateLayout.decode(extensionData);
    } else {
        return null;
    }
}
