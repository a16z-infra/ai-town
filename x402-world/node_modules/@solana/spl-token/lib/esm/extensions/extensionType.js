import { ACCOUNT_SIZE } from '../state/account.js';
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
export var ExtensionType;
(function (ExtensionType) {
    ExtensionType[ExtensionType["Uninitialized"] = 0] = "Uninitialized";
    ExtensionType[ExtensionType["TransferFeeConfig"] = 1] = "TransferFeeConfig";
    ExtensionType[ExtensionType["TransferFeeAmount"] = 2] = "TransferFeeAmount";
    ExtensionType[ExtensionType["MintCloseAuthority"] = 3] = "MintCloseAuthority";
    ExtensionType[ExtensionType["ConfidentialTransferMint"] = 4] = "ConfidentialTransferMint";
    ExtensionType[ExtensionType["ConfidentialTransferAccount"] = 5] = "ConfidentialTransferAccount";
    ExtensionType[ExtensionType["DefaultAccountState"] = 6] = "DefaultAccountState";
    ExtensionType[ExtensionType["ImmutableOwner"] = 7] = "ImmutableOwner";
    ExtensionType[ExtensionType["MemoTransfer"] = 8] = "MemoTransfer";
    ExtensionType[ExtensionType["NonTransferable"] = 9] = "NonTransferable";
    ExtensionType[ExtensionType["InterestBearingConfig"] = 10] = "InterestBearingConfig";
    ExtensionType[ExtensionType["CpiGuard"] = 11] = "CpiGuard";
    ExtensionType[ExtensionType["PermanentDelegate"] = 12] = "PermanentDelegate";
    ExtensionType[ExtensionType["NonTransferableAccount"] = 13] = "NonTransferableAccount";
    ExtensionType[ExtensionType["TransferHook"] = 14] = "TransferHook";
    ExtensionType[ExtensionType["TransferHookAccount"] = 15] = "TransferHookAccount";
    // ConfidentialTransferFee, // Not implemented yet
    // ConfidentialTransferFeeAmount, // Not implemented yet
    ExtensionType[ExtensionType["MetadataPointer"] = 18] = "MetadataPointer";
    ExtensionType[ExtensionType["TokenMetadata"] = 19] = "TokenMetadata";
    ExtensionType[ExtensionType["GroupPointer"] = 20] = "GroupPointer";
    ExtensionType[ExtensionType["TokenGroup"] = 21] = "TokenGroup";
    ExtensionType[ExtensionType["GroupMemberPointer"] = 22] = "GroupMemberPointer";
    ExtensionType[ExtensionType["TokenGroupMember"] = 23] = "TokenGroupMember";
    // ConfidentialMintBurn, // Not implemented yet
    ExtensionType[ExtensionType["ScaledUiAmountConfig"] = 25] = "ScaledUiAmountConfig";
    ExtensionType[ExtensionType["PausableConfig"] = 26] = "PausableConfig";
    ExtensionType[ExtensionType["PausableAccount"] = 27] = "PausableAccount";
})(ExtensionType || (ExtensionType = {}));
export const TYPE_SIZE = 2;
export const LENGTH_SIZE = 2;
function addTypeAndLengthToLen(len) {
    return len + TYPE_SIZE + LENGTH_SIZE;
}
function isVariableLengthExtension(e) {
    switch (e) {
        case ExtensionType.TokenMetadata:
            return true;
        default:
            return false;
    }
}
// NOTE: All of these should eventually use their type's Span instead of these
// constants.  This is provided for at least creation to work.
export function getTypeLen(e) {
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
export function isMintExtension(e) {
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
export function isAccountExtension(e) {
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
export function getAccountTypeOfMintType(e) {
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
function getLen(extensionTypes, baseSize, variableLengthExtensions = {}) {
    if (extensionTypes.length === 0 && Object.keys(variableLengthExtensions).length === 0) {
        return baseSize;
    }
    else {
        const accountLength = ACCOUNT_SIZE +
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
        }
        else {
            return accountLength;
        }
    }
}
export function getMintLen(extensionTypes, variableLengthExtensions = {}) {
    return getLen(extensionTypes, MINT_SIZE, variableLengthExtensions);
}
export function getAccountLen(extensionTypes) {
    // There are currently no variable length extensions for accounts
    return getLen(extensionTypes, ACCOUNT_SIZE);
}
export function getExtensionData(extension, tlvData) {
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
export function getExtensionTypes(tlvData) {
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
export function getAccountLenForMint(mint) {
    const extensionTypes = getExtensionTypes(mint.tlvData);
    const accountExtensions = extensionTypes.map(getAccountTypeOfMintType);
    return getAccountLen(accountExtensions);
}
export function getNewAccountLenForExtensionLen(info, address, extensionType, extensionLen, programId = TOKEN_2022_PROGRAM_ID) {
    const mint = unpackMint(address, info, programId);
    const extensionData = getExtensionData(extensionType, mint.tlvData);
    const currentExtensionLen = extensionData ? addTypeAndLengthToLen(extensionData.length) : 0;
    const newExtensionLen = addTypeAndLengthToLen(extensionLen);
    return info.data.length + newExtensionLen - currentExtensionLen;
}
//# sourceMappingURL=extensionType.js.map