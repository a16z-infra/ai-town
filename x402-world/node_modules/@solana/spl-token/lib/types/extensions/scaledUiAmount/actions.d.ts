import type { ConfirmOptions, Connection, PublicKey, Signer, TransactionSignature } from '@solana/web3.js';
/**
 * Update scaled UI amount multiplier
 *
 * @param connection            Connection to use
 * @param payer                 Payer of the transaction fees
 * @param mint                  The token mint
 * @param owner                 Owner of the scaled UI amount mint
 * @param multiplier            New multiplier
 * @param effectiveTimestamp    Effective time stamp for the new multiplier
 * @param multiSigners          Signing accounts if `owner` is a multisig
 * @param confirmOptions        Options for confirming the transaction
 * @param programId             SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
export declare function updateMultiplier(connection: Connection, payer: Signer, mint: PublicKey, owner: Signer | PublicKey, multiplier: number, effectiveTimestamp: bigint, multiSigners?: Signer[], confirmOptions?: ConfirmOptions, programId?: PublicKey): Promise<TransactionSignature>;
//# sourceMappingURL=actions.d.ts.map