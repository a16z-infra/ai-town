import { struct, u8 } from '@solana/buffer-layout';
import { ExtensionType, getExtensionData } from '../extensionType.js';
/** Buffer layout for de/serializing a transfer fee config extension */
export const DefaultAccountStateLayout = struct([u8('state')]);
export const DEFAULT_ACCOUNT_STATE_SIZE = DefaultAccountStateLayout.span;
export function getDefaultAccountState(mint) {
    const extensionData = getExtensionData(ExtensionType.DefaultAccountState, mint.tlvData);
    if (extensionData !== null) {
        return DefaultAccountStateLayout.decode(extensionData);
    }
    else {
        return null;
    }
}
//# sourceMappingURL=state.js.map