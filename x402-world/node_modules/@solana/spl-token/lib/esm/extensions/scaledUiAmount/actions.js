import { sendAndConfirmTransaction, Transaction } from '@solana/web3.js';
import { getSigners } from '../../actions/internal.js';
import { TOKEN_2022_PROGRAM_ID } from '../../constants.js';
import { createUpdateMultiplierDataInstruction } from './instructions.js';
/**
 * Update scaled UI amount multiplier
 *
 * @param connection            Connection to use
 * @param payer                 Payer of the transaction fees
 * @param mint                  The token mint
 * @param owner                 Owner of the scaled UI amount mint
 * @param multiplier            New multiplier
 * @param effectiveTimestamp    Effective time stamp for the new multiplier
 * @param multiSigners          Signing accounts if `owner` is a multisig
 * @param confirmOptions        Options for confirming the transaction
 * @param programId             SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
export async function updateMultiplier(connection, payer, mint, owner, multiplier, effectiveTimestamp, multiSigners = [], confirmOptions, programId = TOKEN_2022_PROGRAM_ID) {
    const [ownerPublicKey, signers] = getSigners(owner, multiSigners);
    const transaction = new Transaction().add(createUpdateMultiplierDataInstruction(mint, ownerPublicKey, multiplier, effectiveTimestamp, multiSigners, programId));
    return await sendAndConfirmTransaction(connection, transaction, [payer, ...signers], confirmOptions);
}
//# sourceMappingURL=actions.js.map