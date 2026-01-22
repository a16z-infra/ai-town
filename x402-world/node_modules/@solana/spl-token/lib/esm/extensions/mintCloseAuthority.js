import { struct } from '@solana/buffer-layout';
import { publicKey } from '@solana/buffer-layout-utils';
import { ExtensionType, getExtensionData } from './extensionType.js';
/** Buffer layout for de/serializing a mint */
export const MintCloseAuthorityLayout = struct([publicKey('closeAuthority')]);
export const MINT_CLOSE_AUTHORITY_SIZE = MintCloseAuthorityLayout.span;
export function getMintCloseAuthority(mint) {
    const extensionData = getExtensionData(ExtensionType.MintCloseAuthority, mint.tlvData);
    if (extensionData !== null) {
        return MintCloseAuthorityLayout.decode(extensionData);
    }
    else {
        return null;
    }
}
//# sourceMappingURL=mintCloseAuthority.js.map