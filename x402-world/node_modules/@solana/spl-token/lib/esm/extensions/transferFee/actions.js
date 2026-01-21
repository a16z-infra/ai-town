import { sendAndConfirmTransaction, Transaction } from '@solana/web3.js';
import { getSigners } from '../../actions/internal.js';
import { TOKEN_2022_PROGRAM_ID } from '../../constants.js';
import { createHarvestWithheldTokensToMintInstruction, createSetTransferFeeInstruction, createTransferCheckedWithFeeInstruction, createWithdrawWithheldTokensFromAccountsInstruction, createWithdrawWithheldTokensFromMintInstruction, } from './instructions.js';
/**
 * Transfer tokens from one account to another, asserting the transfer fee, token mint, and decimals
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
export async function transferCheckedWithFee(connection, payer, source, mint, destination, owner, amount, decimals, fee, multiSigners = [], confirmOptions, programId = TOKEN_2022_PROGRAM_ID) {
    const [ownerPublicKey, signers] = getSigners(owner, multiSigners);
    const transaction = new Transaction().add(createTransferCheckedWithFeeInstruction(source, mint, destination, ownerPublicKey, amount, decimals, fee, multiSigners, programId));
    return await sendAndConfirmTransaction(connection, transaction, [payer, ...signers], confirmOptions);
}
/**
 * Withdraw withheld tokens from mint
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction fees
 * @param mint           The token mint
 * @param destination    The destination account
 * @param authority      The mint's withdraw withheld tokens authority
 * @param multiSigners   Signing accounts if `owner` is a multisig
 * @param confirmOptions Options for confirming the transaction
 * @param programId      SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
export async function withdrawWithheldTokensFromMint(connection, payer, mint, destination, authority, multiSigners = [], confirmOptions, programId = TOKEN_2022_PROGRAM_ID) {
    const [authorityPublicKey, signers] = getSigners(authority, multiSigners);
    const transaction = new Transaction().add(createWithdrawWithheldTokensFromMintInstruction(mint, destination, authorityPublicKey, signers, programId));
    return await sendAndConfirmTransaction(connection, transaction, [payer, ...signers], confirmOptions);
}
/**
 * Withdraw withheld tokens from accounts
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction fees
 * @param mint           The token mint
 * @param destination    The destination account
 * @param authority      The mint's withdraw withheld tokens authority
 * @param multiSigners   Signing accounts if `owner` is a multisig
 * @param sources        Source accounts from which to withdraw withheld fees
 * @param confirmOptions Options for confirming the transaction
 * @param programId      SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
export async function withdrawWithheldTokensFromAccounts(connection, payer, mint, destination, authority, multiSigners, sources, confirmOptions, programId = TOKEN_2022_PROGRAM_ID) {
    const [authorityPublicKey, signers] = getSigners(authority, multiSigners);
    const transaction = new Transaction().add(createWithdrawWithheldTokensFromAccountsInstruction(mint, destination, authorityPublicKey, signers, sources, programId));
    return await sendAndConfirmTransaction(connection, transaction, [payer, ...signers], confirmOptions);
}
/**
 * Harvest withheld tokens from accounts to the mint
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction fees
 * @param mint           The token mint
 * @param sources        Source accounts from which to withdraw withheld fees
 * @param confirmOptions Options for confirming the transaction
 * @param programId      SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
export async function harvestWithheldTokensToMint(connection, payer, mint, sources, confirmOptions, programId = TOKEN_2022_PROGRAM_ID) {
    const transaction = new Transaction().add(createHarvestWithheldTokensToMintInstruction(mint, sources, programId));
    return await sendAndConfirmTransaction(connection, transaction, [payer], confirmOptions);
}
/**
 * Update transfer fee and maximum fee
 *
 * @param connection                Connection to use
 * @param payer                     Payer of the transaction fees
 * @param mint                      The token mint
 * @param authority                 The authority of the transfer fee
 * @param multiSigners              Signing accounts if `owner` is a multisig
 * @param transferFeeBasisPoints    Amount of transfer collected as fees, expressed as basis points of the transfer amount
 * @param maximumFee                Maximum fee assessed on transfers
 * @param confirmOptions            Options for confirming the transaction
 * @param programId                 SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
export async function setTransferFee(connection, payer, mint, authority, multiSigners, transferFeeBasisPoints, maximumFee, confirmOptions, programId = TOKEN_2022_PROGRAM_ID) {
    const [authorityPublicKey, signers] = getSigners(authority, multiSigners);
    const transaction = new Transaction().add(createSetTransferFeeInstruction(mint, authorityPublicKey, signers, transferFeeBasisPoints, maximumFee, programId));
    return await sendAndConfirmTransaction(connection, transaction, [payer, ...signers], confirmOptions);
}
//# sourceMappingURL=actions.js.map