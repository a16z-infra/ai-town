import { struct } from '@solana/buffer-layout';
import { bool } from '@solana/buffer-layout-utils';
import type { Account } from '../../state/account.js';
import { ExtensionType, getExtensionData } from '../extensionType.js';

/** CpiGuard as stored by the program */
export interface CpiGuard {
    /** Lock certain token operations from taking place within CPI for this account */
    lockCpi: boolean;
}

/** Buffer layout for de/serializing a CPI Guard extension */
export const CpiGuardLayout = struct<CpiGuard>([bool('lockCpi')]);

export const CPI_GUARD_SIZE = CpiGuardLayout.span;

export function getCpiGuard(account: Account): CpiGuard | null {
    const extensionData = getExtensionData(ExtensionType.CpiGuard, account.tlvData);
    if (extensionData !== null) {
        return CpiGuardLayout.decode(extensionData);
    } else {
        return null;
    }
}
