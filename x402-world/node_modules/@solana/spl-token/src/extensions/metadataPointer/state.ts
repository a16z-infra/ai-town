import { struct } from '@solana/buffer-layout';
import { publicKey } from '@solana/buffer-layout-utils';
import { PublicKey } from '@solana/web3.js';
import type { Mint } from '../../state/mint.js';
import { ExtensionType, getExtensionData } from '../extensionType.js';

/** MetadataPointer as stored by the program */
export interface MetadataPointer {
    /** Optional authority that can set the metadata address */
    authority: PublicKey | null;
    /** Optional Account Address that holds the metadata */
    metadataAddress: PublicKey | null;
}

/** Buffer layout for de/serializing a Metadata Pointer extension */
export const MetadataPointerLayout = struct<{ authority: PublicKey; metadataAddress: PublicKey }>([
    publicKey('authority'),
    publicKey('metadataAddress'),
]);

export const METADATA_POINTER_SIZE = MetadataPointerLayout.span;

export function getMetadataPointerState(mint: Mint): Partial<MetadataPointer> | null {
    const extensionData = getExtensionData(ExtensionType.MetadataPointer, mint.tlvData);
    if (extensionData !== null) {
        const { authority, metadataAddress } = MetadataPointerLayout.decode(extensionData);

        // Explicitly set None/Zero keys to null
        return {
            authority: authority.equals(PublicKey.default) ? null : authority,
            metadataAddress: metadataAddress.equals(PublicKey.default) ? null : metadataAddress,
        };
    } else {
        return null;
    }
}
