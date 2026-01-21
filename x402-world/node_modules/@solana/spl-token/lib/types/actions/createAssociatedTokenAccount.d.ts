import type { ConfirmOptions, Connection, PublicKey, Signer } from '@solana/web3.js';
/**
 * Create and initialize a new associated token account
 *
 * @param connection               Connection to use
 * @param payer                    Payer of the transaction and initialization fees
 * @param mint                     Mint for the account
 * @param owner                    Owner of the new account
 * @param confirmOptions           Options for confirming the transaction
 * @param programId                SPL Token program account
 * @param associatedTokenProgramId SPL Associated Token program account
 * @param allowOwnerOffCurve       Allow the owner account to be a PDA (Program Derived Address)
 *
 * @return Address of the new associated token account
 */
export declare function createAssociatedTokenAccount(connection: Connection, payer: Signer, mint: PublicKey, owner: PublicKey, confirmOptions?: ConfirmOptions, programId?: PublicKey, associatedTokenProgramId?: PublicKey, allowOwnerOffCurve?: boolean): Promise<PublicKey>;
//# sourceMappingURL=createAssociatedTokenAccount.d.ts.map