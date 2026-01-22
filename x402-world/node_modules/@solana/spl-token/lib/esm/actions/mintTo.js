import { sendAndConfirmTransaction, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '../constants.js';
import { createMintToInstruction } from '../instructions/mintTo.js';
import { getSigners } from './internal.js';
/**
 * Mint tokens to an account
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction fees
 * @param mint           Mint for the account
 * @param destination    Address of the account to mint to
 * @param authority      Minting authority
 * @param amount         Amount to mint
 * @param multiSigners   Signing accounts if `authority` is a multisig
 * @param confirmOptions Options for confirming the transaction
 * @param programId      SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
export async function mintTo(connection, payer, mint, destination, authority, amount, multiSigners = [], confirmOptions, programId = TOKEN_PROGRAM_ID) {
    const [authorityPublicKey, signers] = getSigners(authority, multiSigners);
    const transaction = new Transaction().add(createMintToInstruction(mint, destination, authorityPublicKey, amount, multiSigners, programId));
    return await sendAndConfirmTransaction(connection, transaction, [payer, ...signers], confirmOptions);
}
//# sourceMappingURL=mintTo.js.map