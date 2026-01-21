import { sendAndConfirmTransaction, Transaction } from '@solana/web3.js';
import { getSigners } from '../../actions/internal.js';
import { TOKEN_2022_PROGRAM_ID } from '../../constants.js';
import { createInitializeDefaultAccountStateInstruction, createUpdateDefaultAccountStateInstruction, } from './instructions.js';
/**
 * Initialize a default account state on a mint
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction fees
 * @param mint        Mint to initialize with extension
 * @param state        Account state with which to initialize new accounts
 * @param confirmOptions Options for confirming the transaction
 * @param programId      SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
export async function initializeDefaultAccountState(connection, payer, mint, state, confirmOptions, programId = TOKEN_2022_PROGRAM_ID) {
    const transaction = new Transaction().add(createInitializeDefaultAccountStateInstruction(mint, state, programId));
    return await sendAndConfirmTransaction(connection, transaction, [payer], confirmOptions);
}
/**
 * Update the default account state on a mint
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction fees
 * @param mint        Mint to modify
 * @param state        New account state to set on created accounts
 * @param freezeAuthority          Freeze authority of the mint
 * @param multiSigners   Signing accounts if `freezeAuthority` is a multisig
 * @param confirmOptions Options for confirming the transaction
 * @param programId      SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
export async function updateDefaultAccountState(connection, payer, mint, state, freezeAuthority, multiSigners = [], confirmOptions, programId = TOKEN_2022_PROGRAM_ID) {
    const [freezeAuthorityPublicKey, signers] = getSigners(freezeAuthority, multiSigners);
    const transaction = new Transaction().add(createUpdateDefaultAccountStateInstruction(mint, state, freezeAuthorityPublicKey, signers, programId));
    return await sendAndConfirmTransaction(connection, transaction, [payer, ...signers], confirmOptions);
}
//# sourceMappingURL=actions.js.map