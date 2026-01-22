import { struct } from '@solana/buffer-layout';
import { publicKey } from '@solana/buffer-layout-utils';
import type { PublicKey } from '@solana/web3.js';
import type { Mint } from '../state/mint.js';
import { ExtensionType, getExtensionData } from './extensionType.js';

/** PermanentDelegate as stored by the program */
export interface PermanentDelegate {
    delegate: PublicKey;
}

/** Buffer layout for de/serializing a mint */
export const PermanentDelegateLayout = struct<PermanentDelegate>([publicKey('delegate')]);

export const PERMANENT_DELEGATE_SIZE = PermanentDelegateLayout.span;

export function getPermanentDelegate(mint: Mint): PermanentDelegate | null {
    const extensionData = getExtensionData(ExtensionType.PermanentDelegate, mint.tlvData);
    if (extensionData !== null) {
        return PermanentDelegateLayout.decode(extensionData);
    } else {
        return null;
    }
}
