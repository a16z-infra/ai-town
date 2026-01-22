import { struct } from '@solana/buffer-layout';
import { publicKey } from '@solana/buffer-layout-utils';
import type { PublicKey } from '@solana/web3.js';
import type { Mint } from '../state/mint.js';
import { ExtensionType, getExtensionData } from './extensionType.js';

/** MintCloseAuthority as stored by the program */
export interface MintCloseAuthority {
    closeAuthority: PublicKey;
}

/** Buffer layout for de/serializing a mint */
export const MintCloseAuthorityLayout = struct<MintCloseAuthority>([publicKey('closeAuthority')]);

export const MINT_CLOSE_AUTHORITY_SIZE = MintCloseAuthorityLayout.span;

export function getMintCloseAuthority(mint: Mint): MintCloseAuthority | null {
    const extensionData = getExtensionData(ExtensionType.MintCloseAuthority, mint.tlvData);
    if (extensionData !== null) {
        return MintCloseAuthorityLayout.decode(extensionData);
    } else {
        return null;
    }
}
