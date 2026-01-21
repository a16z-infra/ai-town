import type { AccountInfo, PublicKey } from '@solana/web3.js';

import { ACCOUNT_SIZE } from '../state/account.js';
import type { Mint } from '../state/mint.js';
import { MINT_SIZE, unpackMint } from '../state/mint.js';
import { MULTISIG_SIZE } from '../state/multisig.js';
import { ACCOUNT_TYPE_SIZE } from './accountType.js';
import { CPI_GUARD_SIZE } from './cpiGuard/index.js';
import { DEFAULT_ACCOUNT_STATE_SIZE } from './defaultAccountState/index.js';
import { TOKEN_GROUP_SIZE, TOKEN_GROUP_MEMBER_SIZE } from './tokenGroup/index.js';
import { GROUP_MEMBER_POINTER_SIZE } from './groupMemberPointer/state.js';
import { GROUP_POINTER_SIZE } from './groupPointer/state.js';
import { IMMUTABLE_OWNER_SIZE } from './immutableOwner.js';
import { INTEREST_BEARING_MINT_CONFIG_STATE_SIZE } from './interestBearingMint/state.js';
import { MEMO_TRANSFER_SIZE } from './memoTransfer/index.js';
import { METADATA_POINTER_SIZE } from './metadataPointer/state.js';
import { MINT_CLOSE_AUTHORITY_SIZE } from './mintCloseAuthority.js';
import { NON_TRANSFERABLE_SIZE, NON_TRANSFERABLE_ACCOUNT_SIZE } from './nonTransferable.js';
import { PAUSABLE_CONFIG_SIZE, PAUSABLE_ACCOUNT_SIZE } from './pausable/index.js';
import { PERMANENT_DELEGATE_SIZE } from './permanentDelegate.js';
import { SCALED_UI_AMOUNT_CONFIG_SIZE } from './scaledUiAmount/index.js';
import { TRANSFER_FEE_AMOUNT_SIZE, TRANSFER_FEE_CONFIG_SIZE } from './transferFee/index.js';
import { TRANSFER_HOOK_ACCOUNT_SIZE, TRANSFER_HOOK_SIZE } from './transferHook/index.js';
import { TOKEN_2022_PROGRAM_ID } from '../constants.js';

// Sequence from https://github.com/solana-labs/solana-program-library/blob/master/token/program-2022/src/extension/mod.rs#L903
export enum ExtensionType {
    Uninitialized,
    TransferFeeConfig,
    TransferFeeAmount,
    MintCloseAuthority,
    ConfidentialTransferMint,
    ConfidentialTransferAccount,
    DefaultAccountState,
    ImmutableOwner,
    MemoTransfer,
    NonTransferable,
    InterestBearingConfig,
    CpiGuard,
    PermanentDelegate,
    NonTransferableAccount,
    TransferHook,
    TransferHookAccount,
    // ConfidentialTransferFee, // Not implemented yet
    // ConfidentialTransferFeeAmount, // Not implemented yet
    MetadataPointer = 18, // Remove number once above extensions implemented
    TokenMetadata = 19, // Remove number once above extensions implemented
    GroupPointer = 20,
    TokenGroup = 21,
    GroupMemberPointer = 22,
    TokenGroupMember = 23,
    // ConfidentialMintBurn, // Not implemented yet
    ScaledUiAmountConfig = 25,
    PausableConfig = 26,
    PausableAccount = 27,
}

export const TYPE_SIZE = 2;
export const LENGTH_SIZE = 2;

function addTypeAndLengthToLen(len: number): number {
    return len + TYPE_SIZE + LENGTH_SIZE;
}

function isVariableLengthExtension(e: ExtensionType): boolean {
    switch (e) {
        case ExtensionType.TokenMetadata:
            return true;
        default:
            return false;
    }
}

// NOTE: All of these should eventually use their type's Span instead of these
// constants.  This is provided for at least creation to work.
export function getTypeLen(e: ExtensionType): number {
    switch (e) {
        case ExtensionType.Uninitialized:
            return 0;
        case ExtensionType.TransferFeeConfig:
            return TRANSFER_FEE_CONFIG_SIZE;
        case ExtensionType.TransferFeeAmount:
            return TRANSFER_FEE_AMOUNT_SIZE;
        case ExtensionType.MintCloseAuthority:
            return MINT_CLOSE_AUTHORITY_SIZE;
        case ExtensionType.ConfidentialTransferMint:
            return 65;
        case ExtensionType.ConfidentialTransferAccount:
            return 295;
        case ExtensionType.CpiGuard:
            return CPI_GUARD_SIZE;
        case ExtensionType.DefaultAccountState:
            return DEFAULT_ACCOUNT_STATE_SIZE;
        case ExtensionType.ImmutableOwner:
            return IMMUTABLE_OWNER_SIZE;
        case ExtensionType.MemoTransfer:
            return MEMO_TRANSFER_SIZE;
        case ExtensionType.MetadataPointer:
            return METADATA_POINTER_SIZE;
        case ExtensionType.NonTransferable:
            return NON_TRANSFERABLE_SIZE;
        case ExtensionType.InterestBearingConfig:
            return INTEREST_BEARING_MINT_CONFIG_STATE_SIZE;
        case ExtensionType.PermanentDelegate:
            return PERMANENT_DELEGATE_SIZE;
        case ExtensionType.NonTransferableAccount:
            return NON_TRANSFERABLE_ACCOUNT_SIZE;
        case ExtensionType.TransferHook:
            return TRANSFER_HOOK_SIZE;
        case ExtensionType.TransferHookAccount:
            return TRANSFER_HOOK_ACCOUNT_SIZE;
        case ExtensionType.GroupPointer:
            return GROUP_POINTER_SIZE;
        case ExtensionType.GroupMemberPointer:
            return GROUP_MEMBER_POINTER_SIZE;
        case ExtensionType.TokenGroup:
            return TOKEN_GROUP_SIZE;
        case ExtensionType.TokenGroupMember:
            return TOKEN_GROUP_MEMBER_SIZE;
        case ExtensionType.ScaledUiAmountConfig:
            return SCALED_UI_AMOUNT_CONFIG_SIZE;
        case ExtensionType.PausableConfig:
            return PAUSABLE_CONFIG_SIZE;
        case ExtensionType.PausableAccount:
            return PAUSABLE_ACCOUNT_SIZE;
        case ExtensionType.TokenMetadata:
            throw Error(`Cannot get type length for variable extension type: ${e}`);
        default:
            throw Error(`Unknown extension type: ${e}`);
    }
}

export function isMintExtension(e: ExtensionType): boolean {
    switch (e) {
        case ExtensionType.TransferFeeConfig:
        case ExtensionType.MintCloseAuthority:
        case ExtensionType.ConfidentialTransferMint:
        case ExtensionType.DefaultAccountState:
        case ExtensionType.NonTransferable:
        case ExtensionType.InterestBearingConfig:
        case ExtensionType.PermanentDelegate:
        case ExtensionType.TransferHook:
        case ExtensionType.MetadataPointer:
        case ExtensionType.TokenMetadata:
        case ExtensionType.GroupPointer:
        case ExtensionType.GroupMemberPointer:
        case ExtensionType.TokenGroup:
        case ExtensionType.TokenGroupMember:
        case ExtensionType.ScaledUiAmountConfig:
        case ExtensionType.PausableConfig:
            return true;
        case ExtensionType.Uninitialized:
        case ExtensionType.TransferFeeAmount:
        case ExtensionType.ConfidentialTransferAccount:
        case ExtensionType.ImmutableOwner:
        case ExtensionType.MemoTransfer:
        case ExtensionType.CpiGuard:
        case ExtensionType.NonTransferableAccount:
        case ExtensionType.TransferHookAccount:
        case ExtensionType.PausableAccount:
            return false;
        default:
            throw Error(`Unknown extension type: ${e}`);
    }
}

export function isAccountExtension(e: ExtensionType): boolean {
    switch (e) {
        case ExtensionType.TransferFeeAmount:
        case ExtensionType.ConfidentialTransferAccount:
        case ExtensionType.ImmutableOwner:
        case ExtensionType.MemoTransfer:
        case ExtensionType.CpiGuard:
        case ExtensionType.NonTransferableAccount:
        case ExtensionType.TransferHookAccount:
        case ExtensionType.PausableAccount:
            return true;
        case ExtensionType.Uninitialized:
        case ExtensionType.TransferFeeConfig:
        case ExtensionType.MintCloseAuthority:
        case ExtensionType.ConfidentialTransferMint:
        case ExtensionType.DefaultAccountState:
        case ExtensionType.NonTransferable:
        case ExtensionType.InterestBearingConfig:
        case ExtensionType.PermanentDelegate:
        case ExtensionType.TransferHook:
        case ExtensionType.MetadataPointer:
        case ExtensionType.TokenMetadata:
        case ExtensionType.GroupPointer:
        case ExtensionType.GroupMemberPointer:
        case ExtensionType.TokenGroup:
        case ExtensionType.TokenGroupMember:
        case ExtensionType.ScaledUiAmountConfig:
        case ExtensionType.PausableConfig:
            return false;
        default:
            throw Error(`Unknown extension type: ${e}`);
    }
}

export function getAccountTypeOfMintType(e: ExtensionType): ExtensionType {
    switch (e) {
        case ExtensionType.TransferFeeConfig:
            return ExtensionType.TransferFeeAmount;
        case ExtensionType.ConfidentialTransferMint:
            return ExtensionType.ConfidentialTransferAccount;
        case ExtensionType.NonTransferable:
            return ExtensionType.NonTransferableAccount;
        case ExtensionType.TransferHook:
            return ExtensionType.TransferHookAccount;
        case ExtensionType.PausableConfig:
            return ExtensionType.PausableAccount;
        case ExtensionType.TransferFeeAmount:
        case ExtensionType.ConfidentialTransferAccount:
        case ExtensionType.CpiGuard:
        case ExtensionType.DefaultAccountState:
        case ExtensionType.ImmutableOwner:
        case ExtensionType.MemoTransfer:
        case ExtensionType.MintCloseAuthority:
        case ExtensionType.MetadataPointer:
        case ExtensionType.TokenMetadata:
        case ExtensionType.Uninitialized:
        case ExtensionType.InterestBearingConfig:
        case ExtensionType.PermanentDelegate:
        case ExtensionType.NonTransferableAccount:
        case ExtensionType.TransferHookAccount:
        case ExtensionType.GroupPointer:
        case ExtensionType.GroupMemberPointer:
        case ExtensionType.TokenGroup:
        case ExtensionType.TokenGroupMember:
        case ExtensionType.ScaledUiAmountConfig:
        case ExtensionType.PausableAccount:
            return ExtensionType.Uninitialized;
    }
}

function getLen(
    extensionTypes: ExtensionType[],
    baseSize: number,
    variableLengthExtensions: { [E in ExtensionType]?: number } = {},
): number {
    if (extensionTypes.length === 0 && Object.keys(variableLengthExtensions).length === 0) {
        return baseSize;
    } else {
        const accountLength =
            ACCOUNT_SIZE +
            ACCOUNT_TYPE_SIZE +
            extensionTypes
                .filter((element, i) => i === extensionTypes.indexOf(element))
                .map(element => addTypeAndLengthToLen(getTypeLen(element)))
                .reduce((a, b) => a + b, 0) +
            Object.entries(variableLengthExtensions)
                .map(([extension, len]) => {
                    if (!isVariableLengthExtension(Number(extension))) {
                        throw Error(`Extension ${extension} is not variable length`);
                    }
                    return addTypeAndLengthToLen(len);
                })
                .reduce((a, b) => a + b, 0);
        if (accountLength === MULTISIG_SIZE) {
            return accountLength + TYPE_SIZE;
        } else {
            return accountLength;
        }
    }
}

export function getMintLen(
    extensionTypes: ExtensionType[],
    variableLengthExtensions: { [E in ExtensionType]?: number } = {},
): number {
    return getLen(extensionTypes, MINT_SIZE, variableLengthExtensions);
}

export function getAccountLen(extensionTypes: ExtensionType[]): number {
    // There are currently no variable length extensions for accounts
    return getLen(extensionTypes, ACCOUNT_SIZE);
}

export function getExtensionData(extension: ExtensionType, tlvData: Buffer): Buffer | null {
    let extensionTypeIndex = 0;
    while (addTypeAndLengthToLen(extensionTypeIndex) <= tlvData.length) {
        const entryType = tlvData.readUInt16LE(extensionTypeIndex);
        const entryLength = tlvData.readUInt16LE(extensionTypeIndex + TYPE_SIZE);
        const typeIndex = addTypeAndLengthToLen(extensionTypeIndex);
        if (entryType == extension) {
            return tlvData.slice(typeIndex, typeIndex + entryLength);
        }
        extensionTypeIndex = typeIndex + entryLength;
    }
    return null;
}

export function getExtensionTypes(tlvData: Buffer): ExtensionType[] {
    const extensionTypes = [];
    let extensionTypeIndex = 0;
    while (extensionTypeIndex < tlvData.length) {
        const entryType = tlvData.readUInt16LE(extensionTypeIndex);
        extensionTypes.push(entryType);
        const entryLength = tlvData.readUInt16LE(extensionTypeIndex + TYPE_SIZE);
        extensionTypeIndex += addTypeAndLengthToLen(entryLength);
    }
    return extensionTypes;
}

export function getAccountLenForMint(mint: Mint): number {
    const extensionTypes = getExtensionTypes(mint.tlvData);
    const accountExtensions = extensionTypes.map(getAccountTypeOfMintType);
    return getAccountLen(accountExtensions);
}

export function getNewAccountLenForExtensionLen(
    info: AccountInfo<Buffer>,
    address: PublicKey,
    extensionType: ExtensionType,
    extensionLen: number,
    programId = TOKEN_2022_PROGRAM_ID,
): number {
    const mint = unpackMint(address, info, programId);
    const extensionData = getExtensionData(extensionType, mint.tlvData);

    const currentExtensionLen = extensionData ? addTypeAndLengthToLen(extensionData.length) : 0;
    const newExtensionLen = addTypeAndLengthToLen(extensionLen);

    return info.data.length + newExtensionLen - currentExtensionLen;
}
