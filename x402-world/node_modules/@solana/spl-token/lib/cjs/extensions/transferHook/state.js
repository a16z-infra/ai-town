"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtraAccountMetaAccountDataLayout = exports.ExtraAccountMetaListLayout = exports.ExtraAccountMetaLayout = exports.TRANSFER_HOOK_ACCOUNT_SIZE = exports.TransferHookAccountLayout = exports.TRANSFER_HOOK_SIZE = exports.TransferHookLayout = void 0;
exports.getTransferHook = getTransferHook;
exports.getTransferHookAccount = getTransferHookAccount;
exports.getExtraAccountMetaAddress = getExtraAccountMetaAddress;
exports.getExtraAccountMetas = getExtraAccountMetas;
exports.resolveExtraAccountMeta = resolveExtraAccountMeta;
const buffer_layout_1 = require("@solana/buffer-layout");
const extensionType_js_1 = require("../extensionType.js");
const web3_js_1 = require("@solana/web3.js");
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
const errors_js_1 = require("../../errors.js");
const seeds_js_1 = require("./seeds.js");
const pubkeyData_js_1 = require("./pubkeyData.js");
/** Buffer layout for de/serializing a transfer hook extension */
exports.TransferHookLayout = (0, buffer_layout_1.struct)([(0, buffer_layout_utils_1.publicKey)('authority'), (0, buffer_layout_utils_1.publicKey)('programId')]);
exports.TRANSFER_HOOK_SIZE = exports.TransferHookLayout.span;
function getTransferHook(mint) {
    const extensionData = (0, extensionType_js_1.getExtensionData)(extensionType_js_1.ExtensionType.TransferHook, mint.tlvData);
    if (extensionData !== null) {
        return exports.TransferHookLayout.decode(extensionData);
    }
    else {
        return null;
    }
}
/** Buffer layout for de/serializing a transfer hook account extension */
exports.TransferHookAccountLayout = (0, buffer_layout_1.struct)([(0, buffer_layout_utils_1.bool)('transferring')]);
exports.TRANSFER_HOOK_ACCOUNT_SIZE = exports.TransferHookAccountLayout.span;
function getTransferHookAccount(account) {
    const extensionData = (0, extensionType_js_1.getExtensionData)(extensionType_js_1.ExtensionType.TransferHookAccount, account.tlvData);
    if (extensionData !== null) {
        return exports.TransferHookAccountLayout.decode(extensionData);
    }
    else {
        return null;
    }
}
function getExtraAccountMetaAddress(mint, programId) {
    const seeds = [Buffer.from('extra-account-metas'), mint.toBuffer()];
    return web3_js_1.PublicKey.findProgramAddressSync(seeds, programId)[0];
}
/** Buffer layout for de/serializing an ExtraAccountMeta */
exports.ExtraAccountMetaLayout = (0, buffer_layout_1.struct)([
    (0, buffer_layout_1.u8)('discriminator'),
    (0, buffer_layout_1.blob)(32, 'addressConfig'),
    (0, buffer_layout_utils_1.bool)('isSigner'),
    (0, buffer_layout_utils_1.bool)('isWritable'),
]);
/** Buffer layout for de/serializing a list of ExtraAccountMeta prefixed by a u32 length */
exports.ExtraAccountMetaListLayout = (0, buffer_layout_1.struct)([
    (0, buffer_layout_1.u32)('count'),
    (0, buffer_layout_1.seq)(exports.ExtraAccountMetaLayout, (0, buffer_layout_1.greedy)(exports.ExtraAccountMetaLayout.span), 'extraAccounts'),
]);
/** Buffer layout for de/serializing an ExtraAccountMetaAccountData */
exports.ExtraAccountMetaAccountDataLayout = (0, buffer_layout_1.struct)([
    (0, buffer_layout_utils_1.u64)('instructionDiscriminator'),
    (0, buffer_layout_1.u32)('length'),
    exports.ExtraAccountMetaListLayout.replicate('extraAccountsList'),
]);
/** Unpack an extra account metas account and parse the data into a list of ExtraAccountMetas */
function getExtraAccountMetas(account) {
    const extraAccountsList = exports.ExtraAccountMetaAccountDataLayout.decode(account.data).extraAccountsList;
    return extraAccountsList.extraAccounts.slice(0, extraAccountsList.count);
}
/** Take an ExtraAccountMeta and construct that into an actual AccountMeta */
function resolveExtraAccountMeta(connection, extraMeta, previousMetas, instructionData, transferHookProgramId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (extraMeta.discriminator === 0) {
            return {
                pubkey: new web3_js_1.PublicKey(extraMeta.addressConfig),
                isSigner: extraMeta.isSigner,
                isWritable: extraMeta.isWritable,
            };
        }
        else if (extraMeta.discriminator === 2) {
            const pubkey = yield (0, pubkeyData_js_1.unpackPubkeyData)(extraMeta.addressConfig, previousMetas, instructionData, connection);
            return {
                pubkey,
                isSigner: extraMeta.isSigner,
                isWritable: extraMeta.isWritable,
            };
        }
        let programId = web3_js_1.PublicKey.default;
        if (extraMeta.discriminator === 1) {
            programId = transferHookProgramId;
        }
        else {
            const accountIndex = extraMeta.discriminator - (1 << 7);
            if (previousMetas.length <= accountIndex) {
                throw new errors_js_1.TokenTransferHookAccountNotFound();
            }
            programId = previousMetas[accountIndex].pubkey;
        }
        const seeds = yield (0, seeds_js_1.unpackSeeds)(extraMeta.addressConfig, previousMetas, instructionData, connection);
        const pubkey = web3_js_1.PublicKey.findProgramAddressSync(seeds, programId)[0];
        return { pubkey, isSigner: extraMeta.isSigner, isWritable: extraMeta.isWritable };
    });
}
//# sourceMappingURL=state.js.map