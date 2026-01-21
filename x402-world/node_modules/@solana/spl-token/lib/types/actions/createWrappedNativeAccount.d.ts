import type { ConfirmOptions, Connection, Keypair, PublicKey, Signer } from '@solana/web3.js';
/**
 * Create, initialize, and fund a new wrapped native SOL account
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction and initialization fees
 * @param owner          Owner of the new token account
 * @param amount         Number of lamports to wrap
 * @param keypair        Optional keypair, defaulting to the associated token account for the native mint and `owner`
 * @param confirmOptions Options for confirming the transaction
 * @param programId      SPL Token program account
 *
 * @return Address of the new wrapped native SOL account
 */
export declare function createWrappedNativeAccount(connection: Connection, payer: Signer, owner: PublicKey, amount: number, keypair?: Keypair, confirmOptions?: ConfirmOptions, programId?: PublicKey, nativeMint?: PublicKey): Promise<PublicKey>;
//# sourceMappingURL=createWrappedNativeAccount.d.ts.map