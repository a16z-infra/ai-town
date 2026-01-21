import { struct } from '@solana/buffer-layout';
import { bool } from '@solana/buffer-layout-utils';
import { ExtensionType, getExtensionData } from '../extensionType.js';
/** Buffer layout for de/serializing a memo transfer extension */
export const MemoTransferLayout = struct([bool('requireIncomingTransferMemos')]);
export const MEMO_TRANSFER_SIZE = MemoTransferLayout.span;
export function getMemoTransfer(account) {
    const extensionData = getExtensionData(ExtensionType.MemoTransfer, account.tlvData);
    if (extensionData !== null) {
        return MemoTransferLayout.decode(extensionData);
    }
    else {
        return null;
    }
}
//# sourceMappingURL=state.js.map