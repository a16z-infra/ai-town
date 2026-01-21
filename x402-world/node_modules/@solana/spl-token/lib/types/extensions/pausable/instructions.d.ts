import type { Signer } from '@solana/web3.js';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from '../../instructions/types.js';
export declare enum PausableInstruction {
    Initialize = 0,
    Pause = 1,
    Resume = 2
}
export interface InitializePausableConfigInstructionData {
    instruction: TokenInstruction.PausableExtension;
    pausableInstruction: PausableInstruction.Initialize;
    authority: PublicKey;
}
export declare const initializePausableConfigInstructionData: import("@solana/buffer-layout").Structure<InitializePausableConfigInstructionData>;
/**
 * Construct a InitializePausableConfig instruction
 *
 * @param mint          Token mint account
 * @param authority     Optional authority that can pause or resume mint
 * @param programId     SPL Token program account
 */
export declare function createInitializePausableConfigInstruction(mint: PublicKey, authority: PublicKey | null, programId?: PublicKey): TransactionInstruction;
export interface PauseInstructionData {
    instruction: TokenInstruction.PausableExtension;
    pausableInstruction: PausableInstruction.Pause;
}
export declare const pauseInstructionData: import("@solana/buffer-layout").Structure<PauseInstructionData>;
/**
 * Construct a Pause instruction
 *
 * @param mint          Token mint account
 * @param authority     The pausable mint's authority
 * @param multiSigners  Signing accounts if authority is a multisig
 * @param programId     SPL Token program account
 */
export declare function createPauseInstruction(mint: PublicKey, authority: PublicKey, multiSigners?: (Signer | PublicKey)[], programId?: PublicKey): TransactionInstruction;
export interface ResumeInstructionData {
    instruction: TokenInstruction.PausableExtension;
    pausableInstruction: PausableInstruction.Resume;
}
export declare const resumeInstructionData: import("@solana/buffer-layout").Structure<ResumeInstructionData>;
/**
 * Construct a Resume instruction
 *
 * @param mint          Token mint account
 * @param authority     The pausable mint's authority
 * @param multiSigners  Signing accounts if authority is a multisig
 * @param programId     SPL Token program account
 */
export declare function createResumeInstruction(mint: PublicKey, authority: PublicKey, multiSigners?: (Signer | PublicKey)[], programId?: PublicKey): TransactionInstruction;
//# sourceMappingURL=instructions.d.ts.map