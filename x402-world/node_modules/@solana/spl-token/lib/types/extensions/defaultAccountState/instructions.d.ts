import type { PublicKey, Signer } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from '../../instructions/types.js';
import type { AccountState } from '../../state/account.js';
export declare enum DefaultAccountStateInstruction {
    Initialize = 0,
    Update = 1
}
/** TODO: docs */
export interface DefaultAccountStateInstructionData {
    instruction: TokenInstruction.DefaultAccountStateExtension;
    defaultAccountStateInstruction: DefaultAccountStateInstruction;
    accountState: AccountState;
}
/** TODO: docs */
export declare const defaultAccountStateInstructionData: import("@solana/buffer-layout").Structure<DefaultAccountStateInstructionData>;
/**
 * Construct an InitializeDefaultAccountState instruction
 *
 * @param mint         Mint to initialize
 * @param accountState Default account state to set on all new accounts
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createInitializeDefaultAccountStateInstruction(mint: PublicKey, accountState: AccountState, programId?: PublicKey): TransactionInstruction;
/**
 * Construct an UpdateDefaultAccountState instruction
 *
 * @param mint         Mint to update
 * @param accountState    Default account state to set on all accounts
 * @param freezeAuthority       The mint's freeze authority
 * @param signers         The signer account(s) for a multisig
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createUpdateDefaultAccountStateInstruction(mint: PublicKey, accountState: AccountState, freezeAuthority: PublicKey, multiSigners?: (Signer | PublicKey)[], programId?: PublicKey): TransactionInstruction;
//# sourceMappingURL=instructions.d.ts.map