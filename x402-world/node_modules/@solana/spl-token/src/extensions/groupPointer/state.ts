import { struct } from '@solana/buffer-layout';
import { publicKey } from '@solana/buffer-layout-utils';
import { PublicKey } from '@solana/web3.js';
import type { Mint } from '../../state/mint.js';
import { ExtensionType, getExtensionData } from '../extensionType.js';

/** GroupPointer as stored by the program */
export interface GroupPointer {
    /** Optional authority that can set the group address */
    authority: PublicKey | null;
    /** Optional account address that holds the group */
    groupAddress: PublicKey | null;
}

/** Buffer layout for de/serializing a GroupPointer extension */
export const GroupPointerLayout = struct<{ authority: PublicKey; groupAddress: PublicKey }>([
    publicKey('authority'),
    publicKey('groupAddress'),
]);

export const GROUP_POINTER_SIZE = GroupPointerLayout.span;

export function getGroupPointerState(mint: Mint): Partial<GroupPointer> | null {
    const extensionData = getExtensionData(ExtensionType.GroupPointer, mint.tlvData);
    if (extensionData !== null) {
        const { authority, groupAddress } = GroupPointerLayout.decode(extensionData);

        // Explicitly set None/Zero keys to null
        return {
            authority: authority.equals(PublicKey.default) ? null : authority,
            groupAddress: groupAddress.equals(PublicKey.default) ? null : groupAddress,
        };
    } else {
        return null;
    }
}
