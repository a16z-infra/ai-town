import type { AccountMeta, PublicKey } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
export interface InitializeMint2InstructionData {
    instruction: TokenInstruction.InitializeMint2;
    decimals: number;
    mintAuthority: PublicKey;
    freezeAuthority: PublicKey | null;
}
/** TODO: docs */
export declare const initializeMint2InstructionData: import("@solana/buffer-layout").Structure<InitializeMint2InstructionData>;
/**
 * Construct an InitializeMint2 instruction
 *
 * @param mint            Token mint account
 * @param decimals        Number of decimals in token account amounts
 * @param mintAuthority   Minting authority
 * @param freezeAuthority Optional authority that can freeze token accounts
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createInitializeMint2Instruction(mint: PublicKey, decimals: number, mintAuthority: PublicKey, freezeAuthority: PublicKey | null, programId?: PublicKey): TransactionInstruction;
/** A decoded, valid InitializeMint2 instruction */
export interface DecodedInitializeMint2Instruction {
    programId: PublicKey;
    keys: {
        mint: AccountMeta;
    };
    data: {
        instruction: TokenInstruction.InitializeMint2;
        decimals: number;
        mintAuthority: PublicKey;
        freezeAuthority: PublicKey | null;
    };
}
/**
 * Decode an InitializeMint2 instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export declare function decodeInitializeMint2Instruction(instruction: TransactionInstruction, programId?: PublicKey): DecodedInitializeMint2Instruction;
/** A decoded, non-validated InitializeMint2 instruction */
export interface DecodedInitializeMint2InstructionUnchecked {
    programId: PublicKey;
    keys: {
        mint: AccountMeta | undefined;
    };
    data: {
        instruction: number;
        decimals: number;
        mintAuthority: PublicKey;
        freezeAuthority: PublicKey | null;
    };
}
/**
 * Decode an InitializeMint2 instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export declare function decodeInitializeMint2InstructionUnchecked({ programId, keys: [mint], data, }: TransactionInstruction): DecodedInitializeMint2InstructionUnchecked;
//# sourceMappingURL=initializeMint2.d.ts.map