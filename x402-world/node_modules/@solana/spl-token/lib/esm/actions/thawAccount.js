import { sendAndConfirmTransaction, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '../constants.js';
import { createThawAccountInstruction } from '../instructions/thawAccount.js';
import { getSigners } from './internal.js';
/**
 * Thaw (unfreeze) a token account
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction fees
 * @param account        Account to thaw
 * @param mint           Mint for the account
 * @param authority      Mint freeze authority
 * @param multiSigners   Signing accounts if `authority` is a multisig
 * @param confirmOptions Options for confirming the transaction
 * @param programId      SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
export async function thawAccount(connection, payer, account, mint, authority, multiSigners = [], confirmOptions, programId = TOKEN_PROGRAM_ID) {
    const [authorityPublicKey, signers] = getSigners(authority, multiSigners);
    const transaction = new Transaction().add(createThawAccountInstruction(account, mint, authorityPublicKey, multiSigners, programId));
    return await sendAndConfirmTransaction(connection, transaction, [payer, ...signers], confirmOptions);
}
//# sourceMappingURL=thawAccount.js.map