import type { AccountInfo, Commitment, Connection, PublicKey } from '@solana/web3.js';
/** Information about a multisig */
export interface Multisig {
    /** Address of the multisig */
    address: PublicKey;
    /** Number of signers required */
    m: number;
    /** Number of possible signers, corresponds to the number of `signers` that are valid */
    n: number;
    /** Is this mint initialized */
    isInitialized: boolean;
    /** Full set of signers, of which `n` are valid */
    signer1: PublicKey;
    signer2: PublicKey;
    signer3: PublicKey;
    signer4: PublicKey;
    signer5: PublicKey;
    signer6: PublicKey;
    signer7: PublicKey;
    signer8: PublicKey;
    signer9: PublicKey;
    signer10: PublicKey;
    signer11: PublicKey;
}
/** Multisig as stored by the program */
export type RawMultisig = Omit<Multisig, 'address'>;
/** Buffer layout for de/serializing a multisig */
export declare const MultisigLayout: import("@solana/buffer-layout").Structure<RawMultisig>;
/** Byte length of a multisig */
export declare const MULTISIG_SIZE: number;
/**
 * Retrieve information about a multisig
 *
 * @param connection Connection to use
 * @param address    Multisig account
 * @param commitment Desired level of commitment for querying the state
 * @param programId  SPL Token program account
 *
 * @return Multisig information
 */
export declare function getMultisig(connection: Connection, address: PublicKey, commitment?: Commitment, programId?: PublicKey): Promise<Multisig>;
/**
 * Unpack a multisig
 *
 * @param address   Multisig account
 * @param info      Multisig account data
 * @param programId SPL Token program account
 *
 * @return Unpacked multisig
 */
export declare function unpackMultisig(address: PublicKey, info: AccountInfo<Buffer> | null, programId?: PublicKey): Multisig;
/** Get the minimum lamport balance for a multisig to be rent exempt
 *
 * @param connection Connection to use
 * @param commitment Desired level of commitment for querying the state
 *
 * @return Amount of lamports required
 */
export declare function getMinimumBalanceForRentExemptMultisig(connection: Connection, commitment?: Commitment): Promise<number>;
//# sourceMappingURL=multisig.d.ts.map