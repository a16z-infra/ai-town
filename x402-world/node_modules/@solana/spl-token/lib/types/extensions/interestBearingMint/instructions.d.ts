import type { PublicKey, Signer } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from '../../instructions/types.js';
export declare enum InterestBearingMintInstruction {
    Initialize = 0,
    UpdateRate = 1
}
export interface InterestBearingMintInitializeInstructionData {
    instruction: TokenInstruction.InterestBearingMintExtension;
    interestBearingMintInstruction: InterestBearingMintInstruction.Initialize;
    rateAuthority: PublicKey;
    rate: number;
}
export interface InterestBearingMintUpdateRateInstructionData {
    instruction: TokenInstruction.InterestBearingMintExtension;
    interestBearingMintInstruction: InterestBearingMintInstruction.UpdateRate;
    rate: number;
}
export declare const interestBearingMintInitializeInstructionData: import("@solana/buffer-layout").Structure<InterestBearingMintInitializeInstructionData>;
export declare const interestBearingMintUpdateRateInstructionData: import("@solana/buffer-layout").Structure<InterestBearingMintUpdateRateInstructionData>;
/**
 * Construct an InitializeInterestBearingMint instruction
 *
 * @param mint           Mint to initialize
 * @param rateAuthority  The public key for the account that can update the rate
 * @param rate           The initial interest rate
 * @param programId      SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createInitializeInterestBearingMintInstruction(mint: PublicKey, rateAuthority: PublicKey, rate: number, programId?: PublicKey): TransactionInstruction;
/**
 * Construct an UpdateRateInterestBearingMint instruction
 *
 * @param mint           Mint to initialize
 * @param rateAuthority  The public key for the account that can update the rate
 * @param rate           The updated interest rate
 * @param multiSigners   Signing accounts if `rateAuthority` is a multisig
 * @param programId      SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createUpdateRateInterestBearingMintInstruction(mint: PublicKey, rateAuthority: PublicKey, rate: number, multiSigners?: (Signer | PublicKey)[], programId?: PublicKey): TransactionInstruction;
//# sourceMappingURL=instructions.d.ts.map