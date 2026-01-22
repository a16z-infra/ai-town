import type { ConfirmOptions, Connection, PublicKey, Signer, TransactionSignature } from '@solana/web3.js';
/**
 * Transfer tokens from one account to another
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction fees
 * @param source         Source account
 * @param destination    Destination account
 * @param owner          Owner of the source account
 * @param amount         Number of tokens to transfer
 * @param multiSigners   Signing accounts if `owner` is a multisig
 * @param confirmOptions Options for confirming the transaction
 * @param programId      SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
export declare function transfer(connection: Connection, payer: Signer, source: PublicKey, destination: PublicKey, owner: Signer | PublicKey, amount: number | bigint, multiSigners?: Signer[], confirmOptions?: ConfirmOptions, programId?: PublicKey): Promise<TransactionSignature>;
//# sourceMappingURL=transfer.d.ts.map