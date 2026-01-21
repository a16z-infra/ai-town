import type { AccountMeta, PublicKey } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
export interface InitializeMintInstructionData {
    instruction: TokenInstruction.InitializeMint;
    decimals: number;
    mintAuthority: PublicKey;
    freezeAuthority: PublicKey | null;
}
/** TODO: docs */
export declare const initializeMintInstructionData: import("@solana/buffer-layout").Structure<InitializeMintInstructionData>;
/**
 * Construct an InitializeMint instruction
 *
 * @param mint            Token mint account
 * @param decimals        Number of decimals in token account amounts
 * @param mintAuthority   Minting authority
 * @param freezeAuthority Optional authority that can freeze token accounts
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createInitializeMintInstruction(mint: PublicKey, decimals: number, mintAuthority: PublicKey, freezeAuthority: PublicKey | null, programId?: PublicKey): TransactionInstruction;
/** A decoded, valid InitializeMint instruction */
export interface DecodedInitializeMintInstruction {
    programId: PublicKey;
    keys: {
        mint: AccountMeta;
        rent: AccountMeta;
    };
    data: {
        instruction: TokenInstruction.InitializeMint;
        decimals: number;
        mintAuthority: PublicKey;
        freezeAuthority: PublicKey | null;
    };
}
/**
 * Decode an InitializeMint instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export declare function decodeInitializeMintInstruction(instruction: TransactionInstruction, programId?: PublicKey): DecodedInitializeMintInstruction;
/** A decoded, non-validated InitializeMint instruction */
export interface DecodedInitializeMintInstructionUnchecked {
    programId: PublicKey;
    keys: {
        mint: AccountMeta | undefined;
        rent: AccountMeta | undefined;
    };
    data: {
        instruction: number;
        decimals: number;
        mintAuthority: PublicKey;
        freezeAuthority: PublicKey | null;
    };
}
/**
 * Decode an InitializeMint instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export declare function decodeInitializeMintInstructionUnchecked({ programId, keys: [mint, rent], data, }: TransactionInstruction): DecodedInitializeMintInstructionUnchecked;
//# sourceMappingURL=initializeMint.d.ts.map