import type { PublicKey, Signer } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import type { ExtensionType } from '../extensions/extensionType.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
export interface ReallocateInstructionData {
    instruction: TokenInstruction.Reallocate;
    extensionTypes: ExtensionType[];
}
/**
 * Construct a Reallocate instruction
 *
 * @param account        Address of the token account
 * @param payer          Address paying for the reallocation
 * @param extensionTypes Extensions to reallocate for
 * @param owner          Owner of the account
 * @param multiSigners   Signing accounts if `owner` is a multisig
 * @param programId      SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createReallocateInstruction(account: PublicKey, payer: PublicKey, extensionTypes: ExtensionType[], owner: PublicKey, multiSigners?: (Signer | PublicKey)[], programId?: PublicKey): TransactionInstruction;
//# sourceMappingURL=reallocate.d.ts.map