import type { ConfirmOptions, Connection, PublicKey, Signer } from '@solana/web3.js';
import { Keypair } from '@solana/web3.js';
/**
 * Create and initialize a new multisig
 *
 * @param connection     Connection to use
 * @param payer          Payer of the transaction and initialization fees
 * @param signers        Full set of signers
 * @param m              Number of required signatures
 * @param keypair        Optional keypair, defaulting to a new random one
 * @param confirmOptions Options for confirming the transaction
 * @param programId      SPL Token program account
 *
 * @return Address of the new multisig
 */
export declare function createMultisig(connection: Connection, payer: Signer, signers: PublicKey[], m: number, keypair?: Keypair, confirmOptions?: ConfirmOptions, programId?: PublicKey): Promise<PublicKey>;
//# sourceMappingURL=createMultisig.d.ts.map