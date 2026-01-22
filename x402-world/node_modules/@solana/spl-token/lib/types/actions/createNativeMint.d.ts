import type { ConfirmOptions, Connection, Signer } from '@solana/web3.js';
/**
 * Create native mint
 *
 * @param connection               Connection to use
 * @param payer                    Payer of the transaction and initialization fees
 * @param confirmOptions           Options for confirming the transaction
 * @param programId                SPL Token program account
 * @param nativeMint               Native mint id associated with program
 */
export declare function createNativeMint(connection: Connection, payer: Signer, confirmOptions?: ConfirmOptions, nativeMint?: import("@solana/web3.js").PublicKey, programId?: import("@solana/web3.js").PublicKey): Promise<void>;
//# sourceMappingURL=createNativeMint.d.ts.map