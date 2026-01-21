import type { ConfirmOptions, Connection, PublicKey, Signer, TransactionSignature } from '@solana/web3.js';
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
export declare function recoverNested(connection: Connection, payer: Signer, owner: Signer, mint: PublicKey, nestedMint: PublicKey, confirmOptions?: ConfirmOptions, programId?: PublicKey, associatedTokenProgramId?: PublicKey): Promise<TransactionSignature>;
//# sourceMappingURL=recoverNested.d.ts.map