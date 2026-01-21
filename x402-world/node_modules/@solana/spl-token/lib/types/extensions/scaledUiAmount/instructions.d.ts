import { TokenInstruction } from '../../instructions/types.js';
import type { Signer } from '@solana/web3.js';
import { TransactionInstruction, PublicKey } from '@solana/web3.js';
export declare enum ScaledUiAmountInstruction {
    Initialize = 0,
    UpdateMultiplier = 1
}
export interface InitializeScaledUiAmountConfigData {
    instruction: TokenInstruction.ScaledUiAmountExtension;
    scaledUiAmountInstruction: ScaledUiAmountInstruction.Initialize;
    authority: PublicKey | null;
    multiplier: number;
}
export declare const initializeScaledUiAmountConfigInstructionData: import("@solana/buffer-layout").Structure<InitializeScaledUiAmountConfigData>;
/**
 * Construct an InitializeScaledUiAmountConfig instruction
 *
 * @param mint         Token mint account
 * @param authority    Optional authority that can update the multipliers
 * @param signers      The signer account(s)
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createInitializeScaledUiAmountConfigInstruction(mint: PublicKey, authority: PublicKey | null, multiplier: number, programId?: PublicKey): TransactionInstruction;
export interface UpdateMultiplierData {
    instruction: TokenInstruction.ScaledUiAmountExtension;
    scaledUiAmountInstruction: ScaledUiAmountInstruction.UpdateMultiplier;
    multiplier: number;
    effectiveTimestamp: bigint;
}
export declare const updateMultiplierData: import("@solana/buffer-layout").Structure<UpdateMultiplierData>;
/**
 * Construct an UpdateMultiplierData instruction
 *
 * @param mint                  Token mint account
 * @param authority             Optional authority that can update the multipliers
 * @param multiplier            New multiplier
 * @param effectiveTimestamp    Effective time stamp for the new multiplier
 * @param multiSigners          Signing accounts if `owner` is a multisig
 * @param programId             SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createUpdateMultiplierDataInstruction(mint: PublicKey, authority: PublicKey, multiplier: number, effectiveTimestamp: bigint, multiSigners?: (Signer | PublicKey)[], programId?: PublicKey): TransactionInstruction;
//# sourceMappingURL=instructions.d.ts.map