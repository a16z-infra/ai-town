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
exports.tokenMetadataInitialize = tokenMetadataInitialize;
exports.tokenMetadataInitializeWithRentTransfer = tokenMetadataInitializeWithRentTransfer;
exports.tokenMetadataUpdateField = tokenMetadataUpdateField;
exports.tokenMetadataUpdateFieldWithRentTransfer = tokenMetadataUpdateFieldWithRentTransfer;
exports.tokenMetadataRemoveKey = tokenMetadataRemoveKey;
exports.tokenMetadataUpdateAuthority = tokenMetadataUpdateAuthority;
const web3_js_1 = require("@solana/web3.js");
const spl_token_metadata_1 = require("@solana/spl-token-metadata");
const constants_js_1 = require("../../constants.js");
const internal_js_1 = require("../../actions/internal.js");
const extensionType_js_1 = require("../extensionType.js");
const state_js_1 = require("./state.js");
const errors_js_1 = require("../../errors.js");
const index_js_1 = require("../../state/index.js");
function getAdditionalRentForNewMetadata(connection_1, address_1, tokenMetadata_1) {
    return __awaiter(this, arguments, void 0, function* (connection, address, tokenMetadata, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
        const info = yield connection.getAccountInfo(address);
        if (!info) {
            throw new errors_js_1.TokenAccountNotFoundError();
        }
        const extensionLen = (0, spl_token_metadata_1.pack)(tokenMetadata).length;
        const newAccountLen = (0, extensionType_js_1.getNewAccountLenForExtensionLen)(info, address, extensionType_js_1.ExtensionType.TokenMetadata, extensionLen, programId);
        if (newAccountLen <= info.data.length) {
            return 0;
        }
        const newRentExemptMinimum = yield connection.getMinimumBalanceForRentExemption(newAccountLen);
        return newRentExemptMinimum - info.lamports;
    });
}
function getAdditionalRentForUpdatedMetadata(connection_1, address_1, field_1, value_1) {
    return __awaiter(this, arguments, void 0, function* (connection, address, field, value, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
        const info = yield connection.getAccountInfo(address);
        if (!info) {
            throw new errors_js_1.TokenAccountNotFoundError();
        }
        const mint = (0, index_js_1.unpackMint)(address, info, programId);
        const extensionData = (0, extensionType_js_1.getExtensionData)(extensionType_js_1.ExtensionType.TokenMetadata, mint.tlvData);
        if (extensionData === null) {
            throw new Error('TokenMetadata extension not initialized');
        }
        const updatedTokenMetadata = (0, state_js_1.updateTokenMetadata)((0, spl_token_metadata_1.unpack)(extensionData), field, value);
        const extensionLen = (0, spl_token_metadata_1.pack)(updatedTokenMetadata).length;
        const newAccountLen = (0, extensionType_js_1.getNewAccountLenForExtensionLen)(info, address, extensionType_js_1.ExtensionType.TokenMetadata, extensionLen, programId);
        if (newAccountLen <= info.data.length) {
            return 0;
        }
        const newRentExemptMinimum = yield connection.getMinimumBalanceForRentExemption(newAccountLen);
        return newRentExemptMinimum - info.lamports;
    });
}
/**
 * Initializes a TLV entry with the basic token-metadata fields.
 *
 * @param connection       Connection to use
 * @param payer            Payer of the transaction fees
 * @param mint             Mint Account
 * @param updateAuthority  Update Authority
 * @param mintAuthority    Mint Authority
 * @param name             Longer name of token
 * @param symbol           Shortened symbol of token
 * @param uri              URI pointing to more metadata (image, video, etc)
 * @param multiSigners     Signing accounts if `authority` is a multisig
 * @param confirmOptions   Options for confirming the transaction
 * @param programId        SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
function tokenMetadataInitialize(connection_1, payer_1, mint_1, updateAuthority_1, mintAuthority_1, name_1, symbol_1, uri_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, mint, updateAuthority, mintAuthority, name, symbol, uri, multiSigners = [], confirmOptions, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
        const [mintAuthorityPublicKey, signers] = (0, internal_js_1.getSigners)(mintAuthority, multiSigners);
        const transaction = new web3_js_1.Transaction().add((0, spl_token_metadata_1.createInitializeInstruction)({
            programId,
            metadata: mint,
            updateAuthority,
            mint,
            mintAuthority: mintAuthorityPublicKey,
            name,
            symbol,
            uri,
        }));
        return yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer, ...signers], confirmOptions);
    });
}
/**
 * Initializes a TLV entry with the basic token-metadata fields,
 * Includes a transfer for any additional rent-exempt SOL if required.
 *
 * @param connection       Connection to use
 * @param payer            Payer of the transaction fees
 * @param mint             Mint Account
 * @param updateAuthority  Update Authority
 * @param mintAuthority    Mint Authority
 * @param name             Longer name of token
 * @param symbol           Shortened symbol of token
 * @param uri              URI pointing to more metadata (image, video, etc)
 * @param multiSigners     Signing accounts if `authority` is a multisig
 * @param confirmOptions   Options for confirming the transaction
 * @param programId        SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
function tokenMetadataInitializeWithRentTransfer(connection_1, payer_1, mint_1, updateAuthority_1, mintAuthority_1, name_1, symbol_1, uri_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, mint, updateAuthority, mintAuthority, name, symbol, uri, multiSigners = [], confirmOptions, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
        const [mintAuthorityPublicKey, signers] = (0, internal_js_1.getSigners)(mintAuthority, multiSigners);
        const transaction = new web3_js_1.Transaction();
        const lamports = yield getAdditionalRentForNewMetadata(connection, mint, {
            updateAuthority,
            mint,
            name,
            symbol,
            uri,
            additionalMetadata: [],
        }, programId);
        if (lamports > 0) {
            transaction.add(web3_js_1.SystemProgram.transfer({ fromPubkey: payer.publicKey, toPubkey: mint, lamports: lamports }));
        }
        transaction.add((0, spl_token_metadata_1.createInitializeInstruction)({
            programId,
            metadata: mint,
            updateAuthority,
            mint,
            mintAuthority: mintAuthorityPublicKey,
            name,
            symbol,
            uri,
        }));
        return yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer, ...signers], confirmOptions);
    });
}
/**
 * Updates a field in a token-metadata account.
 * If the field does not exist on the account, it will be created.
 * If the field does exist, it will be overwritten.
 *
 * The field can be one of the required fields (name, symbol, URI), or a
 * totally new field denoted by a "key" string.
 * @param connection       Connection to use
 * @param payer            Payer of the transaction fees
 * @param mint             Mint Account
 * @param updateAuthority  Update Authority
 * @param field            Field to update in the metadata
 * @param value            Value to write for the field
 * @param multiSigners     Signing accounts if `authority` is a multisig
 * @param confirmOptions   Options for confirming the transaction
 * @param programId        SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
function tokenMetadataUpdateField(connection_1, payer_1, mint_1, updateAuthority_1, field_1, value_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, mint, updateAuthority, field, value, multiSigners = [], confirmOptions, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
        const [updateAuthorityPublicKey, signers] = (0, internal_js_1.getSigners)(updateAuthority, multiSigners);
        const transaction = new web3_js_1.Transaction().add((0, spl_token_metadata_1.createUpdateFieldInstruction)({
            programId,
            metadata: mint,
            updateAuthority: updateAuthorityPublicKey,
            field,
            value,
        }));
        return yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer, ...signers], confirmOptions);
    });
}
/**
 * Updates a field in a token-metadata account.
 * If the field does not exist on the account, it will be created.
 * If the field does exist, it will be overwritten.
 * Includes a transfer for any additional rent-exempt SOL if required.
 *
 * The field can be one of the required fields (name, symbol, URI), or a
 * totally new field denoted by a "key" string.
 * @param connection       Connection to use
 * @param payer            Payer of the transaction fees
 * @param mint             Mint Account
 * @param updateAuthority  Update Authority
 * @param field            Field to update in the metadata
 * @param value            Value to write for the field
 * @param multiSigners     Signing accounts if `authority` is a multisig
 * @param confirmOptions   Options for confirming the transaction
 * @param programId        SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
function tokenMetadataUpdateFieldWithRentTransfer(connection_1, payer_1, mint_1, updateAuthority_1, field_1, value_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, mint, updateAuthority, field, value, multiSigners = [], confirmOptions, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
        const [updateAuthorityPublicKey, signers] = (0, internal_js_1.getSigners)(updateAuthority, multiSigners);
        const transaction = new web3_js_1.Transaction();
        const lamports = yield getAdditionalRentForUpdatedMetadata(connection, mint, field, value, programId);
        if (lamports > 0) {
            transaction.add(web3_js_1.SystemProgram.transfer({ fromPubkey: payer.publicKey, toPubkey: mint, lamports: lamports }));
        }
        transaction.add((0, spl_token_metadata_1.createUpdateFieldInstruction)({
            programId,
            metadata: mint,
            updateAuthority: updateAuthorityPublicKey,
            field,
            value,
        }));
        return yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer, ...signers], confirmOptions);
    });
}
/**
 * Remove a field in a token-metadata account.
 *
 * The field can be one of the required fields (name, symbol, URI), or a
 * totally new field denoted by a "key" string.
 * @param connection       Connection to use
 * @param payer            Payer of the transaction fees
 * @param mint             Mint Account
 * @param updateAuthority  Update Authority
 * @param key              Key to remove in the additional metadata portion
 * @param idempotent       When true, instruction will not error if the key does not exist
 * @param multiSigners     Signing accounts if `authority` is a multisig
 * @param confirmOptions   Options for confirming the transaction
 * @param programId        SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
function tokenMetadataRemoveKey(connection_1, payer_1, mint_1, updateAuthority_1, key_1, idempotent_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, mint, updateAuthority, key, idempotent, multiSigners = [], confirmOptions, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
        const [updateAuthorityPublicKey, signers] = (0, internal_js_1.getSigners)(updateAuthority, multiSigners);
        const transaction = new web3_js_1.Transaction().add((0, spl_token_metadata_1.createRemoveKeyInstruction)({
            programId,
            metadata: mint,
            updateAuthority: updateAuthorityPublicKey,
            key,
            idempotent,
        }));
        return yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer, ...signers], confirmOptions);
    });
}
/**
 *  Update authority
 *
 * @param connection       Connection to use
 * @param payer            Payer of the transaction fees
 * @param mint             Mint Account
 * @param updateAuthority  Update Authority
 * @param newAuthority     New authority for the token metadata, or unset
 * @param multiSigners     Signing accounts if `authority` is a multisig
 * @param confirmOptions   Options for confirming the transaction
 * @param programId        SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
function tokenMetadataUpdateAuthority(connection_1, payer_1, mint_1, updateAuthority_1, newAuthority_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, mint, updateAuthority, newAuthority, multiSigners = [], confirmOptions, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
        const [updateAuthorityPublicKey, signers] = (0, internal_js_1.getSigners)(updateAuthority, multiSigners);
        const transaction = new web3_js_1.Transaction().add((0, spl_token_metadata_1.createUpdateAuthorityInstruction)({
            programId,
            metadata: mint,
            oldAuthority: updateAuthorityPublicKey,
            newAuthority,
        }));
        return yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer, ...signers], confirmOptions);
    });
}
//# sourceMappingURL=actions.js.map