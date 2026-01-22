import type { ConfirmOptions, Connection, Signer, TransactionSignature } from '@solana/web3.js';
import type { PublicKey } from '@solana/web3.js';
/**
 * Initialize a transfer hook on a mint
 *
 * @param connection            Connection to use
 * @param payer                 Payer of the transaction fees
 * @param mint                  Mint to initialize with extension
 * @param authority             Transfer hook authority account
 * @param transferHookProgramId The transfer hook program account
 * @param confirmOptions        Options for confirming the transaction
 * @param programId             SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
export declare function initializeTransferHook(connection: Connection, payer: Signer, mint: PublicKey, authority: PublicKey, transferHookProgramId: PublicKey, confirmOptions?: ConfirmOptions, programId?: PublicKey): Promise<TransactionSignature>;
/**
 * Update the transfer hook program on a mint
 *
 * @param connection            Connection to use
 * @param payer                 Payer of the transaction fees
 * @param mint                  Mint to modify
 * @param transferHookProgramId New transfer hook program account
 * @param authority             Transfer hook update authority
 * @param multiSigners          Signing accounts if `freezeAuthority` is a multisig
 * @param confirmOptions        Options for confirming the transaction
 * @param programId             SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
export declare function updateTransferHook(connection: Connection, payer: Signer, mint: PublicKey, transferHookProgramId: PublicKey, authority: Signer | PublicKey, multiSigners?: Signer[], confirmOptions?: ConfirmOptions, programId?: PublicKey): Promise<TransactionSignature>;
/**
 * Transfer tokens from one account to another, asserting the token mint, and decimals
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction fees
 * @param source         Source account
 * @param mint           Mint for the account
 * @param destination    Destination account
 * @param authority      Authority of the source account
 * @param amount         Number of tokens to transfer
 * @param decimals       Number of decimals in transfer amount
 * @param multiSigners   Signing accounts if `owner` is a multisig
 * @param confirmOptions Options for confirming the transaction
 * @param programId      SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
export declare function transferCheckedWithTransferHook(connection: Connection, payer: Signer, source: PublicKey, mint: PublicKey, destination: PublicKey, authority: Signer | PublicKey, amount: bigint, decimals: number, multiSigners?: Signer[], confirmOptions?: ConfirmOptions, programId?: PublicKey): Promise<TransactionSignature>;
/**
 * Transfer tokens from one account to another, asserting the transfer fee, token mint, and decimals
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction fees
 * @param source         Source account
 * @param mint           Mint for the account
 * @param destination    Destination account
 * @param authority      Authority of the source account
 * @param amount         Number of tokens to transfer
 * @param decimals       Number of decimals in transfer amount
 * @param fee            The calculated fee for the transfer fee extension
 * @param multiSigners   Signing accounts if `owner` is a multisig
 * @param confirmOptions Options for confirming the transaction
 * @param programId      SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
export declare function transferCheckedWithFeeAndTransferHook(connection: Connection, payer: Signer, source: PublicKey, mint: PublicKey, destination: PublicKey, authority: Signer | PublicKey, amount: bigint, decimals: number, fee: bigint, multiSigners?: Signer[], confirmOptions?: ConfirmOptions, programId?: PublicKey): Promise<TransactionSignature>;
//# sourceMappingURL=actions.d.ts.map