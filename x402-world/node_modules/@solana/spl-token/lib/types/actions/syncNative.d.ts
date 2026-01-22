import type { ConfirmOptions, Connection, PublicKey, Signer, TransactionSignature } from '@solana/web3.js';
/**
 * Sync the balance of a native SPL token account to the underlying system account's lamports
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction fees
 * @param account        Native account to sync
 * @param confirmOptions Options for confirming the transaction
 * @param programId      SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
export declare function syncNative(connection: Connection, payer: Signer, account: PublicKey, confirmOptions?: ConfirmOptions, programId?: PublicKey): Promise<TransactionSignature>;
//# sourceMappingURL=syncNative.d.ts.map