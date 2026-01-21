import type { ConfirmOptions, Connection, PublicKey, Signer } from '@solana/web3.js';
import { Keypair } from '@solana/web3.js';
/**
 * Initialize an interest bearing account on a mint
 *
 * @param connection      Connection to use
 * @param payer           Payer of the transaction fees
 * @param mintAuthority   Account or multisig that will control minting
 * @param freezeAuthority Optional account or multisig that can freeze token accounts
 * @param rateAuthority   The public key for the account that can update the rate
 * @param rate            The initial interest rate
 * @param decimals        Location of the decimal place
 * @param keypair         Optional keypair, defaulting to a new random one
 * @param confirmOptions  Options for confirming the transaction
 * @param programId       SPL Token program account
 *
 * @return Public key of the mint
 */
export declare function createInterestBearingMint(connection: Connection, payer: Signer, mintAuthority: PublicKey, freezeAuthority: PublicKey, rateAuthority: PublicKey, rate: number, decimals: number, keypair?: Keypair, confirmOptions?: ConfirmOptions, programId?: PublicKey): Promise<PublicKey>;
/**
 * Update the interest rate of an interest bearing account
 *
 * @param connection      Connection to use
 * @param payer           Payer of the transaction fees
 * @param mint            Public key of the mint
 * @param rateAuthority   The public key for the account that can update the rate
 * @param rate            The initial interest rate
 * @param multiSigners    Signing accounts if `owner` is a multisig
 * @param confirmOptions  Options for confirming the transaction
 * @param programId       SPL Token program account
 *
 * @return Signature of the confirmed transaction
 */
export declare function updateRateInterestBearingMint(connection: Connection, payer: Signer, mint: PublicKey, rateAuthority: Signer, rate: number, multiSigners?: Signer[], confirmOptions?: ConfirmOptions, programId?: PublicKey): Promise<string>;
//# sourceMappingURL=actions.d.ts.map