import type { ConfirmOptions, Connection, PublicKey, Signer, TransactionSignature } from '@solana/web3.js';
import type { Field } from '@solana/spl-token-metadata';
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
export declare function tokenMetadataInitialize(connection: Connection, payer: Signer, mint: PublicKey, updateAuthority: PublicKey, mintAuthority: PublicKey | Signer, name: string, symbol: string, uri: string, multiSigners?: Signer[], confirmOptions?: ConfirmOptions, programId?: PublicKey): Promise<TransactionSignature>;
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
export declare function tokenMetadataInitializeWithRentTransfer(connection: Connection, payer: Signer, mint: PublicKey, updateAuthority: PublicKey, mintAuthority: PublicKey | Signer, name: string, symbol: string, uri: string, multiSigners?: Signer[], confirmOptions?: ConfirmOptions, programId?: PublicKey): Promise<TransactionSignature>;
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
export declare function tokenMetadataUpdateField(connection: Connection, payer: Signer, mint: PublicKey, updateAuthority: PublicKey | Signer, field: string | Field, value: string, multiSigners?: Signer[], confirmOptions?: ConfirmOptions, programId?: PublicKey): Promise<TransactionSignature>;
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
export declare function tokenMetadataUpdateFieldWithRentTransfer(connection: Connection, payer: Signer, mint: PublicKey, updateAuthority: PublicKey | Signer, field: string | Field, value: string, multiSigners?: Signer[], confirmOptions?: ConfirmOptions, programId?: PublicKey): Promise<TransactionSignature>;
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
export declare function tokenMetadataRemoveKey(connection: Connection, payer: Signer, mint: PublicKey, updateAuthority: PublicKey | Signer, key: string, idempotent: boolean, multiSigners?: Signer[], confirmOptions?: ConfirmOptions, programId?: PublicKey): Promise<TransactionSignature>;
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
export declare function tokenMetadataUpdateAuthority(connection: Connection, payer: Signer, mint: PublicKey, updateAuthority: PublicKey | Signer, newAuthority: PublicKey | null, multiSigners?: Signer[], confirmOptions?: ConfirmOptions, programId?: PublicKey): Promise<TransactionSignature>;
//# sourceMappingURL=actions.d.ts.map