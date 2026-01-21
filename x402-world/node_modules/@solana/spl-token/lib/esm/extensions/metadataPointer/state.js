import { struct } from '@solana/buffer-layout';
import { publicKey } from '@solana/buffer-layout-utils';
import { PublicKey } from '@solana/web3.js';
import { ExtensionType, getExtensionData } from '../extensionType.js';
/** Buffer layout for de/serializing a Metadata Pointer extension */
export const MetadataPointerLayout = struct([
    publicKey('authority'),
    publicKey('metadataAddress'),
]);
export const METADATA_POINTER_SIZE = MetadataPointerLayout.span;
export function getMetadataPointerState(mint) {
    const extensionData = getExtensionData(ExtensionType.MetadataPointer, mint.tlvData);
    if (extensionData !== null) {
        const { authority, metadataAddress } = MetadataPointerLayout.decode(extensionData);
        // Explicitly set None/Zero keys to null
        return {
            authority: authority.equals(PublicKey.default) ? null : authority,
            metadataAddress: metadataAddress.equals(PublicKey.default) ? null : metadataAddress,
        };
    }
    else {
        return null;
    }
}
//# sourceMappingURL=state.js.map