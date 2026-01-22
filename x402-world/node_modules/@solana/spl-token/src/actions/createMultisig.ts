import type { ConfirmOptions, Connection, PublicKey, Signer } from '@solana/web3.js';
import { Keypair, sendAndConfirmTransaction, SystemProgram, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '../constants.js';
import { createInitializeMultisigInstruction } from '../instructions/initializeMultisig.js';
import { getMinimumBalanceForRentExemptMultisig, MULTISIG_SIZE } from '../state/multisig.js';

/**
 * Create and initialize a new multisig
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction and initialization fees
 * @param signers        Full set of signers
 * @param m              Number of required signatures
 * @param keypair        Optional keypair, defaulting to a new random one
 * @param confirmOptions Options for confirming the transaction
 * @param programId      SPL Token program account
 *
 * @return Address of the new multisig
 */
export async function createMultisig(
    connection: Connection,
    payer: Signer,
    signers: PublicKey[],
    m: number,
    keypair = Keypair.generate(),
    confirmOptions?: ConfirmOptions,
    programId = TOKEN_PROGRAM_ID,
): Promise<PublicKey> {
    const lamports = await getMinimumBalanceForRentExemptMultisig(connection);

    const transaction = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: keypair.publicKey,
            space: MULTISIG_SIZE,
            lamports,
            programId,
        }),
        createInitializeMultisigInstruction(keypair.publicKey, signers, m, programId),
    );

    await sendAndConfirmTransaction(connection, transaction, [payer, keypair], confirmOptions);

    return keypair.publicKey;
}
