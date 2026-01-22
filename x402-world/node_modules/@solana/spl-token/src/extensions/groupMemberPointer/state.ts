import { struct } from '@solana/buffer-layout';
import { publicKey } from '@solana/buffer-layout-utils';
import { PublicKey } from '@solana/web3.js';
import type { Mint } from '../../state/mint.js';
import { ExtensionType, getExtensionData } from '../extensionType.js';

/** GroupMemberPointer as stored by the program */
export interface GroupMemberPointer {
    /** Optional authority that can set the member address */
    authority: PublicKey | null;
    /** Optional account address that holds the member */
    memberAddress: PublicKey | null;
}

/** Buffer layout for de/serializing a Group Pointer extension */
export const GroupMemberPointerLayout = struct<{ authority: PublicKey; memberAddress: PublicKey }>([
    publicKey('authority'),
    publicKey('memberAddress'),
]);

export const GROUP_MEMBER_POINTER_SIZE = GroupMemberPointerLayout.span;

export function getGroupMemberPointerState(mint: Mint): Partial<GroupMemberPointer> | null {
    const extensionData = getExtensionData(ExtensionType.GroupMemberPointer, mint.tlvData);
    if (extensionData !== null) {
        const { authority, memberAddress } = GroupMemberPointerLayout.decode(extensionData);

        // Explicitly set None/Zero keys to null
        return {
            authority: authority.equals(PublicKey.default) ? null : authority,
            memberAddress: memberAddress.equals(PublicKey.default) ? null : memberAddress,
        };
    } else {
        return null;
    }
}
