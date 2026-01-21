import { struct, u32, u8 } from '@solana/buffer-layout';
import { bool, publicKey, u64 } from '@solana/buffer-layout-utils';
import { PublicKey } from '@solana/web3.js';
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '../constants.js';
import { TokenAccountNotFoundError, TokenInvalidAccountOwnerError, TokenInvalidAccountSizeError, TokenInvalidMintError, TokenOwnerOffCurveError, } from '../errors.js';
import { ACCOUNT_TYPE_SIZE, AccountType } from '../extensions/accountType.js';
import { getMintLen } from '../extensions/extensionType.js';
import { ACCOUNT_SIZE } from './account.js';
import { MULTISIG_SIZE } from './multisig.js';
/** Buffer layout for de/serializing a mint */
export const MintLayout = struct([
    u32('mintAuthorityOption'),
    publicKey('mintAuthority'),
    u64('supply'),
    u8('decimals'),
    bool('isInitialized'),
    u32('freezeAuthorityOption'),
    publicKey('freezeAuthority'),
]);
/** Byte length of a mint */
export const MINT_SIZE = MintLayout.span;
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
export async function getMint(connection, address, commitment, programId = TOKEN_PROGRAM_ID) {
    const info = await connection.getAccountInfo(address, commitment);
    return unpackMint(address, info, programId);
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
export function unpackMint(address, info, programId = TOKEN_PROGRAM_ID) {
    if (!info)
        throw new TokenAccountNotFoundError();
    if (!info.owner.equals(programId))
        throw new TokenInvalidAccountOwnerError();
    if (info.data.length < MINT_SIZE)
        throw new TokenInvalidAccountSizeError();
    const rawMint = MintLayout.decode(info.data.slice(0, MINT_SIZE));
    let tlvData = Buffer.alloc(0);
    if (info.data.length > MINT_SIZE) {
        if (info.data.length <= ACCOUNT_SIZE)
            throw new TokenInvalidAccountSizeError();
        if (info.data.length === MULTISIG_SIZE)
            throw new TokenInvalidAccountSizeError();
        if (info.data[ACCOUNT_SIZE] != AccountType.Mint)
            throw new TokenInvalidMintError();
        tlvData = info.data.slice(ACCOUNT_SIZE + ACCOUNT_TYPE_SIZE);
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
export async function getMinimumBalanceForRentExemptMint(connection, commitment) {
    return await getMinimumBalanceForRentExemptMintWithExtensions(connection, [], commitment);
}
/** Get the minimum lamport balance for a rent-exempt mint with extensions
 *
 * @param connection Connection to use
 * @param extensions Extension types included in the mint
 * @param commitment Desired level of commitment for querying the state
 *
 * @return Amount of lamports required
 */
export async function getMinimumBalanceForRentExemptMintWithExtensions(connection, extensions, commitment) {
    const mintLen = getMintLen(extensions);
    return await connection.getMinimumBalanceForRentExemption(mintLen, commitment);
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
export async function getAssociatedTokenAddress(mint, owner, allowOwnerOffCurve = false, programId = TOKEN_PROGRAM_ID, associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID) {
    if (!allowOwnerOffCurve && !PublicKey.isOnCurve(owner.toBuffer()))
        throw new TokenOwnerOffCurveError();
    const [address] = await PublicKey.findProgramAddress([owner.toBuffer(), programId.toBuffer(), mint.toBuffer()], associatedTokenProgramId);
    return address;
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
export function getAssociatedTokenAddressSync(mint, owner, allowOwnerOffCurve = false, programId = TOKEN_PROGRAM_ID, associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID) {
    if (!allowOwnerOffCurve && !PublicKey.isOnCurve(owner.toBuffer()))
        throw new TokenOwnerOffCurveError();
    const [address] = PublicKey.findProgramAddressSync([owner.toBuffer(), programId.toBuffer(), mint.toBuffer()], associatedTokenProgramId);
    return address;
}
//# sourceMappingURL=mint.js.map