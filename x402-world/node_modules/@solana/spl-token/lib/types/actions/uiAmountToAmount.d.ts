import type { Connection, PublicKey, Signer, TransactionError } from '@solana/web3.js';
/**
 * Amount as a string using mint-prescribed decimals
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction fees
 * @param mint           Mint for the account
 * @param amount         Ui Amount of tokens to be converted to Amount
 * @param programId      SPL Token program account
 *
 * @return Ui Amount generated
 */
export declare function uiAmountToAmount(connection: Connection, payer: Signer, mint: PublicKey, amount: string, programId?: PublicKey): Promise<bigint | TransactionError | null>;
//# sourceMappingURL=uiAmountToAmount.d.ts.map