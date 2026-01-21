import type { ConfirmOptions, Connection, Signer } from '@solana/web3.js';
import { sendAndConfirmTransaction, Transaction } from '@solana/web3.js';
import { NATIVE_MINT_2022, TOKEN_2022_PROGRAM_ID } from '../constants.js';
import { createCreateNativeMintInstruction } from '../instructions/createNativeMint.js';

/**
 * Create native mint
 *
 * @param connection               Connection to use
 * @param payer                    Payer of the transaction and initialization fees
 * @param confirmOptions           Options for confirming the transaction
 * @param programId                SPL Token program account
 * @param nativeMint               Native mint id associated with program
 */
export async function createNativeMint(
    connection: Connection,
    payer: Signer,
    confirmOptions?: ConfirmOptions,
    nativeMint = NATIVE_MINT_2022,
    programId = TOKEN_2022_PROGRAM_ID,
): Promise<void> {
    const transaction = new Transaction().add(
        createCreateNativeMintInstruction(payer.publicKey, nativeMint, programId),
    );
    await sendAndConfirmTransaction(connection, transaction, [payer], confirmOptions);
}
