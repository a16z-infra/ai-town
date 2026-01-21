import { sendAndConfirmTransaction, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '../constants.js';
import { createTransferCheckedInstruction } from '../instructions/transferChecked.js';
import { getSigners } from './internal.js';
/**
 * Transfer tokens from one account to another, asserting the token mint and decimals
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction fees
 * @param source         Source account
 * @param mint           Mint for the account
 * @param destination    Destination account
 * @param owner          Owner of the source account
 * @param amount         Number of tokens to transfer
 * @param decimals       Number of decimals in transfer amount
 * @param multiSigners   Signing accounts if `owner` is a multisig
 * @param confirmOptions Options for confirming the transaction
 * @param programId      SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
export async function transferChecked(connection, payer, source, mint, destination, owner, amount, decimals, multiSigners = [], confirmOptions, programId = TOKEN_PROGRAM_ID) {
    const [ownerPublicKey, signers] = getSigners(owner, multiSigners);
    const transaction = new Transaction().add(createTransferCheckedInstruction(source, mint, destination, ownerPublicKey, amount, decimals, multiSigners, programId));
    return await sendAndConfirmTransaction(connection, transaction, [payer, ...signers], confirmOptions);
}
//# sourceMappingURL=transferChecked.js.map