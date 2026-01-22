import { sendAndConfirmTransaction, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '../constants.js';
import { createBurnCheckedInstruction } from '../instructions/burnChecked.js';
import { getSigners } from './internal.js';
/**
 * Burn tokens from an account, asserting the token mint and decimals
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction fees
 * @param account        Account to burn tokens from
 * @param mint           Mint for the account
 * @param owner          Account owner
 * @param amount         Amount to burn
 * @param decimals       Number of decimals in amount to burn
 * @param multiSigners   Signing accounts if `owner` is a multisig
 * @param confirmOptions Options for confirming the transaction
 * @param programId      SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
export async function burnChecked(connection, payer, account, mint, owner, amount, decimals, multiSigners = [], confirmOptions, programId = TOKEN_PROGRAM_ID) {
    const [ownerPublicKey, signers] = getSigners(owner, multiSigners);
    const transaction = new Transaction().add(createBurnCheckedInstruction(account, mint, ownerPublicKey, amount, decimals, multiSigners, programId));
    return await sendAndConfirmTransaction(connection, transaction, [payer, ...signers], confirmOptions);
}
//# sourceMappingURL=burnChecked.js.map