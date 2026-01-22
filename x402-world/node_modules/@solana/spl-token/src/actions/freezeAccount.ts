import type { ConfirmOptions, Connection, PublicKey, Signer, TransactionSignature } from '@solana/web3.js';
import { sendAndConfirmTransaction, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '../constants.js';
import { createFreezeAccountInstruction } from '../instructions/freezeAccount.js';
import { getSigners } from './internal.js';

/**
 * Freeze a token account
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction fees
 * @param account        Account to freeze
 * @param mint           Mint for the account
 * @param authority      Mint freeze authority
 * @param multiSigners   Signing accounts if `authority` is a multisig
 * @param confirmOptions Options for confirming the transaction
 * @param programId      SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
export async function freezeAccount(
    connection: Connection,
    payer: Signer,
    account: PublicKey,
    mint: PublicKey,
    authority: Signer | PublicKey,
    multiSigners: Signer[] = [],
    confirmOptions?: ConfirmOptions,
    programId = TOKEN_PROGRAM_ID,
): Promise<TransactionSignature> {
    const [authorityPublicKey, signers] = getSigners(authority, multiSigners);

    const transaction = new Transaction().add(
        createFreezeAccountInstruction(account, mint, authorityPublicKey, multiSigners, programId),
    );

    return await sendAndConfirmTransaction(connection, transaction, [payer, ...signers], confirmOptions);
}
