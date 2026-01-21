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
exports.tokenGroupInitializeGroup = tokenGroupInitializeGroup;
exports.tokenGroupInitializeGroupWithRentTransfer = tokenGroupInitializeGroupWithRentTransfer;
exports.tokenGroupUpdateGroupMaxSize = tokenGroupUpdateGroupMaxSize;
exports.tokenGroupUpdateGroupAuthority = tokenGroupUpdateGroupAuthority;
exports.tokenGroupMemberInitialize = tokenGroupMemberInitialize;
exports.tokenGroupMemberInitializeWithRentTransfer = tokenGroupMemberInitializeWithRentTransfer;
const web3_js_1 = require("@solana/web3.js");
const spl_token_group_1 = require("@solana/spl-token-group");
const constants_js_1 = require("../../constants.js");
const internal_js_1 = require("../../actions/internal.js");
/**
 * Initialize a new `Group`
 *
 * Assumes one has already initialized a mint for the group.
 *
 * @param connection       Connection to use
 * @param payer            Payer of the transaction fee
 * @param mint             Group mint
 * @param mintAuthority    Group mint authority
 * @param updateAuthority  Group update authority
 * @param maxSize          Maximum number of members in the group
 * @param multiSigners     Signing accounts if `authority` is a multisig
 * @param confirmOptions   Options for confirming the transaction
 * @param programId        SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
function tokenGroupInitializeGroup(connection_1, payer_1, mint_1, mintAuthority_1, updateAuthority_1, maxSize_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, mint, mintAuthority, updateAuthority, maxSize, multiSigners = [], confirmOptions, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
        const [mintAuthorityPublicKey, signers] = (0, internal_js_1.getSigners)(mintAuthority, multiSigners);
        const transaction = new web3_js_1.Transaction().add((0, spl_token_group_1.createInitializeGroupInstruction)({
            programId,
            group: mint,
            mint,
            mintAuthority: mintAuthorityPublicKey,
            updateAuthority,
            maxSize,
        }));
        return yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer, ...signers], confirmOptions);
    });
}
/**
 * Initialize a new `Group` with rent transfer.
 *
 * Assumes one has already initialized a mint for the group.
 *
 * @param connection       Connection to use
 * @param payer            Payer of the transaction fee
 * @param mint             Group mint
 * @param mintAuthority    Group mint authority
 * @param updateAuthority  Group update authority
 * @param maxSize          Maximum number of members in the group
 * @param multiSigners     Signing accounts if `authority` is a multisig
 * @param confirmOptions   Options for confirming the transaction
 * @param programId        SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
function tokenGroupInitializeGroupWithRentTransfer(connection_1, payer_1, mint_1, mintAuthority_1, updateAuthority_1, maxSize_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, mint, mintAuthority, updateAuthority, maxSize, multiSigners = [], confirmOptions, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
        const [mintAuthorityPublicKey, signers] = (0, internal_js_1.getSigners)(mintAuthority, multiSigners);
        const lamports = yield connection.getMinimumBalanceForRentExemption(spl_token_group_1.TOKEN_GROUP_SIZE);
        const transaction = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.transfer({
            fromPubkey: payer.publicKey,
            toPubkey: mint,
            lamports,
        }), (0, spl_token_group_1.createInitializeGroupInstruction)({
            programId,
            group: mint,
            mint,
            mintAuthority: mintAuthorityPublicKey,
            updateAuthority,
            maxSize,
        }));
        return yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer, ...signers], confirmOptions);
    });
}
/**
 * Update the max size of a `Group`
 *
 * @param connection       Connection to use
 * @param payer            Payer of the transaction fee
 * @param mint             Group mint
 * @param updateAuthority  Group update authority
 * @param maxSize          Maximum number of members in the group
 * @param multiSigners     Signing accounts if `authority` is a multisig
 * @param confirmOptions   Options for confirming the transaction
 * @param programId        SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
function tokenGroupUpdateGroupMaxSize(connection_1, payer_1, mint_1, updateAuthority_1, maxSize_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, mint, updateAuthority, maxSize, multiSigners = [], confirmOptions, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
        const [updateAuthorityPublicKey, signers] = (0, internal_js_1.getSigners)(updateAuthority, multiSigners);
        const transaction = new web3_js_1.Transaction().add((0, spl_token_group_1.createUpdateGroupMaxSizeInstruction)({
            programId,
            group: mint,
            updateAuthority: updateAuthorityPublicKey,
            maxSize,
        }));
        return yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer, ...signers], confirmOptions);
    });
}
/**
 * Update the authority of a `Group`
 *
 * @param connection       Connection to use
 * @param payer            Payer of the transaction fee
 * @param mint             Group mint
 * @param updateAuthority  Group update authority
 * @param newAuthority     New authority for the token group, or unset
 * @param multiSigners     Signing accounts if `authority` is a multisig
 * @param confirmOptions   Options for confirming the transaction
 * @param programId        SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
function tokenGroupUpdateGroupAuthority(connection_1, payer_1, mint_1, updateAuthority_1, newAuthority_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, mint, updateAuthority, newAuthority, multiSigners = [], confirmOptions, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
        const [updateAuthorityPublicKey, signers] = (0, internal_js_1.getSigners)(updateAuthority, multiSigners);
        const transaction = new web3_js_1.Transaction().add((0, spl_token_group_1.createUpdateGroupAuthorityInstruction)({
            programId,
            group: mint,
            currentAuthority: updateAuthorityPublicKey,
            newAuthority,
        }));
        return yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer, ...signers], confirmOptions);
    });
}
/**
 * Initialize a new `Member` of a `Group`
 *
 * Assumes the `Group` has already been initialized,
 * as well as the mint for the member.
 *
 * @param connection             Connection to use
 * @param payer                  Payer of the transaction fee
 * @param mint                   Member mint
 * @param mintAuthority          Member mint authority
 * @param group                  Group mint
 * @param groupUpdateAuthority   Group update authority
 * @param multiSigners           Signing accounts if `authority` is a multisig
 * @param confirmOptions         Options for confirming the transaction
 * @param programId              SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
function tokenGroupMemberInitialize(connection_1, payer_1, mint_1, mintAuthority_1, group_1, groupUpdateAuthority_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, mint, mintAuthority, group, groupUpdateAuthority, multiSigners = [], confirmOptions, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
        const [mintAuthorityPublicKey, signers] = (0, internal_js_1.getSigners)(mintAuthority, multiSigners);
        const transaction = new web3_js_1.Transaction().add((0, spl_token_group_1.createInitializeMemberInstruction)({
            programId,
            member: mint,
            memberMint: mint,
            memberMintAuthority: mintAuthorityPublicKey,
            group,
            groupUpdateAuthority,
        }));
        return yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer, ...signers], confirmOptions);
    });
}
/**
 * Initialize a new `Member` of a `Group` with rent transfer.
 *
 * Assumes the `Group` has already been initialized,
 * as well as the mint for the member.
 *
 * @param connection             Connection to use
 * @param payer                  Payer of the transaction fee
 * @param mint                   Member mint
 * @param mintAuthority          Member mint authority
 * @param group                  Group mint
 * @param groupUpdateAuthority   Group update authority
 * @param multiSigners           Signing accounts if `authority` is a multisig
 * @param confirmOptions         Options for confirming the transaction
 * @param programId              SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
function tokenGroupMemberInitializeWithRentTransfer(connection_1, payer_1, mint_1, mintAuthority_1, group_1, groupUpdateAuthority_1) {
    return __awaiter(this, arguments, void 0, function* (connection, payer, mint, mintAuthority, group, groupUpdateAuthority, multiSigners = [], confirmOptions, programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
        const [mintAuthorityPublicKey, signers] = (0, internal_js_1.getSigners)(mintAuthority, multiSigners);
        const lamports = yield connection.getMinimumBalanceForRentExemption(spl_token_group_1.TOKEN_GROUP_MEMBER_SIZE);
        const transaction = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.transfer({
            fromPubkey: payer.publicKey,
            toPubkey: mint,
            lamports,
        }), (0, spl_token_group_1.createInitializeMemberInstruction)({
            programId,
            member: mint,
            memberMint: mint,
            memberMintAuthority: mintAuthorityPublicKey,
            group,
            groupUpdateAuthority,
        }));
        return yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [payer, ...signers], confirmOptions);
    });
}
//# sourceMappingURL=actions.js.map