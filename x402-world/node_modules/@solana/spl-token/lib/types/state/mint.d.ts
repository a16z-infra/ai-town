import type { AccountInfo, Commitment, Connection } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';
import type { ExtensionType } from '../extensions/extensionType.js';
/** Information about a mint */
export interface Mint {
    /** Address of the mint */
    address: PublicKey;
    /**
     * Optional authority used to mint new tokens. The mint authority may only be provided during mint creation.
     * If no mint authority is present then the mint has a fixed supply and no further tokens may be minted.
     */
    mintAuthority: PublicKey | null;
    /** Total supply of tokens */
    supply: bigint;
    /** Number of base 10 digits to the right of the decimal place */
    decimals: number;
    /** Is this mint initialized */
    isInitialized: boolean;
    /** Optional authority to freeze token accounts */
    freezeAuthority: PublicKey | null;
    /** Additional data for extension */
    tlvData: Buffer;
}
/** Mint as stored by the program */
export interface RawMint {
    mintAuthorityOption: 1 | 0;
    mintAuthority: PublicKey;
    supply: bigint;
    decimals: number;
    isInitialized: boolean;
    freezeAuthorityOption: 1 | 0;
    freezeAuthority: PublicKey;
}
/** Buffer layout for de/serializing a mint */
export declare const MintLayout: import("@solana/buffer-layout").Structure<RawMint>;
/** Byte length of a mint */
export declare const MINT_SIZE: number;
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
export declare function getMint(connection: Connection, address: PublicKey, commitment?: Commitment, programId?: PublicKey): Promise<Mint>;
/**
 * Unpack a mint
 *
 * @param address   Mint account
 * @param info      Mint account data
 * @param programId SPL Token program account
 *
 * @return Unpacked mint
 */
export declare function unpackMint(address: PublicKey, info: AccountInfo<Buffer> | null, programId?: PublicKey): Mint;
/** Get the minimum lamport balance for a mint to be rent exempt
 *
 * @param connection Connection to use
 * @param commitment Desired level of commitment for querying the state
 *
 * @return Amount of lamports required
 */
export declare function getMinimumBalanceForRentExemptMint(connection: Connection, commitment?: Commitment): Promise<number>;
/** Get the minimum lamport balance for a rent-exempt mint with extensions
 *
 * @param connection Connection to use
 * @param extensions Extension types included in the mint
 * @param commitment Desired level of commitment for querying the state
 *
 * @return Amount of lamports required
 */
export declare function getMinimumBalanceForRentExemptMintWithExtensions(connection: Connection, extensions: ExtensionType[], commitment?: Commitment): Promise<number>;
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
export declare function getAssociatedTokenAddress(mint: PublicKey, owner: PublicKey, allowOwnerOffCurve?: boolean, programId?: PublicKey, associatedTokenProgramId?: PublicKey): Promise<PublicKey>;
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
export declare function getAssociatedTokenAddressSync(mint: PublicKey, owner: PublicKey, allowOwnerOffCurve?: boolean, programId?: PublicKey, associatedTokenProgramId?: PublicKey): PublicKey;
//# sourceMappingURL=mint.d.ts.map