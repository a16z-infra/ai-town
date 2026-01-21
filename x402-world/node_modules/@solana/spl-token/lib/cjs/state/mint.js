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
exports.MINT_SIZE = exports.MintLayout = void 0;
exports.getMint = getMint;
exports.unpackMint = unpackMint;
exports.getMinimumBalanceForRentExemptMint = getMinimumBalanceForRentExemptMint;
exports.getMinimumBalanceForRentExemptMintWithExtensions = getMinimumBalanceForRentExemptMintWithExtensions;
exports.getAssociatedTokenAddress = getAssociatedTokenAddress;
exports.getAssociatedTokenAddressSync = getAssociatedTokenAddressSync;
const buffer_layout_1 = require("@solana/buffer-layout");
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../constants.js");
const errors_js_1 = require("../errors.js");
const accountType_js_1 = require("../extensions/accountType.js");
const extensionType_js_1 = require("../extensions/extensionType.js");
const account_js_1 = require("./account.js");
const multisig_js_1 = require("./multisig.js");
/** Buffer layout for de/serializing a mint */
exports.MintLayout = (0, buffer_layout_1.struct)([
    (0, buffer_layout_1.u32)('mintAuthorityOption'),
    (0, buffer_layout_utils_1.publicKey)('mintAuthority'),
    (0, buffer_layout_utils_1.u64)('supply'),
    (0, buffer_layout_1.u8)('decimals'),
    (0, buffer_layout_utils_1.bool)('isInitialized'),
    (0, buffer_layout_1.u32)('freezeAuthorityOption'),
    (0, buffer_layout_utils_1.publicKey)('freezeAuthority'),
]);
/** Byte length of a mint */
exports.MINT_SIZE = exports.MintLayout.span;
/**
 * Retrieve information about a mint
 *
 * @param connection Connection to use
 * @param address    Mint account
 * @param commitment Desired level of commitment for querying the state
 * @param programId  SPL Token program account
 *
 * @return Mint information
 */
function getMint(connection_1, address_1, commitment_1) {
    return __awaiter(this, arguments, void 0, function* (connection, address, commitment, programId = constants_js_1.TOKEN_PROGRAM_ID) {
        const info = yield connection.getAccountInfo(address, commitment);
        return unpackMint(address, info, programId);
    });
}
/**
 * Unpack a mint
 *
 * @param address   Mint account
 * @param info      Mint account data
 * @param programId SPL Token program account
 *
 * @return Unpacked mint
 */
function unpackMint(address, info, programId = constants_js_1.TOKEN_PROGRAM_ID) {
    if (!info)
        throw new errors_js_1.TokenAccountNotFoundError();
    if (!info.owner.equals(programId))
        throw new errors_js_1.TokenInvalidAccountOwnerError();
    if (info.data.length < exports.MINT_SIZE)
        throw new errors_js_1.TokenInvalidAccountSizeError();
    const rawMint = exports.MintLayout.decode(info.data.slice(0, exports.MINT_SIZE));
    let tlvData = Buffer.alloc(0);
    if (info.data.length > exports.MINT_SIZE) {
        if (info.data.length <= account_js_1.ACCOUNT_SIZE)
            throw new errors_js_1.TokenInvalidAccountSizeError();
        if (info.data.length === multisig_js_1.MULTISIG_SIZE)
            throw new errors_js_1.TokenInvalidAccountSizeError();
        if (info.data[account_js_1.ACCOUNT_SIZE] != accountType_js_1.AccountType.Mint)
            throw new errors_js_1.TokenInvalidMintError();
        tlvData = info.data.slice(account_js_1.ACCOUNT_SIZE + accountType_js_1.ACCOUNT_TYPE_SIZE);
    }
    return {
        address,
        mintAuthority: rawMint.mintAuthorityOption ? rawMint.mintAuthority : null,
        supply: rawMint.supply,
        decimals: rawMint.decimals,
        isInitialized: rawMint.isInitialized,
        freezeAuthority: rawMint.freezeAuthorityOption ? rawMint.freezeAuthority : null,
        tlvData,
    };
}
/** Get the minimum lamport balance for a mint to be rent exempt
 *
 * @param connection Connection to use
 * @param commitment Desired level of commitment for querying the state
 *
 * @return Amount of lamports required
 */
function getMinimumBalanceForRentExemptMint(connection, commitment) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield getMinimumBalanceForRentExemptMintWithExtensions(connection, [], commitment);
    });
}
/** Get the minimum lamport balance for a rent-exempt mint with extensions
 *
 * @param connection Connection to use
 * @param extensions Extension types included in the mint
 * @param commitment Desired level of commitment for querying the state
 *
 * @return Amount of lamports required
 */
function getMinimumBalanceForRentExemptMintWithExtensions(connection, extensions, commitment) {
    return __awaiter(this, void 0, void 0, function* () {
        const mintLen = (0, extensionType_js_1.getMintLen)(extensions);
        return yield connection.getMinimumBalanceForRentExemption(mintLen, commitment);
    });
}
/**
 * Async version of getAssociatedTokenAddressSync
 * For backwards compatibility
 *
 * @param mint                     Token mint account
 * @param owner                    Owner of the new account
 * @param allowOwnerOffCurve       Allow the owner account to be a PDA (Program Derived Address)
 * @param programId                SPL Token program account
 * @param associatedTokenProgramId SPL Associated Token program account
 *
 * @return Promise containing the address of the associated token account
 */
function getAssociatedTokenAddress(mint_1, owner_1) {
    return __awaiter(this, arguments, void 0, function* (mint, owner, allowOwnerOffCurve = false, programId = constants_js_1.TOKEN_PROGRAM_ID, associatedTokenProgramId = constants_js_1.ASSOCIATED_TOKEN_PROGRAM_ID) {
        if (!allowOwnerOffCurve && !web3_js_1.PublicKey.isOnCurve(owner.toBuffer()))
            throw new errors_js_1.TokenOwnerOffCurveError();
        const [address] = yield web3_js_1.PublicKey.findProgramAddress([owner.toBuffer(), programId.toBuffer(), mint.toBuffer()], associatedTokenProgramId);
        return address;
    });
}
/**
 * Get the address of the associated token account for a given mint and owner
 *
 * @param mint                     Token mint account
 * @param owner                    Owner of the new account
 * @param allowOwnerOffCurve       Allow the owner account to be a PDA (Program Derived Address)
 * @param programId                SPL Token program account
 * @param associatedTokenProgramId SPL Associated Token program account
 *
 * @return Address of the associated token account
 */
function getAssociatedTokenAddressSync(mint, owner, allowOwnerOffCurve = false, programId = constants_js_1.TOKEN_PROGRAM_ID, associatedTokenProgramId = constants_js_1.ASSOCIATED_TOKEN_PROGRAM_ID) {
    if (!allowOwnerOffCurve && !web3_js_1.PublicKey.isOnCurve(owner.toBuffer()))
        throw new errors_js_1.TokenOwnerOffCurveError();
    const [address] = web3_js_1.PublicKey.findProgramAddressSync([owner.toBuffer(), programId.toBuffer(), mint.toBuffer()], associatedTokenProgramId);
    return address;
}
//# sourceMappingURL=mint.js.map