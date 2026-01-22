import type { ConfirmOptions, Connection, PublicKey, Signer, TransactionSignature } from '@solana/web3.js';
/**
 * Mint tokens to an account, asserting the token mint and decimals
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction fees
 * @param mint           Mint for the account
 * @param destination    Address of the account to mint to
 * @param authority      Minting authority
 * @param amount         Amount to mint
 * @param decimals       Number of decimals in amount to mint
 * @param multiSigners   Signing accounts if `authority` is a multisig
 * @param confirmOptions Options for confirming the transaction
 * @param programId      SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
export declare function mintToChecked(connection: Connection, payer: Signer, mint: PublicKey, destination: PublicKey, authority: Signer | PublicKey, amount: number | bigint, decimals: number, multiSigners?: Signer[], confirmOptions?: ConfirmOptions, programId?: PublicKey): Promise<TransactionSignature>;
//# sourceMappingURL=mintToChecked.d.ts.map