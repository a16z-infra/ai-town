import type { Commitment, ConfirmOptions, Connection, PublicKey, Signer } from '@solana/web3.js';
import type { Account } from '../state/account.js';
/**
 * Retrieve the associated token account, or create it if it doesn't exist
 *
 * @param connection               Connection to use
 * @param payer                    Payer of the transaction and initialization fees
 * @param mint                     Mint associated with the account to set or verify
 * @param owner                    Owner of the account to set or verify
 * @param allowOwnerOffCurve       Allow the owner account to be a PDA (Program Derived Address)
 * @param commitment               Desired level of commitment for querying the state
 * @param confirmOptions           Options for confirming the transaction
 * @param programId                SPL Token program account
 * @param associatedTokenProgramId SPL Associated Token program account
 *
 * @return Address of the new associated token account
 */
export declare function getOrCreateAssociatedTokenAccount(connection: Connection, payer: Signer, mint: PublicKey, owner: PublicKey, allowOwnerOffCurve?: boolean, commitment?: Commitment, confirmOptions?: ConfirmOptions, programId?: PublicKey, associatedTokenProgramId?: PublicKey): Promise<Account>;
//# sourceMappingURL=getOrCreateAssociatedTokenAccount.d.ts.map