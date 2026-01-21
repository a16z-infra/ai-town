import type { ConfirmOptions, Connection, PublicKey, Signer, TransactionSignature } from '@solana/web3.js';
import { sendAndConfirmTransaction, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '../constants.js';
import { createApproveCheckedInstruction } from '../instructions/approveChecked.js';
import { getSigners } from './internal.js';

/**
 * Approve a delegate to transfer up to a maximum number of tokens from an account, asserting the token mint and
 * decimals
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction fees
 * @param mint           Address of the mint
 * @param account        Address of the account
 * @param delegate       Account authorized to perform a transfer tokens from the source account
 * @param owner          Owner of the source account
 * @param amount         Maximum number of tokens the delegate may transfer
 * @param decimals       Number of decimals in approve amount
 * @param multiSigners   Signing accounts if `owner` is a multisig
 * @param confirmOptions Options for confirming the transaction
 * @param programId      SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
export async function approveChecked(
    connection: Connection,
    payer: Signer,
    mint: PublicKey,
    account: PublicKey,
    delegate: PublicKey,
    owner: Signer | PublicKey,
    amount: number | bigint,
    decimals: number,
    multiSigners: Signer[] = [],
    confirmOptions?: ConfirmOptions,
    programId = TOKEN_PROGRAM_ID,
): Promise<TransactionSignature> {
    const [ownerPublicKey, signers] = getSigners(owner, multiSigners);

    const transaction = new Transaction().add(
        createApproveCheckedInstruction(
            account,
            mint,
            delegate,
            ownerPublicKey,
            amount,
            decimals,
            multiSigners,
            programId,
        ),
    );

    return await sendAndConfirmTransaction(connection, transaction, [payer, ...signers], confirmOptions);
}
