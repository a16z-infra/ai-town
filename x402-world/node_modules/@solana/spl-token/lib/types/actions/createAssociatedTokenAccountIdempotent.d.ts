import type { ConfirmOptions, Connection, PublicKey, Signer } from '@solana/web3.js';
/**
 * Create and initialize a new associated token account
 * The instruction will succeed even if the associated token account already exists
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
 * @return Address of the new or existing associated token account
 */
export declare function createAssociatedTokenAccountIdempotent(connection: Connection, payer: Signer, mint: PublicKey, owner: PublicKey, confirmOptions?: ConfirmOptions, programId?: PublicKey, associatedTokenProgramId?: PublicKey, allowOwnerOffCurve?: boolean): Promise<PublicKey>;
//# sourceMappingURL=createAssociatedTokenAccountIdempotent.d.ts.map