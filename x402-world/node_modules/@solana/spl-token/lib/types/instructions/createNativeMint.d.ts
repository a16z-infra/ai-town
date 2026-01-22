import type { PublicKey } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
export interface CreateNativeMintInstructionData {
    instruction: TokenInstruction.CreateNativeMint;
}
/** TODO: docs */
export declare const createNativeMintInstructionData: import("@solana/buffer-layout").Structure<CreateNativeMintInstructionData>;
/**
 * Construct a CreateNativeMint instruction
 *
 * @param account   New token account
 * @param mint      Mint account
 * @param owner     Owner of the new account
 * @param programId SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createCreateNativeMintInstruction(payer: PublicKey, nativeMintId?: PublicKey, programId?: PublicKey): TransactionInstruction;
//# sourceMappingURL=createNativeMint.d.ts.map