import { sendAndConfirmTransaction, Transaction } from '@solana/web3.js';
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '../constants.js';
import { createRecoverNestedInstruction } from '../instructions/associatedTokenAccount.js';
import { getAssociatedTokenAddressSync } from '../state/mint.js';
/**
 * Recover funds funds in an associated token account which is owned by an associated token account
 *
 * @param connection               Connection to use
 * @param payer                    Payer of the transaction and initialization fees
 * @param owner                    Owner of original ATA
 * @param mint                     Mint for the original ATA
 * @param nestedMint               Mint for the nested ATA
 * @param confirmOptions           Options for confirming the transaction
 * @param programId                SPL Token program account
 * @param associatedTokenProgramId SPL Associated Token program account
 *
 * @return Signature of the confirmed transaction
 */
export async function recoverNested(connection, payer, owner, mint, nestedMint, confirmOptions, programId = TOKEN_PROGRAM_ID, associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID) {
    const ownerAssociatedToken = getAssociatedTokenAddressSync(mint, owner.publicKey, false, programId, associatedTokenProgramId);
    const destinationAssociatedToken = getAssociatedTokenAddressSync(nestedMint, owner.publicKey, false, programId, associatedTokenProgramId);
    const nestedAssociatedToken = getAssociatedTokenAddressSync(nestedMint, ownerAssociatedToken, true, programId, associatedTokenProgramId);
    const transaction = new Transaction().add(createRecoverNestedInstruction(nestedAssociatedToken, nestedMint, destinationAssociatedToken, ownerAssociatedToken, mint, owner.publicKey, programId, associatedTokenProgramId));
    return await sendAndConfirmTransaction(connection, transaction, [payer, owner], confirmOptions);
}
//# sourceMappingURL=recoverNested.js.map