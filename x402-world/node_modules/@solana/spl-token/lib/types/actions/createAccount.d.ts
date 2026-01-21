import type { ConfirmOptions, Connection, Keypair, PublicKey, Signer } from '@solana/web3.js';
/**
 * Create and initialize a new token account
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction and initialization fees
 * @param mint           Mint for the account
 * @param owner          Owner of the new account
 * @param keypair        Optional keypair, defaulting to the associated token account for the `mint` and `owner`
 * @param confirmOptions Options for confirming the transaction
 * @param programId      SPL Token program account
 *
 * @return Address of the new token account
 */
export declare function createAccount(connection: Connection, payer: Signer, mint: PublicKey, owner: PublicKey, keypair?: Keypair, confirmOptions?: ConfirmOptions, programId?: PublicKey): Promise<PublicKey>;
//# sourceMappingURL=createAccount.d.ts.map