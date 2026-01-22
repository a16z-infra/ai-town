import { sendAndConfirmTransaction, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '../constants.js';
import { createSyncNativeInstruction } from '../instructions/syncNative.js';
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
export async function syncNative(connection, payer, account, confirmOptions, programId = TOKEN_PROGRAM_ID) {
    const transaction = new Transaction().add(createSyncNativeInstruction(account, programId));
    return await sendAndConfirmTransaction(connection, transaction, [payer], confirmOptions);
}
//# sourceMappingURL=syncNative.js.map