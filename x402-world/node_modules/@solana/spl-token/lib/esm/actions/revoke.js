import { sendAndConfirmTransaction, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '../constants.js';
import { createRevokeInstruction } from '../instructions/revoke.js';
import { getSigners } from './internal.js';
/**
 * Revoke approval for the transfer of tokens from an account
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction fees
 * @param account        Address of the token account
 * @param owner          Owner of the account
 * @param multiSigners   Signing accounts if `owner` is a multisig
 * @param confirmOptions Options for confirming the transaction
 * @param programId      SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
export async function revoke(connection, payer, account, owner, multiSigners = [], confirmOptions, programId = TOKEN_PROGRAM_ID) {
    const [ownerPublicKey, signers] = getSigners(owner, multiSigners);
    const transaction = new Transaction().add(createRevokeInstruction(account, ownerPublicKey, multiSigners, programId));
    return await sendAndConfirmTransaction(connection, transaction, [payer, ...signers], confirmOptions);
}
//# sourceMappingURL=revoke.js.map