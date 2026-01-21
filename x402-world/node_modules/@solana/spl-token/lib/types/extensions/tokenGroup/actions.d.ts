import type { ConfirmOptions, Connection, PublicKey, Signer, TransactionSignature } from '@solana/web3.js';
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
export declare function tokenGroupInitializeGroup(connection: Connection, payer: Signer, mint: PublicKey, mintAuthority: PublicKey | Signer, updateAuthority: PublicKey | null, maxSize: bigint, multiSigners?: Signer[], confirmOptions?: ConfirmOptions, programId?: PublicKey): Promise<TransactionSignature>;
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
export declare function tokenGroupInitializeGroupWithRentTransfer(connection: Connection, payer: Signer, mint: PublicKey, mintAuthority: PublicKey | Signer, updateAuthority: PublicKey | null, maxSize: bigint, multiSigners?: Signer[], confirmOptions?: ConfirmOptions, programId?: PublicKey): Promise<TransactionSignature>;
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
export declare function tokenGroupUpdateGroupMaxSize(connection: Connection, payer: Signer, mint: PublicKey, updateAuthority: PublicKey | Signer, maxSize: bigint, multiSigners?: Signer[], confirmOptions?: ConfirmOptions, programId?: PublicKey): Promise<TransactionSignature>;
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
export declare function tokenGroupUpdateGroupAuthority(connection: Connection, payer: Signer, mint: PublicKey, updateAuthority: PublicKey | Signer, newAuthority: PublicKey | null, multiSigners?: Signer[], confirmOptions?: ConfirmOptions, programId?: PublicKey): Promise<TransactionSignature>;
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
export declare function tokenGroupMemberInitialize(connection: Connection, payer: Signer, mint: PublicKey, mintAuthority: PublicKey | Signer, group: PublicKey, groupUpdateAuthority: PublicKey, multiSigners?: Signer[], confirmOptions?: ConfirmOptions, programId?: PublicKey): Promise<TransactionSignature>;
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
export declare function tokenGroupMemberInitializeWithRentTransfer(connection: Connection, payer: Signer, mint: PublicKey, mintAuthority: PublicKey | Signer, group: PublicKey, groupUpdateAuthority: PublicKey, multiSigners?: Signer[], confirmOptions?: ConfirmOptions, programId?: PublicKey): Promise<TransactionSignature>;
//# sourceMappingURL=actions.d.ts.map