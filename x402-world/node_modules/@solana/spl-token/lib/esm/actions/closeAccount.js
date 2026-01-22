import { sendAndConfirmTransaction, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '../constants.js';
import { createCloseAccountInstruction } from '../instructions/closeAccount.js';
import { getSigners } from './internal.js';
/**
 * Close a token account
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction fees
 * @param account        Account to close
 * @param destination    Account to receive the remaining balance of the closed account
 * @param authority      Authority which is allowed to close the account
 * @param multiSigners   Signing accounts if `authority` is a multisig
 * @param confirmOptions Options for confirming the transaction
 * @param programId      SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
export async function closeAccount(connection, payer, account, destination, authority, multiSigners = [], confirmOptions, programId = TOKEN_PROGRAM_ID) {
    const [authorityPublicKey, signers] = getSigners(authority, multiSigners);
    const transaction = new Transaction().add(createCloseAccountInstruction(account, destination, authorityPublicKey, multiSigners, programId));
    return await sendAndConfirmTransaction(connection, transaction, [payer, ...signers], confirmOptions);
}
//# sourceMappingURL=closeAccount.js.map