import type { ConfirmOptions, Connection, PublicKey, Signer, TransactionSignature } from '@solana/web3.js';
/**
 * Pause a pausable mint
 *
 * @param connection      Connection to use
 * @param payer           Payer of the transaction fees
 * @param mint            Public key of the mint
 * @param owner           The pausable config authority
 * @param multiSigners    Signing accounts if `owner` is a multisig
 * @param confirmOptions  Options for confirming the transaction
 * @param programId       SPL Token program account
 *
 * @return Public key of the mint
 */
export declare function pause(connection: Connection, payer: Signer, mint: PublicKey, owner: Signer | PublicKey, multiSigners?: Signer[], confirmOptions?: ConfirmOptions, programId?: PublicKey): Promise<TransactionSignature>;
/**
 * Resume a pausable mint
 *
 * @param connection      Connection to use
 * @param payer           Payer of the transaction fees
 * @param mint            Public key of the mint
 * @param owner           The pausable config authority
 * @param multiSigners    Signing accounts if `owner` is a multisig
 * @param confirmOptions  Options for confirming the transaction
 * @param programId       SPL Token program account
 *
 * @return Public key of the mint
 */
export declare function resume(connection: Connection, payer: Signer, mint: PublicKey, owner: Signer | PublicKey, multiSigners?: Signer[], confirmOptions?: ConfirmOptions, programId?: PublicKey): Promise<TransactionSignature>;
//# sourceMappingURL=actions.d.ts.map