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
exports.updateTokenMetadata = updateTokenMetadata;
exports.getTokenMetadata = getTokenMetadata;
const spl_token_metadata_1 = require("@solana/spl-token-metadata");
const constants_js_1 = require("../../constants.js");
const extensionType_js_1 = require("../extensionType.js");
const mint_js_1 = require("../../state/mint.js");
const getNormalizedTokenMetadataField = (field) => {
    if (field === spl_token_metadata_1.Field.Name || field === 'Name' || field === 'name') {
        return 'name';
    }
    if (field === spl_token_metadata_1.Field.Symbol || field === 'Symbol' || field === 'symbol') {
        return 'symbol';
    }
    if (field === spl_token_metadata_1.Field.Uri || field === 'Uri' || field === 'uri') {
        return 'uri';
    }
    return field;
};
function updateTokenMetadata(current, key, value) {
    const field = getNormalizedTokenMetadataField(key);
    if (field === 'mint' || field === 'updateAuthority') {
        throw new Error(`Cannot update ${field} via this instruction`);
    }
    // Handle updates to default keys
    if (['name', 'symbol', 'uri'].includes(field)) {
        return Object.assign(Object.assign({}, current), { [field]: value });
    }
    // Avoid mutating input, make a shallow copy
    const additionalMetadata = [...current.additionalMetadata];
    const i = current.additionalMetadata.findIndex(x => x[0] === field);
    if (i === -1) {
        // Key was not found, add it
        additionalMetadata.push([field, value]);
    }
    else {
        // Key was found, change value
        additionalMetadata[i] = [field, value];
    }
    return Object.assign(Object.assign({}, current), { additionalMetadata });
}
/**
 * Retrieve Token Metadata Information
 *
 * @param connection Connection to use
 * @param address    Mint account
 * @param commitment Desired level of commitment for querying the state
 * @param programId  SPL Token program account
 *
 * @return Token Metadata information
 */
function getTokenMetadata(connection_1, address_1, commitment_1) {
    return __awaiter(this, arguments, void 0, function* (connection, address, commitment, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
        const mintInfo = yield (0, mint_js_1.getMint)(connection, address, commitment, programId);
        const data = (0, extensionType_js_1.getExtensionData)(extensionType_js_1.ExtensionType.TokenMetadata, mintInfo.tlvData);
        if (data === null) {
            return null;
        }
        return (0, spl_token_metadata_1.unpack)(data);
    });
}
//# sourceMappingURL=state.js.map