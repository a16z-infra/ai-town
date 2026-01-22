"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LENGTH_SIZE = exports.TYPE_SIZE = exports.ExtensionType = void 0;
exports.getTypeLen = getTypeLen;
exports.isMintExtension = isMintExtension;
exports.isAccountExtension = isAccountExtension;
exports.getAccountTypeOfMintType = getAccountTypeOfMintType;
exports.getMintLen = getMintLen;
exports.getAccountLen = getAccountLen;
exports.getExtensionData = getExtensionData;
exports.getExtensionTypes = getExtensionTypes;
exports.getAccountLenForMint = getAccountLenForMint;
exports.getNewAccountLenForExtensionLen = getNewAccountLenForExtensionLen;
const account_js_1 = require("../state/account.js");
const mint_js_1 = require("../state/mint.js");
const multisig_js_1 = require("../state/multisig.js");
const accountType_js_1 = require("./accountType.js");
const index_js_1 = require("./cpiGuard/index.js");
const index_js_2 = require("./defaultAccountState/index.js");
const index_js_3 = require("./tokenGroup/index.js");
const state_js_1 = require("./groupMemberPointer/state.js");
const state_js_2 = require("./groupPointer/state.js");
const immutableOwner_js_1 = require("./immutableOwner.js");
const state_js_3 = require("./interestBearingMint/state.js");
const index_js_4 = require("./memoTransfer/index.js");
const state_js_4 = require("./metadataPointer/state.js");
const mintCloseAuthority_js_1 = require("./mintCloseAuthority.js");
const nonTransferable_js_1 = require("./nonTransferable.js");
const index_js_5 = require("./pausable/index.js");
const permanentDelegate_js_1 = require("./permanentDelegate.js");
const index_js_6 = require("./scaledUiAmount/index.js");
const index_js_7 = require("./transferFee/index.js");
const index_js_8 = require("./transferHook/index.js");
const constants_js_1 = require("../constants.js");
// Sequence from https://github.com/solana-labs/solana-program-library/blob/master/token/program-2022/src/extension/mod.rs#L903
var ExtensionType;
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
})(ExtensionType || (exports.ExtensionType = ExtensionType = {}));
exports.TYPE_SIZE = 2;
exports.LENGTH_SIZE = 2;
function addTypeAndLengthToLen(len) {
    return len + exports.TYPE_SIZE + exports.LENGTH_SIZE;
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
function getTypeLen(e) {
    switch (e) {
        case ExtensionType.Uninitialized:
            return 0;
        case ExtensionType.TransferFeeConfig:
            return index_js_7.TRANSFER_FEE_CONFIG_SIZE;
        case ExtensionType.TransferFeeAmount:
            return index_js_7.TRANSFER_FEE_AMOUNT_SIZE;
        case ExtensionType.MintCloseAuthority:
            return mintCloseAuthority_js_1.MINT_CLOSE_AUTHORITY_SIZE;
        case ExtensionType.ConfidentialTransferMint:
            return 65;
        case ExtensionType.ConfidentialTransferAccount:
            return 295;
        case ExtensionType.CpiGuard:
            return index_js_1.CPI_GUARD_SIZE;
        case ExtensionType.DefaultAccountState:
            return index_js_2.DEFAULT_ACCOUNT_STATE_SIZE;
        case ExtensionType.ImmutableOwner:
            return immutableOwner_js_1.IMMUTABLE_OWNER_SIZE;
        case ExtensionType.MemoTransfer:
            return index_js_4.MEMO_TRANSFER_SIZE;
        case ExtensionType.MetadataPointer:
            return state_js_4.METADATA_POINTER_SIZE;
        case ExtensionType.NonTransferable:
            return nonTransferable_js_1.NON_TRANSFERABLE_SIZE;
        case ExtensionType.InterestBearingConfig:
            return state_js_3.INTEREST_BEARING_MINT_CONFIG_STATE_SIZE;
        case ExtensionType.PermanentDelegate:
            return permanentDelegate_js_1.PERMANENT_DELEGATE_SIZE;
        case ExtensionType.NonTransferableAccount:
            return nonTransferable_js_1.NON_TRANSFERABLE_ACCOUNT_SIZE;
        case ExtensionType.TransferHook:
            return index_js_8.TRANSFER_HOOK_SIZE;
        case ExtensionType.TransferHookAccount:
            return index_js_8.TRANSFER_HOOK_ACCOUNT_SIZE;
        case ExtensionType.GroupPointer:
            return state_js_2.GROUP_POINTER_SIZE;
        case ExtensionType.GroupMemberPointer:
            return state_js_1.GROUP_MEMBER_POINTER_SIZE;
        case ExtensionType.TokenGroup:
            return index_js_3.TOKEN_GROUP_SIZE;
        case ExtensionType.TokenGroupMember:
            return index_js_3.TOKEN_GROUP_MEMBER_SIZE;
        case ExtensionType.ScaledUiAmountConfig:
            return index_js_6.SCALED_UI_AMOUNT_CONFIG_SIZE;
        case ExtensionType.PausableConfig:
            return index_js_5.PAUSABLE_CONFIG_SIZE;
        case ExtensionType.PausableAccount:
            return index_js_5.PAUSABLE_ACCOUNT_SIZE;
        case ExtensionType.TokenMetadata:
            throw Error(`Cannot get type length for variable extension type: ${e}`);
        default:
            throw Error(`Unknown extension type: ${e}`);
    }
}
function isMintExtension(e) {
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
function isAccountExtension(e) {
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
function getAccountTypeOfMintType(e) {
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
        const accountLength = account_js_1.ACCOUNT_SIZE +
            accountType_js_1.ACCOUNT_TYPE_SIZE +
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
        if (accountLength === multisig_js_1.MULTISIG_SIZE) {
            return accountLength + exports.TYPE_SIZE;
        }
        else {
            return accountLength;
        }
    }
}
function getMintLen(extensionTypes, variableLengthExtensions = {}) {
    return getLen(extensionTypes, mint_js_1.MINT_SIZE, variableLengthExtensions);
}
function getAccountLen(extensionTypes) {
    // There are currently no variable length extensions for accounts
    return getLen(extensionTypes, account_js_1.ACCOUNT_SIZE);
}
function getExtensionData(extension, tlvData) {
    let extensionTypeIndex = 0;
    while (addTypeAndLengthToLen(extensionTypeIndex) <= tlvData.length) {
        const entryType = tlvData.readUInt16LE(extensionTypeIndex);
        const entryLength = tlvData.readUInt16LE(extensionTypeIndex + exports.TYPE_SIZE);
        const typeIndex = addTypeAndLengthToLen(extensionTypeIndex);
        if (entryType == extension) {
            return tlvData.slice(typeIndex, typeIndex + entryLength);
        }
        extensionTypeIndex = typeIndex + entryLength;
    }
    return null;
}
function getExtensionTypes(tlvData) {
    const extensionTypes = [];
    let extensionTypeIndex = 0;
    while (extensionTypeIndex < tlvData.length) {
        const entryType = tlvData.readUInt16LE(extensionTypeIndex);
        extensionTypes.push(entryType);
        const entryLength = tlvData.readUInt16LE(extensionTypeIndex + exports.TYPE_SIZE);
        extensionTypeIndex += addTypeAndLengthToLen(entryLength);
    }
    return extensionTypes;
}
function getAccountLenForMint(mint) {
    const extensionTypes = getExtensionTypes(mint.tlvData);
    const accountExtensions = extensionTypes.map(getAccountTypeOfMintType);
    return getAccountLen(accountExtensions);
}
function getNewAccountLenForExtensionLen(info, address, extensionType, extensionLen, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
    const mint = (0, mint_js_1.unpackMint)(address, info, programId);
    const extensionData = getExtensionData(extensionType, mint.tlvData);
    const currentExtensionLen = extensionData ? addTypeAndLengthToLen(extensionData.length) : 0;
    const newExtensionLen = addTypeAndLengthToLen(extensionLen);
    return info.data.length + newExtensionLen - currentExtensionLen;
}
//# sourceMappingURL=extensionType.js.map